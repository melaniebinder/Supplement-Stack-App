import { useState } from "react";
import { kb } from "../kb";

/** Shows the verified quotes behind a record (claim, interaction, habit, group) with links to the source. */
export function Evidence({ record, label }: { record: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const excerpts = kb.evidence[record] ?? [];
  if (!excerpts.length) return <span className="evidence-none">Source not yet verified</span>;
  const bySource = new Map<string, typeof excerpts>();
  for (const e of excerpts) bySource.set(e.source, [...(bySource.get(e.source) ?? []), e]);
  return (
    <div className="evidence">
      <button className="link" onClick={() => setOpen(!open)} aria-expanded={open}>
        {label ? `${label} · ` : ""}{bySource.size} verified source{bySource.size > 1 ? "s" : ""} {open ? "▴" : "▾"}
      </button>
      {open && (
        <ul className="quotes">
          {[...bySource].map(([sid, list]) => {
            const s = kb.sources[sid];
            return (
              <li key={sid}>
                {list.map((e, i) => <blockquote key={i}>“{e.quote}”<span className="locator"> · {e.locator}</span></blockquote>)}
                <div className="cite">
                  {s?.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s?.title}
                  {s?.citation ? <span> · {s.citation}</span> : null}
                  {s?.retrieved_at ? <span className="muted"> · checked {s.retrieved_at}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
