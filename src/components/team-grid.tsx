"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useFavorites } from "./use-favorites";
import { TypeBadge } from "./type-badge";
import type { PokemonListItem } from "@/lib/api/types";

interface TeamResponse {
  items: PokemonListItem[];
  missing: string[];
}

function TeamSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: Math.max(count, 1) }, (_, i) => (
        <div key={i} className="h-52 animate-pulse rounded-2xl bg-ink-850" />
      ))}
    </div>
  );
}

function EmptyTeam() {
  return (
    <div className="card grid place-items-center gap-3 p-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/pokeball.svg" alt="" width={56} height={56} className="opacity-40" />
      <h2 className="font-display text-lg font-bold text-white">Tu equipo está vacío</h2>
      <p className="max-w-md text-sm text-slate-400">
        Pulsa el corazón en cualquier ficha para guardarla aquí. Se queda en tu navegador, sin
        cuenta ni servidor.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-mint-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-mint-400"
      >
        Explorar el Pokédex
      </Link>
    </div>
  );
}

/**
 * Resuelve los favoritos contra una route handler propia, que a su vez cachea
 * en servidor. Asi el navegador hace una sola peticion y recargar el equipo no
 * consume cuota de la API. Se monta con `key` para que cambiar la lista
 * reinicie el estado de carga sin `setState` dentro del efecto.
 */
function TeamList({ names }: { names: readonly string[] }) {
  const [data, setData] = useState<TeamResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/team?names=${encodeURIComponent(names.join(","))}`, {
      signal: controller.signal,
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error(String(response.status))),
      )
      .then((payload: TeamResponse) => setData(payload))
      .catch(() => {
        if (!controller.signal.aborted) setData({ items: [], missing: [...names] });
      });

    return () => controller.abort();
  }, [names]);

  if (!data) return <TeamSkeleton count={names.length} />;

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {data.items.map((pokemon) => (
          <li key={pokemon.id}>
            <Link
              href={`/pokemon/${pokemon.name}`}
              prefetch={false}
              className="card group flex flex-col p-3 transition-all hover:-translate-y-1 hover:border-mint-500/50"
            >
              <div className="dot-grid grid aspect-square place-items-center overflow-hidden rounded-xl bg-ink-900/60">
                {pokemon.officialArtwork ? (
                  <Image
                    src={pokemon.officialArtwork}
                    alt={pokemon.displayName}
                    width={140}
                    height={140}
                    className="h-auto w-[76%] transition-transform group-hover:scale-110"
                  />
                ) : null}
              </div>
              <h2 className="mt-2 truncate font-display text-sm font-bold text-white">
                {pokemon.displayName}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {pokemon.types.map((type) => (
                  <TypeBadge key={type} type={type} size="sm" />
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {data.missing.length > 0 ? (
        <p className="text-xs text-amber-300/80">
          No se han podido resolver {data.missing.length} entrada(s): {data.missing.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

export function TeamGrid() {
  const { favorites, clear } = useFavorites();
  const names = favorites.join(",");

  if (favorites.length === 0) return <EmptyTeam />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          <span className="font-mono text-white">{favorites.length}</span> en el equipo
        </p>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:text-rose-300"
        >
          Vaciar equipo
        </button>
      </div>

      <TeamList key={names} names={favorites} />
    </div>
  );
}
