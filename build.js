const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

async function build() {
  const dist = path.resolve(__dirname, 'dist');
  if (!fs.existsSync(dist)) fs.mkdirSync(dist);

  // Read source files
  let html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.resolve(__dirname, 'whiteboard.js'), 'utf8');

  // Inline whiteboard.js into the HTML
  html = html.replace('<script src="whiteboard.js"></script>', `<script>${js}</script>`);

  // Minify everything (HTML + inline CSS + inline JS)
  const result = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
  });

  fs.writeFileSync(path.resolve(dist, 'index.html'), result);

  const srcSize = (Buffer.byteLength(html) / 1024).toFixed(1);
  const outSize = (Buffer.byteLength(result) / 1024).toFixed(1);
  console.log(`dist/index.html: ${srcSize}KB → ${outSize}KB`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
