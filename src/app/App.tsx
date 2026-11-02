import './App.css';
import { Header } from './components/Header';
import { Sidebar } from '@/features/explorer';
import { SplitPane } from '@/features/viewer';
import { PwaInstallPrompt } from '@/features/pwa';
import { RecentRepos } from '@/features/repository';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { lazy, Suspense, useEffect } from 'react';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { STRINGS } from '@/shared/constants/strings';

// 初期表示に不要な画面は使われるときに読み込む
const SearchDrawer = lazy(() =>
  import('@/features/search').then((m) => ({ default: m.SearchDrawer })),
);
const SettingsDialog = lazy(() =>
  import('@/features/settings').then((m) => ({ default: m.SettingsDialog })),
);

function App() {
  const { currentRepo, settingsOpen, loadRepository } = useAppStore(
    useShallow((s) => ({
      currentRepo: s.currentRepo,
      settingsOpen: s.settingsOpen,
      loadRepository: s.loadRepository,
    })),
  );

  // 保存されたリポジトリまたは共有されたURLを初回読み込み
  useEffect(() => {
    // クエリパラメータから共有されたURLを取得 (Web Share Target API)
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || params.get('text');

    if (sharedUrl) {
      // GitHubのURL（https://github.com/owner/repo...）から owner/repo を抽出
      const match = sharedUrl.match(/github\.com\/([^/]+\/[^/]+)/);
      if (match && match[1]) {
        let repoName = match[1];
        // 末尾の .git やスラッシュ以降を削除
        const [owner = '', name = ''] = repoName.split('/');
        repoName = `${owner}/${name.replace(/\.git$/, '')}`;

        loadRepository(repoName);

        // URLパラメータをクリアしてクリーンアップ
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: 'var(--app-bg)', // ヘッダーの背景色と合わせる
      }}
    >
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <Sidebar />

        {/* メインエリア（分割対応） */}
        <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <ErrorBoundary label={STRINGS.app.boundaryMain}>
            {currentRepo ? <SplitPane /> : <RecentRepos />}
          </ErrorBoundary>
        </main>
      </div>

      {/* 検索ドロワー */}
      <Suspense fallback={null}>
        <SearchDrawer />
      </Suspense>

      {/* 設定ダイアログ */}
      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsDialog />
        </Suspense>
      )}

      {/* PWAインストールプロンプト */}
      <PwaInstallPrompt />
    </div>
  );
}

export default App;
