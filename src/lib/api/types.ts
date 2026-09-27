export interface Measure {
  value: number;
  unit: string;
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  total: number;
}

export interface PokemonAbility {
  name: string;
  displayName: string;
  isHidden: boolean;
  slot: number;
}

export interface EvolutionRequirement {
  trigger: string | null;
  minLevel: number | null;
  item: string | null;
  heldItem: string | null;
  location: string | null;
  gender: number | null;
  knownMove: string | null;
  knownMoveType: string | null;
  timeOfDay: string | null;
  minHappiness: number | null;
  minAffection: number | null;
  minBeauty: number | null;
  needsOverworldRain: boolean;
  turnUpsideDown: boolean;
  relativePhysicalStats: number | null;
  partyType: string | null;
  tradeSpecies: string | null;
}

export interface EvolutionTarget {
  id: number;
  name: string;
  displayName: string;
  officialArtwork: string | null;
  requirements: EvolutionRequirement[];
}

export interface PokemonSprites {
  officialArtwork: string | null;
  officialArtworkShiny: string | null;
  homeArtwork: string | null;
  frontDefault: string | null;
  frontShiny: string | null;
  pixelArt: string | null;
  spritesheet: string | null;
}

export interface Pokemon {
  id: number;
  name: string;
  displayName: string;
  genus: string | null;
  description: string | null;
  generation: string;
  generationId: number;
  region: string;
  types: string[];
  height: Measure;
  weight: Measure;
  baseExperience: number | null;
  stats: PokemonStats;
  totalStats: number;
  abilities: PokemonAbility[];
  isLegendary: boolean;
  isMythical: boolean;
  isBaby: boolean;
  captureRate: number | null;
  baseHappiness: number | null;
  genderRate: number | null;
  hasGenderDifferences: boolean;
  hatchCounter: number | null;
  growthRate: string | null;
  eggGroups: string[];
  color: string | null;
  habitat: string | null;
  shape: string | null;
  evolvesFrom: string | null;
  evolutionChainId: number | null;
  evolvesTo: EvolutionTarget[];
  sprites: PokemonSprites;
}

export interface PokemonListItem {
  id: number;
  name: string;
  displayName: string;
  types: string[];
  generation: string;
  generationId: number;
  region: string;
  totalStats: number;
  isLegendary: boolean;
  isMythical: boolean;
  officialArtwork: string | null;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GenerationEntry {
  id: number;
  slug: string;
  name: string;
  region: string;
  regionName: string;
  pokemonCount: number;
}

export interface TypeEntry {
  id: number;
  slug: string;
  name: string;
  pokemonCount: number;
}

export interface AbilityEntry {
  id: number;
  slug: string;
  name: string;
  isMainSeries: boolean;
  shortEffect: string | null;
  pokemonCount: number;
}

export interface SimpleEntry {
  id: number;
  slug: string;
  name: string;
  pokemonCount?: number;
}

export interface RegionEntry {
  id: number;
  slug: string;
  name: string;
  pokemonCount: number;
}

export interface EvolutionChainMember {
  id: number;
  name: string;
  displayName: string;
  officialArtwork: string | null;
  evolutionOrder: number;
}

export interface EvolutionChain {
  chainId: number;
  rootName: string;
  members: EvolutionChainMember[];
}

export const SORT_FIELDS = [
  "id",
  "name",
  "height",
  "weight",
  "baseExperience",
  "totalStats",
] as const;

export type SortField = (typeof SORT_FIELDS)[number];

export const RARITIES = ["mythic", "legendary", "ultra", "rare", "common"] as const;
export type Rarity = (typeof RARITIES)[number];

export const STAT_FIELDS = [
  "hp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed",
] as const;
export type StatField = (typeof STAT_FIELDS)[number];
