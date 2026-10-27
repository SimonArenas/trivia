// Leitner-style spaced repetition. Each card the user has seen lives in a box;
// knowing it moves it up a box (longer wait), missing it sends it back to box 1.

export type CardState = { box: number; due: number };
export type Progress = Record<string, CardState>;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Wait before a card in box N is due again (index = box). */
export const INTERVALS = [0, 1 * MINUTE, 10 * MINUTE, 1 * DAY, 3 * DAY, 7 * DAY, 21 * DAY];
export const MAX_BOX = INTERVALS.length - 1;
/** Box from which a card counts as learned. */
export const MASTERED_BOX = 4;

export function grade(state: CardState | undefined, knew: boolean, now: number): CardState {
  const box = knew ? Math.min((state?.box ?? 0) + 1, MAX_BOX) : 1;
  return { box, due: now + INTERVALS[box] };
}

/**
 * Picks the next card: the most overdue reviewed card first, then the first new
 * card in `codes` order (shuffle it to get random new cards), then (if
 * `practiceAhead`) the card due soonest. Avoids repeating `previous` when there
 * is any alternative. Deterministic, so the caller can preload the next flag.
 */
export function pickNext(
  codes: string[],
  progress: Progress,
  now: number,
  previous: string | null,
  practiceAhead: boolean,
): string | null {
  const candidates = codes.length > 1 ? codes.filter((c) => c !== previous) : codes;

  const due = candidates
    .filter((c) => progress[c] && progress[c].due <= now)
    .sort((a, b) => progress[a].due - progress[b].due);
  if (due.length) return due[0];

  const fresh = candidates.find((c) => !progress[c]);
  if (fresh) return fresh;

  if (!practiceAhead || !candidates.length) return null;
  return [...candidates].sort((a, b) => progress[a].due - progress[b].due)[0];
}

export type Stats = { total: number; fresh: number; learning: number; mastered: number; due: number };

export function stats(codes: string[], progress: Progress, now: number): Stats {
  const s: Stats = { total: codes.length, fresh: 0, learning: 0, mastered: 0, due: 0 };
  for (const c of codes) {
    const p = progress[c];
    if (!p) s.fresh++;
    else if (p.box >= MASTERED_BOX) s.mastered++;
    else s.learning++;
    if (p && p.due <= now) s.due++;
  }
  return s;
}
