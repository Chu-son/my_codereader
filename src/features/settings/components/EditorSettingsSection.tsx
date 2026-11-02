import { AlignLeft, RotateCcw, Type, WrapText } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { ToggleSwitch } from '@/shared/ui/ToggleSwitch';

const DEFAULT_FONT_SIZE = 14;
const DEFAULT_LINE_HEIGHT = 1.5;
const RANGE_CLASS =
  'w-full h-1.5 bg-[var(--bg-surface)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)]';

export function EditorSettingsSection() {
  const {
    wordWrap,
    showIndentGuides,
    fontSize,
    lineHeight,
    setWordWrap,
    setShowIndentGuides,
    setFontSize,
    setLineHeight,
  } = useAppStore(
    useShallow((s) => ({
      wordWrap: s.wordWrap,
      showIndentGuides: s.showIndentGuides,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      setWordWrap: s.setWordWrap,
      setShowIndentGuides: s.setShowIndentGuides,
      setFontSize: s.setFontSize,
      setLineHeight: s.setLineHeight,
    })),
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Type size={16} className="text-[var(--accent-blue)]" />
          <h3 className="text-sm font-medium text-[var(--text-primary)]">エディタ設定</h3>
        </div>
        <button
          onClick={() => {
            setFontSize(DEFAULT_FONT_SIZE);
            setLineHeight(DEFAULT_LINE_HEIGHT);
          }}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-md transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
        >
          <RotateCcw size={12} />
          初期化
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WrapText size={18} className="text-[var(--text-muted)]" />
            <div>
              <div className="text-sm text-[var(--text-primary)]">文字列の折り返し</div>
              <div className="text-xs text-[var(--text-muted)]">画面端でテキストを折り返す</div>
            </div>
          </div>
          <ToggleSwitch checked={wordWrap} onChange={setWordWrap} label="文字列の折り返し" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlignLeft size={18} className="text-[var(--text-muted)]" />
            <div>
              <div className="text-sm text-[var(--text-primary)]">インデントガイド</div>
              <div className="text-xs text-[var(--text-muted)]">インデント（スペース）を可視化</div>
            </div>
          </div>
          <ToggleSwitch
            checked={showIndentGuides}
            onChange={setShowIndentGuides}
            label="インデントガイド"
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-primary)]">フォントサイズ</span>
            <span className="text-sm font-mono text-[var(--accent-blue)]">{fontSize}px</span>
          </div>
          <input
            type="range"
            min="6"
            max="24"
            step="1"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            aria-label="フォントサイズ"
            className={RANGE_CLASS}
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-primary)]">行間サイズ</span>
            <span className="text-sm font-mono text-[var(--accent-blue)]">
              {lineHeight.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.1"
            value={lineHeight}
            onChange={(e) => setLineHeight(parseFloat(e.target.value))}
            aria-label="行間サイズ"
            className={RANGE_CLASS}
          />
        </div>
      </div>
    </section>
  );
}
