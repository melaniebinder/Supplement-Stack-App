import { useMemo, useState } from "react";
import type { GoalId, Product, Profile } from "../engine/types";
import { ingById, kb } from "../kb";
import { GOALS, n, unitsFor } from "./format";

export interface FormState {
  products: (Product & { key: string })[];
  drugs: string[];
  otherMed: boolean;
  noMeds: boolean;
  profile: Profile;
}
let seq = 0;
export const newKey = () => `p${++seq}`;

// ---------------------------------------------------------------- supplements
function AddSupplement({ onAdd }: { onAdd: (p: Product) => void }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [unitIdx, setUnitIdx] = useState(0);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2 || picked) return [];
    return kb.ingredients.filter((i) => [i.name, ...i.synonyms].some((s) => s.toLowerCase().includes(t))).slice(0, 8);
  }, [q, picked]);
  const ing = picked ? ingById.get(picked)! : null;
  const units = ing ? unitsFor(ing) : [];

  const add = () => {
    if (!ing) return;
    const u = units[unitIdx];
    const amt = amount ? parseFloat(amount) * u.factor : undefined;
    const form = ing.id === "vitamin-a" && /beta/i.test(q) ? "beta-carotene" : ing.id === "vitamin-a" ? "preformed" : undefined;
    const label = amount ? `${ing.name} ${amount} ${u.unit}` : ing.name;
    onAdd({ name: label, ingredients: [{ ingredient: ing.id, amount: amt, unit: units[0].unit, form }] });
    setQ(""); setPicked(null); setAmount(""); setUnitIdx(0);
  };

  return (
    <div className="add-row">
      <div className="combo">
        <input aria-label="Search supplements" placeholder="Search supplements, e.g. magnesium, fish oil, ashwagandha"
          value={q} onChange={(e) => { setQ(e.target.value); setPicked(null); }} />
        {matches.length > 0 && (
          <ul className="suggest" role="listbox">
            {matches.map((m) => (
              <li key={m.id}><button onClick={() => { setPicked(m.id); setQ(m.name); }}>{m.name}<span className="muted"> {m.synonyms.slice(0, 3).join(", ")}</span></button></li>
            ))}
          </ul>
        )}
      </div>
      {ing && (
        <>
          <input className="amount" inputMode="decimal" aria-label="Amount per day" placeholder="Amount/day" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select aria-label="Unit" value={unitIdx} onChange={(e) => setUnitIdx(+e.target.value)}>
            {units.map((u, i) => <option key={u.unit} value={i}>{u.unit}</option>)}
          </select>
          <button className="primary" onClick={add}>Add</button>
        </>
      )}
      {!ing && q.length >= 2 && matches.length === 0 && <p className="muted small">Not in our 30-ingredient starter set yet.</p>}
    </div>
  );
}

function AddMulti({ onAdd }: { onAdd: (p: Product) => void }) {
  return (
    <div className="multi">
      <span className="muted">Multivitamin? Start from a typical one, then edit to match your label:</span>
      {kb.templates.map((t) => (
        <button key={t.id} className="chip" onClick={() => onAdd({ name: t.name, ingredients: t.ingredients.map((x) => ({ ...x })) })}>+ {t.name.replace("Typical ", "")}</button>
      ))}
    </div>
  );
}

function ProductRow({ p, onChange, onRemove }: { p: FormState["products"][number]; onChange: (p: FormState["products"][number]) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const multi = p.ingredients.length > 1;
  return (
    <li className="product">
      <div className="product-main">
        <div>
          <strong>{p.name}</strong>
          {multi && <button className="link small" onClick={() => setOpen(!open)}>{p.ingredients.length} ingredients · {open ? "hide" : "edit amounts"}</button>}
        </div>
        <div className="product-controls">
          <select aria-label={`Why do you take ${p.name}?`} value={p.why ?? ""} onChange={(e) => onChange({ ...p, why: (e.target.value || undefined) as GoalId | undefined })}>
            {GOALS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
          <label className="cost">$<input inputMode="decimal" aria-label="Monthly cost" placeholder="/mo" value={p.monthly_cost ?? ""}
            onChange={(e) => onChange({ ...p, monthly_cost: e.target.value ? parseFloat(e.target.value) : undefined })} /></label>
          <button className="icon" aria-label={`Remove ${p.name}`} onClick={onRemove}>✕</button>
        </div>
      </div>
      {open && (
        <table className="ingredients">
          <tbody>
            {p.ingredients.map((r, i) => (
              <tr key={i}>
                <td>{ingById.get(r.ingredient)?.name}{r.form ? <span className="muted"> ({r.form})</span> : null}</td>
                <td><input inputMode="decimal" aria-label={`${ingById.get(r.ingredient)?.name} amount`} value={r.amount ?? ""}
                  onChange={(e) => onChange({ ...p, ingredients: p.ingredients.map((x, j) => (j === i ? { ...x, amount: e.target.value ? parseFloat(e.target.value) : undefined } : x)) })} /></td>
                <td className="muted">{r.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!multi && p.ingredients[0]?.amount == null && <p className="muted small">No amount entered, so we can't check upper limits for this one.</p>}
    </li>
  );
}

// ---------------------------------------------------------------- form
export function StackForm({ state, setState, onCheck }: { state: FormState; setState: (s: FormState) => void; onCheck: () => void }) {
  const add = (p: Product) => setState({ ...state, products: [...state.products, { ...p, key: newKey() }] });
  const medsDone = state.noMeds || state.drugs.length > 0 || state.otherMed;
  const canCheck = state.products.length > 0 && medsDone;
  const scr = state.profile.screening ?? {};
  const setScr = (k: keyof NonNullable<Profile["screening"]>, v: boolean) => setState({ ...state, profile: { ...state.profile, screening: { ...scr, [k]: v } } });

  return (
    <div className="form">
      <section className="card">
        <h2><span className="step">1</span> Your supplements</h2>
        <AddSupplement onAdd={add} />
        <AddMulti onAdd={add} />
        {state.products.length > 0 ? (
          <ul className="products">
            {state.products.map((p) => (
              <ProductRow key={p.key} p={p}
                onChange={(np) => setState({ ...state, products: state.products.map((x) => (x.key === p.key ? np : x)) })}
                onRemove={() => setState({ ...state, products: state.products.filter((x) => x.key !== p.key) })} />
            ))}
          </ul>
        ) : <p className="empty">Nothing added yet.</p>}
      </section>

      <section className="card">
        <h2><span className="step">2</span> Your medications</h2>
        <p className="muted">Medications can interact with supplements. Don't forget birth control, thyroid medication, and acid reducers.</p>
        <div className="add-row">
          <select aria-label="Add a medication" value="" onChange={(e) => {
            const v = e.target.value;
            if (v === "__other") setState({ ...state, otherMed: true, noMeds: false });
            else if (v && !state.drugs.includes(v)) setState({ ...state, drugs: [...state.drugs, v], noMeds: false });
          }}>
            <option value="">+ Add a medication…</option>
            {kb.picklist.map((m) => <option key={m.label} value={m.drug_class ?? "__other"}>{m.label}</option>)}
          </select>
        </div>
        <ul className="chips">
          {state.drugs.map((d) => (
            <li key={d} className="chip on">{kb.picklist.find((m) => m.drug_class === d)?.label}
              <button className="icon" aria-label="Remove" onClick={() => setState({ ...state, drugs: state.drugs.filter((x) => x !== d) })}>✕</button></li>
          ))}
          {state.otherMed && <li className="chip on">Other medication (can't be checked)<button className="icon" aria-label="Remove" onClick={() => setState({ ...state, otherMed: false })}>✕</button></li>}
        </ul>
        <label className="check">
          <input type="checkbox" checked={state.noMeds} disabled={state.drugs.length > 0 || state.otherMed}
            onChange={(e) => setState({ ...state, noMeds: e.target.checked })} /> I don't take any medications
        </label>
      </section>

      <section className="card">
        <h2><span className="step">3</span> About you <span className="muted small">(optional)</span></h2>
        <div className="about">
          <label>Age <input inputMode="numeric" value={state.profile.age ?? ""} onChange={(e) => setState({ ...state, profile: { ...state.profile, age: e.target.value ? parseInt(e.target.value) : undefined } })} /></label>
          <label>Sex <select value={state.profile.sex ?? ""} onChange={(e) => setState({ ...state, profile: { ...state.profile, sex: (e.target.value || undefined) as Profile["sex"] } })}>
            <option value="">—</option><option value="female">Female</option><option value="male">Male</option></select></label>
        </div>
        <div className="screening">
          <label className="check"><input type="checkbox" checked={!!scr.pregnant_or_breastfeeding} onChange={(e) => setScr("pregnant_or_breastfeeding", e.target.checked)} /> Pregnant or breastfeeding</label>
          <label className="check"><input type="checkbox" checked={!!scr.under_18} onChange={(e) => setScr("under_18", e.target.checked)} /> Under 18</label>
          <label className="check"><input type="checkbox" checked={!!scr.kidney_disease} onChange={(e) => setScr("kidney_disease", e.target.checked)} /> Kidney disease</label>
          <label className="check"><input type="checkbox" checked={!!scr.liver_disease} onChange={(e) => setScr("liver_disease", e.target.checked)} /> Liver disease</label>
        </div>
      </section>

      <div className="cta">
        <button className="primary big" disabled={!canCheck} onClick={onCheck}>Check my stack</button>
        {!canCheck && <p className="muted small">{state.products.length === 0 ? "Add at least one supplement." : "Add your medications, or tick “I don't take any medications”."}</p>}
      </div>
    </div>
  );
}

export const totalsLabel = (amount?: number, unit?: string) => (amount != null ? `${n(amount)} ${unit ?? ""}` : "");
