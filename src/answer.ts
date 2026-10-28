// Grading for the written modes: typos are forgiven, but only when the answer
// isn't closer to some other country (so "Austria" never passes for Australia).

import { distance } from "fastest-levenshtein";
import { ALIASES, COUNTRIES, type Country } from "./countries";

export type Field = "name" | "capital";
export type Verdict = "exact" | "close" | "wrong";

/** Minimum similarity (0–1) for a typo to count as correct. */
export const THRESHOLD = 0.8;

/** Lowercase, no accents, letters and digits only: "Washington D. C." → "washingtondc". */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// "Isla de Man" → "Man", "Ciudad de México" → "México".
const PREFIX = /^(islas?( de)?|ciudad del?) /i;

/** Every accepted spelling for one country, already normalized. */
export function accepted(c: Country, field: Field): string[] {
  const text = field === "name" ? c.name : c.capital;
  if (!text) return [];
  const bare = text.replace(/\s*\([^)]*\)/g, "");
  // Several capitals ("Sucre y La Paz") accept any of them; names stay whole
  // so "Trinidad" alone doesn't pass for Trinidad y Tobago.
  const parts = field === "capital" ? bare.split(/\s+y\s+|[,;/]/) : [bare];
  const variants = parts.flatMap((p) => [p.trim(), p.trim().replace(PREFIX, "")]);
  variants.push(...(ALIASES[c.code]?.[field] ?? []));
  return [...new Set(variants.map(normalize).filter(Boolean))];
}

const POOLS: Record<Field, Map<string, string[]>> = {
  name: new Map(COUNTRIES.map((c) => [c.code, accepted(c, "name")])),
  capital: new Map(COUNTRIES.map((c) => [c.code, accepted(c, "capital")])),
};

const similarity = (a: string, b: string) => 1 - distance(a, b) / Math.max(a.length, b.length);

export function check(input: string, code: string, field: Field): Verdict {
  const typed = normalize(input);
  if (!typed) return "wrong";
  const pool = POOLS[field];
  const own = pool.get(code) ?? [];
  if (own.includes(typed)) return "exact";

  let ownBest = 0;
  let otherBest = 0;
  for (const [c, answers] of pool) {
    for (const a of answers) {
      const s = similarity(typed, a);
      if (c === code) ownBest = Math.max(ownBest, s);
      else otherBest = Math.max(otherBest, s);
    }
  }
  return ownBest >= THRESHOLD && ownBest >= otherBest ? "close" : "wrong";
}
