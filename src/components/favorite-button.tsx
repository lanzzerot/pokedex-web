"use client";

import { useFavorites } from "./use-favorites";

export function FavoriteButton({
  name,
  displayName,
  className = "",
}: {
  name: string;
  displayName: string;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(name);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active
          ? `Quitar ${displayName} de mi equipo`
          : `Añadir ${displayName} a mi equipo`
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(name);
      }}
      className={`grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-ink-900/80 text-lg backdrop-blur transition-all hover:scale-110 hover:border-rose-400/60 ${className}`}
    >
      <span className={active ? "text-rose-500" : "text-slate-600"} aria-hidden>
        {active ? "♥" : "♡"}
      </span>
    </button>
  );
}
