import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { SITE_NAME, SITE_URL, siteDescription } from "@/lib/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pokédex · 1026 Pokémon de nueve generaciones",
    template: "%s · Pokédex",
  },
  description: siteDescription,
  applicationName: SITE_NAME,
  // El favicon sale de `src/app/icon.svg`, `icon.png` y `apple-icon.png`.
  // Se declara tambien aqui para fijar los tamaños que usan los navegadores.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: undefined,
  alternates: { canonical: "/" },
  keywords: [
    "pokédex",
    "pokedex",
    "pokémon",
    "pokemon",
    "catálogo de pokemon",
    "tipos de pokemon",
    "habilidades",
    "evoluciones",
    "PokeAPI",
  ],
  category: "reference",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_ES",
    title: "Pokédex · 1026 Pokémon de nueve generaciones",
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokédex · 1026 Pokémon de nueve generaciones",
    description: siteDescription,
  },
};

// La navegacion vive en `AppNav`: rail vertical en escritorio y cajon en movil.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh font-sans antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-mint-500 focus:px-4 focus:py-2 focus:text-ink-950"
        >
          Saltar al contenido
        </a>

        <AppNav />

        <main
          id="contenido"
          className="mx-auto max-w-7xl px-4 py-6 lg:pl-60"
        >
          {children}
        </main>

        <footer className="mt-16 py-8 text-sm text-slate-400">
          <div className="mx-auto max-w-7xl space-y-2 px-4">
            <div className="pointer-events-none mb-6 h-px bg-gradient-to-r from-transparent via-mint-500/50 to-transparent" />
            <p>
              Datos servidos por{" "}
              <a
                href="https://pokemon-api-6r6x.onrender.com"
                className="text-mint-400 underline underline-offset-4 hover:text-mint-500"
                target="_blank"
                rel="noreferrer noopener"
              >
                pokemon-api-6r6x
              </a>
              , generado desde PokeAPI. Sprites de{" "}
              <a
                href="https://github.com/PokeAPI/sprites"
                className="underline underline-offset-4 hover:text-white"
                target="_blank"
                rel="noreferrer noopener"
              >
                PokeAPI/sprites
              </a>
              .
            </p>
            <p className="text-slate-500">
              Pokémon® es marca registrada de Nintendo, The Pokémon Company y Game Freak. Proyecto
              sin ánimo de lucro.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
