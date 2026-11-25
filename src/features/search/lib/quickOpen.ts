import type { DocSymbol } from '@/shared/types';
import { getFileName } from '@/shared/lib/fileUtils';
import { STRINGS } from '@/shared/constants/strings';

export type QuickOpenMode = 'file' | 'symbol' | 'line' | 'text';

const PREFIXES: Record<string, QuickOpenMode> = { '@': 'symbol', ':': 'line', '#': 'text' };

/** 候補を描く数の上限。ファイルは絞り込んで使うので 50 件で足り、仮想スクロールも要らない */
const MAX_FILES = 50;
/** シンボルは接頭辞だけの状態で一覧としても見るので、多めに出す */
const MAX_SYMBOLS = 300;
/** ファイル名に一致したものを、ディレクトリ名だけに一致したものより必ず上に出す */
const FILE_NAME_BONUS = 1000;

export function parseQuery(query: string): { mode: QuickOpenMode; term: string } {
  const mode = PREFIXES[query.charAt(0)];
  return mode ? { mode, term: query.slice(1).trim() } : { mode: 'file', term: query.trim() };
}

const isBoundary = (target: string, at: number) => {
  const prev = target.charAt(at - 1);
  if (/[/._\-\s]/.test(prev)) return true;
  const char = target.charAt(at);
  return /[a-z]/.test(prev) && /[A-Z]/.test(char);
};

/**
 * 文字が順に現れれば一致とし、連続・単語の先頭・部分文字列での一致を高く数える。
 * 一致しなければ null。同点なら短いほうが上に来るよう、長さで僅かに減点する
 */
export function fuzzyScore(query: string, target: string): number | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let matched = 0;
  let score = 0;
  let previous = -2;
  for (let i = 0; i < t.length && matched < q.length; i++) {
    if (t.charAt(i) !== q.charAt(matched)) continue;
    score += 1;
    if (i === previous + 1) score += 4;
    if (i === 0) score += 8;
    else if (isBoundary(target, i)) score += 6;
    previous = i;
    matched++;
  }
  if (matched < q.length) return null;
  const substring = t.indexOf(q);
  if (substring >= 0) score += q.length * 3 + (substring === 0 ? 10 : 0);
  return score - target.length * 0.01;
}

/**
 * 強調表示する文字の位置。部分文字列で一致すればその範囲、そうでなければ fuzzyScore と同じく
 * 前から順に拾った位置。一致しなければ null
 */
export function matchPositions(query: string, target: string): number[] | null {
  const q = query.toLowerCase();
  if (!q) return null;
  const t = target.toLowerCase();
  const substring = t.indexOf(q);
  if (substring >= 0) return Array.from({ length: q.length }, (_, i) => substring + i);
  const positions: number[] = [];
  for (let i = 0; i < t.length && positions.length < q.length; i++) {
    if (t.charAt(i) === q.charAt(positions.length)) positions.push(i);
  }
  return positions.length === q.length ? positions : null;
}

function scorePath(term: string, path: string): number | null {
  // 「/」を含む入力はディレクトリまで指定しているので、パス全体で比べる
  if (!term.includes('/')) {
    const name = fuzzyScore(term, getFileName(path));
    if (name !== null) return name + FILE_NAME_BONUS;
  }
  return fuzzyScore(term, path);
}

function pickBest<T>(items: Iterable<T>, score: (item: T) => number | null, limit: number): T[] {
  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const value = score(item);
    if (value !== null) scored.push({ item, score: value });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}

export function rankPaths(term: string, paths: Iterable<string>): string[] {
  const compact = term.replace(/\s/g, '');
  return pickBest(paths, (path) => scorePath(compact, path), MAX_FILES);
}

export function rankSymbols(term: string, symbols: readonly DocSymbol[]): DocSymbol[] {
  // 入力前はファイルの上から順に見せる（アウトラインと同じ並び）
  if (!term) return symbols.slice(0, MAX_SYMBOLS);
  return pickBest(symbols, (symbol) => fuzzyScore(term, symbol.name), MAX_SYMBOLS);
}

export type QuickOpenAction =
  { kind: 'open'; path: string; line?: number } | { kind: 'search'; text: string };

export interface QuickOpenItem {
  key: string;
  mode: QuickOpenMode;
  title: string;
  detail?: string;
  /** title の中で入力に一致した文字の位置（強調表示に使う） */
  matches?: number[];
  /** どちらかのペインのタブで開いている */
  isOpen?: boolean;
  action: QuickOpenAction;
}

export interface QuickOpenSource {
  /** 開けるファイル（バイナリを除く） */
  paths: Iterable<string>;
  /** 何も入力していないときに見せる、開いているタブ */
  openTabs: readonly string[];
  /** 操作中のペインのファイル。@ と : の対象 */
  activePath: string | null;
  symbols: readonly DocSymbol[];
  /** activePath の行数。未取得なら null（行番号を丸めない） */
  lineCount: number | null;
}

function fileItem(path: string, term: string, openTabs: readonly string[]): QuickOpenItem {
  const title = getFileName(path);
  // ディレクトリ名だけに一致したときは、ファイル名に強調する文字が無い
  const matches = term.includes('/') ? null : matchPositions(term, title);
  return {
    key: path,
    mode: 'file',
    title,
    detail: path,
    ...(matches && { matches }),
    ...(openTabs.includes(path) && { isOpen: true }),
    action: { kind: 'open', path },
  };
}

function lineItems(term: string, source: QuickOpenSource): QuickOpenItem[] {
  const { activePath, lineCount } = source;
  const requested = /^\d+$/.test(term) ? Number(term) : 0;
  if (!activePath || requested < 1) return [];
  const line = lineCount === null ? requested : Math.min(requested, lineCount);
  return [
    {
      key: `line:${line}`,
      mode: 'line',
      title: STRINGS.quickOpen.goToLine(line),
      detail: getFileName(activePath),
      action: { kind: 'open', path: activePath, line },
    },
  ];
}

/** 入力を候補の一覧にする。選んだときの動作はデータで返し、実行は呼び出し側に任せる */
export function buildItems(query: string, source: QuickOpenSource): QuickOpenItem[] {
  const { mode, term } = parseQuery(query);
  switch (mode) {
    case 'file': {
      const compact = term.replace(/\s/g, '');
      return (term ? rankPaths(term, source.paths) : source.openTabs).map((path) =>
        fileItem(path, compact, source.openTabs),
      );
    }
    case 'symbol': {
      const { activePath } = source;
      if (!activePath) return [];
      return rankSymbols(term, source.symbols).map((symbol) => {
        const matches = matchPositions(term, symbol.name);
        return {
          key: `symbol:${symbol.from}`,
          mode,
          title: symbol.name,
          ...(matches && { matches }),
          detail: STRINGS.quickOpen.lineDetail(symbol.line),
          action: { kind: 'open', path: activePath, line: symbol.line },
        };
      });
    }
    case 'line':
      return lineItems(term, source);
    case 'text':
      return term
        ? [
            {
              key: 'text',
              mode,
              title: STRINGS.quickOpen.searchText(term),
              action: { kind: 'search', text: term },
            },
          ]
        : [];
  }
}

/** 候補が無いときの案内。何も入力していない・ファイル未選択など、状況ごとに次の操作を示す */
export function emptyMessage(query: string, activePath: string | null): string | null {
  const { mode, term } = parseQuery(query);
  if (mode === 'file') return term ? STRINGS.quickOpen.noFile : null;
  if (mode === 'text') return STRINGS.quickOpen.textHint;
  if (!activePath) return STRINGS.quickOpen.noActiveFile;
  return mode === 'line' ? STRINGS.quickOpen.lineHint : STRINGS.quickOpen.noSymbol;
}
