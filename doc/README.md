# ドキュメント目次

このディレクトリは **目標状態** の設計と規約を定義します。現状の実装との差分は [migration.md](migration.md) で管理します。

## 設計

- [architecture.md](architecture.md) — 構成・データフロー（目標と現状）
- [development.md](development.md) — セットアップ、実行、デプロイ、PWA 確認
- [github-api.md](github-api.md) — 使用する API、制限、キャッシュ
- [state-and-storage.md](state-and-storage.md) — 状態管理と永続化
- [migration.md](migration.md) — 現状と規約の差分、是正チェックリスト

## 規約 (`conventions/`)

- [coding.md](conventions/coding.md) — TypeScript・命名・コメント
- [architecture.md](conventions/architecture.md) — 層構造・コンポーネント設計
- [state.md](conventions/state.md) — Zustand・永続化
- [github-api.md](conventions/github-api.md) — API クライアント・エラー
- [security.md](conventions/security.md) — PAT・サニタイズ・CSP
- [ui.md](conventions/ui.md) — タッチ・デザイントークン・アクセシビリティ
- [performance.md](conventions/performance.md) — 分割読込・仮想化
- [testing.md](conventions/testing.md) — テスト方針
- [git.md](conventions/git.md) — ブランチ・コミット・PR
- [ci.md](conventions/ci.md) — CI/CD・依存管理
