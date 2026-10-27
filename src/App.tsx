import { useCallback, useEffect, useMemo, useState } from "react";
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

const PROGRESS_KEY = "banderas.progress.v1";
const CONTINENTS_KEY = "banderas.continents.v1";
const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

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
  const [progress, setProgress] = useState<Progress>(() => load(PROGRESS_KEY, {}));
  const [continents, setContinents] = useState<Continent[]>(() =>
    load(CONTINENTS_KEY, CONTINENTS),
  );
  // Shuffled once per visit so new cards come in random order.
  const [order] = useState(() => shuffle(COUNTRIES.map((c) => c.code)));
  const deck = useMemo(
    () => order.filter((code) => continents.includes(BY_CODE.get(code)!.continent)),
    [order, continents],
  );

  const [current, setCurrent] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [practiceAhead, setPracticeAhead] = useState(false);
  const [now, setNow] = useState(Date.now);

  // Restart the session whenever the deck changes (first load or new filter).
  useEffect(() => {
    setPracticeAhead(false);
    setFlipped(false);
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
    save(PROGRESS_KEY, next);
  };

  const answer = useCallback(
    (knew: boolean) => {
      if (!current) return;
      const t = Date.now();
      const next = { ...progress, [current]: grade(progress[current], knew, t) };
      updateProgress(next);
      setFlipped(false);
      setNow(t);
      setCurrent(pickNext(deck, next, t, current, practiceAhead));
    },
    [current, progress, deck, practiceAhead],
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

  useEffect(() => {
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
  }, [current, answer]);

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
    if (!confirm("¿Borrar todo tu progreso? Esto no se puede deshacer.")) return;
    updateProgress({});
    setPracticeAhead(false);
    setFlipped(false);
    setCurrent(pickNext(deck, {}, Date.now(), null, false));
  };

  const s = stats(deck, progress, now);
  const country = current ? BY_CODE.get(current)! : null;
  const nextDue = Math.min(...deck.map((c) => progress[c]?.due ?? Infinity));

  return (
    <div className="app">
      <header>
        <h1>Banderas del mundo</h1>
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
        {country ? (
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

function Card({
  country,
  isNew,
  flipped,
  onFlip,
}: {
  country: Country;
  isNew: boolean;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <button
      className="card"
      data-flipped={flipped}
      onClick={onFlip}
      aria-label={flipped ? `${country.name}. Toca para ocultar` : "Toca para ver la respuesta"}
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
          <span className="tap">Toca para ver la respuesta</span>
        </div>
        <div className="face back" aria-hidden={!flipped}>
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
    </button>
  );
}
