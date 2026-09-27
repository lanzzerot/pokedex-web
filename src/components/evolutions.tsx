import Image from "next/image";
import Link from "next/link";
import { describeTrigger, titleCase, typeColor } from "@/lib/pokemon-data";
import type { EvolutionChainMember, EvolutionRequirement, Pokemon } from "@/lib/api/types";

function slugToWords(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function RequirementLine({ requirement }: { requirement: EvolutionRequirement }) {
  const parts: string[] = [];

  if (requirement.minLevel !== null) parts.push(`nivel ${requirement.minLevel}`);
  if (requirement.item) parts.push(`${slugToWords(requirement.item)}`);
  if (requirement.heldItem) parts.push(`con ${slugToWords(requirement.heldItem)} equipado`);
  if (requirement.location) parts.push(`en ${slugToWords(requirement.location)}`);
  if (requirement.knownMove) parts.push(`con el movimiento ${slugToWords(requirement.knownMove)}`);
  if (requirement.knownMoveType)
    parts.push(`con un movimiento de tipo ${requirement.knownMoveType}`);
  if (requirement.timeOfDay) parts.push(`durante ${requirement.timeOfDay === "day" ? "el día" : "la noche"}`);
  if (requirement.minHappiness !== null)
    parts.push(`con ${requirement.minHappiness} de felicidad`);
  if (requirement.minAffection !== null)
    parts.push(`con ${requirement.minAffection} de cariño`);
  if (requirement.minBeauty !== null) parts.push(`con ${requirement.minBeauty} de belleza`);
  if (requirement.needsOverworldRain) parts.push("con lluvia en el mapa");
  if (requirement.turnUpsideDown) parts.push("girando la 3DS");
  if (requirement.gender !== null && requirement.gender >= 0)
    parts.push(requirement.gender === 1 ? "siendo hembra" : "siendo macho");
  if (requirement.relativePhysicalStats !== null)
    parts.push(
      `con ${requirement.relativePhysicalStats === 0 ? "ataque físico" : "defensa física"} mayor`,
    );
  if (requirement.tradeSpecies) parts.push(`intercambiando por ${slugToWords(requirement.tradeSpecies)}`);

  if (parts.length === 0) return <span className="text-slate-500">Sin requisitos</span>;

  return <span>{parts.join(", ")}</span>;
}

export function Evolutions({ pokemon }: { pokemon: Pokemon }) {
  const hasAny = pokemon.evolvesTo.length > 0 || pokemon.evolvesFrom !== null;

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-400">
        {pokemon.displayName} no evoluciona: es una especie final.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {pokemon.evolvesFrom ? (
        <Link
          href={`/pokemon/${pokemon.evolvesFrom}`}
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-ink-850 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-mint-500/60 hover:text-white"
        >
          <span className="text-slate-500">← Evoluciona de</span>
          <span className="font-semibold">{titleCase(pokemon.evolvesFrom)}</span>
        </Link>
      ) : (
        <p className="text-sm text-slate-400">
          Es la base de su línea evolutiva: no evoluciona de ninguna especie anterior.
        </p>
      )}

      {pokemon.evolvesTo.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Evoluciona en {pokemon.evolvesTo.length}{" "}
            {pokemon.evolvesTo.length === 1 ? "especie" : "especies"}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {pokemon.evolvesTo.map((target) => (
              <li key={target.id}>
                <Link
                  href={`/pokemon/${target.name}`}
                  prefetch={false}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-850 p-3 transition-all hover:-translate-y-0.5 hover:border-mint-500/50"
                >
                  {target.officialArtwork ? (
                    <Image
                      src={target.officialArtwork}
                      alt={target.displayName}
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0"
                    />
                  ) : (
                    <span className="h-14 w-14 shrink-0 rounded-lg bg-ink-800" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-white">
                      {target.displayName}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {target.requirements.slice(0, 3).map((requirement, index) => (
                        <li
                          key={`${target.id}-${index}`}
                          className="truncate text-xs text-slate-400"
                        >
                          <span className="text-mint-400">{describeTrigger(requirement.trigger)}</span>
                          {": "}
                          <RequirementLine requirement={requirement} />
                        </li>
                      ))}
                      {target.requirements.length > 3 ? (
                        <li className="text-xs text-slate-500">
                          +{target.requirements.length - 3} formas más
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ChainStrip({
  members,
  currentId,
}: {
  members: EvolutionChainMember[];
  currentId: number;
}) {
  if (members.length <= 1) return null;

  return (
    <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {members.map((member) => {
        const isCurrent = member.id === currentId;
        return (
          <li key={member.id} className="shrink-0">
            <Link
              href={`/pokemon/${member.name}`}
              prefetch={false}
              aria-current={isCurrent ? "true" : undefined}
              className={`block rounded-xl border p-2 text-center transition-all ${
                isCurrent
                  ? "border-mint-500 bg-mint-500/10"
                  : "border-white/10 bg-ink-850 hover:border-white/30"
              }`}
            >
              {member.officialArtwork ? (
                <Image
                  src={member.officialArtwork}
                  alt={member.displayName}
                  width={72}
                  height={72}
                  className="h-18 w-18"
                />
              ) : null}
              <span
                className={`mt-1 block text-xs font-medium ${isCurrent ? "text-mint-400" : "text-slate-300"}`}
              >
                {member.displayName}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function TypeMatchupHint({ types }: { types: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map((type) => {
        const color = typeColor(type);
        return (
          <span
            key={type}
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {type}
          </span>
        );
      })}
    </div>
  );
}
