import { useState } from 'react';

const DISMISSED_KEY = 'codereader:pwa-prompt-dismissed';

// iOS の Safari かつ未インストールで、まだ閉じられていない場合のみ案内を表示する
function shouldShowPrompt(): boolean {
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  // standalone は iOS Safari 独自のプロパティで、標準の型定義に無い
  const isStandalone =
    'standalone' in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIos && !isStandalone && !localStorage.getItem(DISMISSED_KEY);
}

/** インストール案内の表示状態。閉じた事実は localStorage に残し、次回以降は表示しない */
export function usePwaPrompt(): { showPrompt: boolean; dismiss: () => void } {
  const [showPrompt, setShowPrompt] = useState(shouldShowPrompt);

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  return { showPrompt, dismiss };
}
