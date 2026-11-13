// node --test receiptsort/app/parse.test.cjs  (same rules as receiptsort.py)
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('./parse.js');

test('a clean receipt reads fully and is ok', () => {
  const r = P.extract('Prairie Hardware\n123 Main St\n204-555-0100\n2026-09-14\nHammer 19.99\nSubtotal 19.99\nGST 1.00\nTotal 20.99\n');
  assert.deepEqual([r.vendor, r.date, r.subtotal, r.gst, r.total, r.status], ['Prairie Hardware', '2026-09-14', 19.99, 1, 20.99, 'ok']);
});

test('ambiguous dates are left blank, never guessed', () => {
  assert.equal(P.parseDate('03/04/2026'), null);
  assert.equal(P.parseDate('13/04/2026'), '2026-04-13');
  assert.equal(P.parseDate('Sep 14, 2026'), '2026-09-14');
  assert.equal(P.parseDate('2026-02-30'), null);
  assert.equal(P.parseDate('2026/10/15'), '2026-10-15');
  assert.equal(P.parseDate('2026.10.5'), '2026-10-05');
  assert.equal(P.parseDate('2826/10/15'), null); // OCR misread year
  assert.equal(P.parseDate('NOV 13, 2026 12:29'), '2026-11-13');
  assert.equal(P.parseDate('13-NOV-2026'), '2026-11-13');
  assert.equal(P.parseDate('13NOV26'), '2026-11-13');
  assert.equal(P.parseDate('Sept 5 2026'), '2026-09-05');
  assert.equal(P.parseDate('Pump 12 2026'), null); // not a month
});

test('a slash-dated receipt keeps its amounts (date not read as money)', () => {
  const r = P.extract('STAPLES\n2026/10/15\nSUB-TOTAL 19.48\nHST 13% 2.53\nTOTAL DUE 22.01\n');
  assert.deepEqual([r.date, r.subtotal, r.gst, r.total, r.status], ['2026-10-15', 19.48, 2.53, 22.01, 'ok']);
});

test('no total line and a tie for the biggest amount -> needs review', () => {
  const r = P.extract('Corner Store\n2026-09-14\n5.00\n5.00\n');
  assert.equal(r.total, null);
  assert.equal(r.status, 'needs_review');
});

test('empty text is flagged, CSV escapes commas and blocks formulas', () => {
  assert.equal(P.extract('').status, 'needs_review (no text found)');
  const csv = P.toCSV([{ file: 'a.jpg', vendor: 'Smith, Jones & Co', total: 12.5, status: 'ok' }, { file: '=HYPERLINK("x")' }]);
  assert.match(csv, /"Smith, Jones & Co"/);
  assert.match(csv, /12\.50/);
  assert.match(csv, /'=HYPERLINK/);
});

test('categories, summary totals, and accounting export', () => {
  const rows = [
    P.extract('Petro-Canada\n2026-09-14\nFuel 50.00\nSubtotal 50.00\nGST 2.50\nTotal 52.50\n'),
    P.extract('Tim Hortons\n2026-09-15\nCoffee 2.00\nTotal 2.00\n')
  ];
  assert.equal(rows[0].category, 'Fuel');
  assert.equal(rows[1].category, 'Meals & Entertainment');
  const s = P.summarize(rows);
  assert.equal(s.count, 2);
  assert.equal(s.total, 54.50);
  assert.equal(s.gst, 2.50);
  assert.equal(s.byCategory['Fuel'].total, 52.50);
  assert.equal(s.byCategory['Fuel'].count, 1);
  const acct = P.toAccountingCSV(rows);
  assert.match(acct, /Date,Description,Category,Amount/);
  assert.match(acct, /2026-09-14,Petro-Canada,Fuel,52\.50/);
});

test('gas receipt with no subtotal: subtotal worked out when GST is exactly 5%', () => {
  const r = P.extract('Ra: Ara\nPETRO-CANADA\n2026-11-05\nFUEL 35.09\nGST 1.67\nTOTAL 35.09\n');
  assert.deepEqual([r.vendor, r.subtotal, r.gst, r.total, r.currency, r.status], ['Petro-Canada', 33.42, 1.67, 35.09, 'CAD', 'ok']);
  // A tax that is not a real rate of (total - tax) is never used to invent a subtotal.
  assert.equal(P.extract('Shell\n2026-11-05\nGST 4.00\nTOTAL 35.09\n').subtotal, null);
});

test('stray letters like INR / CNY in smudges do not make a receipt foreign', () => {
  assert.equal(P.detectCurrency('Ra: Ara INR\nGST 1.67\nTOTAL 35.09').code, 'CAD');
  assert.equal(P.detectCurrency('cNY ~~ CNY\nTotal 12.00').code, 'CAD');
  assert.equal(P.detectCurrency('Total INR 350.00').code, 'INR');
  assert.equal(P.detectCurrency('Total 350.00 INR').code, 'INR');
});

test('chain names found under a garbled logo; store numbers kept', () => {
  assert.equal(P.extract('Tim Hortons #2231\n2026-10-14\nSubtotal 2.19\nGST 0.11\nTotal 2.30').vendor, 'Tim Hortons #2231');
  assert.equal(P.extract('~~ %%\nWELCOME TO\nHOME HARDWARE\n2026-10-14\nTotal 2.30').vendor, 'Home Hardware');
  assert.equal(P.extract('Prairie Supply\n123 Bell Ave\n2026-10-14\nTotal 2.30').vendor, 'Prairie Supply');
});

test('date and vendor from another reading of the same photo fill the gaps', () => {
  const r = P.extract('~~\nSubtotal 10.00\nGST 0.50\nTotal 10.50', { date: '2026-11-13', vendor: 'Esso' });
  assert.deepEqual([r.date, r.vendor, r.total, r.status], ['2026-11-13', 'Esso', 10.50, 'ok']);
});

test('uncategorized when nothing matches', () => {
  assert.equal(P.categorize('Zzyzx Widgets', 'thing 1.00'), 'Uncategorized');
});
