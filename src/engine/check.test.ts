// Runs the synthetic fixture stacks (data/fixtures/synthetic-stacks.yaml) through the engine and checks
// every hand-written expectation: interactions, suppressed pairs, group flags, upper limits, overlaps,
// pharmacist routing, schedule constraints and swaps.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import yaml from "js-yaml";
// @ts-expect-error: plain JS build script
import { buildKb } from "../../scripts/build-kb.mjs";
import { check } from "./check";
import { SLOTS } from "./schedule";
import type { KB, StackInput } from "./types";

const kb: KB = buildKb();
const fixtures = (yaml.load(fs.readFileSync("data/fixtures/synthetic-stacks.yaml", "utf8")) as any).fixtures;
const hour = (slot: string) => SLOTS.find((s) => s.id === slot)!.hour;

for (const fx of fixtures) {
  describe(`${fx.id}: ${fx.persona}`, () => {
    const input: StackInput = { products: fx.products, drug_classes: fx.drug_classes, profile: fx.profile };
    const r = check(kb, input);
    const e = fx.expected;
    const all = [...r.pharmacist, ...r.timing, ...r.other];
    const pairIds = all.filter((f) => f.kind === "pair").map((f) => f.id);

    it("finds exactly the expected pairwise interactions", () => {
      expect([...pairIds].sort()).toEqual([...e.interactions].sort());
    });
    if (e.interactions.length > 1) it("lists the most severe first", () => {
      expect(all.filter((f) => f.kind === "pair")[0].id).toBe(e.interactions[0]);
    });
    it("suppresses pairs inside the same product", () => {
      expect(r.suppressed.map((f) => f.id).sort()).toEqual([...(e.suppressed_within_product ?? [])].sort());
    });
    it("raises the expected effect-group flags", () => {
      const groups = all.filter((f) => f.kind === "group").map((f) => ({ group: f.record.replace("GROUP:", ""), drug_class: f.drug_class, severity: f.severity, members: [...f.ingredients].sort() }));
      const want = (e.group_flags ?? []).map((g: any) => ({ group: g.group, drug_class: g.drug_class, severity: g.severity, members: [...g.members].sort() }));
      expect(groups).toEqual(want);
    });
    it("flags totals above the upper limit", () => {
      expect(r.ul.map((u) => ({ ingredient: u.ingredient, total: u.total, ul: u.ul })).sort((a, b) => a.ingredient.localeCompare(b.ingredient)))
        .toEqual((e.ul_flags ?? []).map((u: any) => ({ ingredient: u.ingredient, total: u.total, ul: u.ul })).sort((a: any, b: any) => a.ingredient.localeCompare(b.ingredient)));
      for (const id of e.within_ul ?? []) expect(r.ul.find((u) => u.ingredient === id)).toBeUndefined();
    });
    it("reports overlaps", () => {
      expect(r.overlaps.map((o) => o.ingredient).sort()).toEqual([...(e.overlaps ?? [])].sort());
    });
    it("routes to a pharmacist when a medication is involved", () => {
      expect(r.route_to_pharmacist).toBe(e.route_to_pharmacist);
    });
    it("builds a schedule that satisfies every constraint", () => {
      expect(r.schedule.unresolved).toEqual([]);
      const slotOf = new Map<string, string>();
      for (const en of r.schedule.entries) for (const it of en.items) slotOf.set(it.name, en.slot);
      const holders = (ref: string) =>
        ref.startsWith("drug_class/")
          ? [kb.drug_classes.find((d) => d.id === ref.slice(11))!.name]
          : fx.products.filter((p: any) => p.ingredients.some((i: any) => i.ingredient === ref)).map((p: any) => p.name);
      for (const c of e.schedule_constraints ?? []) {
        if (c.slot_of) {
          for (const n of holders(c.slot_of)) {
            if (c.slot) expect(slotOf.get(n)).toBe(c.slot);
            if (c.take_with === "food_with_fat") expect(["breakfast", "lunch", "dinner"]).toContain(slotOf.get(n));
          }
        } else if (c.apart) {
          for (const a of holders(c.apart[0])) for (const b of holders(c.apart[1])) if (a !== b)
            expect(Math.abs(hour(slotOf.get(a)!) - hour(slotOf.get(b)!))).toBeGreaterThanOrEqual(c.min_gap_hours);
        } else {
          for (const a of holders(c.before)) for (const b of holders(c.after))
            expect(hour(slotOf.get(b)!) - hour(slotOf.get(a)!)).toBeGreaterThanOrEqual(c.min_gap_hours);
        }
      }
      for (const id of e.schedule_excludes ?? []) {
        const names = holders(id);
        for (const n of names) expect(slotOf.has(n)).toBe(false);
        expect(r.schedule.excluded.map((x) => x.name)).toEqual(expect.arrayContaining(names));
      }
    });
    it("suggests the expected swaps", () => {
      const got = r.swaps.map((s) => s.kind === "habit" ? { product: s.product, kind: "habit", goal: s.goal, habits: s.habits.map((h) => h.id).sort() } : { product: s.product, kind: s.kind, ingredient: (s as any).ingredient });
      const want = (e.swaps ?? []).map((s: any) => s.kind === "habit" ? { product: s.product, kind: "habit", goal: s.goal, habits: [...s.habits].sort() } : { product: s.product, kind: s.kind, ingredient: s.ingredient });
      const key = (s: any) => `${s.product}|${s.kind}|${s.goal ?? s.ingredient}`;
      expect(got.sort((a: any, b: any) => key(a).localeCompare(key(b)))).toEqual(want.sort((a: any, b: any) => key(a).localeCompare(key(b))));
    });
  });
}

describe("guardrails", () => {
  const base = fixtures[0];
  it("never suggests swaps when the reason is 'my doctor told me to'", () => {
    const products = base.products.map((p: any) => ({ ...p, why: "doctor" }));
    expect(check(kb, { products, drug_classes: [] }).swaps).toEqual([]);
  });
  it("hides swaps but keeps safety flags for screened-out users", () => {
    const r = check(kb, { products: base.products, drug_classes: [], profile: { ...base.profile, screening: { pregnant_or_breastfeeding: true } } });
    expect(r.swaps).toEqual([]);
    expect(r.screened_out).toBe(true);
    expect(r.ul.length).toBeGreaterThan(0);
  });
  it("uses the age-specific calcium upper limit", () => {
    const products = [{ name: "Calcium 2200 mg", ingredients: [{ ingredient: "calcium", amount: 2200, unit: "mg" }] }];
    expect(check(kb, { products, drug_classes: [], profile: { age: 40 } }).ul).toEqual([]);
    expect(check(kb, { products, drug_classes: [], profile: { age: 60 } }).ul[0]?.ul).toBe(2000);
  });
  it("doesn't count beta-carotene toward the vitamin A limit", () => {
    const products = [{ name: "Beta-carotene", ingredients: [{ ingredient: "vitamin-a", amount: 5000, unit: "mcg RAE", form: "beta-carotene" }] }];
    expect(check(kb, { products, drug_classes: [] }).ul).toEqual([]);
  });
  it("sends unscheduled medications' timing rules to notes", () => {
    const products = [{ name: "Calcium 500 mg", ingredients: [{ ingredient: "calcium", amount: 500, unit: "mg" }] }];
    const r = check(kb, { products, drug_classes: ["quinolone-antibiotics"] });
    expect(r.schedule.notes.join(" ")).toMatch(/2 hours before or 6 hours after/);
  });
  it("every flag's record has bundled evidence", () => {
    const r = check(kb, { products: fixtures.flatMap((f: any) => f.products), drug_classes: ["warfarin", "levothyroxine", "serotonergic-drugs", "statins"] });
    for (const f of [...r.pharmacist, ...r.timing, ...r.other]) expect(kb.evidence[f.record]?.length, f.record).toBeGreaterThan(0);
  });
});
