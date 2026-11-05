import { ChevronRight } from 'lucide-react';
import { useAppStore, selectFocusedPath } from '@/stores/useAppStore';
import { STRINGS } from '@/shared/constants/strings';

/** 操作中のペインで表示しているファイルのパス。長いパスは横スクロールで全体を見られる */
export function Breadcrumbs() {
  const path = useAppStore(selectFocusedPath);
  if (!path) return null;

  const segments = path.split('/');
  return (
    <nav
      id="breadcrumbs"
      aria-label={STRINGS.header.breadcrumb}
      className="flex items-center min-w-0 overflow-x-auto text-[13px] whitespace-nowrap"
      // 末尾（ファイル名）が見えるよう、右端から並べる
      style={{ direction: 'rtl' }}
    >
      <ol className="flex items-center" style={{ direction: 'ltr' }}>
        {segments.map((segment, i) => {
          const last = i === segments.length - 1;
          return (
            <li key={i} className="flex items-center shrink-0">
              {i > 0 && <ChevronRight size={14} className="mx-0.5 text-[var(--text-muted)]" />}
              <span
                className={last ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}
                aria-current={last ? 'page' : undefined}
              >
                {segment}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
