// 칭호 본문(이름·설명·힌트) 영어 번역.
// 백엔드 TITLE_REGISTRY 는 한국어만 내려주므로, key 기준으로 프론트에서 영어를 얹는다.
// (백엔드에 _en 컬럼이 생기면 이 맵 대신 서버 값을 쓰도록 바꾸면 된다.)
import type { TitleStatus } from '../../api/titles'
import type { Language } from '../../locales'

export interface TitleText {
  name: string
  description: string
  hint: string
}

const EN: Record<string, TitleText> = {
  dawn_riser: {
    name: 'Dawn Riser',
    description: 'Five alarms fought and defeated! Up before the rooster.',
    hint: 'Read the Bible between 4 and 6 AM',
  },
  night_owl: {
    name: 'Night Owl',
    description: "Everyone else is asleep, and that glow under the blanket isn't a phone — it's the Word. Even the owls are impressed.",
    hint: 'Read the Bible between 11 PM and 2 AM',
  },
  faithful_watchman: {
    name: 'Faithful Watchman',
    description: "Seven days in a row, stamped and sealed! Giving up after three days isn't in your dictionary.",
    hint: 'Read the Bible 7 days in a row',
  },
  unbroken_month: {
    name: 'Unbroken 30 Days',
    description: "What matters is a heart that won't break. A whole month sitting before the Word without missing a day.",
    hint: 'Read the Bible 30 days in a row',
  },
  day_and_night: {
    name: 'Day and Night',
    description: 'A bite in the morning, a bite in the evening — you snack on the Word like a pro.',
    hint: 'Read at least once in the morning and once in the afternoon of the same day',
  },
  three_meals: {
    name: 'Three Square Meals',
    description: 'Morning, noon, and night — a full course of the Word. Your soul went to bed full.',
    hint: 'Read three times in one day: morning, noon, and night',
  },
  keep_sabbath: {
    name: 'Keep the Sabbath Holy',
    description: 'Rain or snow, never a Sunday missed. Not one blank on the attendance sheet.',
    hint: 'Read the Bible on Sunday 3 weeks in a row',
  },
  attendance_king: {
    name: 'Attendance King',
    description: "On and off is fine too — that's 14 stamps already! Consistency is the real talent.",
    hint: 'Read on 14 or more days in total',
  },
  hundred_days: {
    name: '100-Day Resolve',
    description: 'Quitting after three days? Ancient history. A hundred days straight without missing one — iron will, certified.',
    hint: 'Read the Bible 100 days in a row',
  },
  moses_companion: {
    name: 'Companion of Moses',
    description: 'Genesis through Deuteronomy, the whole wilderness course — staff in hand, you followed all the way!',
    hint: 'Finish the Pentateuch (Genesis–Deuteronomy)',
  },
  wisdom_king: {
    name: 'King of Wisdom',
    description: 'Proverbs, done! Next time someone asks for advice you can say "well, you see…" and show off a little.',
    hint: 'Finish Proverbs',
  },
  gospel_witness: {
    name: 'Gospel Witness',
    description: "Matthew, Mark, Luke, John — all four cleared! Jesus' story never gets old, not even the fourth time.",
    hint: 'Finish the four Gospels (Matthew, Mark, Luke, John)',
  },
  seen_the_end: {
    name: 'One Who Saw the End',
    description: "Read Revelation to the very last chapter — spoiler alert! The ending is the Lord's victory 🎉",
    hint: 'Finish Revelation',
  },
  storm_reader: {
    name: 'Storm Reader',
    description: 'Fifty verses in a single day, gone in a flash! A frightening appetite for the Word.',
    hint: 'Read 50 or more verses in one day',
  },
  plan_finisher: {
    name: 'Strong Finisher',
    description: 'They say starting is half the battle — you polished off the other half too. Even procrastination gave up on you.',
    hint: 'Complete 1 reading plan',
  },
  plan_collector: {
    name: 'Finisher Collector',
    description: "Three finisher medals already! Go ahead and list \"completing reading plans\" as a hobby — nobody can stop you.",
    hint: 'Complete 3 reading plans',
  },
  word_marathoner: {
    name: 'Word Marathoner',
    description: 'A marathon ends at 42.195 km, but you ran a whole year. 365 days conquered — take your laurel wreath 🏅',
    hint: 'Complete a long plan of 300 days or more',
  },
  bible_conqueror: {
    name: 'Legend of the Whole Bible',
    description: 'From Genesis 1 to the final chapter of Revelation, all 66 books! Your name is carved into legend.',
    hint: 'Finish all 66 books — one complete read-through',
  },
  returned_prodigal: {
    name: 'The Prodigal Returns',
    description: 'Where have you been all this time? The Father is already running out, shoes barely on.',
    hint: 'Come back to reading after a break of 2 weeks or more',
  },
  streak_breaker: {
    name: 'Three-Day Breaker',
    description: "Day four, past the three-day wall! Sorry, short-lived resolutions — I'm on day four now.",
    hint: "Break the three-day slump by reading 4 days in a row",
  },
  everest_climber: {
    name: 'Everest Summit',
    description: 'Psalm 119, the Everest of the Bible — all 176 verses climbed, no oxygen tank needed! How was the view of the Word from the top?',
    hint: 'Finish Psalm 119, the longest chapter in the Bible',
  },
}

/** 서버가 준 한국어 본문을 현재 언어로 치환 — 매핑이 없으면 원문 그대로. */
export const localizeTitle = (
  title: Pick<TitleStatus, 'key' | 'name' | 'description' | 'hint'>,
  language: Language,
): TitleText => {
  const fallback = { name: title.name, description: title.description, hint: title.hint }
  if (language !== 'en') return fallback
  const en = EN[title.key]
  return en ? { ...fallback, ...en } : fallback
}
