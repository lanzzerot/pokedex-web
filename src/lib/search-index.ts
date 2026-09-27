import { pokemonApi } from "@/lib/api/client";
import type { PokemonListItem } from "@/lib/api/types";

/**
 * Indice compacto de todo el catalogo para la busqueda instantanea del cliente.
 *
 * El buscador del navbar filtra en memoria contra este indice, asi que escribir
 * no genera ninguna peticion: solo una cuando se abre por primera vez. La API
 * limita `pageSize` a 100, de ahi las 11 paginas; todas se resuelven en el
 * servidor y se cachean un dia, asi que el navegador recibe un unico JSON.
 */
export interface IndexEntry {
  id: number;
  name: string;
  displayName: string;
  types: string[];
  generationId: number;
  region: string;
  officialArtwork: string | null;
}

const PAGE_SIZE = 100;

function trim(item: PokemonListItem): IndexEntry {
  return {
    id: item.id,
    name: item.name,
    displayName: item.displayName,
    types: item.types,
    generationId: item.generationId,
    region: item.region,
    officialArtwork: item.officialArtwork,
  };
}

export async function buildIndex(): Promise<IndexEntry[]> {
  const first = await pokemonApi.listPokemon({ page: 1, pageSize: PAGE_SIZE });

  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      pokemonApi
        .listPokemon({ page: i + 2, pageSize: PAGE_SIZE })
        .then((page) => page.items),
    ),
  );

  return [first.items, ...rest].flat().map(trim);
}
