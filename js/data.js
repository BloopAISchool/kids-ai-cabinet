'use strict';

// Контент курсов. Вопрос: q — текст, options — варианты (первый всегда правильный,
// порядок перемешивается при показе), explain — объяснение после ответа.
var COURSES = [
  {
    id: 'hello-ai', title: 'Hello, AI!', ages: [6, 7], age: 'Ages 6–7', palette: 'mint', pose: 'hello', thumb: '#DDF6EF',
    lessons: [
      { id: 'hello-1', title: 'What is AI?', questions: [
        { q: 'Which of these can use AI?', options: ['A voice assistant on a phone', 'A wooden chair', 'A pencil'],
          explain: 'Voice assistants use AI to understand what you say.' },
        { q: 'AI learns from…', options: ['Examples', 'Magic', 'Sleeping'],
          explain: 'AI looks at lots of examples to find patterns.' },
        { q: 'Is AI a living creature?', options: ["No, it's a computer program", 'Yes, it has feelings'],
          explain: 'AI is a program. It can seem smart, but it does not feel or think like you.' },
        { q: 'Who creates AI?', options: ['People', 'Clouds', 'Cats'],
          explain: 'Engineers and scientists build and train AI.' }
      ]},
      { id: 'hello-2', title: 'How AI learns', questions: [
        { q: 'To teach AI to spot cats, we show it…', options: ['Many cat pictures', 'One dog picture', 'Nothing at all'],
          explain: 'The more cat pictures AI sees, the better it gets at spotting cats.' },
        { q: 'What do we call the examples AI learns from?', options: ['Data', 'Dessert', 'Dance'],
          explain: 'Pictures, texts and sounds that AI learns from are called data.' },
        { q: 'If AI only saw orange cats, it might…', options: ['Not recognize a black cat', 'Learn to fly', 'Know every animal'],
          explain: 'AI only knows what it has seen. Different examples make it smarter.' },
        { q: 'More good examples usually make AI…', options: ['Better', 'Sleepier', 'Smaller'],
          explain: 'Good data is like good food for AI.' }
      ]},
      { id: 'hello-3', title: 'AI around us', questions: [
        { q: 'Which app might use AI to suggest cartoons?', options: ['A video app', 'A calculator', 'A clock'],
          explain: 'Video apps use AI to guess what you might like next.' },
        { q: 'A robot vacuum uses AI to…', options: ['Find its way around a room', 'Cook pizza', 'Paint the walls'],
          explain: 'It uses sensors and AI to avoid bumping into things.' },
        { q: 'Can AI make mistakes?', options: ['Yes, sometimes', 'Never'],
          explain: 'AI can be wrong, so it is smart to double-check.' },
        { q: 'If AI tells you something strange, you should…', options: ['Ask a grown-up and check', 'Believe it right away'],
          explain: 'Checking with a grown-up keeps you safe and smart.' }
      ]}
    ]
  },
  {
    id: 'prompts', title: 'Magic Prompts', ages: [9, 11], age: 'Ages 9–11', palette: 'sky', pose: 'idea', thumb: '#E1F0FF',
    lessons: [
      { id: 'prompts-1', title: 'What is a prompt?', questions: [
        { q: 'A prompt is…', options: ['The instruction you give to AI', 'A type of robot', 'A computer virus'],
          explain: 'A prompt is what you type or say to tell AI what you want.' },
        { q: 'Which prompt is clearer?', options: ['Write a 4-line poem about a happy dog', 'Poem'],
          explain: 'Details like length and topic help AI understand you.' },
        { q: 'Good prompts are…', options: ['Clear and specific', 'Very short and vague', 'Written in secret code'],
          explain: 'Clear and specific prompts get better answers.' },
        { q: "If AI's answer isn't what you wanted, you can…", options: ['Change the prompt and try again', 'Give up forever', 'Shout at the screen'],
          explain: 'Improving the prompt step by step is a real skill!' }
      ]},
      { id: 'prompts-2', title: 'Adding details', questions: [
        { q: 'Which prompt helps AI draw a better picture?', options: ['A red kite over a green hill at sunset', 'Something nice'],
          explain: 'Colors, objects and time of day give AI a clear picture.' },
        { q: "Saying who the answer is for (e.g. 'for a 9-year-old') helps AI…", options: ['Choose the right words', 'Run faster', 'Turn itself off'],
          explain: 'AI adjusts its words to the reader.' },
        { q: "Asking for an answer 'in 3 bullet points' sets the…", options: ['Format', 'Volume', 'Color'],
          explain: 'Format tells AI how the answer should look.' },
        { q: 'Which one is a role prompt?', options: ["'You are a friendly science teacher…'", "'Hello'", "'Stop'"],
          explain: 'Giving AI a role changes its style and focus.' }
      ]},
      { id: 'prompts-3', title: 'Checking answers', questions: [
        { q: 'When AI invents facts that are not true, it is called…', options: ['Hallucination', 'Hibernation', 'Celebration'],
          explain: 'AI can sound sure even when it is wrong. That is a hallucination.' },
        { q: 'The best way to check a fact from AI is to…', options: ['Compare it with a trusted source', 'Ask the same question louder'],
          explain: 'Books, encyclopedias and teachers are trusted sources.' },
        { q: 'Should you share your home address with an AI chat?', options: ['No, keep personal info private', 'Yes, always'],
          explain: 'Never share your address, phone or passwords online.' },
        { q: "If AI's answer seems unkind or unfair, you should…", options: ['Tell a grown-up', 'Copy it to friends'],
          explain: 'A grown-up can help you understand what went wrong.' }
      ]}
    ]
  },
  {
    id: 'ai-art', title: 'AI Artist', ages: [9, 11], age: 'Ages 9–11', palette: 'lav', pose: 'wink', thumb: '#EEE9FF',
    lessons: [
      { id: 'art-1', title: 'Pictures from words', questions: [
        { q: 'Image AI turns ___ into pictures.', options: ['Text descriptions', 'Sounds of rain', 'Smells'],
          explain: 'You describe a picture with words, and AI draws it.' },
        { q: 'Which word describes an art style?', options: ['Watercolor', 'Tuesday', 'Seven'],
          explain: 'Watercolor, pixel art and comic are all art styles.' },
        { q: 'To get a cartoon look, add…', options: ["'in cartoon style'", "'please hurry'"],
          explain: 'Naming the style tells AI how to draw.' },
        { q: 'AI pictures are made by…', options: ['Learning from many images', 'A tiny painter inside the computer'],
          explain: 'AI learned what things look like from lots of images.' }
      ]},
      { id: 'art-2', title: 'Colors and mood', questions: [
        { q: 'Which words create a cozy mood?', options: ['Warm light, soft blanket, fireplace', 'Dark storm, lightning'],
          explain: 'Warm, soft words make a picture feel cozy.' },
        { q: "'Bright, sunny, playful' makes a picture feel…", options: ['Happy', 'Scary', 'Sleepy'],
          explain: 'Mood words change the whole feeling of a picture.' },
        { q: 'To change only the color of something, you should…', options: ['Edit that part of the prompt', 'Start a totally new topic'],
          explain: 'Small edits to the prompt give small changes in the picture.' },
        { q: 'Which is a camera angle word?', options: ['Close-up', 'Spaghetti', 'Loud'],
          explain: 'Close-up, wide shot and bird’s-eye view are camera angles.' }
      ]},
      { id: 'art-3', title: 'Fair and kind art', questions: [
        { q: 'Is it OK to say you drew an AI picture all by yourself?', options: ['No, be honest that AI helped', 'Yes, nobody will know'],
          explain: 'Being honest about AI help is fair to everyone.' },
        { q: 'Before posting a picture of a friend, you should…', options: ['Ask their permission', 'Post it secretly'],
          explain: 'Always ask before sharing pictures of other people.' },
        { q: 'A good way to use AI art is to…', options: ['Illustrate your own stories', 'Trick people with fake photos'],
          explain: 'AI art is great for creativity, not for fooling people.' },
        { q: 'If AI draws something strange, like six fingers, you…', options: ['Spot the mistake and fix the prompt', 'Think AI is always perfect'],
          explain: 'Good AI artists notice mistakes and fix them.' }
      ]}
    ]
  }
];

// Возрастные группы — те же, что на сайте школы (catalog.js в kids-ai-courses): меняются вместе.
// more — куда вести, если для группы в кабинете пока нет курсов (путь от корня сайта школы).
var AGE_GROUPS = [
  { id: '6-8',   min: 6,  max: 8,  name: 'Explorers' },
  { id: '9-11',  min: 9,  max: 11, name: 'Inventors' },
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
