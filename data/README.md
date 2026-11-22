# Knowledge base: starter set (30 ingredients)

> ⚠️ **Status: DRAFT, evidence-verified.** All 99 claims, interactions, habits and effect groups are backed by verbatim quotes from retrieved sources (see [`evidence/`](evidence/)). 87 of 114 sources are verified. Every record is still `status: draft` with `reviewed_by: null` until a credentialed professional (PharmD, RD, or MD) reviews it. Safety notes, reference-intake numbers, timing notes and food amounts are only partly verified. **Not medical advice.**

This is the single source of truth for the app (D-005). It follows [`docs/evidence-model.md`](../docs/evidence-model.md).

## What's in it

| File | Contents |
|---|---|
| `ingredients/*.yaml` | 30 ingredients, one file each: synonyms, US adult reference intakes (RDA/AI/UL), unit conversions, food sources, graded claims, safety notes, and whether it can be recommended |
| `interactions.yaml` | Pairwise supplement↔supplement and supplement↔drug-class interactions, each with severity, mechanism, recommendation, evidence grade, and sources |
| `effect-groups.yaml` | Additive-risk groups (bleeding risk, sedative, liver-injury reports, minerals that bind drugs). These catch combinations that pairwise records miss |
| `drug-classes.yaml` | 21 curated high-risk drug classes (D-006) |
| `lifestyle-alternatives.yaml` | **Food swaps** (79 servings with amounts, for 13 nutrients) and **habit swaps** for the 7 goal chips (17 graded habits). This is the data behind "You probably don't need this" |
| `sources.yaml` | Citation registry (114 sources, 87 verified). Everything above cites ids from here |
| `evidence/` | **Evidence store**: retrieval records, fingerprints and verbatim quotes for every verified source. See [`evidence/README.md`](evidence/README.md) |
| `fixtures/synthetic-stacks.yaml` | 3 made-up user stacks with hand-written expected results, ready to become engine tests |

### The 30 ingredients
- **Vitamins (9):** A, B6, B12, folate, biotin, C, D, E, K
- **Minerals (6):** calcium, iron, magnesium, zinc, selenium, iodine
- **Other common supplements (7):** omega-3/fish oil, probiotics, melatonin, creatine, CoQ10, psyllium, glucosamine
- **Botanicals (8):** turmeric, ashwagandha, St. John's wort, ginkgo, garlic, green tea extract, echinacea, red yeast rice

Only **7 of 30** are `recommendable: true` (B12, D, calcium, magnesium, melatonin, creatine, psyllium), and each comes with a `recommend_only_if` condition. That's deliberate: most popular supplements don't clear the A/B evidence bar, and the product says so.

## Rules the validator enforces

```bash
npm install
npm run validate          # must pass on every commit (CI)
npm run validate:strict   # passes only when everything is reviewed and verified, i.e. publishable
```

- **No source, no claim.** Every claim, safety note, interaction, and group rule cites ≥1 known source.
- **Recommendation threshold.** `recommendable: true` requires a *benefit* claim graded A or B, plus a `recommend_only_if` lifestyle-first condition. `false` requires a reason.
- **Pharmacist routing.** Moderate or major supplement↔drug interactions must tell the user to talk to a pharmacist or prescriber.
- **Integrity.** IDs are unique, references resolve, enums are valid, duplicate pairs are rejected, and effect groups with a "2+ members" rule actually have 2+ members.
- **Publishing gate.** `status: published` requires `reviewed_by` and only verified sources.
- **Timing.** Every ingredient has `timing` (best slot, take with). Every interaction has structured `management`. A `separate` rule needs a gap in hours and a `basis` (drug label, cited source, or draft default). Label-based rules must name the label.
- **Swaps.** Goal supplements may only reference their *own* claims. Habits need a grade and sources. Habit text may not claim "same effect".

## Modeling decisions worth knowing
- **ULs carry `applies_to`.** Some limits count only part of intake: magnesium (supplements only), folate (folic acid only), vitamin A (preformed only), vitamin E (supplemental only). A naive sum would give false alarms.
- **Pairwise rules beat group rules** for the same pair, because the more specific evidence wins.
- **Pairs inside one product are suppressed** (e.g. calcium and iron in the same multivitamin), but still count toward upper-limit totals.
- **Dose thresholds on group membership.** Vitamin E joins the bleeding-risk group only at high doses (draft threshold, reviewer to confirm), so a multivitamin doesn't trigger it.
- **"No effect" findings are first-class.** 11 claims say "studied, didn't work" (e.g. vitamin D and fractures in VITAL, ginkgo and dementia in GEM). That's often the most useful thing to tell someone.

## How timing and swaps work

**Timing** (input to the daily schedule, D-013):
- `ingredients/*.yaml → timing`: `best_slot` (with_meal, bedtime, any, …) and `take_with` (food, food_with_fat, empty_stomach, …).
- `interactions.yaml → management`: `separate` (with `hours`, optional `order: drug_first`), `prefer_together`, `avoid`, `consult`, `monitor`, `keep_consistent`, `limit_dose`. `avoid` items aren't scheduled; they go to "Talk to a pharmacist first".
- `drug-classes.yaml → timing`: only where a drug fixes the schedule (levothyroxine and bisphosphonates on waking with an empty stomach, PPIs before breakfast).
- `basis` records where each number comes from. **3 gaps are `draft_default`** (calcium/iron, zinc/iron, tetracyclines): the sources confirm the interaction but give no hour figure. The probiotics/antibiotics gap was removed during verification because no source supported it.

**Swaps** (D-018, D-022):
- **Food swap:** shown when a nutrient supplement is above need or duplicated. The app picks servings from `food_swaps` to show what covers the RDA.
- **Habit swap:** shown when the user's "why" chip matches a goal *and* the best `replaces` habit has a **stronger grade** than the supplement's best benefit claim for that goal. Currently this triggers for 19 goal/supplement pairs.
- `swap: route_to_clinician` (B12 and iron for energy) shows "get checked" instead, because a real deficiency needs the supplement.

## Known gaps / next steps
1. **Finish verification.** Claims, interactions, habits and effect groups are done ✅ (see `evidence/README.md`; the USPSTF 2018 fracture statement was confirmed as still current). Still to verify: safety notes, reference intakes, timing notes, food amounts, and current FDA/EFSA guidance on maximum omega-3 intake.
2. **Credentialed review** of all records (pharmacist for interactions, dietitian for intakes and food sources).
3. Age- and sex-specific ULs beyond adults 19+ (out of scope for v1 per D-008).
4. ~~Map ingredients to goals and add lifestyle steps~~ ✅ (`lifestyle-alternatives.yaml`).
5. Verify all food amounts against USDA FoodData Central.
6. Typical prices for the savings estimate (D-019). Not added: prices vary too much to source well, so the MVP uses the price the user enters.
