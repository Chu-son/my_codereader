# CI/CD・依存管理規約

## CI

| ワークフロー | トリガー | 内容 |
| --- | --- | --- |
| `ci.yml` | PR / `develop` への push | `npm ci` → `lint` → 型チェック → `test` → `build` → `npm audit --audit-level=high` |
| `deploy.yml` | `main` への push / 手動 | ビルドして GitHub Pages へデプロイ |

- すべてのチェックが成功しない限り、PR をマージしない（ブランチ保護で強制する）。
- Node のバージョンは `.nvmrc` で固定し、CI でも同じファイルを参照する。
- `npm ci` を使い、`package-lock.json` を必ずコミットする。
- キャッシュ（`actions/setup-node` の `cache: npm`）を有効にする。

## デプロイ

- デプロイは `main` へのマージ時のみ。手動デプロイは緊急時に限る。
- `vite.config.ts` の `base` はリポジトリ名と一致させる（`/my_codereader/`）。
- デプロイ後は Pages の URL で、読込・ファイル表示・PWA インストールを確認する。

## 依存管理

- 未使用の依存は削除する。追加時は、必要性と代替案、バンドルサイズへの影響を PR に書く。
- 依存は caret (`^`) 指定とし、ロックファイルで再現性を保つ。
- メジャーバージョンの更新は、他の変更と分けて単独の PR にする。
- 週次を目安に更新を確認する（Dependabot または Renovate の利用を推奨）。
