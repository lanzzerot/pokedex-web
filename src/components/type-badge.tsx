import { typeColor } from "@/lib/pokemon-data";

export function TypeBadge({
  type,
  size = "md",
}: {
  type: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = typeColor(type);
  const sizing = {
    sm: "px-2 py-0.5 text-[0.7rem]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  }[size];

  return (
    <span
      className={`inline-block rounded-full font-semibold uppercase tracking-wide ${sizing}`}
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {type}
    </span>
  );
}
