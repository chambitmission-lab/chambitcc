// 이번 주 말씀과 동행하기 — 본문 읽기 → 설교 듣기 → 한 줄 붙잡기
// 1·2단계는 기기 편의 기록(localStorage), 3단계 '한 줄'만 서버에 남아 지난 편지 위에 손글씨로 다시 보인다.
// 한 줄은 '목사님께 이름 없이 전하기'를 켜면 /pastor 설교의 메아리에 이름 없이 모인다.
// 목사님이 나눔 질문을 공개하면 맨 아래에 함께 나눌 질문이 붙는다.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Sermon } from '../../../types/sermon'
import { useSermonTakeaways } from '../../../hooks/useSermonTakeaways'
import { useSermonPassage } from '../hooks/useSermonPassage'
import SermonTakeawayEditor from './SermonTakeawayEditor'
import { formatReference, parseBibleReference } from '../utils/sermonMeta'
import { primaryMedia, readWalk, writeWalk, type WalkState } from '../utils/sermonLetter'
import SermonDiscussionBlock from './SermonDiscussionBlock'
import SermonWeekPackBlock from './SermonWeekPackBlock'

interface SermonWalkProps {
  sermon: Sermon
  /** 히어로 '본문 읽기'를 누를 때마다 올라간다 — 1단계를 펼친다 */
  passageSignal: number
  onOpen: (media: 'audio' | 'video' | null) => void
}

const StepNumber = ({ n, done }: { n: number; done: boolean }) => (
  <span className="sl-step-n" aria-hidden>
    {done ? <span className="material-icons-outlined">check</span> : n}
  </span>
)

const SermonWalk = ({ sermon, passageSignal, onOpen }: SermonWalkProps) => {
  const parsed = useMemo(() => parseBibleReference(sermon.bible_verse), [sermon.bible_verse])
  const [walk, setWalk] = useState<WalkState>(() => readWalk(sermon.id))
  const [passageOpen, setPassageOpen] = useState(false)

  // 히어로 '본문 읽기' 신호가 바뀌면 1단계를 펼친다 (렌더 중 조정 — 설교가 바뀌면 부모가 key 로 새로 그린다)
  const [seenSignal, setSeenSignal] = useState(passageSignal)
  if (passageSignal !== seenSignal) {
    setSeenSignal(passageSignal)
    setPassageOpen(true)
  }

  const mark = (patch: Partial<WalkState>) => {
    setWalk((prev) => {
      const next = { ...prev, ...patch }
      writeWalk(sermon.id, next)
      return next
    })
  }

  // 본문 — 장 전체를 받아 범위만 자른다(성경 화면과 같은 캐시 칸)
  const { verses: passage, isLoading: chapterLoading } = useSermonPassage(parsed, passageOpen)
  const verseCount = parsed?.verse != null ? (parsed.verseEnd ?? parsed.verse) - parsed.verse + 1 : null

  // 한 줄 붙잡기 — 완료 표시에만 쓴다(쓰기 칸은 SermonTakeawayEditor)
  const { bySermon } = useSermonTakeaways()
  const saved = bySermon.get(sermon.id)

  const media = primaryMedia(sermon)
  const doneCount = [walk.read, walk.watch, !!saved].filter(Boolean).length

  return (
    <section id="sermon-walk" className="sl-walk feed-card scroll-mt-20">
      <header className="sl-walk-head">
        <b>이번 주 말씀과 동행하기</b>
        <span>{doneCount} / 3</span>
      </header>

      {/* 1. 본문 읽기 */}
      {parsed?.bookNumber != null && (
        <div className={`sl-step${walk.read ? ' is-done' : ''}`}>
          <StepNumber n={1} done={walk.read} />
          <div className="sl-step-body">
            <p className="sl-step-title">
              본문 읽기{verseCount ? <small>{verseCount}절</small> : null}
            </p>
            <p className="sl-step-desc">설교 전에, 혹은 다시 한번 — 오늘의 말씀을 눈으로 먼저</p>
            <div className="sl-step-actions">
              <button type="button" className="sl-btn" onClick={() => setPassageOpen((o) => !o)}>
                <span className="material-icons-outlined">menu_book</span>
                {passageOpen ? '접기' : `${formatReference(parsed)} 펼치기`}
              </button>
            </div>
            {passageOpen && (
              <div className="sl-passage">
                {chapterLoading ? (
                  <p className="sl-passage-loading">본문을 펼치는 중…</p>
                ) : (
                  <p>
                    {passage.map((v) => (
                      <span key={v.id} className="sl-verse">
                        <sup>{v.verse_label || v.verse}</sup>
                        <span>{v.text} </span>
                      </span>
                    ))}
                  </p>
                )}
                <div className="sl-step-actions">
                  {!walk.read && (
                    <button
                      type="button"
                      className="sl-btn sl-btn--solid"
                      onClick={() => {
                        mark({ read: true })
                        setPassageOpen(false)
                      }}
                    >
                      <span className="material-icons-outlined">check</span>다 읽었어요
                    </button>
                  )}
                  <Link
                    className="sl-btn sl-btn--plain"
                    to={`/bible/${parsed.bookNumber}/${parsed.chapter}${parsed.verse ? `?verse=${parsed.verse}` : ''}`}
                  >
                    성경에서 이어 읽기
                    <span className="material-icons-outlined">arrow_forward</span>
                  </Link>
                  {/* 마음에 남은 절을 골라 카드로 — 한 주 동안 단톡방·프로필로 말씀이 이어지게 */}
                  <Link
                    className="sl-btn sl-btn--plain"
                    to="/bible/photo-verse"
                    state={{ sermonPassage: { ref: sermon.bible_verse, title: sermon.title } }}
                  >
                    말씀 카드로 담기
                    <span className="material-icons-outlined">photo_filter</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 설교 듣기 */}
      <div className={`sl-step${walk.watch ? ' is-done' : ''}`}>
        <StepNumber n={parsed?.bookNumber != null ? 2 : 1} done={walk.watch} />
        <div className="sl-step-body">
          <p className="sl-step-title">
            설교 듣기<small>{sermon.pastor}</small>
          </p>
          <div className="sl-step-actions">
            <button
              type="button"
              className="sl-btn"
              onClick={() => {
                mark({ watch: true })
                onOpen(media)
              }}
            >
              <span className="material-icons-outlined">
                {media === 'video' ? 'play_arrow' : media === 'audio' ? 'headphones' : 'menu_book'}
              </span>
              {media === 'video' ? '설교 영상 보기' : media === 'audio' ? '음성으로 듣기' : '설교 전문 읽기'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. 한 줄 붙잡기 */}
      <div className={`sl-step${saved ? ' is-done' : ''}`}>
        <StepNumber n={parsed?.bookNumber != null ? 3 : 2} done={!!saved} />
        <div className="sl-step-body">
          <p className="sl-step-title">한 줄 붙잡기</p>
          <p className="sl-step-desc">말씀 중 마음에 남은 한 문장을 적어 두면, 지난 편지 위에 손글씨로 남아요</p>

          <SermonTakeawayEditor sermonId={sermon.id} />
        </div>
      </div>

      <SermonDiscussionBlock sermon={sermon} />
      <SermonWeekPackBlock sermon={sermon} />
    </section>
  )
}

export default SermonWalk
