// 홈 "지금 함께 읽는 말씀" — 성도들이 지금 모여 있는 장으로 초대하는 카드
//
// "혼자 읽는 성경"이 아니라 "지금 이 시간, 우리 교회 성도들이 같은 본문 앞에 모여 있다"는
// 감각을 홈 첫 화면에서 주고, 그 흐름에 올라타게 한다.
//   1) 실시간: 지금 이 장을 N명이 읽고 있어요 → "함께 읽기"
//   2) 바닥:   (아무도 없을 때) 오늘 가장 많이 읽힌 장 → "나도 읽기"
//   3) 둘 다 없으면 렌더하지 않는다 — 빈 카드로 홈을 어지럽히지 않는다
//
// 숫자 문턱: 실시간 "1명"은 오히려 썰렁해 보여 2명부터 헤드라인으로 올린다(2026-09 결정).
// 오늘 바닥도 2명부터 — 1명은 그 사람이 나일 수 있어 초대가 아니라 독백이 된다.
// 갱신은 폴링이 아니라 SSE(useLiveReading 참고).
// 배경은 양들이 함께 성경을 펼친 목장 일러스트(라이트=낮 / 다크=등불 켠 밤) — LiveReadingCard.css.
import { useNavigate } from 'react-router-dom'
import { useBibleBooks } from '../../../hooks/useBible'
import { useLiveReading } from '../../../hooks/useLiveReading'
import { isAuthenticated } from '../../../utils/auth'
import { ChevronRightIcon, UsersIcon } from '../../../components/icons/ActionIcons'
import './LiveReadingCard.css'

/** 실시간 헤드라인으로 올리는 최소 인원 (나 제외) */
const LIVE_MIN = 2
/** 오늘 바닥으로 보여 주는 최소 독자 수 */
const TODAY_MIN = 2

const chapterLabel = (bookNumber: number, chapter: number) =>
  bookNumber === 19 ? `${chapter}편` : `${chapter}장`

const LiveReadingCard = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const { data } = useLiveReading(authed)
  const { data: books } = useBibleBooks()

  if (!data || !books?.length) return null

  const nameOf = (bookNumber: number) =>
    books.find((b) => b.book_number === bookNumber)?.book_name_ko ?? ''
  const titleOf = (bookNumber: number, chapter: number) =>
    `${nameOf(bookNumber)} ${chapterLabel(bookNumber, chapter)}`

  // 나를 뺀 인원으로 정렬 — 다른 탭에서 읽는 중인 나 혼자를 "지금 1명"으로 세지 않는다
  const live = data.live
    .map((c) => ({ ...c, others: Math.max(0, c.total - (c.me_included ? 1 : 0)) }))
    .filter((c) => c.others > 0)
    .sort((a, b) => b.others - a.others)
  const head = live[0]
  const isLive = !!head && head.others >= LIVE_MIN

  const today = data.today.find((t) => t.readers >= TODAY_MIN)
  if (!isLive && !today) return null

  const target = isLive ? head : today!
  const to = `/bible/${target.book_number}/${target.chapter}`
  const go = () => navigate(to)

  // 실시간 줄일 때도 오늘 숫자를 꼬리로 — 실시간 인원보다 클 때만(둘 다 방금 들어왔으면 모순)
  const todayTail = isLive && (head.readers_today ?? 0) > head.others ? head.readers_today : null
  const extras = isLive ? live.slice(1, 3) : []

  return (
    <section className="px-4 pt-3">
      <div
        role="link"
        tabIndex={0}
        onClick={go}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            go()
          }
        }}
        className={`live-card p-4 cursor-pointer ${isLive ? 'live-card--live' : ''}`}
        aria-label={`${titleOf(target.book_number, target.chapter)} 함께 읽기`}
      >
        <div className="flex items-center gap-1.5">
          {isLive ? <span className="live-card__dot" aria-hidden /> : (
            <span className="live-card__icon" aria-hidden><UsersIcon size={12} /></span>
          )}
          <span className="text-[11px] font-bold tracking-[0.08em] text-brand">
            {isLive ? '지금 함께 읽는 말씀' : '오늘 함께 읽은 말씀'}
          </span>
        </div>

        <div className="live-card__body mt-2">
          <div className="min-w-0">
            <h3 className="live-card__title">{titleOf(target.book_number, target.chapter)}</h3>
            <p className="live-card__lead">
              {isLive ? (
                <>
                  지금 <strong className="brand-text-gradient">{head.others}명</strong>이 이 장을 읽고 있어요
                  {todayTail !== null && <span className="live-card__tail"> · 오늘 {todayTail}명</span>}
                </>
              ) : (
                <>
                  오늘 <strong className="brand-text-gradient">{today!.readers}명</strong>의 성도가 이 말씀을 펼쳤어요
                </>
              )}
            </p>
          </div>
        </div>

        {extras.length > 0 && (
          <div className="live-card__extras" aria-label="함께 읽는 다른 장">
            {extras.map((c) => (
              <button
                key={`${c.book_number}:${c.chapter}`}
                type="button"
                className="live-card__chip"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/bible/${c.book_number}/${c.chapter}`)
                }}
              >
                {titleOf(c.book_number, c.chapter)}
                <span className="live-card__chip-n">{c.others}명</span>
              </button>
            ))}
          </div>
        )}

        <div className="live-card__foot flex items-center justify-between gap-2">
          <p className="live-card__sub">
            {isLive ? '함께 읽어보실래요?' : '오늘 성도들이 가장 많이 머문 자리예요'}
          </p>
          <span className="live-card__cta">
            {isLive ? '함께 읽기' : '나도 읽기'}
            <ChevronRightIcon size={14} />
          </span>
        </div>
      </div>
    </section>
  )
}

export default LiveReadingCard
