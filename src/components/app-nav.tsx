"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SearchPalette } from "./search-palette";

const NAV = [
  { href: "/", label: "Pokédex", exact: true },
  { href: "/tipos", label: "Tipos", exact: false },
  { href: "/generaciones", label: "Generaciones", exact: false },
  { href: "/regiones", label: "Regiones", exact: false },
  { href: "/habilidades", label: "Habilidades", exact: false },
  { href: "/habitats", label: "Hábitats", exact: false },
  { href: "/grupos-huevo", label: "Huevos", exact: false },
  { href: "/equipo", label: "Mi equipo", exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

function IconoBuscar({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`${className} shrink-0 text-mint-500`}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function EnlaceNav({
  href,
  label,
  activo,
  onNavigate,
}: {
  href: string;
  label: string;
  activo: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={activo ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors ${
        activo ? "text-white" : "text-slate-400 hover:bg-white/8 hover:text-white"
      }`}
    >
      {activo && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-mint-500 shadow-[0_0_10px_1px_rgb(232_37_60/0.8)]"
        />
      )}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function BotonBuscador({
  onClick,
  ancho,
}: {
  onClick: () => void;
  ancho: "completo" | "compacto";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Buscar Pokémon"
      className={`flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 text-sm text-slate-400 transition-colors hover:border-mint-500/50 hover:text-white ${
        ancho === "completo" ? "w-full px-3 py-2.5" : "px-2.5 py-2"
      }`}
    >
      <IconoBuscar />
      {ancho === "compacto" ? (
        <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] lg:block">
          ⌘K
        </kbd>
      ) : (
        <>
          <span className="flex-1 text-left">Buscar Pokémon</span>
          <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </>
      )}
    </button>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const [cajon, setCajon] = useState(false);
  const [palette, setPalette] = useState(false);

  const abrirBuscador = useCallback(() => setPalette(true), []);
  const cerrarBuscador = useCallback(() => setPalette(false), []);
  const cerrarCajon = useCallback(() => setCajon(false), []);

  // Ctrl/Cmd+K abre el buscador desde cualquier pagina.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPalette((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // El cajon bloquea el scroll del fondo mientras esta abierto.
  useEffect(() => {
    if (!cajon) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [cajon]);

  return (
    <>
      {/* Escritorio: rail fijo a la izquierda. */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col gap-1 border-r border-white/10 bg-ink-950/90 px-3 py-4 backdrop-blur-md lg:flex"
      >
        <Link
          href="/"
          className="group mb-3 flex items-center gap-2 px-1"
          aria-label="Ir a la Pokédex"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/pokeball.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 transition-transform group-hover:scale-110"
          />
          <span className="font-display text-sm font-bold tracking-tight text-white">
            Pokédex
          </span>
        </Link>

        <BotonBuscador onClick={abrirBuscador} ancho="completo" />

        <div className="my-2 h-px bg-white/10" />

        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <EnlaceNav
              key={item.href}
              {...item}
              activo={isActive(pathname, item.href, item.exact)}
            />
          ))}
        </div>

        <p className="px-2 text-[11px] leading-snug text-slate-600">
          1026 Pokémon · 9 generaciones
        </p>
      </nav>

      {/* Movil y tablet: barra superior con buscador y boton de menu. */}
      <nav
        aria-label="Navegación principal"
        className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-white/10 bg-ink-950/90 px-3 backdrop-blur-md lg:hidden"
      >
        <Link href="/" className="flex shrink-0 items-center gap-1.5" aria-label="Ir a la Pokédex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/pokeball.svg" alt="" width={24} height={24} className="h-6 w-6" />
          <span className="font-display text-sm font-bold tracking-tight text-white">
            Pokédex
          </span>
        </Link>

        <div className="ml-auto">
          <BotonBuscador onClick={abrirBuscador} ancho="compacto" />
        </div>

        <button
          type="button"
          onClick={() => setCajon(true)}
          aria-label="Abrir menú"
          aria-expanded={cajon}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/40 text-slate-300"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
            aria-hidden
          >
            <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </nav>

      {/* Cajon: una columna a pantalla completa, sin scroll horizontal. */}
      {cajon && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={cerrarCajon}
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
          />
          <div className="glass absolute inset-y-0 right-0 flex w-[17rem] max-w-[85vw] flex-col gap-1 border-l border-white/10 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm font-bold text-white">Menú</span>
              <button
                type="button"
                onClick={cerrarCajon}
                aria-label="Cerrar menú"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-0.5 overflow-y-auto">
              {NAV.map((item) => (
                <EnlaceNav
                  key={item.href}
                  {...item}
                  activo={isActive(pathname, item.href, item.exact)}
                  onNavigate={cerrarCajon}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <SearchPalette open={palette} onClose={cerrarBuscador} />
    </>
  );
}
