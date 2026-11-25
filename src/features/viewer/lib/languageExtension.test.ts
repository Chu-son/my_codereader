import { describe, expect, it } from 'vitest';
import { languageKey } from './languageExtension';

describe('languageKey', () => {
  it('TypeScript は .tsx だけ JSX 込みの鍵にする（.ts の総称型を JSX と誤読しないため）', () => {
    expect(languageKey('typescript', 'src/a.ts')).toBe('typescript');
    expect(languageKey('typescript', 'src/App.TSX')).toBe('tsx');
    expect(languageKey('javascript', 'src/a.jsx')).toBe('javascript');
    expect(languageKey(null, 'README')).toBeNull();
  });
});
