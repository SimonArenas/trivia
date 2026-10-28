import { describe, expect, test } from "bun:test";
import { accepted, check, normalize } from "./answer";
import { COUNTRIES } from "./countries";

describe("normalize", () => {
  test("ignores case, accents, spaces and punctuation", () => {
    expect(normalize("Japón")).toBe("japon");
    expect(normalize("Washington D. C.")).toBe(normalize("washington dc"));
    expect(normalize("Åland")).toBe("aland");
  });
});

describe("check: countries", () => {
  test("exact answers, with or without accents", () => {
    expect(check("Japón", "jp", "name")).toBe("exact");
    expect(check("japon", "jp", "name")).toBe("exact");
  });

  test("small typos are close", () => {
    expect(check("Autralia", "au", "name")).toBe("close");
    expect(check("Argentna", "ar", "name")).toBe("close");
  });

  test("another country's name is wrong, however similar", () => {
    expect(check("Austria", "au", "name")).toBe("wrong");
    expect(check("Irak", "ir", "name")).toBe("wrong");
    expect(check("Niger", "ng", "name")).toBe("wrong");
    expect(check("Eslovenia", "sk", "name")).toBe("wrong");
    expect(check("Guinea", "gw", "name")).toBe("wrong");
  });

  test("empty or unrelated input is wrong", () => {
    expect(check("", "fr", "name")).toBe("wrong");
    expect(check("   ", "fr", "name")).toBe("wrong");
    expect(check("Brasil", "fr", "name")).toBe("wrong");
  });

  test("parenthesized names and aliases", () => {
    expect(check("Birmania", "mm", "name")).toBe("exact");
    expect(check("Myanmar", "mm", "name")).toBe("exact");
    for (const alias of ["Estados Unidos", "EE. UU.", "EEUU", "USA", "Estados Unidos de América"]) {
      expect(check(alias, "us", "name")).toBe("exact");
    }
    expect(check("Holanda", "nl", "name")).toBe("exact");
  });

  test("names aren't split on 'y'", () => {
    expect(check("Trinidad", "tt", "name")).toBe("wrong");
    expect(check("Trinidad y Tobago", "tt", "name")).toBe("exact");
  });

  test("leading 'Islas' can be left out", () => {
    expect(check("Malvinas", "fk", "name")).toBe("exact");
    expect(check("Islas Malvinas", "fk", "name")).toBe("exact");
  });
});

describe("check: capitals", () => {
  test("any of several capitals is accepted", () => {
    expect(check("Sucre", "bo", "capital")).toBe("exact");
    expect(check("La Paz", "bo", "capital")).toBe("exact");
    expect(check("Pretoria", "za", "capital")).toBe("exact");
    expect(check("Bloemfontein", "za", "capital")).toBe("exact");
    expect(check("Stanley", "fk", "capital")).toBe("exact");
  });

  test("annotations in parentheses are ignored", () => {
    expect(check("Brades", "ms", "capital")).toBe("exact");
    expect(check("Ramala", "ps", "capital")).toBe("exact");
  });

  test("'Ciudad de' is optional", () => {
    expect(check("México", "mx", "capital")).toBe("exact");
    expect(check("Ciudad de México", "mx", "capital")).toBe("exact");
  });

  test("Spanish and English spellings", () => {
    expect(check("Pekín", "cn", "capital")).toBe("exact");
    expect(check("Beijing", "cn", "capital")).toBe("exact");
    expect(check("Washington DC", "us", "capital")).toBe("exact");
  });

  test("typos are close, other capitals are wrong", () => {
    expect(check("Canbera", "au", "capital")).toBe("close");
    expect(check("Kingston", "vc", "capital")).toBe("wrong");
  });

  test("shared capitals still accept typos", () => {
    expect(check("Londre", "gb", "capital")).toBe("close");
  });
});

test("every country has an accepted name, and every capital an answer", () => {
  for (const c of COUNTRIES) {
    expect(accepted(c, "name").length).toBeGreaterThan(0);
    if (c.capital) expect(accepted(c, "capital").length).toBeGreaterThan(0);
  }
});
