"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "pokedex:favorites";

/** Evento propio: `storage` solo se dispara en otras pestanas, no en esta. */
const CHANGE_EVENT = "pokedex:favorites-changed";

const EMPTY: readonly string[] = Object.freeze([]);

function parse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/**
 * `getSnapshot` tiene que devolver siempre la misma referencia mientras el
 * contenido no cambie, o React entra en un bucle de renderizado. De ahi el
 * cache por cadena cruda.
 */
let cache: { raw: string | null; value: readonly string[] } = {
  raw: null,
  value: EMPTY,
};

function getSnapshot(): readonly string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.value;
  cache = { raw, value: parse(raw) };
  return cache.value;
}

function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(next: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Modo privado o cuota llena: los favoritos viven solo en memoria.
  }
  // Invalida el cache para que la siguiente lectura vea el valor nuevo.
  cache = { raw: null, value: EMPTY };
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((name: string) => {
    const current = getSnapshot();
    write(current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  }, []);

  const clear = useCallback(() => {
    write([]);
  }, []);

  const isFavorite = useCallback((name: string) => favorites.includes(name), [favorites]);

  return useMemo(
    () => ({ favorites, isFavorite, toggle, clear }),
    [favorites, isFavorite, toggle, clear],
  );
}
