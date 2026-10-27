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

export const memoryMeta = (m: TodayMemory) => {
  const parts = [formatKoreanDate(m.date), KIND_NAME[m.kind]]
  if (m.kind === 'prayer' && (m.prayer_count ?? 0) > 0) parts.push(`함께 기도 ${m.prayer_count}명`)
  if ((m.kind === 'typing' || m.kind === 'meditation') && m.reference) parts.push(m.reference)
  if (m.kind === 'typing' && (m.verse_count ?? 0) > 1) parts.push(`${m.verse_count}절`)
  return parts.join(' · ')
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
 * 손글씨 기록(필사 말고 전부)의 Nanum Pen 조각을 미리 받는다 — 홈 봉투가 뜰 때 preloadRoute('/today') 가 부른다.
 * 스타일시트만 붙이면 한글 unicode-range 조각은 글자가 그려진 뒤에야 내려와, 진입 시 폴백 → 손글씨로 바뀌었다.
 */
export const warmMemoryFonts = async (qc: QueryClient): Promise<void> => {
  const data = qc.getQueryData<TodayChurch>(todayChurchKeys.today())
  const text = data?.memories.filter((m) => m.kind !== 'typing').map((m) => m.text).join('')
  if (!text || typeof document === 'undefined' || !document.fonts) return
  await ensureFontFamily('nanumPen')
  await document.fonts.load(`24px "Nanum Pen Script"`, text).catch(() => undefined)
}
