import { useState } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

const DISMISSED_KEY = 'codereader:pwa-prompt-dismissed';

// iOS の Safari かつ未インストールで、まだ閉じられていない場合のみ案内を表示する
function shouldShowPrompt(): boolean {
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isStandalone =
    'standalone' in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIos && !isStandalone && !localStorage.getItem(DISMISSED_KEY);
}

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(shouldShowPrompt);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-800 text-zinc-200 px-4 py-3 rounded-xl shadow-lg border border-zinc-700/50 max-w-[90vw] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex-1 text-sm flex flex-col gap-1">
        <p className="font-semibold text-zinc-100">アプリとしてインストール</p>
        <p className="text-zinc-400 text-xs flex items-center gap-1 flex-wrap">
          ブラウザの共有アイコン <Share size={14} className="inline-block" />{' '}
          から「ホーム画面に追加」
          <PlusSquare size={14} className="inline-block" />{' '}
          を選択すると、フルスクリーンで快適に利用できます。
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
