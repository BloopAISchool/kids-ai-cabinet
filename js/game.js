'use strict';

// Логика геймификации без интерфейса: XP, звёзды, уровни, серии, награды.
// Работает в браузере (глобальные данные из data.js) и в Node (для тестов).
(function (root) {
  var D = typeof module !== 'undefined' ? require('./data.js') : root;

  function newState(name, palette) {
    return {
      version: 1,
      name: name || 'Explorer',
      palette: palette || 'auto', // unused since Sevi S7 (fixed colours); kept so old saved profiles and readers stay compatible
      xp: 0,
      correct: 0,
      answered: 0,
      combo: 0,
      bestCombo: 0,
      streak: 0,
      bestStreak: 0,
      lastActive: null,
      xpByDay: {},
      lessons: {},
      achievements: {}
    };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // Дата в формате YYYY-MM-DD по локальному времени
  function dayKey(date) {
    var d = date || new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function daysBetween(a, b) {
    var pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
  }

  function shiftDay(key, delta) {
    var p = key.split('-').map(Number);
    return dayKey(new Date(p[0], p[1] - 1, p[2] + delta));
  }

  function levelFor(xp) {
    var L = D.LEVELS, i = 0;
    while (i + 1 < L.length && xp >= L[i + 1].xp) i++;
    var cur = L[i], next = L[i + 1] || null;
    return {
      level: i + 1,
      title: cur.title,
      from: cur.xp,
      to: next ? next.xp : null,
      progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1
    };
  }

  // 3 звезды — всё верно, 2 — от 75%, 1 — от 50%, 0 — урок не пройден
  function starsFor(correct, total) {
    var r = total ? correct / total : 0;
    if (r === 1) return 3;
    if (r >= 0.75) return 2;
    if (r >= 0.5) return 1;
    return 0;
  }

  // answers — массив true/false по порядку вопросов
  function lessonXp(answers) {
    var R = D.XP_RULES, combo = 0, bestCombo = 0, base = 0, comboXp = 0, correct = 0;
    answers.forEach(function (ok) {
      if (ok) {
        correct++;
        combo++;
        base += R.correct;
        if (combo >= R.comboFrom) comboXp += R.combo;
      } else {
        combo = 0;
      }
      bestCombo = Math.max(bestCombo, combo);
    });
    var stars = starsFor(correct, answers.length);
    var done = stars > 0 ? R.lessonDone : 0;
    var perfect = stars === 3 ? R.perfect : 0;
    return {
      correct: correct, bestCombo: bestCombo, stars: stars,
      base: base, combo: comboXp, done: done, perfect: perfect,
      total: base + comboXp + done + perfect
    };
  }

  function findCourse(courseId) {
    return D.COURSES.filter(function (c) { return c.id === courseId; })[0];
  }

  function courseStatus(state, course) {
    var stars = 0, passed = 0, perfect = 0, next = null;
    course.lessons.forEach(function (l, i) {
      var r = state.lessons[l.id];
      var s = r ? r.stars : 0;
      stars += s;
      if (s > 0) passed++;
      if (s === 3) perfect++;
      if (next === null && s === 0) next = i;
    });
    var n = course.lessons.length;
    return {
      passed: passed, total: n, stars: stars, maxStars: n * 3,
      done: passed === n, perfect: perfect === n,
      nextLesson: next, progress: passed / n
    };
  }

  // Уроки открываются по очереди: следующий — после прохождения предыдущего
  function isLessonUnlocked(state, course, index) {
    if (index === 0) return true;
    var prev = state.lessons[course.lessons[index - 1].id];
    return !!(prev && prev.stars > 0);
  }

  function stats(state) {
    var st = { lessonsDone: 0, perfectLessons: 0, coursesDone: 0, perfectCourses: 0, stars: 0, maxStars: 0 };
    D.COURSES.forEach(function (c) {
      var cs = courseStatus(state, c);
      st.lessonsDone += cs.passed;
      st.stars += cs.stars;
      st.maxStars += cs.maxStars;
      if (cs.done) st.coursesDone++;
      if (cs.perfect) st.perfectCourses++;
      c.lessons.forEach(function (l) {
        var r = state.lessons[l.id];
        if (r && r.stars === 3) st.perfectLessons++;
      });
    });
    st.accuracy = state.answered ? state.correct / state.answered : 0;
    return st;
  }

  // Серия дней: сгорает, если пропущен хотя бы один день
  function currentStreak(state, today) {
    if (!state.lastActive) return 0;
    return daysBetween(state.lastActive, today) <= 1 ? state.streak : 0;
  }

  function touchStreak(s, today) {
    if (s.lastActive === today) return;
    s.streak = s.lastActive && daysBetween(s.lastActive, today) === 1 ? s.streak + 1 : 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    s.lastActive = today;
  }

  function unlockAchievements(s, today) {
    var st = stats(s), unlocked = [];
    D.ACHIEVEMENTS.forEach(function (a) {
      if (!s.achievements[a.id] && a.check(s, st)) {
        s.achievements[a.id] = today;
        unlocked.push(a);
      }
    });
    return unlocked;
  }

  // Применяет результат урока. Возвращает новое состояние и всё, что нужно показать ребёнку.
  // Повторное прохождение даёт только разницу с лучшим результатом — XP нельзя «нафармить».
  function applyLesson(state, courseId, lessonId, answers, today) {
    today = today || dayKey();
    var s = clone(state);
    var course = findCourse(courseId);
    var levelBefore = levelFor(s.xp);
    var courseWasDone = courseStatus(s, course).done;

    var x = lessonXp(answers);
    var prev = s.lessons[lessonId] || { stars: 0, bestXp: 0, plays: 0 };
    var lessonEarned = Math.max(0, x.total - prev.bestXp);

    s.lessons[lessonId] = {
      stars: Math.max(prev.stars, x.stars),
      bestXp: Math.max(prev.bestXp, x.total),
      plays: prev.plays + 1
    };
    s.correct += x.correct;
    s.answered += answers.length;

    // Серия правильных ответов продолжается между уроками и сбрасывается на ошибке
    var run = s.combo || 0;
    answers.forEach(function (ok) {
      run = ok ? run + 1 : 0;
      s.bestCombo = Math.max(s.bestCombo, run);
    });
    s.combo = run;

    var courseDoneNow = courseStatus(s, course).done;
    var courseBonus = !courseWasDone && courseDoneNow ? D.XP_RULES.courseDone : 0;
    var earned = lessonEarned + courseBonus;

    s.xp += earned;
    s.xpByDay[today] = (s.xpByDay[today] || 0) + earned;
    touchStreak(s, today);

    var levelAfter = levelFor(s.xp);
    return {
      state: s,
      xp: x,
      stars: x.stars,
      prevStars: prev.stars,
      isReplay: prev.plays > 0,
      lessonEarned: lessonEarned,
      courseBonus: courseBonus,
      earned: earned,
      courseCompleted: courseBonus > 0,
      levelUp: levelAfter.level > levelBefore.level ? levelAfter : null,
      unlocked: unlockAchievements(s, today)
    };
  }

  // XP за последние n дней (для графика)
  function weekXp(state, today, n) {
    n = n || 7;
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var key = shiftDay(today, -i);
      out.push({ day: key, xp: state.xpByDay[key] || 0 });
    }
    return out;
  }

  var Game = {
    newState: newState, dayKey: dayKey, daysBetween: daysBetween, shiftDay: shiftDay,
    levelFor: levelFor, starsFor: starsFor, lessonXp: lessonXp, findCourse: findCourse,
    courseStatus: courseStatus, isLessonUnlocked: isLessonUnlocked, stats: stats,
    currentStreak: currentStreak, applyLesson: applyLesson, weekXp: weekXp
  };

  if (typeof module !== 'undefined') module.exports = Game;
  else root.Game = Game;
})(this);
