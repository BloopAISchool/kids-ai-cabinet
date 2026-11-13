'use strict';

// js/bobik.js is a shim: the old state / pose names stay, the drawing is the S7 Hybrid art in brand/sevi/.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const B = require('../js/bobik.js');
const OLD_STATES = ['neutral', 'joy', 'surprise', 'sad', 'think', 'delight', 'wink', 'hello', 'victory', 'point', 'idea', 'run', 'sleep'];
const SEVI_DIR = path.join(__dirname, '..', 'brand', 'sevi');

test('bobik shim: every old state name still exists, plus oops', () => {
    for (const id of OLD_STATES.concat('oops')) assert.ok(B.STATES[id], id);
    assert.deepEqual(B.EMOTIONS.filter(e => !B.STATES[e]), []);
    assert.deepEqual(B.POSES.filter(e => !B.STATES[e]), []);
});

test('bobik shim: renderBobik draws the S7 age form with a per-state class, no old robot palette', () => {
    B.setTier(2);
    for (const id of Object.keys(B.STATES)) {
        const html = B.renderBobik(id, null, 64);
        assert.ok(html.includes('sevi-s7--' + id), id);
        assert.ok(html.includes('brand/sevi/form-creators-clear.svg'), id);
        assert.ok(html.includes('width:64px'), id);
        assert.ok(!/--rb-|class="pb"|class="ps"/.test(html), 'no old palette zones: ' + id);
    }
    assert.throws(() => B.renderBobik('nope'), /Unknown Sevi state/);
});

test('bobik shim: setTier maps 0..3 to Explorers, Inventors, Creators, Pros and clamps', () => {
    const want = ['explorers', 'inventors', 'creators', 'pros'];
    want.forEach((f, t) => {
        B.setTier(t);
        assert.equal(B.currentForm(), f);
        assert.ok(B.bob(B.STATES.neutral).includes('form-' + f + '-clear.svg'));
    });
    B.setTier(9); assert.equal(B.currentForm(), 'pros');
    B.setTier(-4); assert.equal(B.currentForm(), 'explorers');
    assert.throws(() => B.setForm('robot'), /Unknown Sevi form/);
});

test('bobik shim: every form file exists and the crops sit inside the 400 box, bust shorter than full', () => {
    for (const f of B.FORMS) {
        const file = path.join(SEVI_DIR, 'form-' + f + '-clear.svg');
        assert.ok(fs.existsSync(file), file);
        const svg = fs.readFileSync(file, 'utf8');
        assert.ok(/viewBox="0 0 400 400" width="400" height="400"/.test(svg), 'art box is 400x400: ' + f);
        for (const k of ['full', 'bust']) {
            const [x, y, w, h] = B.CROPS[f][k];
            assert.ok(x >= 0 && y >= 0 && x + w <= 400 && y + h <= 400, f + ' ' + k);
        }
        assert.ok(B.CROPS[f].bust[3] < B.CROPS[f].full[3], f);
        // the bust keeps the whole Dial O chest ring (ring bottom in art units, measured from the files)
        const ringBottom = { explorers: 302, inventors: 275, creators: 251, pros: 231 }[f];
        assert.ok(B.CROPS[f].bust[1] + B.CROPS[f].bust[3] >= ringBottom + 8, 'bust cuts the chest logo: ' + f);
        assert.equal(B.CROPS[f].bust[0], B.CROPS[f].full[0]);
    }
});

test('bobik shim: cropSvg keeps the aspect ratio of the crop (no stretching)', () => {
    const svg = fs.readFileSync(path.join(SEVI_DIR, 'form-pros-clear.svg'), 'utf8');
    const out = B.cropSvg(svg, 'pros', 'bust', 72);
    const [, , w, h] = B.CROPS.pros.bust;
    assert.ok(out.includes('viewBox="' + B.CROPS.pros.bust.join(' ') + '" width="72" height="' + Math.round(72 * h / w) + '"'));
    assert.ok(!out.includes('width="400" height="400"'));
});

test('bobik shim: motion lives only inside prefers-reduced-motion: no-preference', () => {
    const outside = B.CSS.replace(/@media \(prefers-reduced-motion:no-preference\)\{[\s\S]*?\}\}/, '');
    assert.ok(!/animation:/.test(outside), 'an animation is declared outside the reduced-motion guard');
    assert.ok(/prefers-reduced-motion:no-preference/.test(B.CSS));
});

test('cabinet: age track id picks the Sevi form, unknown falls back to Creators', () => {
    assert.equal(B.formForGroup('6-8'), 'explorers');
    assert.equal(B.formForGroup('9-11'), 'inventors');
    assert.equal(B.formForGroup('12-14'), 'creators');
    assert.equal(B.formForGroup('15-17'), 'pros');
    assert.equal(B.formForGroup('14-17'), 'pros', 'old id still saved by earlier versions');
    assert.equal(B.formForGroup(''), 'creators');
    assert.equal(B.formForGroup(undefined), 'creators');
    const D = require('../js/data.js');
    for (const g of D.AGE_GROUPS) assert.ok(B.FORMS.includes(B.formForGroup(g.id)), g.id);
});

test('cabinet: art paths are relative to the script (../brand/sevi/), badge uses the head mark file', () => {
    B.setTier(0);
    assert.ok(B.bob(B.STATES.neutral).includes('href="../brand/sevi/form-explorers-clear.svg"'));
    const b = B.badge(34);
    assert.ok(b.includes('../brand/sevi/mark-head-badge.svg') && b.includes('width:34px;height:34px'));
    assert.ok(fs.existsSync(path.join(SEVI_DIR, 'mark-head-badge.svg')));
});

test('cabinet: every course pose in data.js and every state used by app.js is a known state', () => {
    const D = require('../js/data.js');
    for (const c of D.COURSES) assert.ok(B.STATES[c.pose], c.id + ' pose ' + c.pose);
    const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
    const used = new Set([...app.matchAll(/bobik\('(\w+)'/g)].map(m => m[1]));
    ['hello', 'joy', 'think', 'sad', 'delight'].forEach(s => used.add(s));
    for (const s of used) assert.ok(B.STATES[s], 'app.js uses unknown state ' + s);
    for (const m of ['joy', 'surprise', 'delight', 'wink', 'victory']) assert.ok(B.STATES[m], 'petting mood ' + m);
    assert.ok(!app.includes('PALETTES'), 'old palettes are gone');
});

test('cabinet: the XP level titles no longer name a robot', () => {
    const D = require('../js/data.js');
    assert.ok(D.LEVELS.some(l => l.title === 'Sevi Friend'));
    assert.ok(!D.LEVELS.some(l => /robot/i.test(l.title)));
});
