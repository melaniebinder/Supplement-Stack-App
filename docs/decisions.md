# Decision Log

Short entries: what we chose, what we didn't, and why. Newest at the bottom. Status is one of: ✅ decided · 🟡 proposed · 🔁 revisited.

---

### D-001 · Interaction checking is the entry point, not recommendations ✅
**Chose** "check my current stack" as the first experience **over** a "build me a stack" quiz.
**Why:** It's the lowest-risk, highest-trust job. It works on what the user already does, needs no personal health data, and shows value in under a minute. Recommendations come second, once the user has seen that the tool is rigorous.

### D-002 · Lifestyle-first is a hard rule, not a setting ✅
**Chose** to always show diet and lifestyle rungs before supplements **over** letting users skip straight to supplements.
**Why:** This matches public-health guidance (food first) and sets the product apart from supplement sellers. Making it a testable invariant keeps it from wearing away under conversion pressure.
**Trade-off:** Some users may find it preachy. We'll test copy tone (see problem.md, riskiest assumption #1) but won't drop the ordering.

### D-003 · No affiliate links or product sales ✅
**Chose** to have no commerce **over** affiliate revenue.
**Why:** If recommendations make money, users can't trust them, and trust is the product. Monetization options to explore later: freemium (saved stacks, clinician export), a B2B licence to pharmacies or employers.

### D-004 · Start with a self-curated public-source knowledge base 🟡
**Chose (proposed)** to build a ~30-ingredient pilot dataset from public sources (NIH ODS, PubMed, Cochrane, NCCIH) **over** licensing a professional database on day one.
**Why:** It's cheaper, lets us validate demand first, and we own the data model and grading. **Risk:** coverage and the review burden. **Revisit** if pharmacist review finds significant gaps, or once there's funding.

### D-005 · Curated structured data, with no LLM-generated facts ✅
**Chose** a reviewed, versioned dataset as the only source of truth **over** having an LLM answer interaction questions directly.
**Why:** LLMs can invent interactions and citations, and in a health context that's unacceptable. An LLM may *explain* a retrieved record (see evidence-model.md, "Use of AI").

### D-006 · Drug *classes*, not individual drugs, in v1 🟡
**Chose (proposed)** to support a short, curated list of high-risk drug classes (anticoagulants, antiplatelets, SSRIs, immunosuppressants, etc.) **over** a full drug database or no drugs at all.
**Why:** Supplement–drug interactions are where real harm happens, so leaving them out would be a safety gap. A full drug database is a different product with heavier regulatory and licensing exposure. Every drug-class hit routes to a pharmacist and never gives a management tip on its own.

### D-007 · Responsive web app, TypeScript, data stored in the repo 🟡
**Chose (proposed)** Next.js and TypeScript, with the knowledge base as versioned YAML in the repo, **over** native mobile and a hosted database.
**Why:** It's the fastest path to a shareable prototype. Keeping data in git gives free review history (PR = content review) and makes the evidence base auditable. Move to a database once content editing by non-engineers matters.

### D-008 · Exclude high-risk populations from recommendations ✅
**Chose** to screen out and route pregnant or breastfeeding users, children, and people with kidney or liver disease **over** tailoring advice for them.
**Why:** Their needs differ and errors cost more. The safe, honest product behavior is "please talk to your clinician." Stack Check still shows them interaction flags.

### D-009 · Anonymous by default ✅
**Chose** no account needed, with the stack kept in local storage, **over** requiring sign-up.
**Why:** It lowers friction and minimizes the health-adjacent personal data we hold, which reduces privacy and compliance exposure.

### D-010 · One file per ingredient, plus effect groups for additive risk ✅
**Chose** one YAML file per ingredient, plus a separate "effect group" layer (bleeding risk, sedative, liver-injury reports, minerals that bind drugs), **over** a single big table of pairwise interactions.
**Why:** One file per ingredient keeps reviews small (one PR = one ingredient to sign off). Pairwise-only data misses the real-world pattern of several mildly risky supplements adding up, e.g. fish oil + turmeric + a blood thinner. Pairwise records still override group rules when specific evidence exists.

### D-011 · Encode the product rules in a validator, not just in docs ✅
**Chose** a CI validator that fails on uncited claims, sub-B recommendations, or drug flags without pharmacist routing, **over** relying on reviewer discipline.
**Why:** The PRD's guardrails (100% citation coverage, lifestyle-first, recommend only A/B) are only credible if they're enforced automatically. `--strict` mode doubles as the publishing gate.

### D-012 · Ship the draft dataset marked unverified, rather than wait ✅
**Chose** to commit the 30-ingredient set with every source `verified: false` and every record `draft`, **over** holding it until verification.
**Why:** The schema and coverage can be reviewed now, and the gap to "publishable" is measurable (`npm run validate:strict`). Nothing is user-facing yet.

---

_Template for new entries:_

```
### D-0XX · Title  🟡
**Chose** X **over** Y.
**Why:** Z.
**Trade-off / revisit when:** …
```
