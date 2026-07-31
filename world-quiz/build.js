/* index.html / styles.css / *.js を1枚のHTMLにまとめるビルドスクリプト
 *
 *   node world-quiz/build.js
 *
 * 出力
 *   dist/index.html      … そのまま配信できる完全なHTML（デプロイ用・配布用）
 *   dist/artifact.html   … <title>/<style>/本文/<script> だけのフラグメント
 */
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DIST = path.join(SRC, 'dist');
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

const html = read('index.html');
const css = read('styles.css');
const scripts = ['data.js', 'mapdata.js', 'app.js'].map(read).join('\n');

// <body> の中身だけ取り出す
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace(/<link rel="stylesheet"[^>]*>\s*/g, '')
  .replace(/\s*<script src="[^"]*"><\/script>/g, '')
  .trim();

const title = html.match(/<title>([^<]*)<\/title>/)[1];
const inlined = `<style>\n${css}\n</style>\n\n${body}\n\n<script>\n${scripts}\n</script>\n`;

fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="description" content="中学1年生の社会「世界地図確認プリント」の60か国と首都・位置をゲームで覚えるアプリ">
<meta name="theme-color" content="#2f7de1">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>">
<title>${title}</title>
</head>
<body>
${inlined}</body>
</html>
`);
// Artifact用（<!DOCTYPE>や<html>などの外枠は publish 時に付くので入れない）
fs.writeFileSync(path.join(DIST, 'artifact.html'), `<title>${title}</title>\n${inlined}`);

for (const f of ['index.html', 'artifact.html']) {
  const p = path.join(DIST, f);
  console.log(f, (fs.statSync(p).size / 1024).toFixed(1) + 'KB');
}
