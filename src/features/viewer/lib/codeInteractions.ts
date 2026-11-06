import { Prec, type EditorState, type Extension } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { trackPress } from './pointerGestures';

/** メニューを出す基準の矩形（画面座標） */
export interface Anchor {
  left: number;
  top: number;
  bottom: number;
}

export interface TappedWord {
  text: string;
  from: number;
}

/** 本文の上に出すもの。浮かぶ UI は常に 1 つだけにする（重なって読めなくなるのを防ぐ） */
export type CodePopup =
  | { kind: 'line'; line: number; anchor: Anchor }
  | { kind: 'word'; word: TappedWord; anchor: Anchor }
  | { kind: 'selection'; text: string; x: number; y: number }
  | { kind: 'references'; word: string; line: number };

export interface SelectionInfo {
  text: string;
  x: number;
  y: number;
}

/** 選択として検索ボタンを出す長さの上限（長い選択は検索語にならないため） */
const SELECTION_MAX_LENGTH = 100;

export interface CodeInteractionHandlers {
  /** カーソル行が変わった（ブックマークの対象行・現在地の記録に使う） */
  onCursorLine: (line: number) => void;
  /** 範囲選択が変わった。選択が空・長すぎるときは null */
  onSelection: (selection: SelectionInfo | null) => void;
  /** 行番号をタップ・長押しした */
  onLineMenu: (line: number, anchor: Anchor) => void;
  onWordTap: (word: TappedWord, anchor: Anchor) => void;
  /** 構文木が変わった（言語パックの読込・解析の進行）。シンボルの作り直しに使う */
  onTreeChange: () => void;
}

const NOOP_HANDLERS: CodeInteractionHandlers = {
  onCursorLine: () => {},
  onSelection: () => {},
  onLineMenu: () => {},
  onWordTap: () => {},
  onTreeChange: () => {},
};

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
/** 識別子にあたる構文ノード名（各 lezer 文法で共通する部分）。キーワード・文字列・コメントは除く */
const IDENTIFIER_NODE = /Name|Definition|Identifier/;

function isIdentifierAt(state: EditorState, pos: number, text: string): boolean {
  if (!IDENTIFIER.test(text)) return false;
  const tree = syntaxTree(state);
  // 言語パックが無いファイルは、字面が識別子なら対象にする
  if (tree.length === 0) return true;
  return IDENTIFIER_NODE.test(tree.resolveInner(pos, 1).name);
}

/** タップ位置の単語。行末より右など、文字の上でないところは null */
function wordAtPoint(view: EditorView, x: number, y: number): (TappedWord & Anchor) | null {
  const pos = view.posAtCoords({ x, y });
  if (pos === null) return null;
  const range = view.state.wordAt(pos);
  if (!range) return null;
  const start = view.coordsAtPos(range.from);
  const end = view.coordsAtPos(range.to);
  if (!start || !end || x < start.left || x > end.right) return null;
  const text = view.state.sliceDoc(range.from, range.to);
  if (!isIdentifierAt(view.state, range.from, text)) return null;
  return { text, from: range.from, left: start.left, top: start.top, bottom: start.bottom };
}

/**
 * 行番号のタップ・長押し、単語のタップ、選択・カーソル、構文木の更新を拾う拡張。
 * ハンドラは setHandlers で差し替える（描画のたびに拡張を作り直すと、エディタが再構成されてちらつくため）。
 * 行番号は basicSetup のものを外し、ここで入れ直す（イベントを受けるため）。
 * Prec.high で折りたたみ欄より前（左）に置く。
 */
export function createCodeInteractions(): {
  extension: Extension;
  setHandlers: (handlers: CodeInteractionHandlers) => void;
} {
  let current: CodeInteractionHandlers = NOOP_HANDLERS;
  const getHandlers = () => current;
  const extension: Extension = [
    Prec.high(
      lineNumbers({
        domEventHandlers: {
          pointerdown: (view, block, event) => {
            if (!(event instanceof PointerEvent)) return false;
            const open = () => {
              const rect = view.contentDOM.getBoundingClientRect();
              const top = view.documentTop + block.top;
              getHandlers().onLineMenu(view.state.doc.lineAt(block.from).number, {
                left: rect.left,
                top,
                bottom: top + block.height,
              });
            };
            // 長押しが分からない人のため、タップでも同じメニューを開く（ジェスチャーには代替を用意する規約）
            trackPress(event, { onLongPress: open, onTap: open });
            return false;
          },
          // 長押しで出る OS のメニュー（コピー・調べる）を抑える
          contextmenu: () => true,
        },
      }),
    ),
    EditorView.domEventHandlers({
      pointerdown: (event, view) => {
        trackPress(event, {
          onTap: (up) => {
            // 範囲選択の操作中は選択のボタンに任せる
            if (!view.state.selection.main.empty) return;
            const word = wordAtPoint(view, up.clientX, up.clientY);
            if (word) getHandlers().onWordTap({ text: word.text, from: word.from }, word);
          },
        });
        return false;
      },
    }),
    EditorView.updateListener.of((update) => {
      if (syntaxTree(update.startState) !== syntaxTree(update.state)) {
        getHandlers().onTreeChange();
      }
      if (!update.selectionSet) return;
      const main = update.state.selection.main;
      const line = update.state.doc.lineAt(main.head).number;
      const text = main.empty ? '' : update.state.sliceDoc(main.from, main.to).trim();
      const coords =
        text && text.length < SELECTION_MAX_LENGTH ? update.view.coordsAtPos(main.to) : null;
      // CodeMirror の更新サイクルの外で React の state を更新する
      setTimeout(() => {
        getHandlers().onCursorLine(line);
        getHandlers().onSelection(coords ? { text, x: coords.left, y: coords.top } : null);
      }, 0);
    }),
  ];
  return {
    extension,
    setHandlers: (handlers) => {
      current = handlers;
    },
  };
}
