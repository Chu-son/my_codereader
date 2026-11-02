# 状態と永続化

規約は [conventions/state.md](conventions/state.md)。

## 状態の分類（目標）

| 分類 | 項目 | 永続化 |
| --- | --- | --- |
| ユーザー設定 | `pat`, `wordWrap`, `showIndentGuides`, `fontSize`(6〜24, 既定 14), `lineHeight`(1.0〜3.0, 既定 1.5) | する |
| ユーザーデータ | `bookmarks`, `recentRepos`（最新 20 件・重複排除） | する |
| サーバー由来 | `treeData`, `branches`, `openedFiles`（本文を含む）, `searchResults` | しない |
| 一時 UI 状態 | `expandedDirs`, `isSplitView`, `splitDirection`, `sidebarOpen`, `searchDrawerOpen`, `settingsOpen`, `navigationHistory`, `jumpTarget`, `activeCursorLines` | しない |

## localStorage / sessionStorage

| キー | 内容 | 備考 |
| --- | --- | --- |
| `codereader:app` | Zustand の persist（version 1。許可リストのみ保存） | 旧キー `codereader-storage` は読み込み後の最初の保存で削除 |
| `codereader:pwa-prompt-dismissed` | インストール案内を閉じたか | |

PAT の保存先の方針は [conventions/security.md](conventions/security.md)。

## 永続化の移行方針

1. `persist` に `partialize` / `version` / `migrate` を設定する。
2. `migrate` で旧キー `codereader-storage` のデータから、許可リストの項目だけを取り出して新形式に変換する。
3. 移行後に旧キーを削除する。
4. 旧データの読み込みと移行結果を、テストで検証する。
