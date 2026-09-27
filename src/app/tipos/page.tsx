import Link from "next/link";
import type { Metadata } from "next";
import { attempt, pokemonApi } from "@/lib/api/client";
import { ErrorPanel } from "@/components/error-panel";
import { typeColor } from "@/lib/pokemon-data";
import { sectionMetadata } from "@/lib/metadata";

export const metadata: Metadata = sectionMetadata(
  "/tipos",
  "Tipos",
  "Los tipos de Pokémon y cuántos hay de cada uno en el catálogo, con sus debilidades y resistencias.",
);

export const revalidate = 86400;

export default async function TypesPage() {
  const response = await attempt(pokemonApi.getTypes());
  if (!response.ok) return <ErrorPanel error={response.error} />;
  const types = response.value;

  const populated = types.filter((type) => type.pokemonCount > 0);
  const total = populated.reduce((sum, type) => sum + type.pokemonCount, 0);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">Tipos</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          {populated.length} tipos con Pokémon en el catálogo. El recuento incluye evoluciones: un
          Pokémon nacido de otro tipo cuenta para ambos. Suma total: {total}.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {types.map((type) => {
          const color = typeColor(type.slug);
          return (
            <li key={type.slug}>
              <Link
                href={`/?types=${type.slug}`}
                className="card group flex h-full flex-col items-center gap-2 p-4 text-center transition-all hover:-translate-y-1 hover:border-mint-500/50"
                style={{ borderColor: `${color.border}66` }}
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-full text-2xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: color.bg, color: color.text }}
                  aria-hidden
                >
                  ⬤
                </span>
                <span className="font-display text-sm font-bold text-white">{type.name}</span>
                <span className="font-mono text-xs text-slate-400">
                  {type.pokemonCount} Pokémon
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
