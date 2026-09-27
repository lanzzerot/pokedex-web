"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

function buildPageHref(
  pathname: string,
  searchParams: URLSearchParams,
  page: number,
  pageSize: number,
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return `${pathname}?${params.toString()}`;
}

function range(current: number, total: number, span: number): number[] {
  const half = Math.floor(span / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + span - 1);
  start = Math.max(1, end - span + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  const go = (target: number) => {
    if (target < 1 || target > totalPages || target === page) return;
    const href = buildPageHref(pathname, searchParams, target, pageSize);
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  const first = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalCount);

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
    >
      <p className="text-sm text-slate-400" aria-live="polite">
        Mostrando <span className="font-mono text-white">{first}</span>–
        <span className="font-mono text-white">{last}</span> de{" "}
        <span className="font-mono text-white">{totalCount}</span> Pokémon
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <PageButton onClick={() => go(1)} disabled={page === 1} short="«" label="Primera" />
        <PageButton onClick={() => go(page - 1)} disabled={page === 1} short="‹" label="Anterior" />

        {range(page, totalPages, 5).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => go(n)}
            aria-current={n === page ? "page" : undefined}
            className={`h-9 min-w-9 rounded-lg px-2.5 font-mono text-sm transition-colors ${
              n === page
                ? "bg-mint-500 font-bold text-ink-950"
                : "bg-ink-850 text-slate-300 hover:bg-ink-700 hover:text-white"
            }`}
          >
            {n}
          </button>
        ))}

        <PageButton
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
          short="›"
          label="Siguiente"
        />
        <PageButton
          onClick={() => go(totalPages)}
          disabled={page === totalPages}
          short="»"
          label="Última"
        />
      </div>

      {isPending ? <span className="sr-only">Cargando página…</span> : null}
    </nav>
  );
}

function PageButton({
  onClick,
  disabled,
  label,
  short,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  short: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      // En movil solo se ve el simbolo: los cinco numeros de pagina mas los
      // cuatro saltos no caben en 390 px con el texto completo.
      className="h-9 min-w-9 rounded-lg bg-ink-850 px-2 text-sm text-slate-300 transition-colors hover:bg-ink-700 hover:text-white disabled:pointer-events-none disabled:opacity-35 sm:px-2.5"
    >
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
