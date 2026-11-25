import type { Text } from '@codemirror/state';
import type { SyntaxNode, Tree } from '@lezer/common';

/** `import { imported as local } from 'source'`。default と名前空間（`* as ns`）は imported で区別する */
export interface ImportBinding {
  local: string;
  imported: string | typeof DEFAULT | typeof NAMESPACE;
  source: string;
}

/** `export { imported as exported } from 'source'`。`export * from` は exported も `*` */
export interface Reexport {
  exported: string | typeof NAMESPACE;
  imported: string | typeof NAMESPACE;
  source: string;
}

/** ファイルをまたいで定義をたどるのに要る、モジュールの出入り口 */
export interface ModuleLinks {
  imports: ImportBinding[];
  reexports: Reexport[];
  /** `export { local as exported }` と `export default local`（exported は `default`） */
  aliases: { exported: string; local: string }[];
  /** `export default` の行（名前の無い default でも、ここへ移動できるように） */
  defaultLine: number | null;
}

export const DEFAULT = 'default';
export const NAMESPACE = '*';

const unquote = (s: string) => s.replace(/^['"]|['"]$/g, '');

/** `{ a as b, c }` の中身を [元の名前, 別名] の組にする（ImportGroup と ExportGroup で共用） */
function readGroup(group: SyntaxNode, doc: Text): [string, string][] {
  const pairs: [string, string][] = [];
  let pending: string | null = null;
  let afterAs = false;
  for (let c = group.firstChild; c; c = c.nextSibling) {
    if (c.name === 'as') afterAs = true;
    else if (c.name === 'VariableName' || c.name === 'VariableDefinition') {
      const text = doc.sliceString(c.from, c.to);
      if (afterAs && pending !== null) {
        pairs.push([pending, text]);
        pending = null;
      } else {
        if (pending !== null) pairs.push([pending, pending]);
        pending = text;
      }
      afterAs = false;
    } else if (c.name === ',' || c.name === '}') {
      if (pending !== null) pairs.push([pending, pending]);
      pending = null;
      afterAs = false;
    }
  }
  return pairs;
}

function readImport(node: SyntaxNode, doc: Text, out: ImportBinding[]) {
  const sourceNode = node.getChild('String');
  if (!sourceNode) return;
  const source = unquote(doc.sliceString(sourceNode.from, sourceNode.to));
  let star = false;
  for (let c = node.firstChild; c; c = c.nextSibling) {
    if (c.name === 'Star') star = true;
    else if (c.name === 'VariableDefinition') {
      out.push({
        local: doc.sliceString(c.from, c.to),
        imported: star ? NAMESPACE : DEFAULT,
        source,
      });
    } else if (c.name === 'ImportGroup') {
      for (const [imported, local] of readGroup(c, doc)) out.push({ local, imported, source });
    }
  }
}

function readExport(node: SyntaxNode, doc: Text, links: ModuleLinks) {
  const sourceNode = node.getChild('String');
  const source = sourceNode ? unquote(doc.sliceString(sourceNode.from, sourceNode.to)) : null;
  const group = node.getChild('ExportGroup');

  if (source !== null) {
    if (group) {
      for (const [imported, exported] of readGroup(group, doc)) {
        links.reexports.push({ exported, imported, source });
      }
    } else if (node.getChild('Star')) {
      // `export * as ns from` は名前付き、`export * from` は名前の一覧をそのまま引き継ぐ
      const alias = node.getChild('VariableName');
      const exported = alias ? doc.sliceString(alias.from, alias.to) : NAMESPACE;
      links.reexports.push({ exported, imported: NAMESPACE, source });
    }
    return;
  }

  if (group) {
    for (const [local, exported] of readGroup(group, doc)) links.aliases.push({ exported, local });
    return;
  }
  if (!node.getChild('default')) return;

  links.defaultLine = doc.lineAt(node.from).number;
  // `export default foo` と `export default function foo() {}` は、どちらも foo を指す
  const named =
    node.getChild('VariableName') ??
    node.firstChild?.nextSibling?.nextSibling?.getChild('VariableDefinition');
  if (named)
    links.aliases.push({ exported: DEFAULT, local: doc.sliceString(named.from, named.to) });
}

/**
 * JS/TS の構文木から import と export を取り出す。トップレベルの文だけを見る
 * （import と export はトップレベルにしか書けないため、全体を走査しなくてよい）。
 */
export function extractModuleLinks(tree: Tree, doc: Text): ModuleLinks {
  const links: ModuleLinks = { imports: [], reexports: [], aliases: [], defaultLine: null };
  for (let node = tree.topNode.firstChild; node; node = node.nextSibling) {
    if (node.name === 'ImportDeclaration') readImport(node, doc, links.imports);
    else if (node.name === 'ExportDeclaration') readExport(node, doc, links);
  }
  return links;
}
