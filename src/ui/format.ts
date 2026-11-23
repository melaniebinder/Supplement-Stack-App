import type { Grade, Ingredient } from "../engine/types";

export const CLAIM_GRADE: Record<Grade, string> = { A: "Strong evidence", B: "Moderate evidence", C: "Limited evidence", D: "Very limited evidence" };
// D-019: plain words for interaction evidence; letter grades stay in the data.
export const INTERACTION_GRADE: Record<Grade, string> = { A: "Probable", B: "Probable", C: "Possible", D: "Theoretical" };
export const GOALS = [
  { id: "", label: "Why? (optional)" }, { id: "sleep", label: "Sleep" }, { id: "energy", label: "Energy" },
  { id: "stress", label: "Stress" }, { id: "immunity", label: "Immunity" }, { id: "heart", label: "Heart" },
  { id: "bones", label: "Bones" }, { id: "workout", label: "Workout" }, { id: "doctor", label: "My doctor told me to" },
  { id: "unsure", label: "Not sure" },
] as const;

/** Canonical unit for amounts (what reference intakes use), plus label-friendly alternatives. */
export function unitsFor(ing: Ingredient): { unit: string; factor: number }[] {
  const ri = ing.reference_intakes;
  const canonical = ri?.ul?.unit ?? ri?.rda?.[0]?.unit ?? ri?.ai?.[0]?.unit ?? "mg";
  const base = canonical.replace(/ alpha-tocopherol| ALA| total fiber/, "");
  const alts = (ing.unit_conversions ?? []).map((c) => ({ unit: c.from, factor: c.factor }));
  return [{ unit: base, factor: 1 }, ...alts];
}
export const n = (x: number) => (Math.round(x * 10) / 10).toLocaleString("en-US");
