/**
 * Cuenta las peticiones que el navegador hace al servidor de Next al escribir
 * en el buscador del catalogo. Conduce Chrome por CDP, asi que mide el
 * comportamiento real y no una simulacion.
 *
 *   node scripts/measure-live-requests.mjs http://localhost:4314
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:4314";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const WORD = "pikachu";

const profile = mkdtempSync(join(tmpdir(), "pokedex-cdp-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=" + profile,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "--window-size=1280,900",
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targetWs() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch("http://127.0.0.1:" + PORT + "/json/list");
      const targets = await res.json();
      const page = targets.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* todavia arrancando */
    }
    await sleep(250);
  }
  throw new Error("Chrome no expone el puerto de depuracion");
}

const wsUrl = await targetWs();
const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let seq = 0;
const pending = new Map();

/** En App Router una navegacion no es un `Document`: se pide el payload RSC. */
const navigations = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === "Network.requestWillBeSent") {
    const { request, type } = msg.params;
    if (!request.url.startsWith(BASE)) return;
    const isRsc = request.url.includes("_rsc=");
    if (type === "Document" || isRsc) {
      navigations.push({ type: isRsc ? "RSC" : "Document", url: request.url });
    }
  }
};

function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}

const evaluate = (expression) =>
  send("Runtime.evaluate", { expression, returnByValue: true }).then(
    (m) => m.result?.result?.value,
  );

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");

console.log("Cargando " + BASE + " ...");
navigations.length = 0;
await send("Page.navigate", { url: BASE });
await sleep(6000);

const enCarga = navigations.length;
const fichasAlAbrir = navigations.filter((n) => n.url.includes("/pokemon/")).length;
console.log("\nPeticiones al abrir la pagina: " + enCarga);
console.log("  fichas precargadas sin pedirlas: " + fichasAlAbrir);
for (const n of navigations) {
  const limpio = n.url.replace(BASE, "").replace(/[?&]_rsc=[^&]*/, "");
  console.log("  " + (limpio || "/") + (n.url.includes("/pokemon/") ? "  <- FICHA" : ""));
}

navigations.length = 0;
console.log('\nEscribiendo "' + WORD + '" en el buscador, 700 ms entre letras...');

for (let i = 1; i <= WORD.length; i += 1) {
  const hasta = WORD.slice(0, i);
  // Se escribe el prefijo completo, como haria una persona tecleando: leer
  // `input.value` entre letras depende de cuando React vuelque el estado y
  // falsearia el resultado.
  await evaluate(
    "(() => {" +
      ' const input = document.getElementById("filtro-nombre");' +
      " if (!input) return 'sin-input';" +
      " const setter = Object.getOwnPropertyDescriptor(" +
      ' window.HTMLInputElement.prototype, "value").set;' +
      " setter.call(input, " + JSON.stringify(hasta) + ");" +
      ' input.dispatchEvent(new Event("input", { bubbles: true }));' +
      ' return "ok";' +
      "})()",
  );
  await sleep(700);
}

await sleep(3000);

const search = await evaluate("location.search");
const shown = await evaluate(
  'document.getElementById("filtro-nombre")?.value ?? "(sin input)"',
);

console.log("\nURL final:     " + (search || "(vacia)"));
console.log('Texto en el input: "' + shown + '"');
console.log("Navegaciones al servidor durante la escritura: " + navigations.length);
for (const n of navigations) {
  console.log("  [" + n.type + "] " + n.url.replace(BASE, "") || "/");
}

const vistas = navigations.map((n) => {
  const u = new URL(n.url);
  return u.pathname + (u.searchParams.get("_rsc") !== null ? "?" + u.search : "");
});
const repetidas = vistas.filter((u, i) => i > 0 && u === vistas[i - 1]);
const unicas = new Set(vistas).size;

console.log("\nNavegaciones distintas: " + unicas);
console.log("Veces repetida la misma URL de forma consecutiva: " + repetidas.length);

const nombreEnUrl = new URL(BASE + (search || "/")).searchParams.get("name");
const okTexto = nombreEnUrl === WORD;
const okSinBucle = repetidas.length === 0 && navigations.length <= WORD.length;
const okSinPrecarga = fichasAlAbrir === 0;

console.log("\nEl texto completo llego a la URL: " + (okTexto ? "si" : "NO -> " + nombreEnUrl));
console.log("Abrir la pagina no precarga fichas: " + (okSinPrecarga ? "si" : "NO"));

ws.close();
chrome.kill();
await sleep(1500);
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
} catch {
  /* el perfil temporal lo limpia el sistema */
}

if (!okTexto) {
  console.log("\nResultado: el texto no llego completo a la URL");
  process.exitCode = 1;
} else if (!okSinBucle) {
  console.log("\nResultado: hay navegaciones repetidas, el bucle sigue vivo");
  process.exitCode = 1;
} else if (!okSinPrecarga) {
  console.log("\nResultado: se siguen precargando fichas al abrir");
  process.exitCode = 1;
} else {
  console.log("\nResultado: correcto, sin peticiones en cadena ni precarga");
}
