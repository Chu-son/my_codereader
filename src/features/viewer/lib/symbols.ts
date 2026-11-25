import type { Text } from '@codemirror/state';
import type { SyntaxNode, Tree } from '@lezer/common';
import type { DocSymbol, SymbolKind } from '@/shared/types';

interface LanguageSymbolSpec {
  /** 宣言ノードの名前 → 種類。[種類, 必須の子ノード] は、本体を持つものだけを宣言とみなす指定 */
  decls: Record<string, SymbolKind | [SymbolKind, string]>;
  /** 宣言の名前になるノード */
  names: ReadonlySet<string>;
}

const JS: LanguageSymbolSpec = {
  decls: {
    FunctionDeclaration: 'function',
    ClassDeclaration: 'class',
    MethodDeclaration: 'method',
    PropertyDeclaration: 'property',
    InterfaceDeclaration: 'interface',
    TypeAliasDeclaration: 'type',
    EnumDeclaration: 'enum',
    VariableDeclaration: 'variable',
  },
  names: new Set([
    'VariableDefinition',
    'PropertyDefinition',
    'PrivatePropertyDefinition',
    'TypeDefinition',
  ]),
};

/**
 * 言語ごとの宣言ノードの対応。ノード名は各 lezer 文法の実物（symbols.test.ts）で確かめたもの。
 * 言語を足すときはここに 1 項目足すだけで、アウトライン・定義へ・スコープ表示のすべてに効く。
 */
const SPECS: Record<string, LanguageSymbolSpec> = {
  javascript: JS,
  typescript: JS,
  python: {
    decls: {
      FunctionDefinition: 'function',
      ClassDefinition: 'class',
      AssignStatement: 'variable',
    },
    names: new Set(['VariableName']),
  },
  go: {
    decls: {
      FunctionDecl: 'function',
      MethodDecl: 'method',
      TypeSpec: 'type',
      VarSpec: 'variable',
      ConstSpec: 'variable',
    },
    names: new Set(['DefName', 'FieldName']),
  },
  rust: {
    decls: {
      FunctionItem: 'function',
      StructItem: 'class',
      EnumItem: 'enum',
      TraitItem: 'interface',
      ImplItem: 'module',
      ModItem: 'module',
      ConstItem: 'variable',
      StaticItem: 'variable',
      TypeItem: 'type',
    },
    names: new Set(['BoundIdentifier', 'TypeIdentifier']),
  },
  java: {
    decls: {
      ClassDeclaration: 'class',
      InterfaceDeclaration: 'interface',
      EnumDeclaration: 'enum',
      RecordDeclaration: 'class',
      MethodDeclaration: 'method',
      ConstructorDeclaration: 'method',
      FieldDeclaration: 'property',
    },
    names: new Set(['Definition']),
  },
  cpp: {
    decls: {
      FunctionDefinition: 'function',
      // `struct S *p;` のような使用箇所も同じノードになるため、本体のあるものだけを拾う
      ClassSpecifier: ['class', 'FieldDeclarationList'],
      StructSpecifier: ['class', 'FieldDeclarationList'],
      EnumSpecifier: ['enum', 'EnumeratorList'],
      NamespaceDefinition: 'module',
    },
    names: new Set(['Identifier', 'TypeIdentifier', 'ScopedIdentifier', 'FieldIdentifier']),
  },
};

/** 名前を探すときに潜らない子（引数の名前やメソッド本体の変数を拾わないため） */
const SKIP_FOR_NAME = /Param|Parameter|Body|Block|Statement|List$/;
const CONTAINER_KINDS: ReadonlySet<SymbolKind> = new Set(['class', 'interface', 'module']);

/** 宣言ノードの名前を、直下 → その 1 段下の順で探す（C++ の関数は宣言子の下に名前がある） */
function findName(node: SyntaxNode, names: ReadonlySet<string>): SyntaxNode | null {
  const deeper: SyntaxNode[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (names.has(child.name)) return child;
    if (!SKIP_FOR_NAME.test(child.name)) deeper.push(child);
  }
  for (const parent of deeper) {
    for (let child = parent.firstChild; child; child = child.nextSibling) {
      if (names.has(child.name)) return child;
    }
  }
  return null;
}

/** JS の `const f = () => {}` は変数ではなく関数として並べる */
function refineKind(node: SyntaxNode, kind: SymbolKind): SymbolKind {
  if (kind !== 'variable') return kind;
  return node.getChild('ArrowFunction') || node.getChild('FunctionExpression') ? 'function' : kind;
}

/**
 * 構文木から宣言の一覧を文書順に取り出す。対応していない言語・言語パックが未読込なら空配列。
 * 変数はトップレベルのものだけを拾う（関数内のローカル変数まで並べると一覧が読めなくなるため）。
 */
export function extractSymbols(tree: Tree, doc: Text, language: string | null): DocSymbol[] {
  const spec = language ? SPECS[language] : undefined;
  if (!spec || tree.length === 0) return [];

  const symbols: DocSymbol[] = [];
  // 囲んでいる宣言（終端位置と種類）。前順の走査なので、終端を過ぎたものから外す
  const stack: { to: number; kind: SymbolKind }[] = [];

  tree.iterate({
    enter: (ref) => {
      const decl = spec.decls[ref.name];
      if (!decl) return;
      while ((stack.at(-1)?.to ?? Infinity) <= ref.from) stack.pop();

      const [baseKind, required] = typeof decl === 'string' ? [decl, null] : decl;
      const node = ref.node;
      if (required && !node.getChild(required)) return;
      if (baseKind === 'variable' && stack.length > 0) return;

      const nameNode = findName(node, spec.names);
      if (!nameNode) return;

      const parent = stack.at(-1);
      let kind = refineKind(node, baseKind);
      if (kind === 'function' && parent && CONTAINER_KINDS.has(parent.kind)) kind = 'method';

      symbols.push({
        name: doc.sliceString(nameNode.from, nameNode.to),
        kind,
        from: nameNode.from,
        line: doc.lineAt(nameNode.from).number,
        endLine: doc.lineAt(ref.to).number,
        depth: stack.length,
      });
      stack.push({ to: ref.to, kind });
    },
  });
  return symbols;
}

/**
 * 名前に一致する宣言を探す。同名が複数あるときは、指定位置より前で最も近いもの
 * （同じ名前のローカルな宣言が後ろのほうにあっても、手前のスコープを優先するため）。
 */
export function findDefinition(
  symbols: readonly DocSymbol[],
  name: string,
  pos: number,
): DocSymbol | null {
  const matches = symbols.filter((s) => s.name === name);
  return matches.filter((s) => s.from <= pos).at(-1) ?? matches[0] ?? null;
}

/** 指定行を囲む最も内側の宣言（アウトラインの現在地表示に使う） */
export function findEnclosingSymbol(symbols: readonly DocSymbol[], line: number): DocSymbol | null {
  let found: DocSymbol | null = null;
  for (const s of symbols) {
    if (s.line > line) break;
    if (s.endLine >= line && (!found || s.depth >= found.depth)) found = s;
  }
  return found;
}

/** 宣言の行が画面の上へ流れた、topLine を囲む宣言（外側から順）。1 行の宣言は囲みにならない */
export function findScopeChain(symbols: readonly DocSymbol[], topLine: number): DocSymbol[] {
  return symbols.filter((s) => s.line < topLine && s.endLine >= topLine);
}

export interface Reference {
  line: number;
  /** 行内での出現位置（0 始まり） */
  start: number;
  end: number;
  text: string;
}

/** 参照の件数の上限。メニューの件数表示と参照シートの一覧で共用する */
export const REFERENCE_LIMIT = 200;
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 同じファイル内の出現箇所を単語単位で探す（`foo` で `foobar` を拾わない）。
 * JS の識別子は `$` を含みうるため、`\b` ではなく `[\w$]` を境界にする。
 */
export function findReferences(
  content: string,
  word: string,
  limit = REFERENCE_LIMIT,
): Reference[] {
  if (!word) return [];
  const pattern = new RegExp(`(?<![\\w$])${escapeRegExp(word)}(?![\\w$])`, 'g');
  const refs: Reference[] = [];
  const lines = content.split('\n');
  for (const [i, text] of lines.entries()) {
    if (refs.length >= limit) break;
    for (const m of text.matchAll(pattern)) {
      refs.push({ line: i + 1, start: m.index, end: m.index + word.length, text });
      if (refs.length >= limit) break;
    }
  }
  return refs;
}
