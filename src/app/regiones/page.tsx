import Link from "next/link";
import type { Metadata } from "next";
import { attempt, pokemonApi } from "@/lib/api/client";
import { ErrorPanel } from "@/components/error-panel";
import { sectionMetadata } from "@/lib/metadata";

export const metadata: Metadata = sectionMetadata(
  "/regiones",
  "Regiones",
  "Las nueve regiones de Pokémon, derivadas de sus generaciones.",
);

export const revalidate = 86400;

export default async function RegionsPage() {
  const response = await attempt(pokemonApi.getRegions());
  if (!response.ok) return <ErrorPanel error={response.error} />;
  const regions = response.value;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">Regiones</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Las regiones se derivan de las generaciones a las que pertenecen: cada generación aporta
          su región y su recuento de Pokémon.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map((region) => (
          <li key={region.slug}>
            <Link
              href={`/?regions=${region.slug}`}
              className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-1 hover:border-mint-500/50"
            >
              <span
                className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-mint-600/40 to-ink-800 font-display text-xl font-bold text-mint-400 transition-transform group-hover:scale-105"
                aria-hidden
              >
                {region.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-white">{region.name}</h2>
                <p className="font-mono text-xs text-slate-500">{region.slug}</p>
                <p className="mt-1 text-sm text-slate-400">
                  <span className="font-mono text-white">{region.pokemonCount}</span> Pokémon
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
