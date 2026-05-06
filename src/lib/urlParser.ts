// ========================================
// GitHub URL Parser Utility
// ========================================

/**
 * GitHubのURLまたは 'owner/repo' 形式の文字列をパースして
 * リポジトリ情報、ブランチ、ファイルパスを抽出します。
 */
export function parseRepoInput(input: string) {
  const trimmed = input.trim();
  
  // 1. owner/repo 形式 (例: vuejs/core)
  const ownerRepoRegex = /^([a-zA-Z0-9-._]+)\/([a-zA-Z0-9-._]+)$/;
  const match = trimmed.match(ownerRepoRegex);
  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
      branch: undefined,
      filePath: undefined,
    };
  }

  // 2. URL 形式 (例: https://github.com/vuejs/core/tree/main/src)
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (url.hostname !== 'github.com') return null;

    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) return null;

    const owner = pathParts[0];
    const repo = pathParts[1].replace(/\.git$/, '');
    let branch: string | undefined = undefined;
    let filePath: string | undefined = undefined;

    // tree/branch または blob/branch 形式
    if (pathParts.length >= 4 && (pathParts[2] === 'tree' || pathParts[2] === 'blob')) {
      branch = pathParts[3];
      if (pathParts.length > 4) {
        filePath = pathParts.slice(4).join('/');
      }
    }

    return { owner, repo, branch, filePath };
  } catch {
    return null;
  }
}
