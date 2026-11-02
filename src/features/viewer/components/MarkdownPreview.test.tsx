import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownPreview } from './MarkdownPreview';

describe('MarkdownPreview', () => {
  it('script / イベントハンドラ / javascript: リンクを除去する', () => {
    const md = [
      '<script>window.__x = 1</script>',
      '<img src="x" onerror="window.__x = 2">',
      '[click](javascript:alert(1))',
    ].join('\n\n');
    const { container } = render(<MarkdownPreview content={md} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.querySelector('a')?.getAttribute('href') ?? '').not.toContain('javascript:');
  });

  it('コードブロックのシンタックスハイライトは維持する', () => {
    const { container } = render(<MarkdownPreview content={'```js\nconst a = 1;\n```'} />);
    expect(container.querySelector('.hljs-keyword')).not.toBeNull();
  });
});
