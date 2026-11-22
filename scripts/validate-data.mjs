#!/usr/bin/env node
// Validates the knowledge base in data/ against the evidence model (docs/evidence-model.md).
// Errors (exit 1): broken references, missing sources, invalid enums, rule violations.
// Warnings: unverified citations, draft/unreviewed records (expected while the dataset is in draft).
// --strict: also treat any record that isn't publishable (unverified source or no reviewer) as an error.

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "data");
const STRICT = process.argv.includes("--strict");

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

const load = (rel) => yaml.load(fs.readFileSync(path.join(ROOT, rel), "utf8"));

const ENUM = {
  grade: ["A", "B", "C", "D"],
  direction: ["benefit", "no_effect", "harm", "mixed"],
  severity: ["major", "moderate", "minor", "info"],
  effect: ["increases_risk", "reduces_effect", "reduces_absorption", "enhances_absorption", "lowers_nutrient", "duplicate_therapy"],
  status: ["draft", "in_review", "published", "retired"],
  noteLevel: ["warning", "caution", "info"],
  ingredientType: ["vitamin", "mineral", "fatty_acid", "botanical", "probiotic", "hormone", "fiber", "other"],
  sourceType: ["ods", "nccih", "livertox", "guideline", "regulatory", "rct", "systematic_review", "observational", "other"],
};
const checkEnum = (where, field, value, list) => {
  if (!list.includes(value)) err(where, `${field} "${value}" is not one of ${list.join("|")}`);
};

// ---------- Sources ----------
const sources = new Map();
for (const s of load("sources.yaml").sources) {
  if (sources.has(s.id)) err(`source ${s.id}`, "duplicate id");
  checkEnum(`source ${s.id}`, "type", s.type, ENUM.sourceType);
  if (!s.title) err(`source ${s.id}`, "missing title");
  if (typeof s.verified !== "boolean") err(`source ${s.id}`, "verified must be true/false");
  if (s.verified && !s.accessed_at) err(`source ${s.id}`, "verified sources need accessed_at");
  if (!s.url && !s.doi && !s.citation && !s.publisher) err(`source ${s.id}`, "needs at least one of url, doi, citation, publisher");
  sources.set(s.id, s);
}
const usedSources = new Set();
const checkSources = (where, ids, { required = true } = {}) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    if (required) err(where, "no source, no claim: at least one source is required");
    return [];
  }
  for (const id of ids) {
    if (!sources.has(id)) err(where, `unknown source "${id}"`);
    usedSources.add(id);
  }
  return ids;
};
const checkPublishable = (where, rec, sourceIds) => {
  if (rec.status === "published" || STRICT) {
    if (!rec.reviewed_by) err(where, "published records need reviewed_by");
    const unverified = sourceIds.filter((id) => sources.get(id) && !sources.get(id).verified);
    if (unverified.length) err(where, `cites unverified sources: ${unverified.join(", ")}`);
  }
};

// ---------- Drug classes ----------
const drugClasses = new Set();
for (const d of load("drug-classes.yaml").drug_classes) {
  if (drugClasses.has(d.id)) err(`drug_class ${d.id}`, "duplicate id");
  if (!d.examples?.length) err(`drug_class ${d.id}`, "needs example drugs");
  drugClasses.add(d.id);
}

// ---------- Effect groups ----------
const groups = new Map();
for (const g of load("effect-groups.yaml").effect_groups) {
  const where = `effect_group ${g.id}`;
  if (groups.has(g.id)) err(where, "duplicate id");
  checkSources(where, g.sources);
  for (const [i, r] of (g.rules ?? []).entries()) {
    checkEnum(`${where} rule ${i}`, "severity", r.severity, ENUM.severity);
    checkEnum(`${where} rule ${i}`, "evidence_grade", r.evidence_grade, ENUM.grade);
    if (!r.recommendation) err(`${where} rule ${i}`, "missing recommendation");
    for (const dc of r.when?.member_plus_drug_class ?? []) if (!drugClasses.has(dc)) err(`${where} rule ${i}`, `unknown drug class "${dc}"`);
  }
  checkEnum(where, "status", g.status, ENUM.status);
  checkPublishable(where, g, g.sources ?? []);
  groups.set(g.id, { ...g, members: [] });
}

// ---------- Ingredients ----------
const ingredients = new Map();
const claimIds = new Set();
const ingDir = path.join(ROOT, "ingredients");
for (const file of fs.readdirSync(ingDir).filter((f) => f.endsWith(".yaml")).sort()) {
  const ing = yaml.load(fs.readFileSync(path.join(ingDir, file), "utf8"));
  const where = `ingredient ${ing.id ?? file}`;
  if (`${ing.id}.yaml` !== file) err(where, `file name ${file} must match id`);
  if (ingredients.has(ing.id)) err(where, "duplicate id");
  for (const f of ["name", "type", "synonyms", "status"]) if (ing[f] === undefined) err(where, `missing ${f}`);
  checkEnum(where, "type", ing.type, ENUM.ingredientType);
  checkEnum(where, "status", ing.status, ENUM.status);
  if (typeof ing.recommendable !== "boolean") err(where, "recommendable must be true/false");

  const allSourceIds = [...checkSources(`${where} (reference data)`, ing.sources)];

  const ul = ing.reference_intakes?.ul;
  if (ul && (typeof ul.amount !== "number" || !ul.unit || !ul.applies_to)) err(where, "ul needs numeric amount, unit, applies_to");

  for (const eg of ing.effect_groups ?? []) {
    const gid = typeof eg === "string" ? eg : eg.id;
    if (!groups.has(gid)) err(where, `unknown effect group "${gid}"`);
    else groups.get(gid).members.push(ing.id);
  }

  for (const c of ing.claims ?? []) {
    const cw = `${where} claim ${c.id}`;
    if (claimIds.has(c.id)) err(cw, "duplicate claim id");
    claimIds.add(c.id);
    for (const f of ["outcome", "population", "summary"]) if (!c[f]) err(cw, `missing ${f}`);
    checkEnum(cw, "direction", c.direction, ENUM.direction);
    checkEnum(cw, "evidence_grade", c.evidence_grade, ENUM.grade);
    allSourceIds.push(...checkSources(cw, c.sources));
  }
  for (const [i, n] of (ing.safety_notes ?? []).entries()) {
    checkEnum(`${where} safety_note ${i}`, "level", n.level, ENUM.noteLevel);
    allSourceIds.push(...checkSources(`${where} safety_note ${i}`, n.sources));
  }

  // Product invariant: only A/B evidence of benefit can make something recommendable (docs/prd.md).
  if (ing.recommendable) {
    const strong = (ing.claims ?? []).some((c) => c.direction === "benefit" && ["A", "B"].includes(c.evidence_grade));
    if (!strong) err(where, "recommendable: true requires at least one benefit claim graded A or B");
    if (!ing.recommend_only_if) err(where, "recommendable: true requires recommend_only_if (lifestyle-first condition)");
  } else if (!ing.recommendable_note) {
    err(where, "recommendable: false requires recommendable_note explaining why");
  }
  checkPublishable(where, ing, allSourceIds);
  ingredients.set(ing.id, ing);
}

for (const g of groups.values()) {
  const needsTwo = (g.rules ?? []).some((r) => r.when?.min_members);
  if (needsTwo && g.members.length < 2) err(`effect_group ${g.id}`, `has a min_members rule but only ${g.members.length} member(s)`);
}

// ---------- Interactions ----------
const interactionIds = new Set();
const pairs = new Map();
const resolveRef = (where, ref) => {
  const [kind, id] = String(ref).split("/");
  if (kind === "ingredient" ? !ingredients.has(id) : kind === "drug_class" ? !drugClasses.has(id) : true)
    err(where, `unresolved reference "${ref}"`);
};
for (const x of load("interactions.yaml").interactions) {
  const where = `interaction ${x.id}`;
  if (interactionIds.has(x.id)) err(where, "duplicate id");
  interactionIds.add(x.id);
  resolveRef(where, x.a);
  resolveRef(where, x.b);
  const key = [x.a, x.b].sort().join(" + ");
  if (pairs.has(key)) err(where, `duplicate pair (also ${pairs.get(key)})`);
  pairs.set(key, x.id);
  checkEnum(where, "severity", x.severity, ENUM.severity);
  checkEnum(where, "effect", x.effect, ENUM.effect);
  checkEnum(where, "evidence_grade", x.evidence_grade, ENUM.grade);
  checkEnum(where, "status", x.status, ENUM.status);
  for (const f of ["mechanism", "recommendation"]) if (!x[f]) err(where, `missing ${f}`);
  if (String(x.b).startsWith("drug_class/") || String(x.a).startsWith("drug_class/")) {
    if (["major", "moderate"].includes(x.severity) && !/pharmacist|prescriber|care team|clinician|doctor/i.test(x.recommendation))
      err(where, "supplement–drug flags must route to a pharmacist/prescriber (D-006)");
  }
  checkPublishable(where, x, checkSources(where, x.sources));
}

// ---------- Fixtures ----------
const fxFile = path.join(ROOT, "fixtures", "synthetic-stacks.yaml");
let fixtureCount = 0;
if (fs.existsSync(fxFile)) {
  for (const fx of yaml.load(fs.readFileSync(fxFile, "utf8")).fixtures) {
    fixtureCount++;
    const where = `fixture ${fx.id}`;
    for (const dc of fx.drug_classes ?? []) if (!drugClasses.has(dc)) err(where, `unknown drug class "${dc}"`);
    for (const p of fx.products ?? [])
      for (const i of p.ingredients ?? []) if (!ingredients.has(i.ingredient)) err(where, `unknown ingredient "${i.ingredient}"`);
    const e = fx.expected ?? {};
    for (const id of [...(e.interactions ?? []), ...(e.suppressed_within_product ?? [])])
      if (!interactionIds.has(id)) err(where, `unknown interaction "${id}"`);
    for (const gf of e.group_flags ?? []) if (!groups.has(gf.group)) err(where, `unknown effect group "${gf.group}"`);
  }
}

// ---------- Report ----------
const unverified = [...sources.values()].filter((s) => !s.verified).length;
const unused = [...sources.keys()].filter((id) => !usedSources.has(id));
if (unused.length) warnings.push(`sources not cited anywhere: ${unused.join(", ")}`);
if (unverified) warnings.push(`${unverified}/${sources.size} sources not yet verified against the live source`);
const drafts = [...ingredients.values()].filter((i) => i.status !== "published").length;
if (drafts) warnings.push(`${drafts}/${ingredients.size} ingredients are not published (need credentialed review)`);

const allClaims = [...ingredients.values()].flatMap((i) => i.claims ?? []);
const byGrade = Object.fromEntries(ENUM.grade.map((g) => [g, allClaims.filter((c) => c.evidence_grade === g).length]));

console.log("Knowledge base summary");
console.log(`  ingredients:   ${ingredients.size} (${[...ingredients.values()].filter((i) => i.recommendable).length} recommendable)`);
console.log(`  claims:        ${allClaims.length}  (A:${byGrade.A} B:${byGrade.B} C:${byGrade.C} D:${byGrade.D})`);
console.log(`  interactions:  ${interactionIds.size}`);
console.log(`  effect groups: ${groups.size}`);
console.log(`  drug classes:  ${drugClasses.size}`);
console.log(`  sources:       ${sources.size}`);
console.log(`  fixtures:      ${fixtureCount}`);
for (const w of warnings) console.log(`⚠  ${w}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\n✓ valid${STRICT ? " (strict)" : ""}`);
