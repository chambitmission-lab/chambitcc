// /capsule/new 단계마다 배달부 양이 건네는 한 줄.
// 질문은 화면 제목이 하고, 양은 그 질문에 반응만 한다 — 대사가 질문을 대신하면
// 어르신이 "뭘 하라는 건지" 놓친다. 유머는 한 줄, 판단은 화면이.

export type CreateStep = 1 | 2 | 3 | 4 | 5

export const STEP_COUNT = 5

/** 1단계 — 받는 사람 */
export const recipientQuip = (type: 'self' | 'other'): string =>
  type === 'self'
    ? '미래의 당신이요? 주소는 몰라도 길은 알아요!'
    : '소중한 분께요? 가장 좋은 가방에 넣어 갈게요'

/** 2단계 — 개봉일 프리셋별 반응 (키는 capsuleDates.buildPresets) */
const DATE_QUIPS: Record<string, string> = {
  '1m': '한 달이요? 금방 다녀올게요!',
  '3m': '석 달이면 산책 삼아 다녀오죠',
  '6m': '반년이라… 도시락 좀 싸 갈게요',
  '1y': '1년이요? 365밤을 달려야 하는군요… 힘내 볼게요',
  easter: '부활절 아침, 꼭 맞춰 갈게요',
  christmas: '성탄절 아침! 산타보다 먼저 도착할게요',
  newyear: '새해 첫날, 떡국 먹기 전에 도착!',
  custom: '그날 아침 7시, 문 앞에 두고 갈게요',
}

export const dateQuip = (presetKey: string, nights: number | null): string => {
  // 직접 고른 날이 아주 멀면 양이 먼저 지친다
  if (presetKey === 'custom' && nights !== null && nights > 730) {
    return `${nights.toLocaleString()}밤이요…? 저 그때까지 꼭 살아 있을게요`
  }
  return DATE_QUIPS[presetKey] ?? DATE_QUIPS.custom
}

/** 3단계 — 편지. 쓴 양에 따라 반응이 달라진다 */
export const letterQuip = (chars: number, hasInk: boolean): string => {
  if (hasInk && chars === 0) return '손글씨네요! 구겨지지 않게 꼭 안고 갈게요'
  if (chars === 0) return '안 훔쳐볼게요. 진짜로요.'
  if (chars < 80) return '좋아요, 천천히 더 써도 돼요'
  if (chars < 600) return '음… 마음이 묵직해서 가방이 따뜻해요'
  return '와, 이건 두 손으로 들고 가야겠어요'
}

/** 4단계 — 함께 넣을 것 */
export const extrasQuip = (photos: number, hasVoice: boolean, recording: boolean): string => {
  if (recording) return '쉿… 녹음 중엔 저도 숨 참을게요'
  if (photos > 0 && hasVoice) return '사진에 목소리까지! 가방이 꽉 찼어요'
  if (hasVoice) return '목소리는 테이프에 잘 감아 둘게요'
  if (photos > 0) return '사진은 그날 인화해서 꺼내 드릴게요'
  return '가방 아직 넉넉해요. 사진이나 목소리도 넣을래요?'
}

/** 5단계 — 봉인 */
export const sealQuip = (dateText: string): string => `${dateText}까지 제가 꼭 지키고 있을게요`
