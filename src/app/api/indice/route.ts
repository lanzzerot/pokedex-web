import { NextResponse } from "next/server";
import { buildIndex } from "@/lib/search-index";

export const revalidate = 86400;

/**
 * Indice completo del catalogo en un unico JSON, para que el buscador del
 * navbar filtre en el navegador sin generar una peticion por pulsacion.
 *
 * Vive en el servidor porque la API limita `pageSize` a 100: son 11 paginas
 * que se piden y cachean aqui una sola vez al dia.
 */
export async function GET() {
  const entries = await buildIndex();

  return NextResponse.json(
    { entries },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
