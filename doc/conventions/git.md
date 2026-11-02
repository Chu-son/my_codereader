# Git・レビュー規約

## ブランチ

| ブランチ | 用途 |
| --- | --- |
| `main` | 公開用。保護対象で、マージされると GitHub Pages へ自動デプロイされる |
| `develop` | 統合用 |
| `feat/<topic>` `fix/<topic>` `docs/<topic>` `refactor/<topic>` `chore/<topic>` | 作業用。`develop` から切る |

- `main` への直接 push は禁止。必ず PR を経由する。
- 作業ブランチは小さく保ち、マージ後に削除する。

## コミット

[Conventional Commits](https://www.conventionalcommits.org/ja/) に従う。

```
<type>(<scope>): <日本語の件名>

<本文: 何をなぜ変えたか。必要なときのみ>
```

- type: `feat` / `fix` / `docs` / `refactor` / `test` / `perf` / `build` / `ci` / `chore`
- scope（任意）: `viewer`, `search`, `bookmarks`, `settings`, `api`, `store`, `pwa` など。
- 件名は 50 文字程度、命令形・体言止め、末尾に句点を付けない。
- 破壊的変更は `!` を付け、本文に `BREAKING CHANGE:` を書く。
- 1 コミット 1 目的。フォーマットのみの変更は機能変更と分ける。

## プルリクエスト

- 小さく保つ（目安: 差分 400 行以内）。大きな変更は段階に分ける。
- 説明に「目的」「変更内容」「確認方法」を書く。UI の変更にはスクリーンショットを添付する。
- マージ前のチェックリスト:
  - [ ] `npm run lint` / `npm run build` / `npm run test` が通る
  - [ ] 規約に沿っている。ドキュメントを更新した
  - [ ] 回帰テストを追加した（バグ修正の場合）
- マージは Squash を基本とし、Squash 後の件名も Conventional Commits にする。
