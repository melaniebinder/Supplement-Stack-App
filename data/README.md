# Knowledge base: starter set (30 ingredients)

> ⚠️ **Status: DRAFT. Not for publication or real-world use.** Every record is `status: draft` with `reviewed_by: null`, and every citation is `verified: false`. The data was compiled from reference knowledge of public sources (NIH ODS and NCCIH fact sheets, major trials, Cochrane reviews). Each citation must be checked against the live source, and each record reviewed by a credentialed professional (PharmD, RD, or MD), before anything is shown to users. **Not medical advice.**

This is the single source of truth for the app (D-005). It follows [`docs/evidence-model.md`](../docs/evidence-model.md).

## What's in it

| File | Contents |
|---|---|
| `ingredients/*.yaml` | 30 ingredients, one file each: synonyms, US adult reference intakes (RDA/AI/UL), unit conversions, food sources, graded claims, safety notes, and whether it can be recommended |
| `interactions.yaml` | Pairwise supplement↔supplement and supplement↔drug-class interactions, each with severity, mechanism, recommendation, evidence grade, and sources |
| `effect-groups.yaml` | Additive-risk groups (bleeding risk, sedative, liver-injury reports, minerals that bind drugs). These catch combinations that pairwise records miss |
| `drug-classes.yaml` | 21 curated high-risk drug classes (D-006) |
| `sources.yaml` | Citation registry. Everything above cites ids from here |
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

## Modeling decisions worth knowing
- **ULs carry `applies_to`.** Some limits count only part of intake: magnesium (supplements only), folate (folic acid only), vitamin A (preformed only), vitamin E (supplemental only). A naive sum would give false alarms.
- **Pairwise rules beat group rules** for the same pair, because the more specific evidence wins.
- **Pairs inside one product are suppressed** (e.g. calcium and iron in the same multivitamin), but still count toward upper-limit totals.
- **Dose thresholds on group membership.** Vitamin E joins the bleeding-risk group only at high doses (draft threshold, reviewer to confirm), so a multivitamin doesn't trigger it.
- **"No effect" findings are first-class.** 11 claims say "studied, didn't work" (e.g. vitamin D and fractures in VITAL, ginkgo and dementia in GEM). That's often the most useful thing to tell someone.

## Known gaps / next steps
1. **Verify all 60 sources** against the live pages and set `verified: true` and `accessed_at`. In particular, re-check the USPSTF fracture recommendation (2018) for a newer update, and the current FDA/EFSA guidance on maximum omega-3 intake.
2. **Credentialed review** of all records (pharmacist for interactions, dietitian for intakes and food sources).
3. Age- and sex-specific ULs beyond adults 19+ (out of scope for v1 per D-008).
4. Map ingredients to the five v1 goals and add lifestyle-step records (PRD GG-1/GG-2).
