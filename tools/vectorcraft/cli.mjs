#!/usr/bin/env node
// Usage: node tools/vectorcraft/cli.mjs <asset> [--key value ...] [--out file.svg]
import { writeFileSync } from 'node:fs';
import { generators } from './index.mjs';

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

export function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`unexpected argument "${a}"`);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) throw new Error(`${a} needs a value`);
    opts[camel(a.slice(2))] = next;
    i++;
  }
  return opts;
}

function main() {
  const [asset, ...rest] = process.argv.slice(2);
  if (!asset || asset === 'list' || asset === '--help') {
    console.log('VectorCraft assets:\n  ' + Object.keys(generators).join('\n  '));
    console.log('\nExample: node tools/vectorcraft/cli.mjs lower-third --title "Ammar" --subtitle "Founder" --out lt.svg');
    return;
  }
  const gen = generators[asset];
  if (!gen) throw new Error(`unknown asset "${asset}". Run with "list" to see options.`);
  const { out, ...opts } = parseArgs(rest);
  const result = gen(opts);
  if (out) {
    writeFileSync(out, result);
    console.error(`wrote ${out}`);
  } else {
    process.stdout.write(result);
  }
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(`vectorcraft: ${e.message}`);
    process.exit(1);
  }
}
