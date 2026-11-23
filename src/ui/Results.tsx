import type { CheckResult, Flag, SwapOut } from "../engine/types";
import { kb } from "../kb";
import { Evidence } from "./Evidence";
import { CLAIM_GRADE, INTERACTION_GRADE, n } from "./format";
import { download, scheduleToIcs } from "./ics";

const SEV_LABEL = { major: "Major", moderate: "Moderate", minor: "Minor", info: "Note" } as const;

function FlagCard({ f }: { f: Flag }) {
  return (
    <article className={`flag sev-${f.severity}`}>
      <header>
        <span className={`badge sev-${f.severity}`}>{SEV_LABEL[f.severity]}</span>
        <h4>{f.title}</h4>
      </header>
      <p>{f.mechanism}</p>
      <p className="rec">→ {f.recommendation}</p>
      <Evidence record={f.record} label={`Evidence: ${INTERACTION_GRADE[f.evidence_grade]} (${f.evidence_grade})`} />
    </article>
  );
}

function SwapCard({ s }: { s: SwapOut }) {
  if (s.kind === "route") {
    return (
      <article className="swap route">
        <h4>{s.product}: do you need it?</h4>
        <p>{s.message}</p>
      </article>
    );
  }
  if (s.kind === "food") {
    return (
      <article className="swap">
        <h4>{s.product}: food can cover this</h4>
        {s.need != null && <p>Your daily need is about <strong>{n(s.need)} {s.unit}</strong>.{s.note ? ` ${s.note}` : ""}</p>}
        {s.need == null && s.note && <p>{s.note}</p>}
        <ul className="foods">{s.foods.slice(0, 5).map((f) => <li key={f.food}><span>{f.food}, {f.serving}</span><span className="muted">{n(f.amount)} {f.unit}</span></li>)}</ul>
        <p className="muted small">Food amounts are approximate and not yet verified against USDA FoodData Central.</p>
      </article>
    );
  }
  return (
    <article className="swap">
      <h4>{s.product} for {s.goalName.toLowerCase()}</h4>
      <p>
        {s.supplementGrade ? <>The evidence for this supplement for {s.goalName.toLowerCase()} is <strong>{CLAIM_GRADE[s.supplementGrade].toLowerCase()}</strong>.</> : <>Studies haven't shown a clear benefit of this supplement for {s.goalName.toLowerCase()}.</>}
        {" "}These address the same goal, with stronger evidence:
      </p>
      {s.note && <p className="muted small">{s.note}</p>}
      <ul className="habits">
        {s.habits.map((h) => (
          <li key={h.id}>
            <span className="grade">{h.evidence_grade}</span>
            <div>{h.text}<Evidence record={h.id} label={CLAIM_GRADE[h.evidence_grade]} /></div>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function Results({ r, onEdit }: { r: CheckResult; onEdit: () => void }) {
  const totalFlags = r.pharmacist.length + r.timing.length + r.other.length;
  return (
    <div className="results">
      <div className="results-head">
        <h2>Your results</h2>
        <div className="actions no-print">
          <button onClick={onEdit}>← Edit stack</button>
          <button onClick={() => window.print()}>Print for my pharmacist</button>
        </div>
      </div>
      <p className="summary">
        {r.pharmacist.length > 0 && <span className="pill red">{r.pharmacist.length} to discuss with a pharmacist</span>}
        {r.ul.length > 0 && <span className="pill amber">{r.ul.length} above the upper limit</span>}
        {r.swaps.filter((s) => s.kind !== "route").length > 0 && <span className="pill green">{r.swaps.filter((s) => s.kind !== "route").length} you may not need</span>}
        {totalFlags === 0 && r.ul.length === 0 && <span className="pill green">No interactions found</span>}
      </p>
      {r.notices.map((t) => <p key={t} className="notice">{t}</p>)}

      {r.pharmacist.length > 0 && (
        <section>
          <h3>🔴 Talk to a pharmacist first</h3>
          {r.pharmacist.map((f) => <FlagCard key={f.id} f={f} />)}
        </section>
      )}

      <section>
        <h3>🕐 Your daily schedule</h3>
        {r.schedule.entries.length > 0 ? (
          <ol className="schedule">
            {r.schedule.entries.map((e) => (
              <li key={e.slot}>
                <div className="time">{e.time}<span>{e.label}</span></div>
                <div>
                  {e.items.map((it) => (
                    <div key={it.name} className="sched-item">
                      <strong>{it.name}</strong>{it.kind === "drug" && <span className="tag">medication</span>}
                      {it.reasons.length > 0 && <ul className="reasons">{[...new Set(it.reasons)].map((x) => <li key={x}>{x}</li>)}</ul>}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        ) : <p className="muted">Nothing to schedule.</p>}
        {r.schedule.excluded.map((x) => <p key={x.name} className="notice">{x.reason}</p>)}
        {r.schedule.unresolved.length > 0 && <p className="notice">We couldn't fit every timing rule into one day: {r.schedule.unresolved.join("; ")}. Ask your pharmacist.</p>}
        {r.schedule.notes.length > 0 && <ul className="notes">{r.schedule.notes.map((x) => <li key={x}>{x}</li>)}</ul>}
        {r.timing.map((f) => <FlagCard key={f.id} f={f} />)}
        {r.schedule.entries.length > 0 && <button className="no-print" onClick={() => download("supplement-schedule.ics", scheduleToIcs(r.schedule))}>Add to calendar (.ics)</button>}
      </section>

      {(r.ul.length > 0 || r.overlaps.length > 0) && (
        <section>
          <h3>📉 You may be getting too much</h3>
          {r.ul.map((u) => (
            <article key={u.ingredient} className="flag sev-moderate">
              <header><span className="badge sev-moderate">Above limit</span><h4>{u.name}: {n(u.total)} {u.unit}/day</h4></header>
              <p>The adult upper limit is <strong>{n(u.ul)} {u.unit}</strong>{u.scope === "supplements_only" ? " from supplements" : u.scope === "preformed_only" ? " (preformed vitamin A)" : u.scope === "folic_acid_only" ? " of folic acid" : ""}. From: {u.products.join(", ")}.</p>
              {kb.ingredients.find((i) => i.id === u.ingredient)?.safety_notes.slice(0, 1).map((s) => <p key={s.text} className="muted">{s.text}</p>)}
              <Evidence record={u.record} />
            </article>
          ))}
          {r.overlaps.filter((o) => !r.ul.some((u) => u.ingredient === o.ingredient)).length > 0 && (
            <p className="muted">Also in more than one product: {r.overlaps.filter((o) => !r.ul.some((u) => u.ingredient === o.ingredient)).map((o) => `${o.name} (${o.products.join(", ")})`).join("; ")}.</p>
          )}
        </section>
      )}

      {r.swaps.some((s) => s.kind !== "route") && (
        <section>
          <h3>🌱 You probably don't need this {r.savings != null && <span className="pill green">save ~${n(r.savings)}/mo</span>}</h3>
          {r.swaps.filter((s) => s.kind !== "route").map((s, i) => <SwapCard key={i} s={s} />)}
        </section>
      )}
      {r.swaps.some((s) => s.kind === "route") && (
        <section>
          <h3>🩺 Check with a clinician</h3>
          {r.swaps.filter((s) => s.kind === "route").map((s, i) => <SwapCard key={i} s={s} />)}
        </section>
      )}

      {r.other.length > 0 && (
        <section>
          <h3>ℹ️ Worth knowing</h3>
          {r.other.map((f) => <FlagCard key={f.id} f={f} />)}
        </section>
      )}

      {(r.checked.length > 0 || r.suppressed.length > 0) && (
        <section>
          <h3>✅ Checked, no issues</h3>
          {r.checked.length > 0 && <p>{r.checked.join(" · ")}</p>}
          {r.suppressed.length > 0 && <p className="muted small">Not flagged because they're combined in the same product: {r.suppressed.map((f) => f.title).join("; ")}.</p>}
        </section>
      )}
      <p className="disclaimer">Not medical advice. Don't start, stop, or change a medication or supplement without talking to a clinician.</p>
    </div>
  );
}
