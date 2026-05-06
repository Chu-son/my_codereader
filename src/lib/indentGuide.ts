import {
  Decoration,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';

/**
 * 行頭のインデント（スペース/タブ）を階層別に色分けして可視化するCodeMirror拡張
 */
export function indentGuideExtension() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.getDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.getDecorations(update.view);
        }
      }

      getDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const unit = view.state.facet(indentUnit).length || 2;

        for (const { from, to } of view.visibleRanges) {
          for (let pos = from; pos < to; ) {
            const line = view.state.doc.lineAt(pos);
            const text = line.text;
            const match = text.match(/^([ \t]+)/);

            if (match) {
              const whitespace = match[1];
              let currentPos = line.from;

              for (let i = 0; i < whitespace.length; i++) {
                // インデントレベルの計算 (0-indexed)
                const level = Math.floor(i / unit);
                // 1-4のループ (赤, 青, 黄, 緑)
                const colorIndex = (level % 4) + 1;

                const deco = Decoration.mark({
                  class: `cm-indent-marker cm-indent-level-${colorIndex}`,
                });
                
                builder.add(currentPos, currentPos + 1, deco);
                currentPos += 1;
              }
            }
            pos = line.to + 1;
          }
        }
        return builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
