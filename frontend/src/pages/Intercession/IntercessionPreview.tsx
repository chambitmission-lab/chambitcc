// /dev/intercession — 백엔드 없이 '누군가의 기도' 화면을 상태별로 보는 미리보기 (DEV 전용)
//
// React Query 캐시에 표본 상태를 심고 실제 화면(홈 카드 + 페이지)을 그대로 렌더한다.
// 표본 인물은 가상이다. 버튼(기도·참여)은 실제 API 를 부르므로 여기선 실패해도 괜찮다.
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { IntercessionState } from '../../api/intercession'
import { intercessionKeys } from '../../hooks/useIntercession'
import IntercessionCard from '../Home/components/IntercessionCard'
import Intercession from './Intercession'

const weeks = (lit: boolean[], current: number) =>
  ['2026-11-01', '2026-11-08', '2026-11-15', '2026-11-22', '2026-11-29'].map((start, i, all) => ({
    start,
    end: all[i + 1] ?? '2026-12-06',
    lit: lit[i] ?? false,
    is_current: i === current,
    is_future: i > current,
  }))

const cycle = { id: 1, start_date: '2026-11-01', end_date: '2026-12-06', theme_key: null, week_count: 5, current_week: 2 }
const church = { participants: 128, cycle_prayers: 1342 }
const joined = { status: 'active' as const, request_line: '이직 준비 중이에요. 지혜를 구해 주세요', joined_at: '2026-10-20T10:00:00' }

const target = (prayed: boolean) => ({
  user_id: 7,
  display_name: '박소망',
  avatar_url: null,
  request_line: '아이 수능이 다가와요. 평안을 위해 기도 부탁드려요',
  recent_prayers: [
    { id: 1, title: '어머니 건강', preview: '어머니 검사 결과가 다음 주에 나와요. 좋은 소식 있기를 기도합니다.', time_ago: '3일 전' },
  ],
  prayed_today: prayed,
  prayed_days: prayed ? 9 : 8,
})

const STATES: Record<string, IntercessionState> = {
  닫힘: { open: false, participant: null, cycle: null, next_start_date: '2026-11-01', waiting_reason: null, target: null, lamp: null, church: { participants: 0, cycle_prayers: 0 } },
  미참여: { open: true, participant: null, cycle: null, next_start_date: '2026-11-01', waiting_reason: null, target: null, lamp: null, church: { participants: 42, cycle_prayers: 0 } },
  '첫 주기 전': { open: true, participant: joined, cycle: null, next_start_date: '2026-11-01', waiting_reason: 'not_started', target: null, lamp: null, church: { participants: 42, cycle_prayers: 0 } },
  '진행 중': { open: true, participant: joined, cycle, next_start_date: '2026-12-06', waiting_reason: null, target: target(false), lamp: { weeks: weeks([true, true, false], 2), received_today: false, months_received: 1 }, church },
  '오늘 기도함': { open: true, participant: joined, cycle, next_start_date: '2026-12-06', waiting_reason: null, target: target(true), lamp: { weeks: weeks([true, true, true], 2), received_today: true, months_received: 3 }, church },
  '인원 모으는 중': { open: true, participant: joined, cycle, next_start_date: '2026-12-06', waiting_reason: 'gathering', target: null, lamp: { weeks: weeks([], 2), received_today: false, months_received: 0 }, church: { participants: 2, cycle_prayers: 0 } },
  '쉬는 중': { open: true, participant: { ...joined, status: 'paused' }, cycle, next_start_date: '2026-12-06', waiting_reason: null, target: null, lamp: null, church },
}

const IntercessionPreview = () => {
  const qc = useQueryClient()
  const [name, setName] = useState('진행 중')
  const seed = (key: string) => {
    qc.setQueryData(intercessionKeys.me(), STATES[key])
    setName(key)
  }
  // 렌더 전에 심어야 첫 프레임부터 표본이 보인다 (useState 초기화 = 1회만 실행)
  useState(() => {
    qc.setQueryData(intercessionKeys.me(), STATES[name])
    return null
  })

  return (
    <div>
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex flex-wrap justify-center gap-1 max-w-[92vw] p-1.5 rounded-2xl bg-black/75 backdrop-blur">
        {Object.keys(STATES).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => seed(k)}
            className={`px-2.5 h-8 rounded-xl text-[12px] font-bold ${k === name ? 'bg-white text-black' : 'text-white/80'}`}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="max-w-md mx-auto pt-3">
        <p className="px-5 text-[11px] font-bold text-gray-400">홈 카드</p>
        <IntercessionCard />
      </div>
      <Intercession />
    </div>
  )
}

export default IntercessionPreview
