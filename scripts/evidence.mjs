#!/usr/bin/env node
// Evidence store tooling. See data/evidence/README.md.
//
//   node scripts/evidence.mjs fetch [source-id ...]   fetch sources, store text, record fingerprint (needs network)
//   node scripts/evidence.mjs verify                  check every stored quote appears in its source text (offline
//                                                     for public-domain text in the repo; fetches excerpt-only
//                                                     sources into a local cache if missing)
//
// Behind a proxy on Node >= 22.21 run with NODE_USE_ENV_PROXY=1.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import yaml from "js-yaml";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const EV_DIR = path.join(ROOT, "data", "evidence", "sources");
const TEXT_DIR = path.join(ROOT, "data", "evidence", "text"); // public-domain text, committed
const CACHE_DIR = path.join(ROOT, ".cache", "evidence"); // excerpt-only (copyrighted) text, gitignored
const UA = "supplement-stack-app evidence fetcher (research; non-commercial)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- text helpers ----------
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", deg: "°", micro: "µ", plusmn: "±", ge: "≥", le: "≤", times: "×" };
export const decode = (s) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
   .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
   .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
const stripTags = (html) =>
  decode(html.replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
             .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|td|th|section|paragraph|title)>/gi, "\n")
             .replace(/<[^>]+>/g, " "))
    .replace(/[ \t\r\f\v]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
// Normalization used for quote matching: case-, whitespace-, quote- and dash-insensitive.
export const norm = (s) =>
  s.normalize("NFKC").replace(/[‘’ʼ′]/g, "'").replace(/[“”″]/g, '"').replace(/[‐‑‒–—−]/g, "-")
   .replace(/\s+/g, " ").trim().toLowerCase();
const sha256 = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");

// ---------- retrievers ----------
async function get(url, accept) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const r = await fetch(url, { headers: { "User-Agent": UA, ...(accept ? { Accept: accept } : {}) } });
    if (r.ok) return r.text();
    if (r.status === 429 || r.status >= 500) { await sleep(1000 * 2 ** attempt); continue; }
    throw new Error(`${r.status} for ${url}`);
  }
  throw new Error(`gave up on ${url}`);
}
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
const RETRIEVERS = {
  async pubmed({ pmid }) {
    const url = `${EUTILS}efetch.fcgi?db=pubmed&retmode=xml&id=${pmid}`;
    const xml = await get(url);
    const pick = (re) => (xml.match(re) || [])[1];
    const title = stripTags(pick(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/) || "");
    const parts = [...xml.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g)].map(([, attrs, body]) => {
      const label = (attrs.match(/Label="([^"]+)"/) || [])[1];
      return (label ? label + ": " : "") + stripTags(body);
    });
    const meta = {
      title,
      journal: stripTags(pick(/<Title>([\s\S]*?)<\/Title>/) || ""),
      year: pick(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/) || pick(/<MedlineDate>(\d{4})/) || null,
      doi: pick(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/) || null,
      pmid: String(pmid),
    };
    return { url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`, text: `${title}\n\n${parts.join("\n\n")}`, meta };
  },
  async pmc({ pmcid }) {
    const url = `${EUTILS}efetch.fcgi?db=pmc&id=${pmcid.replace(/^PMC/, "")}`;
    const xml = await get(url);
    const title = stripTags((xml.match(/<article-title[^>]*>([\s\S]*?)<\/article-title>/) || [])[1] || "");
    const body = stripTags((xml.match(/<abstract[\s\S]*?<\/abstract>/) || [""])[0] + "\n\n" + ((xml.match(/<body>([\s\S]*?)<\/body>/) || [])[1] || ""));
    return { url: `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`, text: `${title}\n\n${body}`, meta: { title, pmcid } };
  },
  async dailymed({ setid }) {
    const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${setid}.xml`;
    const xml = await get(url);
    const title = stripTags((xml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
    const version = (xml.match(/<versionNumber value="(\d+)"/) || [])[1] || null;
    const effective = (xml.match(/<effectiveTime value="(\d{8})/) || [])[1] || null;
    return { url: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setid}`, text: stripTags(xml), meta: { title, setid, label_version: version, label_effective: effective } };
  },
  async html({ url }) {
    const html = await get(url, "text/html");
    const title = stripTags((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "");
    const main = (html.match(/<main[\s\S]*?<\/main>/i) || [html])[0];
    return { url, text: stripTags(main), meta: { title } };
  },
};

// ---------- store ----------
const loadEvidence = () =>
  fs.existsSync(EV_DIR)
    ? fs.readdirSync(EV_DIR).filter((f) => f.endsWith(".yaml")).sort()
        .map((f) => ({ file: path.join(EV_DIR, f), doc: yaml.load(fs.readFileSync(path.join(EV_DIR, f), "utf8")) }))
    : [];
const textPath = (doc) => path.join(doc.license === "public_domain" ? TEXT_DIR : CACHE_DIR, `${doc.source_id}.txt`);
const dump = (doc) => yaml.dump(doc, { lineWidth: 120, quotingType: '"', noRefs: true });

async function fetchOne(entry) {
  const { doc } = entry;
  const r = RETRIEVERS[doc.retrieve?.method];
  if (!r) throw new Error(`${doc.source_id}: unknown retrieve.method ${doc.retrieve?.method}`);
  const got = await r(doc.retrieve);
  if (!got.text || got.text.length < 80) throw new Error(`${doc.source_id}: retrieved text is empty or too short`);
  const tp = textPath(doc);
  fs.mkdirSync(path.dirname(tp), { recursive: true });
  fs.writeFileSync(tp, got.text + "\n");
  doc.retrieved = { at: new Date().toISOString().slice(0, 10), url: got.url, sha256: sha256(got.text), ...got.meta };
  fs.writeFileSync(entry.file, dump(doc));
  return got.text;
}

function verifyQuotes(doc, text) {
  const hay = norm(text);
  return (doc.excerpts ?? []).filter((e) => !hay.includes(norm(e.quote))).map((e) => e.quote);
}

const [cmd, ...ids] = process.argv.slice(2);
const entries = loadEvidence().filter((e) => !ids.length || ids.includes(e.doc.source_id));
let failures = 0;
if (cmd === "fetch") {
  for (const e of entries) {
    try {
      const text = await fetchOne(e);
      const missing = verifyQuotes(e.doc, text);
      console.log(`${missing.length ? "✗" : "✓"} ${e.doc.source_id} (${text.length} chars)${missing.length ? `: ${missing.length} quote(s) not found` : ""}`);
      for (const m of missing) console.log(`    not found: "${m.slice(0, 100)}"`);
      failures += missing.length;
    } catch (err) {
      console.log(`✗ ${e.doc.source_id}: ${err.message}`);
      failures++;
    }
    await sleep(350);
  }
} else if (cmd === "verify") {
  for (const e of entries) {
    const tp = textPath(e.doc);
    let text;
    if (fs.existsSync(tp)) text = fs.readFileSync(tp, "utf8");
    else {
      try { text = await fetchOne(e); } catch (err) { console.log(`✗ ${e.doc.source_id}: ${err.message}`); failures++; continue; }
    }
    if (e.doc.retrieved?.sha256 && sha256(text.replace(/\n$/, "")) !== e.doc.retrieved.sha256)
      console.log(`⚠ ${e.doc.source_id}: source text changed since it was recorded (re-review the excerpts)`);
    const missing = verifyQuotes(e.doc, text);
    if (missing.length) { failures += missing.length; for (const m of missing) console.log(`✗ ${e.doc.source_id}: quote not found: "${m.slice(0, 100)}"`); }
  }
  console.log(failures ? `\n✗ ${failures} problem(s)` : `✓ all quotes found in ${entries.length} sources`);
} else {
  console.log("usage: evidence.mjs fetch|verify [source-id ...]");
  process.exit(2);
}
process.exit(failures ? 1 : 0);
