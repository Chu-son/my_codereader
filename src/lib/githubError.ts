export type GitHubErrorKind =
  | 'rate_limit'
  | 'not_found'
  | 'unauthorized'
  | 'network'
  | 'invalid_response'
  | 'too_large'
  | 'unknown';

const MESSAGES: Record<GitHubErrorKind, string> = {
  rate_limit: 'GitHub API のレート制限に達しました。時間をおくか、設定でPATを登録してください。',
  not_found: '見つかりません。リポジトリ・ブランチ・パスが存在しないか、非公開の可能性があります。',
  unauthorized: 'PAT が無効です。設定で確認してください。',
  network: '通信に失敗しました。ネットワークを確認して再試行してください。',
  invalid_response: 'GitHub から想定外の応答が返りました。',
  too_large: 'ファイルが大きすぎるため表示できません。',
  unknown: 'GitHub API でエラーが発生しました。',
};

/** 正規化した GitHub API エラー。メッセージに PAT やヘッダーは含めない */
export class GitHubError extends Error {
  readonly kind: GitHubErrorKind;
  readonly status?: number;
  /** rate_limit のとき、制限が解除される時刻（epoch 秒） */
  readonly resetAt?: number;

  constructor(kind: GitHubErrorKind, options: { status?: number; resetAt?: number } = {}) {
    super(MESSAGES[kind]);
    this.name = 'GitHubError';
    this.kind = kind;
    this.status = options.status;
    this.resetAt = options.resetAt;
  }
}

/** 中断(AbortController)による例外か */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** 任意の例外をユーザー向けメッセージにする */
export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof GitHubError ? error.message : fallback;
}
