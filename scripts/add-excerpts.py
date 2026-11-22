#!/usr/bin/env python3
"""Append excerpts to evidence files: python3 scripts/add-excerpts.py <json-file>
JSON: {"source-id": [{"supports": [...], "quote": "...", "locator": "..."}]}. Skips duplicate quotes."""
import json, sys, yaml, os
ROOT = os.path.join(os.path.dirname(__file__), "..", "data", "evidence", "sources")
data = json.load(open(sys.argv[1]))
for sid, exs in data.items():
    p = os.path.join(ROOT, f"{sid}.yaml")
    doc = yaml.safe_load(open(p))
    have = {e["quote"] for e in doc.get("excerpts") or []}
    doc.setdefault("excerpts", [])
    doc["excerpts"] = [e for e in doc["excerpts"] or []]
    for e in exs:
        if e["quote"] not in have:
            doc["excerpts"].append({"supports": e["supports"], "quote": e["quote"], "locator": e.get("locator", "Abstract")})
    yaml.safe_dump(doc, open(p, "w"), sort_keys=False, allow_unicode=True, width=120)
    print(sid, len(doc["excerpts"]))
