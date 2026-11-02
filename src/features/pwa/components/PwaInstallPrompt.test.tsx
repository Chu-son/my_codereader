import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PwaInstallPrompt } from './PwaInstallPrompt';

const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PwaInstallPrompt', () => {
  it('iOS のブラウザで未インストールなら案内を表示する', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(IPAD_UA);
    render(<PwaInstallPrompt />);
    expect(screen.getByText('アプリとしてインストール')).toBeInTheDocument();
  });

  it('iOS 以外では表示しない', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(DESKTOP_UA);
    render(<PwaInstallPrompt />);
    expect(screen.queryByText('アプリとしてインストール')).not.toBeInTheDocument();
  });

  it('閉じると案内を消し、次回以降も表示しない', async () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(IPAD_UA);
    const { unmount } = render(<PwaInstallPrompt />);
    await userEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(screen.queryByText('アプリとしてインストール')).not.toBeInTheDocument();

    unmount();
    render(<PwaInstallPrompt />);
    expect(screen.queryByText('アプリとしてインストール')).not.toBeInTheDocument();
  });
});
