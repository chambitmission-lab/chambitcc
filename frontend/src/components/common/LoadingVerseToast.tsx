import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { getPendingRequestCount, subscribeRequestQueue } from '../../utils/requestPriority'
import { nextWaitingQuip, type WaitingQuip } from '../../utils/waitingQuips'
import './LoadingVerseToast.css'

/**
 * 전역 "불러오는 중" 말풍선 — 화면이 카드 하나씩 차례로 채워지는 동안(동시 요청 제한 큐가
 * 비어 있지 않은 동안) 바닥에 잠깐 떠서, 성경 속 기다림 한 줄을 보여 준다.
 *
 * - 큐가 SHOW_AFTER_MS 넘게 비지 않을 때만 뜬다(캐시 웜 진입처럼 금방 끝나면 안 보인다).
 * - 한 번 뜨면 MIN_VISIBLE_MS 는 머문다(깜빡이지 않게). 뜰 때마다 다음 문구.
 * - 고정 위치·pointer-events 없음이라 본문 레이아웃을 밀지 않는다.
 */
const SHOW_AFTER_MS = 450
const MIN_VISIBLE_MS = 1400

/** preview: dev 미리보기(/#/dev/loading-verse)용 — 큐와 무관하게 켜 둔다 */
const LoadingVerseToast = ({ preview = false }: { preview?: boolean }) => {
  const { language } = useLanguage()
  const queued = useSyncExternalStore(subscribeRequestQueue, getPendingRequestCount, () => 0)
  const pending = preview ? 1 : queued
  const [visible, setVisible] = useState(false)
  const [quip, setQuip] = useState<WaitingQuip | null>(null)
  const shownAtRef = useRef(0)

  useEffect(() => {
    if (pending > 0) {
      if (visible) return
      const t = setTimeout(() => {
        setQuip(nextWaitingQuip())
        shownAtRef.current = Date.now()
        setVisible(true)
      }, SHOW_AFTER_MS)
      return () => clearTimeout(t)
    }
    if (!visible) return
    const remain = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAtRef.current))
    const t = setTimeout(() => setVisible(false), remain)
    return () => clearTimeout(t)
  }, [pending, visible])

  if (!quip) return null
  const isKo = language === 'ko'

  return (
    <div className={`lvt${visible ? ' is-on' : ''}`} role="status" aria-live="polite" aria-hidden={!visible}>
      <div className="lvt__card">
        <span className="lvt__dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="lvt__body">
          <span className="lvt__label">{isKo ? '불러오는 중' : 'Loading'}</span>
          <span className="lvt__text">{isKo ? quip.ko : quip.en}</span>
          <span className="lvt__ref">{isKo ? quip.refKo : quip.refEn}</span>
        </span>
      </div>
    </div>
  )
}

export default LoadingVerseToast
