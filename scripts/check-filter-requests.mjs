/**
 * Comprobacion del bucle de navegacion que hacia una peticion por segundo.
 *
 * Reproduce la secuencia real: escribir en el buscador dispara el debounce,
 * el debounce empuja la URL, y la URL al rearmar el debounce volvia a empujar
 * la misma URL. Aqui se cuenta cuantas navegaciones se piden en cada caso.
 *
 *   node scripts/check-filter-requests.mjs
 */
import { buildHref } from "../src/lib/filters.ts";

let rendered = 0;

/** Sustituto de `router.replace` que cuenta en vez de navegar. */
function commit(current, pendingName, mutate) {
  const href = buildHref("/", current, pendingName, mutate);
  if (href === null) return null;
  return href;
}

function check(label, condition) {
  if (!condition) {
    console.error(`  FALLO  ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`  ok     ${label}`);
  }
}

// ---------------------------------------------------------------- SIN GUARDA
// Comportamiento anterior: `commit` navegaba siempre, sin comparar con la URL.
function commitSinGuarda(current, pendingName, mutate) {
  const params = new URLSearchParams(current);
  mutate?.(params);
  const name = pendingName.trim();
  if (name) params.set("name", name);
  else params.delete("name");
  params.delete("page");
  const search = params.toString();
  return search ? `/?${search}` : "/";
}

function simular(commitFn) {
  let url = "";
  let input = "";

  // El usuario escribe "pik" letra a letra, con 450 ms entre letras, asi que
  // cada letra dispara un commit.
  for (const letra of "pik") {
    input += letra;
    const href = commitFn(url, input);
    if (href !== null) {
      url = href.replace(/^\//, "").replace(/^\?/, "");
      rendered += 1;
    }
    // Tras la navegacion, React vuelve a renderizar con la URL nueva y el
    // debounce se rearma: se ejecuta OTRO commit con el mismo texto.
    const href2 = commitFn(url, input);
    if (href2 !== null) {
      url = href2.replace(/^\//, "").replace(/^\?/, "");
      rendered += 1;
    }
  }

  return rendered;
}

console.log("Reproduccion del sintoma\n");

rendered = 0;
const antes = simular(commitSinGuarda);
console.log(`  Sin guarda: ${antes} navegaciones para escribir 3 letras`);

rendered = 0;
const despues = simular(commit);
console.log(`  Con guarda: ${despues} navegaciones para escribir 3 letras`);

console.log("\nComprobaciones\n");
check("escribir 3 letras no encadena navegaciones", despues <= 3);
check("sin la guarda habia mas navegaciones que con ella", antes > despues);
check("cada letra produce como mucho una navegacion", despues === 3);

// Casos de uso reales que no deben romperse con la guarda.
check(
  "seleccionar un tipo si navega",
  buildHref("/", "", "", (p) => p.set("types", "fire")) === "/?types=fire",
);
check(
  "anadir un segundo tipo lo mantiene en la URL",
  buildHref("/", "types=fire", "", (p) => p.set("types", "fire,water")) ===
    "/?types=fire%2Cwater",
);
check("quitar el ultimo filtro vuelve a la raiz", buildHref("/", "types=fire", "", (p) => p.delete("types")) === "/");
check("el buscador pendiente se aplica con otro filtro a la vez",
  buildHref("/", "types=fire", "cha", (p) => p.set("types", "fire,water")) ===
    "/?types=fire%2Cwater&name=cha");
check("cualquier cambio de filtro resetea la pagina",
  buildHref("/", "page=4&types=fire", "", (p) => p.set("types", "water")) ===
    "/?types=water");
check("con keepPage se conserva la pagina",
  buildHref("/", "page=4&types=fire", "", (p) => p.set("types", "water"), true) ===
    "/?page=4&types=water");
check("sin cambios no hay navegacion", buildHref("/", "name=pik", "pik") === null);
check("borrar el buscador limpia el parametro",
  buildHref("/", "name=pik", "") === "/");

console.log(
  process.exitCode === 1 ? "\nResultado: hay fallos" : "\nResultado: todo correcto",
);
