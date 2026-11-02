# アーキテクチャ

目標構成は [conventions/architecture.md](conventions/architecture.md) を参照。ここでは現状の構成とデータフローを記録し、目標との差分は [migration.md](migration.md) で管理する。

## 現状の構成

```
src/
  main.tsx            StrictMode のルート
  App.tsx             レイアウト、Share Target の処理、起動時の clearRepo()
  index.css           Catppuccin Mocha の CSS 変数、共通スタイル
  components/
    Header            リポジトリ入力・読込・設定/検索ボタン
    Sidebar           FileTree / OpenEditors / BookmarksList を収容
    FileTree          再帰ツリー、ファイルアイコン
    OpenEditors       開いているファイル一覧
    FileTabs          タブバー
    BranchSelector    ブランチ切替
    SplitPane         分割表示（allotment、縦/横）
    CodeViewer        CodeMirror、言語判定、インデントガイド、ブックマーク、行ジャンプ
    MarkdownPreview   react-markdown + GFM + highlight
    SearchDrawer      ファイル名・キャッシュ内・GitHub コード検索（vaul）
    SettingsDialog    PAT、折り返し、インデントガイド、フォントサイズ、行間
    BookmarksList     ブックマーク一覧
    RecentRepos       起動直後の「最近開いたリポジトリ」
    PwaInstallPrompt  インストール案内
  stores/useAppStore.ts   単一の Zustand ストア（persist 付き）
  lib/
    github.ts         GitHub REST クライアント
    fileUtils.ts      拡張子→言語、バイナリ判定、アイコン、サイズ整形
    urlParser.ts      owner/repo・GitHub URL の解析
    searchUtils.ts    ツリー検索、キャッシュ内検索、検索結果の変換
    indentGuide.ts    CodeMirror 拡張（インデントガイド）
  types/index.ts      共通型
```

## データフロー

- **リポジトリ読込**: `loadRepository(input)` → `parseRepoInput` → `fetchRepoInfo` / `fetchRepoTree` / `fetchBranches` → ツリーを `TreeNode[]` に変換 → `addRecentRepo`。
- **ファイルを開く**: `openFile(path, pane)` → `fetchFileContent`（バイナリは除外）→ `openedFiles` に追加 → ペインのアクティブファイルを更新 → ナビゲーション履歴に追加。
- **ブランチ切替**: `switchBranch(branch)` → 新しいブランチのツリーを再取得。
- **Share Target**: PWA の共有 (`?url=` / `?text=`) → `App.tsx` で `github.com/owner/repo` を抽出 → `loadRepository` → `history.replaceState` で URL を整理。
- **検索**: ツリーのファイル名検索、取得済みファイル内の検索、GitHub `/search/code`（PAT 必須）。
- **ブックマーク**: `{ id, repo, branch, path, line, text }`。`jumpTarget`（path / line / timestamp）で該当行へ移動する。

## ビルドと配信

- Vite 8 + `@vitejs/plugin-react` + Tailwind v4 (`@tailwindcss/vite`)。`base` は `/my_codereader/`。
- `vite-plugin-pwa`（autoUpdate、standalone、`share_target`）。GitHub API は NetworkFirst（1 時間・200 件）、Google Fonts は CacheFirst。
- GitHub Actions が `main` への push で GitHub Pages へデプロイする。
