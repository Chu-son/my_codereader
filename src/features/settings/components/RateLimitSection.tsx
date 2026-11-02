import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { fetchRateLimit } from '@/shared/lib/github';
import { isAbortError } from '@/shared/lib/githubError';

const LOW_REMAINING_THRESHOLD = 10;

interface RateLimit {
  remaining: number;
  limit: number;
  reset: number;
}

/** 開いている間だけ表示されるため、マウント時と PAT 変更時に取得し直す */
export function RateLimitSection() {
  const pat = useAppStore((s) => s.pat);
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [loading, setLoading] = useState(true);

  // PAT が変わったら取得中の表示に戻す（描画中の状態調整）
  const [prevPat, setPrevPat] = useState(pat);
  if (pat !== prevPat) {
    setPrevPat(pat);
    setLoading(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchRateLimit(pat, controller.signal)
      .then(setRateLimit)
      .catch((error) => {
        if (!isAbortError(error)) setRateLimit(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [pat]);

  const isLow = rateLimit !== null && rateLimit.remaining < LOW_REMAINING_THRESHOLD;

  return (
    <div className="border-t pt-4" style={{ borderColor: 'var(--border-primary)' }}>
      <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">API レートリミット</h3>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <div className="w-3 h-3 border border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
          確認中...
        </div>
      ) : rateLimit ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">残り</span>
            <span
              className={
                isLow
                  ? 'text-[var(--accent-red)] font-medium'
                  : 'text-[var(--accent-green)] font-medium'
              }
            >
              {rateLimit.remaining} / {rateLimit.limit}
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(rateLimit.remaining / rateLimit.limit) * 100}%`,
                backgroundColor: isLow ? 'var(--accent-red)' : 'var(--accent-green)',
              }}
            />
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            リセット: {new Date(rateLimit.reset * 1000).toLocaleTimeString('ja-JP')}
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">レートリミット情報を取得できませんでした</p>
      )}
    </div>
  );
}
