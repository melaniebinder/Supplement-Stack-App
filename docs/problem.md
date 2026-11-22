# Problem

> Status: draft · Owner: PM · Last updated: 2026-11

## One-sentence problem

People who take several supplements have no easy, trustworthy way to check whether their stack is safe, whether it's backed by evidence, or whether a diet or lifestyle change would do the job better.

## Who it's for

### Primary persona: "The Optimizer" (synthetic)
- **Maya, 34**, works in tech and listens to health podcasts.
- Takes 6 supplements: vitamin D, magnesium glycinate, fish oil, ashwagandha, zinc, and a multivitamin.
- Added them one at a time over two years, each on a different recommendation. She has never looked at the stack as a whole.
- **Job to be done:** "Tell me whether anything I take conflicts or overlaps, and whether I'm wasting money."

### Secondary persona: "The Medicated Adult" (synthetic)
- **Robert, 61**, takes a statin and a blood thinner. His daughter suggested turmeric and fish oil.
- At higher risk: some common supplements are associated with bleeding risk or changes in how drugs are metabolized.
- **Job to be done:** "Is it OK to add this to what my doctor already has me on?"
- Product implication: Robert needs clear "talk to your pharmacist" routing, not dosing advice.

### Out of scope for v1
Pregnant or breastfeeding people, children, and people managing a diagnosed condition with supplements. These users need a clinician. The product should recognize them and route them there instead of advising them.

## The pain

| Pain | Why it happens | Consequence |
|---|---|---|
| **Overlap and redundancy** | Multivitamins, "immune" blends, and single nutrients often contain the same ingredients | Users may go over tolerable upper intake levels (for example zinc, vitamin A, or vitamin B6) without realizing it |
| **Hidden interactions** | Interaction data is in papers and clinical databases, not on labels | Some combinations may reduce absorption or raise side-effect risk |
| **Evidence is opaque** | Marketing language treats strong and weak evidence the same | Users spend money on things that don't work for their goal |
| **Supplement-first culture** | The industry earns money from products, not from behavior change | Easy diet, sleep, or sun changes get skipped |
| **Clinician conversations don't happen** | Patients often don't tell doctors about supplements, and appointments are short | Risky combinations go unnoticed |

## Why existing options fall short

(Detail in [`research/competitor-scan.md`](research/competitor-scan.md).)

- **Drug-interaction checkers** (consumer pharmacy and drug-reference sites) are built for drugs. Supplement coverage is thin, and they give no guidance on whether you need the supplement in the first place.
- **Evidence databases** (Examine-style research summaries, professional databases such as Natural Medicines) are excellent but written for researchers or clinicians, often paywalled, and organized ingredient by ingredient rather than by *your stack*.
- **Personalized supplement brands** (quiz → monthly pack) have a conflict of interest: the recommendation is the product being sold.
- **Nutrition trackers** (food-logging apps) show nutrient intake from food but don't connect it to supplement decisions.

**The gap (updated Nov 2026 after the [competitor scan](research/competitor-scan.md)):** stack-level checking and timing are now offered by several apps, some free. What's still missing is a tool that tells you **which supplements you don't need**, because food or a habit covers it, with **free, visible evidence grades**, covering **supplement↔drug as well as supplement↔supplement**, and with **no incentive to sell**.

## Evidence that this problem is real

> ⚠️ Every figure below must be checked against the primary source before external use. Links point to the source *type*. Add exact citations as they're verified.

- **Supplement use is widespread.** National survey data (CDC/NCHS, NHANES) shows that more than half of US adults reported using a dietary supplement in the past 30 days, and use rises with age. _[cite NCHS Data Brief, NHANES 2017–2018]_
- **Use of multiple supplements is common, especially among older adults.** _[cite NHANES analyses of multi-supplement use]_
- **Supplement–drug interactions are documented.** Well-known examples include St. John's wort (CYP3A4 induction) and vitamin K with warfarin. _[cite NIH ODS / NCCIH fact sheets]_
- **Patients often don't disclose supplement use to clinicians.** _[cite survey literature on non-disclosure]_
- **Diet first is the standard public-health position.** The Dietary Guidelines for Americans state that nutrient needs should be met primarily through food. _[cite DGA 2020–2025]_

### Evidence still needed (to come from our own research)
- [ ] 8–10 user interviews (guide: [`research/interview-guide.md`](research/interview-guide.md))
- [ ] Survey: how many supplements people take, and where they heard about them
- [ ] Test whether users *want* lifestyle suggestions or find them preachy (riskiest assumption, see below)

## Riskiest assumptions

1. **Users will accept "change your diet first."** People looking for a supplement may bounce when told to eat more spinach. *Test:* show both versions of the copy in a prototype test.
2. **We can build a trustworthy knowledge base without licensing a clinical database.** *Test:* build a 30-ingredient pilot from public sources and have a pharmacist or registered dietitian review it.
3. **Users will act on a flag** (talk to a pharmacist, or drop a supplement). *Test:* follow-up survey 2 weeks after a check.
4. **The product can stay on the right side of health-claims regulation** while still being useful. *Test:* get a regulatory and legal review of the copy before launch.
