'use strict';

// One-time rename of old storage keys. Loaded in <head> before anything reads storage
// (the inline first-paint skin script in index.html, app.js). Each key: copy old -> new if new is absent, then drop old.
// legacy keys: remove after 2027-03
(function migrateLegacyKeys() {
  var LEGACY_KEYS = [
    ['bloop-cabinet-v1', 'sevalumo-cabinet-v1'],
    ['bloop-parent-cabinet-v1', 'sevalumo-parent-cabinet-v1'],
    ['bloop-age-range', 'sevalumo-age-range']
  ];
  LEGACY_KEYS.forEach(function (pair) {
    try {
      var old = localStorage.getItem(pair[0]);
      if (old === null) return;
      if (localStorage.getItem(pair[1]) === null) localStorage.setItem(pair[1], old);
      localStorage.removeItem(pair[0]); // not reached if setItem threw: the old key stays for the next try
    } catch (e) { /* storage unavailable or full */ }
  });
})();
