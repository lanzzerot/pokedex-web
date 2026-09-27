"use client";

import { useState } from "react";
import { STAT_ORDER, statLabel, statShort } from "@/lib/pokemon-data";
import type { PokemonStats } from "@/lib/api/types";

const MAX_STAT = 255;

export function StatsBars({ stats }: { stats: PokemonStats }) {
  return (
    <div className="space-y-2.5">
      {STAT_ORDER.map((stat) => {
        const value = stats[stat];
        const pct = Math.min(100, (value / MAX_STAT) * 100);
        const color = value >= 150 ? "bg-mint-400" : value >= 100 ? "bg-sky-400" : "bg-slate-500";

        return (
          <div key={stat} className="flex items-center gap-3">
            <span className="w-12 shrink-0 font-mono text-xs font-bold text-slate-300">
              {statShort(stat)}
            </span>
            <div
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/8"
              role="img"
              aria-label={`${statLabel(stat)}: ${value} de ${MAX_STAT}`}
            >
              <div
                className={`h-full rounded-full ${color} transition-[width] duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right font-mono text-xs text-white">{value}</span>
          </div>
        );
      })}

      <div className="flex items-center gap-3 border-t border-white/10 pt-2.5">
        <span className="w-12 shrink-0 font-mono text-xs font-bold text-mint-400">Σ</span>
        <span className="flex-1 text-xs uppercase tracking-wider text-slate-500">
          Suma total
        </span>
        <span className="font-mono text-sm font-bold text-mint-400">{stats.total}</span>
      </div>
    </div>
  );
}

export function ShinyToggle({ normal, shiny }: { normal: string; shiny: string | null }) {
  const [isShiny, setIsShiny] = useState(false);
  const src = isShiny && shiny ? shiny : normal;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={isShiny ? "Ilustración shiny" : "Ilustración normal"}
        width={220}
        height={220}
        className="h-52 w-52 object-contain drop-shadow-2xl transition-all"
      />
      <button
        type="button"
        onClick={() => setIsShiny((v) => !v)}
        disabled={!shiny}
        aria-pressed={isShiny}
        className="rounded-full border border-white/15 bg-ink-850 px-4 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-mint-500 hover:text-white disabled:opacity-35"
      >
        {shiny ? (isShiny ? "✦ Shiny · volver al normal" : "✧ Ver shiny") : "Sin shiny"}
      </button>
    </div>
  );
}
