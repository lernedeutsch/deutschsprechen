const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const SKIP_DIRS = new Set([".git", "node_modules"]);
const KNOWN_PLACEHOLDERS = new Set([
  "lessons/a2/lektion-2.html",
  "lessons/aktivt-trenieren.a1/index.html",
  "lessons/b1/index.html",
  "lessons/b2/index.html"
]);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function localTarget(raw, sourceFile) {
  const value = raw.trim();
  if (!value || value.startsWith("#") || value.startsWith("mailto:") ||
      value.startsWith("tel:") || value.startsWith("data:") ||
      value.startsWith("javascript:") || /^https?:\/\//i.test(value) ||
      value.startsWith("//")) return null;

  const clean = decodeURIComponent(value.split("#")[0].split("?")[0]);
  if (!clean) return null;

  return clean.startsWith("/")
    ? path.join(ROOT, clean.replace(/^\/+/, ""))
    : path.resolve(path.dirname(sourceFile), clean);
}

const files = walk(ROOT);
const htmlFiles = files.filter(f => f.toLowerCase().endsWith(".html"));
const jsFiles = files.filter(f => f.toLowerCase().endsWith(".js"));

assert(htmlFiles.length > 0, "No HTML files found");
assert(jsFiles.length > 0, "No JavaScript files found");

let refs = 0;
const broken = [];
const malformed = [];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, "utf8");
  const name = rel(file);

  if (!KNOWN_PLACEHOLDERS.has(name) &&
      (!/<html[\\s>]/i.test(content) || !/<\\/html>/i.test(content) ||
       !/<body[\\s>]/i.test(content) || !/<\\/body>/i.test(content))) {
    malformed.push(name);
  }

  const re = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  for (const match of content.matchAll(re)) {
    let target;
    try {
      target = localTarget(match[1], file);
    } catch {
      broken.push(`${name} -> invalid URL encoding: ${match[1]}`);
      continue;
    }
    if (!target) continue;
    refs++;
    if (!fs.existsSync(target)) {
      broken.push(`${name} -> ${match[1]}`);
    }
  }
}

if (malformed.length) {
  console.error("\nHTML files missing basic document structure:");
  malformed.forEach(x => console.error(" - " + x));
}
if (broken.length) {
  console.error("\nBroken local href/src references:");
  broken.forEach(x => console.error(" - " + x));
}

assert.strictEqual(malformed.length, 0, "Malformed HTML document(s) found");
assert.strictEqual(broken.length, 0, "Broken local link/resource reference(s) found");

console.log(`✓ HTML documents checked: ${htmlFiles.length}`);
console.log(`✓ Local href/src references checked: ${refs}`);
console.log(`✓ JavaScript files discovered: ${jsFiles.length}`);
console.log("✓ Project integrity checks passed");
