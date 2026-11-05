import './App.css';
import { AppShell } from './components/AppShell';
import { useShareTarget } from './hooks/useShareTarget';
import { PwaInstallPrompt } from '@/features/pwa';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { lazy, Suspense } from 'react';

// 初期表示に不要な画面は使われるときに読み込む
const SearchDrawer = lazy(() =>
  import('@/features/search').then((m) => ({ default: m.SearchDrawer })),
);
const SettingsDialog = lazy(() =>
  import('@/features/settings').then((m) => ({ default: m.SettingsDialog })),
);

function App() {
  const { settingsOpen, loadRepository } = useAppStore(
    useShallow((s) => ({
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
      <AppShell />

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
