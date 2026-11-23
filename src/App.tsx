import { useEffect, useMemo, useState } from "react";
import { check } from "./engine/check";
import { kb } from "./kb";
import { Results } from "./ui/Results";
import { FormState, StackForm, newKey } from "./ui/StackForm";

const EMPTY: FormState = { products: [], drugs: [], otherMed: false, noMeds: false, profile: {} };
const STORE = "stack-v1";
const load = (): FormState => {
  try { const s = localStorage.getItem(STORE); return s ? { ...EMPTY, ...JSON.parse(s) } : EMPTY; } catch { return EMPTY; }
};

export default function App() {
  const [state, setState] = useState<FormState>(load);
  const [showResults, setShowResults] = useState(false);
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* storage unavailable: fine */ } }, [state]);

  const result = useMemo(
    () => (showResults ? check(kb, { products: state.products, drug_classes: state.drugs, other_medication: state.otherMed, profile: state.profile }) : null),
    [showResults, state],
  );
  const tryExample = (id: string) => {
    const ex = kb.examples.find((e) => e.id === id)!;
    setState({ products: ex.products.map((p) => ({ ...p, key: newKey() })), drugs: ex.drug_classes, otherMed: false, noMeds: ex.drug_classes.length === 0, profile: ex.profile });
    setShowResults(true);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <div className="banner" role="note">
        <strong>Prototype with draft data.</strong> Every claim is backed by verified sources, but nothing has been reviewed by a pharmacist yet. Not medical advice.
      </div>
      <header className="hero">
        <h1>Supplement Stack</h1>
        <p className="tagline">Find out which supplements you actually need. See what the evidence says, what food or habits could replace, and how to take the rest safely together.</p>
        <div className="examples no-print">
          <span className="muted">Try an example:</span>
          {kb.examples.map((e) => <button key={e.id} className="chip" onClick={() => tryExample(e.id)}>{e.persona.split(",")[0]}<span className="muted"> · {e.persona.split(",").slice(1).join(",").trim()}</span></button>)}
        </div>
      </header>
      <main>
        {result ? <Results r={result} onEdit={() => setShowResults(false)} />
          : <StackForm state={state} setState={setState} onCheck={() => { setShowResults(true); window.scrollTo({ top: 0 }); }} />}
      </main>
      <footer>
        <p>
          {kb.ingredients.length} supplements · {kb.interactions.length} interactions · {Object.keys(kb.sources).filter((s) => kb.sources[s].verified).length} verified sources · data built {kb.built_at}
        </p>
        <p>
          <a href="https://github.com/melaniebinder/Supplement-Stack-App" target="_blank" rel="noreferrer">How this works, all sources, and the evidence behind every claim →</a>
        </p>
        <p className="muted">Your stack is stored only in this browser. Nothing is sent anywhere.</p>
      </footer>
    </>
  );
}
