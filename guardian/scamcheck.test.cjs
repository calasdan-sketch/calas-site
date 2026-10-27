// node --test guardian/scamcheck.test.cjs
// The lookup contract for the copy that is actually served at /guardian/scamcheck.js:
// only 6-hex fingerprint prefixes leave the device, and message text is never in any request.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, 'scamcheck.js'), 'utf8');

function phone() {
  const sent = [];
  const box = { window: { crypto: globalThis.crypto }, crypto: globalThis.crypto, TextEncoder, localStorage: { getItem: () => '' },
    fetch: async (url, init) => { sent.push({ url: String(url), init: init || {} }); return { json: async () => ({ ok: true, matches: [] }) }; } };
  vm.runInNewContext(src, box);
  return { WP: box.window.WPScam, sent };
}

test('only 6-hex prefixes leave the device; message text is never in a request', async () => {
  const { WP, sent } = phone();
  const message = 'URGENT from CRA. Call 204-555-0142 or visit http://cra-refund-secure.top/pay now. Send gift cards to @taxagent. Reply to refunds@cra-fake.com';
  const items = WP.extract(message);
  assert.ok(items.length >= 4);
  await WP.check(items);
  assert.equal(sent.length, 1);
  const u = new URL(sent[0].url);
  assert.equal(u.pathname, '/api/scam/lookup');
  assert.ok(!sent[0].init.method || sent[0].init.method === 'GET');
  assert.equal(sent[0].init.body, undefined);
  assert.ok(!sent[0].init.headers || !sent[0].init.headers.Authorization);
  assert.deepEqual([...u.searchParams.keys()], ['p']);
  const prefixes = u.searchParams.get('p').split(',');
  assert.equal(prefixes.length, items.length);
  prefixes.forEach((p) => assert.match(p, /^[0-9a-f]{6}$/));
  const full = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(items[0].key)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  assert.equal(prefixes[0], full.slice(0, 6));
});

test('a message with nothing to look up sends nothing at all', async () => {
  const { WP, sent } = phone();
  await WP.check(WP.extract('Hi mom, see you at dinner on Wednesday!'));
  assert.equal(sent.length, 0);
});

test('the privacy comment is honest: the server is not blind to prefixes or the caller address', () => {
  assert.doesNotMatch(src, /can't tell what was checked|never learns/i);
  assert.match(src, /NOT blind/);
  assert.match(src, /salted hash/);
});

test('nothing but the report call sends the number itself, and only on an explicit report', async () => {
  const { WP, sent } = phone();
  await WP.check(WP.extract('call 204-555-0142'));
  assert.ok(sent.every((s) => /\/api\/scam\/lookup\?p=[0-9a-f,]+$/.test(s.url)));
  await WP.report([{ kind: 'phone', value: '204-555-0142' }], 50);
  assert.equal(sent[sent.length - 1].init.method, 'POST');
});
