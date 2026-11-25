/** 拡張子を省いた import に補う候補。型定義だけのモジュールも定義を持つので .d.ts を含める */
const EXTENSIONS = ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'];
/** TS の ESM では `./foo.js` と書いて foo.ts を指す慣習がある */
const JS_TO_TS: Record<string, string[]> = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};

/** `a/b/../c/./d` を `a/c/d` にする。リポジトリの外へ出るなら null */
function normalize(path: string): string | null {
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (parts.length === 0) return null;
      parts.pop();
    } else parts.push(part);
  }
  return parts.join('/');
}

const isRelativeImport = (source: string) =>
  source === '.' || source.startsWith('./') || source.startsWith('../') || source === '..';

/**
 * 相対 import をリポジトリ内のファイルのパスにする。拡張子と index の補完はツリーにあるかで判定し、
 * 候補を探すために API を呼ばない。エイリアス（`@/…`）とパッケージは扱わず null を返す
 */
export function resolveImportPath(
  fromPath: string,
  source: string,
  paths: ReadonlySet<string>,
): string | null {
  if (!isRelativeImport(source)) return null;
  const dir = fromPath.includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/')) : '';
  const base = normalize(`${dir}/${source}`);
  if (base === null) return null;

  const ext = /\.[cm]?jsx?$/.exec(base)?.[0];
  const candidates = [
    base,
    ...(ext ? (JS_TO_TS[ext] ?? []).map((to) => base.slice(0, -ext.length) + to) : []),
    ...EXTENSIONS.map((e) => base + e),
    ...EXTENSIONS.map((e) => `${base ? `${base}/` : ''}index${e}`),
  ];
  return candidates.find((c) => paths.has(c)) ?? null;
}
