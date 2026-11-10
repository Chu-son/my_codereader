import { Menu } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { RepoSwitcher } from '@/features/repository';
import { STRINGS } from '@/shared/constants/strings';
import { Breadcrumbs } from './Breadcrumbs';

interface HeaderProps {
  /** 縦向き。左端に、レールとパネルを収めた左ドロワーを開くボタンを置く */
  portrait: boolean;
}

/** 上端のバー。リポジトリの切り替えと、表示中のファイルのパンくずだけを置く */
export function Header({ portrait }: HeaderProps) {
  const setNavDrawerOpen = useAppStore((s) => s.setNavDrawerOpen);

  return (
    <header
      id="app-header"
      className="flex items-center gap-3 px-3 border-b select-none shrink-0"
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-primary)',
      }}
    >
      {/* リポジトリ未選択でも設定などに辿れるよう、ツールバーではなくヘッダーに置く */}
      {portrait && (
        <button
          id="nav-drawer-toggle"
          onClick={() => setNavDrawerOpen(true)}
          className="touch-target -ml-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          aria-label={STRINGS.shell.openPanels}
        >
          <Menu size={22} />
        </button>
      )}
      <div className={`shrink-0 min-w-0 ${portrait ? 'w-[min(28rem,60%)]' : 'w-[min(28rem,50%)]'}`}>
        <RepoSwitcher />
      </div>
      <div className="flex-1 min-w-0 flex justify-end">
        <Breadcrumbs />
      </div>
    </header>
  );
}
