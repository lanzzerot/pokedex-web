import type { Metadata } from "next";
import { Suspense } from "react";
import { TeamGrid } from "@/components/team-grid";
import { sectionMetadata } from "@/lib/metadata";

export const metadata: Metadata = sectionMetadata(
  "/equipo",
  "Mi equipo",
  "Los Pokémon que has guardado en este navegador.",
);

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">Mi equipo</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Tus Pokémon guardados. Viven en el <code className="text-slate-300">localStorage</code>{" "}
          de este navegador: no hay cuenta ni base de datos detrás.
        </p>
      </header>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-ink-850" />}>
        <TeamGrid />
      </Suspense>
    </div>
  );
}
