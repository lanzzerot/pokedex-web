/**
 * Diagnostico: que elemento desborda a 390 px y que se pide al cargar.
 *
 *   node scripts/diag-overflow.mjs http://localhost:4319
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:4319";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9226;

const profile = mkdtempSync(join(tmpdir(), "pokedex-diag-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=" + profile,
  "--no-first-run",
  "--disable-gpu",
  "--hide-scrollbars",
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targetWs() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch("http://127.0.0.1:" + PORT + "/json/list");
      const t = (await res.json()).find((x) => x.type === "page");
      if (t?.webSocketDebuggerUrl) return t.webSocketDebuggerUrl;
    } catch {
      /* arrancando */
    }
    await sleep(250);
  }
  throw new Error("Chrome no arranca");
}

const ws = new WebSocket(await targetWs());
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let seq = 0;
const pending = new Map();
const peticiones = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
    return;
  }
  if (m.method === "Network.requestWillBeSent") {
    const { request, type } = m.params;
    if (!request.url.startsWith(BASE)) return;
    if (type === "Document" || request.url.includes("_rsc=")) {
      peticiones.push(request.url.replace(BASE, "").replace(/[?&]_rsc=[^&]*/, ""));
    }
  }
};

const send = (method, params = {}) => {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((r) => pending.set(id, r));
};
const evaluate = async (expression) => {
  const m = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return m.result?.result?.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Page.navigate", { url: BASE });
await sleep(8000);

console.log("Elementos que desbordan a 390px\n");
const culpables = await evaluate(
  "(() => {" +
    " const limite = document.documentElement.clientWidth;" +
    " const out = [];" +
    " for (const el of document.querySelectorAll('*')) {" +
    "  const r = el.getBoundingClientRect();" +
    "  if (r.width === 0 && r.height === 0) continue;" +
    "  if (r.right > limite + 1) {" +
    "   out.push({" +
    "    tag: el.tagName.toLowerCase()," +
    "    clase: (el.className || '').toString().slice(0, 90)," +
    "    derecha: Math.round(r.right)," +
    "    ancho: Math.round(r.width)," +
    "    padre: el.parentElement ? el.parentElement.tagName.toLowerCase() : ''" +
    "   });" +
    "  }" +
    " }" +
    " return { limite, total: out.length, primeros: out.slice(0, 12) };" +
    "})()",
);
console.log("  limite: " + culpables.limite + "px | elementos que sobresalen: " + culpables.total);
for (const c of culpables.primeros) {
  console.log(
    "  <" + c.tag + "> ancho=" + c.ancho + " right=" + c.derecha +
      " padre=<" + c.padre + ">\n      " + c.clase,
  );
}

console.log("\nPeticiones al cargar\n");
const conteo = new Map();
for (const p of peticiones) {
  const limpio = p.split("?")[0] || "/";
  conteo.set(limpio, (conteo.get(limpio) ?? 0) + 1);
}
for (const [ruta, n] of [...conteo].sort((a, b) => b[1] - a[1])) {
  console.log("  " + String(n).padStart(3) + "x  " + ruta);
}
console.log("  total: " + peticiones.length);

ws.close();
chrome.kill();
await sleep(1200);
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
} catch {
  /* lo limpia el sistema */
}
