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

test('uncategorized when nothing matches', () => {
  assert.equal(P.categorize('Zzyzx Widgets', 'thing 1.00'), 'Uncategorized');
});
