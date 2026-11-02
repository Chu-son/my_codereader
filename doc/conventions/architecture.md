# アーキテクチャ規約

## 層構造

機能単位（feature）で分割する。

```
src/
  app/            App・ルート構成・プロバイダ
  features/
    <name>/
      components/ 機能固有の UI
      hooks/      機能固有のフック
      store.ts    機能のスライス
      lib/        機能固有の純粋関数
      index.ts    公開 API
  shared/
    ui/           汎用 UI 部品
    lib/          汎用関数（API クライアント含む）
    types/        共通型
```

ストアは機能をまたいで状態を参照するため、`stores/` に単一のストアとして置き（スライスは `stores/slices/`）、feature から import してよい。`stores` は feature の `index.ts` を import しない（循環を避ける）。ストアと feature の両方が使う純粋関数は `shared/lib` に置く。

想定する feature: `repository`（読込・ブランチ・最近のリポジトリ）, `explorer`（ツリー）, `viewer`（コード・Markdown・タブ・分割）, `search`, `bookmarks`, `settings`, `pwa`。

## 依存方向

- `app` → `features` → `shared` の一方向のみ。逆向きの import は禁止。
- feature 同士は、相手の `index.ts` が公開するものだけを import する。内部ファイルを直接 import しない。
- 循環依存は禁止。

## 副作用の隔離

- `fetch`、`localStorage` / `sessionStorage`、タイマー、`window` 操作は `lib` / `store` / フックの中だけで行う。コンポーネント本体から直接呼ばない。
- 純粋関数と副作用を持つ関数を同じファイルに混在させない。

## コンポーネント

- 1 ファイル 200 行を目安にする。超えたら分割する。
- データ取得・状態接続（container）と表示（presentational）を分ける。表示コンポーネントは props だけで描画できるようにする。
- props は最小限にする。ストアから取れる値を props で何段も渡さない。
- 派生値は `useEffect` + `useState` ではなく、描画中に計算する（重い場合のみ `useMemo`）。
- `useEffect` は外部との同期（購読、DOM、タイマー）に限る。依存配列の lint 警告は無効化しない。
- エラーは Error Boundary で捕捉し、画面全体を落とさない。
