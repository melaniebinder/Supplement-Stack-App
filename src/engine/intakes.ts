import type { Ingredient, IntakeRow, Profile } from "./types";

// Parses DRI group labels like "men 19-30", "women 51+", "adults 71+", "adults", "men".
export function groupMatches(group: string, profile: Profile): boolean {
  const g = group.toLowerCase();
  const sex = profile.sex;
  if (/\bmen\b/.test(g) && !/women/.test(g) && sex === "female") return false;
  if (/\bwomen\b/.test(g) && sex === "male") return false;
  const age = profile.age ?? 30;
  const range = g.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return age >= +range[1] && age <= +range[2];
  const plus = g.match(/(\d+)\s*\+/);
  if (plus) return age >= +plus[1];
  return true;
}

/** Daily need (RDA, else AI) for this profile. If sex is unknown, uses the higher value. */
export function dailyNeed(ing: Ingredient, profile: Profile): { amount: number; unit: string } | null {
  const rows: IntakeRow[] = ing.reference_intakes?.rda ?? ing.reference_intakes?.ai ?? [];
  const matches = rows.filter((r) => groupMatches(r.group, profile));
  if (!matches.length) return null;
  const best = matches.reduce((a, b) => (b.amount > a.amount ? b : a));
  return { amount: best.amount, unit: best.unit };
}

/** Upper limit for this profile, honoring age-specific overrides (e.g. calcium 51+). */
export function upperLimit(ing: Ingredient, profile: Profile): number | null {
  const ul = ing.reference_intakes?.ul;
  if (!ul) return null;
  const override = (ul.by_group ?? []).find((r) => groupMatches(r.group, profile));
  return override ? override.amount : ul.amount;
}

/** How much of a product row counts toward the UL, given the UL's scope. */
export function countsTowardUL(ing: Ingredient, row: { amount?: number; unit?: string; form?: string }): number {
  const amt = row.amount ?? 0;
  const scope = ing.reference_intakes?.ul?.scope ?? "total";
  if (scope === "preformed_only" && row.form === "beta-carotene") return 0;
  if (scope === "folic_acid_only" && (row.unit ?? "").includes("DFE")) return amt / 1.7; // label DFE → mcg folic acid
  return amt;
}

export const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-US");
