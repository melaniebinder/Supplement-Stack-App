# Manual tasks (owner: you)

Things that need a person: a browser, a credential, a professional, a decision, or real users. Claude can do everything else in the repo. Tick items off here so the list stays the source of truth.

> Last updated: 2026-11-22 · Related: [roadmap](roadmap.md), [evidence store](../data/evidence/README.md)

## 🔴 Before anything is shown to users

- [ ] **Recruit a credentialed reviewer** (PharmD for interactions and timing, RD for intakes and food).
  - *Why:* every record is `status: draft, reviewed_by: null`. The publishing gate (`npm run validate:strict`) can't pass without this.
  - *Done when:* a reviewer has signed off records and their name and date are in `reviewed_by` / `reviewed_at`.
- [ ] **Get a regulatory and legal read** on the product copy and the interaction checker.
  - *Why:* health claims (FTC), and whether a supplement–drug checker counts as clinical decision support (FDA guidance). See PRD open question 2.
  - *Done when:* there's a short written opinion and any copy changes are made.
- [ ] **Have the reviewer confirm the 3 placeholder timing gaps** (`basis: draft_default`). The sources confirm each interaction but give no hour figure:
  - [ ] Calcium + iron: 2 hours apart (INT-001)
  - [ ] Zinc + iron: 2 hours apart (INT-002)
  - [ ] Tetracycline antibiotics + minerals: drug 2 h before or 4 h after (mineral-chelators group)
- [ ] **Have the reviewer confirm the vitamin E bleeding-risk dose threshold** (180 mg/day, about 400 IU synthetic) in `data/ingredients/vitamin-e.yaml`.
- [ ] **Have the reviewer read the 18 "you probably don't need this" habit swaps** (run `SHOW_SWAPS=1 npm run validate` to list them). These are the most opinionated outputs.

## 🟠 Verification Claude can't finish alone

- [ ] **Get a free USDA FoodData Central API key** (sign up at api.data.gov) and give it to Claude through the secure credential prompt (never paste it in chat).
  - *Unblocks:* verifying all 79 food-swap amounts (13 nutrients). The demo key is rate-limited.
- [ ] **Check recommended and maximum daily amounts (RDA/AI/UL) by hand** for the 14 ingredients not yet verified. The National Academies reports on NCBI Bookshelf and the NIH ODS fact sheets block automated access but open normally in a browser.
  - Ingredients: biotin, folate, iodine, iron, magnesium, omega-3, psyllium (fiber), selenium, vitamin A, vitamin B12, vitamin C, vitamin E, vitamin K, zinc.
  - *Done when:* for each, you paste the RDA/AI/UL sentence and the page URL into a GitHub issue or this file, and Claude adds it to the evidence store.
  - *Alternative:* attach your computer to a session (Remote Control), and Claude can read the pages through your browser.
- [ ] **Check the current FDA and EFSA guidance on maximum omega-3 (EPA+DHA) intake** from supplements. The ingredient file says to confirm it before showing a number.
- [ ] **Decide what to do about the remaining ODS-only citations** (19 ODS pages, 27 unverified sources in total). Either verify them in a browser as above, or let Claude re-source the safety notes and timing notes to primary studies and labels, as was done for the claims.

## 🟡 Product research

- [ ] **Hands-on competitor test (about 30 min).** Enter Maya's stack (FX-001) and Priya's stack (FX-003) into Suvo, Nutrient Wise, Drugs.com and Hello Pharmacist. Screenshot the results into `design/competitors/` and note which flags each one catches or misses.
- [ ] **Run 8–10 user interviews** ([guide](research/interview-guide.md)). Store only paraphrased, coded notes (P01, P02…) in `docs/research/interviews/`.
- [ ] **Test the 20-label photo-scan spike** once the prototype exists. This is a launch gate (D-020).

## 🟢 Housekeeping

- [ ] Merge open PRs once CI is green.
- [ ] When a reviewer is found, decide where their sign-off lives: commit trailer, `reviewed_by`, or a signed review log.

---

## What's still unverified (snapshot)

Generated from the data on 2026-11-22. Re-run the snippet in `data/evidence/README.md` or `npm run validate` for the live state.

| Area | Verified | Not yet verified |
|---|---|---|
| Claims, interactions, habits, effect groups | **99 / 99** ✅ | — |
| Safety notes (by ingredient) | 15 / 27 | biotin, calcium, folate, glucosamine, iodine, magnesium, omega-3, psyllium, vitamin A, vitamin C, vitamin D, zinc |
| Reference intakes (RDA/AI/UL) | 3 / 17 | biotin, folate, iodine, iron, magnesium, omega-3, psyllium, selenium, vitamin A, vitamin B12, vitamin C, vitamin E, vitamin K, zinc |
| Ingredient timing notes | 1 / 30 (melatonin), plus drug timing for levothyroxine, bisphosphonates, PPIs | the other 29 ingredients |
| Food-swap amounts | 0 / 79 servings | all 13 nutrients (needs the USDA API key) |
| Sources | 87 / 114 | 19 NIH ODS pages, LiverTox, 21 CFR 101.81 (eCFR), FDA biotin and intranasal-zinc notices, Japan beni-koji notices, the 2023 melatonin gummy study (no abstract; its finding is verified via NCCIH), USDA FoodData Central, Dietary Guidelines 2020–2025 |
| Credentialed review | 0 records | everything |
