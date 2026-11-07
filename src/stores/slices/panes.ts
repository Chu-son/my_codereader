import type {
  HistoryEntry,
  JumpTarget,
  PaneId,
  PeekEntry,
  PeekState,
  ViewState,
} from '@/shared/types';
import { isBinaryFile } from '@/shared/lib/fileUtils';
import { pushJump, recordLocation, type HistoryCursor } from '@/shared/lib/navigationHistory';
import type { AppState, SliceCreator } from '../types';

export interface PaneState {
  /** タブの並び（パス）。本文は files スライスが持つ */
  tabs: string[];
  active: string | null;
}

export type SplitDirection = 'horizontal' | 'vertical';

export interface NavigateOptions {
  /** 指定すると、その行へジャンプする */
  line?: number;
  /** 省略時は操作中のペイン。分割していなければ常に 1 */
  pane?: PaneId;
}

/** ペインの配置・タブ・表示状態・ジャンプ履歴。ファイル本文のキャッシュは files スライス */
export interface PanesSlice {
  panes: Record<PaneId, PaneState>;
  /** 操作中のペイン。ツリーや検索から開く先、ブックマークの対象になる */
  focusedPane: PaneId;
  isSplitView: boolean;
  splitDirection: SplitDirection;
  /** キーは viewKey(pane, path)。同じファイルでもペインごとに独立させる */
  viewState: Record<string, ViewState>;
  history: HistoryEntry[];
  historyIndex: number;
  jumpTarget: JumpTarget | null;
  /** Peek。履歴とタブには積まない（覗くだけで、読んでいる場所は動かさないため） */
  peek: PeekState | null;
  /** 本文から Peek を開く。前の Peek の道筋は捨てて、この定義から始める */
  openPeek: (pane: PaneId, entry: PeekEntry) => void;
  /** Peek の中の定義をたどる（道筋に積む） */
  pushPeek: (entry: PeekEntry) => void;
  /** パンくずで道筋の途中へ戻る */
  popPeekTo: (index: number) => void;
  /** 開いている Peek を閉じる・閉じた Peek を開き直す */
  setPeekVisible: (visible: boolean) => void;
  /** 履歴に積んで移動する。ブックマーク・検索・ツリー・定義ジャンプはすべてここを通る */
  navigateTo: (path: string, options?: NavigateOptions) => Promise<void>;
  navigateBack: () => void;
  navigateForward: () => void;
  /** 軌跡バー・履歴一覧から、履歴の任意の位置へ移る */
  goToHistory: (index: number) => void;
  /**
   * 操作中でない側のペインに開く（定義を見ながら元のコードを読み続けるため）。
   * 分割していなければ direction の向きで分割を始める
   */
  openInOtherPane: (path: string, options?: OtherPaneOptions) => Promise<void>;
  /** タブを隣のペインへ移す（タブ一覧での振り分け）。分割していなければ分割を始める */
  moveToOtherPane: (from: PaneId, path: string, direction?: SplitDirection) => void;
  /** タブの切替。履歴には積まない */
  setActiveFile: (pane: PaneId, path: string) => void;
  closeFile: (pane: PaneId, path: string) => void;
  focusPane: (pane: PaneId) => void;
  /** preferred は分割を始めるときの向き（縦向きの画面では上下が自然なため、呼び出し側が渡す） */
  toggleSplitView: (preferred?: SplitDirection) => void;
  toggleSplitDirection: () => void;
  updateScrollTop: (pane: PaneId, path: string, scrollTop: number) => void;
  setCursorLine: (pane: PaneId, path: string, line: number) => void;
  clearJumpTarget: () => void;
}

export interface OtherPaneOptions {
  line?: number;
  /** 分割していないときに始める向き */
  direction?: SplitDirection;
}

export const viewKey = (pane: PaneId, path: string) => `${pane}:${path}`;

const emptyPane = (): PaneState => ({ tabs: [], active: null });

export const initialPanesState = (): Pick<
  PanesSlice,
  | 'panes'
  | 'focusedPane'
  | 'isSplitView'
  | 'splitDirection'
  | 'viewState'
  | 'history'
  | 'historyIndex'
  | 'jumpTarget'
  | 'peek'
> => ({
  panes: { 1: emptyPane(), 2: emptyPane() },
  focusedPane: 1,
  isSplitView: false,
  splitDirection: 'horizontal',
  viewState: {},
  history: [],
  historyIndex: -1,
  jumpTarget: null,
  peek: null,
});

/** 操作中のペインで表示しているファイルと行（履歴に記録する現在地） */
export function selectCurrentLocation(s: AppState): HistoryEntry | null {
  const pane = s.focusedPane;
  const path = s.panes[pane].active;
  if (!path) return null;
  const cursorLine = s.viewState[viewKey(pane, path)]?.cursorLine;
  if (cursorLine !== undefined) return { path, pane, line: cursorLine };
  // まだ描画されずカーソル行が分からない間は、履歴にあるジャンプ先の行を現在地とみなす
  const head = s.history[s.historyIndex];
  const line = head && head.path === path && head.pane === pane ? head.line : 1;
  return { path, pane, line };
}

const cursorOf = (s: AppState): HistoryCursor => ({ history: s.history, index: s.historyIndex });

export const selectCanGoBack = (s: AppState) =>
  recordLocation(cursorOf(s), selectCurrentLocation(s)).index > 0;

export const selectCanGoForward = (s: AppState) => s.historyIndex < s.history.length - 1;

/** 操作中のペインのアクティブなファイル */
export const selectFocusedPath = (s: AppState) => s.panes[s.focusedPane].active;

/** 両ペインのタブの和集合（「開いているファイル」） */
export function selectOpenPaths(s: AppState): string[] {
  return [...new Set([...s.panes[1].tabs, ...s.panes[2].tabs])];
}

const otherPane = (pane: PaneId): PaneId => (pane === 1 ? 2 : 1);

const samePlace = (a: HistoryEntry, b: HistoryEntry | null) =>
  !!b && a.path === b.path && a.pane === b.pane;

function withTab(pane: PaneState, path: string): PaneState {
  return { tabs: pane.tabs.includes(path) ? pane.tabs : [...pane.tabs, path], active: path };
}

export const createPanesSlice: SliceCreator<PanesSlice> = (set, get) => {
  /** 分割を解除した後の履歴は pane 2 を指し得るため、表示先を補正する */
  const resolvePane = (pane: PaneId): PaneId => (get().isSplitView ? pane : 1);

  /** 場所を表示する（タブを足してアクティブにし、必要なら行へジャンプ、本文を取得） */
  const show = async (entry: HistoryEntry, jump: boolean) => {
    const pane = resolvePane(entry.pane);
    set((s) => ({
      panes: { ...s.panes, [pane]: withTab(s.panes[pane], entry.path) },
      focusedPane: pane,
      jumpTarget: jump
        ? { path: entry.path, line: entry.line, pane, timestamp: Date.now() }
        : s.jumpTarget,
    }));
    await get().ensureFile(entry.path);
  };

  const moveInHistory = (delta: -1 | 1) => {
    const s = get();
    const cursor = recordLocation(cursorOf(s), selectCurrentLocation(s));
    const target = cursor.history[cursor.index + delta];
    if (!target) {
      set({ history: cursor.history, historyIndex: cursor.index });
      return;
    }
    set({ history: cursor.history, historyIndex: cursor.index + delta });
    void show(target, true);
  };

  /** 分割していなければ、pane 2 を空にして分割を始める */
  const ensureSplit = (direction: SplitDirection) => {
    if (get().isSplitView) return;
    set((s) => ({
      isSplitView: true,
      splitDirection: direction,
      panes: { ...s.panes, 2: emptyPane() },
    }));
  };

  return {
    ...initialPanesState(),

    navigateTo: async (path, options = {}) => {
      if (isBinaryFile(path)) return;
      const s = get();
      const pane = s.isSplitView ? (options.pane ?? s.focusedPane) : 1;
      const hasLine = options.line !== undefined && options.line > 0;
      const line = hasLine
        ? (options.line ?? 1)
        : (s.viewState[viewKey(pane, path)]?.cursorLine ?? 1);
      const entry: HistoryEntry = { path, line, pane };
      const cursor = pushJump(
        recordLocation(cursorOf(s), selectCurrentLocation(s)),
        entry,
        hasLine,
      );
      set({ history: cursor.history, historyIndex: cursor.index });
      await show(entry, hasLine);
    },

    navigateBack: () => moveInHistory(-1),
    navigateForward: () => moveInHistory(1),

    goToHistory: (index) => {
      const s = get();
      const target = s.history[index];
      if (!target) return;
      if (index === s.historyIndex) {
        void show(target, true);
        return;
      }
      const current = selectCurrentLocation(s);
      const head = s.history[s.historyIndex];
      // 先へ進むときに履歴外の現在地を積むと、進む側（タップした項目）が切り捨てられるため、
      // 先頭と同じ場所で行が変わっただけのときに限って記録する
      const cursor =
        index < s.historyIndex || (head && samePlace(head, current))
          ? recordLocation(cursorOf(s), current)
          : cursorOf(s);
      // 記録で先頭が置き換わったり上限で古い項目が落ちたりしても、項目の同一性で位置を引き直す
      const nextIndex = cursor.history.indexOf(target);
      set({ history: cursor.history, historyIndex: nextIndex < 0 ? cursor.index : nextIndex });
      if (nextIndex >= 0) void show(target, true);
    },

    openInOtherPane: async (path, options = {}) => {
      const s = get();
      const target = s.isSplitView ? otherPane(s.focusedPane) : 2;
      ensureSplit(options.direction ?? 'horizontal');
      await get().navigateTo(path, { line: options.line, pane: target });
    },

    moveToOtherPane: (from, path, direction = 'horizontal') => {
      if (!get().isSplitView && from === 2) return;
      ensureSplit(direction);
      const to = otherPane(from);
      get().closeFile(from, path);
      get().setActiveFile(to, path);
    },

    setActiveFile: (pane, path) => {
      set((s) => ({
        panes: { ...s.panes, [pane]: withTab(s.panes[pane], path) },
        focusedPane: pane,
      }));
    },

    // 本文のキャッシュは消さない（履歴で戻ったときに再取得しないため）
    closeFile: (pane, path) => {
      set((s) => {
        const current = s.panes[pane];
        const idx = current.tabs.indexOf(path);
        if (idx < 0) return s;
        const tabs = current.tabs.filter((p) => p !== path);
        const active =
          current.active === path ? (tabs[Math.min(idx, tabs.length - 1)] ?? null) : current.active;
        return { panes: { ...s.panes, [pane]: { tabs, active } } };
      });
    },

    focusPane: (pane) => set({ focusedPane: resolvePane(pane) }),

    // 分割なし -> preferred の向き -> もう一方の向き -> 分割なし の順に切り替える。
    // 分割中に画面を回転しても向きは変えない（ユーザーが選んだ向きを上書きしない）
    toggleSplitView: (preferred = 'horizontal') => {
      set((s) => {
        if (!s.isSplitView) {
          const active = s.panes[1].active;
          return {
            isSplitView: true,
            splitDirection: preferred,
            panes: { ...s.panes, 2: active ? { tabs: [active], active } : emptyPane() },
          };
        }
        if (s.splitDirection === preferred) {
          return { splitDirection: preferred === 'horizontal' ? 'vertical' : 'horizontal' };
        }
        return {
          isSplitView: false,
          panes: { ...s.panes, 2: emptyPane() },
          focusedPane: 1,
          // 消えるペインの Peek は残ったペインに出す
          peek: s.peek && { ...s.peek, pane: 1 },
        };
      });
    },

    toggleSplitDirection: () => {
      set((s) => ({
        splitDirection: s.splitDirection === 'horizontal' ? 'vertical' : 'horizontal',
      }));
    },

    updateScrollTop: (pane, path, scrollTop) => {
      const key = viewKey(pane, path);
      set((s) => ({
        viewState: {
          ...s.viewState,
          [key]: { cursorLine: s.viewState[key]?.cursorLine ?? 1, scrollTop },
        },
      }));
    },

    setCursorLine: (pane, path, line) => {
      const key = viewKey(pane, path);
      set((s) => ({
        viewState: {
          ...s.viewState,
          [key]: { scrollTop: s.viewState[key]?.scrollTop ?? 0, cursorLine: line },
        },
      }));
    },

    clearJumpTarget: () => set({ jumpTarget: null }),

    openPeek: (pane, entry) => {
      set({ peek: { pane: resolvePane(pane), stack: [entry], visible: true } });
      void get().ensureFile(entry.path);
    },

    pushPeek: (entry) => {
      const { peek } = get();
      if (!peek) return;
      const top = peek.stack.at(-1);
      if (top && top.path === entry.path && top.line === entry.line) return;
      set({ peek: { ...peek, stack: [...peek.stack, entry], visible: true } });
      void get().ensureFile(entry.path);
    },

    popPeekTo: (index) => {
      const { peek } = get();
      if (!peek || index < 0 || index >= peek.stack.length) return;
      set({ peek: { ...peek, stack: peek.stack.slice(0, index + 1) } });
    },

    setPeekVisible: (visible) => {
      const { peek } = get();
      if (peek && peek.visible !== visible) set({ peek: { ...peek, visible } });
    },
  };
};
