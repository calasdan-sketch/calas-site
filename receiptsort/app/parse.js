/* ReceiptSort's reading rules, ported from receiptsort.py (2026-09-28) so it runs
 * in any browser: Windows, Mac, iPhone, Android. Rule: never guess. A field it
 * isn't sure about stays blank and the row is marked "needs review".
 * 2026-10-26 (app-fixes): the total now comes ONLY from a "total" line (no more
 * falling back to the biggest number), and a row is "ok" only when the numbers
 * agree with each other. Foreign-currency receipts are flagged and never added
 * into the CAD totals.
 * Works as a browser script (window.RSParse) and as a Node module (tests).
 */
(function (root) {
  'use strict';
  // Money: 12.47  1,234.56  4,80  1.234,56  (needs exactly two decimals; dates are masked out first)
  var MONEY = /(?<![\d.,])(\d{1,3}(?:[.,]\d{3})+[.,]\d{2}|\d+[.,]\d{2})(?!\d)(?![.,]\d)/g;
  // 2026-11-19: also 2026/10/15 and 2026.10.15, month words in capitals or joined to the numbers (NOV 13 2026, 13-NOV-2026, 13NOV26),
  // two-digit years after a month word, and ordinal days (Nov 3rd, 2026). Ported from the live site's 2026-11-13 fixes.
  var DATE_PATTERNS = [
    [/\b(\d{4})[-\/.]\s?(\d{1,2})[-\/.]\s?(\d{1,2})\b/, 'ymd'],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, 'mdy_or_dmy'],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{2})\b/, 'mdy2'],
    [/\b(\d{1,2})[.\-](\d{1,2})[.\-](\d{4})\b/, 'dmy_dotted'],
    [/\b([A-Za-zÀ-ÿ]{3,9})\.?[\s\-\/]?(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|[\s\-\/]{1,2})(\d{4}|\d{2})(?![.,:]?\d)/, 'mon_d_y'],
    [/\b(\d{1,2})(?:er)?[\s\-\/]?([A-Za-zÀ-ÿ]{3,9})\.?[\s\-\/,]{0,2}(\d{4}|\d{2})(?![.,:]?\d)/, 'd_mon_y']
  ];
  // Used to blank dates out of a line before looking for money, so 21.10.2026 is never read as 21.10.
  var DATE_MASK = /\b\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}\b|\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/g;
  var WORD_DATE_MASK = /\b[A-Za-zÀ-ÿ]{3,9}\.?[\s\-\/]?\d{1,2}(?:st|nd|rd|th)?(?:,\s*|[\s\-\/]{1,2})(?:\d{4}|\d{2})(?![.,:]?\d)|\b\d{1,2}(?:er)?[\s\-\/]?[A-Za-zÀ-ÿ]{3,9}\.?[\s\-\/,]{0,2}(?:\d{4}|\d{2})(?![.,:]?\d)/g;
  // English and French month words (whole words only, so "Marketing 12, 2026" is not March). Accents are removed before matching.
  var MONTH_RX = [/^jan(uary|vier|v)?$/, /^(feb(ruary)?|fev(r|rier)?)$/, /^mar(ch|s)?$/, /^(apr(il)?|avr(il)?)$/, /^(may|mai)$/, /^(jun(e)?|juin)$/, /^(jul(y)?|juil(let)?)$/, /^(aug(ust)?|aout)$/, /^sep(t(ember|embre)?)?$/, /^oct(ober|obre)?$/, /^nov(ember|embre)?$/, /^dec(ember|embre)?$/];
  function monthNum(w) {
    var s = String(w).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\.$/, '');
    for (var i = 0; i < 12; i++) if (MONTH_RX[i].test(s)) return i + 1;
    return 0;
  }
  // Rounding allowance when subtotal + taxes (+ tip) is compared with the total: one cent (each printed tax line is rounded on its own). Was two cents before round 5:
  // a subtotal that was misread by 2 cents then passed as OK (found by the seeded property test in round5.test.cjs).
  var ADD_TOL = 0.011;
  var TOTAL_WORDS = /\b(grand\s*total|total\s*(?:due|paid|amount)?|amount\s*due|balance\s*due|netto\s*total|montant\s*(?:total|d[ûu])|total\s*[àa]\s*payer|total\s*g[ée]n[ée]ral)\b/i;
  var TOTAL_EXCLUDE = /total\s*(savings?|saved|discounts?|items?|qty|points|rewards)/i;
  var TOTAL_TAX = /\b(total|sum)\s*(of\s*)?(taxes|tax|gst|hst|pst|qst|tps|tvq|tva|vat)\b|\b(taxes|tax|gst|hst|pst|qst)\s*total\b/i;
  var SUBTOTAL_WORDS = /\b(sub\s*-?\s*total|sous[\s-]*total|s\/total|net|netto)\b/i;
  var PST_WORDS = /\b(pst|rst|qst|tvq|rpt)\b/i;
  var GST_WORDS = /\b(gst|hst|gst\/hst|tps)\b/i;
  var SALESTAX_WORDS = /\b(sales\s*tax|vat|tva|mwst|tax(?:es)?)\b/i;
  var TIP_WORDS = /\b(tip|gratuity|pourboire)\b/i;
  var REFUND_WORDS = /\b(refund|return(?:ed)?|credit\s*note|void)\b/i;
  var SKIP_VENDOR = /^(receipt|invoice|tax invoice|thank you|welcome|store|customer copy|\W*)$/i;
  var PHONE = /\(?\d{3}\)?[-. ]?\d{3}[-. ]\d{4}/;   // 204-555-1234, (204) 555-1234, (204)555-1234
  // Vendor/line keyword -> expense category. Canada-aware. First match wins; else Uncategorized.
  var CATEGORIES = [
    ['Fuel', /\b(petro[- ]?can(?:ada)?|petrocanada|shell|esso|husky|chevron|ultramar|pioneer|co-?op gas|gas bar|fuel|diesel|flying j|pilot|cardlock|mobil)\b/i],
    ['Meals & Entertainment', /\b(restaurant|caf[e\u00e9]|coffee|tim hortons|mcdonald|subway|pizza|grill|diner|starbucks|a&w|wendy|burger|pub|bistro|donair|kfc|taco|bakery|deli)\b/i],
    ['Vehicle & Repairs', /\b(napa|auto parts|tire|mechanic|oil change|lube|muffler|transmission|collision|kal tire|fountain tire|canadian tire auto|autobody)\b/i],
    ['Travel & Lodging', /\b(hotel|motel|\binn\b|airbnb|air canada|westjet|flair|uber|lyft|taxi|parking|impark|via rail|greyhound|lodge|suites|expedia)\b/i],
    ['Office & Supplies', /\b(staples|office suppl(?:y|ies)|stationery|office depot|office outlet|amazon|walmart|costco|dollarama|dollar tree|best buy|the source|indigo)\b/i],
    ['Hardware & Materials', /\b(home depot|\brona\b|lowe'?s|canadian tire|princess auto|home hardware|hardware|lumber|building suppl(?:y|ies)|\bkent\b|windsor plywood|acklands)\b/i],
    ['Utilities & Telecom', /\b(rogers|\bbell\b|telus|\bshaw\b|hydro|mts|internet|mobility|\bfido\b|koodo|virgin|eastlink)\b/i],
    ['Shipping & Postage', /\b(canada post|courier|freight|parcel|\bups\b|fedex|purolator|\bdhl\b|postage|stamps)\b/i],
    ['Software & Subscriptions', /\b(google|microsoft|adobe|godaddy|\bzoom\b|dropbox|intuit|quickbooks|\bxero\b|shopify|subscription|saas|notion|slack)\b/i]
  ];
  function categorize(vendor, text) {
    var hay = ((vendor || '') + ' ' + (text || '')).toLowerCase();
    for (var i = 0; i < CATEGORIES.length; i++) { if (CATEGORIES[i][1].test(hay)) return CATEGORIES[i][0]; }
    return 'Uncategorized';
  }

  // "12.47" "1,234.56" "4,80" "1.234,56" -> number. The LAST separator (always followed by two digits) is the decimal.
  function money(s) {
    s = String(s).trim();
    var m = /^(.*)([.,])(\d{2})$/.exec(s);
    if (!m) { var v0 = parseFloat(s.replace(/,/g, '')); return isNaN(v0) ? null : v0; }
    var v = parseFloat(m[1].replace(/[.,]/g, '') + '.' + m[3]);
    return isNaN(v) ? null : v;
  }
  // OCR often reads a 0 as O or a copyright sign, 1 as l/I, 5 as S in a price. Only repaired when the token
  // is otherwise a price (digits plus a 2-digit tail), and the sum check still has to pass before the row is "ok".
  var DIGIT_FIX = { O: '0', o: '0', '\u00a9': '0', '\u00ae': '0', l: '1', I: '1', '|': '1', S: '5', B: '8' };
  function repairDigits(line) {
    return String(line).replace(/(?<![A-Za-z0-9])([0-9OolI|S\u00a9\u00ae]{1,6}[.,][0-9OolIS\u00a9\u00ae]{2})(?![A-Za-z0-9])/g, function (tok) {
      if (!/[0-9]/.test(tok.replace(/[.,]/g, '')) && tok.replace(/[.,]/g, '').length < 3) return tok; // "ll.ll" stays words
      var t = tok.replace(/[OolI|S\u00a9\u00ae]/g, function (c) { return DIGIT_FIX[c]; });
      return t;
    });
  }
  function maskDates(s) {
    // word dates are blanked only when the word really is a month ("item 2 1099.00" keeps its price)
    return String(s).replace(DATE_MASK, ' ').replace(WORD_DATE_MASK, function (m) { var w = m.match(/[A-Za-z\u00C0-\u00FF]{3,9}/); return w && monthNum(w[0]) ? ' ' : m; });
  }
  function allMoney(s) {
    var out = [], m, t = maskDates(s); MONEY.lastIndex = 0;
    while ((m = MONEY.exec(t))) { var v = money(m[1]); if (v !== null) out.push(v); }
    return out;
  }
  function usesCommaDecimal(s) {
    var m, t = maskDates(s), found = false; MONEY.lastIndex = 0;
    while ((m = MONEY.exec(t))) { if (/,\d{2}$/.test(m[1])) found = true; }
    return found;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function validDate(y, mo, d) {
    var t = new Date(Date.UTC(y, mo - 1, d));
    return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? y + '-' + pad(mo) + '-' + pad(d) : null;
  }

  function parseDate(text) {
    text = String(text).replace(/[ \t\u00a0]+/g, ' ');   // PDFs and OCR often put several spaces between words ("Jan   21, 2026")
    for (var i = 0; i < DATE_PATTERNS.length; i++) {
      var kind = DATE_PATTERNS[i][1], m = DATE_PATTERNS[i][0].exec(text);
      if (m && (kind === 'mon_d_y' || kind === 'd_mon_y')) {   // keep looking past a look-alike such as "item 2 2026"
        var rx = new RegExp(DATE_PATTERNS[i][0].source, 'g'), mm;
        m = null; while ((mm = rx.exec(text))) { if (monthNum(mm[kind === 'mon_d_y' ? 1 : 2])) { m = mm; break; } }
      }
      if (!m) continue;
      var y, mo, d, a, b;
      if (kind === 'ymd') { y = +m[1]; mo = +m[2]; d = +m[3]; }
      else if (kind === 'mdy_or_dmy' || kind === 'mdy2' || kind === 'dmy_dotted') {
        a = +m[1]; b = +m[2]; y = kind === 'mdy2' ? 2000 + (+m[3]) : +m[3];
        if (a > 12 && b <= 12) { d = a; mo = b; }
        else if (b > 12 && a <= 12) { mo = a; d = b; }
        else return null; // ambiguous, e.g. 03/04/2026 or 03.04.2026: don't guess
      } else if (kind === 'mon_d_y') { mo = monthNum(m[1]); d = +m[2]; y = +m[3]; if (!mo) continue; }
      else { d = +m[1]; mo = monthNum(m[2]); y = +m[3]; if (!mo) continue; }
      if (y < 100) y += 2000;
      if (y < 2000 || y > new Date().getUTCFullYear() + 1) return null; // OCR slip such as 9025-01-18: leave blank, never guess
      var ok = validDate(y, mo, d);
      if (ok) return ok;
    }
    return null;
  }

  // The last amount on a line. A minus sign stuck to it ("-12.50", "-$12.50", "12.50-") or brackets ("(12.50)") make it negative:
  // that is how refunds and returns are printed. A dash with a space before the number ("TOTAL - 22.47") is only a separator.
  function amountOnLine(line) {
    var t = maskDates(repairDigits(line)), m, last = null; MONEY.lastIndex = 0;
    while ((m = MONEY.exec(t))) last = { s: m[1], at: m.index, end: m.index + m[0].length };
    if (!last) return null;
    var v = money(last.s); if (v === null) return null;
    var before = t.slice(Math.max(0, last.at - 2), last.at), after = t.slice(last.end, last.end + 1);
    if (/-\$?$/.test(before) || after === '-' || (/\(\$?$/.test(before) && after === ')')) v = -v;
    return v;
  }
  // A number on a labelled line that lost its decimal point ("GST 5% 513" for 5.13, "TOTAL 2614" for 26.14): the dot is the smallest
  // mark on a receipt and the photo reader drops it. Kept only as a candidate in cents; it is used only when the sum then checks to the cent.
  function bareCents(line) {
    var t = maskDates(String(line));
    if (/#/.test(t) || allMoney(repairDigits(t)).length) return null;
    var m = /(?:^|\s)\$?(\d{3,6})\s*$/.exec(t);
    return m ? +m[1] / 100 : null;
  }
  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  // Canadian rates, used only to CHECK a number worked out from others (never to invent one). GST 5%; HST 13% (ON), 14% (NS since
  // 1 April 2025), 15% (NB, NL, PE); PST/RST: SK 6%, MB 7%, BC 7%; QST 9.975%. A tax line can be off by a cent from rounding.
  var GST_RATES = [0.05, 0.13, 0.14, 0.15];
  var PST_RATES = [0.06, 0.07, 0.09975];
  function isRateOf(tax, base, rates) {
    if (typeof tax !== 'number' || typeof base !== 'number' || !base) return false;
    return rates.some(function (k) { return Math.abs(Math.abs(base) * k - Math.abs(tax)) <= ADD_TOL; });
  }
  function rateLabel(tax, base, rates) {
    for (var i = 0; i < rates.length; i++) if (Math.abs(Math.abs(base) * rates[i] - Math.abs(tax)) <= ADD_TOL) return String(round2(rates[i] * 100)).replace(/\.?0+$/, '') + '%';
    return '';
  }
  function taxSum(r) { return (r.gst || 0) + (r.pst || 0) + (r.salesTax || 0); }
  function addsUp(r) {
    if (r.subtotal === null || r.total === null) return false;
    var s = r.subtotal + taxSum(r);
    return Math.abs(s - r.total) <= ADD_TOL || (r.tip !== null && Math.abs(s + r.tip - r.total) <= ADD_TOL);
  }
  // When the numbers as read do not add up, two careful repairs. Both must pass the sum check to the cent; taxes must also match a real rate.
  // 1. Lost decimal points (see bareCents): put back -> row can be OK, because every figure was read and they agree.
  // 2. One tax line whose label was read but whose amount was not (or was misread and is not a real rate): worked out as
  //    total - subtotal - other taxes, kept only if it is exactly a Canadian rate of the subtotal. The row stays "Check this".
  // 3. Tax-included receipts (fuel, coffee) print no subtotal: if the GST is exactly a rate of (total - GST), that is the subtotal.
  function repairAmounts(r) {
    var fields = ['subtotal', 'gst', 'pst', 'salesTax', 'total'], filled = [];
    if (!addsUp(r)) {
      var trial = {}; Object.keys(r).forEach(function (k) { trial[k] = r[k]; });
      fields.forEach(function (f) { if (trial[f] === null && r.bare[f] !== null && r.bare[f] !== undefined) { trial[f] = r.bare[f]; filled.push(f); } });
      if (filled.length && addsUp(trial) && (filled.indexOf('gst') < 0 || isRateOf(trial.gst, trial.subtotal, GST_RATES)) && (filled.indexOf('pst') < 0 || isRateOf(trial.pst, trial.subtotal, PST_RATES))) {
        filled.forEach(function (f) { r[f] = trial[f]; }); r.repaired = filled;
      }
    }
    if (!addsUp(r) && r.subtotal !== null && r.total !== null) {
      [['gst', GST_RATES, 'GST/HST'], ['pst', PST_RATES, 'PST/QST']].some(function (x) {
        var f = x[0], other = f === 'gst' ? 'pst' : 'gst';
        if (!r.seen[f] || (r[f] !== null && isRateOf(r[f], r.subtotal, x[1]))) return false;
        if (r[other] !== null && !isRateOf(r[other], r.subtotal, other === 'gst' ? GST_RATES : PST_RATES)) return false;
        var rest = r.subtotal + (r[other] || 0) + (r.salesTax || 0);
        return [0, r.tip || 0].some(function (tip) {
          var d = round2(r.total - rest - tip);
          if (!d || !isRateOf(d, r.subtotal, x[1])) return false;
          var was = r[f]; r[f] = d;
          r.workedOut = x[2] + ' worked out from subtotal and total (' + rateLabel(d, r.subtotal, x[1]) + (was !== null ? ', the photo read ' + was.toFixed(2) : '') + '): check it';
          return true;
        });
      });
    }
    if (r.subtotal === null && !r.seen.subtotal && r.total !== null && r.gst !== null && r.salesTax === null) {
      var sub = round2(r.total - r.gst - (r.pst || 0));
      if (sub && Math.sign(sub) === Math.sign(r.total) && isRateOf(r.gst, sub, GST_RATES) && (r.pst === null || isRateOf(r.pst, sub, PST_RATES))) { r.subtotal = sub; r.subtotalWorkedOut = true; }
    }
  }

  // Reads subtotal, the tax columns and the total. The total is taken ONLY from a "total" line.
  function parseAmounts(text) {
    var lines = String(text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var r = { tip: null, subtotal: null, gst: null, pst: null, salesTax: null, total: null, ambiguous: false, reasons: [], totalLineSeen: false, refund: false,
      seen: { subtotal: false, gst: false, pst: false, salesTax: false, total: false }, bare: { subtotal: null, gst: null, pst: null, salesTax: null, total: null } };
    lines.forEach(function (ln) {
      if (REFUND_WORDS.test(ln) && /[-(]\s*\$?\s*\d/.test(ln)) r.refund = true;
      var isTotalTax = TOTAL_TAX.test(ln);
      var isTotal = TOTAL_WORDS.test(ln) && !SUBTOTAL_WORDS.test(ln) && !TOTAL_EXCLUDE.test(ln) && !isTotalTax;
      if (isTotal) r.totalLineSeen = true;
      if (TOTAL_EXCLUDE.test(ln)) return;
      var kind = SUBTOTAL_WORDS.test(ln) ? 'subtotal' : isTotal ? 'total' : PST_WORDS.test(ln) ? 'pst' : (GST_WORDS.test(ln) && !/#|\bno\b|\breg/i.test(ln)) ? 'gst' : (isTotalTax || SALESTAX_WORDS.test(ln)) ? 'salesTax' : null;
      if (kind && !(TIP_WORDS.test(ln) && !isTotal)) r.seen[kind] = true;
      var amt = amountOnLine(ln);
      if (amt === null) {
        var b = kind ? bareCents(ln) : null;
        if (b !== null && (kind === 'total' || r.bare[kind] === null)) r.bare[kind] = b;
        return;
      }
      if (!isTotal && TIP_WORDS.test(ln) && !/suggest|%/i.test(ln) && r.tip === null && Math.abs(amt) < 1000) { r.tip = amt; return; }
      if (SUBTOTAL_WORDS.test(ln) && r.subtotal === null) r.subtotal = amt;
      else if (isTotal) r.total = amt; // last total line wins
      else if (PST_WORDS.test(ln) && r.pst === null && Math.abs(amt) < 10000) r.pst = amt;
      else if (GST_WORDS.test(ln) && r.gst === null && Math.abs(amt) < 10000) r.gst = amt;
      else if ((isTotalTax || SALESTAX_WORDS.test(ln)) && r.salesTax === null && Math.abs(amt) < 10000) r.salesTax = amt;
    });
    // A refund printed with the minus only on the total: the lines above it are money back too.
    if (r.total !== null && r.total < 0) ['subtotal', 'gst', 'pst', 'salesTax'].forEach(function (k) { if (r[k] !== null && r[k] > 0) r[k] = -r[k]; });
    if (r.total !== null && r.total < 0) r.refund = true;
    repairAmounts(r);
    var taxes = taxSum(r);
    if (r.total === null) {
      r.reasons.push(r.totalLineSeen ? 'the total line had no readable amount' : 'no "total" line found');
    } else {
      if (r.subtotal !== null && Math.abs(r.subtotal) > Math.abs(r.total) + 0.01) { r.ambiguous = true; r.reasons.push('subtotal is bigger than total'); }
      else if (r.subtotal !== null && !addsUp(r)) {
        r.ambiguous = true;
        r.reasons.push('subtotal + tax (' + round2(r.subtotal + taxes).toFixed(2) + ') does not equal total (' + r.total.toFixed(2) + ')');
      }
    }
    if (r.workedOut) r.reasons.push(r.workedOut);
    // A total can only be trusted when subtotal + tax adds up to it. No subtotal line = nothing to check against.
    if (r.subtotal === null) r.reasons.push(r.gst === null && r.pst === null && r.salesTax === null ? 'no subtotal or tax lines to check the total against' : 'no subtotal line to check the total against');
    if (r.refund) r.reasons.push(r.total !== null && r.total < 0 ? 'refund or return: amounts are money back (negative)' : 'looks like a refund or return');
    return r;
  }

  function detectCurrency(text) {
    var t = String(text), found = [];
    if (/US\s?\$|\bUSD\b|\bU\.?S\.? dollars?\b/i.test(t)) found.push('USD');
    // The euro and pound signs count only beside an amount: the photo reader makes a stray "£" or "€" out of a smudge (seen 2026-11-19).
    if (/\u20ac\s*\d|\d[.,]\d{2}\s*\u20ac|\bEUR\b|\beuros?\b/i.test(t)) found.push('EUR');
    if (/\u00a3\s*\d|\bGBP\b/i.test(t)) found.push('GBP');
    // Rarer codes count only next to an amount ("INR 35.09", "35.09 CNY"): the photo reader spells INR/CNY out of smudges (live site, 2026-11-13).
    var other = /\b(AUD|NZD|MXN|CHF|JPY|HKD|TWD|CNY|INR)\s*\$?\s*\d+[.,]\d{2}\b/.exec(t) || /\d[.,]\d{2}\s*(AUD|NZD|MXN|CHF|JPY|HKD|TWD|CNY|INR)\b/.exec(t);
    if (other) found.push(other[1]);
    var cad = /\bCAD\b|\bC\$|\bCDN\b/i.test(t);
    var all = found.slice(); if (cad) all.push('CAD');
    if (!all.length) return { code: 'CAD', assumed: true, mixed: false };
    if (found.length) return { code: found[0], assumed: false, mixed: all.length > 1 };
    return { code: 'CAD', assumed: false, mixed: false };
  }

  // Control characters and bidirectional-text tricks (which can make a name read backwards) are removed from anything read off a photo or PDF.
  function clean(s) { return String(s).replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff\ufff9-\ufffb]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function vendorCandidates(text) {
    var lines = String(text).split(/\r?\n/).slice(0, 8), out = [];
    for (var i = 0; i < lines.length; i++) {
      // The shop name is in the header: once a priced line is reached, the rest (card lines, "THANK YOU") is never the vendor.
      // (2026-11-19: a read that lost the top of the photo offered "DEBIT ****5659", misread, as the shop.)
      if (allMoney(repairDigits(lines[i])).length) break;
      var s = clean(lines[i]).replace(/^[ #*|\-_=~:;.,'"]+|[ #*|\-_=~:;.,'"]+$/g, '');
      if (s.length < 3 || s.length > 60 || SKIP_VENDOR.test(s)) continue;
      if (allMoney(s).length) continue;
      // The shop name is printed ABOVE the phone number, tax registration, date and transaction number. Once one of those is reached
      // the name was not read (seen 2026-11-19: a lost name line let "TRANS #414363" or "GST# 7356..." through): stop, leave it blank.
      if (parseDate(s) || PHONE.test(s) || (s.match(/\d/g) || []).length >= 7 || /\b(gst|hst|tps|tvq|tvh|qst|pst)\b|\bRT\s?\d{3}|#\s?\d{5,}/i.test(s)) {
        if (out.length || i >= 1) break; else continue;
      }
      // A street address is not the shop ("2165 King St", "2165KingSt" when the name line was lost; seen 2026-11-19).
      if (/^\d{2,6}\s*[A-Za-z\u00C0-\u00FF.' -]*?(st|street|ave|avenue|rd|road|blvd|hwy|highway|dr|drive|way|cres|lane|ln|rue|ch|chemin|boul)(?![a-z])/i.test(s)) continue;
      out.push(s);
    }
    return out;
  }
  function parseVendor(text) { return vendorCandidates(text)[0] || null; }
  function letters(s) { return (String(s).match(/[A-Za-z\u00C0-\u00FF]/g) || []).length; }
  // A shop name as printed at the top of a receipt: no digits, mostly capitals, at least 8 letters.
  function strongName(s) { var L = letters(s), U = (s.match(/[A-Z\u00C0-\u00DE]/g) || []).length; return L >= 8 && !/\d/.test(s) && U / L >= 0.7 && vendorLooksReal(s); }
  // 2026-11-19: a logo or smudge above the name is often read as a short scrap ("Re Pan" above "CHINOOK COFFEE ROASTERS"). When the
  // first line is short or garbled and one of the next two lines is clearly a shop name, the shop name is used.
  function pickVendor(text) {
    var c = vendorCandidates(text), first = c[0] || null;
    if (!first) return { vendor: null, unclear: false };
    var real = vendorLooksReal(first);
    if (!real || letters(first) <= 7) {
      for (var i = 1; i < Math.min(c.length, 3); i++) if (strongName(c[i])) return { vendor: c[i], unclear: false };
    }
    return real ? { vendor: first, unclear: false } : { vendor: null, unclear: true };
  }
  // A chain name in the header beats a first line the reader could not spell (live site, 2026-11-13). Only the header is searched -
  // the lines before the first price or date - so an item such as "STAPLES 5000" or "SHELL PASTA" never becomes the shop.
  // Street-name brands (Bell, Shaw) are left out on purpose: "123 Bell Ave" is not a vendor.
  var BRANDS = ['Petro-Canada', 'Shell', 'Esso', 'Husky', 'Chevron', 'Ultramar', 'Pioneer', 'Co-op', 'Domo', 'Circle K', '7-Eleven',
    'Tim Hortons', "McDonald's", 'Subway', 'Starbucks', 'A&W', "Wendy's", 'KFC', 'Dairy Queen', 'Pizza Hut', 'Boston Pizza', 'Second Cup',
    'Home Depot', 'Rona', "Lowe's", 'Canadian Tire', 'Princess Auto', 'Home Hardware', 'Napa Auto Parts', 'Kal Tire', 'Fountain Tire',
    'Staples', 'Walmart', 'Costco', 'Dollarama', 'Best Buy', 'Safeway', 'Sobeys', 'Superstore', 'No Frills', 'Shoppers Drug Mart', 'London Drugs',
    'Giant Tiger', 'IKEA', 'Canada Post', 'Purolator', 'FedEx', 'Air Canada', 'WestJet', 'Impark', 'Telus', 'Rogers'];
  var BRAND_RES = BRANDS.map(function (b) {
    var pat = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "'?").replace(/[\s-]+/g, '[\\s-]?');
    return [b, new RegExp('(^|[^A-Za-z])' + pat + '(?![A-Za-z])', 'i')];
  });
  function brandIn(text) {
    var head = [], lines = String(text).split(/\r?\n/).slice(0, 12);
    for (var i = 0; i < lines.length; i++) { if (allMoney(lines[i]).length || parseDate(lines[i])) break; head.push(lines[i]); }
    head = head.join('\n');
    for (var j = 0; j < BRAND_RES.length; j++) if (BRAND_RES[j][1].test(head)) return BRAND_RES[j][0];
    return null;
  }
  // Does the vendor text look like real words, not OCR noise?
  function vendorLooksReal(s) {
    if (!s || /\uFFFD/.test(s)) return false;
    var nonspace = s.replace(/\s/g, '');
    var alnum = (s.match(/[A-Za-z\u00C0-\u00FF0-9]/g) || []).length;
    if (alnum < 3 || alnum / nonspace.length < 0.7) return false;
    if (!/[A-Za-z\u00C0-\u00FF]{3,}/.test(s)) return false;
    var toks = s.split(/\s+/).filter(Boolean);
    var short = toks.filter(function (t) { return t.replace(/[^A-Za-z\u00C0-\u00FF0-9]/g, '').length <= 2; }).length;
    if (toks.length >= 3 && short / toks.length > (toks.length >= 4 ? 0.39 : 0.5)) return false;
    if (/[a-z][A-Z]{2}/.test(s)) return false; // e.g. suELL: OCR noise, not a name
    if (toks.some(function (t) { return /[aeiouy]{5}|[^aeiouy\d\W_]{7}/i.test(t); })) return false;
    return true;
  }

  // Supplier registration numbers printed on the receipt. GST/HST: 9 digits + RT + 4 digits. QST: 10 digits + TQ + 4 digits.
  // The check digits are not verified (that needs the CRA registry), so these are "found on the receipt", not "valid".
  function parseSupplierNumbers(text) {
    var t = String(text), out = { gstNo: null, qstNo: null }, m;
    var d4 = function (x) { return x.replace(/[Oo]/g, '0').replace(/[lI]/g, '1'); };
    // 9 digits, then RT, then the 4-digit account number. OCR often turns the zeros into O/Q, so that part is read leniently:
    // exactly 4 look-alike characters are accepted; anything longer or shorter keeps just the 9 digits and "RT".
    if ((m = /(?<!\d)(\d{3}[ .\-]?\d{3}[ .\-]?\d{3})\s*-?\s*R\s?[TI7]\s*-?\s*([0-9OoQqDlI]{2,7})(?![0-9A-Za-z])/.exec(t))) {
      var suf = m[2].replace(/[QqD]/g, '0');
      out.gstNo = m[1].replace(/\D/g, '') + 'RT' + (suf.length === 4 ? d4(suf) : '');
    } else if ((m = /\b(?:gst|hst|tps)\b[^\n\d]{0,30}?(?<!\d)(\d{9})(?!\d)/i.exec(t))) out.gstNo = m[1] + 'RT';
    if ((m = /(?<!\d)(\d{10})\s*-?\s*T\s?Q\s*-?\s*([0-9OolI]{4})(?![0-9A-Za-z])/.exec(t))) out.qstNo = m[1] + 'TQ' + d4(m[2]);
    return out;
  }
  // CRA's rule for claiming the GST/HST back (input tax credit), by purchase size (rules in force since 20 April 2021, source: CRA Excise and
  // GST/HST News No. 118): under $100 a name, date and total are enough; $100 to $499.99 also needs the supplier's GST/HST number and the tax
  // charged; $500 or more also needs the buyer's name, a description and the payment terms. This is a reminder, not tax advice.
  function itcNote(row, hasTaxLine) {
    var tot = row.total;
    if (typeof tot !== 'number' || (row.currency && row.currency !== 'CAD')) return '';
    if (!(row.gst > 0) && !hasTaxLine) return '';
    if (tot >= 500) return row.supplier_no ? 'Over $500: ask for an invoice showing your business name, a description and payment terms' : 'No GST/HST number found. Over $500 you also need an invoice with your business name, a description and payment terms';
    if (tot >= 100 && !row.supplier_no) return 'No GST/HST number found. CRA asks for it on purchases of $100 or more before you can claim the GST/HST back';
    return '';
  }
  // A tip line with no amount (handwritten or still blank) means the printed total may not be what was paid.
  function tipProblem(text) {
    var lines = String(text).split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (/\b(tip|gratuity|pourboire)\b/i.test(ln) && !/suggest|%/i.test(ln) && !allMoney(repairDigits(ln)).length && /(_{3,}|\.{4,}|:\s*$|\b(tip|gratuity|pourboire)\s*$)/i.test(ln)) return 'tip line is blank or handwritten: the amount paid may be more than this total';
    }
    return '';
  }
  // hints: { date, vendor } read cleanly from another reading of the same photo (pickBest). Amounts are never taken from hints.
  function extract(text, hints) {
    text = String(text == null ? '' : text);
    var a = parseAmounts(text), cur = detectCurrency(text), reasons = a.reasons.slice();
    var pv = pickVendor(text), vendor = pv.vendor, brand = brandIn(text), key = function (x) { return String(x || '').toLowerCase().replace(/[^a-z]/g, ''); };
    // Use the chain name unless the vendor line already names it (keeps "Tim Hortons #2231" store numbers).
    if (brand && !(vendor && key(vendor).indexOf(key(brand)) >= 0)) { vendor = brand; pv.unclear = false; }
    if (!vendor && hints && hints.vendor) { vendor = hints.vendor; pv.unclear = false; }
    if (pv.unclear) reasons.push('vendor text is unclear');
    var date = parseDate(text);
    if (!date && hints && hints.date) date = hints.date;
    if (!vendor && reasons.indexOf('vendor text is unclear') < 0) reasons.push('no vendor found');
    if (!date) reasons.push('date missing or ambiguous');
    if ((text.match(/\uFFFD/g) || []).length >= 2) reasons.push('some text was unreadable (blurry?)');
    var sn = parseSupplierNumbers(text);
    if (cur.code !== 'CAD') reasons.push(cur.code + ' receipt: kept separate, not added to CAD totals');
    if (cur.mixed) reasons.push('more than one currency mentioned');
    // Quebec receipts write cents with a comma; that is only worth a question when nothing else says the receipt is Canadian
    // (no GST/HST or QST number, no TPS/TVQ/TVH line).
    var canadian = sn.gstNo || sn.qstNo || /\b(tps|tvq|tvh|gst|hst|qst|pst|rst)\b/i.test(text);
    if (usesCommaDecimal(text) && cur.code === 'CAD' && !canadian) reasons.push('cents are written with a comma (10,50): confirm this is a Canadian-dollar receipt');
    var row = { tip: a.tip, date: date, vendor: vendor, subtotal: a.subtotal, gst: a.gst, pst: a.pst, sales_tax: a.salesTax, total: a.total, currency: cur.code };
    row.supplier_no = sn.gstNo; row.qst_no = sn.qstNo;
    // 2026-11-19: no category by default. The product page says ReceiptSort does not categorize expenses, and a bookkeeper uses their
    // own chart of accounts. The column stays for the person to type in; the page can fill a keyword guess only if they turn that on.
    row.category = '';
    row.itc_note = itcNote(row, a.gst !== null);
    var tip = tipProblem(text); if (tip) reasons.push(tip);
    Object.defineProperty(row, '_text', { value: text, enumerable: false, writable: true });   // which read this row came from (kept off the saved list and the files)
    row.reason = reasons.join('; ');
    row.status = !text.trim() ? 'needs_review (no text found)' : (reasons.length ? 'needs_review' : 'ok');
    if (!text.trim()) row.reason = 'no text found';
    return row;
  }

  // Several OCR reads of the same photo (different page-layout settings). Keep the first read whose numbers add up.
  // If none does, try mixing the amounts the reads found: a subtotal + tax = total combination that adds up to the cent is
  // accepted (an arithmetic check, not a guess). Otherwise keep the read with the fewest doubts. Never invents a number:
  // it only chooses between numbers that were really read off the photo.
  var SUM_REASON = /does not equal total|no readable amount|no "total" line|subtotal is bigger|no subtotal|^no subtotal or tax|worked out from subtotal and total/;
  function uniq(a) { var o = []; a.forEach(function (x) { if (x !== null && x !== undefined && o.indexOf(x) < 0) o.push(x); }); return o; }
  function pickBest(texts) {
    // A date or shop name read cleanly in one read fills the gap in another (only when every read that found a date agrees).
    var first = texts.map(function (t) { return extract(t); }), dates = uniq(first.map(function (x) { return x.date; })), hints = {};
    if (dates.length === 1) hints.date = dates[0];
    first.some(function (x) { if (x.vendor) { hints.vendor = x.vendor; return true; } return false; });
    var rows = texts.length > 1 ? texts.map(function (t) { return extract(t, hints); }) : first, best = null, bestScore = 1e9, i;
    for (i = 0; i < rows.length; i++) {
      var r = rows[i], sc = r.status === 'ok' ? 0 : 10 + r.reason.split('; ').length * 2 + (r.total === null ? 5 : 0) + (r.date ? 0 : 1) + i * 0.1;
      if (sc < bestScore) { best = r; bestScore = sc; }
    }
    if (best.status === 'ok' || rows.length < 2 || !best.date && !best.vendor) return best;
    var am = texts.map(parseAmounts);
    var subs = uniq(am.map(function (x) { return x.subtotal; })), gsts = uniq(am.map(function (x) { return x.gst; })).concat([null]),
      psts = uniq(am.map(function (x) { return x.pst; })).concat([null]), sales = uniq(am.map(function (x) { return x.salesTax; })).concat([null]),
      tots = uniq(am.map(function (x) { return x.total; })), found = null, foundScore = -1;
    subs.forEach(function (sb) { tots.forEach(function (t) { gsts.forEach(function (g) { psts.forEach(function (p) { sales.forEach(function (st) {
      if (round2(sb + (g || 0) + (p || 0) + (st || 0)) !== round2(t)) return;
      if (g === null && p === null && st === null && sb !== t) return;
      var agree = (sb === best.subtotal) + (t === best.total) + (g === best.gst) + (p === best.pst) + (st === best.sales_tax) + (g !== null) * 2 + (p !== null);
      if (agree > foundScore) { foundScore = agree; found = { sb: sb, t: t, g: g, p: p, st: st }; }
    }); }); }); }); });
    if (!found) return best;
    var out = {}; Object.keys(best).forEach(function (k) { out[k] = best[k]; });
    out.subtotal = found.sb; out.gst = found.g; out.pst = found.p; out.sales_tax = found.st; out.total = found.t;
    var keep = best.reason.split('; ').filter(function (x) { return x && !SUM_REASON.test(x); });
    out.reason = keep.concat(['amounts taken from two reads of the photo; they add up']).join('; ');
    out.status = keep.length ? 'needs_review' : 'ok';
    out.itc_note = itcNote(out, found.g !== null);
    return out;
  }

  // After a person edits a row by hand: it becomes "ok" only if date, vendor and total are there AND (when a subtotal is present)
  // subtotal + taxes (+ tip) equals the total to the cent. Otherwise it stays "Check this" with the reason. Never ok by accident.
  function recheck(r) {
    var miss = [];
    if (!r.date) miss.push('date'); if (!r.vendor) miss.push('vendor'); if (typeof r.total !== 'number') miss.push('total');
    if (miss.length) return { ok: false, reason: 'still missing: ' + miss.join(', ') };
    if (typeof r.subtotal === 'number') {
      var taxes = (r.gst || 0) + (r.pst || 0) + (r.sales_tax || 0), s = round2(r.subtotal + taxes), s2 = round2(s + (r.tip || 0)), t = round2(r.total);
      if (Math.abs(s - t) > ADD_TOL && Math.abs(s2 - t) > ADD_TOL) return { ok: false, reason: 'subtotal + tax (' + s.toFixed(2) + ') does not equal total (' + t.toFixed(2) + ')' };
    }
    return { ok: true, reason: 'checked by you' };
  }
  // The first 17 columns keep their order from earlier versions (imports people set up keep working); new ones are added at the end.
  // page: which page of a PDF holding several receipts; photo: the file's name inside the "Photos, renamed (zip)" download.
  var COLUMNS = ['file', 'date', 'vendor', 'subtotal', 'gst', 'pst', 'sales_tax', 'total', 'currency', 'category', 'status', 'reason', 'tip', 'supplier_no', 'itc_note', 'possible_duplicate', 'cad_total', 'page', 'photo'];
  // opts.sep / opts.decimal: French-language Excel in Canada expects ";" between columns and "," for cents. Default is "," and ".".
  function csvCell(v, opts) {
    var sep = (opts && opts.sep) || ',', dec = (opts && opts.decimal) || '.';
    var isNum = typeof v === 'number', s = v === null || v === undefined ? '' : (isNum ? v.toFixed(2).replace('.', dec) : String(v));
    if (!isNum && /^[=+\-@\t\r]/.test(s)) s = "'" + s; // stop spreadsheet formulas (a real number such as -12.50 is left alone)
    return (s.indexOf(sep) >= 0 || /["\r\n]/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCSV(rows, opts) {
    var sep = (opts && opts.sep) || ',';
    return [COLUMNS.join(sep)].concat(rows.map(function (r) {
      return COLUMNS.map(function (c) { return csvCell(c === 'currency' ? (r.currency || 'CAD') : r[c], opts); }).join(sep);
    })).join('\r\n') + '\r\n';
  }
  // Name each receipt's file the way the zip download does: photos/2026-03-14_Shop-Name_22.47.jpg (a number is added if two match).
  function slug(x) { return String(x || 'unknown').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'unknown'; }
  function assignPhotoNames(rows) {
    var used = {};
    rows.forEach(function (r) {
      if (!r.file) { r.photo = ''; return; }
      var ext = (/\.[A-Za-z0-9]{2,5}$/.exec(r.file) || ['.jpg'])[0].toLowerCase();
      var base = (r.date || 'no-date') + '_' + slug(r.vendor) + '_' + (typeof r.total === 'number' ? r.total.toFixed(2) : 'no-total'), nm = base + ext, n = 2;
      while (used[nm]) nm = base + '-' + (n++) + ext;
      used[nm] = 1; r.photo = 'photos/' + nm;
    });
    return rows;
  }

  function summarize(rows) {
    var s = { count: rows.length, needsReview: 0, tip: 0, convertedCad: 0, total: 0, gst: 0, pst: 0, salesTax: 0, foreignCount: 0, byCategory: {}, byCurrency: {} };
    rows.forEach(function (r) {
      if (r.status !== 'ok') s.needsReview++;
      var cur = r.currency || 'CAD';
      var c = s.byCurrency[cur] || (s.byCurrency[cur] = { count: 0, total: 0, gst: 0, pst: 0, salesTax: 0 });
      c.count++;
      if (typeof r.total === 'number') c.total += r.total;
      if (typeof r.gst === 'number') c.gst += r.gst;
      if (typeof r.pst === 'number') c.pst += r.pst;
      if (typeof r.sales_tax === 'number') c.salesTax += r.sales_tax;
      if (cur !== 'CAD') { s.foreignCount++; if (typeof r.cad_total === 'number') s.convertedCad += r.cad_total; return; }
      if (typeof r.tip === 'number') s.tip += r.tip; // never mixed into the CAD figures
      if (typeof r.total === 'number') s.total += r.total;
      if (typeof r.gst === 'number') s.gst += r.gst;
      if (typeof r.pst === 'number') s.pst += r.pst;
      if (typeof r.sales_tax === 'number') s.salesTax += r.sales_tax;
      var cat = r.category || 'Uncategorized';
      var b = s.byCategory[cat] || (s.byCategory[cat] = { count: 0, total: 0 });
      b.count++; if (typeof r.total === 'number') b.total += r.total;
    });
    s.tip = round2(s.tip); s.convertedCad = round2(s.convertedCad); s.total = round2(s.total); s.gst = round2(s.gst); s.pst = round2(s.pst); s.salesTax = round2(s.salesTax);
    Object.keys(s.byCategory).forEach(function (k) { s.byCategory[k].total = round2(s.byCategory[k].total); });
    Object.keys(s.byCurrency).forEach(function (k) { var c = s.byCurrency[k]; c.total = round2(c.total); c.gst = round2(c.gst); c.pst = round2(c.pst); c.salesTax = round2(c.salesTax); });
    return s;
  }
  // Simplified file that QuickBooks and Xero import cleanly (map the columns on import).
  // Foreign-currency rows get a blank Amount and a note, so they can't be imported as CAD by accident.
  function toAccountingCSV(rows) {
    var cols = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Notes'];
    return [cols.join(',')].concat(rows.map(function (r) {
      var cur = r.currency || 'CAD', foreign = cur !== 'CAD', has = typeof r.total === 'number';
      return [csvCell(r.date), csvCell(r.vendor), csvCell(r.category),
        csvCell(!foreign && has ? r.total : ''), csvCell(cur),
        csvCell(foreign && has ? cur + ' ' + r.total.toFixed(2) + ' - convert to CAD before importing' : '')].join(',');
    })).join('\r\n') + '\r\n';
  }

  // Same shop, same day, same total: usually the same receipt photographed twice. Marks the later one; never deletes anything.
  function markDuplicates(rows) {
    var seen = {};
    rows.forEach(function (r, i) {
      r.possible_duplicate = '';
      if (!r.date || typeof r.total !== 'number') return;
      var key = r.date + '|' + (r.vendor || '').toLowerCase().replace(/[^a-z0-9]/g, '') + '|' + r.total.toFixed(2) + '|' + (r.currency || 'CAD');
      if (seen[key] !== undefined) r.possible_duplicate = 'same as row ' + (seen[key] + 1); else seen[key] = i;
    });
    return rows;
  }

  // Foreign-currency receipts: the person types the rate (for example the Bank of Canada daily rate) and the CAD amount is
  // worked out here. Nothing is looked up online and no rate is assumed. rates = { USD: 1.37 }.
  function applyRates(rows, rates) {
    rows.forEach(function (r) {
      var cur = r.currency || 'CAD', rate = rates && Number(rates[cur]);
      r.cad_total = (cur !== 'CAD' && rate > 0 && typeof r.total === 'number') ? round2(r.total * rate) : null;
    });
    return rows;
  }
  // Bank-statement style files for QuickBooks Online and Xero. Money going out is NEGATIVE in both (Xero documents this; for
  // QuickBooks it is the usual convention). A receipt is money out. Rows without a date or total, or in a foreign currency
  // with no rate entered, are skipped and counted so nothing is silently wrong.
  function bankRows(rows) {
    var use = [], skipped = 0;
    rows.forEach(function (r) {
      var cur = r.currency || 'CAD', amt = cur === 'CAD' ? r.total : r.cad_total;
      if (!r.date || typeof amt !== 'number') { skipped++; return; }
      // money out is negative; a refund (a negative receipt total) is money back in, so it comes out positive (was -abs: a refund imported as spending)
      use.push({ date: r.date, vendor: r.vendor || r.file || '', amount: amt === 0 ? 0 : -amt, cat: r.category || '', file: r.file || '', cur: cur, orig: r.total, foreign: cur !== 'CAD' });
    });
    return { rows: use, skipped: skipped };
  }
  function toBankCSV(rows, kind) {
    var b = bankRows(rows), out;
    if (kind === 'xero') {
      out = ['Date,Amount,Payee,Description,Reference'].concat(b.rows.map(function (r) {
        return [csvCell(r.date.replace(/-/g, '/')), csvCell(r.amount), csvCell(r.vendor), csvCell(r.cat + (r.foreign ? ' (' + r.cur + ' ' + r.orig.toFixed(2) + ' converted)' : '')), csvCell(r.file)].join(',');
      }));
    } else {
      out = ['Date,Description,Amount'].concat(b.rows.map(function (r) {
        return [csvCell(r.date), csvCell(r.vendor + (r.cat ? ' - ' + r.cat : '')), csvCell(r.amount)].join(',');
      }));
    }
    return { csv: out.join('\r\n') + '\r\n', skipped: b.skipped, count: b.rows.length };
  }

  // A number typed by a person into a cell. Accepts 12.50, 12,50, 1,234.50, 1.234,50, "1 234,50 $", "$12". Anything else is null (never guessed).
  // "1,234" or "1.234" (exactly three digits after the mark) is read as a thousands mark, because a receipt amount has two decimals.
  function parseTyped(v) {
    var t = String(v == null ? '' : v).replace(/[\s\u00a0\u202f$]/g, '').replace(/^\((.*)\)$/, '-$1');
    if (!/^-?[\d.,]+$/.test(t) || !/\d/.test(t)) return null;
    var neg = t.charAt(0) === '-'; if (neg) t = t.slice(1);
    var lastC = t.lastIndexOf(','), lastD = t.lastIndexOf('.'), dec = Math.max(lastC, lastD), out;
    if (dec < 0) out = t;
    else {
      var sep = t.charAt(dec), other = sep === ',' ? '.' : ',', head = t.slice(0, dec), tail = t.slice(dec + 1);
      if (head.indexOf(sep) >= 0) { if (tail.length !== 3 || head.indexOf(other) >= 0) return null; out = t.split(sep).join(''); }   // 1,234,567
      else if (tail.length === 3) { if (head.indexOf(other) >= 0) return null; out = head.split(other).join('') + tail; }               // 1,234 / 1.234
      else if (tail.length >= 1 && tail.length <= 2) out = head.split(other).join('') + '.' + tail;                                      // 12,50 / 1.234,50
      else return null;
    }
    var n = parseFloat(out); return isFinite(n) ? (neg ? -n : n) : null;
  }


  // A PDF with several pages: one receipt per page, or one receipt over several pages? Each page that has its own "total" line ends a
  // receipt. Two or more such pages = that many receipts (a page without a total belongs to the next receipt, as its first page;
  // pages after the last total join the last receipt). Fewer than two = the whole PDF is one receipt (an invoice whose totals are on the last page). Returns [{ pages: [1, 2], text }].
  function splitPages(pageTexts) {
    var all = pageTexts.map(function (t, i) { return { n: i + 1, text: String(t || ''), total: parseAmounts(String(t || '')).total !== null }; });
    var withTotal = all.filter(function (p) { return p.total; }).length;
    if (withTotal < 2) return [{ pages: all.map(function (p) { return p.n; }), text: all.map(function (p) { return p.text; }).join('\n') }];
    var groups = [], cur = [];
    all.forEach(function (p) { cur.push(p); if (p.total) { groups.push(cur); cur = []; } });
    if (cur.length) groups[groups.length - 1] = groups[groups.length - 1].concat(cur);
    return groups.map(function (g) { return { pages: g.map(function (p) { return p.n; }), text: g.map(function (p) { return p.text; }).join('\n') }; });
  }

  var api = { assignPhotoNames: assignPhotoNames, slug: slug, suggestCategory: function (r) { return categorize(r.vendor, r._text || ''); }, splitPages: splitPages,  parseTyped: parseTyped, recheck: recheck, clean: clean, monthNum: monthNum, markDuplicates: markDuplicates, applyRates: applyRates, toBankCSV: toBankCSV, parseSupplierNumbers: parseSupplierNumbers, itcNote: itcNote, repairDigits: repairDigits, pickBest: pickBest, parseDate: parseDate, parseAmounts: parseAmounts, parseVendor: parseVendor, vendorLooksReal: vendorLooksReal, detectCurrency: detectCurrency, categorize: categorize, extract: extract, summarize: summarize, toCSV: toCSV, toAccountingCSV: toAccountingCSV, money: money, allMoney: allMoney, COLUMNS: COLUMNS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RSParse = api;
})(this);
