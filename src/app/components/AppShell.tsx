import { useAppStore } from '@/stores/useAppStore';
import { SplitPane } from '@/features/viewer';
import { RecentRepos } from '@/features/repository';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { STRINGS } from '@/shared/constants/strings';
import { Header } from './Header';
import { ActivityRail } from './ActivityRail';
import { SidePanel } from './SidePanel';
import { ThumbToolbar } from './ThumbToolbar';

/**
 * 画面の骨組み。上端にヘッダー、左にアクティビティレールとパネル、中央に本文、下中央に親指ツールバー。
 * 各部品は自分で必要な状態だけを購読し、ここは配置だけを担う。
 */
export function AppShell() {
  const currentRepo = useAppStore((s) => s.currentRepo);

  return (
    <>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ActivityRail />
        <SidePanel />
        <main
          className="relative flex-1 min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <ErrorBoundary label={STRINGS.app.boundaryMain}>
            {currentRepo ? <SplitPane /> : <RecentRepos />}
          </ErrorBoundary>
          {currentRepo && <ThumbToolbar />}
        </main>
      </div>
    </>
  );
}
