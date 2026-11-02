import type { StateStorage } from 'zustand/middleware';
import type { Bookmark } from '@/types';

/** 永続化する項目（ユーザー設定とユーザーデータのみ。本文・ツリー・検索結果は含めない） */
export interface PersistedState {
  pat: string | null;
  bookmarks: Bookmark[];
  recentRepos: string[];
  wordWrap: boolean;
  showIndentGuides: boolean;
  fontSize: number;
  lineHeight: number;
}

/** 永続化形式のバージョン。形を変えたら上げて migrate を追加する */
export const PERSIST_VERSION = 1;

export const DEFAULT_PERSISTED: PersistedState = {
  pat: null,
  bookmarks: [],
  recentRepos: [],
  wordWrap: true,
  showIndentGuides: true,
  fontSize: 14,
  lineHeight: 1.5,
};

export function partializeState(state: PersistedState): PersistedState {
  return {
    pat: state.pat,
    bookmarks: state.bookmarks,
    recentRepos: state.recentRepos,
    wordWrap: state.wordWrap,
    showIndentGuides: state.showIndentGuides,
    fontSize: state.fontSize,
    lineHeight: state.lineHeight,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBookmark(value: unknown): value is Bookmark {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.repo === 'string' &&
    typeof value.branch === 'string' &&
    typeof value.path === 'string' &&
    typeof value.line === 'number' &&
    typeof value.text === 'string'
  );
}

function numberInRange(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && value >= min && value <= max ? value : fallback;
}

/**
 * 保存済みデータを許可リストの項目だけに絞り、型が不正な値は既定値に戻す。
 * 旧バージョンは partialState の綴り誤りで状態全体を保存していたため、
 * 本文やツリーなどの余分な項目はここで捨てる。
 */
export function migratePersistedState(persisted: unknown): PersistedState {
  if (!isRecord(persisted)) return DEFAULT_PERSISTED;
  const d = DEFAULT_PERSISTED;
  return {
    pat: typeof persisted.pat === 'string' && persisted.pat !== '' ? persisted.pat : null,
    bookmarks: Array.isArray(persisted.bookmarks) ? persisted.bookmarks.filter(isBookmark) : [],
    recentRepos: Array.isArray(persisted.recentRepos)
      ? persisted.recentRepos.filter((r): r is string => typeof r === 'string').slice(0, 20)
      : [],
    wordWrap: typeof persisted.wordWrap === 'boolean' ? persisted.wordWrap : d.wordWrap,
    showIndentGuides:
      typeof persisted.showIndentGuides === 'boolean'
        ? persisted.showIndentGuides
        : d.showIndentGuides,
    fontSize: numberInRange(persisted.fontSize, 6, 24, d.fontSize),
    lineHeight: numberInRange(persisted.lineHeight, 1, 3, d.lineHeight),
  };
}

export const STORAGE_KEY = 'codereader:app';
const LEGACY_STORAGE_KEY = 'codereader-storage';

/**
 * 新キーが無ければ旧キーを読み、保存時に旧キーを削除する。
 * 旧データは version 0 のため、読み込み時に migrate で許可リストへ絞られる。
 */
export const storage: StateStorage = {
  getItem: (name) =>
    localStorage.getItem(name) ??
    (name === STORAGE_KEY ? localStorage.getItem(LEGACY_STORAGE_KEY) : null),
  setItem: (name, value) => {
    localStorage.setItem(name, value);
    if (name === STORAGE_KEY) localStorage.removeItem(LEGACY_STORAGE_KEY);
  },
  removeItem: (name) => localStorage.removeItem(name),
};
