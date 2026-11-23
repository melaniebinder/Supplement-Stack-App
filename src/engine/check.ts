import type { CheckResult, EffectGroup, Flag, Grade, Ingredient, KB, Product, Severity, StackInput, SwapOut, ULFlag } from "./types";
import { countsTowardUL, dailyNeed, upperLimit } from "./intakes";
import { buildSchedule } from "./schedule";

const SEV_RANK: Record<Severity, number> = { major: 4, moderate: 3, minor: 2, info: 1 };
export const GRADE_RANK: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1 };

interface Presence { ingredient: string; products: number[]; total: number }

export function presence(products: Product[]): Map<string, Presence> {
  const map = new Map<string, Presence>();
  products.forEach((p, i) =>
    p.ingredients.forEach((row) => {
      const e = map.get(row.ingredient) ?? { ingredient: row.ingredient, products: [], total: 0 };
      if (!e.products.includes(i)) e.products.push(i);
      e.total += row.amount ?? 0;
      map.set(row.ingredient, e);
    }),
  );
  return map;
}

function groupMembers(kb: KB, group: EffectGroup, present: Map<string, Presence>): string[] {
  return kb.ingredients
    .filter((ing) => present.has(ing.id))
    .filter((ing) =>
      ing.effect_groups.some((g) => {
        if (typeof g === "string") return g === group.id;
        if (g.id !== group.id) return false;
        return !g.min_daily_dose || present.get(ing.id)!.total >= g.min_daily_dose.amount;
      }),
    )
    .map((ing) => ing.id);
}

export function check(kb: KB, input: StackInput): CheckResult {
  const ing = new Map(kb.ingredients.map((i) => [i.id, i]));
  const name = (id: string) => ing.get(id)?.name ?? kb.drug_classes.find((d) => d.id === id)?.name ?? id;
  const products = input.products.filter((p) => p.ingredients.length);
  const present = presence(products);
  const drugs = new Set(input.drug_classes);
  const profile = input.profile ?? {};
  const pname = (idx: number[]) => idx.map((i) => products[i].name);

  // ---------- pairwise interactions ----------
  const flags: Flag[] = [];
  const suppressed: Flag[] = [];
  const pairwiseDrugKeys = new Set<string>(); // "ingredient|drug" pairs covered by a specific record
  for (const x of kb.interactions) {
    const [ka, ia] = x.a.split("/");
    const [kb_, ib] = x.b.split("/");
    const base = { id: x.id, kind: "pair" as const, severity: x.severity, evidence_grade: x.evidence_grade, mechanism: x.mechanism,
      recommendation: x.recommendation, management: x.management, record: x.id, sources: x.sources };
    if (ka === "ingredient" && kb_ === "ingredient") {
      const pa = present.get(ia), pb = present.get(ib);
      if (!pa || !pb) continue;
      const crossProduct = pa.products.some((i) => pb.products.some((j) => i !== j));
      const f: Flag = { ...base, title: `${name(ia)} + ${name(ib)}`, ingredients: [ia, ib], products: pname([...new Set([...pa.products, ...pb.products])]) };
      (crossProduct ? flags : suppressed).push(f);
    } else {
      const [ingId, drugId] = ka === "ingredient" ? [ia, ib] : [ib, ia];
      pairwiseDrugKeys.add(`${ingId}|${drugId}`);
      if (!present.has(ingId) || !drugs.has(drugId)) continue;
      flags.push({ ...base, title: `${name(ingId)} + ${name(drugId)}`, ingredients: [ingId], drug_class: drugId, products: pname(present.get(ingId)!.products) });
    }
  }

  // ---------- effect-group rules (pairwise records take precedence) ----------
  for (const g of kb.effect_groups) {
    const members = groupMembers(kb, g, present);
    for (const [ri, r] of g.rules.entries()) {
      const base = { kind: "group" as const, severity: r.severity, evidence_grade: r.evidence_grade, mechanism: g.description,
        recommendation: r.recommendation, record: `GROUP:${g.id}`, sources: g.sources };
      for (const dc of r.when.member_plus_drug_class ?? []) {
        if (!drugs.has(dc)) continue;
        const ms = members.filter((m) => !pairwiseDrugKeys.has(`${m}|${dc}`));
        if (!ms.length) continue;
        flags.push({ ...base, id: `${g.id}:${dc}`, title: `${g.name}: ${ms.map(name).join(", ")} + ${name(dc)}`, ingredients: ms, drug_class: dc,
          management: r.management_by_drug_class?.[dc] ?? { type: "consult" }, products: pname([...new Set(ms.flatMap((m) => present.get(m)!.products))]) });
      }
      if (r.when.min_members && members.length >= r.when.min_members) {
        flags.push({ ...base, id: `${g.id}:${ri}`, title: `${g.name}: ${members.map(name).join(", ")}`, ingredients: members,
          management: { type: "consult" }, products: pname([...new Set(members.flatMap((m) => present.get(m)!.products))]) });
      }
    }
  }
  flags.sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity] || GRADE_RANK[b.evidence_grade] - GRADE_RANK[a.evidence_grade]);

  const pharmacist = flags.filter((f) => f.drug_class || f.severity === "major");
  const timing = flags.filter((f) => !pharmacist.includes(f) && ["separate", "prefer_together"].includes(f.management.type));
  const other = flags.filter((f) => !pharmacist.includes(f) && !timing.includes(f));

  // ---------- upper limits & overlaps ----------
  const ul: ULFlag[] = [];
  for (const [id, p] of present) {
    const i = ing.get(id);
    const limit = i && upperLimit(i, profile);
    if (!i || limit == null) continue;
    const total = products.flatMap((pr) => pr.ingredients.filter((r) => r.ingredient === id)).reduce((s, r) => s + countsTowardUL(i, r), 0);
    if (total > limit) ul.push({ ingredient: id, name: i.name, total, ul: limit, unit: i.reference_intakes!.ul!.unit, scope: i.reference_intakes!.ul!.scope, products: pname(p.products), record: `RI:${id}` });
  }
  const overlaps = [...present.values()].filter((p) => p.products.length > 1).map((p) => ({ ingredient: p.ingredient, name: name(p.ingredient), products: pname(p.products) }));

  // ---------- swaps ----------
  const screening = profile.screening ?? {};
  const screened_out = Object.values(screening).some(Boolean);
  const swaps: SwapOut[] = screened_out ? [] : buildSwaps(kb, ing, products, profile);
  const swappedProducts = new Set(swaps.filter((s) => s.kind !== "route").map((s) => s.product));
  const costs = products.filter((p) => swappedProducts.has(p.name) && p.monthly_cost != null);
  const savings = costs.length ? costs.reduce((s, p) => s + (p.monthly_cost ?? 0), 0) : null;

  const flagged = new Set([...flags.flatMap((f) => f.ingredients), ...ul.map((u) => u.ingredient), ...swaps.map((s) => s.ingredient)]);
  const notices: string[] = [];
  if (screened_out) notices.push("Because of your answers in “About you”, we're not suggesting changes. Please review your stack with a clinician. Safety flags are still shown.");
  if (input.other_medication) notices.push("You take a medication we can't check yet. Ask your pharmacist to review it against your supplements.");

  return {
    pharmacist, timing, other, suppressed, ul, overlaps,
    schedule: buildSchedule(kb, products, input.drug_classes, flags),
    swaps, savings,
    route_to_pharmacist: flags.some((f) => !!f.drug_class) || !!input.other_medication,
    screened_out, unchecked_medication: !!input.other_medication,
    checked: [...present.keys()].filter((id) => !flagged.has(id)).map(name),
    notices,
  };
}

function buildSwaps(kb: KB, ing: Map<string, Ingredient>, products: Product[], profile: NonNullable<StackInput["profile"]>): SwapOut[] {
  const out: SwapOut[] = [];
  const foodSwaps = new Map(kb.lifestyle.food_swaps.map((f) => [f.ingredient, f]));
  products.forEach((p, idx) => {
    if (p.why === "doctor") return; // D-015: never second-guess a clinician's instruction
    const single = p.ingredients.length === 1 ? p.ingredients[0].ingredient : null;
    // Food swap: single-ingredient nutrient that food can cover (not recommendable), or already covered by another product.
    if (single && foodSwaps.has(single)) {
      const i = ing.get(single)!;
      const need = dailyNeed(i, profile);
      const elsewhere = products.filter((_q, j) => j !== idx).flatMap((q) => q.ingredients.filter((r) => r.ingredient === single)).reduce((s, r) => s + (r.amount ?? 0), 0);
      const coveredElsewhere = need ? elsewhere >= need.amount : false;
      const fs = foodSwaps.get(single)!;
      if (fs.swap === "route_to_clinician") {
        out.push({ kind: "route", product: p.name, ingredient: single, goal: "", message: fs.routing_note ?? "Check with a clinician." });
      } else if (!i.recommendable || coveredElsewhere) {
        const daily = fs.target !== "per_week"; // weekly targets (fish) aren't comparable to a daily RDA/AI in another form
        out.push({ kind: "food", product: p.name, ingredient: single, name: i.name, need: daily ? need?.amount ?? null : null, unit: need?.unit ?? fs.foods[0].unit,
          foods: fs.foods, note: coveredElsewhere ? `Another product in your stack already covers your daily need.` : fs.note, record: `FOOD:${single}` });
      }
    }
    // Habit swap: the product's stated goal has habits with stronger evidence than the supplement's best benefit claim.
    if (!p.why || p.why === "unsure") return;
    const goal = kb.lifestyle.goals.find((g) => g.id === p.why);
    if (!goal) return;
    for (const row of p.ingredients) {
      const gs = goal.supplements.find((s) => s.ingredient === row.ingredient);
      if (!gs) continue;
      if (gs.swap === "route_to_clinician") {
        out.push({ kind: "route", product: p.name, ingredient: row.ingredient, goal: goal.id, message: goal.routing_note ?? "Talk to a clinician." });
        continue;
      }
      const claims = (ing.get(row.ingredient)?.claims ?? []).filter((c) => gs.claims.includes(c.id) && c.direction === "benefit");
      const best = claims.reduce<Grade | null>((b, c) => (!b || GRADE_RANK[c.evidence_grade] > GRADE_RANK[b] ? c.evidence_grade : b), null);
      const bestRank = best ? GRADE_RANK[best] : 0;
      const habits = goal.habits.filter((h) => h.relation === "replaces" && GRADE_RANK[h.evidence_grade] > bestRank);
      if (habits.length) out.push({ kind: "habit", product: p.name, ingredient: row.ingredient, goal: goal.id, goalName: goal.name, supplementGrade: best, habits, note: gs.note, record: `GOAL:${goal.id}` });
    }
  });
  return out;
}
