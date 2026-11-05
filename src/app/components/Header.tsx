import { RepoSwitcher } from '@/features/repository';
import { Breadcrumbs } from './Breadcrumbs';

/** 上端のバー。リポジトリの切り替えと、表示中のファイルのパンくずだけを置く */
export function Header() {
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
      <div className="shrink-0 min-w-0 w-[min(28rem,50%)]">
        <RepoSwitcher />
      </div>
      <div className="flex-1 min-w-0 flex justify-end">
        <Breadcrumbs />
      </div>
    </header>
  );
}
