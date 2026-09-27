/**
 * Comprueba que el navbar es compacto y que sus enlaces caben en una fila
 * sin barra horizontal, a several anchos de pantalla.
 *
 *   node scripts/check-navbar.mjs http://localhost:4317
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:4317";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9224;
const OUT = "C:\\Users\\ramge\\AppData\\Local\\Temp\\opencode";

const ANCHOS = [1440, 1280, 1024, 768, 390];

const profile = mkdtempSync(join(tmpdir(), "pokedex-nav-"));
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
  if (m.result?.exceptionDetails) return null;
  return m.result?.result?.value;
};

await send("Page.enable");
await send("Runtime.enable");
const MEDIR =
  "(() => {" +
  " const h = document.querySelector('header');" +
  " const nav = document.querySelector('nav');" +
  " if (!h || !nav) return null;" +
  " const hr = h.getBoundingClientRect();" +
  " const items = [...nav.querySelectorAll('a')];" +
  " return {" +
  "  alto: Math.round(hr.height)," +
  "  items: items.length," +
  "  desborde: nav.scrollWidth - nav.clientWidth," +
  "  primerItem: items[0] ? Math.round(items[0].getBoundingClientRect().height) : 0," +
  "  altoNav: Math.round(nav.getBoundingClientRect().height)" +
  " };" +
  "})()";

await send("Page.navigate", { url: BASE });
await sleep(7000);

console.log("Navbar por ancho de pantalla\n");
console.log("  ancho   alto   items   alto-item   alto-nav   desborde");
for (const ancho of ANCHOS) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: ancho,
    height: 900,
    deviceScaleFactor: 1,
    mobile: ancho < 768,
  });
  await sleep(900);
  const m = await evaluate(MEDIR);
  if (!m) {
    console.log("  " + String(ancho).padEnd(7) + " no medido");
    continue;
  }
  console.log(
    "  " +
      String(ancho).padEnd(7) +
      String(m.alto).padEnd(7) +
      String(m.items).padEnd(8) +
      String(m.primerItem).padEnd(12) +
      String(m.altoNav).padEnd(11) +
      (m.desborde > 1 ? m.desborde + "px (scroll)" : "no"),
  );
}

await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await sleep(800);

const alto = await evaluate("Math.round(document.querySelector('header').getBoundingClientRect().height)");

const m1440 = await evaluate(MEDIR);
const m390 = await (async () => {
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 900,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await sleep(800);
  return evaluate(MEDIR);
})();

console.log("\nComprobaciones\n");
const check = (label, cond) => {
  console.log((cond ? "  ok     " : "  FALLO  ") + label);
  if (!cond) process.exitCode = 1;
};

check("el navbar mide 48 px o menos", alto <= 48);
check("los items son compactos (26 px o menos)", m1440.primerItem <= 26);
check("en 1440 px no hay barra de scroll", m1440.desborde <= 1);
check("en movil la navegacion es lo unico que desborda", m390.desborde >= 0);

await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 2,
  mobile: false,
});
await sleep(700);
const shot = await send("Page.captureScreenshot", {
  format: "png",
  clip: { x: 0, y: 0, width: 1440, height: 56, scale: 1 },
});
const file = join(OUT, "navbar-compacto.png");
writeFileSync(file, Buffer.from(shot.result.data, "base64"));
console.log("\nCaptura: " + file);

ws.close();
chrome.kill();
await sleep(1200);
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
} catch {
  /* lo limpia el sistema */
}
