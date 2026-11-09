'use strict';

// Age theme of Sevalumo: the same colour stops, shapes and morphing Sevi as the parent site
// (kids-ai-courses/channel.js). Keep STOPS and paint() in sync with it.
// 6-8 is bright and playful, 14-17 is calm and dark. The cabinet paints the middle age of the child's group.
var Theme = (function () {
  var root = document.documentElement;
  var dark = window.matchMedia('(prefers-color-scheme: dark)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var STOPS = [
    { bg: '#FFCE3A', onBg: '#1E1A3C', acc: '#FF5B4A', onAcc: '#1E1A3C', s1: '#FF5B4A', s2: '#2F6BEF', s3: '#FFFFFF', page: '#E8F3FF', ink: '#1E1A3C', card: '#FFFFFF', pageD: '#1D1A33', inkD: '#FFF3CF', cardD: '#2A2546', focus: '#2F6BEF',
      body: '#6EC3FF', accent: '#FF5B4A', screen: '#1E1A3C', glow: '#DDF6FF', joint: '#FF8FB1', rad: 28, casl: 1, wd: 900, slnt: -9, tilt: -2, bob: 12 },
    { bg: '#3CCBB0', onBg: '#0E2B2A', acc: '#FF8A3D', onAcc: '#0E2B2A', s1: '#FFE16A', s2: '#FF8A3D', s3: '#F4FFFB', page: '#ECFAF5', ink: '#0E2B2A', card: '#FFFFFF', pageD: '#0F2524', inkD: '#E2F7F1', cardD: '#183533', focus: '#1F5FD6',
      body: '#FFE16A', accent: '#FF8A3D', screen: '#0E2B2A', glow: '#FFF9D9', joint: '#6FD3FF', rad: 20, casl: .7, wd: 840, slnt: -6, tilt: -1.2, bob: 8 },
    { bg: '#2F4FE0', onBg: '#FFFFFF', acc: '#FFD84D', onAcc: '#141A3C', s1: '#FFD84D', s2: '#8FA6FF', s3: '#FFFFFF', page: '#EEF1FD', ink: '#141A3C', card: '#FFFFFF', pageD: '#11163A', inkD: '#E6EAFE', cardD: '#1B2252', focus: '#2F4FE0',
      body: '#C7D2FF', accent: '#FFD84D', screen: '#141A3C', glow: '#FFFFFF', joint: '#FF8A7A', rad: 12, casl: .28, wd: 760, slnt: -2, tilt: -.4, bob: 3 },
    { bg: '#121A2E', onBg: '#EEF1F7', acc: '#F5C842', onAcc: '#121A2E', s1: '#F5C842', s2: '#3A4A70', s3: '#EEF1F7', page: '#0D1322', ink: '#E7EBF3', card: '#172038', pageD: '#0D1322', inkD: '#E7EBF3', cardD: '#172038', focus: '#F5C842',
      body: '#D9DEEA', accent: '#F5C842', screen: '#121A2E', glow: '#FFFFFF', joint: '#7F8FB3', rad: 4, casl: 0, wd: 640, slnt: 0, tilt: 0, bob: 0 }
  ];

  var SHAPES = [
    { x: '47%', y: '4%', w: 110, life: 9, k: 'blob', c: 's1', r: -12 },
    { x: '60%', y: '50%', w: 66, life: 8, k: 'star', c: 's3', r: 10 },
    { x: '51%', y: '36%', w: 54, life: 10, k: 'ring', c: 's2', r: 0 },
    { x: '1%', y: '1%', w: 90, life: 11, k: 'squig', c: 's2', r: 4 },
    { x: '63%', y: '8%', w: 64, life: 12, k: 'tri', c: 's1', r: 18, mob: 1 },
    { x: '44%', y: '74%', w: 80, life: 9.5, k: 'blob', c: 's3', r: 30 },
    { x: '90%', y: '78%', w: 72, life: 13, k: 'ring', c: 's1', r: 0, mob: 1 },
    { x: '75%', y: '68%', w: 46, life: 8.5, k: 'star', c: 's2', r: -20, mob: 1 },
    { x: '72%', y: '92%', w: 110, life: 15, k: 'bar', c: 's2', r: 0 }
  ];
  var SHAPE_SVG = {
    blob: '<svg viewBox="0 0 100 100"><path fill="var(--C)" d="M50 4c20 0 40 12 44 32s-6 46-30 56S8 90 5 62 30 4 50 4z"/></svg>',
    star: '<svg viewBox="0 0 100 100"><path fill="var(--C)" d="M50 2l13 33 35 2-27 22 9 35-30-19-30 19 9-35L2 37l35-2z"/></svg>',
    ring: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="var(--C)" stroke-width="16"/></svg>',
    squig: '<svg viewBox="0 0 100 40"><path fill="none" stroke="var(--C)" stroke-width="9" stroke-linecap="round" d="M5 20c10-16 20-16 30 0s20 16 30 0 20-16 30 0"/></svg>',
    tri: '<svg viewBox="0 0 100 100"><path fill="var(--C)" d="M50 6l46 84H4z"/></svg>',
    bar: '<svg viewBox="0 0 100 20"><rect width="100" height="20" rx="10" fill="var(--C)"/></svg>'
  };

  function mix(a, b, f) { return f <= 0 ? a : f >= 1 ? b : 'color-mix(in oklch, ' + a + ' ' + ((1 - f) * 100).toFixed(1) + '%, ' + b + ')'; }
  function lerp(a, b, f) { return a + (b - a) * f; }
  var COLOR_KEYS = { bg: 'bg', acc: 'acc', s1: 's1', s2: 's2', s3: 's3', body: 'rb-body', accent: 'rb-accent', screen: 'rb-screen', glow: 'rb-glow', joint: 'rb-joint' };

  function paint(age) {
    var v = Math.min(3, Math.max(0, (age - 7) / 3));
    var i = Math.min(2, Math.floor(v)), f = v - i, A = STOPS[i], B = STOPS[i + 1];
    var s = root.style, d = dark.matches;
    Object.keys(COLOR_KEYS).forEach(function (k) { s.setProperty('--' + COLOR_KEYS[k], mix(A[k], B[k], f)); });
    var N = f < .5 ? A : B;
    s.setProperty('--on-bg', N.onBg);
    s.setProperty('--on-acc', N.onAcc);
    s.setProperty('--focus', N.focus);
    // surfaces jump between light and dark in the middle third of a step, so text on them stays readable at every whole age
    var g = Math.min(1, Math.max(0, (f - .35) / .3));
    var page = mix(d ? A.pageD : A.page, d ? B.pageD : B.page, g);
    var ink = (g < .5 ? A : B)[d ? 'inkD' : 'ink'];
    s.setProperty('--page', page);
    s.setProperty('--ink', ink);
    s.setProperty('--card', mix(d ? A.cardD : A.card, d ? B.cardD : B.card, g));
    s.setProperty('--line', 'color-mix(in oklch, ' + ink + ' 15%, transparent)');
    s.setProperty('--soft', 'color-mix(in oklch, ' + ink + ' 72%, ' + page + ')');
    s.setProperty('--rad', lerp(A.rad, B.rad, f).toFixed(1) + 'px');
    s.setProperty('--casl', lerp(A.casl, B.casl, f).toFixed(3));
    s.setProperty('--wd', Math.round(lerp(A.wd, B.wd, f)));
    s.setProperty('--slnt', lerp(A.slnt, B.slnt, f).toFixed(2));
    s.setProperty('--tilt', lerp(A.tilt, B.tilt, f).toFixed(2) + 'deg');
    s.setProperty('--bob', lerp(A.bob, B.bob, f).toFixed(1) + 'px');
    s.setProperty('--m', Math.min(1, Math.max(0, (age - 6) / 10)).toFixed(3));
    s.setProperty('--age', age.toFixed(2));
  }

  // Group id from the profile ('9-11') → the age painted: the stop of that group, so each group has one clean look
  var GROUP_AGE = { '6-8': 7, '9-11': 10, '12-14': 13, '14-17': 16 };
  function ageOf(groupId) { return GROUP_AGE[groupId] || 6; }

  // Smooth travel through every age in between, so a change from 7 to 16 visibly grows up
  var ageNow = null, raf = 0;
  function go(target) {
    cancelAnimationFrame(raf);
    if (ageNow === null || reduce.matches || ageNow === target) { ageNow = target; paint(target); done(target); return; }
    var from = ageNow, start = performance.now(), dur = Math.min(900, 160 + Math.abs(target - from) * 70);
    (function step(now) {
      var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      ageNow = from + (target - from) * e;
      paint(ageNow);
      if (p < 1) raf = requestAnimationFrame(step); else done(target);
    })(start);
  }
  function done(age) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', STOPS[Math.min(3, Math.round(Math.max(0, (age - 7) / 3)))].bg);
  }

  function shapes() {
    return SHAPES.map(function (p) {
      return '<span class="shape' + (p.mob ? '' : ' shape--wide') + '" style="left:' + p.x + ';top:' + p.y + ';width:' + p.w + 'px;height:' + p.w + 'px;--life:' + p.life + ';--r:' + p.r + 'deg;--C:var(--' + p.c + ')">' + SHAPE_SVG[p.k] + '</span>';
    }).join('');
  }

  // Sevi drawn with the theme colours (--rb-* tokens), so he changes with the age like on the parent site
  var css = document.createElement('style');
  css.textContent = CSS;
  document.head.appendChild(css);

  dark.addEventListener('change', function () { if (ageNow !== null) paint(ageNow); });

  return { ageOf: ageOf, go: go, shapes: shapes, reduce: reduce };
})();
