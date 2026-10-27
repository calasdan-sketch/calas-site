// node --test receiptsort/app/   (permanent regression tests from the 2026-10-26 audit)
// Fixtures: fixtures/ocr-text.json is the real OCR output (tesseract.js) of the 8 generated
// receipts in claude-bridge/data/r10/wpaudit/rcpt, so these run without any OCR engine.
// Target: every wrong-total case ends up needs_review, never OK.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('./parse.js');
const OCR = require('./fixtures/ocr-text.json');
const row = (f) => P.extract(OCR[f]);
const review = (r) => r.status.startsWith('needs_review');

test('r1 clean Canadian receipt is ok', () => {
  const r = row('r1_ca_clean.png');
  assert.deepEqual([r.vendor, r.date, r.subtotal, r.gst, r.total, r.currency, r.status], ['TIM HORTONS #4412', '2026-10-14', 7.78, 0.39, 8.17, 'CAD', 'ok']);
});

test('r2 Manitoba GST + PST/RST columns are captured and add up', () => {
  const r = row('r2_mb_gst_pst.png');
  assert.equal(r.gst, 3.07); assert.equal(r.pst, 4.30); assert.equal(r.total, 68.86);
  assert.equal(r.status, 'ok');
});

test('r3 Quebec: sous-total, TPS (gst) and TVQ (pst) are recognised', () => {
  const r = row('r3_qc_gst_qst.png');
  assert.equal(r.subtotal, 12.00); assert.equal(r.gst, 0.60); assert.equal(r.pst, 1.20); assert.equal(r.total, 13.80);
  assert.equal(r.date, '2026-10-14'); assert.equal(r.status, 'ok');
});

test('r4 US Walmart: sales tax column, USD flagged, never OK as CAD', () => {
  const r = row('r4_usd.png');
  assert.equal(r.currency, 'USD'); assert.equal(r.sales_tax, 2.36); assert.equal(r.total, 33.82);
  assert.ok(review(r)); assert.match(r.reason, /USD/);
});

test('r5 EUR: comma decimals read correctly, 21.10.2026 is a date not an amount', () => {
  const r = row('r5_eur.png');
  assert.equal(r.currency, 'EUR'); assert.equal(r.subtotal, 7.30); assert.equal(r.total, 8.03);
  assert.equal(r.date, '2026-10-21');
  assert.notEqual(r.total, 21.10);
  assert.ok(review(r));
});

test('r6 blurry fuel receipt: no guessed total, needs review', () => {
  const r = row('r6_blurry.png');
  assert.equal(r.total, null); // used to be 41.21 (litres) and marked ok
  assert.ok(review(r));
});

test('r7 unreadable low-res photo: vendor not invented, needs review', () => {
  const r = row('r7_lowres_jpeg.jpg');
  assert.equal(r.vendor, null); assert.equal(r.total, null);
  assert.ok(review(r));
});

test('r8 "Total Tax" is not the total; ambiguous 03/04/2026 date stays blank', () => {
  const r = row('r8_tax_after_total.png');
  assert.equal(r.total, 126.00); assert.equal(r.sales_tax, 6.00); assert.equal(r.date, null);
  assert.ok(review(r));
});

test('NO wrong-total case is ever ok (any receipt that fails its own arithmetic)', () => {
  const bad = [
    'SHELL\n2026-10-02\nRegular 41.21 L\nTotal 65.29',                       // no subtotal/tax to check
    'PUB\n2026-10-02\nSubtotal 40.00\nGST 2.00\nTotal 42.00\nTip 8.00\nTotal charged 50.00', // total moved
    'STORE\n2026-10-02\nSubtotal 50.00\nGST 2.50\nTotal 20.00',              // subtotal bigger than total
    'STORE\n2026-10-02\n5.00\n9.99\n',                                       // no total line: must not use biggest
    'Corner Store\n2026-09-14\n5.00\n5.00\n',
    'STORE\n2026-10-02\nReturn -20.00\nTotal -20.00'
  ];
  bad.forEach((t) => { const r = P.extract(t); assert.ok(review(r), 'should need review: ' + JSON.stringify(t) + ' -> ' + JSON.stringify(r)); });
  assert.equal(P.extract('STORE\n2026-10-02\n5.00\n9.99\n').total, null);
});

test('needs_review when subtotal and tax are both missing, even with a total line', () => {
  const r = P.extract('Tim Hortons\n2026-09-15\nCoffee 2.00\nTotal 2.00\n');
  assert.equal(r.total, 2.00); assert.ok(review(r)); assert.match(r.reason, /no subtotal or tax/);
  assert.ok(review(P.extract('Shop\n2026-10-02\nGST 0.50\nTotal 10.50')));
  assert.match(P.extract('Shop\n2026-10-02\nGST 0.50\nTotal 10.50').reason, /no subtotal line/);
});

test('"sous-total", "Total Tax", "sales tax", QST, RST columns', () => {
  const r = P.extract('Boulangerie Lune\n2026-10-02\nSous-total 10.00\nTPS 0.50\nQST 0.99\nTotal 11.49');
  assert.deepEqual([r.subtotal, r.gst, r.pst, r.total, r.status], [10, 0.5, 0.99, 11.49, 'ok']);
  const m = P.extract('Prairie Hardware\n2026-10-02\nSubtotal 100.00\nGST 5.00\nRST 7.00\nTotal 112.00');
  assert.deepEqual([m.gst, m.pst, m.status], [5, 7, 'ok']);
  const s = P.extract('Prairie Hardware\n2026-10-02\nSubtotal 100.00\nSales Tax 7.00\nTotal 107.00');
  assert.deepEqual([s.sales_tax, s.status], [7, 'ok']);
});

test('comma-decimal and thousands parsing', () => {
  assert.equal(P.money('4,80'), 4.8);
  assert.equal(P.money('1.234,56'), 1234.56);
  assert.equal(P.money('1,234.56'), 1234.56);
  assert.deepEqual(P.allMoney('Total 1,234.56'), [1234.56]);
  assert.deepEqual(P.allMoney('Netto 1.234,56 EUR'), [1234.56]);
  assert.deepEqual(P.allMoney('9.975% 1.20'), [1.2]);
});

test('dates are never read as amounts and dotted dates parse', () => {
  assert.deepEqual(P.allMoney('21.10.2026'), []);
  assert.deepEqual(P.allMoney('10/21/2026 total 5.00'), [5]);
  assert.equal(P.parseDate('21.10.2026'), '2026-10-21');
  assert.equal(P.parseDate('03.04.2026'), null);
});

test('currency detection: USD / US$ / EUR / default CAD', () => {
  assert.equal(P.detectCurrency('Total US$ 12.00').code, 'USD');
  assert.equal(P.detectCurrency('Total 12,00 \u20ac').code, 'EUR');
  assert.equal(P.detectCurrency('Total 12.00 GST 0.60').code, 'CAD');
  assert.equal(P.detectCurrency('Total 12.00 CAD').assumed, false);
});

test('low-quality vendor text is dropped, real vendors kept', () => {
  assert.equal(P.vendorLooksReal('BA COT EE Ae MT Ts'), false);
  assert.equal(P.vendorLooksReal('SHELL #221'), true);
  assert.equal(P.vendorLooksReal('suELL 22)'), false);
  assert.equal(P.vendorLooksReal('etn Gl FASE BUEUIANLAAT Se ee ee NES'), false);
  assert.equal(P.vendorLooksReal('PRINCESS AUTO'), true);
  assert.equal(P.vendorLooksReal('TIM HORTONS #4412'), true);
  assert.equal(P.vendorLooksReal('DEPANNEUR BOUCHARD'), true);
  assert.equal(P.vendorLooksReal('CAFE DE FLORE'), true);
  assert.equal(P.vendorLooksReal('ï¿½?o2 ï¿½'), false);
});

test('per-currency totals: foreign receipts never added to CAD totals', () => {
  const rows = [
    Object.assign({ file: 'a' }, P.extract('Tim Hortons\n2026-09-14\nSubtotal 10.00\nGST 0.50\nTotal 10.50')),
    Object.assign({ file: 'b' }, P.extract('Walmart\n10/21/2026\nSubtotal $31.46\nSales Tax $2.36\nTotal $33.82\nUSD')),
    Object.assign({ file: 'c' }, P.extract('Cafe de Flore\n21.10.2026\nNetto 7,30 EUR\nTVA 0,73 EUR\nTotal 8,03 EUR'))
  ];
  const s = P.summarize(rows);
  assert.equal(s.total, 10.50);
  assert.equal(s.foreignCount, 2);
  assert.equal(s.byCurrency.USD.total, 33.82);
  assert.equal(s.byCurrency.EUR.total, 8.03);
  assert.equal(s.byCurrency.CAD.total, 10.50);
  assert.equal(s.byCategory['Office & Supplies'], undefined);
  const acct = P.toAccountingCSV(rows);
  assert.match(acct, /2026-09-14,Tim Hortons,Meals & Entertainment,10\.50,CAD/);
  assert.doesNotMatch(acct, /,33\.82,USD/); // foreign amount is not in the Amount column
  assert.match(acct, /USD 33\.82 - convert to CAD/);
  const csv = P.toCSV(rows);
  assert.match(csv.split('\r\n')[0], /,pst,sales_tax,total,currency,/);
});

test('privacy: receipt text is never sent anywhere (no network calls in the page code)', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, 'parse.js'), 'utf8');
  [html, js].forEach((src) => {
    assert.doesNotMatch(src, /\bfetch\s*\(/);
    assert.doesNotMatch(src, /XMLHttpRequest|sendBeacon|WebSocket|new FormData|\.upload\b/);
  });
});

test('phone layout: stacked cards under 600px and no overlap with the chat button', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(html, /@media\s*\(max-width:\s*600px\)/);
  assert.match(html, /data-label=/);
  assert.match(html, /\.catwrap\{[^}]*overflow-x:auto/);
  assert.match(html, /padding-bottom:\s*(9\d|1\d\d)px/); // room under the fixed "Ask Cara" button
});
