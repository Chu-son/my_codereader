import { File, FileCode, FileJson } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  formatFileSize,
  getFileIcon,
  getFileName,
  getLanguageFromPath,
  isBinaryFile,
  isMarkdownFile,
} from './fileUtils';

describe('getLanguageFromPath', () => {
  it.each([
    ['src/index.ts', 'typescript'],
    ['App.TSX', 'typescript'],
    ['main.py', 'python'],
  ])('%s は %s と判定する', (path, language) => {
    expect(getLanguageFromPath(path)).toBe(language);
  });

  it('拡張子が無い、または未知の場合は null を返す', () => {
    expect(getLanguageFromPath('Makefile')).toBeNull();
    expect(getLanguageFromPath('data.unknownext')).toBeNull();
  });
});

describe('isMarkdownFile', () => {
  it('md と mdx を Markdown として扱う', () => {
    expect(isMarkdownFile('README.md')).toBe(true);
    expect(isMarkdownFile('docs/page.MDX')).toBe(true);
    expect(isMarkdownFile('main.ts')).toBe(false);
  });
});

describe('isBinaryFile', () => {
  it('画像などをバイナリと判定する', () => {
    expect(isBinaryFile('logo.PNG')).toBe(true);
    expect(isBinaryFile('movie.mp4')).toBe(true);
  });

  it('テキストと拡張子なしはバイナリではない', () => {
    expect(isBinaryFile('main.ts')).toBe(false);
    expect(isBinaryFile('Makefile')).toBe(false);
  });
});

describe('getFileIcon', () => {
  it('拡張子に応じたアイコンを返す', () => {
    expect(getFileIcon('src/main.ts')).toBe(FileCode);
    expect(getFileIcon('data.json')).toBe(FileJson);
  });

  it('未知の拡張子と拡張子なしは汎用アイコンを返す', () => {
    expect(getFileIcon('file.unknownext')).toBe(File);
    expect(getFileIcon('NOTES')).toBe(File);
  });
});

describe('formatFileSize', () => {
  it.each([
    [0, '0 B'],
    [1023, '1023 B'],
    [1024, '1.0 KB'],
    [1536, '1.5 KB'],
    [1024 * 1024, '1.0 MB'],
  ])('%d バイトは %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});

describe('getFileName', () => {
  it('パスの末尾を返す', () => {
    expect(getFileName('src/lib/a.ts')).toBe('a.ts');
    expect(getFileName('a.ts')).toBe('a.ts');
  });
});
