'use strict';

var ZONES = ['body', 'accent', 'screen', 'glow', 'joint'];

var PALETTES = {
  mint:  { body: '#7AD3C1', accent: '#FFD36E', screen: '#2F3E6B', glow: '#B6F7E6', joint: '#F59DB0' },
  sky:   { body: '#8EC5FF', accent: '#FFC15E', screen: '#2D3A63', glow: '#C8F3FF', joint: '#FF9E8A' },
  lav:   { body: '#B7A6F2', accent: '#FFDA7A', screen: '#3A2F63', glow: '#E4DBFF', joint: '#7ED9C4' },
  peach: { body: '#FFB28E', accent: '#7FD6C7', screen: '#43325E', glow: '#FFE9C7', joint: '#8FB8FF' }
};

var CSS =
  '.pb{fill:var(--rb-body)}.pa{fill:var(--rb-accent)}.ps{fill:var(--rb-screen)}' +
  '.pg{fill:var(--rb-glow)}.pj{fill:var(--rb-joint)}' +
  '.sg{fill:none;stroke:var(--rb-glow);stroke-width:5;stroke-linecap:round}' +
  '.sj{fill:none;stroke:var(--rb-joint);stroke-width:6;stroke-linecap:round}' +
  '.sa{fill:none;stroke:var(--rb-joint);stroke-width:26;stroke-linecap:round}' +
  '.sac{fill:none;stroke:var(--rb-accent);stroke-width:4;stroke-linecap:round;stroke-linejoin:round}' +
  '.hl{fill:#fff;fill-opacity:.3}.sh{fill:#000;fill-opacity:.08}';

function ell(x, y, rx, ry) {
  return '<ellipse class="pg" cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '"/>';
}
function arc(d, w) {
  return '<path class="sg" style="stroke-width:' + (w || 6) + '" d="' + d + '"/>';
}
function heart(x, y, s) {
  return '<path class="pj" transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0 13 C-16 -2 -8 -14 0 -5 C8 -14 16 -2 0 13 Z"/>';
}
function star(x, y, r) {
  var q = r * 0.3;
  return '<path class="pa" d="M' + x + ' ' + (y - r) + ' L' + (x + q) + ' ' + (y - q) + ' L' + (x + r) + ' ' + y +
    ' L' + (x + q) + ' ' + (y + q) + ' L' + x + ' ' + (y + r) + ' L' + (x - q) + ' ' + (y + q) +
    ' L' + (x - r) + ' ' + y + ' L' + (x - q) + ' ' + (y - q) + ' Z"/>';
}
function dot(x, y, r) {
  return '<circle class="pa" cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
}
function arm(d) {
  return '<path class="sa" d="' + d + '"/>';
}

var EYES = {
  n: ell(124, 114, 11, 14) + ell(176, 114, 11, 14),
  h: arc('M110 120 Q124 100 138 120') + arc('M162 120 Q176 100 190 120'),
  o: '<circle class="pg" cx="124" cy="112" r="15"/><circle class="ps" cx="124" cy="112" r="6"/>' +
     '<circle class="pg" cx="176" cy="112" r="15"/><circle class="ps" cx="176" cy="112" r="6"/>',
  s: ell(124, 120, 10, 12) + ell(176, 120, 10, 12) + arc('M108 100 L138 90', 5) + arc('M192 100 L162 90', 5),
  w: ell(124, 114, 11, 14) + arc('M162 118 Q176 102 190 118'),
  l: heart(124, 112, 1.15) + heart(176, 112, 1.15),
  z: arc('M110 112 Q124 126 138 112') + arc('M162 112 Q176 126 190 112'),
  t: ell(130, 108, 10, 13) + ell(182, 108, 10, 13) + arc('M166 88 Q182 80 196 90', 4)
};

var MOUTHS = {
  smile: arc('M132 140 Q150 156 168 140', 5),
  open:  '<path class="pg" d="M130 138 Q150 166 170 138 Z"/><ellipse class="pj" cx="150" cy="147" rx="8" ry="4"/>',
  o:     '<ellipse class="pg" cx="150" cy="148" rx="8" ry="10"/>',
  tiny:  '<ellipse class="pg" cx="150" cy="146" rx="5" ry="6"/>',
  frown: arc('M134 152 Q150 138 166 152', 5),
  side:  arc('M138 146 Q152 138 166 144', 5)
};

var ANTENNAS = {
  up:    '<path class="sj" d="M150 44 L150 22"/><circle class="pa" cx="150" cy="16" r="11"/>',
  tall:   '<path class="sj" d="M150 44 L150 26"/><circle class="pa" cx="150" cy="16" r="14"/>',
  droop: '<path class="sj" d="M150 44 Q150 26 134 24"/><circle class="pa" cx="127" cy="32" r="10"/>',
  lean:  '<path class="sj" d="M150 44 Q150 30 164 24"/><circle class="pa" cx="170" cy="20" r="11"/>',
  idea:  '<path class="sj" d="M150 44 L150 30"/><circle class="pa" cx="150" cy="20" r="13"/>' +
         '<path class="sac" d="M126 8 L134 16 M174 8 L166 16 M114 24 L124 25 M186 24 L176 25"/>'
};

var FEET = '<ellipse class="pj" cx="120" cy="252" rx="24" ry="12"/><ellipse class="pj" cx="180" cy="252" rx="24" ry="12"/>';
var ARM_L = 'M100 198 L90 222';
var ARM_R = 'M200 198 L210 222';
var TEAR = '<path class="pg" style="fill-opacity:.75" d="M112 134 Q105 144 112 150 Q119 144 112 134 Z"/>';

function S(id, n, d, p) {
  p.id = id; p.n = n; p.d = d;
  return p;
}

var STATES = {
  neutral: S('neutral', 'Обычный', 'базовое состояние', { eyes: 'n', mouth: 'smile' }),
  joy: S('joy', 'Радость', 'верный ответ', {
    eyes: 'h', mouth: 'open', L: 'M100 198 L72 214', R: 'M200 198 L228 214',
    ex: star(40, 70, 9) + star(262, 58, 7)
  }),
  surprise: S('surprise', 'Удивление', 'неожиданный результат', {
    eyes: 'o', mouth: 'o', ant: 'tall', body: 'translate(0 -6)', sh: 66,
    L: 'M100 198 Q66 196 60 170', R: 'M200 198 Q234 196 240 170',
    ex: '<path class="sac" d="M52 40 L66 50 M38 62 L56 68 M248 40 L234 50 M262 62 L244 68"/>'
  }),
  sad: S('sad', 'Грусть', 'ошибка, пробуем снова', {
    eyes: 's', mouth: 'frown', ant: 'droop', face: TEAR
  }),
  think: S('think', 'Задумался', 'ждёт ответ нейросети', {
    eyes: 't', mouth: 'side', ant: 'lean', tilt: -5,
    ex: dot(254, 44, 4) + dot(266, 30, 6) + dot(282, 12, 8)
  }),
  delight: S('delight', 'Восторг', 'новый уровень', {
    eyes: 'l', mouth: 'open', L: 'M100 198 L74 210', R: 'M200 198 L226 210',
    ex: heart(52, 58, 0.9) + heart(250, 46, 0.7) + heart(266, 84, 0.55)
  }),
  wink: S('wink', 'Подмигивает', 'подсказка', {
    eyes: 'w', mouth: 'open', R: 'M200 198 Q232 202 238 180',
    ex: star(264, 74, 9)
  }),
  hello: S('hello', 'Привет', 'начало урока', {
    eyes: 'n', mouth: 'open', R: 'M200 198 Q240 202 254 158',
    ex: '<path class="sac" d="M272 138 Q282 152 276 168"/><path class="sac" d="M284 128 Q296 148 288 172"/>'
  }),
  victory: S('victory', 'Победа', 'курс пройден', {
    eyes: 'h', mouth: 'open', body: 'translate(0 -14)', sh: 50,
    L: 'M100 198 Q34 210 36 96', R: 'M200 198 Q266 210 264 96',
    ex: star(26, 58, 9) + star(276, 50, 9)
  }),
  point: S('point', 'Показывает', 'обращает внимание', {
    eyes: 'n', mouth: 'smile', R: 'M200 198 Q244 192 266 170',
    ex: star(280, 118, 12)
  }),
  idea: S('idea', 'Идея', 'озарение', {
    eyes: 'n', mouth: 'open', ant: 'idea', R: 'M200 198 Q262 206 262 104'
  }),
  run: S('run', 'Бежит', 'загрузка, вперёд', {
    eyes: 'n', mouth: 'open', body: 'rotate(7 150 262)',
    feet: '<ellipse class="pj" cx="110" cy="238" rx="24" ry="12" transform="rotate(-18 110 238)"/>' +
          '<ellipse class="pj" cx="188" cy="254" rx="24" ry="12"/>',
    L: 'M100 198 Q76 212 62 238', R: 'M200 198 Q238 196 250 172',
    ex: '<path class="sac" d="M14 118 L40 118 M6 148 L34 148 M16 178 L38 178"/>'
  }),
  sleep: S('sleep', 'Спит', 'пауза, отдых', {
    eyes: 'z', mouth: 'tiny', ant: 'droop', tilt: -8,
    ex: '<path class="sac" d="M246 34 H262 L246 52 H262"/>' +
        '<path class="sac" style="stroke-width:3.5" d="M270 10 H281 L270 22 H281"/>'
  })
};

var EMOTIONS = ['joy', 'surprise', 'sad', 'think', 'delight', 'wink'];
var POSES = ['hello', 'victory', 'point', 'idea', 'run', 'sleep'];

function bob(o, pal, size) {
  var g = '<ellipse class="sh" cx="150" cy="266" rx="' + (o.sh || 74) + '" ry="9"/>';
  g += '<g' + (o.body ? ' transform="' + o.body + '"' : '') + '>';
  g += (o.feet || FEET);
  g += '<rect class="pb" x="104" y="168" width="92" height="82" rx="36"/>' +
       '<circle class="pa" cx="150" cy="210" r="15"/><circle class="ps" cx="150" cy="210" r="6"/>';
  g += '<g' + (o.tilt ? ' transform="rotate(' + o.tilt + ' 150 178)"' : '') + '>';
  g += '<rect class="pa" x="46" y="92" width="22" height="52" rx="11"/>' +
       '<rect class="pa" x="232" y="92" width="22" height="52" rx="11"/>';
  g += ANTENNAS[o.ant || 'up'];
  g += '<rect class="pb" x="60" y="40" width="180" height="140" rx="64"/>' +
       '<rect class="ps" x="80" y="70" width="140" height="94" rx="42"/>';
  g += EYES[o.eyes || 'n'] + MOUTHS[o.mouth || 'smile'];
  g += '<circle class="pj" cx="100" cy="142" r="8"/><circle class="pj" cx="200" cy="142" r="8"/>';
  g += (o.face || '');
  g += '<ellipse class="hl" cx="100" cy="58" rx="24" ry="8" transform="rotate(-20 100 58)"/>';
  g += '</g>';
  g += arm(o.L || ARM_L) + arm(o.R || ARM_R);
  g += '</g>' + (o.ex || '');

  var head = '<svg';
  if (pal) {
    head += ' xmlns="http://www.w3.org/2000/svg" style="' +
      ZONES.map(function (k) { return '--rb-' + k + ':' + pal[k]; }).join(';') + '"';
  }
  head += ' viewBox="0 -12 300 292" width="' + (size || '100%') + '" role="img" aria-label="Sevi: ' + o.id + '">';
  return head + '<title>' + o.id + '</title>' + (pal ? '<style>' + CSS + '</style>' : '') + g + '</svg>';
}

function renderBobik(stateId, palette, size) {
  var st = STATES[stateId];
  if (!st) throw new Error('Unknown Sevi state: ' + stateId);
  return bob(st, palette || PALETTES.mint, size);
}

if (typeof module !== 'undefined') {
  module.exports = {
    ZONES: ZONES, PALETTES: PALETTES, CSS: CSS, STATES: STATES,
    EMOTIONS: EMOTIONS, POSES: POSES, bob: bob, renderBobik: renderBobik
  };
}
