// Bina fail babak: src/*.html → compositions/*.html, menggantikan {{ ungkapan }} dengan lukisan
// dari parts/parts.mjs (dipanggil sebagai P.namaFungsi(...)). Jalankan selepas mengubah src/ atau parts/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as P from "./parts/parts.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
for (const f of fs.readdirSync(path.join(here, "src")).filter(f => f.endsWith(".html"))) {
  const src = fs.readFileSync(path.join(here, "src", f), "utf8");
  const out = src.replace(/\{\{([\s\S]+?)\}\}/g, (_, expr) => new Function("P", `return (${expr});`)(P));
  fs.writeFileSync(path.join(here, "compositions", f), out);
  console.log("bina:", f);
}
