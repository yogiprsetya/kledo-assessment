#!/usr/bin/env node
/**
 * Minify all JSON files under data/ into assets/data/ preserving structure.
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'data');
const OUT_DIR = path.join(process.cwd(), 'assets', 'data');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(dir, e.name);
    const rel = path.relative(SRC_DIR, srcPath);
    const outPath = path.join(OUT_DIR, rel);
    if (e.isDirectory()) {
      fs.mkdirSync(outPath, { recursive: true });
      walk(srcPath);
    } else if (e.isFile() && e.name.endsWith('.json')) {
      const raw = fs.readFileSync(srcPath, 'utf8');
      try {
        const obj = JSON.parse(raw);
        const min = JSON.stringify(obj);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, min);
        console.log(`Minified: ${rel}`);
      } catch (err) {
        console.error(`Skip (invalid JSON): ${rel}`, err.message);
      }
    } else if (e.isFile()) {
      // copy other files untouched if needed in future
    }
  }
}

if (!fs.existsSync(SRC_DIR)) {
  console.error('No data/ directory found.');
  process.exit(0);
}
fs.mkdirSync(OUT_DIR, { recursive: true });
walk(SRC_DIR);
