/**
 * Captura el navbar y el buscador para comprobar que los tokens de color
 * cambiaron de verdad y no solo el HTML.
 *
 *   node scripts/check-theme.mjs http://localhost:4316
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:4316";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9223;
const OUT = "C:\\Users\\ramge\\AppData\\Local\\Temp\\opencode";

const profile = mkdtempSync(join(tmpdir(), "pokedex-theme-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=" + profile,
  "--no-first-run",
  "--disable-gpu",
  "--hide-scrollbars",
  "--window-size=1400,1000",
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
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
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
await send("Emulation.setDeviceMetricsOverride", {
  width: 1400,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});

await send("Page.navigate", { url: BASE });
await sleep(7000);

console.log("Colores computados en la pagina\n");

const colores = await evaluate(
  "(() => {" +
    " const cs = (sel, prop) => {" +
    "  const el = document.querySelector(sel);" +
    "  return el ? getComputedStyle(el)[prop] : '(sin elemento)';" +
    " };" +
    " const root = getComputedStyle(document.documentElement);" +
    " return {" +
    "  mint500: root.getPropertyValue('--color-mint-500').trim()," +
    "  ink950: root.getPropertyValue('--color-ink-950').trim()," +
    "  body: cs('body', 'backgroundColor')," +
    "  navActivo: (() => {" +
    "    const a = document.querySelector('nav a[aria-current=page]');" +
    "    if (!a) return '(sin activo)';" +
    "    const pill = a.querySelector('span');" +
    "    return pill ? getComputedStyle(pill).backgroundImage : '(sin pill)';" +
    "  })()," +
    "  textoNav: (() => {" +
    "    const a = document.querySelector('nav a');" +
    "    return a ? getComputedStyle(a).color : '(sin nav)';" +
    "  })()," +
    " };" +
    "})()",
);

for (const [k, v] of Object.entries(colores)) {
  console.log("  " + k.padEnd(11) + " " + v);
}

const esRojo = (c) => {
  const nums = String(c).match(/[\d.]+/g);
  if (!nums) return false;
  const [r, g] = nums.map(Number);
  return r > 150 && g < 110 && r > g + 60;
};

console.log("\nComprobaciones\n");
const check = (label, cond) => {
  console.log((cond ? "  ok     " : "  FALLO  ") + label);
  if (!cond) process.exitCode = 1;
};

check("el token --color-mint-500 es rojo", esRojo(colores.mint500));
check("el fondo es casi negro", /rgb\(1[0-5], 1[0-5], 1[0-9]\)|rgb\(10,/.test(colores.body));
check(
  "el enlace activo usa un degradado rojo",
  String(colores.navActivo).includes("gradient") && esRojo(colores.navActivo),
);

// Capturas para revisarlas a ojo.
const shot = async (name, clip) => {
  const m = await send("Page.captureScreenshot", {
    format: "png",
    ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
  });
  const file = join(OUT, name);
  writeFileSync(file, Buffer.from(m.result.data, "base64"));
  console.log("\nCaptura: " + file);
};

const headerBox = await evaluate(
  "(() => { const h = document.querySelector('header');" +
    " const r = h.getBoundingClientRect();" +
    " return {x:r.x,y:r.y,width:r.width,height:r.height}; })()",
);
await shot("navbar-rojo.png", headerBox);

const buscador = await evaluate(
  "(() => { const i = document.getElementById('filtro-nombre');" +
    " if (!i) return null;" +
    " const r = i.closest('div').getBoundingClientRect();" +
    " return {x:Math.max(0,r.x-20),y:Math.max(0,r.y-90),width:r.width+40,height:r.height+110}; })()",
);
if (buscador) await shot("buscador-rojo.png", buscador);
await shot("completa.png");

ws.close();
chrome.kill();
await sleep(1200);
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
} catch {
  /* lo limpia el sistema */
}
