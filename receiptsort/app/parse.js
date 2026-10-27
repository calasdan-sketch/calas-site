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
  var DATE_PATTERNS = [
    [/\b(\d{4})-(\d{2})-(\d{2})\b/, 'ymd'],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, 'mdy_or_dmy'],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{2})\b/, 'mdy2'],
    [/\b(\d{1,2})[.\-](\d{1,2})[.\-](\d{4})\b/, 'dmy_dotted'],
    [/\b([A-Z][a-z]{2,8})\.? (\d{1,2}),? (\d{4})\b/, 'mon_d_y'],
    [/\b(\d{1,2}) ([A-Z][a-z]{2,8})\.? (\d{4})\b/, 'd_mon_y']
  ];
  // Used to blank dates out of a line before looking for money, so 21.10.2026 is never read as 21.10.
  var DATE_MASK = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b|\b[A-Z][a-z]{2,8}\.? \d{1,2},? \d{4}\b|\b\d{1,2} [A-Z][a-z]{2,8}\.? \d{4}\b/g;
  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  var TOTAL_WORDS = /\b(grand\s*total|total\s*(?:due|paid|amount)?|amount\s*due|balance\s*due|netto\s*total)\b/i;
  var TOTAL_EXCLUDE = /total\s*(savings?|saved|discounts?|items?|qty|points|rewards)/i;
  var TOTAL_TAX = /\b(total|sum)\s*(of\s*)?(taxes|tax|gst|hst|pst|qst|tps|tvq|tva|vat)\b|\b(taxes|tax|gst|hst|pst|qst)\s*total\b/i;
  var SUBTOTAL_WORDS = /\b(sub\s*-?\s*total|sous[\s-]*total|s\/total|net|netto)\b/i;
  var PST_WORDS = /\b(pst|rst|qst|tvq|rpt)\b/i;
  var GST_WORDS = /\b(gst|hst|gst\/hst|tps)\b/i;
  var SALESTAX_WORDS = /\b(sales\s*tax|vat|tva|mwst|tax(?:es)?)\b/i;
  var REFUND_WORDS = /\b(refund|return(?:ed)?|credit\s*note|void)\b/i;
  var SKIP_VENDOR = /^(receipt|invoice|tax invoice|thank you|welcome|store|customer copy|\W*)$/i;
  var PHONE = /\d{3}[-. ]\d{3}[-. ]\d{4}/;
  // Vendor/line keyword -> expense category. Canada-aware. First match wins; else Uncategorized.
  var CATEGORIES = [
    ['Fuel', /\b(petro[- ]?can|petrocanada|shell|esso|husky|chevron|ultramar|pioneer|co-?op gas|gas bar|fuel|diesel|flying j|pilot|cardlock|mobil)\b/i],
    ['Meals & Entertainment', /\b(restaurant|caf[e\u00e9]|coffee|tim hortons|mcdonald|subway|pizza|grill|diner|starbucks|a&w|wendy|burger|pub|bistro|donair|kfc|taco|bakery|deli)\b/i],
    ['Vehicle & Repairs', /\b(napa|auto parts|tire|mechanic|oil change|lube|muffler|transmission|collision|kal tire|fountain tire|canadian tire auto|autobody)\b/i],
    ['Travel & Lodging', /\b(hotel|motel|\binn\b|airbnb|air canada|westjet|flair|uber|lyft|taxi|parking|impark|via rail|greyhound|lodge|suites|expedia)\b/i],
    ['Office & Supplies', /\b(staples|office depot|office outlet|amazon|walmart|costco|dollarama|dollar tree|best buy|the source|indigo)\b/i],
    ['Hardware & Materials', /\b(home depot|\brona\b|lowe'?s|canadian tire|princess auto|home hardware|\bkent\b|windsor plywood|acklands)\b/i],
    ['Utilities & Telecom', /\b(rogers|\bbell\b|telus|\bshaw\b|hydro|mts|internet|mobility|\bfido\b|koodo|virgin|eastlink)\b/i],
    ['Shipping & Postage', /\b(canada post|\bups\b|fedex|purolator|\bdhl\b|postage|stamps)\b/i],
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
  function maskDates(s) { return String(s).replace(DATE_MASK, ' '); }
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
    for (var i = 0; i < DATE_PATTERNS.length; i++) {
      var m = DATE_PATTERNS[i][0].exec(text), kind = DATE_PATTERNS[i][1];
      if (!m) continue;
      var y, mo, d, a, b;
      if (kind === 'ymd') { y = +m[1]; mo = +m[2]; d = +m[3]; }
      else if (kind === 'mdy_or_dmy' || kind === 'mdy2' || kind === 'dmy_dotted') {
        a = +m[1]; b = +m[2]; y = kind === 'mdy2' ? 2000 + (+m[3]) : +m[3];
        if (a > 12 && b <= 12) { d = a; mo = b; }
        else if (b > 12 && a <= 12) { mo = a; d = b; }
        else return null; // ambiguous, e.g. 03/04/2026 or 03.04.2026: don't guess
      } else if (kind === 'mon_d_y') { mo = MONTHS[m[1].slice(0, 3).toLowerCase()]; d = +m[2]; y = +m[3]; if (!mo) continue; }
      else { d = +m[1]; mo = MONTHS[m[2].slice(0, 3).toLowerCase()]; y = +m[3]; if (!mo) continue; }
      var ok = validDate(y, mo, d);
      if (ok) return ok;
    }
    return null;
  }

  function amountOnLine(line) { var v = allMoney(line); return v.length ? v[v.length - 1] : null; }
  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  // Reads subtotal, the tax columns and the total. The total is taken ONLY from a "total" line.
  function parseAmounts(text) {
    var lines = String(text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var r = { subtotal: null, gst: null, pst: null, salesTax: null, total: null, ambiguous: false, reasons: [], totalLineSeen: false, refund: false };
    lines.forEach(function (ln) {
      if (REFUND_WORDS.test(ln) && /[-(]\s*\$?\s*\d/.test(ln)) r.refund = true;
      var isTotalTax = TOTAL_TAX.test(ln);
      var isTotal = TOTAL_WORDS.test(ln) && !SUBTOTAL_WORDS.test(ln) && !TOTAL_EXCLUDE.test(ln) && !isTotalTax;
      if (isTotal) r.totalLineSeen = true;
      var amt = amountOnLine(ln);
      if (amt === null) return;
      if (TOTAL_EXCLUDE.test(ln)) return;
      if (SUBTOTAL_WORDS.test(ln) && r.subtotal === null) r.subtotal = amt;
      else if (isTotal) r.total = amt; // last total line wins
      else if (PST_WORDS.test(ln) && r.pst === null && amt < 10000) r.pst = amt;
      else if (GST_WORDS.test(ln) && r.gst === null && amt < 10000) r.gst = amt;
      else if ((isTotalTax || SALESTAX_WORDS.test(ln)) && r.salesTax === null && amt < 10000) r.salesTax = amt;
    });
    var taxes = (r.gst || 0) + (r.pst || 0) + (r.salesTax || 0);
    if (r.total === null) {
      r.reasons.push(r.totalLineSeen ? 'the total line had no readable amount' : 'no "total" line found');
    } else {
      if (r.subtotal !== null && r.subtotal > r.total + 0.01) { r.ambiguous = true; r.reasons.push('subtotal is bigger than total'); }
      else if (r.subtotal !== null && Math.abs(r.subtotal + taxes - r.total) > 0.02) {
        r.ambiguous = true;
        r.reasons.push('subtotal + tax (' + round2(r.subtotal + taxes).toFixed(2) + ') does not equal total (' + r.total.toFixed(2) + ')');
      }
    }
    // A total can only be trusted when subtotal + tax adds up to it. No subtotal line = nothing to check against.
    if (r.subtotal === null) r.reasons.push(r.gst === null && r.pst === null && r.salesTax === null ? 'no subtotal or tax lines to check the total against' : 'no subtotal line to check the total against');
    if (r.refund) r.reasons.push('looks like a refund or return');
    return r;
  }

  function detectCurrency(text) {
    var t = String(text), found = [];
    if (/US\s?\$|\bUSD\b|\bU\.?S\.? dollars?\b/i.test(t)) found.push('USD');
    if (/\u20ac|\bEUR\b|\beuros?\b/i.test(t)) found.push('EUR');
    if (/\u00a3|\bGBP\b/i.test(t)) found.push('GBP');
    var other = /\b(AUD|NZD|MXN|CHF|JPY|HKD|TWD|CNY|INR)\b/.exec(t);
    if (other) found.push(other[1]);
    var cad = /\bCAD\b|\bC\$|\bCDN\b/i.test(t);
    var all = found.slice(); if (cad) all.push('CAD');
    if (!all.length) return { code: 'CAD', assumed: true, mixed: false };
    if (found.length) return { code: found[0], assumed: false, mixed: all.length > 1 };
    return { code: 'CAD', assumed: false, mixed: false };
  }

  function parseVendor(text) {
    var lines = String(text).split(/\r?\n/).slice(0, 8);
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i].trim().replace(/^[ #*|\-_]+|[ #*|\-_]+$/g, '');
      if (s.length < 3 || s.length > 60 || SKIP_VENDOR.test(s)) continue;
      if (allMoney(s).length || parseDate(s)) continue;
      if (PHONE.test(s)) continue;
      return s;
    }
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

  function extract(text) {
    text = String(text == null ? '' : text);
    var a = parseAmounts(text), cur = detectCurrency(text), reasons = a.reasons.slice();
    var vendor = parseVendor(text);
    if (vendor && !vendorLooksReal(vendor)) { reasons.push('vendor text is unclear'); vendor = null; }
    var date = parseDate(text);
    if (!vendor && reasons.indexOf('vendor text is unclear') < 0) reasons.push('no vendor found');
    if (!date) reasons.push('date missing or ambiguous');
    if ((text.match(/\uFFFD/g) || []).length >= 2) reasons.push('some text was unreadable (blurry?)');
    if (cur.code !== 'CAD') reasons.push(cur.code + ' receipt: kept separate, not added to CAD totals');
    if (cur.mixed) reasons.push('more than one currency mentioned');
    if (usesCommaDecimal(text) && cur.code === 'CAD') reasons.push('amounts use a decimal comma: check the currency');
    var row = { date: date, vendor: vendor, subtotal: a.subtotal, gst: a.gst, pst: a.pst, sales_tax: a.salesTax, total: a.total, currency: cur.code };
    row.category = categorize(row.vendor, text);
    row.reason = reasons.join('; ');
    row.status = !text.trim() ? 'needs_review (no text found)' : (reasons.length ? 'needs_review' : 'ok');
    if (!text.trim()) row.reason = 'no text found';
    return row;
  }

  var COLUMNS = ['file', 'date', 'vendor', 'subtotal', 'gst', 'pst', 'sales_tax', 'total', 'currency', 'category', 'status', 'reason'];
  function csvCell(v) {
    var s = v === null || v === undefined ? '' : (typeof v === 'number' ? v.toFixed(2) : String(v));
    if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formulas
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCSV(rows) {
    return [COLUMNS.join(',')].concat(rows.map(function (r) {
      return COLUMNS.map(function (c) { return csvCell(c === 'currency' ? (r.currency || 'CAD') : r[c]); }).join(',');
    })).join('\r\n') + '\r\n';
  }

  function summarize(rows) {
    var s = { count: rows.length, needsReview: 0, total: 0, gst: 0, pst: 0, salesTax: 0, foreignCount: 0, byCategory: {}, byCurrency: {} };
    rows.forEach(function (r) {
      if (r.status !== 'ok') s.needsReview++;
      var cur = r.currency || 'CAD';
      var c = s.byCurrency[cur] || (s.byCurrency[cur] = { count: 0, total: 0, gst: 0, pst: 0, salesTax: 0 });
      c.count++;
      if (typeof r.total === 'number') c.total += r.total;
      if (typeof r.gst === 'number') c.gst += r.gst;
      if (typeof r.pst === 'number') c.pst += r.pst;
      if (typeof r.sales_tax === 'number') c.salesTax += r.sales_tax;
      if (cur !== 'CAD') { s.foreignCount++; return; } // never mixed into the CAD figures
      if (typeof r.total === 'number') s.total += r.total;
      if (typeof r.gst === 'number') s.gst += r.gst;
      if (typeof r.pst === 'number') s.pst += r.pst;
      if (typeof r.sales_tax === 'number') s.salesTax += r.sales_tax;
      var cat = r.category || 'Uncategorized';
      var b = s.byCategory[cat] || (s.byCategory[cat] = { count: 0, total: 0 });
      b.count++; if (typeof r.total === 'number') b.total += r.total;
    });
    s.total = round2(s.total); s.gst = round2(s.gst); s.pst = round2(s.pst); s.salesTax = round2(s.salesTax);
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

  var api = { parseDate: parseDate, parseAmounts: parseAmounts, parseVendor: parseVendor, vendorLooksReal: vendorLooksReal, detectCurrency: detectCurrency, categorize: categorize, extract: extract, summarize: summarize, toCSV: toCSV, toAccountingCSV: toAccountingCSV, money: money, allMoney: allMoney, COLUMNS: COLUMNS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RSParse = api;
})(this);
