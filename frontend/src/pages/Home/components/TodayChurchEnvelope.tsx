// 홈 묵상 히어로 우상단 "오늘의 교회" 봉투 버튼 — 누르면 /today 상세.
//
// 자리 변천(2026-10-16): 큰 편지 카드(B안) → 홈 맨 위 한 줄 봉투 → 지금 자리.
// 한 줄 봉투도 히어로를 아래로 밀었다가, 열어 본 뒤 사라지면 홈 전체가 다시 위로 튀었다.
// 히어로 우상단 유리 클러스터(날씨 칩·말씀 알람)의 맨 앞 칸은 absolute 오른쪽 정렬이라
// 나타나고 사라져도 아무것도 밀지 않는다.
//
// 노출 규칙
//   - 1년·6개월·한 달 전 '정확히 오늘' 남긴 기록이 있는 날만 뜬다(memory.exact).
//     앞뒤 3일 대체나 '처음 남긴 기도'는 같은 기록이 며칠씩 반복되므로 상세에서만 보여 준다.
//   - /today 를 한 번 열면 그날(서버 KST 날짜)은 숨는다. 상시 입구는 전체 메뉴·⌘K(navCatalog '/today').
import { useNavigate } from 'react-router-dom'
import type { MemoryKind, MemoryOffset } from '../../../api/todayChurch'
import { useHomeBundlePending } from '../../../hooks/useHomeSummary'
import { useTodayChurch } from '../../../hooks/useTodayChurch'
import { isAuthenticated } from '../../../utils/auth'
import { EnvelopeSimple } from '../../../components/icons/phosphor'
import { isTodayChurchOpened, useAskableMemory } from '../../TodayChurch/memoryCopy'

const WHEN: Record<Exclude<MemoryOffset, 'first'>, string> = {
  year: '1년 전',
  half: '6개월 전',
  month: '한 달 전',
}

/** 조사까지 — 묵상만 받침이 있다 */
const SUBJECT: Record<MemoryKind, string> = {
  prayer: '기도가',
  meditation: '묵상이',
  thanks: '감사가',
  typing: '필사가',
}

const TodayChurchEnvelope = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const bundlePending = useHomeBundlePending()
  const { data } = useTodayChurch(authed && !bundlePending)
  const askable = useAskableMemory()

  if (!authed || !data || isTodayChurchOpened(data.date)) return null
  const exact = data.memories.filter((m) => m.exact && m.offset !== 'first')
  // 응답을 물을 기도가 있으면 그것을 먼저, 없으면 가장 오래된 기념일(1년 → 6개월 → 한 달)
  const main = exact.find(askable) ?? exact[0]
  if (!main || main.offset === 'first') return null

  const label = `${WHEN[main.offset]} 오늘의 ${SUBJECT[main.kind]} 도착했어요`
  return (
    <button
      type="button"
      className="meditation-alarm-btn today-envelope-btn"
      onClick={() => navigate('/today')}
      aria-label={label}
      title={label}
    >
      <EnvelopeSimple size={17} weight="bold" aria-hidden />
      {/* 안 읽은 편지 점 */}
      <span className="today-envelope-dot" aria-hidden />
    </button>
  )
}

export default TodayChurchEnvelope
