// Scores the CURRENT engine (permits/engine.js) against cases.js and prints a table.
// Usage: node tests/permits/score.js
"use strict";
const E = require("../../permits/engine.js");
const cases = require("./cases.js");

function textOf(r) {
  const parts = [];
  r.list.forEach((p) => parts.push(p.name, p.who, p.issuer, ...p.why, ...p.extra));
  r.none.concat(r.check, r.notes).forEach((n) => parts.push(n.text));
  return parts.join(" ").toLowerCase();
}
function judge(c) {
  const r = E.check(c.job, c.city);
  const got = new Set(r.list.map((p) => p.type));
  const allowed = new Set([...(c.need || []), ...(c.allow || [])]);
  let ok;
  if (c.none) ok = got.size === 0 && r.none.length > 0;
  else if (c.check) ok = [...got].every((t) => allowed.has(t)) && (r.check.length > 0 || !r.matched);
  else ok = c.need.every((t) => got.has(t)) && [...got].every((t) => allowed.has(t));
  if (ok && c.flag) ok = textOf(r).includes(c.flag);
  return { ok, got: r.list.map((p) => p.type + (p.status === "if" ? "?" : "")), none: r.none.length, check: r.check.length };
}
module.exports = { judge, cases };
if (require.main === module) {
  let pass = 0;
  for (const c of cases) {
    const j = judge(c);
    if (j.ok) pass++;
    console.log(`${j.ok ? "PASS" : "FAIL"} #${c.id} [${c.city}] ${c.job} -> {${j.got.join(", ")}}${j.none ? " no-permit:" + j.none : ""}${j.check ? " check:" + j.check : ""}`);
  }
  console.log(`\nNEW ENGINE: ${pass}/${cases.length} map to the right permits`);
}
