import type { SliceCreator } from '../types';
import { DEFAULT_PERSISTED, sessionPat } from '../persistence';

export interface SettingsSlice {
  pat: string | null;
  patRemembered: boolean;
  wordWrap: boolean;
  showIndentGuides: boolean;
  fontSize: number;
  lineHeight: number;
  setPat: (pat: string | null, remember?: boolean) => void;
  setWordWrap: (wrap: boolean) => void;
  setShowIndentGuides: (show: boolean) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
}

export const createSettingsSlice: SliceCreator<SettingsSlice> = (set) => ({
  pat: DEFAULT_PERSISTED.pat,
  patRemembered: DEFAULT_PERSISTED.patRemembered,
  wordWrap: DEFAULT_PERSISTED.wordWrap,
  showIndentGuides: DEFAULT_PERSISTED.showIndentGuides,
  fontSize: DEFAULT_PERSISTED.fontSize,
  lineHeight: DEFAULT_PERSISTED.lineHeight,
  setPat: (pat, remember = false) => {
    sessionPat.write(pat);
    set({ pat, patRemembered: pat !== null && remember });
  },
  setWordWrap: (wordWrap) => set({ wordWrap }),
  setShowIndentGuides: (showIndentGuides) => set({ showIndentGuides }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
});
