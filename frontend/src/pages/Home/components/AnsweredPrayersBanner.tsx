// 응답의 전당 배너 — 공동체 그룹 리스트 카드의 한 행(row).
// 응답된 기도 수를 함께 보여줘 "쌓여가는 은혜"가 느껴지게 한다.
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPrayers } from '../../../api/prayer'
import { ChevronRightIcon } from '../../../components/icons/ActionIcons'
import { GraceIcon } from '../../../components/icons/GraceIcons'
import './AnsweredPrayersBanner.css'

const AnsweredPrayersBanner = () => {
  const navigate = useNavigate()

  // 개수만 필요하므로 limit=1로 total만 받아온다
  const { data: answeredTotal } = useQuery({
    queryKey: ['prayers', 'answeredCount'],
    queryFn: async () =>
      (await fetchPrayers(1, 1, 'latest', null, null, true)).data.total,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  return (
    // 공동체 그룹 리스트 카드의 한 행(row) — 배경·테두리는 부모 그룹 카드가 담당
    <button
      type="button"
      onClick={() => navigate('/answered-prayers')}
      className="w-full flex items-center gap-2.5 pl-3 pr-2.5 py-2.5 text-left hover:bg-[var(--brand-soft)] transition-colors"
      aria-label="응답의 전당 — 하나님께서 응답하신 기도들"
    >
      <span
        className="w-8 h-8 rounded-[10px] bg-[rgba(234,179,8,0.14)] flex items-center justify-center shrink-0"
        aria-hidden
      >
        <GraceIcon name="openDoor" className="answered-sparkle text-[#d9a514] grace-clay" />
      </span>
      <span className="text-xs font-bold text-[var(--text-strong)] whitespace-nowrap shrink-0">
        응답의 전당
      </span>
      <span className="flex-1 min-w-0 text-[11px] text-[var(--text-muted)] truncate">
        {answeredTotal && answeredTotal > 0
          ? `응답하신 기도 ${answeredTotal}개가 쌓여 있어요`
          : '하나님께서 응답하신 기도들'}
      </span>
      {/* 이동 표시는 muted 회색 + 28px 슬롯 — 세 행의 우측 요소를 같은 축에 세운다 */}
      <span
        className="shrink-0 w-7 h-7 flex items-center justify-center text-[var(--text-muted)]"
        aria-hidden
      >
        <ChevronRightIcon />
      </span>
    </button>
  )
}

export default AnsweredPrayersBanner
