import Link from "next/link";
import type { Metadata } from "next";
import { attempt, pokemonApi } from "@/lib/api/client";
import { ErrorPanel } from "@/components/error-panel";
import { sectionMetadata } from "@/lib/metadata";

export const metadata: Metadata = sectionMetadata(
  "/grupos-huevo",
  "Grupos de huevo",
  "Los grupos de huevo de los Pokémon y qué especies los comparten.",
);

export const revalidate = 86400;

export default async function EggGroupsPage() {
  const response = await attempt(pokemonApi.getEggGroups());
  if (!response.ok) return <ErrorPanel error={response.error} />;
  const groups = response.value;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">
          Grupos de huevo
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          En plural porque un Pokémon puede pertenecer a varios. El endpoint no expone el recuento,
          así que cada enlace lleva al catálogo filtrado.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {groups.map((group) => (
          <li key={group.slug}>
            <Link
              href={`/?eggGroups=${group.slug}`}
              className="card group flex flex-col items-center gap-1 p-5 text-center transition-all hover:-translate-y-1 hover:border-mint-500/50"
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-full bg-mint-500/10 font-display text-lg font-bold text-mint-400 transition-transform group-hover:scale-110"
                aria-hidden
              >
                {group.name.charAt(0)}
              </span>
              <span className="font-display text-sm font-bold text-white">{group.name}</span>
              <span className="font-mono text-[0.65rem] text-slate-500">{group.slug}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
