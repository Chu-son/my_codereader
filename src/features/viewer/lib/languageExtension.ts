import type { Extension } from '@codemirror/state';

/** 言語パックは使われたときだけ読み込む（初期バンドルに含めない） */
const LANGUAGE_LOADERS: Record<string, () => Promise<Extension>> = {
  javascript: async () =>
    (await import('@codemirror/lang-javascript')).javascript({ jsx: true, typescript: false }),
  typescript: async () =>
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

/** 言語名から CodeMirror の言語拡張を読み込む。未対応の言語は空配列 */
export async function loadLanguageExtension(lang: string | null): Promise<Extension[]> {
  const loader = lang ? LANGUAGE_LOADERS[lang] : undefined;
  return loader ? [await loader()] : [];
}
