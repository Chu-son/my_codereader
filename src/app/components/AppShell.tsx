import { lazy, Suspense } from 'react';
import { Minimize2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
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
  const { currentRepo, focusMode, setFocusMode } = useAppStore(
    useShallow((s) => ({
      currentRepo: s.currentRepo,
      focusMode: s.focusMode,
      setFocusMode: s.setFocusMode,
    })),
  );
  // リポジトリを閉じると本文が無くなるので、集中モードのままでも通常の配置に戻す
  const focused = focusMode && currentRepo !== null;
  // 軌跡バーが出ている間は、浮かせたツールバーが 1 段高くなる
  const hasTrail = useAppStore((s) => s.history.length > 1);
  const portrait = useIsPortrait();

  return (
    <>
      <Header portrait={portrait} />
      <div className="flex flex-1 overflow-hidden">
        {!portrait && !focused && (
          <>
            <ActivityRail />
            <SidePanel />
          </>
        )}
        <main
          data-trail={(hasTrail && !focused) || undefined}
          className="relative flex flex-col flex-1 min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="flex-1 min-h-0">
            <ErrorBoundary label={STRINGS.app.boundaryMain}>
              {currentRepo ? <SplitPane /> : <RecentRepos />}
            </ErrorBoundary>
          </div>
          {currentRepo && !focused && <ThumbToolbar portrait={portrait} />}
          {focused && (
            <button
              id="focus-exit"
              onClick={() => setFocusMode(false)}
              className="absolute bottom-3 right-6 touch-target rounded-full border text-[var(--text-secondary)]"
              style={{
                backgroundColor: 'var(--header-bg)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-card)',
                zIndex: 'var(--z-overlay)',
              }}
              title={STRINGS.shell.focusExit}
              aria-label={STRINGS.shell.focusExit}
            >
              <Minimize2 size={20} />
            </button>
          )}
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
