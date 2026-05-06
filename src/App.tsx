// ========================================
// App — Main Layout
// ========================================

import './App.css';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SplitPane } from '@/components/SplitPane';
import { SearchDrawer } from '@/components/SearchDrawer';
import { SettingsDialog } from '@/components/SettingsDialog';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { useAppStore } from '@/stores/useAppStore';
import { useEffect } from 'react';

function App() {
  const { currentRepo, loadRepository } = useAppStore();

  // 保存されたリポジトリを初回読み込み
  useEffect(() => {
    if (currentRepo) {
      loadRepository(currentRepo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <Sidebar />

        {/* メインエリア（分割対応） */}
        <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <SplitPane />
        </main>
      </div>

      {/* 検索ドロワー */}
      <SearchDrawer />

      {/* 設定ダイアログ */}
      <SettingsDialog />

      {/* PWAインストールプロンプト */}
      <PwaInstallPrompt />
    </div>
  );
}

export default App;
