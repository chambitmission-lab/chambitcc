// /dev/seats-admin — 좌석 예약 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 SeatDesk 를 표본으로 띄운다. 상태 바꾸기·삭제는 이 화면 안에서만 바뀌고
// (서버 호출 없음), 수정·새 행사·링크는 토스트로만 알린다. 현황판(SeatBoard)은 React Query 캐시에
// 배치·예약을 미리 심어 그린다 — 대리 배정·취소·입장 버튼은 실제 서버로 가므로 미리보기에선 실패 토스트가 난다.
// 예약 기간 끝·공연 지남·오픈 전·준비 중·매진·지난 행사 표본 포함.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import SeatDesk from '../Admin/components/SeatDesk'
import SeatBoard from '../Admin/components/SeatBoard'
import { filterSeatEvents } from '../Admin/components/seatDeskUtils'
import { seatKeys } from '../../hooks/queryKeys'
import { LAYOUT_PRESETS } from '../Seats/seatLayout'
import type { SeatEventDetail, SeatEventSummary, SeatReservation } from '../../types/seatEvent'
import { showToast } from '../../utils/toast'

const pad = (n: number) => String(n).padStart(2, '0')
/** 오늘에서 days 일 뒤 hh:00 — 서버처럼 오프셋 없는 KST 벽시계 문자열 */
const at = (days: number, h = 17) => {
  const d = new Date(Date.now() + 9 * 3600_000)
  d.setUTCDate(d.getUTCDate() + days)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(h)}:00:00`
}

const LAYOUT = { ...LAYOUT_PRESETS[0].layout, held: ['H1', 'I1'] }
const TOTAL = LAYOUT.sections.reduce((n, s) => n + s.rows * s.cols, 0)

let seq = 0
const ev = (title: string, reserved: number, p: Partial<SeatEventSummary> = {}): SeatEventSummary => ({
  id: ++seq,
  title,
  venue: '본당',
  status: 'open',
  max_per_user: 4,
  total_seats: TOTAL,
  reserved_count: reserved,
  available_count: TOTAL - reserved - 2,
  holder_count: Math.ceil(reserved / 2.4),
  is_booking_open: true,
  my_seats: [],
  performance_at: at(12),
  opens_at: null,
  closes_at: null,
  event_id: null,
  created_at: at(-10),
  ...p,
})

const SEED: SeatEventSummary[] = [
  ev('성탄 오르겔 콘서트', 9, { performance_at: at(25, 19), event_id: 31, closes_at: at(24, 23) }),
  ev('찬양팀 정기 공연', 0, { performance_at: at(40), opens_at: at(5, 9), is_booking_open: false }),
  ev('청년부 연극 「돌아온 탕자」', 174, { performance_at: at(6), available_count: 0, reserved_count: 174 }),
  ev('추수감사 음악회', 40, { performance_at: at(3), closes_at: at(-1), is_booking_open: false }),
  ev('신년 음악 예배', 0, { status: 'draft', is_booking_open: false, performance_at: at(36) }),
  ev('여름 성경학교 발표회', 88, { performance_at: at(-2), is_booking_open: false }),
  ev('가을 바자회 공연', 120, { status: 'closed', is_booking_open: false, performance_at: at(-60), venue: '교육관 강당' }),
]

const NAMES = ['김은혜', '박소망', '이믿음', '최사랑', '정기쁨']
const reservationsFor = (e: SeatEventSummary): SeatReservation[] => {
  const labels = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'D4', 'D5', 'J2'].slice(0, Math.min(9, e.reserved_count))
  return labels.map((seat_label, i) => {
    const g = Math.floor(i / 2)
    const admin = g === 3
    return {
      id: e.id * 100 + i,
      seat_label,
      user_id: admin ? null : g + 1,
      holder_name: NAMES[g % NAMES.length],
      group_code: admin ? `m:demo${g}` : `u:${g + 1}`,
      source: admin ? 'admin' : 'member',
      note: admin ? '전화 접수 · 010-0000-0000' : null,
      checked_in_at: g === 0 ? at(0, 18) : null,
      created_at: at(-3),
    }
  })
}

const SeatAdminPreview = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [events, setEvents] = useState(SEED)
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // 현황판이 서버로 가지 않게 배치·예약을 먼저 심는다(마운트 전 한 번)
  useState(() => {
    for (const e of SEED) {
      const detail: SeatEventDetail = { ...e, layout: LAYOUT, taken: [] }
      qc.setQueryData(seatKeys.detail(e.id), detail)
      qc.setQueryData(seatKeys.reservations(e.id), reservationsFor(e))
    }
    return null
  })

  const filtered = useMemo(() => filterSeatEvents(events, q), [events, q])

  return (
    <SeatDesk
      events={events}
      filtered={filtered}
      loading={false}
      searchTerm={q}
      onSearchChange={setQ}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onCreate={() => showToast('미리보기 — 새 행사 배치 편집기가 열려요', 'info')}
      onBack={() => navigate(-1)}
      editingId={null}
      renderBoard={(e) => <SeatBoard key={e.id} summary={e} />}
      onEdit={(e) => showToast(`미리보기 — '${e.title}' 배치 편집기가 열려요`, 'info')}
      onSetStatus={(e, status) =>
        setEvents((l) => l.map((x) => (x.id === e.id ? { ...x, status, is_booking_open: status === 'open' && x.is_booking_open } : x)))
      }
      onDelete={(e) => setEvents((l) => l.filter((x) => x.id !== e.id))}
      onCopyLink={(e) => showToast(`미리보기 — /seats/${e.id} 링크를 복사해요`, 'info')}
      onView={(e) => showToast(`미리보기 — /seats/${e.id} 로 가요`, 'info')}
    />
  )
}

export default SeatAdminPreview
