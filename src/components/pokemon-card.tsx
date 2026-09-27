import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "./favorite-button";
import { TypeBadge } from "./type-badge";
import { RARITY_LABELS, rarityOf, titleCase } from "@/lib/pokemon-data";
import type { PokemonListItem } from "@/lib/api/types";

export function PokemonCard({ pokemon }: { pokemon: PokemonListItem }) {
  const rarityStyle =
    pokemon.isLegendary || pokemon.isMythical
      ? RARITY_LABELS[rarityOf(pokemon.isLegendary, pokemon.isMythical)] ?? null
      : null;

  return (
    <Link
      href={`/pokemon/${pokemon.name}`}
      // Sin esto Next precarga la ficha de cada tarjeta visible: 24 peticiones
      // al catálogo y otras tantas a la API en cuanto se abre la pagina, sin
      // que el usuario haya pedido ninguna.
      prefetch={false}
      className="card group relative flex flex-col overflow-hidden p-3 transition-all hover:-translate-y-1 hover:border-mint-500/50 hover:shadow-xl hover:shadow-mint-500/5"
    >
      <div className="absolute right-2 top-2 z-10">
        <FavoriteButton name={pokemon.name} displayName={pokemon.displayName} />
      </div>

      <div className="dot-grid relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-ink-900/60">
        {pokemon.officialArtwork ? (
          <Image
            src={pokemon.officialArtwork}
            alt={pokemon.displayName}
            width={160}
            height={160}
            loading="lazy"
            className="h-auto w-[78%] drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <span className="text-xs text-slate-600">Sin imagen</span>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-slate-500">
            Nº {String(pokemon.id).padStart(4, "0")}
          </p>
          <h2 className="truncate font-display text-base font-bold text-white">
            {pokemon.displayName}
          </h2>
          <p className="truncate text-xs text-slate-500">
            {titleCase(pokemon.generation)} · {titleCase(pokemon.region)}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block font-mono text-sm font-bold text-mint-400">
            {pokemon.totalStats}
          </span>
          <span className="block text-[0.6rem] uppercase tracking-wide text-slate-500">stats</span>
        </p>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {pokemon.types.map((type) => (
          <TypeBadge key={type} type={type} size="sm" />
        ))}
        {rarityStyle ? (
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide ring-1 ${rarityStyle.className}`}
          >
            {rarityStyle.label}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
