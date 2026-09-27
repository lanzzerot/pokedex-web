"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { buildHref, splitList } from "@/lib/filters";
import { typeColor, STAT_ORDER, statLabel } from "@/lib/pokemon-data";
import { RARITIES, SORT_FIELDS } from "@/lib/api/types";
import type { AbilityEntry, SimpleEntry, TypeEntry } from "@/lib/api/types";

export interface FilterOptions {
  types: TypeEntry[];
  generations: SimpleEntry[];
  regions: SimpleEntry[];
  eggGroups: SimpleEntry[];
  habitats: SimpleEntry[];
  abilities: AbilityEntry[];
}

const SORT_LABELS: Record<(typeof SORT_FIELDS)[number], string> = {
  id: "Nº de Pokédex",
  name: "Nombre",
  height: "Altura",
  weight: "Peso",
  baseExperience: "Experiencia base",
  totalStats: "Suma de stats",
};

const RARITY_LABELS: Record<(typeof RARITIES)[number], string> = {
  mythic: "Mítico",
  legendary: "Legendario",
  ultra: "Ultra",
  rare: "Raro",
  common: "Común",
};

export function FilterPanel({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(searchParams.get("name") ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const isFirstRender = useRef(true);

  // Si la URL cambia desde fuera (boton atras, enlace compartido), el input
  // tiene que seguirla. React recomienda ajustar el estado durante el render en
  // lugar de dentro de un efecto.
  const nameFromUrl = searchParams.get("name") ?? "";
  const [syncedName, setSyncedName] = useState(nameFromUrl);
  if (nameFromUrl !== syncedName) {
    setSyncedName(nameFromUrl);
    setName(nameFromUrl);
  }

  // `searchParams` es un objeto nuevo en cada render, asi que meterlo en las
  // dependencias de `commit` la volveria inestable y el debounce de abajo se
  // rearmaria con cada navegacion. Se leen de un ref para que `commit` solo
  // dependa de `pathname` y `router`.
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const nameRef = useRef(name);
  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  const commit = useCallback(
    (mutate?: (params: URLSearchParams) => void, keepPage = false) => {
      const href = buildHref(
        pathname,
        searchParamsRef.current.toString(),
        nameRef.current,
        mutate,
        keepPage,
      );
      // `null` significa que el estado pedido ya es el de la URL: no navegamos.
      if (href === null) return;

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router],
  );

  // La caja de texto se escribe seguido: se aplica con un debounce de 450 ms.
  // Como `commit` ya es estable, el temporizador solo se rearma al escribir.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => commit(), 450);
    return () => clearTimeout(timer);
  }, [name, commit]);

  const selectedTypes = splitList(searchParams.get("types"));
  const selectedGenerations = splitList(searchParams.get("generations"));
  const selectedRegions = splitList(searchParams.get("regions"));
  const selectedHabitats = splitList(searchParams.get("habitats"));
  const selectedEggGroups = splitList(searchParams.get("eggGroups"));
  const selectedAbilities = splitList(searchParams.get("abilities"));
  const rarity = searchParams.get("rarity");
  const minStat = searchParams.get("minStat") ?? "";
  const minStatValue = searchParams.get("minStatValue") ?? "";

  const toggleMulti = (key: string, value: string) => {
    commit((params) => {
      const current = splitList(params.get(key));
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length > 0) params.set(key, next.join(","));
      else params.delete(key);
    });
  };

  const setValue = (key: string, value: string) => {
    commit((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  };

  const setNumber = (key: string, value: string) => {
    commit((params) => {
      // La API trata `minHeight=1,2` como dos filtros, no como decimal.
      if (value.trim()) params.set(key, value.trim());
      else params.delete(key);
    });
  };

  const activeCount =
    selectedTypes.length +
    selectedGenerations.length +
    selectedRegions.length +
    selectedHabitats.length +
    selectedEggGroups.length +
    selectedAbilities.length +
    (rarity ? 1 : 0) +
    (minStat && minStatValue ? 1 : 0) +
    (searchParams.get("name") ? 1 : 0) +
    ["minHeight", "maxHeight", "minWeight", "maxWeight", "minTotalStats", "minBaseExperience"]
      .map((k) => searchParams.get(k))
      .filter(Boolean).length;

  const resetAll = () => {
    setName("");
    startTransition(() => router.replace(pathname, { scroll: false }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="filtro-nombre" className="sr-only">
            Buscar por nombre
          </label>
          <input
            id="filtro-nombre"
            type="search"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Buscar por nombre… (p. ej. char)"
            className="w-full rounded-xl border border-white/10 bg-ink-850 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-mint-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className="relative rounded-xl border border-white/10 bg-ink-850 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-mint-500/50 hover:text-white"
        >
          Filtros
          {activeCount > 0 ? (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-mint-500 px-1.5 text-xs font-bold text-ink-950">
              {activeCount}
            </span>
          ) : null}
        </button>

        {activeCount > 0 ? (
          <button
            type="button"
            onClick={resetAll}
            className="rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:text-rose-300"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="orden" className="text-sm text-slate-400">
          Ordenar por
        </label>
        <select
          id="orden"
          value={searchParams.get("sortBy") ?? "id"}
          onChange={(event) => setValue("sortBy", event.target.value)}
          className="rounded-lg border border-white/10 bg-ink-850 px-3 py-1.5 text-sm text-white focus:border-mint-500 focus:outline-none"
        >
          {SORT_FIELDS.map((field) => (
            <option key={field} value={field}>
              {SORT_LABELS[field]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() =>
            setValue(
              "sortDirection",
              (searchParams.get("sortDirection") ?? "asc") === "asc" ? "desc" : "asc",
            )
          }
          className="rounded-lg border border-white/10 bg-ink-850 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-mint-500/50 hover:text-white"
        >
          {(searchParams.get("sortDirection") ?? "asc") === "asc" ? "Ascendente ↑" : "Descendente ↓"}
        </button>

        <label htmlFor="tamano" className="ml-1 text-sm text-slate-400">
          Por página
        </label>
        <select
          id="tamano"
          value={searchParams.get("pageSize") ?? "24"}
          onChange={(event) => setValue("pageSize", event.target.value)}
          className="rounded-lg border border-white/10 bg-ink-850 px-3 py-1.5 text-sm text-white focus:border-mint-500 focus:outline-none"
        >
          {[12, 24, 48, 60, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        {isPending ? <span className="text-xs text-mint-400">Actualizando…</span> : null}
      </div>

      {isOpen ? (
        <div className="card animate-pop-in space-y-6 p-4 sm:p-5">
          <ChipGroup
            legend="Tipo (OR)"
            selected={selectedTypes}
            onToggle={(value) => toggleMulti("types", value)}
            renderLabel={(value) => value}
            colorFor={(value) => typeColor(value)}
            options={options.types
              .filter((type) => type.pokemonCount > 0)
              .map((type) => ({ value: type.slug, label: type.name }))}
          />

          <ChipGroup
            legend="Generación (OR)"
            selected={selectedGenerations}
            onToggle={(value) => toggleMulti("generations", value)}
            renderLabel={(value) =>
              options.generations.find((g) => g.slug === value)?.name ?? value
            }
            options={options.generations.map((g) => ({ value: g.slug, label: g.name }))}
          />

          <ChipGroup
            legend="Región (OR)"
            selected={selectedRegions}
            onToggle={(value) => toggleMulti("regions", value)}
            renderLabel={(value) => options.regions.find((r) => r.slug === value)?.name ?? value}
            options={options.regions.map((r) => ({ value: r.slug, label: r.name }))}
          />

          <ChipGroup
            legend="Hábitat (OR)"
            selected={selectedHabitats}
            onToggle={(value) => toggleMulti("habitats", value)}
            renderLabel={(value) => options.habitats.find((h) => h.slug === value)?.name ?? value}
            options={options.habitats
              .filter((h) => (h.pokemonCount ?? 0) > 0)
              .map((h) => ({ value: h.slug, label: h.name }))}
          />

          <ChipGroup
            legend="Grupo de huevo (OR)"
            selected={selectedEggGroups}
            onToggle={(value) => toggleMulti("eggGroups", value)}
            renderLabel={(value) => options.eggGroups.find((g) => g.slug === value)?.name ?? value}
            options={options.eggGroups.map((g) => ({ value: g.slug, label: g.name }))}
          />

          <ChipGroup
            legend="Rareza"
            selected={rarity ? [rarity] : []}
            onToggle={(value) => setValue("rarity", rarity === value ? "" : value)}
            renderLabel={(value) =>
              RARITIES.find((r) => r === value)
                ? RARITY_LABELS[value as (typeof RARITIES)[number]]
                : value
            }
            options={RARITIES.map((r) => ({ value: r, label: RARITY_LABELS[r] }))}
          />

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Habilidad (OR)
            </legend>
            <select
              value={selectedAbilities[0] ?? ""}
              onChange={(event) => setValue("abilities", event.target.value)}
              className="w-full max-w-sm rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-sm text-white focus:border-mint-500 focus:outline-none"
            >
              <option value="">Cualquier habilidad</option>
              {options.abilities
                .filter((ability) => ability.pokemonCount > 0)
                .map((ability) => (
                  <option key={ability.slug} value={ability.slug}>
                    {ability.name} ({ability.pokemonCount})
                  </option>
                ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              También busca en la descripción de la habilidad.
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Métricas
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {(
                [
                  ["minHeight", "Altura mín. (m)"],
                  ["maxHeight", "Altura máx. (m)"],
                  ["minWeight", "Peso mín. (kg)"],
                  ["maxWeight", "Peso máx. (kg)"],
                  ["minBaseExperience", "Exp. base mín."],
                  ["minTotalStats", "Suma stats mín."],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex flex-col gap-1 text-xs text-slate-400">
                  {label}
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    defaultValue={searchParams.get(key) ?? ""}
                    onBlur={(event) => setNumber(key, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") setNumber(key, event.currentTarget.value);
                    }}
                    className="rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-sm text-white focus:border-mint-500 focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Usa punto decimal: la API interpreta <code className="text-slate-400">1,2</code> como
              dos filtros distintos.
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Stat concreta mínima
            </legend>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Estadistica
                <select
                  value={minStat}
                  onChange={(event) => setValue("minStat", event.target.value)}
                  className="rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-sm text-white focus:border-mint-500 focus:outline-none"
                >
                  <option value="">—</option>
                  {STAT_ORDER.map((stat) => (
                    <option key={stat} value={stat}>
                      {statLabel(stat)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Valor mínimo
                <input
                  type="number"
                  value={minStatValue}
                  onChange={(event) => setValue("minStatValue", event.target.value)}
                  className="w-32 rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-sm text-white focus:border-mint-500 focus:outline-none"
                />
              </label>
            </div>
          </fieldset>
        </div>
      ) : null}
    </div>
  );
}

interface ChipGroupProps {
  legend: string;
  selected: string[];
  onToggle: (value: string) => void;
  renderLabel: (value: string) => string;
  options: { value: string; label: string }[];
  colorFor?: (value: string) => { bg: string; text: string; border: string };
}

function ChipGroup({
  legend,
  selected,
  onToggle,
  renderLabel,
  options,
  colorFor,
}: ChipGroupProps) {
  if (options.length === 0) return null;

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          const color = colorFor?.(option.value);

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(option.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                isSelected
                  ? "scale-105"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white"
              }`}
              style={
                isSelected && color
                  ? { backgroundColor: color.bg, color: color.text, borderColor: color.border }
                  : undefined
              }
            >
              {renderLabel(option.value)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
