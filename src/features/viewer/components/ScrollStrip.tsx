import { useEffect, useMemo, useRef } from 'react';
import type { EditorView } from '@codemirror/view';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { buildScrollMarkers, lineRatio } from '../lib/scrollMarkers';

interface ScrollStripProps {
  view: EditorView | null;
  filePath: string;
  lineCount: number;
}

const MARKER_COLOR = { bookmark: 'var(--accent-blue)', search: 'var(--accent-yellow)' } as const;

/**
 * エディタ右端のスクロールストリップ。表示範囲・ブックマーク・検索ヒットの位置だけを描く。
 * テキストのミニマップは iPad の幅では読めず、描画コストも大きいため作らない。
 * 目印なので操作は受け付けない（下のエディタのスクロールを妨げない）。
 */
export function ScrollStrip({ view, filePath, lineCount }: ScrollStripProps) {
  const { bookmarkLines, searchLines } = useAppStore(
    useShallow((s) => ({
      bookmarkLines: s.bookmarks
        .filter((b) => b.repo === s.currentRepo && b.path === filePath)
        .map((b) => b.line)
        .join(','),
      searchLines: s.searchResults
        .filter((r) => r.path === filePath && r.lineNumber > 0)
        .map((r) => r.lineNumber)
        .join(','),
    })),
  );
  const markers = useMemo(
    () => buildScrollMarkers(lineCount, toLines(bookmarkLines), toLines(searchLines)),
    [lineCount, bookmarkLines, searchLines],
  );
  const thumbRef = useRef<HTMLDivElement>(null);

  // 表示範囲は store を通さず DOM を直接更新する（スクロールのたびに再描画しないため）
  useEffect(() => {
    const scroller = view?.scrollDOM;
    const thumb = thumbRef.current;
    if (!scroller || !thumb) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      const visible = scrollHeight > clientHeight;
      thumb.style.display = visible ? 'block' : 'none';
      if (!visible) return;
      thumb.style.top = `${(scrollTop / scrollHeight) * 100}%`;
      thumb.style.height = `${(clientHeight / scrollHeight) * 100}%`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(onScroll);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [view]);

  return (
    <div
      aria-hidden
      className="absolute top-0 right-0 bottom-0 w-2 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <div
        ref={thumbRef}
        className="absolute left-0 right-0 rounded-sm"
        style={{ backgroundColor: 'var(--bg-hover)', opacity: 0.6, display: 'none' }}
      />
      {markers.map(({ line, kind }) => (
        <div
          key={line}
          className="absolute left-0 right-0 h-[3px] rounded-sm"
          style={{
            top: `calc(${lineRatio(line, lineCount) * 100}% - 1px)`,
            backgroundColor: MARKER_COLOR[kind],
          }}
        />
      ))}
    </div>
  );
}

// セレクタで配列を返すと毎回別物になるため、文字列で受けてここで戻す
const toLines = (joined: string) => (joined ? joined.split(',').map(Number) : []);
