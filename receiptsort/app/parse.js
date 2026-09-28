/* ReceiptSort's reading rules, ported from receiptsort.py (2026-09-28) so it runs
 * in any browser: Windows, Mac, iPhone, Android. Rule: never guess. A field it
 * isn't sure about stays blank and the row is marked "needs review".
 * Works as a browser script (window.RSParse) and as a Node module (tests).
 */
(function (root) {
  'use strict';
  var MONEY = /(?<![\d.])\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})(?!\d)/g;
  var DATE_PATTERNS = [
    [/\b(\d{4})-(\d{2})-(\d{2})\b/, 'ymd'],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, 'mdy_or_dmy'],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{2})\b/, 'mdy2'],
    [/\b([A-Z][a-z]{2,8})\.? (\d{1,2}),? (\d{4})\b/, 'mon_d_y'],
    [/\b(\d{1,2}) ([A-Z][a-z]{2,8})\.? (\d{4})\b/, 'd_mon_y']
  ];
  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  var TOTAL_WORDS = /\b(grand\s*total|total\s*(?:due|paid|amount)?|amount\s*due|balance\s*due)\b/i;
  var SUBTOTAL_WORDS = /\b(sub\s*-?\s*total|net)\b/i;
  var GST_WORDS = /\b(gst|hst|gst\/hst|tps)\b/i;
  var SKIP_VENDOR = /^(receipt|invoice|tax invoice|thank you|welcome|store|customer copy|\W*)$/i;
  var PHONE = /\d{3}[-. ]\d{3}[-. ]\d{4}/;

  function money(s) { var v = parseFloat(String(s).replace(/,/g, '')); return isNaN(v) ? null : v; }
  function allMoney(s) { var out = [], m; MONEY.lastIndex = 0; while ((m = MONEY.exec(s))) { var v = money(m[1]); if (v !== null) out.push(v); } return out; }
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
      else if (kind === 'mdy_or_dmy' || kind === 'mdy2') {
        a = +m[1]; b = +m[2]; y = kind === 'mdy2' ? 2000 + (+m[3]) : +m[3];
        if (a > 12 && b <= 12) { d = a; mo = b; }
        else if (b > 12 && a <= 12) { mo = a; d = b; }
        else return null; // ambiguous, e.g. 03/04/2026: don't guess
      } else if (kind === 'mon_d_y') { mo = MONTHS[m[1].slice(0, 3).toLowerCase()]; d = +m[2]; y = +m[3]; if (!mo) continue; }
      else { d = +m[1]; mo = MONTHS[m[2].slice(0, 3).toLowerCase()]; y = +m[3]; if (!mo) continue; }
      var ok = validDate(y, mo, d);
      if (ok) return ok;
    }
    return null;
  }

  function amountOnLine(line) { var v = allMoney(line); return v.length ? v[v.length - 1] : null; }

  function parseAmounts(text) {
    var lines = String(text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var subtotal = null, gst = null, total = null;
    lines.forEach(function (ln) {
      var amt = amountOnLine(ln);
      if (amt === null) return;
      if (SUBTOTAL_WORDS.test(ln) && subtotal === null) subtotal = amt;
      else if (GST_WORDS.test(ln) && gst === null && amt < 10000) gst = amt;
      else if (TOTAL_WORDS.test(ln) && !SUBTOTAL_WORDS.test(ln)) total = amt; // last total line wins
    });
    var ambiguous = false;
    if (total === null) {
      var all = allMoney(text);
      if (all.length) {
        var mx = Math.max.apply(null, all);
        var count = all.filter(function (v) { return v === mx; }).length;
        if (count === 1 && (subtotal === null || mx >= subtotal)) total = mx; else ambiguous = true;
      }
    }
    if (total !== null && subtotal !== null && subtotal > total + 0.01) ambiguous = true;
    return { subtotal: subtotal, gst: gst, total: total, ambiguous: ambiguous };
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

  function extract(text) {
    var a = parseAmounts(text);
    var row = { date: parseDate(text), vendor: parseVendor(text), subtotal: a.subtotal, gst: a.gst, total: a.total };
    var missing = !row.date || !row.vendor || row.total === null;
    row.status = !String(text).trim() ? 'needs_review (no text found)' : (a.ambiguous || missing ? 'needs_review' : 'ok');
    return row;
  }

  var COLUMNS = ['file', 'date', 'vendor', 'subtotal', 'gst', 'total', 'status'];
  function csvCell(v) {
    var s = v === null || v === undefined ? '' : (typeof v === 'number' ? v.toFixed(2) : String(v));
    if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formulas
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCSV(rows) {
    return [COLUMNS.join(',')].concat(rows.map(function (r) {
      return COLUMNS.map(function (c) { return csvCell(r[c]); }).join(',');
    })).join('\r\n') + '\r\n';
  }

  var api = { parseDate: parseDate, parseAmounts: parseAmounts, parseVendor: parseVendor, extract: extract, toCSV: toCSV, COLUMNS: COLUMNS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RSParse = api;
})(this);
