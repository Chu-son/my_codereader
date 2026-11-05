import { useSyncExternalStore } from 'react';

/** CSS の `portrait:` バリアント（Tailwind）と同じ条件で判定する */
const PORTRAIT_QUERY = '(orientation: portrait)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(PORTRAIT_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

const getSnapshot = () => window.matchMedia(PORTRAIT_QUERY).matches;

/** 画面が縦向きか。配置の切り替え（パネルをドロワーにする等）にだけ使う */
export function useIsPortrait(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
