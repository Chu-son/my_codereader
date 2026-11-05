import { lazy, Suspense } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { SplitPane } from '@/features/viewer';
import { RecentRepos } from '@/features/repository';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { useIsPortrait } from '@/shared/hooks/useOrientation';
import { STRINGS } from '@/shared/constants/strings';
import { Header } from './Header';
import { ActivityRail } from './ActivityRail';
import { SidePanel } from './SidePanel';
import { ThumbToolbar } from './ThumbToolbar';

// vaul を初期バンドルに含めないよう、縦向きでだけ読み込む
const NavDrawer = lazy(() => import('./NavDrawer').then((m) => ({ default: m.NavDrawer })));

/**
 * 画面の骨組み。各部品は自分で必要な状態だけを購読し、ここは配置だけを担う。
 * - 横向き: 左にアクティビティレールとパネル、本文の下中央に浮かせた親指ツールバー
 * - 縦向き: レールとパネルは左ドロワーに収め、ツールバーは画面下端に固定する
 * 部品は共通で、向きによって置き場所だけを変える（状態と挙動を 1 つに保つため）。
 */
export function AppShell() {
  const currentRepo = useAppStore((s) => s.currentRepo);
  const portrait = useIsPortrait();

  return (
    <>
      <Header portrait={portrait} />
      <div className="flex flex-1 overflow-hidden">
        {!portrait && (
          <>
            <ActivityRail />
            <SidePanel />
          </>
        )}
        <main
          className="relative flex flex-col flex-1 min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="flex-1 min-h-0">
            <ErrorBoundary label={STRINGS.app.boundaryMain}>
              {currentRepo ? <SplitPane /> : <RecentRepos />}
            </ErrorBoundary>
          </div>
          {currentRepo && <ThumbToolbar portrait={portrait} />}
        </main>
      </div>
      {portrait && (
        <Suspense fallback={null}>
          <NavDrawer />
        </Suspense>
      )}
    </>
  );
}
