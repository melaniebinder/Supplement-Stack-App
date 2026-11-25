import type { ReactNode } from "react";
import type { CheckResult, Flag, SwapOut } from "../engine/types";
import { kb } from "../kb";
import { Evidence } from "./Evidence";
import { CLAIM_GRADE, INTERACTION_GRADE, n } from "./format";
import { download, scheduleToIcs } from "./ics";

const SEV_LABEL = { major: "Major", moderate: "Moderate", minor: "Minor", info: "Note" } as const;
type Tone = "risk" | "caution" | "positive" | "neutral";

function Section({ num, title, count, tone, aside, children }: { num: number; title: string; count?: number; tone: Tone; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="sec" data-tone={tone}>
      <div className="sec-head">
        <span className="sec-num">{String(num).padStart(2, "0")}</span>
        <h3>{title}</h3>
        {count != null && <span className="sec-count">{count}</span>}
        {aside && <span className="sec-aside">{aside}</span>}
      </div>
      <div className="sec-body">{children}</div>
    </section>
  );
}

function FlagRow({ f }: { f: Flag }) {
  return (
    <article className="item" data-sev={f.severity}>
      <div className="item-meta">
        <span className="sev">{SEV_LABEL[f.severity]}</span>
        <span className="grade-word">{INTERACTION_GRADE[f.evidence_grade]} · {f.evidence_grade}</span>
      </div>
      <div className="item-body">
        <h4>{f.title}</h4>
        <p>{f.mechanism}</p>
        <p className="rec">{f.recommendation}</p>
        <Evidence record={f.record} />
      </div>
    </article>
  );
}

function SwapRow({ s }: { s: SwapOut }) {
  if (s.kind === "route") {
    return (
      <article className="item">
        <div className="item-meta"><span className="sev">Check</span></div>
        <div className="item-body"><h4>{s.product}: do you need it?</h4><p>{s.message}</p></div>
      </article>
    );
  }
  if (s.kind === "food") {
    return (
      <article className="item">
        <div className="item-meta"><span className="sev">Food</span></div>
        <div className="item-body">
          <h4>{s.product}: food can cover this</h4>
          {s.need != null && <p>Your daily need is about <strong className="num">{n(s.need)} {s.unit}</strong>.{s.note ? ` ${s.note}` : ""}</p>}
          {s.need == null && s.note && <p>{s.note}</p>}
          <table className="data">
            <tbody>{s.foods.slice(0, 5).map((f) => <tr key={f.food}><td>{f.food}, {f.serving}</td><td className="num">{n(f.amount)} {f.unit}</td></tr>)}</tbody>
          </table>
          <p className="fine">Food amounts are approximate and not yet verified against USDA FoodData Central.</p>
        </div>
      </article>
    );
  }
  return (
    <article className="item">
      <div className="item-meta"><span className="sev">Habit</span>{s.supplementGrade && <span className="grade-word">Supplement · {s.supplementGrade}</span>}</div>
      <div className="item-body">
        <h4>{s.product} for {s.goalName.toLowerCase()}</h4>
        <p>
          {s.supplementGrade ? <>The evidence for this supplement for {s.goalName.toLowerCase()} is <strong>{CLAIM_GRADE[s.supplementGrade].toLowerCase()}</strong>.</> : <>Studies haven't shown a clear benefit of this supplement for {s.goalName.toLowerCase()}.</>}
          {" "}These address the same goal, with stronger evidence:
        </p>
        {s.note && <p className="fine">{s.note}</p>}
        <ul className="habits">
          {s.habits.map((h) => (
            <li key={h.id}>
              <span className="grade">{h.evidence_grade}</span>
              <div>{h.text}<Evidence record={h.id} label={CLAIM_GRADE[h.evidence_grade]} /></div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function Results({ r, onEdit }: { r: CheckResult; onEdit: () => void }) {
  const swaps = r.swaps.filter((s) => s.kind !== "route");
  const routes = r.swaps.filter((s) => s.kind === "route");
  let num = 0;
  const next = () => ++num;
  return (
    <div className="results">
      <div className="results-head">
        <h2>Your results</h2>
        <div className="actions no-print">
          <button className="ghost" onClick={onEdit}>Edit stack</button>
          <button className="ghost" onClick={() => window.print()}>Print for pharmacist</button>
        </div>
      </div>
      <dl className="stats">
        <div data-tone={r.pharmacist.length ? "risk" : "neutral"}><dt>Discuss with a pharmacist</dt><dd>{r.pharmacist.length}</dd></div>
        <div data-tone={r.ul.length ? "caution" : "neutral"}><dt>Above the upper limit</dt><dd>{r.ul.length}</dd></div>
        <div data-tone={swaps.length ? "positive" : "neutral"}><dt>You may not need</dt><dd>{swaps.length}</dd></div>
        <div data-tone="neutral"><dt>Est. monthly savings</dt><dd>{r.savings != null ? `$${n(r.savings)}` : "—"}</dd></div>
      </dl>
      {r.notices.map((t) => <p key={t} className="notice">{t}</p>)}

      {r.pharmacist.length > 0 && (
        <Section num={next()} title="Talk to a pharmacist first" count={r.pharmacist.length} tone="risk">
          {r.pharmacist.map((f) => <FlagRow key={f.id} f={f} />)}
        </Section>
      )}

      <Section num={next()} title="Your daily schedule" tone="neutral"
        aside={r.schedule.entries.length > 0 && <button className="link no-print" onClick={() => download("supplement-schedule.ics", scheduleToIcs(r.schedule))}>Add to calendar</button>}>
        {r.schedule.entries.length > 0 ? (
          <ol className="schedule">
            {r.schedule.entries.map((e) => (
              <li key={e.slot}>
                <div className="time"><span className="num">{e.time}</span><span className="slot">{e.label}</span></div>
                <div className="slot-items">
                  {e.items.map((it) => (
                    <div key={it.name} className="sched-item">
                      <strong>{it.name}</strong>{it.kind === "drug" && <span className="tag">Medication</span>}
                      {it.reasons.length > 0 && <ul className="reasons">{[...new Set(it.reasons)].map((x) => <li key={x}>{x}</li>)}</ul>}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        ) : <p className="fine">Nothing to schedule.</p>}
        {r.schedule.excluded.map((x) => <p key={x.name} className="notice">{x.reason}</p>)}
        {r.schedule.unresolved.length > 0 && <p className="notice">We couldn't fit every timing rule into one day: {r.schedule.unresolved.join("; ")}. Ask your pharmacist.</p>}
        {r.schedule.notes.length > 0 && <ul className="notes">{r.schedule.notes.map((x) => <li key={x}>{x}</li>)}</ul>}
        {r.timing.map((f) => <FlagRow key={f.id} f={f} />)}
      </Section>

      {(r.ul.length > 0 || r.overlaps.length > 0) && (
        <Section num={next()} title="You may be getting too much" count={r.ul.length || undefined} tone="caution">
          {r.ul.length > 0 && (
            <table className="data limits">
              <thead><tr><th>Nutrient</th><th className="num">Your total</th><th className="num">Upper limit</th><th>From</th></tr></thead>
              <tbody>
                {r.ul.map((u) => (
                  <tr key={u.ingredient}>
                    <td><strong>{u.name}</strong></td>
                    <td className="num over">{n(u.total)} {u.unit}</td>
                    <td className="num">{n(u.ul)} {u.unit}{u.scope === "supplements_only" ? "*" : ""}</td>
                    <td className="fine">{u.products.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {r.ul.some((u) => u.scope === "supplements_only") && <p className="fine">* From supplements only; food doesn't count toward this limit.</p>}
          {r.ul.map((u) => {
            const note = kb.ingredients.find((i) => i.id === u.ingredient)?.safety_notes[0];
            return note ? <p key={u.ingredient} className="fine"><strong>{u.name}:</strong> {note.text}</p> : null;
          })}
          {r.overlaps.filter((o) => !r.ul.some((u) => u.ingredient === o.ingredient)).length > 0 && (
            <p className="fine">Also in more than one product: {r.overlaps.filter((o) => !r.ul.some((u) => u.ingredient === o.ingredient)).map((o) => `${o.name} (${o.products.join(", ")})`).join("; ")}.</p>
          )}
        </Section>
      )}

      {swaps.length > 0 && (
        <Section num={next()} title="You probably don't need this" count={swaps.length} tone="positive"
          aside={r.savings != null ? <span className="num">Save ~${n(r.savings)}/mo</span> : undefined}>
          {swaps.map((s, i) => <SwapRow key={i} s={s} />)}
        </Section>
      )}

      {routes.length > 0 && (
        <Section num={next()} title="Check with a clinician" count={routes.length} tone="caution">
          {routes.map((s, i) => <SwapRow key={i} s={s} />)}
        </Section>
      )}

      {r.other.length > 0 && (
        <Section num={next()} title="Worth knowing" count={r.other.length} tone="neutral">
          {r.other.map((f) => <FlagRow key={f.id} f={f} />)}
        </Section>
      )}

      {(r.checked.length > 0 || r.suppressed.length > 0) && (
        <Section num={next()} title="Checked, no issues" tone="neutral">
          {r.checked.length > 0 && <p>{r.checked.join(" · ")}</p>}
          {r.suppressed.length > 0 && <p className="fine">Not flagged because they're combined in the same product: {r.suppressed.map((f) => f.title).join("; ")}.</p>}
        </Section>
      )}
      <p className="disclaimer">Not medical advice. Don't start, stop, or change a medication or supplement without talking to a clinician.</p>
    </div>
  );
}
