// Makmal: render satu bahagian ke PNG untuk disemak sebelum dimasukkan ke babak.
// Guna: node parts/lab.mjs <namaFungsi> <latar> <output.png>
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as P from "./parts.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const [fn = "volunteersPair", bg = "url(#blueBg)", out = path.join(here, "..", ".hyperframes", "lab.png")] = process.argv.slice(2);
const root = fs.readFileSync(path.join(here, "..", "index.html"), "utf8");
const defs = root.match(/<defs>[\s\S]*?<\/defs>/)[0];
const html = `<!doctype html><html><body style="margin:0">
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">${defs}
<rect width="1080" height="1920" fill="${bg}"/>${(process.env.LAB_MOD ? await import(process.env.LAB_MOD) : P)[fn]()}</svg></body></html>`;
fs.mkdirSync(path.dirname(out), { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.setContent(html);
await p.screenshot({ path: out });
await b.close();
console.log("lab:", out);
