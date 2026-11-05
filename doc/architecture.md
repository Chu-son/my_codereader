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
    lib/                github.ts, githubError.ts, fileUtils.ts, urlParser.ts, searchUtils.ts, navigationHistory.ts
    types/              共通型
    ui/                 ToggleSwitch, ErrorBoundary
```

## データフロー

- **リポジトリ読込**: `loadRepository(input)` → `parseRepoInput` → `fetchRepoInfo` / `fetchRepoTree` / `fetchBranches` → ツリーを `TreeNode[]` に変換 → `addRecentRepo`。
- **ファイルを開く・ジャンプ**: ツリー・検索・ブックマーク・URL からの移動はすべて `navigateTo(path, { line?, pane? })` を通る。現在地（操作中のペインのファイルとカーソル行）を履歴に記録 → 移動先を履歴に積む → ペインのタブに追加してアクティブにする → `line` があれば `jumpTarget` を出す → `ensureFile` で本文を取得（バイナリは除外、取得済み・取得中なら何もしない）。
- **ストアの分担**: `files` スライスは本文のキャッシュ（タブを閉じても破棄しない）。`panes` スライスは 2 ペインのタブ・操作中のペイン・分割・ペインごとの表示状態（`viewState`：スクロール位置とカーソル行）・ジャンプ履歴。履歴の操作は純粋関数 `shared/lib/navigationHistory.ts`。
- **戻る・進む**: 履歴は 1 本（上限 50 件）で、各項目は `{ path, line, pane }`。戻る前に現在地を記録するので、タブ切替で履歴外にいても元の場所へ帰れる。閉じたタブは開き直す。分割を解除した後の pane 2 の項目は pane 1 に表示する。
- **ブランチ切替**: `switchBranch(branch)` → 新しいブランチのツリーを再取得。本文・タブ・履歴は捨て、分割のレイアウトは保つ。リセットは各スライスの `initialXxxState()` を使う。
- **Share Target**: PWA の共有 (`?url=` / `?text=`) → `app/App.tsx` で `github.com/owner/repo` を抽出 → `loadRepository` → `history.replaceState` で URL を整理。
- **検索**: ツリーのファイル名検索、取得済みファイル内の検索、GitHub `/search/code`（PAT 必須）。
- **ブックマーク**: `{ id, repo, branch, path, line, text }`。`navigateTo(path, { line })` で該当行へ移動する。行ジャンプは `jumpTarget`（path / line / pane / timestamp）で、宛先のペインの `CodeViewer` だけが処理する。

## ビルドと配信

- Vite 8 + `@vitejs/plugin-react` + Tailwind v4 (`@tailwindcss/vite`)。`base` は `/my_codereader/`。
- `vite-plugin-pwa`（autoUpdate、standalone、`share_target`）。GitHub API は NetworkFirst（1 時間・200 件）、Google Fonts は CacheFirst。
- GitHub Actions が `main` への push で GitHub Pages へデプロイする。
