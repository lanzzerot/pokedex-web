import type { StatField } from "./api/types";

export const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  normal: { bg: "#9FA19F", text: "#1B1D1C", border: "#7C7E7C" },
  fire: { bg: "#FF9D55", text: "#3B1A05", border: "#E07C2E" },
  water: { bg: "#4D90D5", text: "#F2F8FF", border: "#2F6FA8" },
  electric: { bg: "#F4D23C", text: "#3B2E05", border: "#D3B021" },
  grass: { bg: "#63BB5B", text: "#052B04", border: "#489745" },
  ice: { bg: "#73CEDA", text: "#033038", border: "#4FA6B2" },
  fighting: { bg: "#CE4069", text: "#FFF3F6", border: "#A62E50" },
  poison: { bg: "#AB6AC8", text: "#FDF4FF", border: "#8B4CA6" },
  ground: { bg: "#D97845", text: "#2B1004", border: "#B25C2C" },
  flying: { bg: "#8FA8DD", text: "#0B1430", border: "#6B86BE" },
  psychic: { bg: "#F97176", text: "#3B0507", border: "#D3545A" },
  bug: { bg: "#90C12C", text: "#131F03", border: "#6E981D" },
  rock: { bg: "#C7B78B", text: "#2C2410", border: "#A0926A" },
  ghost: { bg: "#5269AC", text: "#F0F3FF", border: "#3B4E85" },
  dragon: { bg: "#0B6DC3", text: "#F0F7FF", border: "#084F94" },
  dark: { bg: "#5A5465", text: "#F4F2F6", border: "#443F4D" },
  steel: { bg: "#60A1B8", text: "#04222B", border: "#437E93" },
  fairy: { bg: "#EF70EF", text: "#320332", border: "#C74BC7" },
  stellar: { bg: "#3B3B6B", text: "#EDEDFF", border: "#262655" },
  unknown: { bg: "#6B7280", text: "#F3F4F6", border: "#4B5563" },
  shadow: { bg: "#4A3F5C", text: "#EFE9F5", border: "#332B41" },
};

const FALLBACK = { bg: "#6B7280", text: "#F3F4F6", border: "#4B5563" };

export function typeColor(slug: string) {
  return TYPE_COLORS[slug] ?? FALLBACK;
}

export const RARITY_LABELS: Record<
  string,
  { label: string; className: string } | undefined
> = {
  mythic: {
    label: "Mítico",
    className: "bg-violet-500/15 text-violet-200 ring-violet-400/40",
  },
  legendary: {
    label: "Legendario",
    className: "bg-amber-500/15 text-amber-200 ring-amber-400/40",
  },
  ultra: { label: "Ultra", className: "bg-rose-500/15 text-rose-200 ring-rose-400/40" },
  rare: { label: "Raro", className: "bg-sky-500/15 text-sky-200 ring-sky-400/40" },
  common: {
    label: "Común",
    className: "bg-slate-500/15 text-slate-200 ring-slate-400/30",
  },
};

export function rarityOf(isLegendary: boolean, isMythical: boolean): string {
  if (isMythical) return "mythic";
  if (isLegendary) return "legendary";
  return "common";
}

export function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const STAT_LABELS: Record<StatField, { short: string; label: string }> = {
  hp: { short: "HP", label: "Salud" },
  attack: { short: "ATK", label: "Ataque" },
  defense: { short: "DEF", label: "Defensa" },
  specialAttack: { short: "SpA", label: "Ataque especial" },
  specialDefense: { short: "SpD", label: "Defensa especial" },
  speed: { short: "SPD", label: "Velocidad" },
};

export const STAT_ORDER: readonly StatField[] = [
  "hp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed",
];

export function statLabel(stat: StatField): string {
  return STAT_LABELS[stat].label;
}

export function statShort(stat: StatField): string {
  return STAT_LABELS[stat].short;
}

export function formatGender(rate: number | null): string {
  if (rate === null) return "Desconocido";
  if (rate < 0) return "Sin género";
  const male = Math.round((rate / 8) * 1000) / 10;
  const female = Math.round(((8 - rate) / 8) * 1000) / 10;
  if (male === 0) return "100% hembra";
  if (female === 0) return "100% macho";
  return `${male}% macho / ${female}% hembra`;
}

export function formatNumber(value: number | null, suffix = ""): string {
  if (value === null) return "—";
  return `${new Intl.NumberFormat("es-ES").format(value)}${suffix}`;
}

export function describeTrigger(trigger: string | null): string {
  if (!trigger) return "—";
  const map: Record<string, string> = {
    "level-up": "Subir de nivel",
    "use-item": "Usar objeto",
    trade: "Intercambio",
    "shed": "Muda",
    "spin": "Giro",
    "tower-of-darkness": "Torre de la Oscuridad",
    "tower-of-waters": "Torre de las Aguas",
    "three-critical-hits": "3 golpes críticos",
    "take-hit": "Recibir un golpe",
    "other-party-known-move": "Conocer un movimiento",
    "level-up-known-move": "Subir de nivel con un movimiento",
    "level-up-location": "Subir de nivel en un lugar",
    "level-up-remote": "Subir de nivel en un juego remoto",
    "use-item-location": "Usar objeto en un lugar",
  };
  return map[trigger] ?? titleCase(trigger);
}
