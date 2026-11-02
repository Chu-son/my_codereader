import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '@/stores/useAppStore';
import { SettingsDialog } from './SettingsDialog';

describe('SettingsDialog', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  it('dialog として公開され、開くとフォーカスが移る', () => {
    useAppStore.setState({ settingsOpen: true });
    render(<SettingsDialog />);
    const dialog = screen.getByRole('dialog', { name: '設定' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveFocus();
  });

  it('Escape で閉じる', async () => {
    useAppStore.setState({ settingsOpen: true });
    render(<SettingsDialog />);
    await userEvent.keyboard('{Escape}');
    expect(useAppStore.getState().settingsOpen).toBe(false);
  });

  it('Tab がダイアログの外へ出ない', async () => {
    useAppStore.setState({ settingsOpen: true });
    render(<SettingsDialog />);
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 30; i++) await userEvent.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
