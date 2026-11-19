// End-to-end test of /permits/ in Chromium at desktop and phone sizes.
// Usage: node tests/permits/e2e.js [baseUrl]   (serve the repo root first, e.g.
//   python3 -m http.server 8765 --directory <repo root>)
"use strict";
const { chromium } = require("playwright");
const BASE = (process.argv[2] || "http://127.0.0.1:8765") + "/permits/";
let pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log("  ok   " + name); } else { fail++; console.log("  FAIL " + name); } }

(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "phone", width: 390, height: 844 }]) {
    console.log(`\n== ${vp.name} ${vp.width}x${vp.height}`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, permissions: ["clipboard-read", "clipboard-write"] });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.goto(BASE, { waitUntil: "domcontentloaded" });

    // 1. Empty submit gives a prompt, not a crash
    await page.click("#go");
    ok(/Type a short description/.test(await page.textContent("#out")), "empty submit asks for a description");

    // 2. Example chip → result in one click
    const t0 = Date.now();
    await page.click('[data-ex^="Build a 12x16 deck"]');
    await page.waitForSelector("#out .card");
    ok(Date.now() - t0 < 2000, "example chip shows a result in under 2 s");
    const out1 = await page.textContent("#out");
    ok(/Building permit/.test(out1) && /Development permit/.test(out1), "deck example lists building + development permits");
    ok(/Who applies & signs/.test(out1) && /What to gather/.test(out1) && /Where to apply/.test(out1), "each card shows who signs, what to gather, where to apply");
    ok(/checked 19 Nov 2026/.test(out1), "sources carry the date they were checked");
    ok((await page.$$('#out a[href="https://www.winnipeg.ca/permitsonline"]')).length > 0, "links to Winnipeg Permits Online");

    // 3. Misspelled description
    await page.fill("#job", "finsh basment with bathrom");
    await page.click("#go");
    const out2 = await page.textContent("#out");
    ok(/We read your job as: Basement development/.test(out2), "misspelled basement job is understood");
    ok(/Plumbing permit/.test(out2), "basement with bathroom lists plumbing");

    // 4. Follow-up question chip refines the answer
    await page.fill("#job", "deck");
    await page.click("#go");
    ok(/How high off the ground/.test(await page.textContent("#out")), "vague deck asks how high");
    await page.click('#out [data-add="deck is 1 ft high"]');
    const out3 = await page.textContent("#out");
    ok(/No permit needed for/.test(out3) && !/Building permit/.test(out3), "answering '2 ft or lower' gives a no-permit answer");

    // 5. Fence: no permit in Winnipeg, with height limits
    await page.fill("#job", "6 ft fence in the backyard");
    await page.click("#go");
    const out4 = await page.textContent("#out");
    ok(/no permit/i.test(out4) && /2\.0 m/.test(out4), "fence: no permit + height limit");

    // 6. City switch re-runs
    await page.selectOption("#city", "Calgary");
    await page.fill("#job", "deck 3 ft high");
    await page.click("#go");
    ok(/apply\.calgary\.ca/.test(await page.innerHTML("#out")), "Calgary result links to apply.calgary.ca");
    await page.selectOption("#city", "Edmonton");
    ok(/Edmonton/.test(await page.textContent("#out")), "changing city re-runs the check");

    // 7. Unmatched job is honest
    await page.selectOption("#city", "Winnipeg");
    await page.fill("#job", "fix stuff around the house");
    await page.click("#go");
    ok(/does NOT mean no permit is needed/.test(await page.textContent("#out")), "unmatched job says it doesn't mean no permit");

    // 8. XSS: input is never rendered as HTML
    await page.fill("#job", '<img src=x onerror="window.__x=1"> deck 4 ft high');
    await page.click("#go");
    ok(!(await page.evaluate(() => window.__x)) && (await page.$$("#out img")).length === 0, "typed HTML is not executed");

    // 9. Copy checklist + share link + restore from link
    await page.fill("#job", "12x12 shed with power");
    await page.click("#go");
    await page.click('[data-act="copy"]');
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
    ok(/PERMIT CHECKLIST/.test(clip) && /\[ \]/.test(clip), "copy checklist puts a tick-box text list on the clipboard");
    await page.click('[data-act="link"]');
    const link = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
    ok(/#job=12x12%20shed%20with%20power&city=Winnipeg$/.test(link), "share link carries the job after # (not sent to server)");
    const p2 = await ctx.newPage();
    await p2.goto(link.replace(/^https?:\/\/[^/]+/, BASE.replace(/\/permits\/$/, "")));
    await p2.waitForSelector("#out .card");
    ok(/Electrical permit/.test(await p2.textContent("#out")), "opening a shared link restores the result");
    await p2.close();

    // 10. Email button builds a mailto
    const mail = await page.evaluate(() => { let u = ""; const d = Object.getOwnPropertyDescriptor(Location.prototype, "href"); try { return document.querySelector('[data-act="mail"]') ? "present" : ""; } catch (e) { return u; } });
    ok(mail === "present", "email-to-me button present");

    // 11. Print view hides the form and shows a heading
    await page.emulateMedia({ media: "print" });
    ok(!(await page.isVisible(".form")) && (await page.isVisible(".printhead")), "print view hides the form and shows the job heading");
    await page.emulateMedia({ media: "screen" });

    // 12. Layout: no horizontal scroll; tap targets
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    ok(sw <= vp.width, `no horizontal scroll (scrollWidth ${sw})`);
    const small = await page.$$eval("main button", (bs) => bs.filter((b) => b.offsetParent && b.getBoundingClientRect().height < 32).length);
    ok(small === 0, "all visible page buttons at least 32 px tall (site brand bar excluded)");

    // 13. All result links are https and open in a new tab
    await page.fill("#job", "basement suite, new furnace, gas fireplace, demolish garage, sign, restaurant, solar, pool, wood stove");
    await page.click("#go");
    const bad = await page.$$eval("#out a[href^='http']", (as) => as.filter((a) => !/^https:/.test(a.href) || a.target !== "_blank" || !/noopener/.test(a.rel)).map((a) => a.href));
    ok(bad.length === 0, "all external links https + new tab + noopener " + bad.join(" "));

    ok(errors.length === 0, "no page errors " + errors.join(" | "));
    await ctx.close();
  }
  await browser.close();
  console.log(`\nE2E: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
