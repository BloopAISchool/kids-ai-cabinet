'use strict';

// Общий с сайтом школы ключ: сайт создаёт профиль при входе и показывает прогресс на главной
var STORAGE_KEY = 'bloop-cabinet-v1';

// Сайт школы. На GitHub Pages это соседний репозиторий kids-ai-courses на том же домене,
// при локальном запуске кабинет лежит в подпапке сайта — тогда сайт на уровень выше.
var SITE_URL = location.hostname.endsWith('github.io') ? '/kids-ai-courses/' : '../';
var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Course cards cycle three theme tokens that stay distinct on every age channel (same as the parent site)
var THUMB = ['acc', 's2', 'bg'];

var $ = function (sel, root) { return (root || document).querySelector(sel); };
var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

function esc(text) {
  return String(text).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function shuffle(list) {
  var a = list.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

var app = {
  state: null,
  quiz: null,

  init: function () {
    $$('[data-site-link]').forEach(function (a) { a.href = SITE_URL; });
    $$('[data-catalog-link]').forEach(function (a) { a.href = SITE_URL + 'courses/'; });
    $('#shapes').innerHTML = Theme.shapes();
    this.loadCatalog();

    // ?start=<курс> — пришли с сайта по кнопке «Play now»
    var params = new URLSearchParams(location.search);
    this.pendingStart = params.get('start');
    if (this.pendingStart) history.replaceState(null, '', location.pathname + location.hash);

    $('#welcome-form').elements.age.insertAdjacentHTML('beforeend', AGE_GROUPS.map(function (g) {
      return '<option value="' + g.id + '">' + g.min + '–' + g.max + ' years</option>';
    }).join(''));

    this.state = this.load();
    this.bind();
    if (this.state && findAgeGroup(this.state.age)) {
      this.render();
      this.runPendingStart();
    } else if (this.state) {
      // Профиль без возраста (старый): курсы показываются по возрасту, поэтому сначала спрашиваем его
      this.render();
      this.openWelcome();
    } else {
      this.state = Game.newState();
      this.render();
      this.openWelcome();
    }
  },

  runPendingStart: function () {
    var id = this.pendingStart;
    this.pendingStart = null;
    var course = id && Game.findCourse(id);
    if (!course) return;
    if (coursesForAge(this.state.age).indexOf(course) === -1) {
      this.toast('🔒', course.title + ' is for ' + course.age.toLowerCase(), 'Here are the courses for your age.');
      return;
    }
    var cs = Game.courseStatus(this.state, course);
    if (cs.nextLesson !== null) {
      this.startLesson(course.id, cs.nextLesson);
    } else {
      var card = document.getElementById('course-' + course.id);
      if (card) card.scrollIntoView({ block: 'center' });
      this.toast('🎓', course.title + ' is complete!', 'Replay any lesson to earn more stars.');
    }
  },

  // ---------- Хранилище ----------
  load: function () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var st = raw ? Object.assign(Game.newState(), JSON.parse(raw)) : null;
      if (st && st.age === '14-17') st.age = '15-17'; // миграция: старое id старшей группы
      return st;
    } catch (e) {
      return null;
    }
  },

  save: function () {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch (e) { /* без хранилища прогресс живёт до перезагрузки */ }
  },

  // Sevi S7 in the form of the child's age track (Explorers 6-8 ... Pros 15-17; Explorers until an age is picked).
  // crop: 'full' (whole figure: hero) or 'bust' (head and torso with the chest logo: welcome, quiz, result, thumbs).
  bobik: function (pose, crop, groupId) {
    Bobik.setForm(Bobik.formForGroup(groupId || (this.state && this.state.age)));
    return bob(STATES[pose] || STATES.neutral, null, null, crop || 'full');
  },

  today: function () { return Game.dayKey(); },

  // ---------- Главный экран ----------
  render: function () {
    var s = this.state;
    var lvl = Game.levelFor(s.xp);
    var st = Game.stats(s);

    $('#logo-bobik').innerHTML = Bobik.badge(34);
    if (!this.petting) $('#hero-bobik').innerHTML = this.bobik(st.lessonsDone ? 'joy' : 'hello');
    $('#chip-name').textContent = s.name;
    $('#chip-level').textContent = 'Lv ' + lvl.level;
    $('#hello').textContent = 'Hi, ' + s.name + '!';
    $('#level-title').textContent = lvl.title;
    var group = findAgeGroup(s.age);
    $('#channel-tag').textContent = group ? group.name + ' channel, ages ' + group.min + '-' + group.max : 'Pick your age to open your channel';
    if (!$('#welcome').open) Theme.go(Theme.ageOf(s.age));
    $('#level-badge').textContent = lvl.level;
    $('#xp-fill').style.width = Math.round(lvl.progress * 100) + '%';
    $('#xpbar').setAttribute('aria-valuenow', Math.round(lvl.progress * 100));
    $('#xp-text').textContent = lvl.to ? (s.xp + ' / ' + lvl.to + ' XP') : (s.xp + ' XP · max level');
    $('#chip-streak').textContent = Game.currentStreak(s, this.today());
    $('#chip-stars').textContent = st.stars;
    var mine = coursesForAge(s.age);
    $('#chip-courses').textContent = mine.filter(function (c) { return Game.courseStatus(s, c).done; }).length + '/' + mine.length;
    $('#chip-courses').parentNode.hidden = !mine.length; // для возраста нет курсов в кабинете — счётчик не нужен

    this.renderStats(st);
    this.renderCourses();
    this.renderBadges();
    this.renderDaily();
    this.renderWeek();
  },

  renderStats: function (st) {
    var s = this.state;
    var tiles = [
      [s.xp, 'total XP'],
      [s.answered ? Math.round(st.accuracy * 100) + '%' : '—', 'correct answers'],
      [st.lessonsDone, 'lessons passed'],
      [s.bestCombo, 'best answer streak']
    ];
    $('#stats').innerHTML = tiles.map(function (t) {
      return '<div class="stat"><b class="stat__value">' + t[0] + '</b><span class="stat__label">' + t[1] + '</span></div>';
    }).join('');
  },

  // Только курсы для возраста из профиля — тот же возраст видит сайт школы
  renderCourses: function () {
    var self = this, s = this.state;
    var group = findAgeGroup(s.age);
    var mine = coursesForAge(s.age);
    $('#courses-age').textContent = group ? 'Ages ' + group.min + '–' + group.max : '';
    $('#courses-age-btn').hidden = !group;

    if (!group) {
      $('#course-list').innerHTML = '<div class="course-empty"><p>Tell Sevi how old you are, and you’ll see the courses made for your age.</p>' +
        '<button class="btn btn--primary" type="button" data-open-welcome>Choose my age</button></div>';
      return;
    }
    // Real school-site courses for this age (same list and same rule as the site's courses/ page)
    var site = this.siteCourses(group);
    var more;
    if (site.length) {
      more = '<div class="site-courses">' + site.map(function (c) {
        var href = c.playable && !c.url ? '?start=' + encodeURIComponent(c.id) : SITE_URL + c.url;
        return '<article class="site-course"><span class="course__age">' + esc(BLOOP_CATALOG.courseAges(c)) + '</span>' +
          '<h3>' + esc(c.title) + '</h3><p>' + esc(c.desc) + '</p>' +
          '<a class="btn btn--primary" href="' + esc(href) + '" aria-label="Start ' + esc(c.title) + '">Start</a></article>';
      }).join('') + '</div>' +
      '<p class="site-courses__all"><a class="link-btn" href="' + SITE_URL + 'courses/#age-' + group.id + '">See all courses</a></p>';
    } else {
      more = group.more
        ? '<div class="course-empty"><p>' + group.more.text + '</p><a class="btn btn--primary" href="' + SITE_URL + group.more.href + '">' + group.more.link + '</a></div>'
        : '';
    }

    $('#course-list').innerHTML = more + mine.map(function (c, k) {
      var cs = Game.courseStatus(s, c);
      var nodes = c.lessons.map(function (l, i) {
        var rec = s.lessons[l.id];
        var stars = rec ? rec.stars : 0;
        var unlocked = Game.isLessonUnlocked(s, c, i);
        var current = unlocked && stars === 0;
        var cls = stars > 0 ? 'is-done' : current ? 'is-current' : 'is-locked';
        var icon = stars > 0 ? (stars === 3 ? '👑' : '✓') : unlocked ? (i + 1) : '🔒';
        var label = l.title + (stars ? ', ' + stars + ' of 3 stars' : unlocked ? ', ready to start' : ', locked');
        return '<li class="node ' + cls + '">' +
          '<button type="button" class="node__btn" data-course="' + c.id + '" data-lesson="' + i + '"' +
          (unlocked ? '' : ' disabled') + ' aria-label="' + esc(label) + '">' + icon + '</button>' +
          '<span class="node__stars" aria-hidden="true">' + self.starIcons(stars) + '</span>' +
          '<span class="node__title">' + esc(l.title) + '</span></li>';
      }).join('');

      var action = cs.done
        ? '<span class="course__done">Completed</span>'
        : '<button class="btn btn--primary" type="button" data-course="' + c.id + '" data-lesson="' + cs.nextLesson + '">' +
          (cs.passed ? 'Continue' : 'Start') + '</button>';

      return '<article class="course' + (cs.done ? ' is-complete' : '') + '" id="course-' + c.id + '">' +
        '<div class="course__head">' +
          '<div class="course__thumb" style="--C:var(--' + THUMB[k % 3] + ')" aria-hidden="true">' + self.bobik(cs.done ? 'victory' : c.pose, 'bust') + '</div>' +
          '<div class="course__info">' +
            '<span class="course__age">' + c.age + '</span>' +
            '<h3>' + esc(c.title) + '</h3>' +
            '<div class="course__meta"><span>' + cs.passed + '/' + cs.total + ' lessons</span><span>⭐ ' + cs.stars + '/' + cs.maxStars + '</span></div>' +
            '<div class="bar"><div class="bar__fill" style="width:' + Math.round(cs.progress * 100) + '%"></div></div>' +
          '</div>' +
          '<div class="course__action">' + action + '</div>' +
        '</div>' +
        '<ol class="path">' + nodes + '</ol>' +
      '</article>';
    }).join('');
  },

  // Courses of the school site for this age group. The list lives in the site's catalog.js (one source of truth),
  // loaded from SITE_URL by loadCatalog(). Without it (offline, blocked, not deployed) this is empty and the
  // old "no courses yet" text with a link to the site is shown instead.
  siteCourses: function (group) {
    if (typeof BLOOP_CATALOG === 'undefined') return [];
    var C = BLOOP_CATALOG;
    return C.COURSES.filter(function (c) {
      var g = C.groupOf(c);
      return g && g.id === group.id && (c.url || c.playable);
    });
  },

  loadCatalog: function () {
    var self = this, tag = document.createElement('script');
    tag.src = SITE_URL + 'catalog.js';
    // Only the course list changes, and only when the catalog has courses for this age:
    // a full render() would redraw Sevi and the stats a second time for nothing.
    tag.onload = function () {
      var group = self.state && findAgeGroup(self.state.age);
      if (group && self.siteCourses(group).length) self.renderCourses();
    };
    document.head.appendChild(tag); // on error: nothing to do, the fallback text stays
  },

  starIcons: function (n) {
    var out = '';
    for (var i = 0; i < 3; i++) out += '<i class="' + (i < n ? 'on' : '') + '">★</i>';
    return out;
  },

  renderBadges: function () {
    var s = this.state, got = 0;
    // Every badge needs a lesson in the cabinet. With no courses they cannot be earned, so hide the section.
    var none = !COURSES.length;
    $('#badges').hidden = none;
    $$('a[href="#badges"]').forEach(function (a) { a.parentNode.hidden = none; });
    if (none) return;
    $('#badge-list').innerHTML = ACHIEVEMENTS.map(function (a) {
      var date = s.achievements[a.id];
      if (date) got++;
      return '<div class="badge' + (date ? '' : ' is-locked') + '">' +
        '<span class="badge__icon" aria-hidden="true">' + a.icon + '</span>' +
        '<h3>' + a.title + '</h3><p>' + a.desc + '</p>' +
        '<span class="sr-only">' + (date ? 'Unlocked' : 'Locked') + '</span></div>';
    }).join('');
    $('#badge-count').textContent = got + '/' + ACHIEVEMENTS.length;
  },

  renderDaily: function () {
    var xp = this.state.xpByDay[this.today()] || 0;
    var p = Math.min(1, xp / DAILY_GOAL);
    var len = 2 * Math.PI * 50;
    var ring = $('#ring-fill');
    ring.style.strokeDasharray = len;
    ring.style.strokeDashoffset = len * (1 - p);
    $('#daily-xp').textContent = xp;
    $('#daily-goal').textContent = '/ ' + DAILY_GOAL + ' XP';
    $('#daily-note').textContent = p >= 1 ? 'Goal reached! Sevi is proud of you 🎉' : (DAILY_GOAL - xp) + ' XP to reach today’s goal';
    $('.daily').classList.toggle('is-done', p >= 1);
  },

  renderWeek: function () {
    var today = this.today();
    var week = Game.weekXp(this.state, today, 7);
    var max = Math.max(DAILY_GOAL, Math.max.apply(null, week.map(function (d) { return d.xp; })));
    var names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    $('#week').innerHTML = week.map(function (d) {
      var p = d.day.split('-').map(Number);
      var name = names[new Date(p[0], p[1] - 1, p[2]).getDay()];
      return '<div class="week__col' + (d.day === today ? ' is-today' : '') + '">' +
        '<span class="week__xp">' + (d.xp || '') + '</span>' +
        '<div class="week__bar"><div style="height:' + Math.round(d.xp / max * 100) + '%"></div></div>' +
        '<span class="week__day">' + name + '</span></div>';
    }).join('');
  },

  // ---------- Знакомство и настройки ----------
  openWelcome: function () {
    var dlg = $('#welcome');
    var form = $('#welcome-form');
    form.elements.name.value = this.load() ? this.state.name : '';
    // Пришли с сайта по кнопке курса — подставляем возраст этого курса
    var pending = !this.state.age && this.pendingStart && Game.findCourse(this.pendingStart);
    var pendingGroup = pending && AGE_GROUPS.filter(function (g) { return pending.ages[0] >= g.min && pending.ages[1] <= g.max; })[0];
    form.elements.age.value = findAgeGroup(this.state.age) ? this.state.age : (pendingGroup ? pendingGroup.id : '');
    $('#welcome-bobik').innerHTML = this.bobik('hello', 'bust', form.elements.age.value);
    if (!dlg.open) dlg.showModal();
    if (form.elements.age.value) Theme.go(Theme.ageOf(form.elements.age.value));
  },

  // Сервера пока нет: прогресс живёт только в этом браузере, поэтому выход его стирает
  logout: function () {
    if (!window.confirm('Log out? Your progress is saved only in this browser, so it will be erased.')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* нечего стирать */ }
    location.href = SITE_URL;
  },

  resetProgress: function () {
    if (!window.confirm('Reset all XP, stars and badges? This cannot be undone.')) return;
    var keep = this.state;
    this.state = Game.newState(keep.name, keep.palette);
    this.state.age = keep.age;
    this.save();
    this.render();
    this.toast('🔄', 'Progress reset', 'A fresh start with Sevi!');
  },

  // ---------- Урок ----------
  startLesson: function (courseId, index) {
    var course = Game.findCourse(courseId);
    if (!course || !Game.isLessonUnlocked(this.state, course, index)) return;
    var lesson = course.lessons[index];
    this.quiz = {
      course: course,
      index: index,
      lesson: lesson,
      questions: lesson.questions.map(function (q) {
        return {
          q: q.q, explain: q.explain,
          options: shuffle(q.options.map(function (text, k) { return { text: text, correct: k === 0 }; }))
        };
      }),
      i: 0,
      answers: [],
      combo: 0,
      answered: false
    };
    this.renderQuestion();
    var dlg = $('#quiz');
    if (!dlg.open) dlg.showModal();
  },

  quizTop: function () {
    var qz = this.quiz;
    var segs = qz.questions.map(function (_, k) {
      var cls = k < qz.answers.length ? (qz.answers[k] ? 'ok' : 'bad') : k === qz.i ? 'cur' : '';
      return '<span class="' + cls + '"></span>';
    }).join('');
    return '<div class="quiz__top">' +
      '<button class="quiz__close" type="button" data-quiz="close" aria-label="Leave lesson">✕</button>' +
      '<div class="quiz__progress" aria-label="Question ' + (qz.i + 1) + ' of ' + qz.questions.length + '">' + segs + '</div>' +
      '<span class="quiz__combo' + (qz.combo >= 2 ? ' is-on' : '') + '">🔥 ' + qz.combo + '</span>' +
    '</div>';
  },

  renderQuestion: function () {
    var qz = this.quiz, q = qz.questions[qz.i];
    qz.answered = false;
    $('#quiz-inner').innerHTML = this.quizTop() +
      '<p class="quiz__lesson">' + esc(qz.course.title) + ' · ' + esc(qz.lesson.title) + '</p>' +
      '<div class="quiz__ask">' +
        '<div class="quiz__bot" id="quiz-bobik" aria-hidden="true">' + this.bobik('think', 'bust') + '</div>' +
        '<h2 class="quiz__q" id="quiz-title">' + esc(q.q) + '</h2>' +
      '</div>' +
      '<div class="options" role="group" aria-label="Answers">' +
        q.options.map(function (o, k) {
          return '<button type="button" class="option" data-option="' + k + '">' +
            '<span class="option__key">' + (k + 1) + '</span><span>' + esc(o.text) + '</span></button>';
        }).join('') +
      '</div>' +
      '<div class="feedback" id="feedback" aria-live="polite"></div>';
    var first = $('.option', $('#quiz-inner'));
    if (first) first.focus();
  },

  answer: function (k) {
    var qz = this.quiz;
    if (!qz || qz.answered) return;
    qz.answered = true;
    var q = qz.questions[qz.i];
    var ok = q.options[k].correct;
    qz.answers.push(ok);
    qz.combo = ok ? qz.combo + 1 : 0;

    $$('.option', $('#quiz-inner')).forEach(function (btn, idx) {
      btn.disabled = true;
      if (q.options[idx].correct) btn.classList.add('is-correct');
      else if (idx === k) btn.classList.add('is-wrong');
    });

    var xp = ok ? XP_RULES.correct + (qz.combo >= XP_RULES.comboFrom ? XP_RULES.combo : 0) : 0;
    var praise = ['Great job!', 'Awesome!', 'You got it!', 'Super smart!', 'Brilliant!'];
    var title = ok ? praise[Math.floor(Math.random() * praise.length)] : 'Not quite!';
    var comboLine = ok && qz.combo >= XP_RULES.comboFrom ? '<span class="feedback__combo">🔥 ' + qz.combo + ' in a row! +' + XP_RULES.combo + ' bonus</span>' : '';
    var last = qz.i === qz.questions.length - 1;

    $('#quiz-bobik').innerHTML = this.bobik(ok ? (qz.combo >= 3 ? 'delight' : 'joy') : 'sad', 'bust');
    $('#quiz-inner').querySelector('.quiz__top').outerHTML = this.quizTop();
    var fb = $('#feedback');
    fb.className = 'feedback is-shown ' + (ok ? 'is-ok' : 'is-bad');
    fb.innerHTML =
      '<div class="feedback__text">' +
        '<b>' + title + (xp ? ' <span class="feedback__xp">+' + xp + ' XP</span>' : '') + '</b>' +
        comboLine +
        '<p>' + esc(q.explain) + '</p>' +
      '</div>' +
      '<button class="btn ' + (ok ? 'btn--green' : 'btn--primary') + '" type="button" data-quiz="next">' + (last ? 'See results' : 'Next') + '</button>';
    $('[data-quiz="next"]').focus();
  },

  next: function () {
    var qz = this.quiz;
    if (!qz || !qz.answered) return;
    if (qz.i < qz.questions.length - 1) {
      qz.i++;
      this.renderQuestion();
    } else {
      this.finish();
    }
  },

  finish: function () {
    var qz = this.quiz;
    var r = Game.applyLesson(this.state, qz.course.id, qz.lesson.id, qz.answers, this.today());
    this.state = r.state;
    this.save();
    qz.result = r;
    qz.done = true;

    var x = r.xp;
    var pose = r.stars === 3 ? 'victory' : r.stars > 0 ? 'joy' : 'sad';
    var heading = r.stars === 3 ? 'Perfect lesson!' : r.stars > 0 ? 'Lesson passed!' : 'Almost there!';
    var sub = r.stars > 0
      ? x.correct + ' of ' + qz.answers.length + ' answers right'
      : 'Get at least ' + Math.ceil(qz.answers.length / 2) + ' right to pass. You can do it!';

    var rows = [
      ['Correct answers', x.base],
      ['Answer streak bonus', x.combo],
      ['Lesson passed', x.done],
      ['Perfect lesson', x.perfect]
    ].filter(function (row) { return row[1] > 0; });

    var breakdown = rows.map(function (row) { return '<li><span>' + row[0] + '</span><b>+' + row[1] + '</b></li>'; }).join('');
    if (r.isReplay && r.lessonEarned < x.total) {
      breakdown += '<li class="muted"><span>Already earned before</span><b>−' + (x.total - r.lessonEarned) + '</b></li>';
    }
    if (r.courseBonus) breakdown += '<li class="hot"><span>🎓 Course completed!</span><b>+' + r.courseBonus + '</b></li>';

    var extras = '';
    if (r.levelUp) {
      extras += '<div class="levelup">⬆️ <b>Level ' + r.levelUp.level + '!</b> You are now a ' + r.levelUp.title + '</div>';
    }
    if (r.unlocked.length) {
      extras += '<div class="unlocked"><p>New badges</p>' + r.unlocked.map(function (a) {
        return '<span class="unlocked__badge"><span aria-hidden="true">' + a.icon + '</span> ' + a.title + '</span>';
      }).join('') + '</div>';
    }

    var hasNext = qz.index + 1 < qz.course.lessons.length && Game.isLessonUnlocked(this.state, qz.course, qz.index + 1);
    var mainBtn = r.stars > 0 && hasNext
      ? '<button class="btn btn--primary" type="button" data-quiz="next-lesson">Next lesson →</button>'
      : r.stars > 0
        ? '<button class="btn btn--primary" type="button" data-quiz="close">Back to cabinet</button>'
        : '<button class="btn btn--primary" type="button" data-quiz="retry">Try again</button>';
    var secondBtn = r.stars > 0
      ? '<button class="btn btn--white" type="button" data-quiz="retry">Play again</button>'
      : '<button class="btn btn--white" type="button" data-quiz="close">Back to cabinet</button>';

    $('#quiz-inner').innerHTML =
      '<div class="quiz__top"><button class="quiz__close" type="button" data-quiz="close" aria-label="Close">✕</button></div>' +
      '<div class="result">' +
        '<div class="result__bot" aria-hidden="true">' + this.bobik(pose, 'bust') + '</div>' +
        '<div class="result__stars" aria-label="' + r.stars + ' of 3 stars">' + this.starIcons(r.stars) + '</div>' +
        '<h2 id="quiz-title">' + heading + '</h2>' +
        '<p class="result__sub">' + sub + '</p>' +
        '<div class="result__xp"><span>+' + r.earned + '</span> XP</div>' +
        (breakdown ? '<ul class="breakdown">' + breakdown + '</ul>' : '') +
        extras +
        '<div class="result__actions">' + secondBtn + mainBtn + '</div>' +
      '</div>';

    if (r.stars >= 2 || r.levelUp) this.confetti();
    this.render();
  },

  closeQuiz: function () {
    var qz = this.quiz;
    if (qz && !qz.done && qz.answers.length && !window.confirm('Leave the lesson? Your answers in this lesson will not be saved.')) return;
    var unlocked = qz && qz.result ? qz.result.unlocked : [];
    $('#quiz').close();
    this.quiz = null;
    var self = this;
    unlocked.forEach(function (a, i) {
      setTimeout(function () { self.toast(a.icon, 'Badge unlocked!', a.title); }, 300 + i * 600);
    });
  },

  // ---------- Эффекты ----------
  toast: function (icon, title, text) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span class="toast__icon" aria-hidden="true">' + icon + '</span><div><b>' + esc(title) + '</b><p>' + esc(text) + '</p></div>';
    $('#toasts').appendChild(el);
    setTimeout(function () { el.classList.add('is-out'); }, 3200);
    setTimeout(function () { el.remove(); }, 3700);
  },

  confetti: function () {
    if (REDUCED_MOTION) return;
    var box = $('#quiz').open ? $('#quiz') : $('#confetti');
    var css = getComputedStyle(document.documentElement);
    var colors = ['--acc', '--s1', '--s2', '--bg'].map(function (v) { return css.getPropertyValue(v).trim() || '#FFCE3A'; });
    for (var i = 0; i < 60; i++) {
      var p = document.createElement('i');
      p.className = 'confetti__piece';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.4 + 's';
      p.style.animationDuration = 1.6 + Math.random() * 1.2 + 's';
      p.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      box.appendChild(p);
      setTimeout(p.remove.bind(p), 3400);
    }
  },

  // ---------- События ----------
  bind: function () {
    var self = this;

    document.addEventListener('click', function (e) {
      var start = e.target.closest('[data-course][data-lesson]');
      if (start && !start.disabled) self.startLesson(start.dataset.course, Number(start.dataset.lesson));

      if (e.target.closest('[data-open-welcome]')) self.openWelcome();
    });

    $('#quiz').addEventListener('click', function (e) {
      var opt = e.target.closest('[data-option]');
      if (opt) return self.answer(Number(opt.dataset.option));
      var act = e.target.closest('[data-quiz]');
      if (!act) return;
      var a = act.dataset.quiz, qz = self.quiz;
      if (a === 'next') self.next();
      if (a === 'close') self.closeQuiz();
      if (a === 'retry') self.startLesson(qz.course.id, qz.index);
      if (a === 'next-lesson') {
        var unlocked = qz.result.unlocked;
        self.startLesson(qz.course.id, qz.index + 1);
        unlocked.forEach(function (b) { self.toast(b.icon, 'Badge unlocked!', b.title); });
      }
    });

    // Esc закрывает урок через closeQuiz (с подтверждением), а не мгновенно
    $('#quiz').addEventListener('cancel', function (e) { e.preventDefault(); self.closeQuiz(); });

    // Клавиатура в уроке: 1–4 — ответ, Enter на кнопке — дальше
    $('#quiz').addEventListener('keydown', function (e) {
      if (!self.quiz || self.quiz.done) return;
      var n = Number(e.key);
      if (n >= 1 && n <= self.quiz.questions[self.quiz.i].options.length && !self.quiz.answered) self.answer(n - 1);
    });

    $('#welcome-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = e.target.elements.name.value.trim();
      if (!name) return;
      var isNew = !self.load();
      self.state.name = name;
      self.state.age = e.target.elements.age.value;
      self.save();
      self.render();
      $('#welcome').close();
      if (isNew && !self.pendingStart) self.toast('👋', 'Nice to meet you, ' + name + '!', COURSES.length ? 'Start your first lesson below.' : 'Your courses are on the school site.');
      self.runPendingStart();
    });
    $('#welcome').addEventListener('cancel', function () { self.save(); self.runPendingStart(); });
    $('#welcome').addEventListener('close', function () {
      Theme.go(Theme.ageOf(self.state.age));
      // closed without saving: Sevi's form goes back from the previewed age to the saved one
      Bobik.setForm(Bobik.formForGroup(self.state.age));
    });
    $('#welcome-form').elements.age.addEventListener('change', function () {
      Theme.go(Theme.ageOf(this.value));
      // Sevi grows into the form of the age just picked
      $('#welcome-bobik').innerHTML = self.bobik('hello', 'bust', this.value);
    });

    $('#profile-chip').addEventListener('click', function () { self.openWelcome(); });
    $('#rename-btn').addEventListener('click', function () { self.openWelcome(); });
    $('#reset-btn').addEventListener('click', function () { self.resetProgress(); });
    $('#logout-btn').addEventListener('click', function () { self.logout(); });

    // Вернулись в кабинет кнопкой «назад» — перечитываем данные (имя могли поменять на сайте)
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      var saved = self.load();
      if (saved) { self.state = saved; self.render(); }
    });

    $('#hero-bobik').addEventListener('click', function () {
      var moods = ['joy', 'surprise', 'delight', 'wink', 'victory'];
      self.petting = true;
      $('#hero-bobik').innerHTML = self.bobik(moods[Math.floor(Math.random() * moods.length)]);
      clearTimeout(self.petTimer);
      self.petTimer = setTimeout(function () { self.petting = false; self.render(); }, 1300);
    });
  }
};

document.addEventListener('DOMContentLoaded', function () { app.init(); });
