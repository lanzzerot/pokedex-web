import type { Metadata } from "next";

/**
 * URL de origen del sitio. Sin esto, `metadataBase` cae en el placeholder
 * anterior y las URLs de Open Graph salen con un dominio inventado. Se puede
 * fijar con `NEXT_PUBLIC_SITE_URL` en el despliegue.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://pokedex-web.vercel.app";

export const SITE_NAME = "Pokédex";

const DESCRIPTION =
  "Explora el catálogo completo de Pokémon con 1026 fichas: filtra por tipo, generación, región, habitat, habilidad, rareza y estadísticas. Búsqueda instantánea y datos actualizados.";

/**
 * Metadatos de una pagina de seccion: canonical, Open Graph y Twitter.
 *
 * Antes cada pagina declaraba solo titulo y descripcion, asi que al compartir
 * un enlace no salia nada en Facebook, X ni WhatsApp, y no habia URL canonica
 * que dijera cual es la version buena de cada pagina.
 */
export function sectionMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  const url = path === "/" ? "/" : path;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "es_ES",
      url,
      title: `${title} · ${SITE_NAME}`,
      description,
    },
    twitter: {
      card: "summary",
      title: `${title} · ${SITE_NAME}`,
      description,
    },
  };
}

export const siteDescription = DESCRIPTION;
