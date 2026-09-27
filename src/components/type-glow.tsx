import { typeColor } from "@/lib/pokemon-data";

/** Halo con los colores de los tipos del Pokemon, detras de la ilustracion. */
export function TypeGlow({ types }: { types: string[] }) {
  const colors = types.map((t) => typeColor(t).bg);
  if (colors.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-6 bottom-8 top-10 -z-10 blur-3xl"
      style={{
        background: colors.join(" "),
        backgroundBlendMode: colors.length > 1 ? "screen" : "normal",
        opacity: 0.28,
        borderRadius: "9999px",
      }}
    />
  );
}
