# GitHub API 利用

規約は [conventions/github-api.md](conventions/github-api.md)。ここでは使用するエンドポイントと制約を記録する。

## 使用エンドポイント

ベース URL は `https://api.github.com`。実装は [src/shared/lib/github.ts](../src/shared/lib/github.ts)。

| 用途           | エンドポイント                                             |
| -------------- | ---------------------------------------------------------- |
| リポジトリ情報 | `GET /repos/{owner}/{repo}`                                |
| ツリー         | `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1` |
| ファイル内容   | `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}`   |
| ブランチ一覧   | `GET /repos/{owner}/{repo}/branches?per_page=100`          |
| コード検索     | `GET /search/code?q=...&per_page=30`（PAT 必須）           |
| レート制限     | `GET /rate_limit`                                          |

ヘッダー: `Accept: application/vnd.github+json`、`X-GitHub-Api-Version: 2022-11-28`、PAT があれば `Authorization: Bearer <PAT>`。

## 制約

- 対象は公開リポジトリのみ。
- レート制限: 未認証 60 回/時、認証済み 5,000 回/時。コード検索は別枠で、より厳しい。
- ブランチは 100 件ずつ最大 10 ページ（1,000 件）まで取得する。
- Git Tree は大きなリポジトリで `truncated` になり得る。その場合はサイドバーに通知する。
- 別ファイルの定義へ移るときは、たどった import・再 export の先の本文を取得する（1 回の操作で最大 6 ファイル。取得済みは再取得しない）。単語メニューを開いただけでは取得しない。
- 1 MB（`MAX_FILE_BYTES`）を超えるファイルは本文を表示せず、`too_large` エラーにする。
- Service Worker が API の GET を NetworkFirst（1 時間・200 件）でキャッシュする。

エラーは `GitHubError`（`src/shared/lib/githubError.ts`）に正規化し、レスポンスは zod で検証する。分類は規約を参照。
