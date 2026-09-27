"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { AbilityEntry } from "@/lib/api/types";

function matches(ability: AbilityEntry, term: string): boolean {
  if (!term) return true;
  // Mismo criterio que el filtro `name` de la API: nombre, slug y descripcion.
  return (
    ability.name.toLowerCase().includes(term) ||
    ability.slug.includes(term) ||
    (ability.shortEffect?.toLowerCase().includes(term) ?? false)
  );
}

function apply(
  all: AbilityEntry[],
  term: string,
  onlyMain: boolean,
): AbilityEntry[] {
  const needle = term.trim().toLowerCase();
  return all
    .filter((ability) => (onlyMain ? ability.isMainSeries : true))
    .filter((ability) => matches(ability, needle))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export interface AbilitiesBrowserProps {
  /** Lista completa, para filtrar mientras el usuario escribe. */
  all: AbilityEntry[];
  /** Resultado del filtro en servidor, que es lo que se pinta en el HTML. */
  initial: AbilityEntry[];
  initialSearch: string;
  initialOnlyMain: boolean;
}

export function AbilitiesBrowser({
  all,
  initial,
  initialSearch,
  initialOnlyMain,
}: AbilitiesBrowserProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [onlyMain, setOnlyMain] = useState(initialOnlyMain);

  // `null` significa "el usuario todavia no ha tocado nada": se pinta `initial`,
  // que es exactamente lo que el servidor ya filtro, sin salto al hidratar.
  // En cuanto escribe, se filtra la lista completa.
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    if (!interacted) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (onlyMain) params.set("main", "1");
      const query = params.toString();
      const target = query ? `/habilidades?${query}` : "/habilidades";

      // Guarda contra navegaciones a la URL en la que ya estamos: sin ella,
      // escribir y borrar puede encadenar peticiones sin valor.
      if (target === `${window.location.pathname}${window.location.search}`) return;

      startTransition(() => router.replace(target, { scroll: false }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search, onlyMain, interacted, router]);

  const visible = useMemo(
    () => (interacted ? apply(all, search, onlyMain) : initial),
    [all, initial, interacted, search, onlyMain],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="buscar-habilidad" className="sr-only">
            Buscar habilidad por nombre o efecto
          </label>
          <input
            id="buscar-habilidad"
            type="search"
            value={search}
            onChange={(event) => {
              setInteracted(true);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por nombre o efecto… (p. ej. flight, o «volar»)"
            className="w-full rounded-xl border border-white/10 bg-ink-850 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-mint-500 focus:outline-none"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-ink-850 px-4 py-2.5 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={onlyMain}
            onChange={(event) => {
              setInteracted(true);
              setOnlyMain(event.target.checked);
            }}
            className="h-4 w-4 accent-mint-500"
          />
          Solo juego principal
        </label>
      </div>

      <p className="text-sm text-slate-400" aria-live="polite">
        <span className="font-mono text-white">{visible.length}</span> habilidades
        {isPending ? <span className="ml-2 text-xs text-mint-400">buscando…</span> : null}
      </p>

      {visible.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center">
          <h2 className="font-display text-lg font-bold text-white">Sin resultados</h2>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            El filtro busca tanto en el nombre como en la descripción del efecto, así que{" "}
            <code className="text-slate-300">?search=flight</code> encuentra habilidades que
            mencionan volar.
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((ability) => (
            <li key={ability.slug}>
              <Link
                href={`/?abilities=${ability.slug}`}
                className="card group flex h-full flex-col p-4 transition-all hover:-translate-y-0.5 hover:border-mint-500/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-sm font-bold text-white">{ability.name}</h2>
                  {ability.pokemonCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-mint-500/15 px-2 py-0.5 font-mono text-[0.65rem] text-mint-400 ring-1 ring-mint-400/30">
                      {ability.pokemonCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-400">
                  {ability.shortEffect ?? "Sin efecto descrito."}
                </p>
                {!ability.isMainSeries ? (
                  <span className="mt-2 self-start rounded-full bg-slate-500/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-slate-400 ring-1 ring-slate-400/25">
                    fuera de serie
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
