// Scores the ORIGINAL (pre-2026-11-19) engine against cases.js.
// Usage: node tests/permits/baseline-old.js <path-to-old-index.html>
"use strict";
const fs = require("fs");
const vm = require("vm");
const cases = require("./cases.js");
const html = fs.readFileSync(process.argv[2], "utf8");
const src = html.slice(html.indexOf("var PERMITS="), html.indexOf("function render()"));
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src + ";this.needed=needed;", ctx);
// Old keys -> common permit types
const MAP = {
  building: ["building"], development: ["development"], occupancy: ["occupancy"],
  electrical: ["electrical"], plumbing: ["plumbing"], mechanical: ["mechanical", "gas"],
  demolition: ["demolition"], sign: ["sign"], fire: ["fire"], food_health: ["food"],
  roofing: ["building"], excavation: ["excavation"], fence: ["fence"], pool: ["building"],
  secondary_suite: ["building", "development"], basement_dev: ["building"], garage: ["building"],
  street_use: ["street"], environmental: ["environmental"]
};
let pass = 0;
const rows = [];
for (const c of cases) {
  const r = ctx.needed(c.job, c.city);
  const got = new Set();
  const okSet = new Set([...(c.need || []), ...(c.allow || [])]);
  r.items.forEach((i) => {
    // Generous: the old single "Mechanical / HVAC / gas" card counts as whichever of the two the case wants.
    if (i.key === "mechanical") {
      const hit = ["gas", "mechanical"].filter((t) => okSet.has(t));
      (hit.length ? hit : ["mechanical"]).forEach((t) => got.add(t));
    } else MAP[i.key].forEach((t) => got.add(t));
  });
  let ok;
  if (c.none) ok = false; // the old tool never says "no permit needed" for a job
  else if (c.check) ok = got.size === 0; // it at least says "nothing matched, confirm with the city"
  else {
    const allowed = new Set([...(c.need || []), ...(c.allow || [])]);
    ok = c.need.every((t) => got.has(t)) && [...got].every((t) => allowed.has(t));
  }
  if (ok) pass++;
  rows.push(`${ok ? "PASS" : "FAIL"} #${c.id} [${c.city}] ${c.job} -> {${[...got].join(", ")}}`);
}
console.log(rows.join("\n"));
console.log(`\nOLD ENGINE: ${pass}/${cases.length} map to the right permits`);
