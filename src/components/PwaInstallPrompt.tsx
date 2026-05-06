import { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if the user is on an iOS device
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Check if the app is running in standalone mode
    const isStandalone = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ('standalone' in window.navigator) && (window.navigator as any).standalone;
    };

    // If it's iOS and NOT running in standalone mode, show the prompt
    if (isIos() && !isStandalone()) {
      // Check local storage to see if the user already dismissed it
      const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-800 text-zinc-200 px-4 py-3 rounded-xl shadow-lg border border-zinc-700/50 max-w-[90vw] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex-1 text-sm flex flex-col gap-1">
        <p className="font-semibold text-zinc-100">アプリとしてインストール</p>
        <p className="text-zinc-400 text-xs flex items-center gap-1 flex-wrap">
          ブラウザの共有アイコン <Share size={14} className="inline-block" /> から「ホーム画面に追加」<PlusSquare size={14} className="inline-block" /> を選択すると、フルスクリーンで快適に利用できます。
        </p>
      </div>
      <button 
        onClick={handleDismiss}
        className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
        aria-label="閉じる"
      >
        <X size={18} />
      </button>
    </div>
  );
}
