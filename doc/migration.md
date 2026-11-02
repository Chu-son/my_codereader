# 実装の是正計画（現状と規約の差分）

`doc/` の規約は目標状態です。この文書は、現状の実装との差分と是正の順序を管理します。各項目は独立した PR で、リスクの低い順に進めます。完了したらチェックを付け、全項目の完了後にこの文書を削除します。

## 1. 基盤

- [x] Prettier を導入し、`.prettierrc` と `format` / `format:check` スクリプトを追加する
- [x] ESLint に `eslint-config-prettier` と `no-console` を追加する（`no-explicit-any` は recommended に含まれる）
- [ ] ESLint に import 順序の規則を追加する
- [x] `tsconfig.app.json` に `strict` と `noUncheckedIndexedAccess` を追加し、発生した型エラーを修正する（`strict` は従来未設定だった）
- [x] `.nvmrc`（22）を追加し、`deploy.yml` が参照するようにする
- [x] `.gitignore` に `.antigravitycli/` を追加する
- [x] 未使用の `react-router-dom` を削除する
- [x] テンプレート残骸の `src/assets/hero.png`、`vite.svg` を削除する
- [ ] **lint の既存エラー 9 件を解消する**（`react-hooks` のルール違反。`BookmarksList` / `FileTree` / `PwaInstallPrompt` / `SearchDrawer` / `SettingsDialog` / `CodeViewer`、および `useAppStore.ts` の `as any`）。解消後、PR の CI で lint を必須にする

## 2. CI

- [ ] PR 用 `ci.yml`（lint / 型チェック / test / build / audit）を追加する
- [ ] `deploy.yml` は `main` のみのままにする
- [ ] `main` のブランチ保護を設定する（リポジトリ設定。手動作業）

## 3. テスト基盤

- [ ] Vitest / Testing Library / MSW を導入し、`npm run test` を追加する
- [ ] `urlParser`、`searchUtils`、`fileUtils` のテストを追加する

## 4. 不具合修正（優先度高）

- [ ] [useAppStore.ts:573](../src/stores/useAppStore.ts#L573) の `partialState` + `as any` を `partialize` に修正する。現状は永続化の絞り込みが効かず、状態全体（ツリー、ファイル本文、検索結果）が保存されている可能性が高い
- [ ] `version` / `migrate` を設定し、旧 `codereader-storage` から移行する
- [ ] 起動時の `clearRepo()`（`App.tsx`）が永続化の不具合への暫定対処でないか確認し、不要なら削除する
- [ ] 回帰テストを追加する

## 5. API 層

- [ ] エラーを判別可能な型に正規化する（`rate_limit` / `not_found` / `unauthorized` / `network`）
- [ ] `AbortSignal` に対応し、リポジトリ・ブランチ切替時に進行中のリクエストを中断する
- [ ] レスポンスをランタイム検証する
- [ ] レート制限の残量を UI に表示する
- [ ] Tree の `truncated` と巨大ファイルの扱いを実装する
- [ ] ブランチ取得のページングに対応する

## 6. ストア分割

- [ ] 単一ストア (`useAppStore.ts`, 約 580 行) をスライスに分割する
- [ ] 全コンポーネントをセレクタ購読 (`useShallow`) に置き換える
- [ ] localStorage キーを `codereader:<domain>` 形式に統一する

## 7. 構成変更

- [ ] `features/` + `shared/` 構成へ移動する
- [ ] 200 行を超えるコンポーネントを分割する（`Header` 286 行、`SettingsDialog` 361 行、`CodeViewer` 227 行）
- [ ] 色の直書き（例: `App.tsx` の `#1e1e2e`）を CSS 変数に置き換える
- [ ] ファイル冒頭の `// ====` バナーコメントを削除する
- [ ] UI 文言を定数ファイルに集約する
- [ ] Error Boundary を追加する

## 8. セキュリティ・a11y・性能

- [ ] PAT の既定保存先を `sessionStorage` にし、「保存する」を選んだ場合のみ `localStorage` にする
- [ ] Markdown に `rehype-sanitize` を適用する
- [ ] CSP を設定する
- [ ] アイコンボタンの `aria-label`、ダイアログのフォーカストラップ、`role` 属性を整備する
- [ ] CodeMirror 言語パックを動的 import にする
- [ ] 検索・設定・Markdown を `React.lazy` にする
- [ ] ファイルツリーを仮想化する
- [ ] バンドルサイズの予算を CI に追加する

## 9. 仕上げ

- [ ] 各ドキュメントの「現状」記述を目標に合わせて更新する
- [ ] この文書を削除し、`AGENTS.md` の注記を外す
