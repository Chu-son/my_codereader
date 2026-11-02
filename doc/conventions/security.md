# セキュリティ規約

## PAT（Personal Access Token）

- 案内するのは **読み取り専用の fine-grained トークン** のみ。公開リポジトリの閲覧に書き込み権限は不要。
- 保存先の既定は `sessionStorage`。ユーザーが「保存する」を明示的に選んだときだけ `localStorage` に保存する。設定画面にリスクを明記する。
- ログ、URL、エラーメッセージ、クラッシュレポートに PAT を含めない。入力欄は `type="password"` にする。
- PAT を第三者ドメインへ送らない（送信先は `api.github.com` のみ）。

## 入力と表示

- 外部由来の Markdown / HTML は `rehype-sanitize` でサニタイズする。`dangerouslySetInnerHTML` は禁止。
- 外部リンクには `target="_blank"` と `rel="noopener noreferrer"` を付ける。
- 共有 URL (`?url=`, `?text=`) は `parseRepoInput` で検証し、`github.com` のリポジトリ以外は無視する。

## ブラウザ側の防御

- Content-Security-Policy を設定する（`default-src 'self'`、`connect-src` は `https://api.github.com` のみ許可、など）。
- Service Worker のキャッシュ対象は GitHub API の GET と静的資産に限る。`Authorization` 付きの応答を長期キャッシュしない。

## 依存関係

- CI で `npm audit --omit=dev --audit-level=high` を実行し、実行時の依存に High 以上があれば失敗させる。開発専用の依存は情報として表示し、定期的な更新で解消する。
- 依存の追加・更新は [ci.md](ci.md) の方針に従う。
