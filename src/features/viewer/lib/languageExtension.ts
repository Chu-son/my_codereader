import type { Extension } from '@codemirror/state';

/** 言語パックは使われたときだけ読み込む（初期バンドルに含めない） */
const LANGUAGE_LOADERS: Record<string, () => Promise<Extension>> = {
  javascript: async () =>
    (await import('@codemirror/lang-javascript')).javascript({ jsx: true, typescript: false }),
  // .ts を JSX 込みで解析すると `<T>(x: T) => x` が JSX の開始タグと読まれ、以降の構文木が崩れる
  // （ハイライトとシンボル抽出が途中で切れる）。JSX は .tsx だけで有効にする
  typescript: async () =>
    (await import('@codemirror/lang-javascript')).javascript({ jsx: false, typescript: true }),
  tsx: async () =>
    (await import('@codemirror/lang-javascript')).javascript({ jsx: true, typescript: true }),
  python: async () => (await import('@codemirror/lang-python')).python(),
  java: async () => (await import('@codemirror/lang-java')).java(),
  cpp: async () => (await import('@codemirror/lang-cpp')).cpp(),
  go: async () => (await import('@codemirror/lang-go')).go(),
  rust: async () => (await import('@codemirror/lang-rust')).rust(),
  html: async () => (await import('@codemirror/lang-html')).html(),
  css: async () => (await import('@codemirror/lang-css')).css(),
  json: async () => (await import('@codemirror/lang-json')).json(),
  yaml: async () => (await import('@codemirror/lang-yaml')).yaml(),
  markdown: async () => (await import('@codemirror/lang-markdown')).markdown(),
};

/**
 * 言語拡張を選ぶ鍵。基本は言語名で、TypeScript だけは拡張子で JSX の有無を分ける。
 * JavaScript は .js に JSX を書く慣習があり、`<T>` の総称型も無いので常に JSX を有効にしておく
 */
export function languageKey(lang: string | null, path: string): string | null {
  return lang === 'typescript' && /\.tsx$/i.test(path) ? 'tsx' : lang;
}

/** 言語拡張の鍵（languageKey）から CodeMirror の言語拡張を読み込む。未対応の言語は空配列 */
export async function loadLanguageExtension(key: string | null): Promise<Extension[]> {
  const loader = key ? LANGUAGE_LOADERS[key] : undefined;
  return loader ? [await loader()] : [];
}
