/* 성경 속 "기다림" 한 줄 유머 — 로딩이 길어질 때 빈 스켈레톤 대신 보여 준다.
 * 묵상 카드의 핵심 절 대기(WaitingQuipLoader)가 쓴다.
 * 등장할 때마다 다음 문구로 넘어가(저장소 순번) 같은 농담이 연달아 나오지 않는다. */

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

const STORAGE_KEY = 'chambit:wait-quip'

/* 등장마다 다음 순번 — 저장소가 막혀도 무작위로 하나는 돌려준다 */
export const nextWaitingQuip = (): WaitingQuip => {
  let index: number
  try {
    const prev = Number(localStorage.getItem(STORAGE_KEY))
    index = Number.isFinite(prev) ? (prev + 1) % WAITING_QUIPS.length : 0
    localStorage.setItem(STORAGE_KEY, String(index))
  } catch {
    index = Math.floor(Math.random() * WAITING_QUIPS.length)
  }
  return WAITING_QUIPS[index]
}
