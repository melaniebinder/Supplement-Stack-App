#!/usr/bin/env node
// Compiles data/*.yaml and the evidence store into one JSON knowledge base for the app and tests.
//   node scripts/build-kb.mjs            → writes src/generated/kb.json
// Only verified evidence (quote, locator, source link) is bundled, never full source text.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const D = (p) => path.join(ROOT, "data", p);
const load = (p) => yaml.load(fs.readFileSync(D(p), "utf8"));

export function buildKb() {
  const ingredients = fs.readdirSync(D("ingredients")).filter((f) => f.endsWith(".yaml")).sort()
    .map((f) => load(path.join("ingredients", f)));
  const sources = Object.fromEntries(load("sources.yaml").sources.map((s) => [s.id, s]));

  const evidence = {}; // record id -> [{source, quote, locator}]
  const retrieved = {}; // source id -> {at, url, title}
  const evDir = D("evidence/sources");
  for (const f of fs.readdirSync(evDir).filter((x) => x.endsWith(".yaml"))) {
    const ev = yaml.load(fs.readFileSync(path.join(evDir, f), "utf8"));
    if (!ev.excerpts?.length) continue;
    retrieved[ev.source_id] = { at: ev.retrieved?.at, url: ev.retrieved?.url, title: ev.retrieved?.title };
    for (const e of ev.excerpts)
      for (const rid of e.supports) (evidence[rid] ??= []).push({ source: ev.source_id, quote: e.quote, locator: e.locator });
  }
  const sourceInfo = Object.fromEntries(
    Object.values(sources).map((s) => [s.id, {
      id: s.id, title: s.title, citation: s.citation ?? s.publisher ?? null, verified: !!s.verified,
      url: retrieved[s.id]?.url ?? s.url ?? (s.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}/` : s.doi ? `https://doi.org/${s.doi}` : null),
      retrieved_at: retrieved[s.id]?.at ?? null,
    }]),
  );

  return {
    built_at: new Date().toISOString().slice(0, 10),
    ingredients,
    interactions: load("interactions.yaml").interactions,
    effect_groups: load("effect-groups.yaml").effect_groups,
    drug_classes: load("drug-classes.yaml").drug_classes,
    lifestyle: load("lifestyle-alternatives.yaml"),
    templates: load("templates.yaml").templates,
    picklist: load("medication-picklist.yaml").picklist,
    sources: sourceInfo,
    evidence,
    examples: load("fixtures/synthetic-stacks.yaml").fixtures.map((f) => ({
      id: f.id, persona: f.persona, products: f.products, drug_classes: f.drug_classes, profile: f.profile,
    })),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const kb = buildKb();
  const out = path.join(ROOT, "src", "generated", "kb.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(kb));
  console.log(`kb.json: ${kb.ingredients.length} ingredients, ${kb.interactions.length} interactions, ${Object.keys(kb.evidence).length} evidenced records, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}
