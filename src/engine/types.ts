// Shapes of the compiled knowledge base (scripts/build-kb.mjs) and of the engine's input/output.

export type Grade = "A" | "B" | "C" | "D";
export type Severity = "major" | "moderate" | "minor" | "info";

export interface IntakeRow { group: string; amount: number; unit: string }
export interface UL { amount: number; unit: string; applies_to: string; scope: "total" | "preformed_only" | "folic_acid_only" | "supplements_only"; by_group?: IntakeRow[] }
export interface Claim { id: string; outcome: string; population: string; direction: "benefit" | "no_effect" | "harm" | "mixed"; evidence_grade: Grade; summary: string; sources: string[] }
export interface Timing { best_slot: string; take_with: string; note: string; sources: string[] }
export interface Ingredient {
  id: string; name: string; type: string; synonyms: string[];
  reference_intakes: null | { rda?: IntakeRow[]; ai?: IntakeRow[]; ul: UL | null; notes?: string };
  unit_conversions?: { from: string; to: string; factor: number }[];
  food_sources: string[];
  effect_groups: (string | { id: string; min_daily_dose?: { amount: number; unit: string } })[];
  recommendable: boolean; recommendable_note?: string; recommend_only_if?: string;
  timing: Timing; claims: Claim[];
  safety_notes: { level: "warning" | "caution" | "info"; text: string; sources: string[] }[];
}
export interface Management { type: "separate" | "prefer_together" | "avoid" | "consult" | "monitor" | "keep_consistent" | "limit_dose"; hours?: number; order?: "drug_first" | "either"; drug_before_hours?: number; drug_after_hours?: number; basis?: string }
export interface Interaction { id: string; a: string; b: string; severity: Severity; effect: string; mechanism: string; recommendation: string; evidence_grade: Grade; management: Management; sources: string[] }
export interface GroupRule { when: { member_plus_drug_class?: string[]; min_members?: number }; severity: Severity; evidence_grade: Grade; recommendation: string; management_by_drug_class?: Record<string, Management> }
export interface EffectGroup { id: string; name: string; description: string; rules: GroupRule[]; sources: string[] }
export interface DrugClass { id: string; name: string; examples: string[]; timing?: Timing }
export interface Habit { id: string; rung: "diet" | "lifestyle"; relation: "replaces" | "complements"; text: string; evidence_grade: Grade; sources: string[] }
export interface Goal { id: string; name: string; supplements: { ingredient: string; claims: string[]; note?: string; swap?: "show" | "route_to_clinician" }[]; habits: Habit[]; routing_note?: string }
export interface FoodSwap { ingredient: string; target: string; note?: string; swap?: "route_to_clinician"; routing_note?: string; foods: { food: string; serving: string; amount: number; unit: string }[]; sources: string[] }
export interface Template { id: string; name: string; note: string; ingredients: ProductIngredient[] }
export interface SourceInfo { id: string; title: string; citation: string | null; verified: boolean; url: string | null; retrieved_at: string | null }
export interface Excerpt { source: string; quote: string; locator: string }
export interface KB {
  built_at: string; ingredients: Ingredient[]; interactions: Interaction[]; effect_groups: EffectGroup[];
  drug_classes: DrugClass[]; lifestyle: { food_swaps: FoodSwap[]; goals: Goal[] }; templates: Template[];
  picklist: { label: string; drug_class: string | null }[]; sources: Record<string, SourceInfo>; evidence: Record<string, Excerpt[]>;
  examples: { id: string; persona: string; products: Product[]; drug_classes: string[]; profile: Profile }[];
}

// ---------- engine input ----------
export type GoalId = "sleep" | "energy" | "stress" | "immunity" | "heart" | "bones" | "workout" | "doctor" | "unsure";
export interface ProductIngredient { ingredient: string; amount?: number; unit?: string; form?: string }
export interface Product { name: string; why?: GoalId; monthly_cost?: number; ingredients: ProductIngredient[] }
export interface Profile { age?: number; sex?: "female" | "male"; screening?: { pregnant_or_breastfeeding?: boolean; under_18?: boolean; kidney_disease?: boolean; liver_disease?: boolean } }
export interface StackInput { products: Product[]; drug_classes: string[]; other_medication?: boolean; profile?: Profile }

// ---------- engine output ----------
export interface Flag {
  id: string; kind: "pair" | "group"; severity: Severity; evidence_grade: Grade;
  title: string; mechanism: string; recommendation: string; management: Management;
  ingredients: string[]; drug_class?: string; products: string[]; record: string; sources: string[];
}
export interface ULFlag { ingredient: string; name: string; total: number; ul: number; unit: string; scope: UL["scope"]; products: string[]; record: string }
export interface ScheduleEntry { slot: string; label: string; time: string; items: { name: string; kind: "product" | "drug"; reasons: string[] }[] }
export interface Schedule { entries: ScheduleEntry[]; excluded: { name: string; reason: string }[]; unresolved: string[]; notes: string[] }
export interface FoodSwapOut { kind: "food"; product: string; ingredient: string; name: string; need: number | null; unit: string; foods: FoodSwap["foods"]; note?: string; record: string }
export interface HabitSwapOut { kind: "habit"; product: string; ingredient: string; goal: string; goalName: string; supplementGrade: Grade | null; habits: Habit[]; note?: string; record: string }
export interface RouteOut { kind: "route"; product: string; ingredient: string; goal: string; message: string }
export type SwapOut = FoodSwapOut | HabitSwapOut | RouteOut;
export interface CheckResult {
  pharmacist: Flag[]; timing: Flag[]; other: Flag[]; suppressed: Flag[];
  ul: ULFlag[]; overlaps: { ingredient: string; name: string; products: string[] }[];
  schedule: Schedule; swaps: SwapOut[]; savings: number | null;
  route_to_pharmacist: boolean; screened_out: boolean; unchecked_medication: boolean;
  checked: string[]; notices: string[];
}
