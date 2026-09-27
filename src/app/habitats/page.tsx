import Link from "next/link";
import type { Metadata } from "next";
import { attempt, pokemonApi } from "@/lib/api/client";
import { ErrorPanel } from "@/components/error-panel";
import { sectionMetadata } from "@/lib/metadata";

export const metadata: Metadata = sectionMetadata(
  "/habitats",
  "Hábitats",
  "Los hábitats naturales de los Pokémon y cuántos hay en cada uno.",
);

export const revalidate = 86400;

export default async function HabitatsPage() {
  const response = await attempt(pokemonApi.getHabitats());
  if (!response.ok) return <ErrorPanel error={response.error} />;
  const habitats = response.value;

  const withCount = habitats.filter((habitat) => (habitat.pokemonCount ?? 0) > 0);
  const max = Math.max(...withCount.map((habitat) => habitat.pokemonCount ?? 0), 1);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">Hábitats</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Dónde se encuentra cada Pokémon de forma natural. Los hábitats son un filtro con OR:{" "}
          <code className="text-slate-300">?habitats=cave,forest</code> trae los de cueva o bosque.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {habitats.map((habitat) => {
          const count = habitat.pokemonCount ?? 0;
          return (
            <li key={habitat.slug}>
              <Link
                href={`/?habitats=${habitat.slug}`}
                className={`card group block p-5 transition-all hover:-translate-y-1 hover:border-mint-500/50 ${
                  count === 0 ? "pointer-events-none opacity-40" : ""
                }`}
                aria-disabled={count === 0}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-bold text-white">{habitat.name}</h2>
                  <span className="font-mono text-sm text-slate-400">{count}</span>
                </div>
                <p className="font-mono text-xs text-slate-500">{habitat.slug}</p>
                <div
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"
                  role="img"
                  aria-label={`${count} Pokémon`}
                >
                  <div
                    className="h-full rounded-full bg-mint-500"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
