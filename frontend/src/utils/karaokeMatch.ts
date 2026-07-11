/**
 * 노래방식 낭독 하이라이트 — 진행률 계산 순수 로직.
 * 음성 인식 결과(spokenText)로 "본문 어디까지 읽었나"를 추정한다.
 * UI(rAF 보간·렌더링)는 useKaraokeProgress 훅이 담당.
 *
 * 주의: 여기의 정규화는 공백을 "완전히 제거"한다 — textSimilarity.ts의
 * normalizeText(공백 축약)와 규칙이 다르므로 섞어 쓰지 말 것.
 */

export interface KaraokeMatchState {
  /** 목표 진행률(%) — 인식 결과 기준, 뒤로 가지 않음 */
  progress: number
  /** 지금까지 들린 발화 길이(정규화) — 전진 상한 계산용 */
  spokenLen: number
}

export const INITIAL_KARAOKE_STATE: KaraokeMatchState = { progress: 0, spokenLen: 0 }

const normalize = (text: string) => text.replace(/\s+/g, '').toLowerCase()

/**
 * 인식 결과를 반영해 목표 진행률을 전진시킨다.
 * 성경은 반복 단어가 많아("하나님이", "낳았고" 등) 검색을 본문 처음부터 하면
 * 앞/뒤의 같은 단어에 잘못 매칭돼 경계가 튄다 → 항상 직전 매칭 위치 부근부터 찾는다.
 */
export const advanceKaraokeMatch = (
  verseText: string,
  spokenText: string,
  prev: KaraokeMatchState
): KaraokeMatchState => {
  const verseNormalized = normalize(verseText)
  const spokenNormalized = normalize(spokenText)
  if (!verseNormalized || !spokenNormalized) {
    return prev
  }

  // 직전 매칭 위치(정규화 글자 수) — 여기서 크게 벗어난 매칭은 신뢰하지 않는다
  const prevLength = Math.round((prev.progress / 100) * verseNormalized.length)

  // 퍼지 매칭 전진 상한: "이번에 새로 들린 글자 수 + 약간"까지만.
  // 인식 엔진이 아직 읽지 않은 단어를 예측해 내놓거나, 마지막 단어가 본문
  // 뒤쪽의 같은 단어에 매칭되면 색칠이 낭독을 앞질러 가는데, 실제로 들린
  // 만큼만 전진을 허용해 그것을 막는다. (발화 길이는 최대값으로 추적 —
  // interim 교정으로 길이가 줄었다 다시 늘어도 이중으로 credit하지 않음)
  const newChars = Math.max(0, spokenNormalized.length - prev.spokenLen)
  const spokenLen = Math.max(prev.spokenLen, spokenNormalized.length)
  const fuzzyLimit = prevLength + newChars + 4

  let matchLength = 0

  // 방법 1: 앞에서부터 순차 매칭 (완전 일치 증거이므로 상한 없이 신뢰)
  const seqLimit = Math.min(verseNormalized.length, spokenNormalized.length)
  for (let i = 0; i < seqLimit; i++) {
    if (verseNormalized[i] !== spokenNormalized[i]) {
      break
    }
    matchLength = i + 1
  }

  // 방법 2: 최근 발화 꼬리(마지막 10글자)를 직전 위치 부근부터 검색
  if (spokenNormalized.length >= 5) {
    const recentSpoken = spokenNormalized.slice(-10)
    const foundIndex = verseNormalized.indexOf(
      recentSpoken,
      Math.max(0, prevLength - recentSpoken.length)
    )
    if (foundIndex !== -1) {
      matchLength = Math.max(
        matchLength,
        Math.min(foundIndex + recentSpoken.length, fuzzyLimit)
      )
    }
  }

  // 방법 3: 마지막 단어를 직전 위치 부근부터 검색 (가장 유연함).
  // 한 글자짜리 단어("이", "그" 등)는 본문 어디에나 있어 오매칭만 만드므로 제외.
  const spokenWords = spokenText.trim().split(/\s+/).filter(w => w.length > 0)
  if (spokenWords.length > 0) {
    const lastWordNormalized = normalize(spokenWords[spokenWords.length - 1])
    if (lastWordNormalized.length >= 2) {
      const wordIndex = verseNormalized.indexOf(
        lastWordNormalized,
        Math.max(0, prevLength - lastWordNormalized.length)
      )
      if (wordIndex !== -1) {
        matchLength = Math.max(
          matchLength,
          Math.min(wordIndex + lastWordNormalized.length, fuzzyLimit)
        )
      }
    }
  }

  const currentProgress = (matchLength / verseNormalized.length) * 100
  return {
    progress: Math.max(prev.progress, currentProgress),
    spokenLen,
  }
}

/** 진행률(%) → 원본 텍스트의 색칠 경계 인덱스(공백 건너뛰며 계산) */
export const splitIndexForProgress = (text: string, progress: number): number => {
  const nonSpaceTotal = text.replace(/\s+/g, '').length
  if (nonSpaceTotal === 0) return 0
  const chars = Math.floor((progress / 100) * nonSpaceTotal)
  if (chars <= 0) return 0
  let count = 0
  for (let i = 0; i < text.length; i++) {
    if (!/\s/.test(text[i])) {
      count++
      if (count === chars) return i + 1
    }
  }
  return text.length
}
