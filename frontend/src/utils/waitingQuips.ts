/* 성경 속 "기다림" 한 줄 유머 — 로딩이 길어질 때 빈 스켈레톤 대신 보여 준다.
 * 프로필 첫 진입(ProfileWaitingQuip)이 쓴다.
 * 등장할 때마다 다음 문구로 넘어가(저장소 순번, 화면별 키) 같은 농담이 연달아 나오지 않는다. */

export interface WaitingQuip {
  ko: string
  en: string
  refKo: string
  refEn: string
}

export const WAITING_QUIPS: WaitingQuip[] = [
  {
    ko: '므두셀라(969세)에 비하면 이 정도 기다림은 찰나죠.',
    en: 'Compared to Methuselah’s 969 years, this is a blink.',
    refKo: '창세기 5:27',
    refEn: 'Genesis 5:27',
  },
  {
    ko: '노아는 방주에서 1년 넘게 기다렸대요. 저희는 1초만요.',
    en: 'Noah waited in the ark for over a year. We only need a second.',
    refKo: '창세기 8:13-14',
    refEn: 'Genesis 8:13-14',
  },
  {
    ko: '아브라함은 약속을 25년 기다렸어요. 말씀은 금방 와요.',
    en: 'Abraham waited 25 years for the promise. Today’s verse is almost here.',
    refKo: '창세기 12:4 · 21:5',
    refEn: 'Genesis 12:4 · 21:5',
  },
  {
    ko: '야곱은 7년을 며칠같이 여겼대요. 이 몇 초도 그렇게요.',
    en: 'Jacob’s seven years felt like a few days. May these seconds too.',
    refKo: '창세기 29:20',
    refEn: 'Genesis 29:20',
  },
  {
    ko: '엘리야도 까마귀 배달을 기다렸어요. 말씀 배달 중!',
    en: 'Elijah waited for the ravens’ delivery. Your verse is on its way!',
    refKo: '열왕기상 17:6',
    refEn: '1 Kings 17:6',
  },
  {
    ko: '요나는 물고기 뱃속에서 사흘을 버텼대요. 저희는 금방이에요.',
    en: 'Jonah waited three days inside a fish. This won’t take that long.',
    refKo: '요나 1:17',
    refEn: 'Jonah 1:17',
  },
  {
    ko: '광야 40년보다는 확실히 빨리 도착해요.',
    en: 'Definitely faster than forty years in the wilderness.',
    refKo: '민수기 14:33',
    refEn: 'Numbers 14:33',
  },
  {
    ko: '삭개오처럼 돌무화과나무에 올라 기다리는 중…',
    en: 'Climbing a sycamore tree like Zacchaeus to watch for it…',
    refKo: '누가복음 19:4',
    refEn: 'Luke 19:4',
  },
  {
    ko: '여호와를 기다리는 자는 새 힘을 얻어요. 잠시만요.',
    en: 'Those who wait on the Lord renew their strength. One moment.',
    refKo: '이사야 40:31',
    refEn: 'Isaiah 40:31',
  },
  {
    ko: '파수꾼이 아침을 기다림보다 더 간절히 — 곧 도착해요.',
    en: 'More than watchmen wait for the morning — almost there.',
    refKo: '시편 130:6',
    refEn: 'Psalm 130:6',
  },
  {
    ko: '한나는 오래 기도하며 기다렸어요. 저희는 몇 초면 돼요.',
    en: 'Hannah prayed and waited for years. We only need a few seconds.',
    refKo: '사무엘상 1:10-20',
    refEn: '1 Samuel 1:10-20',
  },
  {
    ko: '여리고 성도 이레를 돌고서야 무너졌죠. 조금만요.',
    en: 'Jericho fell only after seven days of marching. Just a little longer.',
    refKo: '여호수아 6:15-20',
    refEn: 'Joshua 6:15-20',
  },
]

/* 프로필 첫 진입용 — "말씀이 온다"는 묵상 카드 전용 표현 두 줄은 중립으로 바꾸고,
 * 기록·여정·온도를 재는 화면답게 사람의 "준비 기간" 이야기 여섯 줄을 보탠다. */
const PROFILE_REWRITES: Record<string, Pick<WaitingQuip, 'ko' | 'en'>> = {
  '창세기 12:4 · 21:5': {
    ko: '아브라함은 약속을 25년 기다렸어요. 기록은 금방 와요.',
    en: 'Abraham waited 25 years for the promise. Your records are almost here.',
  },
  '열왕기상 17:6': {
    ko: '엘리야도 까마귀 배달을 기다렸어요. 프로필 배달 중!',
    en: 'Elijah waited for the ravens’ delivery. Your profile is on its way!',
  },
}

const PROFILE_EXTRA_QUIPS: WaitingQuip[] = [
  {
    ko: '다윗은 양 치던 막내였다가 왕이 됐어요. 당신의 여정도 차곡차곡 쌓이는 중.',
    en: 'David went from youngest shepherd to king. Your journey is stacking up too.',
    refKo: '사무엘상 16:11-13',
    refEn: '1 Samuel 16:11-13',
  },
  {
    ko: '요셉은 꿈을 꾸고 13년 뒤에야 총리가 됐어요. 신앙의 온도, 지금 재는 중.',
    en: 'Joseph waited 13 years from his dream to the palace. Taking your faith temperature now.',
    refKo: '창세기 37:2 · 41:46',
    refEn: 'Genesis 37:2 · 41:46',
  },
  {
    ko: '모세는 80세에 부르심을 받았어요. 늦은 건 없답니다, 프로필도요.',
    en: 'Moses was called at eighty. Nothing is late — not even this profile.',
    refKo: '출애굽기 7:7',
    refEn: 'Exodus 7:7',
  },
  {
    ko: '바울의 편지는 배로 몇 달을 건너 닿았어요. 당신의 기록은 금방 펼쳐져요.',
    en: 'Paul’s letters crossed the sea for months. Your records open in seconds.',
    refKo: '사도행전 27:1-2',
    refEn: 'Acts 27:1-2',
  },
  {
    ko: '시므온은 평생 그분을 기다렸어요. 저희는 몇 초면 돼요.',
    en: 'Simeon waited his whole life for Him. We only need a few seconds.',
    refKo: '누가복음 2:25-26',
    refEn: 'Luke 2:25-26',
  },
  {
    ko: '룻은 이삭을 하나씩 주워 모았어요. 당신의 기록도 그렇게 모이는 중.',
    en: 'Ruth gathered grain one stalk at a time. Your records are gathering the same way.',
    refKo: '룻기 2:17',
    refEn: 'Ruth 2:17',
  },
]

export const PROFILE_WAITING_QUIPS: WaitingQuip[] = [
  ...WAITING_QUIPS.map((q) => (PROFILE_REWRITES[q.refKo] ? { ...q, ...PROFILE_REWRITES[q.refKo] } : q)),
  ...PROFILE_EXTRA_QUIPS,
]

const STORAGE_KEY = 'chambit:wait-quip'
export const PROFILE_QUIP_STORAGE_KEY = 'chambit:wait-quip-profile'

/* 등장마다 다음 순번 — 저장소가 막혀도 무작위로 하나는 돌려준다 */
export const nextWaitingQuip = (pool: WaitingQuip[] = WAITING_QUIPS, storageKey = STORAGE_KEY): WaitingQuip => {
  let index: number
  try {
    const prev = Number(localStorage.getItem(storageKey))
    index = Number.isFinite(prev) ? (prev + 1) % pool.length : 0
    localStorage.setItem(storageKey, String(index))
  } catch {
    index = Math.floor(Math.random() * pool.length)
  }
  return pool[index]
}
