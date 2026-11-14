'use strict';

// Age skin of Sevalumo: the same palettes as the main page (skin.css, a copy of the site's skin.css).
// <html data-skin="kids|teen" data-track="0|1|2|3"> is set from the child's age group: 6-8 butter, 9-11 mint, 12-14 lavender (kids skin),
// 15-17 navy and brass (teen skin). Palettes are discrete, so there is nothing to animate between them.
// Keep the track edges (9, 12, 15) in step with the site's index.html head script and trackOf in channel.js.
var Theme = (function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var THEME_COLORS = ['#FFF4D8', '#E6F8EF', '#EDEBFF', '#0B1B3F']; // the paper of each track, for the browser bar

  // Group id from the profile ('9-11') -> the age used for the skin: the middle of that group
  var GROUP_AGE = { '6-8': 7, '9-11': 10, '12-14': 13, '15-17': 16 };
  function ageOf(groupId) { return GROUP_AGE[groupId === '14-17' ? '15-17' : groupId] || 7; } // '14-17': old id, read as '15-17'

  function trackOf(age) { return age < 9 ? 0 : age < 12 ? 1 : age < 15 ? 2 : 3; }
  function go(age) {
    var t = trackOf(age);
    root.setAttribute('data-skin', age > 14 ? 'teen' : 'kids');
    root.setAttribute('data-track', String(t));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[t]);
  }
  function shapes() { return ''; } // the floating shapes are retired: the main page skin has none

  return { ageOf: ageOf, go: go, shapes: shapes, reduce: reduce, trackOf: trackOf };
})();
