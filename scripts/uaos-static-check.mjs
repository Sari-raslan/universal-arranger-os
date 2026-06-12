import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appSrc = path.join(root, "uaos-live-clean", "src");
const failures = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

for (const file of walk(appSrc)) {
  const text = fs.readFileSync(file, "utf8");
  if (text.includes("Math.random")) failures.push(`${path.relative(root, file)} uses Math.random`);
  const imports = [...text.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)].map((match) => match[1]);
  for (const specifier of imports) {
    const base = path.resolve(path.dirname(file), specifier);
    const candidates = [base, `${base}.js`, `${base}.jsx`, path.join(base, "index.js"), path.join(base, "index.jsx")];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      failures.push(`${path.relative(root, file)} imports missing ${specifier}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("UAOS static check passed");
