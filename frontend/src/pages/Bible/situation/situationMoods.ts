import type { SituationCategory } from '../../../types/situation'

// ── 마음 체크인 — 감정 타일 → 상황 카테고리 ──────────────────────────
// 씨드 카테고리 16개를 성도가 실제로 쓰는 말(감정) 12개로 묶는다. 첫 이름이 대표 카테고리 —
// 타일을 누르면 그 카테고리 말씀부터 펼치고, 나머지는 끝 장면의 '이런 마음도 있나요?'로 이어 준다.
// 어드민이 새로 만든 카테고리는 여기 없어도 '상황으로 찾기' 목록과 말로 꺼내기 매칭에서 노출된다.
export type MoodTone =
  | 'sky' | 'mist' | 'peach' | 'slate' | 'lilac' | 'rose'
  | 'mint' | 'storm' | 'amber' | 'blue' | 'sand' | 'teal'

export interface Mood {
  label: string
  names: string[]
  tone: MoodTone
}

export const MOODS: Mood[] = [
  { label: '불안해요', names: ['두려울 때', '걱정될 때'], tone: 'sky' },
  { label: '지쳤어요', names: ['괴로울 때', '낙심될 때'], tone: 'peach' },
  { label: '우울해요', names: ['우울할 때', '낙심될 때'], tone: 'slate' },
  { label: '슬퍼요', names: ['슬플 때'], tone: 'lilac' },
  { label: '외로워요', names: ['고독할 때'], tone: 'rose' },
  { label: '아파요', names: ['몸이 아플 때'], tone: 'mint' },
  { label: '막막해요', names: ['위기일 때', '재난·재해시'], tone: 'storm' },
  { label: '길을 모르겠어요', names: ['인도가 필요할 때'], tone: 'amber' },
  { label: '하나님이 멀어요', names: ['하나님과 멀어졌을 때', '하나님을 의심할 때'], tone: 'blue' },
  { label: '용서가 안 돼요', names: ['용서가 어려울 때'], tone: 'sand' },
  { label: '쉬고 싶어요', names: ['평안이 필요할 때'], tone: 'teal' },
  { label: '감사해요', names: ['감사할 때'], tone: 'amber' },
]

/** 카테고리 → 몰입 화면 색 — 감정 타일에 없는(어드민 추가) 카테고리는 차분한 블루 */
export const toneForCategory = (name: string): MoodTone =>
  MOODS.find((m) => m.names[0] === name)?.tone ??
  MOODS.find((m) => m.names.includes(name))?.tone ??
  'blue'

// ── 말씀 앞에 건네는 한 줄 ─────────────────────────────────────────
// 어드민이 구절에 적어 둔 위로 메시지(message)가 있으면 그게 먼저다. 이건 없을 때의 기본값.
// 감정을 해석하거나 고쳐 주려 하지 않고, 곁에 계신 하나님을 가리키는 데서 멈춘다.
const EMPATHY: Record<string, string> = {
  '두려울 때': '두려움은 믿음이 없다는 뜻이 아니에요. 그 자리에 함께 서 계신 분이 있어요.',
  '걱정될 때': '내일의 무게까지 오늘 다 지지 않아도 괜찮아요.',
  '괴로울 때': '여기까지 오느라 정말 애썼어요. 잠시 짐을 내려놓아도 돼요.',
  '낙심될 때': '넘어진 자리에서도 다시 일으키시는 분이 계세요.',
  '우울할 때': '마음이 가라앉은 날에도, 하나님은 그 깊이까지 내려오세요.',
  '슬플 때': '울어도 괜찮아요. 그 눈물을 하나도 놓치지 않으시는 분이 계세요.',
  '고독할 때': '아무도 모르는 것 같은 밤에도, 당신은 혼자가 아니에요.',
  '몸이 아플 때': '몸이 약해진 날, 속사람을 붙드시는 손이 있어요.',
  '위기일 때': '앞이 보이지 않을 때에도 피난처 되시는 분은 그대로세요.',
  '재난·재해시': '흔들리는 땅 위에서도 흔들리지 않는 분을 붙들어요.',
  '인도가 필요할 때': '다음 한 걸음만 보여도 충분해요. 길은 그분이 아세요.',
  '하나님과 멀어졌을 때': '돌아서는 그 순간, 아버지는 이미 달려오고 계세요.',
  '하나님을 의심할 때': '흔들리는 질문까지 그분 앞에 그대로 가져가도 괜찮아요.',
  '용서가 어려울 때': '용서가 한 번에 되지 않아도 괜찮아요. 오늘은 마음을 맡기는 것부터.',
  '평안이 필요할 때': '복잡한 생각은 잠시 내려두고, 이 한 절에만 머물러 보세요.',
  '감사할 때': '그 기쁨, 하나님께 먼저 말씀드려요.',
}

export const empathyFor = (name: string): string =>
  EMPATHY[name] ?? '어떤 마음이든, 말씀 앞에 그대로 가져와도 괜찮아요.'

// ── 말로 꺼내기 — 한 문장 → 카테고리 (AI 없이 규칙) ─────────────────
// 성도가 실제로 쓸 법한 말 조각. 카테고리 DB의 keywords(기도 매칭용)도 함께 본다.
const PHRASES: Record<string, string[]> = {
  '두려울 때': ['두려', '무서', '무섭', '떨려', '떨리', '긴장', '면접', '발표', '시험 전', '공포', '겁나'],
  '걱정될 때': ['걱정', '염려', '근심', '불안', '내일', '잠이 안', '잠을 못', '돈', '빚', '대출', '성적'],
  '괴로울 때': ['괴로', '고통', '힘들', '힘든', '지쳐', '지친', '지쳤', '번아웃', '버거', '야근', '아픔'],
  '낙심될 때': ['낙심', '좌절', '실망', '떨어졌', '탈락', '실패', '포기', '자신이 없'],
  '우울할 때': ['우울', '무기력', '의욕', '공허', '아무것도 하기', '침체'],
  '슬플 때': ['슬퍼', '슬프', '슬픔', '눈물', '마음이 아', '울고', '울었', '이별', '헤어', '돌아가셨', '떠났', '상실', '보고 싶'],
  '고독할 때': ['외로', '혼자', '친구가 없', '소외', '따돌', '아무도'],
  '몸이 아플 때': ['아파', '아프', '아픈', '병원', '수술', '입원', '진단', '질병', '치료', '건강'],
  '위기일 때': ['위기', '막막', '망했', '파산', '해고', '시련', '환난', '큰일'],
  '재난·재해시': ['재난', '사고', '지진', '태풍', '홍수', '화재', '전쟁'],
  '인도가 필요할 때': ['진로', '취업', '이직', '결정', '선택', '고민', '전공', '입시', '어디로', '모르겠'],
  '하나님과 멀어졌을 때': ['멀어', '기도가 안', '교회 가기', '신앙', '돌아가고', '말씀이 안', '예배가'],
  '하나님을 의심할 때': ['의심', '정말 계', '믿어지지', '믿음이 없', '왜 하나님'],
  '용서가 어려울 때': ['용서', '미워', '미운', '화가', '화나', '분노', '배신', '싸웠', '억울', '상처 받'],
  '평안이 필요할 때': ['평안', '쉬고', '쉼', '복잡', '시끄', '마음이 어지', '스트레스'],
  '감사할 때': ['감사', '고마', '기뻐', '기쁜', '합격', '좋은 일', '행복', '축하'],
}

export interface SituationMatch {
  category: SituationCategory
  /** 문장에서 실제로 걸린 말 조각 — 0이면 기본 카테고리로 받은 것 */
  hits: number
}

/** 문장에서 가장 많이 걸린 카테고리. 하나도 안 걸리면 기본(is_default) → '평안이 필요할 때' */
export const matchSituation = (
  sentence: string,
  categories: SituationCategory[],
): SituationMatch | null => {
  const text = sentence.replace(/\s+/g, ' ').trim()
  const pool = categories.filter((c) => c.verse_count > 0)
  if (!text || pool.length === 0) return null

  let best: SituationMatch | null = null
  for (const cat of pool) {
    const words = [...(PHRASES[cat.name] ?? []), ...(cat.keywords ?? [])]
    let hits = text.includes(cat.name.replace(/ 때$|시$/, '')) ? 2 : 0
    // 긴 말 조각일수록 뜻이 분명하다 — '마음이 아파요'는 '아파'보다 '마음이 아'가 이긴다
    for (const w of words) if (w && text.includes(w)) hits += w.length >= 4 ? 2 : 1
    if (hits > 0 && (!best || hits > best.hits)) best = { category: cat, hits }
  }
  if (best) return best

  const fallback =
    pool.find((c) => c.is_default) ?? pool.find((c) => c.name === '평안이 필요할 때') ?? pool[0]
  return { category: fallback, hits: 0 }
}

/** 말로 꺼내기 예시 — 누르면 그 문장으로 바로 묻는다 (입력이 부담스러운 어르신용) */
export const ASK_STARTERS = [
  '내일 면접인데 너무 떨려요',
  '가족이 많이 아파요',
  '다 내려놓고 싶을 만큼 지쳤어요',
  '친구랑 크게 싸웠어요',
  '오늘 정말 감사한 일이 있었어요',
]

export const ASK_PLACEHOLDERS = [
  '내일 면접인데 떨려요…',
  '진로 때문에 잠이 안 와요…',
  '요즘 그냥 너무 외로워요…',
  '기도가 잘 안 돼요…',
]

export const timeGreeting = (d = new Date()): string => {
  const h = d.getHours()
  if (h < 5) return '깊은 밤이에요'
  if (h < 11) return '좋은 아침이에요'
  if (h < 17) return '평안한 오후예요'
  if (h < 21) return '저녁이에요'
  return '오늘 하루도 수고했어요'
}
