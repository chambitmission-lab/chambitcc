import { useEffect, useState } from 'react'
import type { ReflectionStreamEvent } from '../../../../api/bibleReflection'
import { ChevronRightIcon } from '../../../../components/icons/ActionIcons'
import { readingTogetherBus } from '../../../../utils/readingTogetherBus'

interface ReflectionLiveBannerProps {
  bookNumber: number
  chapter: number
  bookNameKo: string
  /** 배너를 탭하면 그 절의 묵상 시트를 연다 */
  onOpen: (verse: number) => void
}

const AUTO_HIDE_MS = 9000

/**
 * "지금 같은 장을 읽는 성도가 방금 묵상을 남겼어요" — 성경 → 묵상 → 사람 → 대화 연결의 순간.
 * 현재 보고 있는 장의 사건만 받는다. 하나만 띄우고 9초 뒤 사라진다(연속으로 오면 최신 것으로 교체).
 */
const ReflectionLiveBanner = ({ bookNumber, chapter, bookNameKo, onOpen }: ReflectionLiveBannerProps) => {
  const [event, setEvent] = useState<ReflectionStreamEvent | null>(null)

  useEffect(
    () =>
      readingTogetherBus.onReflection((ev) => {
        if (ev.book_number !== bookNumber || ev.chapter !== chapter) return
        setEvent(ev)
      }),
    [bookNumber, chapter],
  )

  useEffect(() => {
    if (!event) return
    const id = window.setTimeout(() => setEvent(null), AUTO_HIDE_MS)
    return () => window.clearTimeout(id)
  }, [event])

  if (!event) return null
  const initial = (event.actor_name || '성').slice(0, 1)
  return (
    <div
      className="rt-banner"
      role="status"
      onClick={() => {
        onOpen(event.verse)
        setEvent(null)
      }}
    >
      <span className="rt-banner__avatar" aria-hidden>{initial}</span>
      <div className="rt-banner__body">
        <div className="rt-banner__title">
          <strong>{event.actor_name}</strong>님이 {bookNameKo} {chapter}:{event.verse}에 묵상을 남겼어요
        </div>
        {event.preview && <div className="rt-banner__preview">{event.preview}</div>}
      </div>
      <span className="rt-banner__cta">
        보기 <ChevronRightIcon size={14} />
      </span>
    </div>
  )
}

export default ReflectionLiveBanner
