import { Suspense } from "react";
import type { Metadata } from "next";
import { attempt, pokemonApi } from "@/lib/api/client";
import { AbilitiesBrowser } from "@/components/abilities-browser";
import { ErrorPanel } from "@/components/error-panel";
import type { AbilityEntry } from "@/lib/api/types";
import { sectionMetadata } from "@/lib/metadata";

export const metadata: Metadata = sectionMetadata(
  "/habilidades",
  "Habilidades",
  "Las habilidades de los Pokémon, buscables por nombre y por descripción de su efecto.",
);

export const revalidate = 86400;

type SearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string {
  const text = Array.isArray(value) ? value[0] : value;
  return text?.trim() ?? "";
}

/** El mismo criterio que el filtro `name` de la API: nombre, slug y efecto. */
function matches(ability: AbilityEntry, term: string): boolean {
  if (!term) return true;
  const needle = term.toLowerCase();
  return (
    ability.name.toLowerCase().includes(needle) ||
    ability.slug.includes(needle) ||
    (ability.shortEffect?.toLowerCase().includes(needle) ?? false)
  );
}

export default async function AbilitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = single(params.search);
  const onlyMain = single(params.main) === "1";

  const response = await attempt(pokemonApi.getAbilities());
  if (!response.ok) return <ErrorPanel error={response.error} />;
  const abilities = response.value;

  // El filtro se aplica tambien en servidor para que el HTML que llega al
  // navegador ya venga filtrado: un enlace con ?search=flight es compartible
  // y se ve bien incluso sin JavaScript.
  const initial = abilities
    .filter((ability) => (onlyMain ? ability.isMainSeries : true))
    .filter((ability) => matches(ability, search))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">Habilidades</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          {abilities.length} habilidades. La búsqueda mira en el nombre y en la descripción del
          efecto, igual que el filtro <code className="text-slate-300">?name=</code> de la API. Pulsa
          cualquiera para ver los Pokémon que la tienen.
        </p>
      </header>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-ink-850" />}>
        <AbilitiesBrowser
          all={abilities}
          initial={initial}
          initialSearch={search}
          initialOnlyMain={onlyMain}
        />
      </Suspense>
    </div>
  );
}
