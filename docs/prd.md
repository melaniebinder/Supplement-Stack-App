# Product Requirements Document: Supplement Stack (v1)

> Status: draft · Last updated: 2026-11 · Related: [problem.md](problem.md), [evidence-model.md](evidence-model.md), [decisions.md](decisions.md)

## Goal

Help adults who take multiple supplements make their stack **safer and simpler**, using graded scientific evidence and putting lifestyle and diet changes ahead of new supplements.

## Non-goals (v1)

- Diagnosing or treating conditions; no symptom checker
- Dosing for pregnancy, breastfeeding, children, or people with kidney or liver disease (these users are sent to a clinician)
- Selling, ranking, or linking to supplement brands
- Lab, EHR, or wearable integrations
- Native mobile apps (v1 is a responsive web app)

## Scope overview

v1 has three capabilities, built in this order:

1. **Stack Check:** enter what you take and see interactions, overlaps, and upper-limit warnings.
2. **Evidence View:** for each supplement, see what it's studied for and how strong the evidence is.
3. **Goal-based Guidance:** pick a goal (for example "better sleep") and get a lifestyle-first ladder, with supplements appearing only as a later rung that has evidence behind it.

## Experience (v1)

One page with three input sections, then results grouped by **what to do**.

### Inputs
1. **Your supplements.** The stack is a list of **products**, each with one or more ingredients. A vitamin D bottle has one ingredient and a multivitamin has 20 (see "Entering multivitamins" below). Each product has an optional dose and an optional **"Why do you take it?"** chip: sleep · energy · stress · immunity · heart · bones · workout · "my doctor told me to" · not sure. (D-014)
2. **Your medications.** This is a separate section, so users understand that medications are part of the check. The MVP uses a **short pick-list** in everyday language, mapped to `drug-classes.yaml` (D-016). It includes an **"Other medication"** option, which shows "we couldn't check this one, so ask your pharmacist", and a required **"I don't take any medications"** checkbox. Results don't run until the user either adds a medication or ticks that box.
3. **About you (optional).** Age range, sex, and the screening question (pregnant or breastfeeding, under 18, kidney or liver disease). A "yes" to screening keeps all safety flags and replaces lifestyle-swap and recommendation content with clinician routing (D-008).

**Medication pick-list (MVP)**

| Shown to user | Drug class |
|---|---|
| Blood thinner: warfarin | `warfarin` |
| Blood thinner: apixaban, rivaroxaban, dabigatran, edoxaban | `doacs` |
| Clopidogrel, ticagrelor, or a daily aspirin | `antiplatelets` |
| Antidepressant (SSRI/SNRI) or tramadol/triptans | `serotonergic-drugs` |
| Birth control (pill, patch, ring, implant) | `hormonal-contraceptives` |
| Thyroid medication (levothyroxine) | `levothyroxine` |
| Methimazole, PTU, amiodarone, lithium | `antithyroid-drugs` |
| Statin (cholesterol) | `statins` |
| Acid reducer: omeprazole, pantoprazole, … (PPI) | `ppis` |
| Metformin | `metformin` |
| Water pill: hydrochlorothiazide, chlorthalidone | `thiazide-diuretics` |
| Antibiotic: ciprofloxacin, levofloxacin | `quinolone-antibiotics` |
| Antibiotic: doxycycline, minocycline | `tetracycline-antibiotics` |
| Any other antibiotic (currently taking) | `antibiotics-general` |
| Osteoporosis: alendronate, risedronate | `bisphosphonates` |
| Transplant or immune-suppressing medication | `immunosuppressants` |
| HIV medication | `hiv-antiretrovirals` |
| Digoxin | `digoxin` |
| Beta-blocker | `beta-blockers` |
| Sleep medication or sedative | `sedatives` |
| Isotretinoin / acitretin | `oral-retinoids` |
| Other medication | not checked → "ask your pharmacist" |

### Results, grouped by action
| Order | Section | Contents |
|---|---|---|
| 1 | 🔴 **Talk to a pharmacist first** | Major interactions and all supplement–drug flags |
| 2 | 🕐 **Your daily schedule** | **Core feature (D-013).** All timing rules combined into one wake → breakfast → lunch → dinner → bedtime plan, with each separation explained (e.g. "iron 4h after thyroid medication") |
| 3 | 📉 **You may be getting too much** | Upper-limit totals across products, and the same ingredient in several products |
| 4 | 🌱 **You probably don't need this** | Lifestyle and food swaps, plus supplements with weak evidence for the user's stated reason, with **estimated monthly savings** (D-019). This is the headline section of the product (D-018) |
| 5 | ✅ **Checked, no issues** | Everything else, so users see the whole stack was reviewed |

Interaction flags show evidence in plain words (**probable / possible / theoretical**), mapped from the A–D grades in the data (D-019). Every results view has the not-medical-advice notice and a **print / save** button, and the schedule has **export to calendar**. The schedule plus the flags is the one-page summary to take to a pharmacist.

### Lifestyle swaps
There are two kinds, and both are shown in a **direct tone** (D-015):
- **Food covers the nutrient** (vitamins and minerals). This works without a "why" chip. Example: *"Your 50 mg zinc is more than you need. 3 oz beef plus a handful of pumpkin seeds covers your daily 8 mg."*
- **A habit addresses the same goal** (needs the "why" chip). Example: *"Melatonin probably isn't doing much for ongoing sleep problems (evidence: weak). A fixed wake time and morning daylight have stronger evidence."*

Rules:
- Show both evidence grades side by side. Never claim "same effect" unless a direct comparison exists. The standard wording is "addresses the same goal, with stronger evidence."
- Be direct about *evidence*, but never tell users to stop a supplement. Wording is "probably isn't doing much" or "you likely don't need this", not "stop taking". If the user picked "my doctor told me to", no swap is shown.

### Entering multivitamins and other multi-ingredient products (D-017, D-020)
| Method | MVP? | Notes |
|---|---|---|
| **Generic templates:** "Typical women's / men's / 50+ multivitamin", with editable amounts | ✅ MVP | Always works. Approximate until edited |
| **Search by name or barcode:** NIH Dietary Supplement Label Database (DSLD) | ✅ MVP | Public-domain label data with an API. Coverage and freshness to be measured |
| **Photo of the Supplement Facts panel:** read and parse the label, then match ingredients | ✅ MVP (D-020) | Launch gate: accuracy spike on 20 real labels |

Rules for any automatic entry:
- **The user always confirms.** Parsed rows appear on an editable review screen, and nothing is checked until the user confirms.
- **Unknowns are shown, not dropped.** Ingredients outside the knowledge base and proprietary blends are listed as "not checked."
- **What parsing must get right:** servings per day (multiply per-serving amounts), the form (e.g. "as retinyl palmitate" vs "as beta-carotene" for the vitamin A upper limit), units (mcg / mcg RAE / mcg DFE / IU conversions), and elemental mineral amounts.
- **Label reading is transcription, not fact generation.** An AI vision model may read the user's own label (consistent with D-005), but all facts still come from the reviewed knowledge base.
- **Photos are processed and then discarded, never stored** (D-009).

## User stories

### Stack Check (P0)
| ID | As a… | I want to… | So that… | Acceptance criteria |
|---|---|---|---|---|
| SC-1 | supplement user | add supplements by name or common synonym | I don't need to know the scientific name | Search matches name, synonyms, and common misspellings, e.g. "mag glycinate" → magnesium |
| SC-1b | multivitamin user | add a multi-ingredient product from a template or by name/barcode search | I don't have to type 20 ingredients | Template and DSLD paths work. All rows are editable. Unknown ingredients are shown as "not checked" |
| SC-1c | multivitamin user | photograph the Supplement Facts panel | entry takes seconds | Parsed rows go to a review screen. Servings per day and forms are handled. The photo is not stored |
| SC-2 | supplement user | enter dose and frequency (optional) | upper-limit checks are accurate | Works without a dose. Upper-limit checks run only when a dose is given, and the UI says so |
| SC-3 | supplement user | see interactions between my supplements | I know about conflicts | Each flag shows severity, mechanism in plain language, evidence grade, and sources |
| SC-4 | person on medication | pick my medications from a short list in everyday language | I learn about supplement–drug risks | Pick-list maps to drug classes (see Experience). "Other medication" says it can't be checked. Every hit routes to "talk to your pharmacist" |
| SC-4b | anyone | confirm "I don't take any medications" | the check is complete | Results don't run until medications are added or this box is ticked |
| SC-8 | anyone | get one daily schedule that resolves all timing conflicts | I know exactly when to take each thing | Every timing rule (separate by N hours, with food, empty stomach) is satisfied, or the conflict that can't be resolved is shown and routed to a pharmacist |
| SC-9 | anyone | see which supplements food or habits could replace | I can simplify my stack | Food swaps for nutrients. Habit swaps when a "why" is given. Both evidence grades shown. No swap for "my doctor told me to" |
| SC-10 | anyone | see roughly how much I'd save each month by dropping what I don't need | the trade-off is concrete | Uses the price I enter, or a typical price labeled "estimate" (D-019) |
| SC-11 | anyone | export my daily schedule to my calendar or reminders app | I actually follow it | .ics export at minimum (D-019) |
| SC-12 | skeptic | browse every source the app relies on | I can check the app's work | A public source library page generated from `data/sources.yaml`, linked from every flag (D-019) |
| SC-5 | multivitamin user | see overlapping nutrients across products | I avoid accidentally doubling up | Totals summed per nutrient and compared to the tolerable upper intake level (UL) when one exists |
| SC-6 | anyone | use it without an account | I can try it with no commitment | Stack is kept in local storage. Saving to an account is optional |
| SC-7 | anyone | export or print a summary | I can bring it to my doctor or pharmacist | One-page PDF/print view with sources |

### Evidence View (P0)
| ID | Story | Acceptance criteria |
|---|---|---|
| EV-1 | As a user, I want to see what a supplement is studied *for* and how strong the evidence is for each use | Each claim is a (supplement, outcome, grade, sources) record; see [evidence-model.md](evidence-model.md) |
| EV-2 | As a user, I want food sources for a nutrient | Nutrient supplements list their top food sources |
| EV-3 | As a skeptic, I want to open the primary sources | Every claim links to at least one source (PubMed ID, NIH ODS page, etc.) |

### Goal-based Guidance (P1)
| ID | Story | Acceptance criteria |
|---|---|---|
| GG-1 | As a user, I want to pick a goal (sleep, energy, bone health, heart health, exercise recovery) | v1 supports 5 goals |
| GG-2 | As a user, I want the lifestyle and diet steps first | **Invariant:** rungs 1–2 (diet, lifestyle) always come before rung 3 (supplements). A supplement is never the only suggestion |
| GG-3 | As a user, I want suggested supplements checked against my current stack | Any suggestion is automatically run through Stack Check |
| GG-4 | As a user in an out-of-scope group, I want to be told clearly to see a clinician | A screening question (pregnant, under 18, kidney or liver disease, etc.) leads to a routing message and no supplement rung |

### Out of v1, captured for later
- Reminders and adherence tracking
- Food-log import to estimate dietary intake
- Clinician-facing view

## The recommendation ladder (core logic)

```
Goal selected
   │
   ▼
Screening (out-of-scope groups → clinician routing, stop)
   │
   ▼
Rung 1  DIET        food-based changes, e.g. "2 servings fatty fish/week"
Rung 2  LIFESTYLE   sleep, activity, sunlight, stress, alcohol and caffeine timing
Rung 3  SUPPLEMENT  only if evidence grade ≥ B for this goal,
                    shown with "if diet/lifestyle isn't enough",
                    and auto-checked against the current stack
```

Rules:
- A supplement with grade C or D evidence for a goal is **never recommended**. It may appear under "studied, but evidence is weak."
- If the user already takes a supplement with grade D evidence for their stated goal, say so neutrally ("evidence for this use is limited").
- Copy uses structure/function wording ("supports", "is associated with"), never disease claims ("treats", "cures", "prevents").

## Data model (sketch)

```yaml
Ingredient:   id, name, synonyms[], type (vitamin|mineral|botanical|other), ul_by_age_sex, food_sources[]
Product:      id, name, ingredients[{ingredient_id, amount, unit}]        # synthetic examples only
DrugClass:    id, name, example_drugs[]
Interaction:  id, a (ingredient|drug_class), b, severity (major|moderate|minor),
              mechanism, effect_plain_language, recommendation, evidence_grade, sources[], reviewed_by, reviewed_at
Claim:        id, ingredient_id, outcome, direction (benefit|no_effect|harm), evidence_grade, population, sources[]
LifestyleStep:id, goal, rung (diet|lifestyle), text, evidence_grade, sources[]
Source:       id, type (pubmed|ods|cochrane|guideline), citation, url, accessed_at
```

## Content and safety requirements

- **Not-medical-advice notice** on every results screen and in exports.
- **Severity language:** "major" interactions use the strongest visual treatment and always include "talk to your pharmacist or doctor before combining."
- **No disease claims** in UI copy. A copy checklist is reviewed before launch.
- **Content review:** every Interaction and Claim record needs `reviewed_by` (credentialed reviewer: PharmD, RD, or MD) before it's published.
- **Freshness:** records older than 24 months are flagged for re-review.

## Success metrics

| Type | Metric | Definition | v1 target (hypothesis) |
|---|---|---|---|
| North star | **Safer/simpler stack rate** | % of completed checks where, at the 2-week follow-up, the user reports acting on a flag, removing a redundant item, or adopting a lifestyle step | 25% |
| Activation | Stack completion | % of visitors who enter ≥2 items and view results | 40% |
| Companion | Estimated savings | Median estimated monthly savings among users who act on a "don't need this" item | Track; no target yet |
| Engagement | Evidence depth | % of results sessions where ≥1 source is opened | 20% |
| Product invariant | Lifestyle-first adherence | % of guidance sessions where diet/lifestyle is shown before supplements | 100% (automated test) |
| Trust | "Would show my doctor" | Post-session 1–5 rating, % scoring 4–5 | 60% |
| Guardrail | Citation coverage | % of published claims with ≥1 source | 100% |
| Guardrail | Content error rate | User-reported errors confirmed per 1,000 checks | < 1 |
| Guardrail | Out-of-scope routing | % of screened-in users who are shown a supplement rung | 0% |

## Open questions

1. Can we license a professional interaction database for v1, or start with a public-source dataset that we curate ourselves? (See D-004.)
2. Which regulatory frameworks apply to an interaction checker that includes drug classes? This needs a legal review (FDA clinical decision support guidance, FTC health-claim rules, and equivalents in non-US markets).
3. Should dose entry be required to make upper-limit checks useful, or does it add too much friction?
4. How good is DSLD coverage and freshness for the 50 best-selling multivitamins? (Measure before committing to it.)
5. Photo scanning: on-device text recognition plus a rule-based parser, or a vision model? Compare accuracy on 20 real labels.
6. Daily schedule: what happens when the constraints can't all be met (e.g. 3 minerals and 2 medications that all need separating)? The proposal is to show the best schedule and flag what's left for the pharmacist.
