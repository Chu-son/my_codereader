import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) throw new Error('boom');
  return <p>正常</p>;
}

describe('ErrorBoundary', () => {
  it('例外を捕捉してフォールバックを表示し、再試行で復帰する', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrow = true;
    render(
      <ErrorBoundary label="ビューア">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert').textContent).toContain('ビューアの表示中に問題が発生しました');

    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: '再試行' }));
    expect(screen.getByText('正常')).toBeTruthy();
  });
});
