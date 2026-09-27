/**
 * Comprueba el navbar nuevo: que no haya scroll horizontal en ningun ancho, que
 * el rail aparezca en escritorio, el cajon en movil, y que el buscador ⌘K
 * filtre en memoria sin generar peticiones por pulsacion.
 *
 *   node scripts/check-appnav.mjs http://localhost:4319
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:4319";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9225;
const OUT = "C:\\Users\\ramge\\AppData\\Local\\Temp\\opencode";

const profile = mkdtempSync(join(tmpdir(), "pokedex-appnav-"));
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
      peticiones.push(request.url.replace(BASE, ""));
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
  if (m.result?.exceptionDetails) {
    return { error: m.result.exceptionDetails.text };
  }
  return m.result?.result?.value;
};
const setAncho = async (width) => {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await sleep(700);
};

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Page.navigate", { url: BASE });
await sleep(7000);

console.log("1. Desbordamiento horizontal por ancho\n");
console.log("  ancho   scroll-body   rail   barra-movil   menu-btn");
const medidas = {};
for (const ancho of [1440, 1024, 768, 390]) {
  await setAncho(ancho);
  const m = await evaluate(
    "(() => {" +
    " const doc = document.documentElement;" +
    " const rail = [...document.querySelectorAll('nav')].find(n => n.className.includes('fixed'));" +
    " const barra = [...document.querySelectorAll('nav')].find(n => n.className.includes('sticky'));" +
    " const btn = document.querySelector('button[aria-label=\"Abrir menú\"]');" +
    " const vis = (el) => el ? getComputedStyle(el).display !== 'none' : false;" +
    " return {" +
    "  body: doc.scrollWidth - doc.clientWidth," +
    "  rail: vis(rail)," +
    "  barra: vis(barra)," +
    "  btn: vis(btn)" +
    " };" +
    "})()",
  );
  medidas[ancho] = m;
  console.log(
    "  " +
      String(ancho).padEnd(7) +
      String(m.body + "px").padEnd(13) +
      String(m.rail).padEnd(7) +
      String(m.barra).padEnd(13) +
      String(m.btn),
  );
}

console.log("\n2. Cajon en movil\n");
await setAncho(390);
await evaluate('document.querySelector("button[aria-label=\\"Abrir menú\\"]").click()');
await sleep(600);
const cajon = await evaluate(
  "(() => {" +
    " const c = document.querySelector('button[aria-label=\"Cerrar menú\"]')?.closest('div.glass')" +
    "   ?? [...document.querySelectorAll('div')].find(d => d.className.includes('glass') && d.className.includes('right-0'));" +
    " if (!c) return null;" +
    " const r = c.getBoundingClientRect();" +
    " return { abierto: true, ancho: Math.round(r.width), desborde: Math.round(r.right) - window.innerWidth, items: c.querySelectorAll('a').length };" +
    "})()",
);
console.log("  " + JSON.stringify(cajon));
await evaluate('document.querySelector("button[aria-label=\"Cerrar menú\"]")?.click()');
await sleep(400);

console.log("\n3. Buscador ⌘K: peticiones al escribir\n");
await setAncho(1440);
await evaluate(
  "document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',metaKey:true,bubbles:true}))",
);
await sleep(2500);

const trasAbrir = peticiones.length;
peticiones.length = 0;
console.log("  peticiones al abrir (carga del indice): " + trasAbrir);
for (const p of [...new Set(peticiones)]) {
  if (p.startsWith("/api/indice")) console.log("    " + p);
}

for (const letra of "charizard") {
  await evaluate(
    "(() => {" +
    ' const i = document.querySelector(\'input[aria-label="Buscar Pokémon"]\');' +
    " if (!i) return 'sin-input';" +
    " const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;" +
    " setter.call(i, i.value + " + JSON.stringify(letra) + ");" +
    " i.dispatchEvent(new Event('input',{bubbles:true}));" +
    " return 'ok';" +
    "})()",
  );
  await sleep(250);
}
await sleep(1200);

const alEscribir = peticiones.length;
const resultados = await evaluate(
  'document.querySelectorAll(\'[role="dialog\"] ul li\').length',
);
const primero = await evaluate(
  '(() => { const li = document.querySelector(\'[role="dialog"] ul li\');' +
    " return li ? li.textContent.trim().slice(0, 40) : '(nada)'; })()",
);

console.log("  peticiones escribiendo 9 letras: " + alEscribir);
console.log("  resultados mostrados: " + resultados);
console.log("  primero: " + primero);

console.log("\n4. Navegar con el teclado\n");
await evaluate(
  "(() => { const i = document.querySelector('input[aria-label=\"Buscar Pokémon\"]');" +
    " i.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));" +
    " i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); })()",
);
await sleep(2500);
const destino = await evaluate("location.pathname");
console.log("  ruta tras Enter: " + destino);

console.log("\nComprobaciones\n");
const check = (label, cond) => {
  console.log((cond ? "  ok     " : "  FALLO  ") + label);
  if (!cond) process.exitCode = 1;
};

for (const ancho of [1440, 1024, 768, 390]) {
  check("sin scroll horizontal a " + ancho + "px", medidas[ancho].body <= 0);
}
check("el rail aparece en escritorio", medidas[1440].rail === true);
check("el rail se oculta en movil", medidas[390].rail === false);
check("la barra movil aparece en 390px", medidas[390].barra === true);
check("el boton de menu aparece en 390px", medidas[390].btn === true);
check("el cajon se abre", cajon && cajon.abierto === true);
check("el cajon cabe en la pantalla", cajon && cajon.desborde <= 0);
check("el cajon lista las 8 secciones", cajon && cajon.items === 8);
check("escribir no genera peticiones", alEscribir === 0);
check("hay resultados", Number(resultados) > 0);
check("el primero es charizard", String(primero).toLowerCase().includes("charizard"));
check("Enter abre la ficha", destino === "/pokemon/charizard");

await setAncho(1440);
const shot = await send("Page.captureScreenshot", { format: "png" });
const f1 = join(OUT, "nav-rail.png");
writeFileSync(f1, Buffer.from(shot.result.data, "base64"));
console.log("\nCaptura: " + f1);

ws.close();
chrome.kill();
await sleep(1200);
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
} catch {
  /* lo limpia el sistema */
}
