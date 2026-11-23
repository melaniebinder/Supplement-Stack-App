# src: the prototype

A static single-page app (Vite + React + TypeScript), deployed to GitHub Pages. No backend, no accounts. The stack is kept in the browser (D-009).

| Path | What it is |
|---|---|
| `engine/` | The stack-check engine: pure TypeScript, no UI. `check(kb, input)` returns pharmacist flags, timing flags, upper-limit totals, overlaps, the daily schedule, and swaps |
| `engine/schedule.ts` | Daily schedule solver: places each product and timed medication in a slot so every "N hours apart" rule holds, choosing the most convenient valid arrangement (branch and bound) |
| `engine/check.test.ts` | Runs the three synthetic stacks in `data/fixtures/` against their hand-written expectations, plus guardrail tests |
| `ui/` | Form, results, evidence panel (shows the verified quotes behind every flag), calendar export |
| `generated/kb.json` | Built from `data/` by `scripts/build-kb.mjs`. Not committed |

```bash
npm install
npm run dev      # local dev server
npm test         # engine tests
npm run build    # validate types, build to dist/
```
