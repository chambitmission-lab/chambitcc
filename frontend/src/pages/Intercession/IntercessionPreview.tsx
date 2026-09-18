// /dev/intercession — 백엔드 없이 '누군가의 기도' 화면을 상태별로 보는 미리보기 (DEV 전용)
//
// React Query 캐시에 표본 상태를 심고 실제 화면(홈 카드 + 페이지)을 그대로 렌더한다.
// 표본 인물은 가상이다. 버튼(기도·참여)은 실제 API 를 부르므로 여기선 실패해도 괜찮다.
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { IntercessionLetterList, IntercessionState } from '../../api/intercession'
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
  letter: prayed
    ? { body: '한 달 동안 매일 아침 당신의 이름을 부르며 기도했어요.\n수능 날, 평안이 함께하길.', updated_at: '2026-11-20T21:00:00', deliver_on: '2026-12-06' }
    : null,
})

const LETTERS: IntercessionLetterList = {
  unread: 1,
  items: [
    { id: 2, body: '한 달 동안 당신을 위해 기도했어요.\n\n이직을 준비하며 지치지 않도록, 하나님께서 가장 좋은 길로 인도해 주시길 바랐어요. 얼굴은 모르지만 같은 교회에서 함께 기도하고 있다는 걸 기억해 주세요.', month_start: '2026-11-01', delivered_at: '2026-12-06T07:03:00', is_read: false },
    { id: 1, body: '늘 평안하시길 기도합니다.', month_start: '2026-10-04', delivered_at: '2026-11-01T07:03:00', is_read: true },
  ],
}
const NO_LETTERS: IntercessionLetterList = { unread: 0, items: [] }

const STATES: Record<string, IntercessionState> = {
  닫힘: { open: false, participant: null, cycle: null, next_start_date: '2026-11-01', waiting_reason: null, target: null, lamp: null, unread_letters: 0, recap: null, church: { participants: 0, cycle_prayers: 0 } },
  미참여: { open: true, participant: null, cycle: null, next_start_date: '2026-11-01', waiting_reason: null, target: null, lamp: null, unread_letters: 0, recap: null, church: { participants: 42, cycle_prayers: 0 } },
  '첫 주기 전': { open: true, participant: joined, cycle: null, next_start_date: '2026-11-01', waiting_reason: 'not_started', target: null, lamp: null, unread_letters: 0, recap: null, church: { participants: 42, cycle_prayers: 0 } },
  '진행 중': { open: true, participant: joined, cycle, next_start_date: '2026-12-06', waiting_reason: null, target: target(false), lamp: { weeks: weeks([true, true, false], 2), received_today: false, months_received: 1 }, unread_letters: 0, recap: null, church },
  '오늘 기도함': { open: true, participant: joined, cycle, next_start_date: '2026-12-06', waiting_reason: null, target: target(true), lamp: { weeks: weeks([true, true, true], 2), received_today: true, months_received: 3 }, unread_letters: 0, recap: null, church },
  '인원 모으는 중': { open: true, participant: joined, cycle, next_start_date: '2026-12-06', waiting_reason: 'gathering', target: null, lamp: { weeks: weeks([], 2), received_today: false, months_received: 0 }, unread_letters: 0, recap: null, church: { participants: 2, cycle_prayers: 0 } },
  '편지 도착': { open: true, participant: joined, cycle: { ...cycle, id: 2, start_date: '2026-12-06', end_date: '2027-01-03', week_count: 4, current_week: 0 }, next_start_date: '2027-01-03', waiting_reason: null, target: { ...target(false), display_name: '이믿음', request_line: null, recent_prayers: [] }, lamp: { weeks: weeks([], 0).slice(0, 4), received_today: false, months_received: 3 }, unread_letters: 1, recap: null, church },
  '지난달 마무리': {
    open: true, participant: joined,
    cycle: { ...cycle, id: 2, start_date: '2026-12-06', end_date: '2027-01-03', week_count: 4, current_week: 0 },
    next_start_date: '2027-01-03', waiting_reason: null,
    target: { ...target(false), display_name: '이믿음', request_line: null, recent_prayers: [] },
    lamp: { weeks: weeks([], 0).slice(0, 4), received_today: false, months_received: 3 },
    unread_letters: 0,
    recap: {
      cycle_id: 1, start_date: '2026-11-01', end_date: '2026-12-06',
      was_receiver: true, was_giver: true,
      weeks: weeks([true, true, false, true, true], 5),
      letters_received: 1, church_prayers: 1342, my_prayed_days: 21,
      can_thank: true, thanks_sent: null,
      thanks_received: ['기도 덕분에 한 달을 잘 지냈어요'],
      request_line: '이직 준비 중이에요. 지혜를 구해 주세요',
    },
    church,
  },
  '쉬는 중': { open: true, participant: { ...joined, status: 'paused' }, cycle, next_start_date: '2026-12-06', waiting_reason: null, target: null, lamp: null, unread_letters: 0, recap: null, church },
}

const IntercessionPreview = () => {
  const qc = useQueryClient()
  const [name, setName] = useState('진행 중')
  const plant = (key: string) => {
    qc.setQueryData(intercessionKeys.me(), STATES[key])
    const hasLetters = key === '편지 도착' || key === '지난달 마무리' || key === '쉬는 중' || key === '오늘 기도함'
    qc.setQueryData(intercessionKeys.letters(), hasLetters ? LETTERS : NO_LETTERS)
  }
  const seed = (key: string) => {
    plant(key)
    setName(key)
  }
  // 렌더 전에 심어야 첫 프레임부터 표본이 보인다 (useState 초기화 = 1회만 실행)
  useState(() => {
    plant(name)
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
