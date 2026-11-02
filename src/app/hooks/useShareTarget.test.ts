import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useShareTarget } from './useShareTarget';

function setSearch(search: string) {
  window.history.replaceState({}, '', `/${search}`);
}

afterEach(() => setSearch(''));

describe('useShareTarget', () => {
  it('url パラメータの GitHub URL を読み込み、パラメータを消す', () => {
    setSearch('?url=https://github.com/facebook/react/tree/main/src');
    const load = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useShareTarget(load));
    expect(load).toHaveBeenCalledWith('facebook/react');
    expect(window.location.search).toBe('');
  });

  it('text に URL 以外の文字が混ざっていても URL 部分を使い、.git を除く', () => {
    setSearch(`?text=${encodeURIComponent('見て https://github.com/vuejs/core.git よろしく')}`);
    const load = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useShareTarget(load));
    expect(load).toHaveBeenCalledWith('vuejs/core');
  });

  it('GitHub の URL でなければ何もしない', () => {
    setSearch('?url=https://example.com/a/b');
    const load = vi.fn();
    renderHook(() => useShareTarget(load));
    expect(load).not.toHaveBeenCalled();
  });
});
