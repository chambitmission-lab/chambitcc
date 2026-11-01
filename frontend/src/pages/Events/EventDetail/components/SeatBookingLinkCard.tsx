// 일정 상세 → 좌석 예약 연동 카드
// 이 일정에 연결된 좌석 예약 행사가 있을 때만 보인다. 배치도는 비로그인도 둘러볼 수 있어 조회는 항상 한다.
import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeatEventsForEvent } from '../../../../hooks/useSeatEvents'

// 좌석 티켓 카드(seatUi + seat-ticket.css + 배치 유틸)는 연결된 행사가 있는 일정에서만 쓰인다 —
// 정적 import 면 모든 일정 상세 진입이 그 청크를 함께 내려받아 "자세히 보기" 전환이 그만큼 늦었다
const SeatEventCard = lazy(() =>
  import('../../../Seats/seatUi').then((m) => ({ default: m.SeatEventCard })),
)

interface SeatBookingLinkCardProps {
  eventId: number
}

export const SeatBookingLinkCard = ({ eventId }: SeatBookingLinkCardProps) => {
  const navigate = useNavigate()
  const { data: seatEvents } = useSeatEventsForEvent(eventId)
  if (!seatEvents?.length) return null

  return (
    <div className="flex flex-col gap-2">
      <Suspense fallback={null}>
        {seatEvents.map((e) => (
          <SeatEventCard key={e.id} event={e} compact={false} onOpen={() => navigate(`/seats/${e.id}`)} />
        ))}
      </Suspense>
    </div>
  )
}
