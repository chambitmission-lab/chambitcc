// 목회자 영역 공용 훅·헬퍼 — 권한 게이트 · 입력 스타일 · 날짜 표기
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../../utils/toast'
import { isPastor } from '../../../utils/access'

/** 목회자만 머무는 화면 — 아니면 안내 후 홈으로. 반환값은 쿼리 enabled 에 그대로 쓴다 */
export const usePastorGate = (): boolean => {
  const navigate = useNavigate()
  const pastor = isPastor()
  useEffect(() => {
    if (!pastor) {
      showToast('목회자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [pastor, navigate])
  return pastor
}

export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

// 앱 공용 달력·시간(DatePicker/TimePicker) 트리거 — 목회자 폼의 입력칸과 같은 테두리·높이.
// 선택된 날짜가 'YYYY년 M월 D일 (요일)'로 크게 읽히도록 폭을 다 쓰고, PC(lg)에선 한 단계 크게
export const pickerCls =
  'flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3.5 py-2.5 lg:px-4 lg:py-3.5 text-left text-[14px] lg:text-[17px] text-ink-strong hover:border-brand focus:border-brand focus:outline-none transition-colors'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD' → 로컬 Date (UTC 파싱으로 하루 밀리는 걸 막는다) */
export const parseDay = (iso: string | null | undefined): Date | null => {
  if (!iso) return null
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/** '2026-09-23' → '9월 23일 (수)' — 올해가 아니면 연도를 붙인다 */
export const formatDay = (iso: string | null | undefined, withWeekday = true): string => {
  const d = parseDay(iso)
  if (!d) return ''
  const year = d.getFullYear() !== new Date().getFullYear() ? `${d.getFullYear()}년 ` : ''
  return `${year}${d.getMonth() + 1}월 ${d.getDate()}일${withWeekday ? ` (${WEEKDAYS[d.getDay()]})` : ''}`
}

/** 오늘을 로컬 기준 'YYYY-MM-DD' 로 */
export const todayIso = (offsetDays = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 경과 일수 → '오늘' / '3일 전' / '5주 전' / '4개월 전' */
export const agoLabel = (days: number | null | undefined): string => {
  if (days == null) return '기록 없음'
  if (days <= 0) return '오늘'
  if (days < 14) return `${days}일 전`
  if (days < 60) return `${Math.floor(days / 7)}주 전`
  return `${Math.floor(days / 30)}개월 전`
}

export const daysSince = (iso: string | null | undefined): number | null => {
  const d = parseDay(iso)
  if (!d) return null
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return Math.round((t.getTime() - d.getTime()) / 86400000)
}
