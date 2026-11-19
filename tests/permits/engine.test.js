// Unit tests for permits/engine.js.  Run: node --test tests/permits/
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const E = require("../../permits/engine.js");
const { judge } = require("./score.js");
const cases = require("./cases.js");
const holdout = require("./holdout.js");

for (const c of cases.concat(holdout)) {
  test(`job #${c.id} [${c.city}] ${c.job}`, () => {
    const j = judge(c);
    assert.ok(j.ok, `got {${j.got.join(", ")}} none:${j.none} check:${j.check}; need ${JSON.stringify(c.need || (c.none ? "none" : "check"))}`);
  });
}

test("dimensions: deck height and area", () => {
  const d = E.parseDims("12x16 deck about 4 ft off the ground");
  assert.ok(Math.abs(d.areaSqFt - 192) < 0.01);
  assert.ok(Math.abs(d.heightMm - 1219.2) < 0.1);
  assert.ok(Math.abs(E.parseDims("deck 600 mm high").heightMm - 600) < 0.01);
  assert.ok(Math.abs(E.parseDims("fence 1.8 m tall").heightMm - 1800) < 0.01);
  assert.ok(Math.abs(E.parseDims("3 x 4 m shed").areaSqFt - 129.17) < 0.1);
  assert.ok(Math.abs(E.parseDims("a 120 sq ft shed").areaSqFt - 120) < 0.01);
  assert.ok(Math.abs(E.parseDims("deck 3'6\" high").heightMm - 1066.8) < 0.1);
  assert.strictEqual(E.parseDims("ground level deck").heightMm, 300);
  assert.strictEqual(E.parseDims("a shed").areaSqFt, null);
});

test("Winnipeg deck at exactly 600 mm needs no permit; 601 mm does", () => {
  assert.strictEqual(E.check("deck 600 mm high in the backyard, 10x12", "Winnipeg").list.length, 0);
  assert.ok(E.check("deck 601 mm high in the backyard, 10x12", "Winnipeg").list.some((p) => p.type === "building"));
});

test("Winnipeg shed threshold is 10 m2 (108 sq ft)", () => {
  assert.strictEqual(E.check("shed 8x12", "Winnipeg").list.length, 0);
  const edge = E.check("shed 9x12", "Winnipeg"); // 108 sq ft = 10.03 m2: right on the line
  assert.strictEqual(edge.list.length, 0);
  assert.ok(edge.check.some((c) => /10 m²/.test(c.text)));
  assert.ok(E.check("shed 10x12", "Winnipeg").list.some((p) => p.type === "building"));
});

test("misspellings are understood", () => {
  assert.match(E.normalize("finsh basment with bathrom"), / finish basement with bathroom /);
  assert.match(E.normalize("bild a dek"), / build a deck /);
  // Real words are not "corrected" into project words
  assert.match(E.normalize("rebuild"), / rebuild /);
  assert.match(E.normalize("pole barn later"), / pole barn later /);
  assert.match(E.normalize("electric fireplace"), / electric fireplace /);
});

test("Winnipeg electrical permits come from the City, not Manitoba Hydro", () => {
  const p = E.check("rewire the house", "Winnipeg").list.find((x) => x.type === "electrical");
  assert.match(p.issuer, /City of Winnipeg/);
  assert.match(p.issuer, /not Manitoba Hydro/);
});

test("Other city mentions Manitoba Hydro for electrical outside Winnipeg", () => {
  const r = E.check("rewire the house", "Other");
  assert.ok(r.notes.some((n) => /Manitoba Hydro/.test(n.text)));
});

test("EV charger is flagged contractor-only in Winnipeg", () => {
  const p = E.check("ev charger", "Winnipeg").list.find((x) => x.type === "electrical");
  assert.ok(p.extra.some((x) => /licensed electrical contractor/.test(x)));
});

test("fences: Winnipeg says no permit and gives the height limits", () => {
  const r = E.check("fence", "Winnipeg");
  assert.strictEqual(r.list.length, 0);
  assert.match(r.none[0].text, /2\.0 m/);
  assert.match(r.none[0].text, /1\.2 m/);
});

test("unknown job: no permits invented, no 'no permit' claim", () => {
  const r = E.check("fix stuff around the house", "Winnipeg");
  assert.strictEqual(r.matched, false);
  assert.strictEqual(r.list.length, 0);
  assert.strictEqual(r.none.length, 0);
});

test("unknown city falls back to Other without throwing", () => {
  const r = E.check("deck", "Brandon");
  assert.strictEqual(r.city, "other");
  assert.ok(r.list.length > 0);
});

test("every permit card has a source; every source is an https official page", () => {
  const official = /^https:\/\/(www\.winnipeg\.ca|legacy\.winnipeg\.ca|www\.manitoba\.ca|gov\.mb\.ca|hydro\.mb\.ca|web2\.gov\.mb\.ca|www\.calgary\.ca|www\.edmonton\.ca)\//;
  for (const k of Object.keys(E.SOURCES)) assert.match(E.SOURCES[k].u, official, k);
  for (const city of ["Winnipeg", "Calgary", "Edmonton"]) {
    for (const job of cases.map((c) => c.job)) {
      for (const p of E.check(job, city).list) {
        for (const s of p.srcs) assert.ok(E.SOURCES[s], `unknown source ${s}`);
        for (const a of p.apply) if (a[1]) assert.match(a[1], /^https:\/\//);
      }
    }
  }
});

test("Winnipeg permits all have who-signs, where-to-apply and a source", () => {
  for (const job of cases.filter((c) => c.city === "Winnipeg").map((c) => c.job)) {
    for (const p of E.check(job, "Winnipeg").list) {
      assert.ok(p.who && p.who.length > 20, p.type + " who");
      assert.ok(p.apply.length > 0, p.type + " apply");
      assert.ok(p.srcs.length > 0, p.type + " src");
    }
  }
});

test("hostile input is treated as text", () => {
  const r = E.check('<img src=x onerror=alert(1)> deck "4 ft" high', "Winnipeg");
  assert.ok(r.list.length > 0);
  assert.doesNotThrow(() => E.check("x".repeat(20000), "Winnipeg"));
  assert.doesNotThrow(() => E.check(null, null));
});
