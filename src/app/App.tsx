import './App.css';
import { Header } from './components/Header';
import { useShareTarget } from './hooks/useShareTarget';
import { Sidebar } from '@/features/explorer';
import { SplitPane } from '@/features/viewer';
import { PwaInstallPrompt } from '@/features/pwa';
import { RecentRepos } from '@/features/repository';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { lazy, Suspense } from 'react';
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

  useShareTarget(loadRepository);

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
