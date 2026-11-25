import { describe, expect, it } from 'vitest';
import { parseRepoInput, splitRepoFullName, toGitHubLineUrl } from './urlParser';

describe('parseRepoInput', () => {
  it('owner/repo 形式を解析する', () => {
    expect(parseRepoInput('vuejs/core')).toEqual({
      owner: 'vuejs',
      repo: 'core',
      branch: undefined,
      filePath: undefined,
    });
  });

  it('前後の空白を無視する', () => {
    expect(parseRepoInput('  vuejs/core  ')?.repo).toBe('core');
  });

  it('owner/repo 形式の .git 接尾辞を取り除く', () => {
    expect(parseRepoInput('vuejs/core.git')?.repo).toBe('core');
  });

  it('GitHub の URL からブランチとファイルパスを取り出す', () => {
    expect(parseRepoInput('https://github.com/vuejs/core/tree/main/packages/vue/src')).toEqual({
      owner: 'vuejs',
      repo: 'core',
      branch: 'main',
      filePath: 'packages/vue/src',
    });
  });

  it('blob の URL も解析する', () => {
    const parsed = parseRepoInput('https://github.com/vuejs/core/blob/dev/README.md');
    expect(parsed).toMatchObject({ branch: 'dev', filePath: 'README.md' });
  });

  it('スキームの無い github.com の URL を受け付ける', () => {
    expect(parseRepoInput('github.com/vuejs/core')).toMatchObject({ owner: 'vuejs', repo: 'core' });
  });

  it('URL の .git 接尾辞を取り除く', () => {
    expect(parseRepoInput('https://github.com/vuejs/core.git')?.repo).toBe('core');
  });

  it('tree/blob 以外のパスではブランチを設定しない', () => {
    const parsed = parseRepoInput('https://github.com/vuejs/core/issues/1');
    expect(parsed?.branch).toBeUndefined();
    expect(parsed?.filePath).toBeUndefined();
  });

  it.each([
    ['空文字', ''],
    ['repo の無い文字列', 'vuejs'],
    ['github.com 以外の URL', 'https://gitlab.com/vuejs/core'],
    ['owner だけの URL', 'https://github.com/vuejs'],
    ['不正な文字を含む文字列', 'a b/c'],
  ])('%s は null を返す', (_label, input) => {
    expect(parseRepoInput(input)).toBeNull();
  });
});

describe('splitRepoFullName', () => {
  it('owner と repo に分解する', () => {
    expect(splitRepoFullName('vuejs/core')).toEqual({ owner: 'vuejs', repo: 'core' });
  });

  it.each(['', 'vuejs', 'vuejs/', '/core'])('%j は null を返す', (input) => {
    expect(splitRepoFullName(input)).toBeNull();
  });
});

describe('toGitHubLineUrl', () => {
  it('ブランチ付きの行 URL を作り、パスの区切りは残してエンコードする', () => {
    expect(toGitHubLineUrl('vuejs/core', 'feat/x', 'src/a b.ts', 12)).toBe(
      'https://github.com/vuejs/core/blob/feat/x/src/a%20b.ts#L12',
    );
  });

  it('作った URL は parseRepoInput で元に戻せる', () => {
    const parsed = parseRepoInput(toGitHubLineUrl('vuejs/core', 'main', 'src/index.ts', 3));
    expect(parsed).toMatchObject({ owner: 'vuejs', repo: 'core', branch: 'main' });
  });
});
