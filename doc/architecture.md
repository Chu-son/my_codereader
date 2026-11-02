# アーキテクチャ

規約は [conventions/architecture.md](conventions/architecture.md)。ここでは構成とデータフローを記録する。

## 構成

```
src/
  main.tsx              StrictMode と最上位の Error Boundary
  index.css             Catppuccin Mocha の CSS 変数、共通スタイル
  app/
    App.tsx             レイアウト、Share Target の処理
    components/Header   ナビゲーションと各トグルボタン
  features/
    repository/         RepoSwitcher（入力・表示）、BranchSelector、RecentRepos
    explorer/           Sidebar、FileTree
    viewer/             SplitPane、CodeViewer、FileTabs、OpenEditors、MarkdownPreview
                        hooks/（スクロール復元・行ジャンプ）、lib/（言語拡張・インデントガイド）
    search/             SearchDrawer（ファイル名・キャッシュ内・GitHub コード検索）
    bookmarks/          BookmarksList、BookmarkToggleButton
    settings/           SettingsDialog（エディタ設定・PAT・レート制限の各セクション）
    pwa/                PwaInstallPrompt
  stores/               単一の Zustand ストア。slices/ にスライス、persistence.ts に永続化
  shared/
    lib/                github.ts, githubError.ts, fileUtils.ts, urlParser.ts, searchUtils.ts
    types/              共通型
    ui/                 ToggleSwitch, ErrorBoundary
```

## データフロー

- **リポジトリ読込**: `loadRepository(input)` → `parseRepoInput` → `fetchRepoInfo` / `fetchRepoTree` / `fetchBranches` → ツリーを `TreeNode[]` に変換 → `addRecentRepo`。
- **ファイルを開く**: `openFile(path, pane)` → `fetchFileContent`（バイナリは除外）→ `openedFiles` に追加 → ペインのアクティブファイルを更新 → ナビゲーション履歴に追加。
- **ブランチ切替**: `switchBranch(branch)` → 新しいブランチのツリーを再取得。
- **Share Target**: PWA の共有 (`?url=` / `?text=`) → `app/App.tsx` で `github.com/owner/repo` を抽出 → `loadRepository` → `history.replaceState` で URL を整理。
- **検索**: ツリーのファイル名検索、取得済みファイル内の検索、GitHub `/search/code`（PAT 必須）。
- **ブックマーク**: `{ id, repo, branch, path, line, text }`。`jumpTarget`（path / line / timestamp）で該当行へ移動する。

## ビルドと配信

- Vite 8 + `@vitejs/plugin-react` + Tailwind v4 (`@tailwindcss/vite`)。`base` は `/my_codereader/`。
- `vite-plugin-pwa`（autoUpdate、standalone、`share_target`）。GitHub API は NetworkFirst（1 時間・200 件）、Google Fonts は CacheFirst。
- GitHub Actions が `main` への push で GitHub Pages へデプロイする。
