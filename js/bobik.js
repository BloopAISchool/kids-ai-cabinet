'use strict';

// Sevi, S7 Hybrid, as the one drawing behind the old bobik.js API.
//
// The procedural robot that used to live here is gone. Every call now returns the final art from brand/sevi/
// (never redrawn, never edited): the age form for the page's track, cropped, with the old state names mapped to
// a CSS motion on that form (S7 has no per-emotion drawings).
//
//   bob(stateObj, palette, size, crop)   -> HTML string (palette is ignored, kept so old call sites still work)
//   renderBobik(stateId, palette, size)  -> same, by state id
//   STATES / EMOTIONS / POSES            -> the state ids the course apps and sevi-pose.js use
//   setForm('explorers'|'inventors'|'creators'|'pros'), setTier(0..3)
//
// Which form: setForm()/setTier(), else <html data-sevi-form="...">, else Creators (ages 12-14).
// The cabinet adds: formForGroup('9-11') maps the child's age track to a form, badge(px) is the ink head badge for the
// logo size. Assets live in ../brand/sevi/ relative to this file (document.currentScript), so the cabinet works
// standalone and when served under /kids-ai-cabinet/ inside the main site.

var Bobik = (function () {
var FORMS = ['explorers', 'inventors', 'creators', 'pros'];

// Crop boxes in the 400x400 art space. full = the whole figure, bust = head and torso (small stickers, avatars).
// Measured from the painted bounds of each *-clear.svg file (getBBox) plus a few units of air.
// The bust always ends about 12 units below the Dial O ring on the chest (ring bottom: explorers 302, inventors 275,
// creators 251, pros 231), so the logo is never cut in half, the same framing as brand/sevi/mark.svg.
var CROPS = {
  explorers: { full: [102, 98, 216, 292], bust: [102, 98, 216, 216] },
  inventors: { full: [104, 74, 208, 312], bust: [104, 74, 208, 214] },
  creators:  { full: [110, 52, 194, 334], bust: [110, 52, 194, 212] },
  pros:      { full: [114, 36, 170, 350], bust: [114, 36, 170, 208] }
};

// Old state -> what it means and the CSS motion on the form (class sevi-s7--<id>, defined in CSS below).
// S7 art has one pose per age, so the feeling is carried by motion: hop, tilt, lean, pop. Nothing is acted with the face.
function S(id, d, p) { p = p || {}; p.id = id; p.d = d; return p; }
var STATES = {
  neutral:  S('neutral',  'default, breathing'),
  joy:      S('joy',      'right answer: a small hop'),
  surprise: S('surprise', 'unexpected result: a quick pop'),
  sad:      S('sad',      'wrong answer, try again: a slow lean and a droop (no tears, no red)'),
  think:    S('think',    'waiting for the AI: a slow sway'),
  delight:  S('delight',  'new level: a bigger hop with a turn'),
  wink:     S('wink',     'a hint: a small nod'),
  hello:    S('hello',    'start of a lesson: a friendly sway (the art already waves)'),
  victory:  S('victory',  'course finished: two big jumps'),
  point:    S('point',    'look here: a lean towards the content'),
  idea:     S('idea',     'the aha moment: a pop and a warm glow'),
  run:      S('run',      'loading, on our way: a forward lean and a trot'),
  sleep:    S('sleep',    'paused: tilted, slow, dimmed'),
  oops:     S('oops',     'head tilt after a miss (6-8), never sad')
};
var EMOTIONS = ['joy', 'surprise', 'sad', 'think', 'delight', 'wink'];
var POSES = ['hello', 'victory', 'point', 'idea', 'run', 'sleep'];

var CSS =
  '.sevi-s7{display:block;line-height:0;transform-origin:50% 100%}' +
  '.sevi-s7 svg{display:block;width:100%;height:auto;overflow:hidden}' +
  // static poses: a tilt is not motion, so it stays under prefers-reduced-motion
  '.sevi-s7--sad{transform:rotate(-5deg) translateY(2%)}' +
  '.sevi-s7--oops{transform:rotate(-8deg)}' +
  '.sevi-s7--think{transform:rotate(-3deg)}' +
  '.sevi-s7--point{transform:translateX(4%) rotate(3deg)}' +
  '.sevi-s7--run{transform:rotate(6deg)}' +
  '.sevi-s7--sleep{transform:rotate(-8deg);filter:saturate(.8) brightness(.96)}' +
  '.sevi-s7--idea{filter:drop-shadow(0 0 5px #FFCE3A)}' +
  '@media (prefers-reduced-motion:no-preference){' +
  '.sevi-s7--neutral{animation:sevi-s7-breathe 3.6s ease-in-out infinite}' +
  '.sevi-s7--hello{animation:sevi-s7-sway 1.6s ease-in-out 2}' +
  '.sevi-s7--joy{animation:sevi-s7-hop .7s ease-out 2}' +
  '.sevi-s7--delight{animation:sevi-s7-hop-turn .9s ease-out 2}' +
  '.sevi-s7--victory{animation:sevi-s7-jump .9s ease-out 2}' +
  '.sevi-s7--surprise{animation:sevi-s7-pop .45s ease-out 1}' +
  '.sevi-s7--wink{animation:sevi-s7-nod .8s ease-in-out 1}' +
  '.sevi-s7--think{animation:sevi-s7-ponder 2.8s ease-in-out infinite}' +
  '.sevi-s7--point{animation:sevi-s7-lean 1.6s ease-in-out infinite alternate}' +
  '.sevi-s7--idea{animation:sevi-s7-pop .6s ease-out 1}' +
  '.sevi-s7--run{animation:sevi-s7-trot .5s ease-in-out infinite alternate}' +
  '.sevi-s7--sleep{animation:sevi-s7-breathe 5s ease-in-out infinite}' +
  '}' +
  '@keyframes sevi-s7-breathe{50%{transform:scale(1.02,1.03)}}' +
  '@keyframes sevi-s7-sway{0%,100%{transform:rotate(0)}30%{transform:rotate(-4deg)}70%{transform:rotate(4deg)}}' +
  '@keyframes sevi-s7-hop{40%{transform:translateY(-12%)}70%{transform:translateY(0) scale(1.03,.97)}}' +
  '@keyframes sevi-s7-hop-turn{40%{transform:translateY(-14%) rotate(-6deg)}70%{transform:translateY(0) rotate(4deg)}}' +
  '@keyframes sevi-s7-jump{35%{transform:translateY(-18%) rotate(-3deg)}65%{transform:translateY(0) scale(1.04,.96)}}' +
  '@keyframes sevi-s7-pop{40%{transform:scale(1.1)}100%{transform:scale(1)}}' +
  '@keyframes sevi-s7-nod{40%{transform:rotate(-5deg) translateY(2%)}100%{transform:rotate(0)}}' +
  '@keyframes sevi-s7-ponder{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}' +
  '@keyframes sevi-s7-lean{from{transform:translateX(2%) rotate(1deg)}to{transform:translateX(6%) rotate(4deg)}}' +
  '@keyframes sevi-s7-trot{from{transform:rotate(5deg) translateY(0)}to{transform:rotate(7deg) translateY(-4%)}}';

var form = 'creators';
var formPinned = false;
// <script src="js/bobik.js"> -> "<dir of js>/brand/sevi/". Falls back to a path relative to the page.
var BASE = (function () {
  try {
    var s = document.currentScript && document.currentScript.src;
    if (s) return s.replace(/[^\/]*(\?.*)?$/, '') + '../brand/sevi/';
  } catch (e) { /* node */ }
  return '../brand/sevi/';
})();

// Age track id of the profile ('6-8', '9-11', '12-14', '15-17', old '14-17') -> Sevi form. Unknown -> Creators.
var GROUP_FORM = { '6-8': 'explorers', '9-11': 'inventors', '12-14': 'creators', '15-17': 'pros', '14-17': 'pros' };
function formForGroup(id) { return GROUP_FORM[id] || 'creators'; }

// Ink head badge for small sizes (logo): a dark circle with the head mark, so the cream helmet reads on any header.
function badge(size) {
  var px = size || 34;
  return '<span class="sevi-badge" style="width:' + px + 'px;height:' + px + 'px"><img src="' + BASE +
    'mark-head-badge.svg" alt="Sevi" width="200" height="200" decoding="async"></span>';
}

function currentForm() {
  if (formPinned) return form;
  try {
    var a = document.documentElement.getAttribute('data-sevi-form');
    if (FORMS.indexOf(a) >= 0) return a;
  } catch (e) { /* node */ }
  return form;
}
function setForm(f) {
  if (FORMS.indexOf(f) < 0) throw new Error('Unknown Sevi form: ' + f);
  form = f; formPinned = true;
  try { document.documentElement.setAttribute('data-sevi-form', f); } catch (e) { /* node */ }
}
function setTier(t) { setForm(FORMS[Math.max(0, Math.min(3, t | 0))]); }

function injectCss() {
  try {
    if (!document.getElementById('sevi-s7-css')) {
      var st = document.createElement('style');
      st.id = 'sevi-s7-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
  } catch (e) { /* node */ }
}
injectCss();

function url(f) { return BASE + 'form-' + f + '-clear.svg'; }

// The stand-alone cropped SVG text for places that cannot use markup with an external <image> (Phaser textures,
// canvas). Needs the source file text (fetch it with seviSvgText()); returns a self-contained SVG string.
function cropSvg(svgText, f, crop, w) {
  var c = CROPS[f][crop || 'full'], h = Math.round(w * c[3] / c[2]);
  return svgText.replace(/viewBox="[^"]*" width="400" height="400"/, 'viewBox="' + c.join(' ') + '" width="' + w + '" height="' + h + '"');
}
function seviSvgText(f) {
  f = f || currentForm();
  return fetch(url(f)).then(function (r) { if (!r.ok) throw new Error('Sevi art: ' + r.status); return r.text(); });
}

function bob(o, pal, size, crop) {
  var f = currentForm(), c = CROPS[f][crop || 'bust'];
  var w = size ? (typeof size === 'number' ? size + 'px' : size) : '100%';
  return '<span class="sevi-s7 sevi-s7--' + o.id + '" style="width:' + w + '">' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + c.join(' ') + '" role="img" aria-label="Sevi" focusable="false">' +
    '<title>Sevi</title><image href="' + url(f) + '" x="0" y="0" width="400" height="400"/></svg></span>';
}

function renderBobik(stateId, palette, size, crop) {
  var st = STATES[stateId];
  if (!st) throw new Error('Unknown Sevi state: ' + stateId);
  return bob(st, palette, size, crop);
}

return {
  FORMS: FORMS, CROPS: CROPS, CSS: CSS, STATES: STATES, EMOTIONS: EMOTIONS, POSES: POSES,
  formForGroup: formForGroup, badge: badge,
  bob: bob, renderBobik: renderBobik, setForm: setForm, setTier: setTier, currentForm: currentForm,
  cropSvg: cropSvg, seviSvgText: seviSvgText
};
})();

// Old call sites use these three as plain globals.
var bob = Bobik.bob, renderBobik = Bobik.renderBobik, STATES = Bobik.STATES, EMOTIONS = Bobik.EMOTIONS, POSES = Bobik.POSES;

if (typeof module !== 'undefined') module.exports = Bobik;
