# Evidence Model

> Being grounded in science is the product's core promise. This doc defines how a claim earns its way into the app.

## Principles

1. **No source, no claim.** Every interaction, benefit claim, and lifestyle step links to at least one source.
2. **Grade the evidence, not the ingredient.** Magnesium can be grade A for one outcome and grade D for another. Grades attach to *(ingredient, outcome, population)*.
3. **Show the grade to users.** Uncertainty is information, not something to hide.
4. **Prefer syntheses.** Use guidelines, systematic reviews, and meta-analyses before single trials, and single trials before mechanistic or animal studies.
5. **Absence of evidence is stated.** "Not well studied" is a valid and useful answer.

## Grading scale

The scale is simplified from GRADE so consumers can read it.

| Grade | Label shown to users | Typical basis |
|---|---|---|
| **A** | Strong evidence | Consistent systematic reviews or meta-analyses of RCTs, or an official guideline recommendation |
| **B** | Moderate evidence | At least one good-quality RCT, or a meta-analysis with some inconsistency |
| **C** | Limited evidence | Small or short RCTs, or observational data only |
| **D** | Very limited or mixed | Mechanistic, animal, or in-vitro data, case reports, or conflicting results |

**Recommendation threshold:** only A or B evidence can appear as a recommended supplement rung. C and D are shown for information only.

### Interaction severity (separate from evidence grade)

| Severity | Meaning | UI action |
|---|---|---|
| **Major** | May cause serious harm or substantially change how a drug works | Red flag, "Talk to your pharmacist or doctor before combining" |
| **Moderate** | May reduce effectiveness or cause side effects. Often managed with timing or dose | Amber flag, management tip (e.g. "separate by 2+ hours") |
| **Minor** | Theoretical or low clinical significance | Grey note, collapsed by default |

Each interaction carries **both** a severity and an evidence grade. A *major* interaction with *grade D* evidence, for example a theoretical bleeding risk, is still shown, along with how uncertain it is.

## Source hierarchy

| Tier | Source examples | Notes |
|---|---|---|
| 1 | NIH Office of Dietary Supplements fact sheets, national dietary guidelines, Institute of Medicine / National Academies Dietary Reference Intakes (incl. ULs) | Authoritative, public, used for ULs and food sources |
| 2 | Cochrane reviews, peer-reviewed systematic reviews and meta-analyses (PubMed) | Main basis for A/B grades |
| 3 | Individual RCTs (PubMed) | Basis for B/C |
| 4 | NCCIH and MedlinePlus herb and supplement pages, LiverTox | Good for safety signals and interactions |
| 5 | Observational, mechanistic, and animal studies | C/D only |
| ✗ | Manufacturer marketing, influencer content, non-peer-reviewed blogs | Never used as a source |

Licensed professional databases (e.g. Natural Medicines) may be used as a *reference for reviewers* if licensed, but their content is never copied into this repo. See D-004.

## Record lifecycle

```
draft → evidence gathered → graded by author → reviewed by credentialed reviewer (PharmD/RD/MD) → published
                                                                                             │
                              re-review when: 24 months pass, a new major review appears, or a user reports an error
```

## Example record (synthetic, for format only)

```yaml
interaction:
  id: INT-0001
  a: ingredient/calcium
  b: ingredient/iron
  severity: moderate
  mechanism: "Calcium can reduce iron absorption when taken at the same time."
  recommendation: "If you take both, consider taking them at different times of day."
  evidence_grade: B
  sources:
    - type: ods
      citation: "NIH ODS Iron Fact Sheet for Health Professionals"   # verify before publishing
  reviewed_by: null        # must be set before publishing
  status: draft
```

## Verification and the evidence store

A record isn't "sourced" just because it lists a citation. It's **verified** when a verbatim quote from the retrieved source, which the record cites, is stored in [`data/evidence/`](../data/evidence/) and the validator confirms it. Each source stores its retrieval date and a fingerprint (sha256), so a later change to the source is detected. Full text is stored only for US government (public-domain) pages. For journals and drug labels only short quotes are kept, and `npm run evidence:verify` re-checks them online.

When verification contradicts a record, the record changes, not the evidence. Grades go down when the source is weaker than assumed, and records with no supporting source are removed (see D-025).

## Use of AI

- **Allowed:** helping reviewers triage literature, and turning a *retrieved, reviewed* record into plain-language explanation.
- **Not allowed:** generating interactions, grades, doses, or citations. Any AI-written text must be traceable to a published record.
