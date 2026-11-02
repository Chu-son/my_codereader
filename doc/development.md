# 開発ガイド

## セットアップ

```bash
npm ci          # 依存のインストール（初回は npm install でも可）
npm run dev     # 開発サーバー（--host 付き。LAN 内の iPad からも接続可能）
```

`base` が `/my_codereader/` のため、ブラウザでは `http://localhost:5173/my_codereader/` を開く。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー (`vite --host`) |
| `npm run build` | `tsc -b` による型チェック後に `vite build` |
| `npm run typecheck` | 型チェックのみ |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier による整形 / 検査 |
| `npm run test` / `test:coverage` | Vitest / カバレッジ付き |
| `npm run check:bundle` | 初期 JS のバンドル予算を検査（`build` の後） |
| `npm run preview` | ビルド成果物の確認（PWA / Service Worker の確認はこちら） |

## 変更後の確認

1. `npm run format:check`・`npm run lint`・`npm run typecheck`・`npm run test`（CI と同じ内容）
2. `npm run build` と `npm run check:bundle`（型エラーがあるとデプロイも失敗する）
3. UI を変えた場合は `npm run dev` で、読込・ファイルを開く・分割表示・検索・ブックマーク・設定を手動確認する。
4. タッチ操作に関わる変更は、iPad 実機または Safari のレスポンシブデザインモードで確認する。

## PWA の確認

- Service Worker は `npm run preview`（本番ビルド）でのみ動作を確認する。開発サーバーでは確認しない。
- 確認項目: インストール、オフライン時の起動、Share Target（共有シートから GitHub の URL を渡して読込）。
- 古い Service Worker が残る場合は、ブラウザの「Application → Service Workers」で解除する。

## デプロイ

- `main` へのマージで GitHub Actions (`deploy.yml`) が GitHub Pages に公開する。
- 初回のみ、リポジトリの Settings → Pages → Source を `GitHub Actions` に設定する。
- 公開 URL は `https://<ユーザー名>.github.io/my_codereader/`。

## iPad へのインストール

Safari で公開 URL を開き、共有ボタン → 「ホーム画面に追加」を選ぶ。
