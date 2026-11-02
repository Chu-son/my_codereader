import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { go } from '@codemirror/lang-go';
import { rust } from '@codemirror/lang-rust';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { markdown } from '@codemirror/lang-markdown';

const LANGUAGE_FACTORIES: Record<string, () => ReturnType<typeof javascript>> = {
  javascript: () => javascript({ jsx: true, typescript: false }),
  typescript: () => javascript({ jsx: true, typescript: true }),
  python: () => python(),
  java: () => java(),
  cpp: () => cpp(),
  go: () => go(),
  rust: () => rust(),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  yaml: () => yaml(),
  markdown: () => markdown(),
};

/** 言語名から CodeMirror の言語拡張を返す。未対応の言語は空配列 */
export function getLanguageExtension(lang: string | null) {
  const factory = lang ? LANGUAGE_FACTORIES[lang] : undefined;
  return factory ? [factory()] : [];
}
