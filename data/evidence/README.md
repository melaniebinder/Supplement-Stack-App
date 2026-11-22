# Evidence store

The evidence behind every claim, interaction, habit and effect group, stored so anyone can re-check it.

> **Status (Nov 2026):** all **99/99** claims, interactions, habits and effect groups are backed by at least one **verbatim quote** from a retrieved primary or authoritative source (168 quotes from 87 sources). Records are still `draft` until a credentialed reviewer signs off. Not medical advice.

## What's stored

```
data/evidence/
├── sources/<source-id>.yaml   one file per source: how to retrieve it, retrieval record, quotes
└── text/<source-id>.txt       full retrieved text, ONLY for public-domain US government pages (NCCIH, USPSTF)
.cache/evidence/               retrieved text of copyrighted sources (journal abstracts, drug labels). Gitignored, re-fetchable.
```

Each `sources/<id>.yaml`:

```yaml
source_id: trial-vital-fracture-2022
license: excerpt_only            # public_domain → full text kept in text/; excerpt_only → short quotes only
retrieve: {method: pubmed, pmid: "35939577"}   # pubmed | pmc | dailymed | html
retrieved:
  at: 2026-11-22                 # retrieval date
  url: https://pubmed.ncbi.nlm.nih.gov/35939577/
  sha256: 3f1c…                  # fingerprint of the retrieved text; a change means the source changed
  title: Supplemental Vitamin D and Incident Fractures in Midlife and Older Adults.
  journal: The New England journal of medicine
  year: '2022'
  doi: 10.1056/NEJMoa2202106
excerpts:
  - supports: [CLM-VITD-02]      # record ids this quote supports
    quote: "Vitamin D 3 supplementation did not result in a significantly lower risk of fractures than placebo …"
    locator: Abstract, Conclusions
```

`supports` ids: `CLM-*` claims, `INT-*` interactions, `HAB-*` habits, `GROUP:<id>` effect groups. Partial coverage (not yet required) uses `SAFETY:<ingredient>`, `RI:<ingredient>` (reference intakes), `TIMING:<ingredient or drug_class/…>`, and `EXCLUSION:<ingredient>:<group>`, which records why something was deliberately left out.

## Rules (enforced)

`npm run validate` (offline, runs in CI):
- Every claim, interaction, habit and effect group has ≥1 excerpt, **from a source the record cites**.
- Every quote in a public-domain source is found **verbatim** in the stored text (case-, whitespace-, quote- and dash-insensitive).
- `sources.yaml` `verified: true` if and only if the source has stored excerpts.

`npm run evidence:verify` (online):
- Re-fetches copyrighted sources into `.cache/` if missing and checks every quote is still present.
- Warns if a source's text changed since it was recorded (fingerprint mismatch), which means its excerpts need re-review.

`npm run evidence:fetch [source-id …]` retrieves sources and updates the retrieval record.

## How sources were chosen

1. **Primary or authoritative first:** randomized trials, Cochrane and other systematic reviews, clinical guidelines (USPSTF, ACP, AASM, AHA, ACIP, ISSN), and FDA drug labels (DailyMed).
2. **NIH ODS fact sheets could not be used.** The ODS site sits behind Cloudflare, which blocks automated access from cloud servers (`403`). Every claim that originally cited ODS was re-sourced to the **primary studies ODS itself relies on**, which is stronger evidence anyway. ODS remains cited only by not-yet-verified safety notes, reference intakes, and timing notes.
3. **NCBI Bookshelf** (LiverTox, National Academies DRI reports) blocks automated browsers with a CAPTCHA, so reference-intake numbers come from PubMed-indexed summaries where possible (e.g. the IOM 2011 calcium and vitamin D report summary).
4. **Copyright:** journal abstracts and drug labels are stored as short quotes only. Full text is stored only for US government works.

## What verification changed

Reading every source against our records led to these corrections (details in [`docs/decisions.md`](../../docs/decisions.md), D-023 to D-026):

| Record | Before | After |
|---|---|---|
| CoQ10 for statin muscle pain | mixed | **no effect** (NCCIH: overall evidence doesn't support it) |
| Garlic and cholesterol | mixed | **small benefit** in people with high cholesterol |
| Magnesium and blood pressure | C | **B**, about −2 mmHg (meta-analysis of 34 double-blind RCTs) |
| B vitamins and heart (B6) | no effect on CV events | no effect on heart attack or death, **small stroke reduction** |
| Fish oil and atrial fibrillation | "mainly above 1 g/day" | risk raised overall (HR 1.25), **also at ≤1 g/day** |
| Zinc for colds | uncertain | little or no effect on **preventing** colds; may **shorten** colds when taken as treatment |
| Ginkgo (GEM) | dementia or cognitive decline | dementia and Alzheimer's **incidence** (what was measured) |
| Vitamin D for bone needs | "supplements reliably raise status" | IOM wording, including that inadequacy has been **overestimated** |
| B12 for adults 50+ | A, "advised to use fortified foods" | **B**, malabsorption of food-bound B12 (review, not guideline) |
| Iodine + antithyroid drugs | moderate, avoid | **minor, consult** (only supports susceptibility, not a drug interaction) |
| Caffeine, Mediterranean diet, activity for stress (habits) | B / A / A | **C / B / B** (single small trial / one trial in high-risk adults / low-quality reviews) |
| **New:** melatonin + warfarin (INT-037), green tea extract + statins (INT-038), ashwagandha + immunosuppressants (INT-039) | — | added from sources read during verification |
| **Removed:** probiotics + antibiotics "2 hours apart" (INT-032) | minor | **removed**, no source found |
| **Bleeding-risk group** | included fish oil, turmeric | fish oil removed (VITAL: no excess bleeding at 1 g/day), turmeric removed (no source). New **botanical + warfarin** group from the warfarin label |

## Not yet verified (next phase)

| Data | Coverage now | Plan |
|---|---|---|
| Safety notes (39 across 27 ingredients) | 15 ingredients have ≥1 verified safety quote | Extend `supports: SAFETY:*` and give safety notes ids |
| Reference intakes (RDA/AI/UL, 30 ingredients) | calcium, vitamin D, vitamin B6 | National Academies reports (if accessible) or PubMed-indexed DRI summaries |
| Ingredient timing notes | melatonin, plus drug timing for levothyroxine, bisphosphonates, PPIs | Drug labels and absorption studies |
| Food amounts (79 servings) | none | USDA FoodData Central API (needs an API key; the demo key is rate-limited) |
