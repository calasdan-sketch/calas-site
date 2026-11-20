/* Dropwatch core helpers: card search, watchlist targets, calendar files, comp links, safe text.
 * Browser: window.DWCore. Node: require(). No network, no storage here: pure functions so they can be tested.
 * buildIcs() is the twin of engine/ics.py build_ics(): tests compare their output byte for byte. */
(function (root) {
  'use strict';

  /* ---------- safe text ---------- */
  /* untrusted text: drop control characters and the bidi override/isolate marks that can make text read in a different order */
  var BAD_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g;
  function esc(t) {
    return String(t == null ? '' : t).replace(BAD_CHARS, '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* only http(s) links ever reach an href */
  function safeUrl(u) { return /^https?:\/\//i.test(String(u || '')) ? String(u) : '#'; }

  /* ---------- freshness ---------- */
  function daysBetween(aIso, bIso) {
    var a = Date.parse(aIso + 'T12:00:00Z'), b = Date.parse(bIso + 'T12:00:00Z');
    return isNaN(a) || isNaN(b) ? null : Math.round((b - a) / 86400000);
  }
  /* {level:'fresh'|'aging'|'stale'|'unknown', days} : fresh <= 2 days, aging 3-5, stale 6+ */
  function freshness(asof, todayIso) {
    var d = asof ? daysBetween(asof, todayIso) : null;
    if (d == null) return { level: 'unknown', days: null };
    if (d < 0) d = 0;
    return { level: d <= 2 ? 'fresh' : d <= 5 ? 'aging' : 'stale', days: d };
  }

  /* ---------- card search over window.DW_CARDS rows ----------
     row: [productId, name, setIndex, number, rarity, subtype, marketUsd, lowUsd, sealed] */
  function norm(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9/]+/g, ' ').trim(); }
  function search(index, query, opts) {
    opts = opts || {};
    var limit = opts.limit || 30, q = norm(query);
    if (!index || !q) return [];
    var toks = q.split(' ').filter(Boolean).slice(0, 8), hits = [];
    if (!index._h) {                                       /* normalise every row once; later keystrokes reuse it */
      index._h = index.rows.map(function (r) { var set = index.sets[r[2]] || {}, n = norm(r[1]); return [n, n + ' ' + norm(set.name) + ' ' + norm(set.abbr) + ' ' + norm(r[3]) + ' ' + norm(r[4]) + ' ' + norm(r[5])]; });
    }
    var kind = opts.kind || 'all';                         /* all | single | sealed */
    for (var i = 0; i < index.rows.length; i++) {
      var r = index.rows[i];
      if (kind === 'single' && r[8]) continue;
      if (kind === 'sealed' && !r[8]) continue;
      var set = index.sets[r[2]] || {};
      var nameN = index._h[i][0], hay = index._h[i][1];
      var ok = true, score = 0;
      for (var t = 0; t < toks.length; t++) {
        if (hay.indexOf(toks[t]) < 0) { ok = false; break; }
        score += nameN.indexOf(toks[t]) >= 0 ? 2 : 1;
      }
      if (!ok) continue;
      if (nameN === q) score += 5; else if (nameN.indexOf(q) === 0) score += 3;
      hits.push({ row: r, set: set, score: score });
    }
    hits.sort(function (a, b) { return b.score - a.score || b.row[6] - a.row[6]; });
    return hits.slice(0, limit);
  }
  function rowKey(r) { return r[0] + '|' + r[5]; }
  function imageUrl(pid, size) { return 'https://tcgplayer-cdn.tcgplayer.com/product/' + (pid | 0) + '_' + (size || 200) + 'w.jpg'; }

  /* A wide gap between the market price and the cheapest listing means thin or uneven supply:
     the "market" number may not be what you can actually sell at. */
  function thinMarket(r) {
    var m = r[6], low = r[7];
    if (!(m > 0) || !(low > 0)) return false;
    return m >= low * 1.5 || low >= m * 1.5;
  }

  /* ---------- history helpers for the page ---------- */
  function seriesFor(hist, key) {
    if (!hist || !hist.s || !hist.s[key]) return [];
    var out = [];
    for (var i = 0; i < hist.days.length; i++) if (hist.s[key][i] != null) out.push([hist.days[i], hist.s[key][i]]);
    return out;
  }
  function pctChange(points) {
    if (!points || points.length < 2) return null;
    var f = points[0], l = points[points.length - 1];
    if (f[0] === l[0] || !(f[1] > 0)) return null;
    return { from: f[0], to: l[0], days: daysBetween(f[0], l[0]), pct: Math.round((l[1] - f[1]) / f[1] * 1000) / 10 };
  }

  /* ---------- watchlist targets ----------
     watch item: {key, name, setName, dir:'below'|'above', targetCad, addedIso}
     Honest by design: checked when the page loads (the page has no server). Returns the ones whose target is met. */
  function checkTargets(watch, priceLookup, fx) {
    var hits = [];
    (watch || []).forEach(function (w) {
      var usd = priceLookup(w.key);
      if (usd == null || !(fx > 0)) return;
      var cad = usd * fx;
      if ((w.dir === 'above' && cad >= w.targetCad) || (w.dir !== 'above' && cad <= w.targetCad)) hits.push({ item: w, cad: Math.round(cad * 100) / 100 });
    });
    return hits;
  }
  function addWatch(list, item, max) {
    max = max || 100;
    var out = (list || []).filter(function (w) { return w.key !== item.key; });
    out.unshift(item);
    return out.slice(0, max);
  }

  /* ---------- share a calculation by link ----------
     The link carries only the numbers typed into the flip calculator (in the part after #, which never reaches any server).
     decodeCalc() trusts nothing: unknown keys are dropped, numbers are clamped, the marketplace must be one we know. */
  var CALC_KEYS = { p: 'preset', b: 'buy', s: 'sale', t: 'tax', si: 'shipIn', x: 'extra', so: 'shipOut', m: 'fxm', f: 'fee', y: 'pay', w: 'want', bt: 'btax', ft: 'ftax' };
  var CALC_PCT = { t: 1, m: 1, f: 1, y: 1, bt: 1, ft: 1 };
  function numIn(v, max) { var n = +v; return (isFinite(n) && n >= 0) ? Math.min(n, max) : (n === Infinity ? max : 0); }
  function encodeCalc(o) {
    var parts = ['calc=1'];
    Object.keys(CALC_KEYS).forEach(function (k) {
      var v = o[CALC_KEYS[k]];
      if (v == null || v === '') return;
      parts.push(k + '=' + encodeURIComponent(String(v)));
    });
    if (o.usd) parts.push('u=1');
    return parts.join('&');
  }
  function decodeCalc(str, presetIds) {
    var s = String(str || '').replace(/^#/, '');
    if (s.split('&')[0] !== 'calc=1') return null;
    var out = {};
    s.split('&').slice(1, 20).forEach(function (kv) {
      var i = kv.indexOf('='); if (i < 1) return;
      var k = kv.slice(0, i), raw;
      try { raw = decodeURIComponent(kv.slice(i + 1)); } catch (e) { return; }
      if (k === 'u') { out.usd = raw === '1'; return; }
      if (!Object.prototype.hasOwnProperty.call(CALC_KEYS, k)) return;
      if (k === 'p') { if ((presetIds || []).indexOf(raw) >= 0) out.preset = raw; return; }
      out[CALC_KEYS[k]] = numIn(raw, CALC_PCT[k] ? 100 : 1e7);
    });
    return out;
  }

  /* ---------- your collection (kept on this device only) ----------
     item: {key, name, setName, number, sub, qty, costCad (what ONE copy cost you, all in), addedIso} */
  function cleanOwn(raw) {
    if (!Array.isArray(raw)) return [];
    var out = [];
    raw.forEach(function (w) {
      if (!w || typeof w !== 'object' || typeof w.key !== 'string' || !w.key || w.key.length > 40) return;
      var qty = Math.floor(+w.qty), cost = +w.costCad;
      if (!(qty >= 1) || !isFinite(cost) || cost < 0) return;
      out.push({ key: w.key, name: String(w.name || '').slice(0, 120), setName: String(w.setName || '').slice(0, 80),
        number: String(w.number || '').slice(0, 20), sub: String(w.sub || '').slice(0, 40), qty: Math.min(qty, 9999),
        costCad: Math.min(cost, 1e7), addedIso: /^\d{4}-\d{2}-\d{2}$/.test(String(w.addedIso)) ? String(w.addedIso) : '' });
    });
    return out.slice(0, 300);
  }
  function addOwn(list, item) {                          /* same card again: add the copies, average what you paid */
    var out = (list || []).slice(), i = out.findIndex(function (w) { return w.key === item.key; });
    if (i < 0) { out.unshift(item); return out.slice(0, 300); }
    var a = out[i], q = a.qty + item.qty;
    out[i] = Object.assign({}, a, { qty: Math.min(q, 9999), costCad: Math.round((a.costCad * a.qty + item.costCad * item.qty) / q * 100) / 100 });
    return out;
  }
  /* priceUsd(key) -> number|null ; netFn(saleCad) -> what you keep from one sale after fees (CAD). Never guesses a missing price. */
  function portfolioRows(items, priceUsd, fx, netFn) {
    return (items || []).map(function (w) {
      var usd = priceUsd(w.key), paid = Math.round(w.costCad * w.qty * 100) / 100;
      if (usd == null || !(usd > 0) || !(fx > 0)) return { item: w, known: false, paid: paid };
      var each = usd * fx, net = Math.round(netFn(each) * w.qty * 100) / 100;
      return { item: w, known: true, paid: paid, eachCad: Math.round(each * 100) / 100, valueCad: Math.round(each * w.qty * 100) / 100, netCad: net, profitCad: Math.round((net - paid) * 100) / 100 };
    });
  }
  function portfolioTotals(rows) {
    var t = { n: rows.length, priced: 0, unpriced: 0, paidPriced: 0, paidUnpriced: 0, netCad: 0, profitCad: 0 };
    rows.forEach(function (r) {
      if (r.known) { t.priced++; t.paidPriced += r.paid; t.netCad += r.netCad; t.profitCad += r.profitCad; } else { t.unpriced++; t.paidUnpriced += r.paid; }
    });
    ['paidPriced', 'paidUnpriced', 'netCad', 'profitCad'].forEach(function (k) { t[k] = Math.round(t[k] * 100) / 100; });
    return t;
  }
  /* spreadsheet-safe CSV: a cell that starts with = + - @ tab or CR is made inert so Excel/Sheets cannot run it as a formula */
  function csvCell(v) {
    var s = String(v == null ? '' : v).replace(BAD_CHARS, '');
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;   /* a plain number like -12.30 is left alone */
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function ownCsv(rows) {
    var head = ['Name', 'Set', 'Number', 'Version', 'Copies', 'Paid each (CAD)', 'Market estimate each (CAD, modeled)', 'You would keep after fees (CAD)', 'Profit or loss (CAD)'];
    var lines = [head.map(csvCell).join(',')];
    rows.forEach(function (r) {
      var w = r.item;
      lines.push([w.name, w.setName, w.number, w.sub, w.qty, w.costCad.toFixed(2), r.known ? r.eachCad.toFixed(2) : 'unknown', r.known ? r.netCad.toFixed(2) : 'unknown', r.known ? r.profitCad.toFixed(2) : 'unknown'].map(csvCell).join(','));
    });
    return lines.join('\r\n') + '\r\n';
  }

  /* ---------- check-the-comps links (we only link out; we never fetch these sites) ---------- */
  function compLinks(title, group) {
    var q = encodeURIComponent(String(title || '').replace(/\s+/g, ' ').trim());
    var l = [{ id: 'ebay', label: 'eBay.ca sold', url: 'https://www.ebay.ca/sch/i.html?_nkw=' + q + '&LH_Sold=1&LH_Complete=1' }];
    if (group === 'sneakers') {
      l.push({ id: 'stockx', label: 'StockX', url: 'https://stockx.com/search?s=' + q });
      l.push({ id: 'goat', label: 'GOAT', url: 'https://www.goat.com/search?query=' + q });
    } else {
      l.push({ id: 'tcgplayer', label: 'TCGplayer', url: 'https://www.tcgplayer.com/search/pokemon/product?q=' + q });
      l.push({ id: 'pricecharting', label: 'PriceCharting', url: 'https://www.pricecharting.com/search-products?q=' + q + '&type=prices' });
    }
    return l;
  }

  /* ---------- calendar file (.ics) ---------- */
  var TZID = 'America/Winnipeg', MB_FIXED_FROM = '2026-11-01', UID_HOST = 'dropwatch.calasautomations.com';
  var DISCLAIMER = 'Release dates can change. Check the official page before you travel or queue. Not financial advice.';
  function icsEsc(t) { return String(t).replace(BAD_CHARS, '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n'); }
  function utf8Len(ch) { var c = ch.codePointAt(0); return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4; }
  function fold(line) {
    if (/^[\x20-\x7e]*$/.test(line)) {                      /* plain ASCII (almost every line): cut by length, no per-character work */
      if (line.length <= 75) return [line];
      var o = [line.slice(0, 75)];
      for (var i = 75; i < line.length; i += 74) o.push(' ' + line.slice(i, i + 74));
      return o;
    }
    var total = 0; Array.from(line).forEach(function (ch) { total += utf8Len(ch); });
    if (total <= 75) return [line];
    var out = [], cur = '', size = 0;
    Array.from(line).forEach(function (ch) {
      var b = utf8Len(ch);
      if (size + b > 75) { out.push(cur); cur = ' ' + ch; size = 1 + b; } else { cur += ch; size += b; }
    });
    out.push(cur);
    return out;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function parseTime(t) {
    var m = /^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*$/.exec(t || '');
    if (!m) return null;
    var h = +m[1], mi = +m[2], ap = m[3].toLowerCase();
    if (h < 1 || h > 12 || mi > 59) return null;
    return [(h % 12) + (ap === 'pm' ? 12 : 0), mi];
  }
  function addDaysIso(iso, n) { var d = new Date(Date.parse(iso + 'T12:00:00Z') + n * 86400000); return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()); }
  function localStamp(iso, hh, mm, plus) {
    var base = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), hh, mm) + (plus || 0) * 60000, d = new Date(base);
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00';
  }
  function stampUtc(d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z'; }
  /* a real calendar day, not just something shaped like one (2026-02-30 and 2026-13-45 are refused) */
  function validDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return false;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
  }
  /* a link that is safe to put in a calendar file: plain http(s), no spaces or control characters */
  function icsUrl(u) { return /^https?:\/\/[^\s\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]+$/i.test(String(u || '')) ? String(u) : ''; }
  function vevent(ev, stamp) {
    if (!validDate(ev.date)) return null;
    var lines = ['BEGIN:VEVENT', 'UID:' + (String(ev.id == null ? '' : ev.id).replace(/[^A-Za-z0-9._-]/g, '-') || 'drop') + '@' + UID_HOST, 'DTSTAMP:' + stampUtc(stamp)];
    var t = parseTime(ev.time), alarms;
    if (t) {
      if (ev.date >= MB_FIXED_FROM)   /* Manitoba is UTC-5 all year from 2026-11-01: exact UTC, so out-of-date phones cannot shift it */
        lines.push('DTSTART:' + localStamp(ev.date, t[0], t[1], 300) + 'Z', 'DTEND:' + localStamp(ev.date, t[0], t[1], 330) + 'Z');
      else lines.push('DTSTART;TZID=' + TZID + ':' + localStamp(ev.date, t[0], t[1], 0), 'DTEND;TZID=' + TZID + ':' + localStamp(ev.date, t[0], t[1], 30));
      alarms = ['-P1D', '-PT15M'];
    } else {
      lines.push('DTSTART;VALUE=DATE:' + ev.date.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + addDaysIso(ev.date, 1));
      alarms = ['-PT15H', 'PT9H'];
    }
    lines.push('SUMMARY:' + icsEsc('Dropwatch: ' + ev.title));
    var desc = (ev.note || '') + (ev.note ? ' ' : '') + DISCLAIMER;
    var url = icsUrl(ev.url);
    if (url) { desc += ' ' + url; lines.push('URL:' + url); }
    lines.push('DESCRIPTION:' + icsEsc(desc));
    alarms.forEach(function (a) { lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Dropwatch: ' + ev.title), 'TRIGGER:' + a, 'END:VALARM'); });
    lines.push('END:VEVENT');
    return lines;
  }
  function buildIcs(events, now) {
    var stamp = now || new Date();
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Calas Automations Inc.//Dropwatch//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:Dropwatch drops', 'X-WR-TIMEZONE:' + TZID,
      'X-WR-CALDESC:' + icsEsc('Pokemon and sneaker release dates from Dropwatch (Winnipeg). ' + DISCLAIMER),
      'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H'];
    (events || []).forEach(function (ev) { var v = vevent(ev, stamp); if (v) lines = lines.concat(v); });
    lines.push('END:VCALENDAR');
    var out = [];
    lines.forEach(function (l) { out = out.concat(fold(l)); });
    return out.join('\r\n') + '\r\n';
  }

  var api = { esc: esc, safeUrl: safeUrl, daysBetween: daysBetween, freshness: freshness, norm: norm, search: search, rowKey: rowKey,
    imageUrl: imageUrl, thinMarket: thinMarket, seriesFor: seriesFor, pctChange: pctChange, checkTargets: checkTargets, addWatch: addWatch,
    compLinks: compLinks, buildIcs: buildIcs, parseTime: parseTime, validDate: validDate, icsUrl: icsUrl,
    encodeCalc: encodeCalc, decodeCalc: decodeCalc, cleanOwn: cleanOwn, addOwn: addOwn, portfolioRows: portfolioRows, portfolioTotals: portfolioTotals, csvCell: csvCell, ownCsv: ownCsv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DWCore = api;
})(typeof window !== 'undefined' ? window : this);
