import { NextResponse } from "next/server";
import { pokemonApi } from "@/lib/api/client";
import type { PokemonListItem } from "@/lib/api/types";

export const revalidate = 86400;

/**
 * Resuelve una lista de nombres a sus fichas resumidas. Pasa por una route
 * handler para que el navegador haga una sola peticion y las respuestas de la
 * API queden cacheadas en el servidor: el cliente no gasta su cuota de
 * 120 peticiones/minuto y recargar el equipo no llama a la API.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("names") ?? "";

  const names = [
    ...new Set(
      raw
        .split(",")
        .map((name) => name.trim().toLowerCase())
        .filter((name) => /^[a-z0-9-]{1,40}$/.test(name)),
    ),
  ].slice(0, 60);

  if (names.length === 0) {
    return NextResponse.json({ items: [] satisfies PokemonListItem[] });
  }

  const results = await Promise.all(
    names.map(async (name) => {
      try {
        const pokemon = await pokemonApi.getPokemonByName(name, { revalidate: 86400 });
        const item: PokemonListItem = {
          id: pokemon.id,
          name: pokemon.name,
          displayName: pokemon.displayName,
          types: pokemon.types,
          generation: pokemon.generation,
          generationId: pokemon.generationId,
          region: pokemon.region,
          totalStats: pokemon.totalStats,
          isLegendary: pokemon.isLegendary,
          isMythical: pokemon.isMythical,
          officialArtwork: pokemon.sprites.officialArtwork,
        };
        return { name, item };
      } catch {
        return { name, item: null };
      }
    }),
  );

  const found = results
    .filter((result): result is { name: string; item: PokemonListItem } => result.item !== null)
    .map((result) => result.item);

  // Se respeta el orden en el que el usuario guardo los favoritos.
  const byName = new Map(found.map((item) => [item.name, item]));
  const items = names
    .map((name) => byName.get(name))
    .filter((item): item is PokemonListItem => item !== undefined);

  const missing = results.filter((result) => result.item === null).map((result) => result.name);

  return NextResponse.json({ items, missing });
}
