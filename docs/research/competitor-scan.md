# Competitor Scan

> **Researched:** November 2026 from public web sources (product sites, app-store listings, press, and help docs).
> **Limits:** Most feature descriptions are the vendors' own claims. Nothing here has been tested hands-on yet (see "Next steps"). Products change fast, so re-check before citing externally.

## TL;DR

1. **Checking a stack is quickly becoming table stakes.** At least one free app (Suvo) already scans labels, breaks products into ingredients, and flags overlaps, interactions, timing conflicts, and upper limits, then slots supplements into morning, evening, and meal times. Several others (Nutrient Wise, SuppCo, StackSnap) scan labels and check against saved medications. **Our daily schedule (D-013) and label scanning (D-017) are expected features, not what sets us apart.**
2. **Drug–supplement checking is solved for experts but scattered for consumers.** The professional gold standard (Natural Medicines) is paid and institutional, and its checker doesn't cover supplement↔supplement pairs. Free consumer checkers either extrapolate from drug class (Drugs.com), are aimed at clinicians (Medscape), or cover only drug↔supplement (Hello Pharmacist).
3. **"You don't need this" is almost unclaimed.** Nearly every product helps you take supplements *better*. Very few tell you that food or a habit would do the job, and none we found pairs that with visible evidence grades and a stack check.
4. **Visible evidence grades exist, but behind a paywall.** Examine grades each supplement A–F *per outcome* and rates interactions on separate severity and evidence scales (close to our model), but the full data requires a subscription.
5. **Business models lean toward selling.** SuppCo has "Shop" buttons (a reviewer infers affiliate revenue). Quiz-to-subscription brands sell the pills they recommend (Care/of shut down in 2024). Our no-commerce stance (D-003) is a real difference.

**So what:** we should **lead with "Do you actually need this?" and evidence transparency**, and treat the stack check and schedule as the hook that brings people in. See proposed decision D-018.

## Landscape

### 1. Drug-interaction checkers
| Product | What it does well | Gaps for our user | Business model |
|---|---|---|---|
| **Drugs.com** checker | Free. Checks drugs, food, alcohol, and some supplements (e.g. St. John's wort) in one list | The NHS Specialist Pharmacy Service notes its database extrapolates by therapeutic class, so supplement results need careful reading. No evidence grades, no "do you need it" | Ads |
| **Medscape** checker | Covers prescription and OTC drugs, herbals, and supplements | Aimed at clinicians, needs registration. Reviews report incomplete supplement coverage | Ads, professional audience |
| **WebMD** checker | Consumer-friendly, includes vitamins and foods | Thinner herb coverage | Ads |
| **Hello Pharmacist** | Free, no account. Pharmacist-reviewed. Uses Natural Medicines data plus **NIH DSLD product labels (136,000+ products)**, and checks every ingredient of a product against a drug | Drug↔supplement only. Expanded access is gated. No supplement↔supplement or upper-limit checks | Free (pharmacy brand) |

### 2. Evidence databases
| Product | What it does well | Gaps | Business model |
|---|---|---|---|
| **Examine** | Grades A–F *per supplement per outcome*. Interactions rated on **separate severity and evidence scales** (probable/possible/theoretical). Covers drug↔supplement and supplement↔supplement | Most data is paywalled. Organized by ingredient, not around *your stack*. No timing or schedule | Subscription (Examine+, Clinician edition) |
| **Natural Medicines (TRC)** | The professional standard. Interaction checker includes multi-ingredient products, rated major/moderate/minor | Institutional access only. Checker excludes supplement↔supplement pairs (they're in the monographs) | Institutional licence |
| **Government** (NIH ODS, NCCIH, MedlinePlus) | Authoritative and free | Static pages, one ingredient at a time | Public |

### 3. Supplement stack and scanner apps (the most crowded category, mostly launched 2024–26)
| Product | What it does well | Gaps | Business model |
|---|---|---|---|
| **Suvo** | **Closest to our Stack Check.** Barcode or label-photo scan, breaks products into compounds, normalizes doses across the stack, flags overlaps, interactions, timing conflicts, and upper limits. Morning/evening/meal slots with timing notes (iron vs calcium or coffee). Public source library (NIH ODS, Cochrane, DrugBank, DailyMed, MedlinePlus). Reminders and refill tracking | No drug↔supplement coverage or food/lifestyle alternatives found on its site. Evidence strength isn't shown as a grade | Free, no ads, no paywall (as of Nov 2026) |
| **Nutrient Wise** | Label scan with an A–E **product** grade (ingredients, doses, additives). Stack Checker against saved medications. Adds FDA adverse-event data | Grades judge *product quality*, not whether the supplement works for your goal. Mostly vendor claims | Freemium: 5 scans/month free, about $3.99/month |
| **SuppCo** | Large product database, "TrustScore" product ratings, 80+ expert protocols for 15 goals, scheduling and reminders. VC-backed with a high media profile | "Shop" buttons (reviewer infers affiliate revenue). Protocols push *adding* supplements toward goals | Free plus Pro ($39.99–$59.99), possible affiliate revenue |
| **StackSnap**, **SuppTrack**, others | Label scanning, drug checks via RxNav | Many small, recent apps. Quality unknown | Mostly freemium |

### 4. Medication reminder apps
| Product | What it does well | Gaps | Business model |
|---|---|---|---|
| **Medisafe** | Mature reminder app with flexible dosing schedules and refill alerts. Flags interactions between meds, vitamins, and supplements | Interaction depth for supplements unclear. No evidence or "do you need it" layer | Freemium plus pharma partnerships |

### 5. Personalized and food-first
| Product | What it does well | Gaps | Business model |
|---|---|---|---|
| **Care/of** (closed) | Pioneered the quiz → personalized pack model | **Shut down June 2024** under Bayer. The recommendation *was* the product | Subscription pills |
| **Persona, Ritual,** etc. | Quiz-based personalization | Same conflict of interest | Subscription pills |
| **Vitaminico** | "Food-first, supplements-second" AI coach. "We don't sell you supplements" | AI-generated guidance with no visible evidence grading. No stack or interaction check | App subscription |
| **Atlix** | Uses Apple Health data to say which supplements you *don't* need ("stop wasting money") | Supplement-centric. Evidence basis not visible | App |

### 6. Nutrition trackers
| Product | What it does well | Gaps |
|---|---|---|
| **Cronometer** | Upper-limit thresholds by default, including the nuance that some ULs apply only to supplement or synthetic forms. Food plus supplement totals | Users report weak "too much" tracking. No interactions, timing, or evidence |

## Our bets vs. the market

| Our bet | Market status | Verdict |
|---|---|---|
| Stack check: overlaps and upper limits | Suvo, Cronometer (partly), Nutrient Wise | 🟠 **Expected.** We must do it well, but it won't set us apart |
| Supplement↔supplement **and** supplement↔drug in one view | Split across tools. Suvo mostly supplement↔supplement, Hello Pharmacist and Natural Medicines drug↔supplement only | 🟢 **Some room**, especially for the "medicated adult" persona |
| Daily schedule (D-013) | Suvo does time slots with timing notes. Medisafe does reminders | 🟠 **Expected.** Our edge is *explaining why* each separation exists and including medications in the schedule |
| Label scan / barcode (D-017) | Common: Suvo, Nutrient Wise, SuppCo, StackSnap | 🟠 **Expected**, and **proven doable**. Consider moving photo scan from fast follow into the MVP |
| Visible evidence grades per claim | Examine (paywalled). Nutrient Wise grades products, not evidence | 🟢 **Room** for a *free*, consumer-facing version |
| Lifestyle-first: "food or a habit covers this" | Vitaminico (AI, no grades), Atlix (supplement-centric) | 🟢 **Clearest white space**, especially combined with the stack check and grades |
| No commerce (D-003) | SuppCo (likely affiliate), pill subscriptions | 🟢 **A real difference.** Suvo is also free and unbranded, so it's not unique on its own |

## Ideas to borrow
1. **Public source library page** (Suvo). Publish `data/sources.yaml` as a browsable page, so anyone can trace every flag to its source. Cheap, and it builds trust.
2. **Consumer-friendly words for interaction evidence** (Examine). "Probable / possible / theoretical" reads better than A–D for interactions. Consider showing words in the UI and keeping letter grades in the data.
3. **Check every ingredient of a DSLD product** (Hello Pharmacist). This confirms that the NIH DSLD works for product lookup at scale (136k+ products), which supports D-017.
4. **Money framing** (Atlix). "Stop wasting money" is a sharper hook than "simplify your stack." Show **estimated monthly savings** next to "you probably don't need this." Also a strong north-star companion metric.
5. **Export the schedule to reminders or calendar** (Medisafe, Suvo). Cheap to add, and it avoids building a full reminder app.

## Threats and open questions
- **Suvo could add our features** (evidence grades, food swaps). Speed and editorial quality (credentialed review) are the defence, along with the clinician-ready summary.
- **SuppCo has funding and doctors backing it.** If it adds a "you don't need this" mode, the white space shrinks. It's unlikely while it earns money from products.
- **Accuracy is unproven everywhere.** No independent evaluations found for any scanner app. A published accuracy benchmark (our 20-label spike plus the synthetic fixtures) could itself be a differentiator.

## Next steps
- [ ] **Hands-on test (≈30 min, human):** enter Maya's stack (FX-001) into Suvo, Nutrient Wise, Drugs.com, and Hello Pharmacist. Screenshot the results into `design/competitors/`, and note which flags each one catches or misses (zinc above the UL, zinc + iron, magnesium above the UL).
- [ ] Same for Priya's stack (FX-003: St. John's wort + SSRI + thyroid + iron/calcium). It's the hardest test for drug coverage.
- [ ] Decide on D-018 (positioning) and whether photo scan moves into the MVP.

## Sources
- Drugs.com interaction checker: https://www.drugs.com/drug-interactions/
- NHS SPS, herbal interactions resources: https://www.sps.nhs.uk/articles/herbal-interactions-resources-to-support-answering-questions/
- Medscape help, interaction check: https://help.medscape.com/hc/en-us/articles/5019895680269-How-can-I-run-a-drug-interaction-check
- WebMD interaction checker: https://webmd.com/interaction-checker/
- Hello Pharmacist drug–supplement checker: https://hellopharmacist.com/drug-supplement-interactions
- Examine Clinician: https://examine.com/clinician/ · Examine+: https://examine.com/plus/ · Safety database preview: https://examine.com/articles/sneak-peek-examine-safety-database/
- Natural Medicines interaction checker FAQ: https://naturalmedicines.therapeuticresearch.com/news/news-items/2023/april/interaction-checker-faqs-on-ratings-and-updates.aspx
- Suvo: https://getsuvo.com/ · About: https://getsuvo.com/about.html · Sources: https://getsuvo.com/sources/ · Google Play: https://play.google.com/store/apps/details?id=com.suvo.mobile&hl=en
- Nutrient Wise: https://nutrient-wise.com/ · Label scanner: https://nutrient-wise.com/supplement-label-scanner · vs SuppCo: https://nutrient-wise.com/nutrientwise-vs-suppco · Google Play: https://play.google.com/store/apps/details?id=com.nutrientwise.app&hl=en_US
- SuppCo App Store: https://apps.apple.com/us/app/suppco/id6504838951 · Launch press release: https://businesswire.com/news/home/20250408358324/en/ · NutraIngredients: https://www.nutraingredients-usa.com/Article/2025/06/02/celebrity-doctors-back-tracker-to-increase-trust-in-supplements · Screens Design review: https://screensdesign.com/showcase/suppco-supplement-scanner
- StackSnap: https://apps.apple.com/app/id6761888709
- Medisafe: https://medisafe.com/download · AppleInsider: https://appleinsider.com/articles/18/10/10/medisafe-integration-with-apples-health-records-brings-easy-medication-management-to-ios · GoodRx: https://www.goodrx.com/healthcare-access/digital-health/medication-reminder-apps
- Care/of closure: https://www.retaildive.com/news/careof-is-shutting-down/719106 · https://www.nutraingredients.com/Article/2024/06/07/Care-of-to-close-operations/
- Vitaminico: https://apps.apple.com/vu/app/id6764385069 · Atlix: https://apps.apple.com/ca/app/atlix/id6744338349
- Cronometer DRIs: https://support.cronometer.com/hc/en-us/articles/47319970184468-Dietary-Reference-Intakes-DRIs
