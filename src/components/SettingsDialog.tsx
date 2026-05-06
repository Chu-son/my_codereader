// ========================================
// SettingsDialog Component
// ========================================

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Shield, Trash2, Type, WrapText, AlignLeft } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { fetchRateLimit } from '@/lib/github';

export function SettingsDialog() {
  const {
    settingsOpen,
    pat,
    wordWrap,
    showIndentGuides,
    fontSize,
    setSettingsOpen,
    setPat,
    setWordWrap,
    setShowIndentGuides,
    setFontSize,
  } = useAppStore();

  const [localPat, setLocalPat] = useState(pat ?? '');
  const [showPat, setShowPat] = useState(false);
  const [rateLimit, setRateLimit] = useState<{
    remaining: number;
    limit: number;
    reset: number;
  } | null>(null);
  const [rateLimitLoading, setRateLimitLoading] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      setLocalPat(pat ?? '');
      checkRateLimit();
    }
  }, [settingsOpen, pat]);

  const checkRateLimit = async () => {
    setRateLimitLoading(true);
    try {
      const result = await fetchRateLimit(pat);
      setRateLimit(result);
    } catch {
      setRateLimit(null);
    } finally {
      setRateLimitLoading(false);
    }
  };

  const handleSavePat = () => {
    setPat(localPat.trim() || null);
  };

  const handleDeletePat = () => {
    setPat(null);
    setLocalPat('');
  };

  if (!settingsOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 animate-fade-in"
        style={{ zIndex: 'var(--z-dialog)' }}
        onClick={() => setSettingsOpen(false)}
      />

      {/* ダイアログ */}
      <div
        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:max-h-[90vh] rounded-2xl border overflow-y-auto animate-fade-in"
        style={{
          zIndex: 'var(--z-dialog)',
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        {/* ヘッダー */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b sticky top-0"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)',
            zIndex: 1,
          }}
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            設定
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          >
            <X size={18} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-5 space-y-8">
          {/* エディタ設定 セクション */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Type size={16} className="text-[var(--accent-blue)]" />
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                エディタ設定
              </h3>
            </div>

            <div className="space-y-4">
              {/* 折り返し設定 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <WrapText size={18} className="text-[var(--text-muted)]" />
                  <div>
                    <div className="text-sm text-[var(--text-primary)]">
                      文字列の折り返し
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      画面端でテキストを折り返す
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setWordWrap(!wordWrap)}
                  className={`w-12 h-6 rounded-full transition-colors relative`}
                  style={{
                    backgroundColor: wordWrap
                      ? 'var(--accent-blue)'
                      : 'var(--bg-surface)',
                  }}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      wordWrap ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* インデントガイド設定 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlignLeft size={18} className="text-[var(--text-muted)]" />
                  <div>
                    <div className="text-sm text-[var(--text-primary)]">
                      インデントガイド
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      インデント（スペース）を可視化
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowIndentGuides(!showIndentGuides)}
                  className={`w-12 h-6 rounded-full transition-colors relative`}
                  style={{
                    backgroundColor: showIndentGuides
                      ? 'var(--accent-blue)'
                      : 'var(--bg-surface)',
                  }}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      showIndentGuides ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* フォントサイズ調整 */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-primary)]">
                    フォントサイズ
                  </span>
                  <span className="text-sm font-mono text-[var(--accent-blue)]">
                    {fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[var(--bg-surface)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)]"
                />
              </div>
            </div>
          </section>

          {/* PAT セクション */}
          <section
            className="border-t pt-6"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-[var(--accent-blue)]" />
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                GitHub Personal Access Token
              </h3>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
              PATを設定するとAPIレートリミットが60→5000回/時に増加し、
              コード検索機能も利用できるようになります。
              トークンはブラウザのlocalStorageに保存されます。
            </p>

            {/* PAT入力フィールド */}
            <div className="relative mb-3">
              <input
                id="pat-input"
                type={showPat ? 'text' : 'password'}
                value={localPat}
                onChange={(e) => setLocalPat(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full h-10 px-3 pr-10 text-sm font-mono rounded-lg border outline-none transition-colors focus:border-[var(--accent-blue)]"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPat(!showPat)}
                className="absolute right-2 top-1/2 -translate-y-1/2 touch-target"
              >
                {showPat ? (
                  <EyeOff size={16} className="text-[var(--text-muted)]" />
                ) : (
                  <Eye size={16} className="text-[var(--text-muted)]" />
                )}
              </button>
            </div>

            {/* ボタン群 */}
            <div className="flex gap-2">
              <button
                onClick={handleSavePat}
                className="h-9 px-4 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--accent-blue)',
                  color: 'var(--bg-tertiary)',
                }}
              >
                保存
              </button>
              {pat && (
                <button
                  onClick={handleDeletePat}
                  className="h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  style={{
                    backgroundColor: 'rgba(243, 139, 168, 0.15)',
                    color: 'var(--accent-red)',
                  }}
                >
                  <Trash2 size={14} />
                  削除
                </button>
              )}
            </div>
          </section>

          {/* レートリミット表示 */}
          <div
            className="border-t pt-4"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
              API レートリミット
            </h3>

            {rateLimitLoading ? (
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
                      rateLimit.remaining < 10
                        ? 'text-[var(--accent-red)] font-medium'
                        : 'text-[var(--accent-green)] font-medium'
                    }
                  >
                    {rateLimit.remaining} / {rateLimit.limit}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(rateLimit.remaining / rateLimit.limit) * 100}%`,
                      backgroundColor:
                        rateLimit.remaining < 10
                          ? 'var(--accent-red)'
                          : 'var(--accent-green)',
                    }}
                  />
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  リセット:{' '}
                  {new Date(rateLimit.reset * 1000).toLocaleTimeString('ja-JP')}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                レートリミット情報を取得できませんでした
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
