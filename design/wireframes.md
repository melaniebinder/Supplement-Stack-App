# Wireframes (low-fi)

Text wireframes for the v1 single-page flow. All data is synthetic. Values are illustrative and must come from the reviewed knowledge base in a real build. Flow decisions: D-013 to D-017 in [`docs/decisions.md`](../docs/decisions.md).

## 1. Input: one page, three sections

```
┌──────────────────────────────────────────────────┐
│  Check your stack                                │
│  ⓘ Not medical advice. No account needed.        │
│                                                  │
│  ① YOUR SUPPLEMENTS                              │
│  ┌────────────────────────────────────────────┐  │
│  │ 🔍 Search supplements…          [📷 Scan]  │  │
│  └────────────────────────────────────────────┘  │
│  [+ Add a multivitamin]                          │
│                                                  │
│  • Vitamin D3 · 2000 IU/day        Why? (sleep ▾)│
│  • Zinc · 50 mg/day                Why? (immunity)│
│  • Melatonin · 5 mg               Why? (sleep)   │
│  • Women's multivitamin · 20 ingredients  [edit] │
│                                                  │
│  ② YOUR MEDICATIONS                              │
│  Medications can interact with supplements.      │
│  Don't forget birth control, thyroid meds, and   │
│  acid reducers.                                  │
│  [+ Add medication ▾]                            │
│  • Thyroid medication (levothyroxine)        ✕   │
│  ☐ I don't take any medications                  │
│                                                  │
│  ③ ABOUT YOU (optional)                          │
│  Age [30–49 ▾]  Sex [F ▾]                        │
│  ☐ Pregnant/breastfeeding ☐ Kidney/liver disease │
│                                                  │
│            [ Check my stack ]                    │
│  (disabled until ② has a medication or ☑ none)   │
└──────────────────────────────────────────────────┘
```

## 2. Add a multivitamin (MVP: photo scan, search, or template; D-020)

```
┌──────────────────────────────────────────────────┐
│  Add a multivitamin                              │
│                                                  │
│  🔍 Search by name or scan barcode   [|||| scan]│
│     (from the NIH Dietary Supplement Label DB)  │
│                                                  │
│  — or start from a typical one —                 │
│  ( ) Women's multi  ( ) Men's multi  ( ) 50+     │
│                                                  │
│  — or —                                          │
│  [📷 Photograph the Supplement Facts panel]       │
└──────────────────────────────────────────────────┘
```

**Review screen** (after search, template, or scan; the user must confirm):

```
┌──────────────────────────────────────────────────┐
│  Check what we found                             │
│  Serving: 2 gummies · Servings per day: [1 ▾]    │
│                                                  │
│  ✓ Vitamin A   900 mcg RAE (50% beta-carotene)   │
│  ✓ Vitamin D   25 mcg                            │
│  ✓ Zinc        8 mg                              │
│  ✓ Iron        18 mg                             │
│  …                                               │
│  ⚠ Not checked: Lutein 250 mcg, "Energy Blend"   │
│    120 mg (proprietary blend: amounts not listed)│
│                                                  │
│  Tap any value to fix it.   [ Looks right ✓ ]    │
└──────────────────────────────────────────────────┘
```

## 3. Results: grouped by what to do

```
┌──────────────────────────────────────────────────┐
│  Your stack: 4 products, 1 medication            │
│                                                  │
│  🔴 TALK TO A PHARMACIST FIRST                    │
│  (none)                                          │
│                                                  │
│  🕐 YOUR DAILY SCHEDULE                           │
│  Wake       Thyroid medication (empty stomach)   │
│  Breakfast  Vitamin D                            │
│  Lunch      Multivitamin (has iron)              │
│             ↳ 4h+ after thyroid med: iron blocks │
│               its absorption                     │
│  Dinner     Zinc                                 │
│             ↳ away from the multi's iron         │
│  Bedtime    Melatonin                            │
│  [ Print for my pharmacist ] [ Add to calendar ] │
│                                                  │
│  📉 YOU'RE GETTING TOO MUCH                       │
│  Zinc: 58 mg/day from 2 products.                │
│  The adult upper limit is 40 mg. Long-term this  │
│  can drain your copper.    Evidence: strong (A) ›│
│                                                  │
│  🌱 YOU PROBABLY DON'T NEED THIS  · save ~$14/mo │
│  Zinc (standalone)                               │
│   Your multi already covers your daily 8 mg.     │
│   Food covers it too: 3 oz beef + a handful of   │
│   pumpkin seeds.                                 │
│  Melatonin for sleep                             │
│   It's not doing much for ongoing sleep problems │
│   (weak evidence). Stronger: fixed wake time +   │
│   morning daylight (strong evidence) ›           │
│                                                  │
│  ✅ CHECKED, NO ISSUES                            │
│  Vitamin D · 17 other multivitamin ingredients   │
│                                                  │
│  ⓘ Not medical advice. Don't stop a medication   │
│    or supplement without talking to a clinician. │
└──────────────────────────────────────────────────┘
```
