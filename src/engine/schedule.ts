import type { Flag, KB, Product, Schedule, ScheduleEntry } from "./types";

// Daily slots. "meal" slots satisfy take-with-food; non-meal slots satisfy empty stomach.
export const SLOTS = [
  { id: "wake", label: "On waking", hour: 7.0, meal: false },
  { id: "before_breakfast", label: "Before breakfast", hour: 7.5, meal: false },
  { id: "breakfast", label: "Breakfast", hour: 8.0, meal: true },
  { id: "midmorning", label: "Mid-morning", hour: 10.5, meal: false },
  { id: "lunch", label: "Lunch", hour: 12.5, meal: true },
  { id: "afternoon", label: "Mid-afternoon", hour: 15.5, meal: false },
  { id: "dinner", label: "Dinner", hour: 18.5, meal: true },
  { id: "bedtime", label: "Bedtime", hour: 22.0, meal: false },
] as const;
type SlotId = (typeof SLOTS)[number]["id"];
const hourOf = (s: SlotId) => SLOTS.find((x) => x.id === s)!.hour;
const clock = (h: number) => `${Math.floor(h)}:${h % 1 ? "30" : "00"}`;

interface Item { key: string; name: string; kind: "product" | "drug"; ingredients: string[]; drug?: string; options: { slot: SlotId; cost: number }[]; reasons: string[] }
interface Constraint { a: number; b: number; hours: number; ordered: boolean; label: string } // ordered: a before b

/** Slot options and preference costs for one product or timed drug. Lower cost = preferred. */
function slotOptions(takeWith: string[], best: string[]): { slot: SlotId; cost: number }[] {
  const all = SLOTS.map((s) => s.id);
  if (best.includes("wake")) return [{ slot: "wake", cost: 0 }];
  if (best.includes("before_breakfast")) return [{ slot: "before_breakfast", cost: 0 }];
  if (best.includes("bedtime")) return [{ slot: "bedtime", cost: 0 }];
  const needsFood = takeWith.some((t) => ["food", "food_with_fat"].includes(t)) || best.includes("with_meal");
  const emptyStrict = takeWith.includes("empty_stomach");
  const emptyPreferred = takeWith.includes("empty_stomach_preferred");
  const meals: SlotId[] = ["breakfast", "dinner", "lunch"];
  if (needsFood) return meals.map((s, i) => ({ slot: s, cost: i * 0.1 }));
  if (emptyStrict) return all.filter((s) => !SLOTS.find((x) => x.id === s)!.meal && s !== "bedtime").map((s) => ({ slot: s, cost: 0.2 }));
  if (emptyPreferred) return all.filter((s) => s !== "bedtime").map((s) => ({ slot: s, cost: SLOTS.find((x) => x.id === s)!.meal ? 1 : 0.1 }));
  // "either" / "water" / "any": prefer joining a meal people already have, then other times.
  return all.filter((s) => s !== "wake").map((s) => ({ slot: s, cost: ({ breakfast: 0, dinner: 0.1, lunch: 0.2 } as Record<string, number>)[s] ?? 0.6 }));
}

export function buildSchedule(kb: KB, products: Product[], drugClasses: string[], flags: Flag[]): Schedule {
  const ingMap = new Map(kb.ingredients.map((i) => [i.id, i]));
  const excluded: Schedule["excluded"] = [];
  const notes: string[] = [];
  const items: Item[] = [];

  // Products. Anything with an "avoid" flag is left out and sent to the pharmacist section.
  const avoid = flags.filter((f) => f.management.type === "avoid");
  products.forEach((p) => {
    const bad = avoid.find((f) => f.products.includes(p.name));
    if (bad) { excluded.push({ name: p.name, reason: `Not scheduled: ${bad.title}. Talk to a pharmacist first.` }); return; }
    const ids = [...new Set(p.ingredients.map((r) => r.ingredient))];
    const tw = ids.map((id) => ingMap.get(id)?.timing.take_with ?? "either");
    const bs = ids.map((id) => ingMap.get(id)?.timing.best_slot ?? "any");
    const reasons = ids.length === 1 ? [ingMap.get(ids[0])?.timing.note ?? ""] : [];
    items.push({ key: `p:${p.name}`, name: p.name, kind: "product", ingredients: ids, options: slotOptions(tw, bs), reasons: reasons.filter(Boolean) });
  });
  // Drugs whose label fixes the time of day (levothyroxine, bisphosphonates, PPIs). Others: "as prescribed".
  for (const dc of drugClasses) {
    const d = kb.drug_classes.find((x) => x.id === dc);
    if (!d) continue;
    if (d.timing) items.push({ key: `d:${dc}`, name: d.name, kind: "drug", ingredients: [], drug: dc, options: slotOptions([d.timing.take_with], [d.timing.best_slot]), reasons: [d.timing.note] });
    else notes.push(`${d.name}: take as prescribed.`);
  }

  // Constraints from "separate" management between two different schedule items.
  const constraints: Constraint[] = [];
  const together: [number, number][] = [];
  const holders = (ingredient: string) => items.map((it, i) => (it.ingredients.includes(ingredient) ? i : -1)).filter((i) => i >= 0);
  for (const f of flags) {
    const m = f.management;
    if (f.drug_class) {
      const di = items.findIndex((it) => it.drug === f.drug_class);
      if (m.type !== "separate") continue;
      if (di < 0) {
        // Drug has no fixed time: give the rule as text.
        const gap = m.drug_before_hours != null ? `${m.drug_before_hours} hours before or ${m.drug_after_hours} hours after` : `at least ${m.hours} hours apart from`;
        notes.push(`${name(kb, f.drug_class)}: take it ${gap} ${f.ingredients.map((x) => ingMap.get(x)?.name).join(", ")}.`);
        continue;
      }
      for (const ingId of f.ingredients) for (const pi of holders(ingId))
        constraints.push({ a: di, b: pi, hours: m.hours ?? 0, ordered: m.order === "drug_first", label: `${items[pi].name} at least ${m.hours} h after ${items[di].name}` });
    } else if (f.ingredients.length === 2) {
      const [x, y] = f.ingredients;
      for (const i of holders(x)) for (const j of holders(y)) {
        if (i === j) continue;
        if (m.type === "separate") constraints.push({ a: i, b: j, hours: m.hours ?? 0, ordered: false, label: `${items[i].name} and ${items[j].name} at least ${m.hours} h apart` });
        if (m.type === "prefer_together") together.push([i, j]);
      }
    }
  }

  const satisfied = (c: Constraint, a: SlotId[]) => {
    const ha = hourOf(a[c.a]), hb = hourOf(a[c.b]);
    return c.ordered ? hb - ha >= c.hours : Math.abs(ha - hb) >= c.hours;
  };

  // Branch and bound over slot assignments (stacks are small).
  const order = items.map((_, i) => i).sort((a, b) => items[a].options.length - items[b].options.length);
  let best = null as SlotId[] | null;
  let bestCost = Infinity;
  const assign: SlotId[] = new Array(items.length);
  const assigned = new Set<number>();
  const togetherCost = () => together.reduce((s, [i, j]) => s + (assigned.has(i) && assigned.has(j) && assign[i] !== assign[j] ? 0.5 : 0), 0);
  const search = (k: number, cost: number) => {
    if (cost >= bestCost) return;
    if (k === order.length) { best = [...assign]; bestCost = cost + togetherCost(); return; }
    const idx = order[k];
    for (const opt of items[idx].options) {
      assign[idx] = opt.slot; assigned.add(idx);
      if (constraints.every((c) => !assigned.has(c.a) || !assigned.has(c.b) || satisfied(c, assign))) search(k + 1, cost + opt.cost);
      assigned.delete(idx);
    }
  };
  search(0, 0);

  const unresolved: string[] = [];
  const final: SlotId[] = best ?? items.map((it) => it.options[0].slot);
  if (!best) for (const c of constraints) if (!satisfied(c, final)) unresolved.push(c.label);
  const entries: ScheduleEntry[] = SLOTS.map((s) => ({
    slot: s.id, label: s.label, time: clock(s.hour),
    items: items.filter((_, i) => final[i] === s.id).map((it) => ({
      name: it.name, kind: it.kind,
      reasons: [...it.reasons, ...constraints.filter((c) => items[c.b] === it).map((c) => c.label)], // each rule once, under the item it moves
    })),
  })).filter((e) => e.items.length);
  return { entries, excluded, unresolved, notes: [...new Set(notes)] };
}

const name = (kb: KB, dc: string) => kb.drug_classes.find((d) => d.id === dc)?.name ?? dc;
