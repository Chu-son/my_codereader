import { useState } from 'react';
import { Eye, EyeOff, Shield, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { STRINGS } from '@/shared/constants/strings';

export function PatSection() {
  const { pat, patRemembered, settingsOpen, setPat } = useAppStore(
    useShallow((s) => ({
      pat: s.pat,
      patRemembered: s.patRemembered,
      settingsOpen: s.settingsOpen,
      setPat: s.setPat,
    })),
  );

  const [localPat, setLocalPat] = useState(pat ?? '');
  const [showPat, setShowPat] = useState(false);
  const [remember, setRemember] = useState(patRemembered);

  // ダイアログが開かれた時、または保存済み PAT が変わった時に入力欄を同期する
  const syncedPat = settingsOpen ? (pat ?? '') : null;
  const [prevSyncedPat, setPrevSyncedPat] = useState(syncedPat);
  if (syncedPat !== prevSyncedPat) {
    setPrevSyncedPat(syncedPat);
    if (syncedPat !== null) {
      setLocalPat(syncedPat);
      setRemember(patRemembered);
    }
  }

  const handleSave = () => setPat(localPat.trim() || null, remember);

  const handleDelete = () => {
    setPat(null);
    setLocalPat('');
  };

  return (
    <section className="border-t pt-6" style={{ borderColor: 'var(--border-primary)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-[var(--accent-blue)]" />
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          GitHub Personal Access Token
        </h3>
      </div>

      <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
        {STRINGS.settings.patDescription}
      </p>

      <div className="relative mb-3">
        <input
          id="pat-input"
          type={showPat ? 'text' : 'password'}
          value={localPat}
          onChange={(e) => setLocalPat(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxx"
          aria-label="Personal Access Token"
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
          aria-label={showPat ? STRINGS.settings.patHide : STRINGS.settings.patShow}
        >
          {showPat ? (
            <EyeOff size={16} className="text-[var(--text-muted)]" />
          ) : (
            <Eye size={16} className="text-[var(--text-muted)]" />
          )}
        </button>
      </div>

      <label className="flex items-start gap-2 mb-3 text-xs text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          {STRINGS.settings.patRemember}
          <span className="block text-[var(--text-muted)]">{STRINGS.settings.patRememberRisk}</span>
        </span>
      </label>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="h-9 px-4 text-sm font-medium rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--accent-blue)', color: 'var(--bg-tertiary)' }}
        >
          {STRINGS.common.save}
        </button>
        {pat && (
          <button
            onClick={handleDelete}
            className="h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--accent-red-soft-strong)', color: 'var(--accent-red)' }}
          >
            <Trash2 size={14} />
            {STRINGS.common.delete}
          </button>
        )}
      </div>
    </section>
  );
}
