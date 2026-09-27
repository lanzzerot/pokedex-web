import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ApiError, pokemonApi } from "@/lib/api/client";
import { ChainStrip, Evolutions, TypeMatchupHint } from "@/components/evolutions";
import { FavoriteButton } from "@/components/favorite-button";
import { ErrorPanel } from "@/components/error-panel";
import { ShinyToggle, StatsBars } from "@/components/pokemon-detail-parts";
import { TypeGlow } from "@/components/type-glow";
import {
  formatGender,
  formatNumber,
  RARITY_LABELS,
  rarityOf,
  titleCase,
} from "@/lib/pokemon-data";

export const revalidate = 86400;

interface Params {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { name } = await params;
  const url = `/pokemon/${name}`;

  try {
    const pokemon = await pokemonApi.getPokemonByName(name);
    const descripcion =
      pokemon.description?.replace(/\n+/g, " ").trim() ??
      `Ficha de ${pokemon.displayName} en la Pokédex.`;
    const resumen = descripcion.length > 160 ? `${descripcion.slice(0, 157)}...` : descripcion;
    const tipos = pokemon.types.map(titleCase).join(" y ");

    return {
      title: `${pokemon.displayName} · ${pokemon.genus ?? "Pokémon"}`,
      description: `${resumen} ${pokemon.displayName} es de tipo ${tipos}, de la ${titleCase(pokemon.region)} yGeneration ${pokemon.generationId}.`,
      alternates: { canonical: url },
      openGraph: {
        type: "article",
        url,
        title: `${pokemon.displayName} · ${pokemon.genus ?? "Pokémon"}`,
        description: resumen,
        images: pokemon.sprites.officialArtwork
          ? [{ url: pokemon.sprites.officialArtwork, width: 475, height: 475, alt: pokemon.displayName }]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: pokemon.displayName,
        description: resumen,
        images: pokemon.sprites.officialArtwork ? [pokemon.sprites.officialArtwork] : undefined,
      },
    };
  } catch {
    return { title: titleCase(name), alternates: { canonical: url } };
  }
}

export default async function PokemonDetailPage({ params }: Params) {
  const { name } = await params;

  let pokemon: Awaited<ReturnType<typeof pokemonApi.getPokemonByName>>;
  try {
    pokemon = await pokemonApi.getPokemonByName(name);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <ErrorPanel error={error} title="No se pudo cargar la ficha" />;
  }

  const chain = await pokemonApi.getEvolutionChain(pokemon.name).catch(() => null);
  const rarity =
    RARITY_LABELS[rarityOf(pokemon.isLegendary, pokemon.isMythical)] ?? null;
  const artwork = pokemon.sprites.officialArtwork;

  return (
    <article className="space-y-6">
      <nav aria-label="Migas de pan" className="text-sm text-slate-400">
        <Link href="/" className="hover:text-mint-400">
          Pokédex
        </Link>
        <span className="px-2 text-slate-600">/</span>
        <span className="text-white">{pokemon.displayName}</span>
      </nav>

      <header className="card dot-grid relative overflow-hidden p-6 sm:p-8">
        <TypeGlow types={pokemon.types} />

        <div className="relative grid gap-6 sm:grid-cols-[1fr_220px]">
          <div className="min-w-0">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm text-slate-400">
                  Nº {String(pokemon.id).padStart(4, "0")}
                </p>
                <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {pokemon.displayName}
                </h1>
                {pokemon.genus ? (
                  <p className="text-sm text-slate-400">{pokemon.genus}</p>
                ) : null}
              </div>
              <FavoriteButton
                name={pokemon.name}
                displayName={pokemon.displayName}
                className="h-11 w-11 text-xl"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <TypeMatchupHint types={pokemon.types} />
              {rarity && (pokemon.isLegendary || pokemon.isMythical) ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ring-1 ${rarity.className}`}
                >
                  {rarity.label}
                </span>
              ) : null}
            </div>

            {pokemon.description ? (
              <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {pokemon.description}
              </p>
            ) : null}

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Fact label="Generación">
                <Link
                  href={`/?generations=${pokemon.generation}`}
                  className="hover:text-mint-400"
                >
                  {titleCase(pokemon.generation)}
                </Link>
              </Fact>
              <Fact label="Región">
                <Link href={`/?regions=${pokemon.region}`} className="hover:text-mint-400">
                  {titleCase(pokemon.region)}
                </Link>
              </Fact>
              <Fact label="Altura">
                {pokemon.height.value} {pokemon.height.unit === "metre" ? "m" : ""}
              </Fact>
              <Fact label="Peso">
                {pokemon.weight.value} {pokemon.weight.unit === "kilogram" ? "kg" : ""}
              </Fact>
              <Fact label="Experiencia base">
                {formatNumber(pokemon.baseExperience)}
              </Fact>
              <Fact label="Felicidad base">{formatNumber(pokemon.baseHappiness)}</Fact>
              <Fact label="Tasa de captura">{formatNumber(pokemon.captureRate)}</Fact>
              <Fact label="Grupos de huevo">
                {pokemon.eggGroups.length > 0
                  ? pokemon.eggGroups.map((group) => titleCase(group)).join(", ")
                  : "—"}
              </Fact>
              <Fact label="Hábitat">
                {pokemon.habitat ? titleCase(pokemon.habitat) : "Desconocido"}
              </Fact>
              <Fact label="Género">{formatGender(pokemon.genderRate)}</Fact>
              <Fact label="Curva de experiencia">
                {pokemon.growthRate ? titleCase(pokemon.growthRate) : "—"}
              </Fact>
              <Fact label="Forma">{pokemon.shape ? titleCase(pokemon.shape) : "—"}</Fact>
              <Fact label="Color">{pokemon.color ? titleCase(pokemon.color) : "—"}</Fact>
              <Fact label="Eclosión">
                {pokemon.hatchCounter !== null
                  ? `${pokemon.hatchCounter} pasos`
                  : "No eclosiona de huevo"}
              </Fact>
              <Fact label="Diferencias de género">
                {pokemon.hasGenderDifferences ? "Sí" : "No"}
              </Fact>
            </dl>
          </div>

          <div className="flex items-center justify-center">
            {artwork ? (
              <ShinyToggle normal={artwork} shiny={pokemon.sprites.officialArtworkShiny} />
            ) : (
              <p className="text-sm text-slate-500">Sin ilustración</p>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-white">Estadísticas base</h2>
          <StatsBars stats={pokemon.stats} />
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-white">Habilidades</h2>
          {pokemon.abilities.length === 0 ? (
            <p className="text-sm text-slate-400">Sin habilidades registradas.</p>
          ) : (
            <ul className="space-y-2">
              {pokemon.abilities.map((ability) => (
                <li key={`${ability.name}-${ability.slot}`}>
                  <Link
                    href={`/habilidades?search=${ability.name}`}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-ink-850 px-3 py-2 transition-colors hover:border-mint-500/50"
                  >
                    <span className="font-mono text-xs text-slate-500">
                      {ability.isHidden ? "Oculta" : ability.slot}
                    </span>
                    <span className="flex-1 font-medium text-white">{ability.displayName}</span>
                    {ability.isHidden ? (
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-violet-200 ring-1 ring-violet-400/40">
                        oculta
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-white">Evolución</h2>
        <Evolutions pokemon={pokemon} />
      </section>

      {chain && chain.members.length > 1 ? (
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-white">
            Cadena evolutiva completa
          </h2>
          <ChainStrip members={chain.members} currentId={pokemon.id} />
        </section>
      ) : null}

      {pokemon.sprites.pixelArt || pokemon.sprites.frontDefault ? (
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-white">Sprites</h2>
          <div className="flex flex-wrap items-end gap-6">
            {pokemon.sprites.pixelArt ? (
              <Figure caption="Pixel art (Gen VIII)">
                <Image
                  src={pokemon.sprites.pixelArt}
                  alt={`Pixel art de ${pokemon.displayName}`}
                  width={96}
                  height={96}
                  className="h-24 w-24"
                  unoptimized
                />
              </Figure>
            ) : null}
            {pokemon.sprites.frontDefault ? (
              <Figure caption="Sprite de bolsillo">
                <Image
                  src={pokemon.sprites.frontDefault}
                  alt={`Sprite de ${pokemon.displayName}`}
                  width={96}
                  height={96}
                  className="h-24 w-24"
                  unoptimized
                />
              </Figure>
            ) : null}
            {pokemon.sprites.frontShiny ? (
              <Figure caption="Sprite shiny">
                <Image
                  src={pokemon.sprites.frontShiny}
                  alt={`Sprite shiny de ${pokemon.displayName}`}
                  width={96}
                  height={96}
                  className="h-24 w-24"
                  unoptimized
                />
              </Figure>
            ) : null}
            {pokemon.sprites.homeArtwork ? (
              <Figure caption="Home (Switch)">
                <Image
                  src={pokemon.sprites.homeArtwork}
                  alt={`Arte de ${pokemon.displayName} para Nintendo Switch`}
                  width={96}
                  height={96}
                  className="h-24 w-24"
                  unoptimized
                />
              </Figure>
            ) : null}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="truncate font-medium text-slate-200">{children}</dd>
    </div>
  );
}

function Figure({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="text-center">
      <div className="dot-grid grid place-items-center rounded-xl bg-ink-900/60 p-3">
        {children}
      </div>
      <figcaption className="mt-1.5 text-xs text-slate-500">{caption}</figcaption>
    </figure>
  );
}
