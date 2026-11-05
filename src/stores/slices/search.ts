import type { OpenedFile, SearchResult } from '@/shared/types';
import { searchCode } from '@/shared/lib/github';
import {
  MAX_SEARCH_RESULTS,
  convertGitHubSearchResults,
  searchInCachedFiles,
  searchInTree,
} from '@/shared/lib/searchUtils';
import { isAbortError } from '@/shared/lib/githubError';
import { splitRepoFullName } from '@/shared/lib/urlParser';
import { currentRepoSignal } from '../repoController';
import type { AppState, SliceCreator } from '../types';
import { selectOpenPaths } from './panes';
import { STRINGS } from '@/shared/constants/strings';

export const initialSearchState = (): Pick<
  SearchSlice,
  'searchQuery' | 'searchResults' | 'searchLoading'
> => ({ searchQuery: '', searchResults: [], searchLoading: false });

/** 検索対象のキャッシュ。タブを閉じたファイルは含めない（「開いているファイル内」の意味を保つ） */
function openFiles(s: AppState): OpenedFile[] {
  return selectOpenPaths(s).flatMap((path) => {
    const file = s.files[path];
    return file ? [file] : [];
  });
}

export interface SearchSlice {
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  searchInRepo: (query: string) => Promise<void>;
}

/** 進行中の検索。新しい検索を始めたら中断する */
let searchController = new AbortController();

export const createSearchSlice: SliceCreator<SearchSlice> = (set, get) => ({
  ...initialSearchState(),

  searchInRepo: async (query) => {
    const { pat, currentRepo, treeData } = get();
    const openedFiles = openFiles(get());
    searchController.abort();
    const own = new AbortController();
    searchController = own;
    const signal = AbortSignal.any([own.signal, currentRepoSignal()]);
    set({ searchQuery: query, searchLoading: true, searchDrawerOpen: true });

    try {
      // 1. ファイル名検索 (常に実行)
      let results: SearchResult[] = searchInTree(query, treeData);

      if (pat && currentRepo) {
        // 2. GitHub Search Code API使用
        try {
          const repoParts = splitRepoFullName(currentRepo);
          if (!repoParts) throw new Error(STRINGS.repository.invalidRepoFormat);
          const items = await searchCode(repoParts.owner, repoParts.repo, query, pat, signal);
          results = [...results, ...convertGitHubSearchResults(items)];
        } catch (apiError) {
          if (isAbortError(apiError)) throw apiError;
          console.warn('GitHub Search API error, falling back:', apiError);
          // APIエラー時はキャッシュファイル検索へ
          results = [...results, ...searchInCachedFiles(query, openedFiles)];
        }
      } else {
        // 3. キャッシュ済みファイルから検索
        results = [...results, ...searchInCachedFiles(query, openedFiles)];
      }

      set({ searchResults: results.slice(0, MAX_SEARCH_RESULTS), searchLoading: false });
    } catch (error) {
      // 後続の検索に置き換わった場合、状態は新しい検索が更新する
      if (own.signal.aborted) return;
      if (isAbortError(error)) {
        // リポジトリ切替による中断。読み込み中表示だけ解除する
        set({ searchLoading: false });
        return;
      }
      console.error('Search error:', error);
      set({ searchLoading: false });
    }
  },
});
