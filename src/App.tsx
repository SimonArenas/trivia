import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { check, type Field, type Verdict } from "./answer";
import {
  CONTINENTS,
  COUNTRIES,
  flagUrl,
  shortStatusLabel,
  statusLabel,
  type Continent,
  type Country,
} from "./countries";
import { grade, pickNext, stats, type Progress } from "./srs";
import { load, save } from "./storage";

const CONTINENTS_KEY = "banderas.continents.v1";
const KIND_KEY = "banderas.kind.v1";
const MODE_KEY = "banderas.mode.v1";
const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

type Kind = "all" | "sovereign" | "other";
const KINDS: [Kind, string][] = [
  ["all", "Todos"],
  ["sovereign", "Soberanos"],
  ["other", "No soberanos"],
];

type Mode = "cards" | "country" | "capital";
const MODES: [Mode, string][] = [
  ["cards", "Tarjetas"],
  ["country", "País"],
  ["capital", "Capital"],
];

// Each mode trains a different skill, so each keeps its own progress.
const PROGRESS_KEYS: Record<Mode, string> = {
  cards: "banderas.progress.v1",
  country: "banderas.progress.write-country.v1",
  capital: "banderas.progress.write-capital.v1",
};

// Limited-recognition states count as sovereign here: they're declared states, not territories.
function matchesKind(c: Country, kind: Kind): boolean {
  const sovereign = c.status === "sovereign" || c.status === "limited";
  return kind === "all" || (kind === "sovereign") === sovereign;
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function preload(code: string | null) {
  if (code) new Image().src = flagUrl(code);
}

function formatWait(ms: number): string {
  const min = Math.ceil(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? "día" : "días"}`;
}

export default function App() {
  const [mode, setMode] = useState<Mode>(() => load(MODE_KEY, "cards"));
  const [progress, setProgress] = useState<Progress>(() => load(PROGRESS_KEYS[mode], {}));
  const [continents, setContinents] = useState<Continent[]>(() =>
    load(CONTINENTS_KEY, CONTINENTS),
  );
  // Shuffled once per visit so new cards come in random order.
  const [order] = useState(() => shuffle(COUNTRIES.map((c) => c.code)));
  const [kind, setKind] = useState<Kind>(() => load(KIND_KEY, "all"));
  const deck = useMemo(
    () =>
      order.filter((code) => {
        const c = BY_CODE.get(code)!;
        return (
          continents.includes(c.continent) &&
          matchesKind(c, kind) &&
          (mode !== "capital" || c.capital !== null)
        );
      }),
    [order, continents, kind, mode],
  );

  const [current, setCurrent] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [practiceAhead, setPracticeAhead] = useState(false);
  const [now, setNow] = useState(Date.now);
  // Written modes: what the user typed and, once submitted, how it was graded.
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restart the session whenever the deck changes (first load, new filter or mode).
  useEffect(() => {
    setPracticeAhead(false);
    setFlipped(false);
    setTyped("");
    setVerdict(null);
    setCurrent(pickNext(deck, progress, Date.now(), null, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  // Tick so stats stay fresh and the "all caught up" screen resumes on its own.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (current === null) setCurrent(pickNext(deck, progress, now, null, practiceAhead));
  }, [now, current, deck, progress, practiceAhead]);

  const updateProgress = (next: Progress) => {
    setProgress(next);
    save(PROGRESS_KEYS[mode], next);
  };

  const answer = useCallback(
    (knew: boolean) => {
      if (!current) return;
      const t = Date.now();
      const next = { ...progress, [current]: grade(progress[current], knew, t) };
      updateProgress(next);
      setFlipped(false);
      setTyped("");
      setVerdict(null);
      setNow(t);
      setCurrent(pickNext(deck, next, t, current, practiceAhead));
    },
    [current, progress, deck, practiceAhead, mode],
  );

  // Fetch whichever flag comes next, since the user can answer at any moment.
  useEffect(() => {
    if (!current) return;
    const t = Date.now();
    for (const knew of [true, false]) {
      const next = { ...progress, [current]: grade(progress[current], knew, t) };
      preload(pickNext(deck, next, t, current, practiceAhead));
    }
  }, [current, progress, deck, practiceAhead]);

  // Card shortcuts would clash with typing, so the written modes only use Enter.
  useEffect(() => {
    if (mode !== "cards") return;
    const onKey = (e: KeyboardEvent) => {
      if (!current || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "1" || e.key === "ArrowLeft") {
        answer(false);
      } else if (e.key === "2" || e.key === "ArrowRight") {
        answer(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, answer, mode]);

  // Keep the input focused so Enter always works, even after "No lo sé".
  useEffect(() => {
    inputRef.current?.focus();
  }, [current, verdict, mode]);

  const field: Field = mode === "capital" ? "capital" : "name";
  const submit = () => {
    if (!current) return;
    if (verdict) answer(verdict !== "wrong");
    else setVerdict(check(typed, current, field));
  };

  const chooseMode = (next: Mode) => {
    setMode(next);
    save(MODE_KEY, next);
    setProgress(load(PROGRESS_KEYS[next], {}));
  };

  const chooseContinents = (next: Continent[]) => {
    if (!next.length) return;
    setContinents(next);
    save(CONTINENTS_KEY, next);
  };

  // With "Todos" active, a continent click narrows to just that one;
  // otherwise it toggles that continent in or out.
  const clickContinent = (c: Continent) => {
    if (continents.length === CONTINENTS.length) return chooseContinents([c]);
    chooseContinents(
      continents.includes(c)
        ? continents.filter((x) => x !== c)
        : CONTINENTS.filter((x) => x === c || continents.includes(x)),
    );
  };

  const reset = () => {
    const label = MODES.find(([m]) => m === mode)![1];
    if (!confirm(`¿Borrar tu progreso en modo ${label}? Esto no se puede deshacer.`)) return;
    updateProgress({});
    setPracticeAhead(false);
    setFlipped(false);
    setTyped("");
    setVerdict(null);
    setCurrent(pickNext(deck, {}, Date.now(), null, false));
  };

  const s = stats(deck, progress, now);
  const country = current ? BY_CODE.get(current)! : null;
  const nextDue = Math.min(...deck.map((c) => progress[c]?.due ?? Infinity));

  return (
    <div className="app">
      <header>
        <h1>Banderas del mundo</h1>
        <div className="segmented" role="radiogroup" aria-label="Modo">
          {MODES.map(([m, label]) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => chooseMode(m)}>
              {label}
            </button>
          ))}
        </div>
        <div className="filters" role="group" aria-label="Continentes">
          <button
            className="chip"
            aria-pressed={continents.length === CONTINENTS.length}
            onClick={() => chooseContinents(CONTINENTS)}
          >
            Todos
          </button>
          {CONTINENTS.map((c) => (
            <button
              key={c}
              className="chip"
              aria-pressed={continents.length < CONTINENTS.length && continents.includes(c)}
              onClick={() => clickContinent(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="segmented" role="radiogroup" aria-label="Tipo">
          {KINDS.map(([k, label]) => (
            <button
              key={k}
              role="radio"
              aria-checked={kind === k}
              onClick={() => {
                setKind(k);
                save(KIND_KEY, k);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <Meter mastered={s.mastered} learning={s.learning} total={s.total} />
        <dl className="stats">
          <div>
            <dt>Dominadas</dt>
            <dd>{s.mastered}</dd>
          </div>
          <div>
            <dt>Aprendiendo</dt>
            <dd>{s.learning}</dd>
          </div>
          <div>
            <dt>Nuevas</dt>
            <dd>{s.fresh}</dd>
          </div>
        </dl>
      </header>

      <main>
        {country && mode === "cards" ? (
          <>
            <Card
              key={country.code}
              country={country}
              isNew={!progress[country.code]}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
            />
            {/* Buttons only on the back to keep the front clean; keys 1/2 work on
                either side, to clear cards you already know quickly. */}
            <div className="answers" data-visible={flipped}>
              <button className="no" onClick={() => answer(false)} disabled={!flipped}>
                No lo sabía <kbd>1</kbd>
              </button>
              <button className="yes" onClick={() => answer(true)} disabled={!flipped}>
                Lo sabía <kbd>2</kbd>
              </button>
            </div>
            <p className="hint">
              <kbd>Espacio</kbd> voltear · <kbd>1</kbd> no lo sabía · <kbd>2</kbd> lo sabía
            </p>
          </>
        ) : country ? (
          <>
            <Card
              key={country.code}
              country={country}
              isNew={!progress[country.code]}
              flipped={verdict !== null}
              prompt={mode === "capital" ? country.name : undefined}
              result={
                verdict && (
                  <VerdictLine
                    verdict={verdict}
                    typed={typed}
                    expected={(mode === "capital" ? country.capital : country.name) ?? ""}
                  />
                )
              }
            />
            <form
              className="write"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <input
                ref={inputRef}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                readOnly={verdict !== null}
                placeholder={mode === "capital" ? "¿Cuál es su capital?" : "¿Qué país es?"}
                aria-label={mode === "capital" ? "Capital" : "País"}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint={verdict ? "next" : "done"}
              />
              <div className="answers">
                {/* Keys stop React from reusing "No lo sé" as "Siguiente": the
                    button would turn into a submit mid-click and skip the card. */}
                {verdict ? (
                  <button key="next" type="submit" className="yes wide">
                    Siguiente <kbd>Enter</kbd>
                  </button>
                ) : (
                  <>
                    <button key="skip" type="button" className="no" onClick={() => setVerdict("wrong")}>
                      No lo sé
                    </button>
                    <button key="submit" type="submit" className="yes">
                      Responder <kbd>Enter</kbd>
                    </button>
                  </>
                )}
              </div>
            </form>
            <p className="hint">
              <kbd>Enter</kbd> responder y pasar a la siguiente
            </p>
          </>
        ) : deck.length === 0 ? (
          <div className="done">
            <h2>Sin banderas</h2>
            <p>No hay banderas que cumplan este filtro. Prueba con otro continente o tipo.</p>
          </div>
        ) : (
          <div className="done">
            <h2>¡Estás al día!</h2>
            <p>
              Repasaste todo lo pendiente de este mazo.
              {Number.isFinite(nextDue) && (
                <> La próxima tarjeta vuelve en {formatWait(nextDue - now)}.</>
              )}
            </p>
            <button className="yes" onClick={() => setPracticeAhead(true)}>
              Seguir practicando
            </button>
          </div>
        )}
      </main>

      <footer>
        <button className="link" onClick={reset}>
          Borrar progreso
        </button>
        <span>
          Banderas de <a href="https://flagcdn.com">flagcdn.com</a>
        </span>
      </footer>
    </div>
  );
}

function Meter({ mastered, learning, total }: { mastered: number; learning: number; total: number }) {
  const pct = (n: number) => `${total ? (n / total) * 100 : 0}%`;
  return (
    <div
      className="meter"
      role="img"
      aria-label={`${mastered} de ${total} dominadas, ${learning} aprendiendo`}
    >
      <span className="mastered" style={{ width: pct(mastered) }} />
      <span className="learning" style={{ width: pct(learning) }} />
    </div>
  );
}

// Hover zoom: scale the flag around the cursor. offsetX/Y are in the image's
// untransformed coordinates, so the origin doesn't drift while it's scaled.
function zoomAt(e: React.MouseEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  img.style.setProperty("--zx", `${(e.nativeEvent.offsetX / img.offsetWidth) * 100}%`);
  img.style.setProperty("--zy", `${(e.nativeEvent.offsetY / img.offsetHeight) * 100}%`);
}

function VerdictLine({ verdict, typed, expected }: { verdict: Verdict; typed: string; expected: string }) {
  return (
    <p className="verdict" data-verdict={verdict} role="status">
      {verdict === "exact" ? (
        "✓ ¡Correcto!"
      ) : verdict === "close" ? (
        <>
          ✓ Casi: <strong>{expected}</strong>
        </>
      ) : typed.trim() ? (
        <>
          ✗ <s>{typed}</s>
        </>
      ) : (
        "✗ No lo sabías"
      )}
    </p>
  );
}

// In the written modes there's no onFlip: the card turns over once the answer
// is graded, and `result` shows how it went above the answer.
function Card({
  country,
  isNew,
  flipped,
  onFlip,
  prompt,
  result,
}: {
  country: Country;
  isNew: boolean;
  flipped: boolean;
  onFlip?: () => void;
  prompt?: string;
  result?: ReactNode;
}) {
  const Root = onFlip ? "button" : "div";
  return (
    <Root
      className="card"
      data-flipped={flipped}
      onClick={onFlip}
      aria-label={
        onFlip ? (flipped ? `${country.name}. Toca para ocultar` : "Toca para ver la respuesta") : undefined
      }
    >
      <div className="card-inner">
        <div className="face front" aria-hidden={flipped}>
          <span className="tag">{isNew ? "Nueva" : "Repaso"}</span>
          <img
            src={flagUrl(country.code)}
            alt="Bandera por adivinar"
            draggable={false}
            onMouseMove={zoomAt}
          />
          <div className="tags corner">
            <span className="pill">{country.continent}</span>
            <span className="pill" data-status={country.status}>
              {shortStatusLabel(country)}
            </span>
          </div>
          {prompt && <h2 className="prompt">{prompt}</h2>}
          {onFlip && <span className="tap">Toca para ver la respuesta</span>}
        </div>
        <div className="face back" aria-hidden={!flipped}>
          {result}
          <img src={flagUrl(country.code)} alt="" className="mini" draggable={false} />
          <h2>{country.name}</h2>
          <p className="capital">
            {country.capital ? (
              <>
                <span>Capital</span>
                <strong>{country.capital}</strong>
              </>
            ) : (
              <strong className="none">Sin capital</strong>
            )}
          </p>
          <div className="tags">
            <span className="pill">{country.continent}</span>
            <span className="pill" data-status={country.status}>
              {statusLabel(country)}
            </span>
          </div>
        </div>
      </div>
    </Root>
  );
}
