import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card grid place-items-center gap-4 p-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/pokeball.svg" alt="" width={64} height={64} className="opacity-40" />
      <p className="font-mono text-sm text-slate-500">404</p>
      <h1 className="font-display text-2xl font-bold text-white">Ese Pokémon no está en la Pokédex</h1>
      <p className="max-w-md text-sm text-slate-400">
        El nombre o el identificador no existe en el catálogo. Puede que sea una forma alternativa
        que el dataset no incluye.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-mint-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-mint-400"
      >
        Volver al Pokédex
      </Link>
    </div>
  );
}
