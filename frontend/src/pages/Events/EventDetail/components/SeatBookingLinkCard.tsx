// 일정 상세 → 좌석 예약 연동 카드
// 이 일정에 연결된 좌석 예약 행사가 있을 때만 보인다. 배치도는 비로그인도 둘러볼 수 있어 조회는 항상 한다.
import { useNavigate } from 'react-router-dom'
import { useSeatEventsForEvent } from '../../../../hooks/useSeatEvents'
import { SeatEventCard } from '../../../Seats/seatUi'

interface SeatBookingLinkCardProps {
  eventId: number
}

export const SeatBookingLinkCard = ({ eventId }: SeatBookingLinkCardProps) => {
  const navigate = useNavigate()
  const { data: seatEvents } = useSeatEventsForEvent(eventId)
  if (!seatEvents?.length) return null

  return (
    <div className="flex flex-col gap-2">
      {seatEvents.map((e) => (
        <SeatEventCard key={e.id} event={e} compact={false} onOpen={() => navigate(`/seats/${e.id}`)} />
      ))}
    </div>
  )
}
