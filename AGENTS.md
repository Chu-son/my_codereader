# AGENTS.md

GitHub CodeReader は、GitHub の公開リポジトリを iPad で快適に読むための PWA です（React 19 / TypeScript / Vite / Zustand / CodeMirror 6 / Tailwind v4）。

> **重要**: `doc/` の規約は「目標状態」です。実装が未追従の箇所は [doc/migration.md](doc/migration.md) に一覧があります。新規コードは必ず規約に従い、既存コードを触るときは規約側に寄せてください。

## コマンド

| 目的 | コマンド |
| --- | --- |
| 開発サーバー | `npm run dev` （URL は `/my_codereader/` 配下） |
| Lint | `npm run lint` |
| 型チェック | `npm run typecheck` |
| テスト | `npm run test` |
| 整形 | `npm run format` （CI は `format:check`） |
| 型チェック + ビルド | `npm run build` （`tsc -b && vite build`） |
| ビルド確認 | `npm run preview` |

変更を完了とする前に `npm run format:check`・`npm run lint`・`npm run typecheck`・`npm run test`・`npm run build` を必ず通すこと（CI と同じ内容）。

## ディレクトリ

```
src/
  App.tsx, main.tsx   エントリ
  components/         UI コンポーネント（目標: features/ へ移行）
  stores/             Zustand ストア（目標: スライス分割）
  lib/                GitHub API・純粋関数
  types/              型定義
doc/                  設計・規約（目次: doc/README.md）
```

目標構成は [doc/architecture.md](doc/architecture.md) を参照。

## 規約（要約）

詳細は `doc/conventions/` を参照。

- TypeScript は strict。`any` と型アサーションは原則禁止。型のみの import は `import type`。
- import は `@/` エイリアス。コメントと UI 文言は日本語、識別子は英語。「なぜ」をコメントに書く。
- ストアはセレクタで購読する。永続化は `partialize` のホワイトリストのみ。
- 副作用（fetch / storage）は `lib` 層に置き、コンポーネントから直接呼ばない。
- 色は CSS 変数のみ。タップ領域は 44px 以上。アイコンボタンには `aria-label`。
- コミットは Conventional Commits（`feat:` `fix:` など）+ 日本語件名。`main` への直接 push は禁止、PR 経由。

## 禁止事項

- PAT（Personal Access Token）をログ・URL・エラーメッセージに出力する。
- ストア全体の購読（`useAppStore()` の引数なし呼び出し）。
- ファイル本文・ツリー・検索結果の永続化。
- 理由の無い依存追加、未使用依存の放置。
- ドキュメントと食い違う変更（変更したら同じ PR でドキュメントも更新する）。

## 注意

- `main` への push は GitHub Pages へ自動デプロイされる。`vite.config.ts` の `base: '/my_codereader/'` を変更しないこと。
- GitHub API は未認証で 60 回/時。コード検索（`/search/code`）は PAT 必須。詳細は [doc/github-api.md](doc/github-api.md)。
- `.antigravitycli/` はツールのメタデータであり、コミットしない。
