'use strict';

// Курсов в кабинете пока нет: COURSES пуст. Для каждого возраста кабинет ведёт в каталог курсов сайта школы.
// Чтобы добавить курс в кабинет, см. README. Формат вопроса: q (текст), options (варианты, первый всегда правильный,
// порядок перемешивается при показе), explain (объяснение после ответа).
var COURSES = [];

// Возрастные группы — те же, что на сайте школы (catalog.js в kids-ai-courses): меняются вместе.
// more — куда вести, если для группы в кабинете пока нет курсов (путь от корня сайта школы).
var AGE_GROUPS = [
  { id: '6-8',   min: 6,  max: 8,  name: 'Explorers',
    more: { text: 'There are no courses for ages 6-8 yet. See every course on the school site.', link: 'See all courses', href: 'courses/#age-6-8' } },
  { id: '9-11',  min: 9,  max: 11, name: 'Inventors',
    more: { text: 'There are no courses for ages 9-11 yet. See every course on the school site.', link: 'See all courses', href: 'courses/#age-9-11' } },
  { id: '12-14', min: 12, max: 14, name: 'Creators',
    more: { text: 'There are no courses for ages 12-14 yet. See every course on the school site.', link: 'See all courses', href: 'courses/#age-12-14' } },
  { id: '14-17', min: 14, max: 17, name: 'Pros',
    more: { text: 'Your courses live on the school site: AI Starter Trail for beginners and AI Trail.', link: 'See my courses', href: 'courses/#age-14-17' } }
];

function findAgeGroup(id) {
  return AGE_GROUPS.filter(function (g) { return g.id === id; })[0] || null;
}

// Курсы для возраста из профиля: только те, чей возраст целиком внутри группы. Без возраста — пусто.
function coursesForAge(ageId) {
  var g = findAgeGroup(ageId);
  if (!g) return [];
  return COURSES.filter(function (c) { return c.ages[0] >= g.min && c.ages[1] <= g.max; });
}

// Уровни: сколько XP нужно для каждого уровня и его название
var LEVELS = [
  { xp: 0,    title: 'Curious Cadet' },
  { xp: 100,  title: 'Robot Friend' },
  { xp: 250,  title: 'Prompt Apprentice' },
  { xp: 450,  title: 'Idea Spark' },
  { xp: 700,  title: 'AI Explorer' },
  { xp: 1000, title: 'Bot Builder' },
  { xp: 1400, title: 'AI Inventor' },
  { xp: 1900, title: 'Neural Ninja' },
  { xp: 2500, title: 'AI Wizard' }
];

// Сколько XP за что
var XP_RULES = {
  correct: 10,        // правильный ответ
  combo: 5,           // бонус за каждый ответ в серии от 3 правильных подряд
  comboFrom: 3,
  lessonDone: 20,     // урок пройден (от 50% правильных)
  perfect: 30,        // все ответы урока правильные
  courseDone: 100     // все уроки курса пройдены
};

var DAILY_GOAL = 50;

// Награды: check(s, stats) получает состояние и посчитанную статистику
var ACHIEVEMENTS = [
  { id: 'first-steps', icon: '👋', title: 'First Steps',    desc: 'Finish your first lesson',            check: function (s, st) { return st.lessonsDone >= 1; } },
  { id: 'sharp-mind',  icon: '🎯', title: 'Sharp Mind',     desc: 'Get every answer right in a lesson',  check: function (s, st) { return st.perfectLessons >= 1; } },
  { id: 'on-fire',     icon: '🔥', title: 'On Fire',        desc: '5 correct answers in a row',          check: function (s) { return s.bestCombo >= 5; } },
  { id: 'brainiac',    icon: '🧠', title: 'Brainiac',       desc: '25 correct answers in total',         check: function (s) { return s.correct >= 25; } },
  { id: 'graduate',    icon: '🎓', title: 'Graduate',       desc: 'Complete your first course',          check: function (s, st) { return st.coursesDone >= 1; } },
  { id: 'flawless',    icon: '👑', title: 'Flawless',       desc: 'Get 3 stars on every lesson of a course', check: function (s, st) { return st.perfectCourses >= 1; } },
  { id: 'stars-15',    icon: '⭐', title: 'Star Collector', desc: 'Collect 15 stars',                    check: function (s, st) { return st.stars >= 15; } },
  { id: 'habit-hero',  icon: '📅', title: 'Habit Hero',     desc: 'Learn 3 days in a row',               check: function (s) { return s.bestStreak >= 3; } },
  { id: 'xp-500',      icon: '💎', title: 'XP Hunter',      desc: 'Earn 500 XP',                         check: function (s) { return s.xp >= 500; } },
  { id: 'champion',    icon: '🏆', title: 'AI Champion',    desc: 'Complete every course for your age',  check: function (s) {
    var mine = coursesForAge(s.age);
    return mine.length > 0 && mine.every(function (c) {
      return c.lessons.every(function (l) { return s.lessons[l.id] && s.lessons[l.id].stars > 0; });
    });
  } }
];

if (typeof module !== 'undefined') {
  module.exports = {
    COURSES: COURSES, AGE_GROUPS: AGE_GROUPS, findAgeGroup: findAgeGroup, coursesForAge: coursesForAge,
    LEVELS: LEVELS, XP_RULES: XP_RULES, DAILY_GOAL: DAILY_GOAL, ACHIEVEMENTS: ACHIEVEMENTS
  };
}
