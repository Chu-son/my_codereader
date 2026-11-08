# アーキテクチャ

規約は [conventions/architecture.md](conventions/architecture.md)。ここでは構成とデータフローを記録する。

## 構成

```
src/
  main.tsx              StrictMode と最上位の Error Boundary
  index.css             Catppuccin Mocha の CSS 変数、共通スタイル
  app/
    App.tsx             最上位（safe area、ドロワー・ダイアログの遅延読込）、Share Target の処理
    components/         AppShell（画面の骨組み）、Header（リポジトリ切替・パンくず）、
                        ActivityRail（左パネルの切替・検索・設定）、SidePanel、NavDrawer（縦向きの左ドロワー）、
                        ThumbToolbar（戻る・進む・ブックマーク・Peek・分割・クイックオープン・集中モード。上に viewer の TrailBar を重ねる）
  features/
    repository/         RepoSwitcher（入力・表示）、BranchSelector、RecentRepos
    explorer/           ExplorerPanel（開いているファイル + ツリー）、FileTree
    viewer/             SplitPane、CodeViewer、ScrollStrip、FileTabs、OpenEditors、TrailBar、HistoryList、OutlinePanel、
                        MarkdownPreview、本文の上のメニュー（CodePopups → LineMenu / WordMenu / ReferencesSheet）
                        hooks/（スクロール復元・行ジャンプ・シンボル抽出）、lib/（言語拡張・インデントガイド・
                        スクロールマーカー・symbols（シンボル抽出・定義・参照）・definition/（import をたどる定義解決）・codeInteractions・pointerGestures）
    search/             SearchDrawer（ファイル名・キャッシュ内・GitHub コード検索）、QuickOpen（ファイル・@ シンボル・: 行・# 全文）
    bookmarks/          BookmarksList、BookmarkToggleButton
    settings/           SettingsDialog（エディタ設定・PAT・レート制限の各セクション）
    pwa/                PwaInstallPrompt
  stores/               単一の Zustand ストア。slices/ にスライス、persistence.ts に永続化
  shared/
    lib/                github.ts, githubError.ts, fileUtils.ts, urlParser.ts, searchUtils.ts, navigationHistory.ts,
                        clipboard.ts
    types/              共通型
    hooks/              useFocusTrap, useOrientation（縦向きの判定）
    ui/                 ToggleSwitch, ErrorBoundary
```

## データフロー

- **リポジトリ読込**: `loadRepository(input)` → `parseRepoInput` → `fetchRepoInfo` / `fetchRepoTree` / `fetchBranches` → ツリーを `TreeNode[]` に変換 → `addRecentRepo`。
- **ファイルを開く・ジャンプ**: ツリー・検索・ブックマーク・URL からの移動はすべて `navigateTo(path, { line?, pane? })` を通る。現在地（操作中のペインのファイルとカーソル行）を履歴に記録 → 移動先を履歴に積む → ペインのタブに追加してアクティブにする → `line` があれば `jumpTarget` を出す → `ensureFile` で本文を取得（バイナリは除外、取得済み・取得中なら何もしない）。
- **ストアの分担**: `files` スライスは本文のキャッシュ（タブを閉じても破棄しない）。`panes` スライスは 2 ペインのタブ・操作中のペイン・分割・ペインごとの表示状態（`viewState`：スクロール位置とカーソル行）・ジャンプ履歴。履歴の操作は純粋関数 `shared/lib/navigationHistory.ts`。
- **戻る・進む**: 履歴は 1 本（上限 50 件）で、各項目は `{ path, line, pane }`。戻る前に現在地を記録するので、タブ切替で履歴外にいても元の場所へ帰れる。閉じたタブは開き直す。分割を解除した後の pane 2 の項目は pane 1 に表示する。軌跡バー（`TrailBar`）と履歴パネル（`HistoryList`）は同じ履歴を描き、項目をタップすると `goToHistory(index)` でその位置へ移る（進む側の項目は、履歴外にいても切り捨てない）。
- **隣のペイン**: `openInOtherPane(path, { line, direction })` は操作中でない側のペインに `navigateTo` で開く（履歴に乗る）。分割していなければ `direction` の向きで分割を始める。`OpenEditors` は分割中はペインごとに分けて並べ、`moveToOtherPane(from, path, direction)` でタブを隣へ移す（履歴には積まない）。`direction` は呼び出し側が `usePreferredSplitDirection()`（縦向きなら上下）で渡す。
- **シンボル**: `extractSymbols(tree, doc, language)`（`viewer/lib/symbols.ts`）が構文木から宣言の一覧 `DocSymbol[]` を作る。アウトライン・定義へ・クイックオープンの `@`・集中モードのスコープ表示で共用する。言語ごとの宣言ノードは `SPECS` の小さなマップで持つ。`CodeViewer` は構文木が変わるたびに（まとめて 1 回）`ensureSyntaxTree` で末尾まで解析させてから抽出し、`files.symbols[path]` に入れる（CodeMirror は見えている範囲から遅延して解析するため、そのままの木では長いファイルの後半が抜ける）。TypeScript は `.tsx` だけ JSX 込みで解析する（`.ts` の `<T>(x) => x` を JSX と誤読して以降の木が崩れるため）。
- **行メニュー・単語メニュー**: 行番号のタップか長押しで `LineMenu`（ブックマーク・GitHub の行 URL をコピー・隣のペインで開く）、識別子のタップで `WordMenu`（定義へ・Peek で定義を見る・定義を隣のペインで開く・参照・リポジトリ内を検索）を出す。定義の引き当ては後述の「定義解決」による。参照は同じファイル内の単語単位の出現（上限 200 件）を `ReferencesSheet`（vaul、開くときだけ読込）に並べる。移動はすべて `navigateTo` を通るので「戻る」で帰れる。本文の上に浮かべる UI（行・単語メニュー、選択の検索ボタン、参照シート）は `CodePopups` の 1 つの state で切り替え、同時に 1 つだけ出す。メニューは本文がスクロールしたら閉じる。
- **定義解決**: 単語メニューと Peek は同じ `useDefinitionResolver`（`viewer/hooks/useDefinition.ts`）を使う。中身は `viewer/lib/definition/` の純粋関数で、2 段に分かれる。`findDefinitionTarget` は場所の手がかりまでを返し、API を使わない。同じファイルの宣言を名前で引き（同名が複数あればタップ位置より前で最も近いもの）、トップレベルに無ければ JS/TS の import を構文木から読み（`extractModuleLinks`）、相対パスを `treeData` のパスの集合で解決する（`resolveImportPath`。拡張子・`index` の補完と `./x.js` → `x.ts`）。`locateDefinition` は行を確定する。別ファイルなら `ensureFile` で取得してエディタを介さずに解析し、export の別名・default・再 export（`export *` を含む）をたどる（1 回で取得・解析するのは 6 ファイルまで。解析結果は本文が同じ間、最近の 20 ファイル分を覚えておく）。名前が見つからなければファイルの先頭を返す。取得が要るので、メニューには行ではなくファイル名を出し、選ばれてから取得する。パッケージとエイリアス（`@/…`）からの import は「たどれない」と表示する（tsconfig の解釈が要るため扱わない）。
- **Peek**: 読んでいる場所を動かさずに、定義を浮かぶ枠（`PeekView` / `PeekEditor`）で見る。状態は panes スライスの `peek`（`{ pane, stack, visible }`）で、枠は同時に 1 枚だけ、開いたペインの下側に出す（タブを切り替えても残るよう、エディタではなくペインに置く）。本文から開く（`openPeek`）と道筋を捨てて始め直し、枠の中で識別子をタップすると、メニューを出さずにその定義（別ファイルも含む）へ進んで道筋に積む（`pushPeek`。メニューを枠の上に重ねないため）。パンくずで途中へ戻れる（`popPeekTo`）。履歴とタブには積まず、「このペインで開く」「隣のペインで開く」を選んだときだけ `navigateTo` / `openInOtherPane` で移動する。閉じても道筋は残り、ツールバーの Peek ボタンで開き直せる。開いていないファイルの定義も見られるよう、本文は `ensureFile` で取得し、`PeekEditor` も宣言の一覧を作る。表示設定の拡張は `useEditorDisplay` で本文と共用する。
- **ブランチ切替**: `switchBranch(branch)` → 新しいブランチのツリーを再取得。本文・タブ・履歴は捨て、分割のレイアウトは保つ。リセットは各スライスの `initialXxxState()` を使う。
- **画面構成**: `AppShell` が配置だけを担い、各部品は必要な状態だけを購読する。左パネルは `ui.activePanel`（`explorer` / `bookmarks` / `history` / `outline`、`null` で閉じる）で切り替える。検索はパネルにせず `SearchDrawer` を開く。`ScrollStrip` は表示範囲・ブックマーク・検索ヒットの位置を描くだけで、表示範囲はエディタのスクロールイベントから DOM を直接更新する（スクロールで React を再描画しない）。縦向き（`useIsPortrait`）では、同じ `ActivityRail` と `SidePanel` を左ドロワー `NavDrawer` に入れ、ツールバーを画面下端に固定する。ドロワーは表示中のファイルかジャンプ先が変わると閉じる。分割は縦向きなら上下で始める（`toggleSplitView(preferred)`）。分割中に回転しても向きは変えない。
- **集中モード**: `ui.focusMode` の間、`AppShell` はレール・パネル・ツールバーを、`PaneContent` はタブを出さず、`CodeViewer` は `ScopeHeader`（ファイル名と、宣言が画面の上へ流れた囲み。`findScopeChain`）を出す。エディタの上の 2 本指は `useTwoFingerGestures` が扱い、ピンチの間は `--font-size-code` だけを変えて、指を離したときに `fontSize` へ確定する（永続化の書き込みを毎フレーム走らせないため）。横スワイプは `navigateBack` / `navigateForward`。
- **Share Target**: PWA の共有 (`?url=` / `?text=`) → `app/App.tsx` で `github.com/owner/repo` を抽出 → `loadRepository` → `history.replaceState` で URL を整理。
- **検索**: ツリーのファイル名検索、取得済みファイル内の検索、GitHub `/search/code`（PAT 必須）。単語メニューの「定義の候補を探す」と参照シートの「リポジトリ全体」も `/search/code` を使う（`viewer/lib/codeCandidates`、`searchWordInRepo`）。
- **クイックオープン**: ツールバーから開くダイアログ（`search/components/QuickOpen.tsx`）。入力の先頭の記号で動作が変わり、接頭辞なしはツリーのあいまい一致（50 件まで）、`@` は操作中のファイルの `symbols`、`:` は行番号、`#` は `searchInRepo` に渡す。候補の計算は `search/lib/quickOpen.ts` の純粋関数で API を使わず、移動はすべて `navigateTo` を通るので履歴に乗る。
- **ブックマーク**: `{ id, repo, branch, path, line, text }`。付け外しは `toggleBookmark(path, line)`（ツールバーのボタンと行メニューで共用）。`navigateTo(path, { line })` で該当行へ移動する。行ジャンプは `jumpTarget`（path / line / pane / timestamp）で、宛先のペインの `CodeViewer` だけが処理する。ジャンプとスクロール復元は、エディタが作られた後（`@uiw/react-codemirror` は初回描画の後で作るため、`EditorView` は state で持つ）、高さが付いてから（分割直後のペインは高さ 0 で作られる。`whenSized`）実行する。

## ビルドと配信

- Vite 8 + `@vitejs/plugin-react` + Tailwind v4 (`@tailwindcss/vite`)。`base` は `/my_codereader/`。
- `vite-plugin-pwa`（autoUpdate、standalone、`share_target`）。GitHub API は NetworkFirst（1 時間・200 件）、Google Fonts は CacheFirst。
- GitHub Actions が `main` への push で GitHub Pages へデプロイする。
