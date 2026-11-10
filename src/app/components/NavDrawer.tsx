import { useEffect } from 'react';
import { Drawer } from 'vaul';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, selectFocusedPath } from '@/stores/useAppStore';
import { STRINGS } from '@/shared/constants/strings';
import { ActivityRail } from './ActivityRail';
import { SidePanel } from './SidePanel';

/**
 * 縦向きのときの左ドロワー。横向きと同じレールとパネルを入れ、本文の幅を確保する。
 * ファイルを開いたら（表示中のファイルかジャンプ先が変わったら）閉じ、すぐ本文を読めるようにする。
 */
export function NavDrawer() {
  const { open, setOpen } = useAppStore(
    useShallow((s) => ({ open: s.navDrawerOpen, setOpen: s.setNavDrawerOpen })),
  );

  useEffect(
    () =>
      useAppStore.subscribe((s, prev) => {
        if (!s.navDrawerOpen) return;
        if (selectFocusedPath(s) !== selectFocusedPath(prev) || s.jumpTarget !== prev.jumpTarget) {
          s.setNavDrawerOpen(false);
        }
      }),
    [],
  );

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} direction="left">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0" style={{ zIndex: 'var(--z-drawer)' }} />
        <Drawer.Content
          id="nav-drawer"
          className="fixed top-0 bottom-0 left-0 flex outline-none"
          style={{
            zIndex: 'var(--z-drawer)',
            maxWidth: '90vw',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            backgroundColor: 'var(--sidebar-bg)',
          }}
        >
          <Drawer.Title className="sr-only">{STRINGS.shell.rail}</Drawer.Title>
          <Drawer.Description className="sr-only">{STRINGS.shell.drawerHint}</Drawer.Description>
          <ActivityRail />
          <SidePanel />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
