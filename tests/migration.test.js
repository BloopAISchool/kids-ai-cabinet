'use strict';
// Tests the real js/migrate.js (whole file, not a copy).
// legacy keys: remove after 2027-03
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js/migrate.js'), 'utf8');

function store(initial, overrides) {
  const m = new Map(Object.entries(initial));
  return {
    m,
    localStorage: Object.assign({
      getItem: k => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: k => m.delete(k)
    }, overrides)
  };
}

function run(initial, overrides) {
  const s = store(initial, overrides);
  vm.runInNewContext(src, { localStorage: s.localStorage });
  return Object.fromEntries(s.m);
}

test('copies old keys to new byte-for-byte and removes old', () => {
  const profile = JSON.stringify({ name: 'Ann', age: '9-11', xp: 120 });
  const r = run({ 'bloop-cabinet-v1': profile, 'bloop-age-range': '9-11', 'bloop-parent-cabinet-v1': 'p' });
  assert.deepEqual(r, { 'sevalumo-cabinet-v1': profile, 'sevalumo-age-range': '9-11', 'sevalumo-parent-cabinet-v1': 'p' });
  assert.deepEqual(JSON.parse(r['sevalumo-cabinet-v1']), { name: 'Ann', age: '9-11', xp: 120 });
});

test('does not overwrite an existing new key, still removes the old one', () => {
  assert.deepEqual(run({ 'bloop-cabinet-v1': 'old', 'sevalumo-cabinet-v1': 'new' }), { 'sevalumo-cabinet-v1': 'new' });
});

test('empty-string old value is migrated, not skipped', () => {
  assert.deepEqual(run({ 'bloop-age-range': '' }), { 'sevalumo-age-range': '' });
});

test('idempotent: a second run changes nothing', () => {
  const s = store({ 'bloop-cabinet-v1': '{"a":1}' });
  vm.runInNewContext(src, { localStorage: s.localStorage });
  const once = Object.fromEntries(s.m);
  vm.runInNewContext(src, { localStorage: s.localStorage });
  assert.deepEqual(Object.fromEntries(s.m), once);
});

test('no-op when nothing legacy', () => {
  assert.deepEqual(run({ x: '1' }), { x: '1' });
});

test('getItem throwing does not throw out of the script', () => {
  assert.doesNotThrow(() => run({}, { getItem() { throw new Error('denied'); } }));
});

test('missing localStorage (ReferenceError) does not throw', () => {
  assert.doesNotThrow(() => vm.runInNewContext(src, {}));
});

test('setItem throwing (quota) keeps the old key and still migrates the other keys', () => {
  const r = run(
    { 'bloop-cabinet-v1': 'big', 'bloop-age-range': '6-8' },
    { setItem() { throw new Error('QuotaExceededError'); } }
  );
  assert.equal(r['bloop-cabinet-v1'], 'big');
  assert.equal(r['sevalumo-cabinet-v1'], undefined);
  // age-range had no space either, but its failure must not depend on the first key's failure
  assert.equal(r['bloop-age-range'], '6-8');
});

test('one key failing does not stop the others', () => {
  const s = store({ 'bloop-cabinet-v1': 'c', 'bloop-age-range': '6-8' });
  const real = s.localStorage.setItem;
  s.localStorage.setItem = (k, v) => { if (k === 'sevalumo-cabinet-v1') throw new Error('x'); return real(k, v); };
  vm.runInNewContext(src, { localStorage: s.localStorage });
  const r = Object.fromEntries(s.m);
  assert.equal(r['bloop-cabinet-v1'], 'c');
  assert.equal(r['sevalumo-age-range'], '6-8');
  assert.equal(r['bloop-age-range'], undefined);
});

test('index.html runs migrate.js before every storage read (skin script, skin.js, app.js)', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const at = s => { const i = html.indexOf(s); assert.ok(i >= 0, s + ' not found'); return i; };
  const mig = at('<script src="js/migrate.js"></script>');
  assert.ok(mig < at('<script src="../skin.js"></script>'));
  assert.ok(mig < html.indexOf('localStorage'));
  assert.ok(mig < at('<script src="js/app.js"></script>'));
  assert.ok(mig < at('</head>'));
});
