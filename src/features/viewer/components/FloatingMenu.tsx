import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import type { Anchor } from '../lib/codeInteractions';

const MARGIN = 8;
const GAP = 4;

interface FloatingMenuProps {
  anchor: Anchor;
  label: string;
  /** メニュー上端に出す見出し（行番号や単語） */
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 本文の上に浮かべるメニュー。基準の矩形の下に出し、入りきらなければ上に出す。
 * 外側を触ったら閉じるが、その操作自体は止めない（別の単語をタップすると、そのまま次のメニューが開く）。
 */
export function FloatingMenu({ anchor, label, title, onClose, children }: FloatingMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const left = Math.min(Math.max(anchor.left, MARGIN), window.innerWidth - width - MARGIN);
    const below = anchor.bottom + GAP;
    const top =
      below + height <= window.innerHeight - MARGIN
        ? below
        : Math.max(anchor.top - height - GAP, MARGIN);
    setPosition({ left, top });
  }, [anchor]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Node && ref.current?.contains(e.target)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // 下にある Peek まで一度に閉じないよう、メニューで受けたことを知らせる
      e.preventDefault();
      onClose();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    // Peek より先に受けるため捕捉段階で聞く
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      className="fixed min-w-[240px] max-w-[min(360px,calc(100vw-16px))] py-1 rounded-xl border shadow-lg animate-fade-in select-none"
      style={{
        left: position?.left ?? anchor.left,
        top: position?.top ?? anchor.bottom,
        // 位置が決まるまでは見せない（一瞬だけ画面外にはみ出して見えるのを防ぐ）
        visibility: position ? 'visible' : 'hidden',
        zIndex: 'var(--z-overlay)',
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-secondary)',
      }}
    >
      <div className="px-3 pt-1 pb-1.5 text-[11px] truncate-text text-[var(--text-muted)]">
        {title}
      </div>
      {children}
    </div>,
    document.body,
  );
}

interface MenuItemProps {
  Icon: LucideIcon;
  label: string;
  /** 右端に添える補足（行番号・件数など） */
  detail?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export function MenuItem({ Icon, label, detail, disabled, onSelect }: MenuItemProps) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 min-h-[44px] text-left text-[13px] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:hover:bg-transparent text-[var(--text-primary)]"
    >
      <Icon size={16} className="shrink-0 text-[var(--text-secondary)]" />
      <span className="flex-1 min-w-0 truncate-text">{label}</span>
      {detail && <span className="shrink-0 text-[11px] text-[var(--text-muted)]">{detail}</span>}
    </button>
  );
}
