import type { CodeSearchItem } from '@/shared/lib/github';
import { escapeRegExp } from '@/shared/lib/searchUtils';

export interface CodeCandidate {
  path: string;
  /** 単語を含む行の抜粋。検索が抜粋を返さなければ空 */
  text: string;
  /** 抜粋が単語の宣言に見える */
  isDefinition: boolean;
}

const wordPattern = (word: string) => `${escapeRegExp(word)}(?![\\w$])`;

/**
 * 言語を問わず宣言らしい行を見分ける。候補のファイルは解析器のない言語も含み、
 * 抜粋は構文木を作れない断片なので、キーワードで判定する（Go のメソッドの受け手も許す）
 */
const declarationRegExp = (word: string) =>
  new RegExp(
    `(?<![\\w$])(?:function\\*?|class|interface|type|enum|struct|trait|def|fn|func(?:\\s*\\([^)]*\\))?|const|let|var|val|module|namespace)\\s+${wordPattern(word)}`,
  );

/**
 * 検索結果を候補にする。検索は既定ブランチの索引なので、いま見ているブランチのツリーに無いファイルは
 * 開けないため除き、宣言らしいものを先頭へ寄せる
 */
export function toCodeCandidates(
  items: readonly CodeSearchItem[],
  word: string,
  paths: ReadonlySet<string>,
): CodeCandidate[] {
  const declaration = declarationRegExp(word);
  const occurrence = new RegExp(`(?<![\\w$])${wordPattern(word)}`);
  const candidates = items
    .filter((item) => paths.has(item.path))
    .map((item) => {
      const lines = (item.text_matches ?? []).flatMap((m) => m.fragment.split('\n'));
      const declared = lines.find((line) => declaration.test(line));
      const text = declared ?? lines.find((line) => occurrence.test(line)) ?? '';
      return { path: item.path, text: text.trim(), isDefinition: declared !== undefined };
    });
  return [
    ...candidates.filter((c) => c.isDefinition),
    ...candidates.filter((c) => !c.isDefinition),
  ];
}

/**
 * 候補のファイルで開く行。検索は行番号を返さず、表示中のブランチとも本文が違い得るので、
 * 取得した本文から探す。宣言があればそこ、無ければ最初の出現、どちらも無ければ先頭
 */
export function findCandidateLine(content: string, word: string): number {
  const lines = content.split('\n');
  const declaration = declarationRegExp(word);
  const occurrence = new RegExp(`(?<![\\w$])${wordPattern(word)}`);
  const index = lines.findIndex((line) => declaration.test(line));
  return (index >= 0 ? index : lines.findIndex((line) => occurrence.test(line))) + 1 || 1;
}
