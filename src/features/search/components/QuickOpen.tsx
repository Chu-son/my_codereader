import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  FileCode,
  FileSearch,
  ListTree,
  Search,
  TextCursorInput,
  type LucideIcon,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { STRINGS } from '@/shared/constants/strings';
import { useQuickOpenItems } from '../hooks/useQuickOpenItems';
import { parseQuery, type QuickOpenItem, type QuickOpenMode } from '../lib/quickOpen';

const MODE_ICON: Record<QuickOpenMode, LucideIcon> = {
  file: FileCode,
  symbol: ListTree,
  line: TextCursorInput,
  text: Search,
};

// ソフトキーボードは入力しづらい記号が別の面にあるので、接頭辞をタップでも入れられるようにする
const MODE_CHIPS: { mode: QuickOpenMode; prefix: string; label: string }[] = [
  { mode: 'file', prefix: '', label: STRINGS.quickOpen.modeFile },
  { mode: 'symbol', prefix: '@', label: STRINGS.quickOpen.modeSymbol },
  { mode: 'line', prefix: ':', label: STRINGS.quickOpen.modeLine },
  { mode: 'text', prefix: '#', label: STRINGS.quickOpen.modeText },
];

/** 入力に一致した文字を強調する（どの文字で絞り込まれたかが見えるように） */
function Highlighted({ text, matches }: { text: string; matches?: number[] }) {
  if (!matches?.length) return text;
  const set = new Set(matches);
  return [...text].map((char, i) =>
    set.has(i) ? (
      <span key={i} className="font-semibold text-[var(--accent-blue)]">
        {char}
      </span>
    ) : (
      char
    ),
  );
}

/** 閉じている間は中身を作らず、開くたびに入力を空から始める */
export function QuickOpen() {
  const open = useAppStore((s) => s.quickOpenOpen);
  return open ? <QuickOpenDialog /> : null;
}

function QuickOpenDialog() {
  const { setOpen, navigateTo, searchInRepo } = useAppStore(
    useShallow((s) => ({
      setOpen: s.setQuickOpenOpen,
      navigateTo: s.navigateTo,
      searchInRepo: s.searchInRepo,
    })),
  );
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const { items, empty } = useQuickOpenItems(query);
  const active = Math.min(selected, items.length - 1);

  const close = useCallback(() => setOpen(false), [setOpen]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(dialogRef, true, close);

  // useFocusTrap が枠へ移したフォーカスを、続けて入力欄へ移す
  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => activeRef.current?.scrollIntoView({ block: 'nearest' }), [active]);

  const changeQuery = (next: string) => {
    setQuery(next);
    setSelected(0);
  };

  const choosePrefix = (prefix: string) => {
    changeQuery(prefix + parseQuery(query).term);
    inputRef.current?.focus();
  };

  const run = ({ action }: QuickOpenItem) => {
    close();
    if (action.kind === 'open') void navigateTo(action.path, { line: action.line });
    else void searchInRepo(action.text);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setSelected((active + step + items.length) % items.length);
    } else if (e.key === 'Enter') {
      // IME の変換確定の Enter で移動してしまわないようにする
      if (e.nativeEvent.isComposing) return;
      // 閉じるとフォーカスが開いたボタンへ戻るので、この Enter でボタンが押されないようにする
      e.preventDefault();
      const item = items[active];
      if (item) run(item);
    }
  };

  const currentMode = parseQuery(query).mode;

  return (
    <div
      className="fixed inset-0 flex justify-center items-start px-4"
      style={{ zIndex: 'var(--z-dialog)', paddingTop: 'max(3dvh, env(safe-area-inset-top))' }}
      onClick={close}
    >
      <div
        ref={dialogRef}
        id="quick-open-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={STRINGS.quickOpen.open}
        tabIndex={-1}
        className="flex flex-col w-full max-w-xl rounded-xl border overflow-hidden outline-none"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-card)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 h-12 shrink-0">
          <FileSearch size={18} className="shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="quick-open-results"
            aria-activedescendant={items.length > 0 ? `quick-open-${active}` : undefined}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={STRINGS.quickOpen.placeholder}
            aria-label={STRINGS.quickOpen.placeholder}
            className="flex-1 min-w-0 h-full bg-transparent outline-none text-base text-[var(--text-primary)]"
          />
        </div>

        <div
          className="flex gap-1 px-2 border-t shrink-0"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          {MODE_CHIPS.map(({ mode, prefix, label }) => (
            <button
              key={mode}
              onClick={() => choosePrefix(prefix)}
              aria-pressed={currentMode === mode}
              className={`h-11 px-3 text-xs font-medium transition-colors ${
                currentMode === mode
                  ? 'text-[var(--accent-blue)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* iPad のソフトキーボードに隠れない高さに収める */}
        {(items.length > 0 || empty) && (
          <div
            id="quick-open-results"
            role="listbox"
            aria-label={STRINGS.quickOpen.results}
            className="overflow-y-auto border-t"
            style={{ maxHeight: '40dvh', borderColor: 'var(--border-primary)' }}
          >
            {empty && <p className="px-4 py-4 text-sm text-[var(--text-muted)]">{empty}</p>}
            {items.map((item, i) => {
              const Icon = MODE_ICON[item.mode];
              return (
                <button
                  key={item.key}
                  id={`quick-open-${i}`}
                  ref={i === active ? activeRef : undefined}
                  role="option"
                  aria-selected={i === active}
                  onClick={() => run(item)}
                  className="flex items-center gap-3 w-full min-h-11 px-4 py-1.5 text-left"
                  style={{ backgroundColor: i === active ? 'var(--bg-hover)' : undefined }}
                >
                  <Icon size={16} className="shrink-0 text-[var(--text-muted)]" />
                  <span className="shrink-0 max-w-[60%] truncate-text text-[13px] text-[var(--text-primary)]">
                    <Highlighted text={item.title} matches={item.matches} />
                  </span>
                  {item.detail && (
                    <span className="min-w-0 truncate-text text-xs text-[var(--text-muted)]">
                      {item.detail}
                    </span>
                  )}
                  {item.isOpen && (
                    <span className="ml-auto shrink-0 text-xs text-[var(--text-muted)]">
                      {STRINGS.quickOpen.openBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
