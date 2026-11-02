import type { SearchResult } from '@/shared/types';
import { searchCode } from '@/shared/lib/github';
import {
  convertGitHubSearchResults,
  searchInCachedFiles,
  searchInTree,
} from '@/shared/lib/searchUtils';
import { splitRepoFullName } from '@/shared/lib/urlParser';
import type { SliceCreator } from '../types';
import { STRINGS } from '@/shared/constants/strings';

export interface SearchSlice {
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  searchInRepo: (query: string) => Promise<void>;
}

export const createSearchSlice: SliceCreator<SearchSlice> = (set, get) => ({
  searchQuery: '',
  searchResults: [],
  searchLoading: false,

  searchInRepo: async (query) => {
    const { pat, currentRepo, openedFiles, treeData } = get();
    set({ searchQuery: query, searchLoading: true, searchDrawerOpen: true });

    try {
      // 1. ファイル名検索 (常に実行)
      let results: SearchResult[] = searchInTree(query, treeData);

      if (pat && currentRepo) {
        // 2. GitHub Search Code API使用
        try {
          const repoParts = splitRepoFullName(currentRepo);
          if (!repoParts) throw new Error(STRINGS.repository.invalidRepoFormat);
          const items = await searchCode(repoParts.owner, repoParts.repo, query, pat);
          results = [...results, ...convertGitHubSearchResults(items)];
        } catch (apiError) {
          console.warn('GitHub Search API error, falling back:', apiError);
          // APIエラー時はキャッシュファイル検索へ
          results = [...results, ...searchInCachedFiles(query, openedFiles)];
        }
      } else {
        // 3. キャッシュ済みファイルから検索
        results = [...results, ...searchInCachedFiles(query, openedFiles)];
      }

      set({ searchResults: results, searchLoading: false });
    } catch (error) {
      console.error('Search error:', error);
      set({ searchLoading: false });
    }
  },
});
