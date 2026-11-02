import { X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { EditorSettingsSection } from './EditorSettingsSection';
import { PatSection } from './PatSection';
import { RateLimitSection } from './RateLimitSection';

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen } = useAppStore(
    useShallow((s) => ({ settingsOpen: s.settingsOpen, setSettingsOpen: s.setSettingsOpen })),
  );

  if (!settingsOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 animate-fade-in"
        style={{ zIndex: 'var(--z-dialog)' }}
        onClick={() => setSettingsOpen(false)}
      />

      <div
        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:max-h-[90vh] rounded-2xl border overflow-y-auto animate-fade-in"
        style={{
          zIndex: 'var(--z-dialog)',
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b sticky top-0"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)',
            zIndex: 1,
          }}
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">設定</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            aria-label="閉じる"
          >
            <X size={18} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-5 space-y-8">
          <EditorSettingsSection />
          <PatSection />
          <RateLimitSection />
        </div>
      </div>
    </>
  );
}
