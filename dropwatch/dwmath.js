/* Dropwatch money math: the JS twin of engine/fees.py and engine/grading_roi.py.
 * Works in the browser (window.DWMath) and in Node (tests). Nothing here fetches or guesses a price.
 * tests/fixtures/calc_cases.json runs through this file AND the Python one; they must agree to the cent. */
(function (root) {
  'use strict';
  function r2(x) { return Math.floor(x * 100 + 0.5) / 100; }   /* half-up, same as Python r2() */

  function tieredPctFee(sale, p, thresholdBase) {
    var rule = p.threshold_rule;
    if (rule) { var tb = thresholdBase == null ? sale : thresholdBase; return sale * (tb >= rule.at_least ? rule.pct_high : rule.pct_low) / 100; }
    var tiers = p.tiers.slice().sort(function (a, b) { return a.from - b.from; });
    var fee = 0;
    for (var i = 0; i < tiers.length; i++) {
      var lo = tiers[i].from, hi = i + 1 < tiers.length ? tiers[i + 1].from : Infinity;
      if (sale > lo) fee += (Math.min(sale, hi) - lo) * tiers[i].pct / 100;
    }
    return fee;
  }
  /* a typed percentage, or the preset default when none was typed: never negative, never over 100 (same as Python _pct_or) */
  function pctOr(v, d) {
    var x = (v == null) ? d : v; x = +x;
    if (!isFinite(x) || x < 0) return 0;
    return Math.min(x, 100);
  }

  /* Everything the marketplace keeps from one sale, in CAD. overridePct / overrideExtraPct = the user typed their own.
     buyerTaxPct: tax the marketplace collects from the buyer; eBay.ca takes its % (and its C$150 sneaker line and
     per-order fee) on the total INCLUDING that tax. feeTaxPct: tax charged to YOU on the marketplace's fees
     (eBay.ca: GST, plus HST/PST where it applies). Both default to the preset's own default. */
  function sellerFees(sale, p, fx, overridePct, overrideExtraPct, buyerTaxPct, feeTaxPct) {
    fx = fx || 1;
    if (!(sale > 0)) return { pct_fee: 0, flat_fee: 0, extra_fee: 0, fee_tax: 0, total: 0 };
    var gp = p.gross_base || [], has = function (k) { return gp.indexOf(k) >= 0; };
    var bt = gp.length ? pctOr(buyerTaxPct, p.buyer_tax_default || 0) : 0;
    var gross = sale * (1 + bt / 100);
    var thBase = has('threshold') ? gross : sale;
    var pctFee;
    if (overridePct != null) pctFee = sale * overridePct / 100;
    else {
      pctFee = tieredPctFee(has('pct') ? gross : sale, p, thBase);
      if (p.pct_cap != null) pctFee = Math.min(pctFee, p.pct_cap * (p.pct_cap_currency === 'USD' ? fx : 1));
      if (p.pct_min != null) pctFee = Math.max(pctFee, p.pct_min * (p.pct_min_currency === 'USD' ? fx : 1));
    }
    var extraPct = (overrideExtraPct != null) ? overrideExtraPct : (p.extra_pct || 0);
    var extra = (has('extra') ? gross : sale) * extraPct / 100;
    var flat = 0, rule = p.threshold_rule;
    var waived = rule && thBase >= rule.at_least && rule.flat_when_high === false;
    if (!waived && p.flat_under != null) {
      var th = p.flat_threshold == null ? 10 : p.flat_threshold, fb = has('flat') ? gross : sale;
      var raw = fb <= th ? p.flat_under : (p.flat_over != null ? p.flat_over : p.flat_under);
      if (raw) flat = raw * (p.flat_currency === 'USD' ? fx : 1);
    }
    var ft = pctOr(feeTaxPct, p.fee_tax_default || 0);
    var a = r2(pctFee), b = r2(flat), c = r2(extra), t = r2((a + b + c) * ft / 100);
    return { pct_fee: a, flat_fee: b, extra_fee: c, fee_tax: t, total: r2(a + b + c + t) };
  }

  /* Cost in CAD, tax included. Tax applies to price + inbound shipping + extras. */
  function landedCost(o) {
    var base = o.buy || 0;
    if (o.buyCurrency === 'USD') base = base * (o.fx || 1) * (1 + (o.fxMarkupPct || 0) / 100);
    var taxable = base + (o.shipIn || 0) + (o.extraIn || 0);
    return r2(taxable * (1 + (o.taxPct || 0) / 100));
  }

  function breakevenSale(cost, p, shipOut, fx, overridePct, overrideExtraPct, buyerTaxPct, feeTaxPct) {
    function netAt(s) { return s - sellerFees(s, p, fx, overridePct, overrideExtraPct, buyerTaxPct, feeTaxPct).total - (shipOut || 0); }
    if (cost <= 0) return 0;
    var hi = Math.max(cost * 2, 10), ok = false;
    for (var i = 0; i < 40; i++) { if (netAt(hi) >= cost) { ok = true; break; } hi *= 2; }
    if (!ok) return null;
    var lo = 0;
    for (var j = 0; j < 60; j++) { var mid = (lo + hi) / 2; if (netAt(mid) >= cost) hi = mid; else lo = mid; }
    var be = Math.ceil(hi * 100 - 1e-9) / 100;
    /* fees are rounded to the cent, so take-home can stay flat for a cent or two: walk down to the true lowest cent */
    for (var k = 0; k < 5; k++) {
      var lower = Math.round((be - 0.01) * 100) / 100;
      if (lower > 0 && netAt(lower) >= cost - 1e-9) be = lower; else break;
    }
    return be;
  }

  /* Lowest sale price that leaves `target` in your pocket (after fees and shipping out); null if fees make it unreachable. */
  function priceForProfit(cost, target, p, shipOut, fx, overridePct, overrideExtraPct, buyerTaxPct, feeTaxPct) {
    return breakevenSale(cost + Math.max(0, target || 0), p, shipOut, fx, overridePct, overrideExtraPct, buyerTaxPct, feeTaxPct);
  }

  /* A typed number, made safe: not a number / negative -> 0, absurdly large -> max (so a stray "1e999" cannot print "Infinity"). */
  var MAX_MONEY = 1e7, MAX_PCT = 100;
  function clampNum(v, max) {
    var n = +v;
    if (!isFinite(n) || n < 0) return isNaN(n) || n < 0 ? 0 : (max == null ? MAX_MONEY : max);
    return Math.min(n, max == null ? MAX_MONEY : max);
  }

  /* o: {buy, sale, preset, taxPct, shipIn, extraIn, shipOut, buyCurrency, fx, fxMarkupPct, overridePct, overrideExtraPct}
     known:false when there is no resale price: never a guess. */
  function evaluate(o) {
    var cost = landedCost(o);
    if (!(o.sale > 0)) return { known: false, cost: cost };
    var fees = sellerFees(o.sale, o.preset, o.fx, o.overridePct, o.overrideExtraPct, o.buyerTaxPct, o.feeTaxPct);
    var net = r2(o.sale - fees.total - (o.shipOut || 0));
    var profit = r2(net - cost);
    var roi = cost ? r2(profit / cost) : null;
    return { known: true, cost: cost, fees: fees, net: net, profit: profit, roi: roi,
      breakeven: breakevenSale(cost, o.preset, o.shipOut, o.fx, o.overridePct, o.overrideExtraPct, o.buyerTaxPct, o.feeTaxPct) };
  }

  function whatIfLower(o, drops) {
    drops = drops || [0.10, 0.20, 0.30];
    return drops.map(function (d) {
      var s = r2(o.sale * (1 - d)), copy = {};
      for (var k in o) copy[k] = o[k];
      copy.sale = s;
      return { drop: d, sale: s, profit: evaluate(copy).profit };
    });
  }

  /* ---- grading: raw -> graded, Canada-aware. Mirrors engine/grading_roi.py ---- */
  function gradingCost(g) {
    var usd = (g.gradingFeeUsd == null ? 25 : g.gradingFeeUsd) + (g.shipRoundtripUsd == null ? 20 : g.shipRoundtripUsd);
    return r2(usd * g.fx * (1 + (g.fxMarkup == null ? 0.025 : g.fxMarkup)));
  }
  /* g: {rawCostCad, gradeValuesCad:{label:value|null}, gradeOdds:{label:prob}, gradingFeeUsd, shipRoundtripUsd, fx, fxMarkup, marketplaceFee, paymentFee, shipOutCad} */
  function gradingEvaluate(g) {
    var mf = g.marketplaceFee == null ? 0.13 : g.marketplaceFee, pf = g.paymentFee == null ? 0.029 : g.paymentFee;
    var gc = gradingCost(g), allIn = r2(g.rawCostCad + gc), outcomes = [];
    Object.keys(g.gradeValuesCad).forEach(function (grade) {
      var v = g.gradeValuesCad[grade], prob = +(g.gradeOdds[grade] || 0);
      if (v == null) { outcomes.push({ grade: grade, value: null, probability: prob, net: null, profit: null }); return; }
      var net = g.preset ? r2(v - sellerFees(v, g.preset, g.fx).total - (g.shipOutCad || 0))   /* a marketplace preset replaces the flat fee guess */
                         : r2(v * (1 - mf - pf) - (g.shipOutCad || 0));
      outcomes.push({ grade: grade, value: v, probability: prob, net: net, profit: r2(net - allIn) });
    });
    var priced = outcomes.filter(function (o) { return o.profit != null; });
    if (!priced.length) return { known: false, allIn: allIn, gradingCost: gc, outcomes: outcomes,
      verdict: "No real graded sold prices: we won't guess what it grades to." };
    var oddsSum = priced.reduce(function (a, o) { return a + o.probability; }, 0);
    var expected = r2(priced.reduce(function (a, o) { return a + o.probability * o.profit; }, 0));
    var profitable = priced.filter(function (o) { return o.profit >= 0; }).sort(function (a, b) { return (a.value || 0) - (b.value || 0); });
    var breakEven = profitable.length ? profitable[0].grade : null;
    var best = priced.reduce(function (a, o) { return o.profit > a.profit ? o : a; });
    var worst = priced.reduce(function (a, o) { return o.profit < a.profit ? o : a; });
    var verdict;
    if (expected <= 0) verdict = 'Likely NOT worth grading: expected ' + expected.toFixed(2) + ' CAD after fees, FX and the round trip. Only profits if it grades ' + best.grade + '.';
    else if (breakEven == null) verdict = 'Even the best case loses money after all costs: skip grading.';
    else verdict = 'Worth a look: about +' + expected.toFixed(2) + ' CAD expected, break-even at ' + breakEven + '. Downside if it grades ' + worst.grade + ': ' + worst.profit.toFixed(2) + ' CAD.';
    return { known: true, allIn: allIn, gradingCost: gc, outcomes: outcomes, expected: expected, breakEven: breakEven,
      worst: worst, best: best, oddsSum: r2(oddsSum), verdict: verdict };
  }

  var api = { r2: r2, sellerFees: sellerFees, landedCost: landedCost, breakevenSale: breakevenSale, evaluate: evaluate,
    whatIfLower: whatIfLower, priceForProfit: priceForProfit, clampNum: clampNum, MAX_MONEY: MAX_MONEY, MAX_PCT: MAX_PCT, gradingCost: gradingCost, gradingEvaluate: gradingEvaluate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DWMath = api;
})(typeof window !== 'undefined' ? window : this);
