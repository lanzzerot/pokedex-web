import Link from "next/link";
import { Suspense } from "react";
import { attempt, pokemonApi } from "@/lib/api/client";
import { ErrorPanel } from "@/components/error-panel";
import { FilterPanel, type FilterOptions } from "@/components/filter-panel";
import { Pagination } from "@/components/pagination";
import { PokemonCard } from "@/components/pokemon-card";
import type { PokemonQuery } from "@/lib/api/client";
import { SITE_NAME } from "@/lib/metadata";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const CATALOGO =
  "Los 1026 Pokémon de la novena generación en un solo catálogo: filtra por tipo, generación, región, habitat, habilidad, rareza y estadísticas.";

export const metadata: Metadata = {
  title: {
    absolute: `Pokédex · 1026 Pokémon de nueve generaciones`,
  },
  description: CATALOGO,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_ES",
    url: "/",
    title: "Pokédex · 1026 Pokémon de nueve generaciones",
    description: CATALOGO,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokédex · 1026 Pokémon de nueve generaciones",
    description: CATALOGO,
  },
};

type SearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function num(value: string | string[] | undefined): number | undefined {
  const text = single(value);
  if (text === undefined || text.trim() === "") return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildQuery(params: SearchParams): PokemonQuery {
  return {
    name: single(params.name),
    types: single(params.types),
    abilities: single(params.abilities),
    generations: single(params.generations),
    regions: single(params.regions),
    eggGroups: single(params.eggGroups),
    habitats: single(params.habitats),
    rarity: single(params.rarity),
    minHeight: num(params.minHeight),
    maxHeight: num(params.maxHeight),
    minWeight: num(params.minWeight),
    maxWeight: num(params.maxWeight),
    minBaseExperience: num(params.minBaseExperience),
    minTotalStats: num(params.minTotalStats),
    maxTotalStats: num(params.maxTotalStats),
    minStat: single(params.minStat),
    minStatValue: num(params.minStatValue),
    sortBy: single(params.sortBy) ?? "id",
    sortDirection: single(params.sortDirection) ?? "asc",
    page: num(params.page) ?? 1,
    pageSize: num(params.pageSize) ?? 24,
  };
}

async function getFilterOptions(): Promise<FilterOptions> {
  const [types, generations, regions, eggGroups, habitats, abilities] = await Promise.all([
    pokemonApi.getTypes(),
    pokemonApi.getGenerations(),
    pokemonApi.getRegions(),
    pokemonApi.getEggGroups(),
    pokemonApi.getHabitats(),
    pokemonApi.getAbilities(),
  ]);

  return { types, generations, regions, eggGroups, habitats, abilities };
}

export default async function PokedexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const [options, result] = await Promise.all([
    attempt(getFilterOptions()),
    attempt(pokemonApi.listPokemon(buildQuery(params))),
  ]);

  if (!options.ok) return <ErrorPanel error={options.error} />;
  if (!result.ok) {
    return (
      <div className="space-y-6">
        <Header total={null} />
        <ErrorPanel error={result.error} />
      </div>
    );
  }

  const page = result.value;

  return (
    <div className="space-y-6">
      <Header total={page.totalCount} />

      <Suspense fallback={<FiltersSkeleton />}>
        <FilterPanel options={options.value} />
      </Suspense>

      {page.items.length === 0 ? (
        <EmptyState outOfRange={page.page > 1} totalPages={page.totalPages} />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {page.items.map((pokemon) => (
              <li key={pokemon.id}>
                <PokemonCard pokemon={pokemon} />
              </li>
            ))}
          </ul>

          <Suspense fallback={null}>
            <Pagination
              page={page.page}
              totalPages={page.totalPages}
              totalCount={page.totalCount}
              pageSize={page.pageSize}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}

function Header({ total }: { total: number | null }) {
  return (
    <div className="space-y-2">
      <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Pokédex
      </h1>
      <p className="max-w-2xl text-sm text-slate-400">
        {total === null
          ? "Explorando el catálogo…"
          : `${new Intl.NumberFormat("es-ES").format(total)} Pokémon de nueve generaciones, con tipos, habilidades, evoluciones, grupos de huevo, hábitats y regiones.`}
      </p>
    </div>
  );
}

function FiltersSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-11 animate-pulse rounded-xl bg-ink-850" />
      <div className="h-9 w-72 animate-pulse rounded-lg bg-ink-850" />
    </div>
  );
}

/**
 * Distingue "no hay resultados" de "estas en una pagina que no existe": la API
 * devuelve `items: []` en ambos casos, pero la causa y el remedio son otros.
 */
function EmptyState({ outOfRange, totalPages }: { outOfRange: boolean; totalPages: number }) {
  if (outOfRange) {
    return (
      <div className="card grid place-items-center gap-3 p-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/pokeball.svg" alt="" width={56} height={56} className="opacity-40" />
        <h2 className="font-display text-lg font-bold text-white">Esa página no existe</h2>
        <p className="max-w-md text-sm text-slate-400">
          {totalPages > 0
            ? `Con los filtros actuales solo hay ${totalPages} página(s). Vuelve a la primera para ver los resultados.`
            : "Vuelve a la primera página para ver los resultados."}
        </p>
        <Link
          href="/"
          className="mt-2 rounded-xl bg-mint-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-mint-400"
        >
          Ir a la primera página
        </Link>
      </div>
    );
  }

  return (
    <div className="card grid place-items-center gap-3 p-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/pokeball.svg"
        alt=""
        width={56}
        height={56}
        className="animate-spin-slow opacity-40"
      />
      <h2 className="font-display text-lg font-bold text-white">Ningún Pokémon coincide</h2>
      <p className="max-w-md text-sm text-slate-400">
        Prueba a quitar algún filtro. Dentro de un mismo campo los valores se combinan con OR, así
        que dos tipos distintos pueden no dar resultados juntos.
      </p>
    </div>
  );
}
