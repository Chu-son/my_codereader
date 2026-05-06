// ========================================
// File Utilities
// ========================================

import {
  FileText,
  FileCode,
  FileJson,
  File,
  FileImage,
  Braces,
  Cog,
  BookOpen,
  Terminal,
  Database,
  Archive,
  Film,
  Music,
  Globe,
  Palette,
  Box,
  Binary,
  type LucideIcon,
} from 'lucide-react';

/** 拡張子→CodeMirror言語マッピング */
export function getLanguageFromPath(filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return null;

  const langMap: Record<string, string> = {
    // JavaScript / TypeScript
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    mts: 'typescript',
    cts: 'typescript',

    // Python
    py: 'python',
    pyi: 'python',
    pyw: 'python',

    // Go
    go: 'go',

    // Rust
    rs: 'rust',

    // Java
    java: 'java',

    // C / C++
    c: 'cpp',
    h: 'cpp',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    hh: 'cpp',
    hxx: 'cpp',

    // HTML
    html: 'html',
    htm: 'html',
    svg: 'html',

    // CSS
    css: 'css',
    scss: 'css',
    less: 'css',

    // JSON
    json: 'json',

    // YAML
    yaml: 'yaml',
    yml: 'yaml',

    // Markdown
    md: 'markdown',
    mdx: 'markdown',

    // Shell
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',

    // Config files
    toml: 'toml',
    ini: 'ini',
    cfg: 'ini',
    conf: 'ini',
  };

  return langMap[ext] ?? null;
}

/** ファイルがMarkdownかどうか判定 */
export function isMarkdownFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext === 'md' || ext === 'mdx';
}

/** ファイルがバイナリかどうか判定（拡張子ベース） */
export function isBinaryFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return false;

  const binaryExts = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'avif',
    'mp4', 'webm', 'avi', 'mov',
    'mp3', 'wav', 'ogg', 'flac',
    'pdf', 'zip', 'tar', 'gz', 'bz2', '7z', 'rar',
    'woff', 'woff2', 'ttf', 'otf', 'eot',
    'exe', 'dll', 'so', 'dylib',
    'pyc', 'class', 'o', 'obj',
  ]);

  return binaryExts.has(ext);
}

/** ファイルパスからアイコンコンポーネントを取得 */
export function getFileIcon(filePath: string): LucideIcon {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const name = filePath.split('/').pop()?.toLowerCase() ?? '';

  // 特定のファイル名
  if (name === 'package.json' || name === 'tsconfig.json') return FileJson;
  if (name === 'readme.md' || name === 'readme') return BookOpen;
  if (name.startsWith('.') || name.includes('config')) return Cog;
  if (name === 'makefile' || name === 'dockerfile') return Terminal;
  if (name.includes('license')) return BookOpen;
  if (name === 'package.json' || name === 'package-lock.json') return Box;

  if (!ext) return File;

  const iconMap: Record<string, LucideIcon> = {
    // Code
    js: FileCode,
    jsx: FileCode,
    ts: FileCode,
    tsx: FileCode,
    py: FileCode,
    go: FileCode,
    rs: FileCode,
    java: FileCode,
    c: FileCode,
    cpp: FileCode,
    h: FileCode,
    hpp: FileCode,

    // Data
    json: FileJson,
    yaml: Braces,
    yml: Braces,
    toml: Braces,
    sql: Database,
    db: Database,
    sqlite: Database,

    // Text / Doc
    md: BookOpen,
    mdx: BookOpen,
    txt: FileText,
    csv: FileText,

    // Web
    html: Globe,
    css: Palette,
    scss: Palette,
    less: Palette,

    // Image
    png: FileImage,
    jpg: FileImage,
    jpeg: FileImage,
    gif: FileImage,
    svg: FileImage,
    webp: FileImage,

    // Media
    mp4: Film,
    mov: Film,
    webm: Film,
    mp3: Music,
    wav: Music,
    flac: Music,

    // Shell
    sh: Terminal,
    bash: Terminal,
    zsh: Terminal,

    // Archive
    zip: Archive,
    tar: Archive,
    gz: Archive,
    '7z': Archive,

    // Binary
    exe: Binary,
    dll: Binary,
    bin: Binary,
  };

  return iconMap[ext] ?? File;
}

/** ファイルサイズを人間が読みやすい形式に変換 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** ファイル名を取得 */
export function getFileName(path: string): string {
  return path.split('/').pop() ?? path;
}
