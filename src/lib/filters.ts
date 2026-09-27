/**
 * Construccion de la query del catalogo a partir de la URL actual.
 *
 * Vive fuera del componente para poder comprobarla sin navegador: el bug que
 * provoca "una peticion cada segundo" era un detalle de navegacion, no de
 * datos, y asi queda verificable.
 */

/** Normaliza valores repetidos o separados por comas a una lista plana. */
export function splitList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export interface BuildSearchOptions {
  /** Query string actual de la URL, sin el `?` inicial. */
  current: string;
  /** Texto del buscador que aun no ha salido del debounce. */
  pendingName: string;
  /** Cambios concretos de esta interaccion. */
  mutate?: (params: URLSearchParams) => void;
  /** Conservar `page` en lugar de volver a la primera. */
  keepPage?: boolean;
}

/**
 * Devuelve la nueva query string, o `null` cuando no hay nada que hacer.
 *
 * El `null` es la parte importante: sin el, el debounce del buscador se rearma
 * en cada navegacion (porque la URL cambia de identidad) y vuelve a empujar la
 * misma URL, encadenando peticiones sin esperar al usuario.
 */
export function buildSearch({
  current,
  pendingName,
  mutate,
  keepPage = false,
}: BuildSearchOptions): string | null {
  const params = new URLSearchParams(current);

  mutate?.(params);

  const name = pendingName.trim();
  if (name) params.set("name", name);
  else params.delete("name");

  if (!keepPage) params.delete("page");

  const next = params.toString();
  return next === current ? null : next;
}

/** Ruta completa a la que navegar, o `null` si no hay cambio. */
export function buildHref(
  pathname: string,
  current: string,
  pendingName: string,
  mutate?: (params: URLSearchParams) => void,
  keepPage = false,
): string | null {
  const next = buildSearch({ current, pendingName, mutate, keepPage });
  if (next === null) return null;
  return next ? `${pathname}?${next}` : pathname;
}
