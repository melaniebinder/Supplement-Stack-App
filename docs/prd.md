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

## User stories

### Stack Check (P0)
| ID | As a… | I want to… | So that… | Acceptance criteria |
|---|---|---|---|---|
| SC-1 | supplement user | add supplements by name or common synonym | I don't need to know the scientific name | Search matches name, synonyms, and common misspellings, e.g. "mag glycinate" → magnesium |
| SC-2 | supplement user | enter dose and frequency (optional) | upper-limit checks are accurate | Works without a dose. Upper-limit checks run only when a dose is given, and the UI says so |
| SC-3 | supplement user | see interactions between my supplements | I know about conflicts | Each flag shows severity, mechanism in plain language, evidence grade, and sources |
| SC-4 | person on medication | add medications by drug *class* | I learn about supplement–drug risks | v1 covers a curated list of high-severity classes (anticoagulants, SSRIs, etc.). Every hit routes to "talk to your pharmacist" |
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
