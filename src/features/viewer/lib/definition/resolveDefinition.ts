import { Text } from '@codemirror/state';
import type { DocSymbol } from '@/shared/types';
import { getLanguageFromPath } from '@/shared/lib/fileUtils';
import { extractSymbols, findDefinition } from '../symbols';
import { DEFAULT, NAMESPACE, extractModuleLinks, type ModuleLinks } from './moduleLinks';
import { resolveImportPath } from './resolvePath';

export interface DefinitionLocation {
  path: string;
  line: number;
}

/** 単語の定義がどこにあるか。別ファイルの定義は、行を知るのに取得が要るので場所の手がかりだけ持つ */
export type DefinitionTarget =
  /** 同じファイルの宣言。isSelf はタップした単語がその宣言そのもの */
  | { kind: 'local'; symbol: DocSymbol; isSelf: boolean }
  /** 相対 import で、リポジトリ内のファイルまで分かったもの */
  | { kind: 'import'; path: string; imported: string }
  /** パッケージやエイリアスからの import（たどらない） */
  | { kind: 'external'; source: string }
  | { kind: 'none' };

export interface Word {
  text: string;
  from: number;
}

interface ResolveContext {
  paths: ReadonlySet<string>;
  /** 本文を取得して返す。取得できなければ null */
  load: (path: string) => Promise<string | null>;
}

/** `export *` が連なるバレルを総当たりしても API を使いすぎないよう、1 回でたどるファイル数を抑える */
const MAX_FILES = 6;

/** ファイルをまたいでたどるのは、import を構文木から読める JS/TS だけ */
const isModuleLanguage = (path: string) => {
  const language = getLanguageFromPath(path);
  return language === 'javascript' || language === 'typescript';
};

interface ParsedModule {
  symbols: DocSymbol[];
  links: ModuleLinks;
}

/** 解析結果を覚えておくファイル数。同じファイルの中でタップを繰り返しても解析し直さないため */
const PARSE_CACHE_SIZE = 20;
const parseCache = new Map<string, { content: string; parsed: ParsedModule }>();

async function parseWithLezer(path: string, content: string): Promise<ParsedModule> {
  const { jsxLanguage, typescriptLanguage, tsxLanguage } =
    await import('@codemirror/lang-javascript');
  const language = getLanguageFromPath(path);
  // エディタと同じく、JSX は .tsx と JavaScript だけで有効にする（languageExtension.ts を参照）
  const parser = /\.tsx$/i.test(path)
    ? tsxLanguage.parser
    : language === 'typescript'
      ? typescriptLanguage.parser
      : jsxLanguage.parser;
  const doc = Text.of(content.split(/\r\n?|\n/));
  const tree = parser.parse(doc.toString());
  return { symbols: extractSymbols(tree, doc, language), links: extractModuleLinks(tree, doc) };
}

/**
 * 表示中でないファイルも解析できるよう、エディタを介さずに構文木を作る（解析器は使うときだけ読み込む）。
 * 解析器を読み込めない（オフラインなど）ときは null で、同じファイルの宣言だけで答える
 */
async function parseModule(path: string, content: string): Promise<ParsedModule | null> {
  if (!isModuleLanguage(path)) return null;
  const cached = parseCache.get(path);
  if (cached?.content === content) return cached.parsed;
  try {
    const parsed = await parseWithLezer(path, content);
    parseCache.delete(path);
    parseCache.set(path, { content, parsed });
    const oldest = parseCache.keys().next().value;
    if (parseCache.size > PARSE_CACHE_SIZE && oldest !== undefined) parseCache.delete(oldest);
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 同じファイルの宣言だけで答えが決まるなら返す。決まらなければ null（import を見る必要がある）。
 * トップレベルの宣言は import と同名になり得ないので確定、入れ子の宣言は import のほうを優先する。
 */
export function findLocalTarget(
  path: string,
  symbols: readonly DocSymbol[],
  word: Word,
): DefinitionTarget | null {
  const symbol = findDefinition(symbols, word.text, word.from);
  const local = symbol && { kind: 'local' as const, symbol, isSelf: symbol.from === word.from };
  if (local && symbol.depth === 0) return local;
  if (!isModuleLanguage(path)) return local ?? { kind: 'none' };
  return null;
}

/** 単語の定義の場所を探す。別ファイルなら、そのファイルのパスまで（本文はまだ取得しない） */
export async function findDefinitionTarget(
  path: string,
  content: string,
  symbols: readonly DocSymbol[],
  word: Word,
  paths: ReadonlySet<string>,
): Promise<DefinitionTarget> {
  const decided = findLocalTarget(path, symbols, word);
  if (decided) return decided;

  const symbol = findDefinition(symbols, word.text, word.from);
  const local: DefinitionTarget = symbol
    ? { kind: 'local', symbol, isSelf: symbol.from === word.from }
    : { kind: 'none' };
  const parsed = await parseModule(path, content);
  const binding = parsed?.links.imports.find((b) => b.local === word.text);
  if (!binding) return local;

  const target = resolveImportPath(path, binding.source, paths);
  if (!target) return local.kind === 'local' ? local : { kind: 'external', source: binding.source };
  return { kind: 'import', path: target, imported: binding.imported };
}

/** 取り出した名前をファイルの中で探す。export の別名・import・再 export をたどる */
async function locate(
  path: string,
  name: string,
  ctx: ResolveContext,
  visited: { names: Set<string>; files: Set<string> },
): Promise<DefinitionLocation | null> {
  const key = `${path}#${name}`;
  if (visited.names.has(key)) return null;
  if (!visited.files.has(path) && visited.files.size >= MAX_FILES) return null;
  visited.names.add(key);
  visited.files.add(path);

  const content = await ctx.load(path);
  if (content === null) return null;
  if (name === NAMESPACE) return { path, line: 1 };
  const parsed = await parseModule(path, content);
  // JSON や CSS など解析しないファイルは、ファイルの先頭を定義とみなす
  if (!parsed) return { path, line: 1 };
  const { symbols, links } = parsed;

  const follow = async (source: string, imported: string) => {
    const next = resolveImportPath(path, source, ctx.paths);
    if (!next) return null;
    return imported === NAMESPACE ? { path: next, line: 1 } : locate(next, imported, ctx, visited);
  };

  const local =
    links.aliases.find((a) => a.exported === name)?.local ?? (name === DEFAULT ? null : name);
  if (local) {
    const symbol = symbols.find((s) => s.depth === 0 && s.name === local);
    if (symbol) return { path, line: symbol.line };
    const binding = links.imports.find((b) => b.local === local);
    const found = binding && (await follow(binding.source, binding.imported));
    if (found) return found;
  }
  if (name === DEFAULT && links.defaultLine !== null) return { path, line: links.defaultLine };

  for (const re of links.reexports.filter((r) => r.exported === name)) {
    const found = await follow(re.source, re.imported);
    if (found) return found;
  }
  // `export *` は default を引き継がない
  if (name === DEFAULT) return null;
  for (const re of links.reexports.filter((r) => r.exported === NAMESPACE)) {
    const found = await follow(re.source, name);
    if (found) return found;
  }
  return null;
}

/**
 * 定義の行を確定する。別ファイルの定義は取得してから探し、見つからなければファイルの先頭
 * （ファイルまでは分かっているので、何も起きないよりは開いたほうが読み進められる）。
 */
export async function locateDefinition(
  fromPath: string,
  target: DefinitionTarget,
  ctx: ResolveContext,
): Promise<DefinitionLocation | null> {
  switch (target.kind) {
    case 'local':
      return { path: fromPath, line: target.symbol.line };
    case 'import':
      return (
        (await locate(target.path, target.imported, ctx, {
          names: new Set(),
          files: new Set(),
        })) ?? {
          path: target.path,
          line: 1,
        }
      );
    default:
      return null;
  }
}
