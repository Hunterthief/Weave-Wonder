// generate_manifest.js
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'products');
const out = path.join(__dirname, 'products.json');

function walk(dirPath) {
  const files = [];
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dirPath, it.name);
    if (it.isDirectory()) {
      files.push(...walk(full));
    } else {
      const ext = path.extname(it.name).toLowerCase();
      if (['.png','.jpg','.jpeg','.webp','.gif'].includes(ext)) {
        // make web path relative to repo root
        const webPath = path.join('products', path.relative(dir, full)).replace(/\\/g, '/');
        files.push({ filename: webPath, title: '', buyUrl: '' });
      }
    }
  }
  return files;
}

const list = walk(dir);
fs.writeFileSync(out, JSON.stringify(list, null, 2), 'utf8');
console.log('products.json written with', list.length, 'items to', out);
