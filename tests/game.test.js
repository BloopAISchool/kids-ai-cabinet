'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../js/game.js');
const { COURSES } = require('../js/data.js');

const ALL = [true, true, true, true];
const course = COURSES[0];

function passCourse(state, answers, day) {
  let r;
  for (const l of course.lessons) {
    r = G.applyLesson(state, course.id, l.id, answers, day);
    state = r.state;
  }
  return { state, last: r };
}

test('stars by accuracy', () => {
  assert.equal(G.starsFor(4, 4), 3);
  assert.equal(G.starsFor(3, 4), 2);
  assert.equal(G.starsFor(2, 4), 1);
  assert.equal(G.starsFor(1, 4), 0);
});

test('lesson XP: correct + combo + completion + perfect', () => {
  const x = G.lessonXp(ALL);
  // 4×10 за ответы, комбо с 3-го ответа: 2×5, урок 20, идеально 30
  assert.equal(x.total, 40 + 10 + 20 + 30);
  assert.equal(x.bestCombo, 4);
});

test('wrong answer resets combo, failed lesson gives only answer XP', () => {
  const x = G.lessonXp([true, false, false, false]);
  assert.equal(x.stars, 0);
  assert.equal(x.total, 10);
  assert.equal(G.lessonXp([true, true, false, true]).combo, 0);
});

test('replay gives only the improvement over the best result', () => {
  let s = G.newState('Kid');
  let r = G.applyLesson(s, course.id, course.lessons[0].id, [true, true, false, true], '2026-10-01');
  assert.equal(r.earned, 30 + 20);
  r = G.applyLesson(r.state, course.id, course.lessons[0].id, [true, true, false, true], '2026-10-01');
  assert.equal(r.earned, 0);
  r = G.applyLesson(r.state, course.id, course.lessons[0].id, ALL, '2026-10-01');
  assert.equal(r.earned, 100 - 50);
  assert.equal(r.state.lessons[course.lessons[0].id].stars, 3);
});

test('course completion bonus is given once', () => {
  const { state, last } = passCourse(G.newState('Kid'), ALL, '2026-10-01');
  assert.equal(last.courseCompleted, true);
  assert.equal(last.courseBonus, 100);
  assert.equal(state.xp, 3 * 100 + 100);
  const again = G.applyLesson(state, course.id, course.lessons[2].id, ALL, '2026-10-01');
  assert.equal(again.courseBonus, 0);
  assert.equal(G.stats(state).coursesDone, 1);
});

test('lessons unlock in order', () => {
  let s = G.newState('Kid');
  assert.equal(G.isLessonUnlocked(s, course, 1), false);
  s = G.applyLesson(s, course.id, course.lessons[0].id, [true, true, false, false], '2026-10-01').state;
  assert.equal(G.isLessonUnlocked(s, course, 1), true);
});

test('streak grows on consecutive days and resets after a gap', () => {
  let s = G.newState('Kid');
  const id = course.lessons[0].id;
  s = G.applyLesson(s, course.id, id, ALL, '2026-10-01').state;
  s = G.applyLesson(s, course.id, id, ALL, '2026-10-02').state;
  s = G.applyLesson(s, course.id, id, ALL, '2026-10-02').state;
  assert.equal(s.streak, 2);
  assert.equal(G.currentStreak(s, '2026-10-03'), 2);
  assert.equal(G.currentStreak(s, '2026-10-04'), 0);
  s = G.applyLesson(s, course.id, id, ALL, '2026-10-05').state;
  assert.equal(s.streak, 1);
  assert.equal(s.bestStreak, 2);
});

test('answer streak carries over between lessons and resets on a mistake', () => {
  let s = G.newState('Kid');
  s = G.applyLesson(s, course.id, course.lessons[0].id, [false, true, true, true], '2026-10-01').state;
  s = G.applyLesson(s, course.id, course.lessons[1].id, [true, true, false, true], '2026-10-01').state;
  assert.equal(s.bestCombo, 5);
  assert.equal(s.combo, 1);
});

test('achievements unlock once and level goes up', () => {
  const { state, last } = passCourse(G.newState('Kid'), ALL, '2026-10-01');
  const ids = Object.keys(state.achievements);
  for (const id of ['first-steps', 'sharp-mind', 'on-fire', 'graduate', 'flawless']) {
    assert.ok(ids.includes(id), id);
  }
  assert.equal(G.levelFor(state.xp).level, 3);
  assert.ok(last.unlocked.some(a => a.id === 'graduate'));
  const again = G.applyLesson(state, course.id, course.lessons[0].id, ALL, '2026-10-01');
  assert.equal(again.unlocked.length, 0);
});

test('every question has at least 2 options and an explanation', () => {
  for (const c of COURSES) for (const l of c.lessons) for (const q of l.questions) {
    assert.ok(q.options.length >= 2, q.q);
    assert.ok(q.explain, q.q);
  }
});

test('week XP covers 7 days ending today', () => {
  const s = G.newState('Kid');
  s.xpByDay = { '2026-10-02': 40, '2026-09-26': 10, '2026-09-25': 99 };
  const w = G.weekXp(s, '2026-10-02');
  assert.equal(w.length, 7);
  assert.equal(w[0].day, '2026-09-26');
  assert.equal(w[0].xp, 10);
  assert.equal(w[6].xp, 40);
});

// ---------- Курсы по возрасту из профиля ----------
const D = require('../js/data.js');

test('age groups match the school site', () => {
  assert.deepEqual(D.AGE_GROUPS.map(g => g.id), ['6-8', '9-11', '12-14', '15-17']);
});

test('cabinet shows only courses whose whole age range fits the profile age', () => {
  const ids = age => D.coursesForAge(age).map(c => c.id);
  assert.deepEqual(ids('6-8'), ['hello-ai']);
  assert.deepEqual(ids('9-11'), ['prompts', 'ai-art']);
  assert.deepEqual(ids('12-14'), []);
  assert.deepEqual(ids(''), []);
  assert.deepEqual(ids(undefined), []);
});

test('every cabinet course fits one age group', () => {
  for (const c of D.COURSES) {
    assert.ok(D.AGE_GROUPS.some(g => c.ages[0] >= g.min && c.ages[1] <= g.max), c.id);
  }
});

test('AI Champion needs every course for your age, not for all ages', () => {
  const champion = D.ACHIEVEMENTS.find(a => a.id === 'champion');
  let state = G.newState('Ann');
  state.age = '6-8';
  assert.equal(champion.check(state), false);
  state = passCourse(state, ALL, '2026-10-01').state; // hello-ai — единственный курс для 6–8
  state.age = '6-8';
  assert.equal(champion.check(state), true);
});
