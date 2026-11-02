# コーディング規約

## TypeScript

- `strict` を有効にし、`noUncheckedIndexedAccess` も有効にする。
- `any` と型アサーション（`as`）は原則禁止。やむを得ない場合は、直前のコメントに理由を書く。`@ts-ignore` は禁止（必要なら `@ts-expect-error` + 理由）。
- 外部入力は `unknown` として受け、型ガードか検証ライブラリで絞り込む。
- `enum` は使わず、union 型か `as const` オブジェクトを使う。
- 型のみの import は `import type` を使う。
- 関数の戻り値型は export する関数では明示する。

## 命名

| 対象 | 規則 | 例 |
| --- | --- | --- |
| コンポーネント・型 | PascalCase | `FileTree`, `RepoInfo` |
| 関数・変数 | camelCase | `parseRepoInput` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RECENT_REPOS` |
| フック | `use` + PascalCase | `useBookmarks` |
| boolean | `is` / `has` / `can` / `should` で始める | `isLoading` |
| コンポーネントのファイル | PascalCase | `FileTree.tsx` |
| それ以外のファイル | camelCase | `urlParser.ts` |

## import

- `src` 内の別ディレクトリは `@/` で参照する。相対パスは同一ディレクトリ内（`./`）と、同一 feature 内の別ディレクトリ（`../lib/...`）に限る。feature をまたぐ参照と `shared` / `stores` は `@/` を使い、feature の内部ファイルは直接 import しない（ESLint で検査）。
- barrel (`index.ts`) は feature の公開 API を示す場合に限る。

## コメント

- 日本語で書く。コードを読めば分かる「何を」ではなく、「なぜ」を書く。
- ファイル冒頭のバナーコメント（`// ====` で囲んだもの）は書かない。
- TSDoc（`/** */`）は export する関数・型で、挙動が名前から自明でないものに付ける。
- コメントアウトしたコードはコミットしない。

## フォーマットと Lint

- フォーマットは Prettier、品質チェックは ESLint が担当する。ESLint にフォーマット規則を持たせない。
- Lint の警告は 0 にする。`eslint-disable` は理由をコメントに書き、対象を 1 行に限定する。
- `console.log` はコミットしない（`console.warn` / `console.error` は可）。
