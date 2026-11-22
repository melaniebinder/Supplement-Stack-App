# Roadmap

Organized by confidence, not dates. Items move left only once the step before them is validated.

## Now: validate the problem and the evidence model
- [ ] Run 8–10 user interviews ([guide](research/interview-guide.md))
- [x] Competitor scan (desk research) → [findings](research/competitor-scan.md)
- [ ] Hands-on competitor test with Maya's and Priya's stacks
- [x] Decide positioning (D-018) and borrowed ideas (D-019)
- [x] Draft a 30-ingredient pilot knowledge base using the [evidence model](evidence-model.md) ([`data/`](../data/))
- [ ] Verify all citations against live sources
- [x] Validator that enforces the evidence rules in CI
- [ ] Get a credentialed reviewer (PharmD or RD) to audit 20 interaction records
- [x] Add structured timing fields (`best_slot`, `take_with`, interaction `management`) to the data (D-021)
- [x] Add a lifestyle-alternatives dataset: food swaps plus graded habits for 7 goals (D-022)
- [ ] Reviewer to confirm the 4 `draft_default` timing gaps
- [ ] Measure DSLD coverage for the top 50 multivitamins
- [ ] Spike: photo-scan accuracy on 20 real Supplement Facts panels (**launch gate**, D-020)
- [ ] Clickable prototype of Stack Check, tested with 5 users
- [ ] Copy review against health-claim guidelines

**Exit criteria:** users can describe the value in their own words, the reviewer error rate is under 5%, and ≥3 of 5 prototype testers say they'd use it again.

## Next: ship Stack Check v1
- [ ] Web app: product-based stack entry (single items, multivitamin templates, DSLD search), medication pick-list, results grouped by action
- [ ] Photo scan of the Supplement Facts panel with a confirm screen (D-020)
- [ ] Daily schedule generator, with calendar (.ics) export
- [ ] Estimated monthly savings on "you probably don't need this"
- [ ] Public source library page
- [ ] Lifestyle and food swaps
- [ ] Evidence View for each ingredient
- [ ] Printable summary to take to a clinician
- [ ] Drug-class flags (curated, routed to a pharmacist)
- [ ] Analytics for the activation and north-star metrics
- [ ] Automated tests for the product invariants (citation coverage, lifestyle-first ordering)

## Later: guidance and growth
- Free-text medication search
- Goal-based Guidance with the lifestyle-first ladder (5 goals)
- Optional accounts and saved stacks
- Food-intake estimate (short diet questionnaire) to personalize "do you need this?"
- Clinician-facing view or share link
- Expand the knowledge base to 100+ ingredients, and decide whether to license a professional database
- Localization (non-US upper limits and regulations)

## Explicitly not planned
- Selling or ranking supplements
- Diagnosis or symptom checking
- AI chat that generates health facts
