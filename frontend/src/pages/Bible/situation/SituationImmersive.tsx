import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSituationVerses } from '../../../hooks/useSituation'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { SituationCategory, SituationVerse } from '../../../types/situation'
import { empathyFor, toneForCategory } from './situationMoods'

// 숨 고르기는 한 세션에 한 번 — 급할 때 매번 3초씩 기다리게 하지 않는다
const BREATH_SEEN_KEY = 'sb-breath-seen'
const BREATH_MS = 3200
const CLOSE_MS = 420

const readBreathSeen = () => {
  try {
    return sessionStorage.getItem(BREATH_SEEN_KEY) === '1'
  } catch {
    return true
  }
}
const markBreathSeen = () => {
  try {
    sessionStorage.setItem(BREATH_SEEN_KEY, '1')
  } catch {
    /* 사파리 사생활 보호 모드 등 — 숨 고르기만 한 번 더 뜰 뿐 */
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export interface ImmersiveOrigin {
  x: number
  y: number
}

interface Props {
  category: SituationCategory
  /** 처음 펼칠 구절 위치 (오늘의 위로 말씀에서 들어오면 그 절부터) */
  startIndex?: number
  /** 누른 자리 — 거기서 색이 번지며 열린다. 없으면 화면 가운데 */
  origin?: ImmersiveOrigin | null
  /** 감정 타일로 들어왔을 때만 숨 고르기 */
  breathe?: boolean
  /** 말로 꺼내기로 들어왔으면 그 문장 — 첫 장에 따옴표로 되돌려 준다 */
  sentence?: string | null
  /** 끝 장면 '이런 마음도 있나요?' */
  related: SituationCategory[]
  /** 위에 공유 시트가 떠 있으면 키보드(←→·Esc)를 그쪽에 양보한다 */
  paused?: boolean
  onClose: () => void
  onSwitch: (cat: SituationCategory) => void
  onPray: (verse: SituationVerse) => void
  onShare: (verse: SituationVerse) => void
  onRead: (verse: SituationVerse) => void
}

const SituationImmersive = ({
  category,
  startIndex = 0,
  origin,
  breathe = false,
  sentence,
  related,
  paused = false,
  onClose,
  onSwitch,
  onPray,
  onShare,
  onRead,
}: Props) => {
  const { data, isLoading } = useSituationVerses(category.id)
  const verses = data?.verses ?? []
  const total = verses.length
  const [index, setIndex] = useState(startIndex)
  const [open, setOpen] = useState(false)
  const [breathing, setBreathing] = useState(() => breathe && !readBreathSeen() && !prefersReducedMotion())
  const closingRef = useRef(false)

  // 다음 프레임에 open — 0% 원에서 시작해야 번지는 전환이 보인다
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!breathing) return
    markBreathSeen()
    const t = window.setTimeout(() => setBreathing(false), BREATH_MS)
    return () => window.clearTimeout(t)
  }, [breathing])

  // 뒤 페이지 스크롤 잠금 (body 가 실제 스크롤러)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const close = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setOpen(false)
    window.setTimeout(onClose, prefersReducedMotion() ? 0 : CLOSE_MS)
  }, [onClose])

  useModalBackButton(close)

  const atEnd = total > 0 && index >= total
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, total)), [total])
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])

  useEffect(() => {
    if (paused) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setBreathing(false)
        next()
      } else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paused, close, next, prev])

  // 좌우 스와이프 — 탭 영역과 같은 방향(왼쪽으로 밀면 다음)
  const swipeX = useRef<number | null>(null)
  const swiped = useRef(false)
  const onPointerDown = (e: React.PointerEvent) => {
    swipeX.current = e.clientX
    swiped.current = false
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (swipeX.current == null) return
    const dx = e.clientX - swipeX.current
    swipeX.current = null
    if (Math.abs(dx) < 50) return
    swiped.current = true
    if (dx < 0) next()
    else prev()
  }
  const tap = (fn: () => void) => () => {
    if (swiped.current) {
      swiped.current = false
      return
    }
    fn()
  }

  const verse = !atEnd ? verses[index] : undefined
  const lead = verse?.message?.trim() || (index === 0 ? empathyFor(category.name) : '')
  const tone = toneForCategory(category.name)
  const words = verse ? verse.text.split(/\s+/) : []

  const style = {
    '--sbi-x': origin ? `${origin.x}px` : '50%',
    '--sbi-y': origin ? `${origin.y}px` : '50%',
  } as React.CSSProperties

  return createPortal(
    <div
      className={`sbi sb-tone--${tone}${open ? ' is-open' : ''}`}
      style={style}
      role="dialog"
      aria-modal="true"
      aria-label={`${category.name} 말씀`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="sbi__col">
        {/* 진행 막대 — 구절 수 + 끝 장면 1칸 */}
        <div className="sbi__bars" aria-hidden="true">
          {Array.from({ length: Math.max(total, 1) + 1 }, (_, i) => (
            <i key={i} className={i < index ? 'is-done' : i === index ? 'is-cur' : ''} />
          ))}
        </div>

        <div className="sbi__head">
          <span className="sbi__tag">{category.name}</span>
          <button type="button" className="sbi__icon-btn" onClick={close} aria-label="닫기">
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="sbi__body">
          {breathing ? (
            <div className="sbi__breath">
              <span className="sbi__breath-orb" aria-hidden="true" />
              <p>잠시, 숨을 고르세요</p>
              <button type="button" onClick={() => setBreathing(false)}>
                바로 볼게요
              </button>
            </div>
          ) : isLoading ? (
            <div className="sbi__loading" aria-label="말씀을 불러오는 중">
              <span />
              <span />
              <span />
            </div>
          ) : total === 0 ? (
            <div className="sbi__end">
              <h3>아직 이 마음에 담긴 말씀이 없어요</h3>
              <p>다른 마음을 골라 보시겠어요?</p>
              <div className="sbi__cta">
                <button type="button" className="is-primary" onClick={close}>
                  돌아가기
                </button>
              </div>
            </div>
          ) : atEnd ? (
            <div className="sbi__end">
              <h3>
                이 마음을
                <br />
                기도로 남겨 볼까요?
              </h3>
              <p>마지막으로 읽은 말씀이 기도 제목에 함께 담겨요.</p>
              <div className="sbi__cta">
                <button type="button" className="is-primary" onClick={() => onPray(verses[total - 1])}>
                  <span className="material-icons-round">favorite</span>
                  기도로 이어가기
                </button>
                <button type="button" onClick={() => setIndex(0)}>
                  처음부터 다시 읽기
                </button>
              </div>
              {related.length > 0 && (
                <div className="sbi__related">
                  <span>이런 마음도 있나요?</span>
                  <div>
                    {related.map((c) => (
                      <button key={c.id} type="button" onClick={() => onSwitch(c)}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            verse && (
              <>
                {/* 탭 영역 — 왼쪽 1/3 이전, 나머지 다음 (스토리와 같은 손버릇) */}
                <div className="sbi__tap" aria-hidden="true">
                  <button type="button" tabIndex={-1} onClick={tap(prev)} />
                  <button type="button" tabIndex={-1} onClick={tap(next)} />
                </div>
                <div className="sbi__slide" key={`${category.id}-${index}`}>
                  {index === 0 && sentence && <p className="sbi__said">“{sentence}”</p>}
                  {lead && <p className="sbi__lead">{lead}</p>}
                  <p className="sbi__verse">
                    {words.map((w, i) => (
                      <span key={i} style={{ animationDelay: `${Math.min(i * 45, 1500)}ms` }}>
                        {w}{' '}
                      </span>
                    ))}
                  </p>
                  <p className="sbi__ref">
                    {verse.book_name_ko} {verse.chapter}:{verse.verse}
                    <span>
                      {index + 1} / {total}
                    </span>
                  </p>
                </div>
              </>
            )
          )}
        </div>

        {verse && !breathing && (
          <div className="sbi__actions">
            <button type="button" onClick={() => onPray(verse)}>
              <span className="material-icons-round">favorite_border</span>
              기도하기
            </button>
            <button type="button" onClick={() => onShare(verse)}>
              <span className="material-icons-round">ios_share</span>
              보내기
            </button>
            <button type="button" onClick={() => onRead(verse)}>
              <span className="material-icons-round">menu_book</span>
              본문 보기
            </button>
            <button type="button" className="is-next" onClick={next} aria-label="다음 말씀">
              <span className="material-icons-round">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default SituationImmersive
