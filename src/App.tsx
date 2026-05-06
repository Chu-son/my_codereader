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
        repoName = repoName.split('/')[0] + '/' + repoName.split('/')[1].replace(/\.git$/, '');
        
        loadRepository(repoName);
        
        // URLパラメータをクリアしてクリーンアップ
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return;
      }
    }

    if (currentRepo) {
      loadRepository(currentRepo);
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
        backgroundColor: '#1e1e2e' // ヘッダーの背景色と合わせる
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
