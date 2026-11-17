// 작년 오늘의 편지 문구 — /today 상세와 홈 봉투 버튼(열어 봤는지 표시)이 함께 쓴다
import type { QueryClient } from '@tanstack/react-query'
import type { MemoryKind, MemoryOffset, TodayChurch, TodayMemory } from '../../api/todayChurch'
import { todayChurchKeys } from '../../hooks/queryKeys'
import { useStillPraying } from '../../hooks/useTodayChurch'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { safeStorage } from '../../utils/safeStorage'

const OFFSET_LABEL: Record<MemoryOffset, string> = {
  year: '1년 전',
  half: '6개월 전',
  month: '한 달 전',
  first: '',
}

const KIND_NAME: Record<MemoryKind, string> = {
  prayer: '기도제목',
  meditation: '묵상',
  thanks: '감사',
  typing: '필사',
}

/** "1년 전 오늘" / "6개월 전 이맘때" / "처음 남기신 기도" */
export const memoryWhen = (m: Pick<TodayMemory, 'offset' | 'exact'>) =>
  m.offset === 'first' ? '처음 남기신 기도' : `${OFFSET_LABEL[m.offset]} ${m.exact ? '오늘' : '이맘때'}`

export const formatKoreanDate = (ymd: string) => {
  const [y, mo, d] = ymd.split('-').map(Number)
  return `${y}년 ${mo}월 ${d}일`
}

/** "한 달 전 오늘" — 기록이 없는 빈 정거장의 이름 */
export const offsetWhen = (offset: Exclude<MemoryOffset, 'first'>) => `${OFFSET_LABEL[offset]} 오늘`

const WEEKDAYS = ['주일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

/** "2026-10-17" → "토요일" */
export const weekdayOf = (ymd: string) => {
  const [y, mo, d] = ymd.split('-').map(Number)
  return WEEKDAYS[new Date(y, mo - 1, d).getDay()]
}

/** "21:42" → "밤 9:42" */
export const formatClock = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  const part = h < 5 ? '새벽' : h < 9 ? '아침' : h < 12 ? '오전' : h < 18 ? '오후' : h < 21 ? '저녁' : '밤'
  return `${part} ${h % 12 || 12}:${String(m).padStart(2, '0')}`
}

/** 기록 종류 옆에 붙는 한 줄 — "창세기 2:8 · 10절" / "어머니 수술 · 함께 기도 3명" */
export const memoryKind = (m: TodayMemory) => {
  const parts: string[] = []
  if (m.kind === 'prayer' && m.title) parts.push(m.title)
  if (m.kind === 'prayer' && (m.prayer_count ?? 0) > 0) parts.push(`함께 기도 ${m.prayer_count}명`)
  if ((m.kind === 'typing' || m.kind === 'meditation') && m.reference) parts.push(m.reference)
  if (m.kind === 'typing' && (m.verse_count ?? 0) > 1) parts.push(`${m.verse_count}절`)
  return { name: KIND_NAME[m.kind], detail: parts.join(' · ') }
}

/** 응답 질문을 붙일 기도인가 — 응답 전이고, 이 기기에서 '아직 기도 중'을 누르지 않은 것 */
export const useAskableMemory = () => {
  const { isStillPraying } = useStillPraying()
  return (m: TodayMemory) => m.kind === 'prayer' && !m.is_answered && !isStillPraying(m.id)
}

// ── 홈 봉투 '오늘 열어 봄' — /today 를 연 날(서버 KST 날짜)은 홈 봉투를 숨긴다 ──
const OPENED_KEY = 'todayChurch.openedDate'

export const isTodayChurchOpened = (serverDate: string) => safeStorage.get(OPENED_KEY) === serverDate

export const markTodayChurchOpened = (serverDate: string) => safeStorage.set(OPENED_KEY, serverDate)

/**
 * 손글씨(Nanum Pen) 조각을 미리 받는다 — 홈 봉투가 뜰 때 preloadRoute('/today') 와 /today 화면이 부른다.
 * 스타일시트만 붙이면 한글 unicode-range 조각은 글자가 그려진 뒤에야 내려와, 진입 시 폴백 → 손글씨로 바뀌었다.
 * 두 탭 글자를 한 번에 받는다: 걸어온 길의 기록(필사 말고 전부) + 어제 우리 교회 편지·폴라로이드·포스트잇·기도 시간.
 * 편지 문구 모듈은 홈 청크에 싣지 않으려고 여기서 동적으로 가져온다(/today 청크엔 이미 들어 있다).
 */
export const warmTodayFonts = async (data: TodayChurch | undefined): Promise<void> => {
  if (!data || typeof document === 'undefined' || !document.fonts) return
  const { buildLetter, EMOTION_NOTE, prayerMoments } = await import('./churchLetterCopy')
  const { church } = data
  const text = [
    ...data.memories.filter((m) => m.kind !== 'typing').map((m) => m.text),
    '오늘 남긴 한 줄은 내년 오늘, 이 길 위에서 다시 만나요.',
    ...buildLetter(church).flat().map((p) => p.text),
    '— 참비 드림 P.S. 오늘 펼친 말씀도 내일 편지에 담아 올게요. 오늘 쓴 첫 줄은 내일 편지에 실려요.',
    '어제 가장 많이 펼친 장 읽은 책 함께 펼친 다른 장 편 해가 뜨고 질 때까지, 번의 기도',
    '하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열 한 두 세 네',
    ...church.top_chapters.map((c) => c.book_name),
    ...(church.reading_books ?? []).slice(0, 1).map((b) => b.book_name),
    ...church.emotions.map((e) => EMOTION_NOTE[e.emotion] ?? ''),
    ...prayerMoments(church.hours).map((m) => m.label + m.mood),
  ].join('')
  await ensureFontFamily('nanumPen')
  await document.fonts.load(`24px "Nanum Pen Script"`, text).catch(() => undefined)
}

export const warmMemoryFonts = (qc: QueryClient): Promise<void> =>
  warmTodayFonts(qc.getQueryData<TodayChurch>(todayChurchKeys.today()))
