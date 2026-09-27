import type {
  AbilityEntry,
  EvolutionChain,
  GenerationEntry,
  Paged,
  Pokemon,
  PokemonListItem,
  RegionEntry,
  SimpleEntry,
  TypeEntry,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_POKEMON_API_URL ?? "https://pokemon-api-6r6x.onrender.com";

export const API_PREFIX = "/api/v1";

/**
 * Error conforme a RFC 9457 (`application/problem+json`), tal y como lo
 * devuelve la API. Se conserva el payload crudo para poder mostrar el detalle
 * de la validacion en la interfaz.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly traceId: string | undefined;
  readonly errors: Record<string, string[]> | undefined;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title || problem.code);
    this.name = "ApiError";
    this.status = problem.status;
    this.code = problem.code;
    this.traceId = problem.traceId;
    this.errors = problem.errors;
  }

  /** Errores de validacion aplanados a una lista de mensajes legibles. */
  get messages(): string[] {
    if (!this.errors) return [this.message];
    return Object.entries(this.errors).flatMap(([field, list]) =>
      list.map((message) => `${field}: ${message}`),
    );
  }
}

export class RateLimitError extends ApiError {
  readonly retryAfterSeconds: number | null;

  constructor(problem: ProblemDetails, retryAfterSeconds: number | null) {
    super(problem);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.status === "number" && typeof candidate.code === "string";
}

async function toApiError(response: Response): Promise<ApiError> {
  let problem: ProblemDetails = {
    type: "about:blank",
    title: response.statusText || "Request failed.",
    status: response.status,
    detail: `The API responded with ${response.status}.`,
    code: "request.failed",
  };

  try {
    const body: unknown = await response.json();
    if (isProblemDetails(body)) problem = body;
  } catch {
    // Respuesta sin cuerpo JSON: nos quedamos con el problema sintetico.
  }

  if (response.status === 429) {
    const header = response.headers.get("Retry-After");
    const seconds = header === null ? null : Number.parseInt(header, 10);
    return new RateLimitError(
      problem,
      seconds !== null && Number.isFinite(seconds) ? seconds : null,
    );
  }

  return new ApiError(problem);
}

export type Attempt<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * Envuelve una llamada a la API para que el componente pueda distinguir el
 * resultado del error sin perder los tipos. Un `catch` directo colapsaria la
 * union a `unknown`.
 */
export async function attempt<T>(promise: Promise<T>): Promise<Attempt<T>> {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    return { ok: false, error };
  }
}

interface RequestOptions {
  /** Segundos de revalidacion en cache. `0` desactiva la cache. */
  revalidate?: number;
  signal?: AbortSignal;
  tags?: string[];
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { revalidate = 3600, signal, tags } = options;

  const init: RequestInit & { next?: { revalidate: number; tags: string[] } } = {
    signal,
    headers: { Accept: "application/json" },
  };
  init.next = { revalidate, tags: tags ?? ["pokemon-api"] };

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, init);

  if (!response.ok) throw await toApiError(response);

  return (await response.json()) as T;
}

/** Normaliza valores repetidos y separados por comas a una lista plana. */
function list(values: string | string[] | undefined): string[] {
  if (values === undefined) return [];
  const raw = Array.isArray(values) ? values : [values];
  return raw
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export interface PokemonQuery {
  name?: string;
  types?: string | string[];
  abilities?: string | string[];
  generations?: string | string[];
  regions?: string | string[];
  eggGroups?: string | string[];
  habitats?: string | string[];
  rarity?: string;
  minHeight?: number;
  maxHeight?: number;
  minWeight?: number;
  maxWeight?: number;
  minBaseExperience?: number;
  minTotalStats?: number;
  maxTotalStats?: number;
  minStat?: string;
  minStatValue?: number;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  pageSize?: number;
}

export function toSearchParams(query: PokemonQuery): URLSearchParams {
  const params = new URLSearchParams();

  const append = (key: string, value: string | number | undefined) => {
    if (value === undefined) return;
    const text = String(value).trim();
    if (text.length === 0) return;
    params.set(key, text);
  };

  append("name", query.name);

  // Campos multivalor: AND entre campos distintos, OR dentro del mismo.
  for (const [key, value] of [
    ["types", query.types],
    ["abilities", query.abilities],
    ["generations", query.generations],
    ["regions", query.regions],
    ["eggGroups", query.eggGroups],
    ["habitats", query.habitats],
  ] as const) {
    const values = list(value);
    if (values.length > 0) params.set(key, values.join(","));
  }

  append("rarity", query.rarity);
  append("minHeight", query.minHeight);
  append("maxHeight", query.maxHeight);
  append("minWeight", query.minWeight);
  append("maxWeight", query.maxWeight);
  append("minBaseExperience", query.minBaseExperience);
  append("minTotalStats", query.minTotalStats);
  append("maxTotalStats", query.maxTotalStats);
  append("minStat", query.minStat);
  append("minStatValue", query.minStatValue);
  append("sortBy", query.sortBy);
  append("sortDirection", query.sortDirection);
  append("page", query.page);
  append("pageSize", query.pageSize);

  return params;
}

export const pokemonApi = {
  listPokemon(
    query: PokemonQuery = {},
    options?: RequestOptions,
  ): Promise<Paged<PokemonListItem>> {
    const params = toSearchParams(query);
    const search = params.toString();
    return request(`/pokemon${search ? `?${search}` : ""}`, {
      revalidate: 600,
      ...options,
    });
  },

  getPokemonByName(name: string, options?: RequestOptions) {
    return request<Pokemon>(`/pokemon/by-name/${encodeURIComponent(name)}`, {
      revalidate: 86400,
      ...options,
    });
  },

  getPokemonById(id: number, options?: RequestOptions) {
    return request<Pokemon>(`/pokemon/${id}`, { revalidate: 86400, ...options });
  },

  getEvolutionChain(name: string, options?: RequestOptions) {
    return request<EvolutionChain>(`/pokemon/evolution-chain/${encodeURIComponent(name)}`, {
      revalidate: 86400,
      ...options,
    });
  },

  getTypes(options?: RequestOptions) {
    return request<TypeEntry[]>("/types", { revalidate: 86400, ...options });
  },

  getGenerations(options?: RequestOptions) {
    return request<GenerationEntry[]>("/generations", { revalidate: 86400, ...options });
  },

  getRegions(options?: RequestOptions) {
    return request<RegionEntry[]>("/regions", { revalidate: 86400, ...options });
  },

  getHabitats(options?: RequestOptions) {
    return request<SimpleEntry[]>("/habitats", { revalidate: 86400, ...options });
  },

  getEggGroups(options?: RequestOptions) {
    return request<SimpleEntry[]>("/egg-groups", { revalidate: 86400, ...options });
  },

  /**
   * Ojo: este endpoint devuelve un array plano, no una pagina paginada.
   * Acepta `name` e `isMainSeries` como filtros.
   */
  getAbilities(
    filters: { name?: string; isMainSeries?: boolean } = {},
    options?: RequestOptions,
  ) {
    const params = new URLSearchParams();
    if (filters.name) params.set("name", filters.name);
    if (filters.isMainSeries !== undefined) {
      params.set("isMainSeries", String(filters.isMainSeries));
    }
    const search = params.toString();
    return request<AbilityEntry[]>(`/abilities${search ? `?${search}` : ""}`, {
      revalidate: 86400,
      ...options,
    });
  },
};
