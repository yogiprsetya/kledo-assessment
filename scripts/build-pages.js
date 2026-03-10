#!/usr/bin/env node
/**
 * Build static site into dist/ for GitHub Pages.
 * - Assumes `npm run build:prod` has produced hashed assets under assets/
 * - Rewrites index.html to point to hashed CSS & JS using relative paths
 * - Copies assets/ into dist/assets
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, "assets");
const DIST_DIR = path.join(ROOT, "dist");
const INDEX_HTML = path.join(ROOT, "index.html");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function list(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
}

function findHashedAssets() {
  const files = list(ASSETS_DIR);
  const css =
    files.find((f) => /^index-[a-f0-9]{8}\.css$/.test(f)) ||
    files.find((f) => f === "index.css");
  const js =
    files.find((f) => /^main-[A-Za-z0-9]+\.js$/.test(f)) ||
    files.find((f) => f === "main.js");
  if (!css) throw new Error("CSS asset not found in assets/");
  if (!js) throw new Error("JS asset not found in assets/");
  return { css, js };
}

function rewriteIndex({ css, js }) {
  const html = fs.readFileSync(INDEX_HTML, "utf8");
  // Make asset paths relative and update hashed filenames
  let out = html;
  // Stylesheet
  out = out.replace(
    /href=["']\/?assets\/[^"']+\.css["']/g,
    `href="assets/${css}"`,
  );
  // Script module
  out = out.replace(/src=["']\/?assets\/[^"']+\.js["']/g, `src="assets/${js}"`);
  return out;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function main() {
  const { css, js } = findHashedAssets();
  ensureDir(DIST_DIR);
  const rewritten = rewriteIndex({ css, js });
  fs.writeFileSync(path.join(DIST_DIR, "index.html"), rewritten);
  // Also write 404.html for GitHub Pages SPA fallback
  fs.writeFileSync(path.join(DIST_DIR, "404.html"), rewritten);
  copyDir(ASSETS_DIR, path.join(DIST_DIR, "assets"));
  console.log("Built dist/ for GitHub Pages");
}

main();
