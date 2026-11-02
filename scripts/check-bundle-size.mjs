// 初期表示で読み込まれるエントリチャンクの gzip サイズが予算を超えたら失敗させる
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 150;
const dir = 'dist/assets';
const entry = readdirSync(dir).find((f) => /^index-.*\.js$/.test(f));
if (!entry) {
  console.error('エントリチャンク (index-*.js) が見つかりません。先に npm run build を実行してください。');
  process.exit(1);
}
const kb = gzipSync(readFileSync(`${dir}/${entry}`)).length / 1024;
console.log(`${entry}: ${kb.toFixed(1)} KB gzip (予算 ${BUDGET_KB} KB)`);
if (kb > BUDGET_KB) {
  console.error('バンドル予算を超えています。動的 import で分割するか、予算の見直しを相談してください。');
  process.exit(1);
}
