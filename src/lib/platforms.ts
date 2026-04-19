export type Platform =
  | "ifood"
  | "rappi"
  | "99food"
  | "ubereats"
  | "loggi"
  | "outros"
  | "none";

export interface PlatformDef {
  id: Platform;
  label: string;
  /** Tailwind classes for the badge (background + text) — uses semantic-ish solid HSL via inline overrides */
  className: string;
  /** Hex/HSL dot color for charts/aggregations */
  dot: string;
}

/**
 * Brand-inspired but theme-friendly tones. Using arbitrary HSL keeps
 * everything readable in dark mode while preserving recognizability.
 */
export const PLATFORMS: PlatformDef[] = [
  { id: "ifood",    label: "iFood",     className: "bg-[hsl(0,75%,55%)]/15 text-[hsl(0,80%,65%)] border border-[hsl(0,75%,55%)]/30",       dot: "hsl(0, 75%, 55%)" },
  { id: "rappi",    label: "Rappi",     className: "bg-[hsl(20,90%,55%)]/15 text-[hsl(20,90%,65%)] border border-[hsl(20,90%,55%)]/30",     dot: "hsl(20, 90%, 55%)" },
  { id: "99food",   label: "99Food",    className: "bg-[hsl(50,95%,55%)]/15 text-[hsl(50,95%,65%)] border border-[hsl(50,95%,55%)]/30",     dot: "hsl(50, 95%, 55%)" },
  { id: "ubereats", label: "Uber Eats", className: "bg-[hsl(150,55%,45%)]/15 text-[hsl(150,55%,55%)] border border-[hsl(150,55%,45%)]/30",  dot: "hsl(150, 55%, 45%)" },
  { id: "loggi",    label: "Loggi",     className: "bg-[hsl(265,75%,60%)]/15 text-[hsl(265,75%,70%)] border border-[hsl(265,75%,60%)]/30",  dot: "hsl(265, 75%, 60%)" },
  { id: "outros",   label: "Outros",    className: "bg-secondary text-foreground border border-border",                                     dot: "hsl(220, 10%, 60%)" },
  { id: "none",     label: "Sem plataforma", className: "bg-muted text-muted-foreground border border-border/40",                          dot: "hsl(220, 8%, 50%)" },
];

export const PLATFORM_MAP: Record<Platform, PlatformDef> =
  PLATFORMS.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<Platform, PlatformDef>);

export function getPlatform(id?: string | null): PlatformDef {
  if (!id) return PLATFORM_MAP.none;
  return PLATFORM_MAP[id as Platform] ?? PLATFORM_MAP.outros;
}
