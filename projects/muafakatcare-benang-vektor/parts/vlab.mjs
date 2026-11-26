// Makmal vektor: node parts/vlab.mjs <fn> <w> <h> <out.png> [bg]
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import * as V from "./vektor.mjs";
import * as V2 from "./vektor2.mjs";
import * as V3 from "./vektor3.mjs";
const [fn, w, h, out, bg = "#cfd3dc"] = process.argv.slice(2);
const f = V[fn] || V2[fn] || V3[fn];
const html = `<!doctype html><body style="margin:0"><div style="position:relative;width:${w}px;height:${h}px;background:${bg};overflow:hidden">
<style>svg{position:absolute;left:0!important;top:0!important;width:${w}px!important;height:${h}px!important}</style>${f()}</div></body>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.setContent(html); await p.screenshot({ path: out }); await b.close();
