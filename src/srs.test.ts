import { describe, expect, test } from "bun:test";
import { COUNTRIES } from "./countries";
import { grade, INTERVALS, MAX_BOX, pickNext, stats } from "./srs";

describe("grade", () => {
  test("knowing a new card puts it in box 1", () => {
    expect(grade(undefined, true, 0)).toEqual({ box: 1, due: INTERVALS[1] });
  });

  test("knowing moves up one box, capped at the top", () => {
    expect(grade({ box: 2, due: 0 }, true, 100).box).toBe(3);
    expect(grade({ box: MAX_BOX, due: 0 }, true, 100).box).toBe(MAX_BOX);
  });

  test("missing sends the card back to box 1", () => {
    expect(grade({ box: 5, due: 0 }, false, 100)).toEqual({ box: 1, due: 100 + INTERVALS[1] });
  });
});

describe("pickNext", () => {
  const codes = ["a", "b", "c"];

  test("prefers the most overdue card", () => {
    const progress = { a: { box: 1, due: 50 }, b: { box: 1, due: 10 } };
    expect(pickNext(codes, progress, 100, null, false)).toBe("b");
  });

  test("falls back to a new card when nothing is due", () => {
    const progress = { a: { box: 1, due: 500 }, b: { box: 1, due: 500 } };
    expect(pickNext(codes, progress, 100, null, false)).toBe("c");
  });

  test("returns null when everything is done, unless practicing ahead", () => {
    const progress = { a: { box: 3, due: 900 }, b: { box: 3, due: 500 }, c: { box: 3, due: 700 } };
    expect(pickNext(codes, progress, 100, null, false)).toBeNull();
    expect(pickNext(codes, progress, 100, null, true)).toBe("b");
  });

  test("does not repeat the previous card if there is another option", () => {
    const progress = { a: { box: 1, due: 0 }, b: { box: 1, due: 50 } };
    expect(pickNext(["a", "b"], progress, 100, "a", false)).toBe("b");
    expect(pickNext(["a"], progress, 100, "a", false)).toBe("a");
  });
});

test("stats buckets cards", () => {
  const progress = { a: { box: 1, due: 0 }, b: { box: 4, due: 999 } };
  expect(stats(["a", "b", "c"], progress, 100)).toEqual({
    total: 3,
    fresh: 1,
    learning: 1,
    mastered: 1,
    due: 1,
  });
});

describe("country data", () => {
  test("has 249 unique cards", () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBe(249);
  });

  test("counts by status", () => {
    const count = (s: string) => COUNTRIES.filter((c) => c.status === s).length;
    expect(count("sovereign")).toBe(194); // 193 UN members + Vatican
    expect(count("limited")).toBe(3); // Kosovo, Palestine, Taiwan
    expect(count("constituent")).toBe(4);
    expect(count("territory")).toBe(48);
  });

  test("every territory and constituent nation says who it depends on", () => {
    for (const c of COUNTRIES) {
      expect(Boolean(c.parent)).toBe(c.status === "territory" || c.status === "constituent");
    }
  });
});
