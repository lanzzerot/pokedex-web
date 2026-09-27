import Link from "next/link";
import type { Metadata } from "next";
import { attempt, pokemonApi } from "@/lib/api/client";
import { ErrorPanel } from "@/components/error-panel";
import { sectionMetadata } from "@/lib/metadata";

export const metadata: Metadata = sectionMetadata(
  "/generaciones",
  "Generaciones",
  "Las nueve generaciones de Pokémon con su región, su Pokémon inicial y su recuento.",
);

export const revalidate = 86400;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

export default async function GenerationsPage() {
  const response = await attempt(pokemonApi.getGenerations());
  if (!response.ok) return <ErrorPanel error={response.error} />;
  const generations = response.value;

  const max = Math.max(...generations.map((g) => g.pokemonCount));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">
          Generaciones
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Nueve generaciones, cada una con su región. El filtro de generaciones acepta número o
          slug, y se puede combinar con el de regiones.
        </p>
      </header>

      <ul className="space-y-3">
        {generations.map((generation, index) => (
          <li key={generation.slug}>
            <Link
              href={`/?generations=${generation.slug}`}
              className="card group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-mint-500/50 sm:gap-6 sm:p-5"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-mint-500/40 bg-mint-500/10 font-display text-lg font-bold text-mint-400 transition-transform group-hover:scale-105">
                {ROMAN[index] ?? `Gen ${generation.id}`}
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-bold text-white">{generation.name}</h2>
                <p className="text-sm text-slate-400">
                  Región {generation.regionName} ·{" "}
                  <span className="font-mono">{generation.slug}</span>
                </p>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8"
                  role="img"
                  aria-label={`${generation.pokemonCount} Pokémon`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mint-600 to-mint-400"
                    style={{ width: `${(generation.pokemonCount / max) * 100}%` }}
                  />
                </div>
              </div>

              <span className="shrink-0 text-right">
                <span className="block font-mono text-xl font-bold text-white">
                  {generation.pokemonCount}
                </span>
                <span className="block text-[0.6rem] uppercase tracking-wide text-slate-500">
                  Pokémon
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
