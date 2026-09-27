"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IndexEntry } from "@/lib/search-index";
import { titleCase, typeColor } from "@/lib/pokemon-data";

const MAX_RESULTS = 24;
let indexPromise: Promise<IndexEntry[]> | null = null;

function cargarIndice() {
  if (!indexPromise) {
    indexPromise = fetch("/api/indice")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ entries: IndexEntry[] }>;
      })
      .then((data) => data.entries)
      .catch((error: unknown) => {
        indexPromise = null;
        throw error;
      });
  }
  return indexPromise;
}

interface PaletteProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Busqueda instantanea sobre el indice completo del catalogo.
 *
 * El indice se pide una unica vez y se filtra en memoria, asi que escribir no
 * genera peticiones: ni al abrir, ni por pulsacion, ni al filtrar.
 */
export function SearchPalette({ open, onClose }: PaletteProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<IndexEntry[] | null>(null);
  const [fallo, setFallo] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void cargarIndice().catch(() => undefined);
    }, 800);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // El indice se descarga la primera vez que se abre y se queda en memoria.
  // El estado de "cargando" se deriva de `entries`, no se guarda aparte.
  useEffect(() => {
    if (!open || entries !== null) return;

    let cancelled = false;

    cargarIndice()
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setFallo(true);
      });

    return () => {
      cancelled = true;
    };
  }, [open, entries]);

  const resultados = useMemo(() => {
    if (entries === null) return [];
    const term = query.trim().toLowerCase();
    if (term.length === 0) {
      return [...entries].sort((a, b) => a.id - b.id).slice(0, MAX_RESULTS);
    }

    // Prefijo primero porque es lo que se teclea, luego lo que contiene el
    // termino, despues tipo y region. Es lo que hace util un buscador.
    const scored: { entry: IndexEntry; score: number }[] = [];
    for (const entry of entries) {
      const name = entry.name.toLowerCase();
      let score = -1;
      if (name.startsWith(term)) score = 0;
      else if (name.includes(term)) score = 1;
      else if (entry.types.some((type) => type.includes(term))) score = 2;
      else if (entry.region.includes(term)) score = 3;
      if (score >= 0) scored.push({ entry, score });
    }

    return scored
      .sort((a, b) => a.score - b.score || a.entry.id - b.entry.id)
      .slice(0, MAX_RESULTS)
      .map((item) => item.entry);
  }, [entries, query]);

  const irA = useCallback(
    (name: string) => {
      onClose();
      setQuery("");
      router.push(`/pokemon/${name}`);
    },
    [onClose, router],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (resultados.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => (c + 1) % resultados.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => (c - 1 + resultados.length) % resultados.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const elegido = resultados[cursor];
      if (elegido) irA(elegido.name);
    }
  };

  // Mantiene la fila activa a la vista mientras se navega con el teclado.
  useEffect(() => {
    const item = listRef.current?.children[cursor] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  const cargando = entries === null && !fallo;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar Pokémon"
    >
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
      />

      <div className="glass red-outline animate-pop-in relative w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl motion-reduce:animate-none">
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <IconoLupa />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Buscar entre 1026 Pokémon..."
            aria-label="Buscar Pokémon"
            autoComplete="off"
            spellCheck={false}
            className="h-14 w-full bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-white/15 bg-black/50 px-1.5 py-0.5 text-[10px] text-slate-400 sm:block">
            ESC
          </kbd>
        </div>

        {cargando && (
          <div
            role="status"
            aria-label="Preparando el índice de Pokémon"
            className="space-y-1.5 px-3 py-2"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 px-3 py-2">
                <span className="h-8 w-0.5 shrink-0" />
                <span className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-white/10" />
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="block h-3 w-1/3 animate-pulse rounded bg-white/10" />
                  <span className="block h-2.5 w-1/2 animate-pulse rounded bg-white/5" />
                </span>
                <span className="h-4 w-14 animate-pulse rounded bg-white/10" />
              </div>
            ))}
            <span className="sr-only">Preparando el índice...</span>
          </div>
        )}

        {fallo && (
          <p className="px-4 py-8 text-center text-sm text-mint-400">
            No se pudo cargar el índice. Recarga la página e inténtalo otra vez.
          </p>
        )}

        {!cargando && !fallo && resultados.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            Ningún Pokémon coincide con «{query.trim()}».
          </p>
        )}

        {!cargando && !fallo && resultados.length > 0 && (
          <ul ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
            {resultados.map((entry, i) => {
              const activo = i === cursor;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => irA(entry.name)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                      activo ? "bg-mint-500/15" : "hover:bg-white/5"
                    }`}
                  >
                    {activo ? (
                      <span
                        aria-hidden
                        className="h-8 w-0.5 shrink-0 rounded-full bg-mint-500"
                      />
                    ) : (
                      <span aria-hidden className="h-8 w-0.5 shrink-0" />
                    )}
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-850">
                      {entry.officialArtwork && (
                        <Image
                          src={entry.officialArtwork}
                          alt=""
                          width={40}
                          height={40}
                          className="h-9 w-9 object-contain"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {entry.displayName}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        #{entry.id} · {titleCase(entry.region)} · Gen {entry.generationId}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1">
                      {entry.types.map((type) => {
                        const color = typeColor(type);
                        return (
                          <span
                            key={type}
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                            style={{ backgroundColor: color.bg, color: color.text }}
                          >
                            {type}
                          </span>
                        );
                      })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
          <span>↑↓ moverse</span>
          <span>↵ abrir</span>
          <span>esc cerrar</span>
          {entries !== null && <span className="ml-auto">{entries.length} en el índice</span>}
        </div>
      </div>
    </div>
  );
}

function IconoLupa() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5 shrink-0 text-mint-500"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}
