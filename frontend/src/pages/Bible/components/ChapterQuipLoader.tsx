import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { WAITING_QUIPS } from '../../../utils/waitingQuips'
import { CHAPTER_SCENES, type ChapterScene } from './chapterLoaderScenes'
import '../styles/chapter-quip-loader.css'

/* 장 본문 첫 로딩 — 풍경 장면 + 성경 속 "기다림" 한 줄 유머 카드.
 * 장 로딩은 길어야 1초라 장면은 한 번에 하나(들어올 때마다 다음 장면), 5초를 넘길 때만 넘어간다.
 * 400ms 안에 본문이 오면 아예 그리지 않는다 — CSS 지연 대신 마운트를 늦춰
 * 장면 애니메이션(해 뜨기·별 켜지기 등)이 안 보이는 동안 흘러가 버리지 않게 한다.
 * 카드를 탭해도 다음 장면으로 넘어간다(안내 없이 숨은 재미). */

const SHOW_AFTER_MS = 400
const NEXT_AFTER_MS = 5000
const STORAGE_KEY = 'chambit:chapter-scene'

/* 등장마다 다음 장면 — 저장소가 막혀도 무작위로 하나는 돌려준다 */
const nextSceneIndex = (): number => {
  try {
    const prev = Number(localStorage.getItem(STORAGE_KEY))
    const index = Number.isFinite(prev) ? (prev + 1) % CHAPTER_SCENES.length : 0
    localStorage.setItem(STORAGE_KEY, String(index))
    return index
  } catch {
    return Math.floor(Math.random() * CHAPTER_SCENES.length)
  }
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/* 우상단 큰 숫자 — 0부터 이징으로 올라간다 */
const CountUp = ({ to }: { to: number }) => {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      el.textContent = String(to)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - t0 - 300) / 700))
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to])
  return <span ref={ref}>0</span>
}

const SceneCard = ({ scene, turn, onNext }: { scene: ChapterScene; turn: number; onNext: () => void }) => {
  const { language } = useLanguage()
  const isKo = language === 'ko'
  // 그라데이션·필터 id 충돌 방지 — useId 의 콜론은 url(#…) 에서 깨질 수 있어 걸러 낸다
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '') + turn
  const svg = useMemo(() => scene.svg(uid), [scene, uid])
  const quip = WAITING_QUIPS.find(q => q.refKo === scene.refKo)
  const text = quip ? (isKo ? quip.ko : quip.en) : ''
  const ref = quip ? (isKo ? quip.refKo : quip.refEn) : scene.refKo

  return (
    <div className="cql-card" onClick={onNext} aria-hidden>
      <div className="cql-scene">
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <span className="cql-chip">{isKo ? scene.chipKo : scene.chipEn}</span>
        {scene.big != null && (
          <span className="cql-big">
            <CountUp to={scene.big} />
            <small>{isKo ? scene.unitKo : scene.unitEn}</small>
          </span>
        )}
      </div>
      <div className="cql-text">
        <span className="cql-label">
          {isKo ? '말씀을 펼치는 중' : 'Opening the Word'}
          <span className="cql-dots"><i /><i /><i /></span>
        </span>
        <p className="cql-quip">
          {text.split(' ').map((w, i) => (
            <span key={i}>
              {i > 0 && ' '}
              <span className="cql-w" style={{ '--i': i } as React.CSSProperties}>{w}</span>
            </span>
          ))}
        </p>
        <span className="cql-ref">{ref}</span>
      </div>
    </div>
  )
}

const ChapterQuipLoader = () => {
  const { language } = useLanguage()
  const [visible, setVisible] = useState(false)
  const [index, setIndex] = useState(-1)
  const [turn, setTurn] = useState(0)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setIndex(nextSceneIndex())
      setVisible(true)
    }, SHOW_AFTER_MS)
    return () => window.clearTimeout(id)
  }, [])

  const advance = useCallback(() => {
    setIndex(nextSceneIndex())
    setTurn(n => n + 1)
  }, [])

  // 느린 연결에서만 다음 장면 — 탭으로 넘긴 뒤엔 타이머를 새로 건다
  useEffect(() => {
    if (!visible || prefersReducedMotion()) return
    const id = window.setTimeout(advance, NEXT_AFTER_MS)
    return () => window.clearTimeout(id)
  }, [visible, turn, advance])

  return (
    <div className="cql" role="status" aria-live="polite">
      <span className="cql-sr">{language === 'ko' ? '말씀을 불러오는 중' : 'Loading the chapter'}</span>
      {visible && index >= 0 && (
        <SceneCard key={turn} scene={CHAPTER_SCENES[index]} turn={turn} onNext={advance} />
      )}
    </div>
  )
}

export default ChapterQuipLoader
