'use strict';

// Age skin of Sevalumo. The cabinet wears the skin of the main page (index.html) for the child's age group:
// 6-8 butter and coral, 9-11 mint and orange, 12-14 lavender and violet (kids skin), 15-17 navy and brass (teen skin).
// The palettes and fonts live in ../skin.css and ../skin-app.css; ../skin.js switches <html data-skin data-track>.
// This file only maps the child's age group to an age and Sevi's age form is chosen in bobik.js from the same age group.
var Theme = (function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Group id from the profile ('9-11') -> the age whose skin is shown: the first age of the group, so the cabinet matches the main page at that age line
  var GROUP_AGE = { '6-8': 7, '9-11': 10, '12-14': 13, '15-17': 16 };
  function ageOf(groupId) { return GROUP_AGE[groupId === '14-17' ? '15-17' : groupId] || 6; } // '14-17': old id, read as '15-17'

  // The skin switches whole between tracks (no blending), so a change shows in one frame
  // (no ../skin.js, e.g. offline or not deployed yet: keep the current skin instead of stopping render() and Sevi)
  function go(age) { if (typeof Skin !== 'undefined') Skin.set(age); }

  return { ageOf: ageOf, go: go, reduce: reduce };
})();
