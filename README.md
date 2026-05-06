# GitHub CodeReader (iPad Optimized PWA)

iPad（特にiPad mini）でのブラウジングに最適化された、GitHubパブリックリポジトリ専用のコードリーダーです。PWAとして動作し、ネイティブアプリのような操作感でリポジトリを閲覧できます。

## 🌟 主な特徴

- **iPadに最適化されたUI**: タッチ操作を前提としたボタンサイズ、スクロール挙動、セーフエリア対応。
- **リポジトリ閲覧**: `owner/repo` 形式、またはURLを貼り付けるだけで瞬時にリポジトリを読み込みます。
- **ファイル管理**:
  - ツリー形式のエクスプローラー。
  - 一度開いたファイルを保持するタブ・リスト管理。
  - ブランチ切り替えに対応。
- **高度なビューア機能**:
  - **分割表示**: 縦分割・横分割の切り替えが可能。
  - **全文検索**: ファイル名検索およびGitHub Search APIを用いたリポジトリ内検索（要PAT）。
  - **選択テキスト検索**: コードを選択するだけで即座にその単語で検索可能。
- **カスタマイズ設定**:
  - 文字列の折り返し/横スクロール切り替え。
  - 階層別のインデントガイド（色分け表示）。
  - フォントサイズのリアルタイム調整（12px〜24px）。
- **プレミアム・デザイン**: Catppuccinテーマをベースにした、目に優しいモダンなダークモード。

## 🚀 使い方

1. `npm install` で依存関係をインストールします。
2. `npm run dev` で開発サーバーを起動します。
3. ブラウザでアクセスし、右上の「読込（雲アイコン）」から閲覧したいリポジトリを指定します。
4. より快適な検索機能を利用するには、設定（歯車アイコン）から GitHub Personal Access Token (PAT) を設定してください。

## 🛠 技術スタック

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand (+ Persistence)
- **Editor**: CodeMirror 6 (@uiw/react-codemirror)
- **Components**: Radix UI, Lucide React, Vaul (Drawer), Allotment (Split Pane)

## 📱 デプロイとPWA対応

### GitHub Pagesへのデプロイ
このリポジトリはGitHub Actionsによる自動デプロイが設定されています。
`main` ブランチにPushするだけで、自動的にGitHub Pagesにビルドされたアプリが公開されます。

**【初回のみ必要な設定】**
1. GitHubのリポジトリページから **Settings > Pages** を開きます。
2. **Build and deployment** の **Source** を `Deploy from a branch` から `GitHub Actions` に変更します。
3. （設定後、一度 `main` にPushするか、Actionsタブから手動でワークフローを実行してください）

### iPad / iPhone でのインストール方法 (PWA)
ホーム画面に追加して使用することで、SafariのUIに邪魔されないフルスクリーンでネイティブアプリのように快適な閲覧が可能です。

1. デプロイされたGitHub PagesのURLをSafariで開きます。
2. Safariの下部（iPadの場合は上部）にある共有ボタン（四角から上向き矢印が出ているアイコン）をタップします。
3. メニューをスクロールして「**ホーム画面に追加**」を選択します。
4. ホーム画面に追加された「CodeReader」アイコンからアプリを起動してください。

---
Created by Antigravity (Advanced Agentic Coding AI)
