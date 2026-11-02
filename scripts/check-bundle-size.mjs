// 初期表示で読み込まれる JS（エントリと、そこから静的 import で辿れるチャンク）の
// gzip 合計が予算を超えたら失敗させる。動的 import のチャンクは含めない。
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 300;
const dir = 'dist/assets';
const entry = readdirSync(dir).find((f) => /^index-.*\.js$/.test(f));
if (!entry) {
  console.error('エントリチャンク (index-*.js) が見つかりません。先に npm run build を実行してください。');
  process.exit(1);
}

const seen = new Set();
const visit = (file) => {
  if (seen.has(file)) return;
  seen.add(file);
  const code = readFileSync(`${dir}/${file}`, 'utf8');
  // 静的 import: `from"./x.js"` / `import"./x.js"`（動的 import は `import("./x.js")`）
  for (const m of code.matchAll(/(?:from|import)\s*["']\.\/([^"']+\.js)["']/g)) visit(m[1]);
};
visit(entry);

let total = 0;
for (const file of seen) total += gzipSync(readFileSync(`${dir}/${file}`)).length;
const kb = total / 1024;
console.log(`初期 JS: ${seen.size} ファイル, ${kb.toFixed(1)} KB gzip (予算 ${BUDGET_KB} KB)`);
if (kb > BUDGET_KB) {
  console.error('バンドル予算を超えています。動的 import で分割するか、予算の見直しを相談してください。');
  process.exit(1);
}
