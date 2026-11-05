import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ALL_EPISODES, STORY_ACTS, TOTAL_EPISODES } from './data'
import { hasCelebrated, markCelebrated } from './storyProgress'
import { storyImage, storyThumb } from './storyImages'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { ArrowRight } from '../../../components/icons/phosphor'
import './StoryFinale.css'

/**
 * 처음 만나는 성경 — 완주 히어로.
 *
 * 1) 처음 완주했을 때 한 번만 '추억 상영' — 10막이 화면 가득 한 장씩 지나간다(켄 번스 + 스토리 막대).
 * 2) 상영이 끝나면(또는 건너뛰면) '42칸 벽화' — 직접 읽은 42화 그림이 1→42 순서로 켜지며 카드를 채운다.
 *    칸을 누르면 그 화 그림을 크게 보는 라이트박스가 열리고, 거기서 다시 읽기로 이어진다.
 * 예전 인장+숫자 3칸+컨페티는 이 상영회가 대신한다.
 */

// 막마다 상영회에 걸 대표 장면 — 그 막을 한 장으로 기억하게 하는 그림
const ACT_KEY_SCENE: Record<number, string> = {
  1: 'creation',
  2: 'abraham',
  3: 'exodus',
  4: 'david',
  5: 'elijah',
  6: 'silence',
  7: 'nativity',
  8: 'resurrection',
  9: 'pentecost',
  10: 'newheaven',
}

const SLIDE_MS = 4200
const SLIDE_MS_REDUCED = 2600

const EP_ACT = new Map(
  STORY_ACTS.flatMap(a => a.episodes.map(e => [e.id, a] as const)),
)

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

const StoryFinale = () => {
  // 처음 완주한 순간에만 상영회, 그 뒤로는 벽화부터. hasCelebrated 는 예전 컨페티와 같은 1회 플래그
  const [mode, setMode] = useState<'reel' | 'wall'>(() => (hasCelebrated() ? 'wall' : 'reel'))
  const [peek, setPeek] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    if (mode === 'reel') markCelebrated()
  }, [mode])

  return (
    <div className="sf">
      {mode === 'reel' ? (
        <FinaleReel onEnd={() => setMode('wall')} />
      ) : (
        <FinaleWall
          peek={peek}
          onPeek={setPeek}
          onReplay={() => {
            setPeek(false)
            setMode('reel')
          }}
          onOpen={setOpenIndex}
        />
      )}
      {openIndex !== null && (
        <SceneLightbox index={openIndex} onIndex={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </div>
  )
}

/* ── 추억 상영 ───────────────────────────────────────── */

const FinaleReel = ({ onEnd }: { onEnd: () => void }) => {
  const [i, setI] = useState(0)
  const [reduced] = useState(prefersReducedMotion)
  const last = STORY_ACTS.length - 1

  useEffect(() => {
    const t = window.setTimeout(() => (i >= last ? onEnd() : setI(i + 1)), reduced ? SLIDE_MS_REDUCED : SLIDE_MS)
    return () => window.clearTimeout(t)
  }, [i, last, onEnd, reduced])

  const act = STORY_ACTS[i]

  return (
    <section
      className="sf-reel"
      aria-roledescription="슬라이드쇼"
      aria-label="처음 만나는 성경 10막 돌아보기"
      style={{ ['--sf-slide-ms' as string]: `${reduced ? SLIDE_MS_REDUCED : SLIDE_MS}ms` }}
    >
      {STORY_ACTS.map((a, k) => {
        const src = storyImage(ACT_KEY_SCENE[a.act])
        return (
          <div key={a.act} className={`sf-reel__slide ${k === i ? 'is-on' : ''}`} aria-hidden={k !== i}>
            {src && <img src={src} alt="" decoding="async" loading={k <= 1 ? 'eager' : 'lazy'} />}
          </div>
        )
      })}

      <div className="sf-reel__bars" aria-hidden>
        {STORY_ACTS.map((a, k) => (
          <i key={a.act} className={k < i ? 'is-done' : k === i ? 'is-cur' : ''}>
            {/* key 를 막 번호와 같이 바꿔 진행 막대 애니메이션을 매번 처음부터 다시 돈다 */}
            <b key={k === i ? `cur-${i}` : 'idle'} />
          </i>
        ))}
      </div>

      <div className="sf-reel__txt" aria-live="polite">
        <div className="sf-reel__no">{String(act.act).padStart(2, '0')}막</div>
        <div className="sf-reel__act">{act.title}</div>
        <div className="sf-reel__eps">
          {act.episodes.map(e => (
            <span key={e.id}>{e.title}</span>
          ))}
        </div>
      </div>

      <div className="sf-reel__tap">
        <button type="button" aria-label="이전 막" onClick={() => setI(Math.max(0, i - 1))} />
        <button type="button" aria-label="다음 막" onClick={() => (i >= last ? onEnd() : setI(i + 1))} />
      </div>
      <button type="button" className="sf-reel__skip" onClick={onEnd}>
        건너뛰기
        <span className="material-icons-round" aria-hidden>skip_next</span>
      </button>
    </section>
  )
}

/* ── 42칸 벽화 ───────────────────────────────────────── */

interface WallProps {
  peek: boolean
  onPeek: (v: boolean) => void
  onReplay: () => void
  onOpen: (index: number) => void
}

const FinaleWall = ({ peek, onPeek, onReplay, onOpen }: WallProps) => {
  const navigate = useNavigate()
  return (
    <section className={`sf-wall ${peek ? 'is-peek' : ''}`} aria-label="완주 벽화 — 42화 장면">
      <div className="sf-wall__grid">
        {ALL_EPISODES.map((ep, k) => {
          const src = storyThumb(ep.id)
          return (
            <button
              key={ep.id}
              type="button"
              className="sf-wall__tile"
              style={{ animationDelay: `${k * 28}ms` }}
              onClick={() => onOpen(k)}
              aria-label={`${k + 1}화 ${ep.title} 크게 보기`}
              // 글이 덮고 있을 땐 칸이 키보드 순서에 끼지 않게 한다 — 둘러보기에서만 탭으로 돈다
              tabIndex={peek ? 0 : -1}
            >
              {src && <img src={src} alt="" decoding="async" loading="lazy" />}
              <span className="sf-wall__no">{k + 1}</span>
            </button>
          )
        })}
      </div>

      <div className="sf-wall__over">
        <span className="sf-wall__eye">처음 만나는 성경 · 완주</span>
        <h3 className="sf-wall__title">
          마흔두 장면이
          <br />
          한 이야기가 됐어요
        </h3>
        <p className="sf-wall__text">
          창조에서 새 창조까지, 직접 읽은 {TOTAL_EPISODES}화로 채운 벽이에요. 이제 진짜 말씀 속으로 떠날 차례입니다.
        </p>
        <div className="sf-wall__row">
          <button type="button" className="sf-btn sf-btn--light" onClick={() => navigate('/bible/plans')}>
            진짜 성경으로 떠나기
            <ArrowRight size={16} weight="bold" />
          </button>
          <button type="button" className="sf-btn sf-btn--glass" onClick={() => onPeek(true)}>
            <span className="material-icons-round" aria-hidden>grid_view</span>
            벽화 둘러보기
          </button>
        </div>
        <button type="button" className="sf-wall__replay" onClick={onReplay}>
          <span className="material-icons-round" aria-hidden>replay</span>
          10막 다시 상영
        </button>
      </div>

      {peek && (
        <div className="sf-wall__peekbar">
          <span>장면을 누르면 크게 볼 수 있어요</span>
          <button type="button" onClick={() => onPeek(false)}>
            <span className="material-icons-round" aria-hidden>close</span>
            닫기
          </button>
        </div>
      )}
    </section>
  )
}

/* ── 크게 보기 ───────────────────────────────────────── */

interface LightboxProps {
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}

const SceneLightbox = ({ index, onIndex, onClose }: LightboxProps) => {
  const navigate = useNavigate()
  useModalBackButton(onClose)
  const touchX = useRef<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const ep = ALL_EPISODES[index]
  const act = EP_ACT.get(ep.id)
  const src = storyImage(ep.id)
  const hasPrev = index > 0
  const hasNext = index < ALL_EPISODES.length - 1

  const step = useCallback(
    (d: number) => {
      const n = index + d
      if (n >= 0 && n < ALL_EPISODES.length) onIndex(n)
    },
    [index, onIndex],
  )

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'ArrowRight') step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, step])

  // 다음·이전 장면 원본을 미리 받아 넘길 때 빈 화면이 비치지 않게 한다
  useEffect(() => {
    for (const k of [index - 1, index + 1]) {
      const id = ALL_EPISODES[k]?.id
      const url = id ? storyImage(id) : undefined
      if (url) new Image().src = url
    }
  }, [index])

  // 열린 동안 뒤 페이지 스크롤을 잠근다
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return createPortal(
    <div
      className="sf-lb"
      role="dialog"
      aria-modal="true"
      aria-label={`${index + 1}화 ${ep.title}`}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="sf-lb__panel pc-scale-sheet"
        onTouchStart={e => {
          touchX.current = e.touches[0].clientX
        }}
        onTouchEnd={e => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
        }}
      >
        <div className="sf-lb__figure">
          {/* key 로 장면이 바뀔 때마다 살짝 페이드인 */}
          {src && <img key={ep.id} src={src} alt={ep.title} decoding="async" />}
          <span className="sf-lb__count">
            {index + 1} / {TOTAL_EPISODES}
          </span>
          <button ref={closeRef} type="button" className="sf-lb__close" onClick={onClose} aria-label="닫기">
            <span className="material-icons-round" aria-hidden>close</span>
          </button>
          {hasPrev && (
            <button type="button" className="sf-lb__nav sf-lb__nav--prev" onClick={() => step(-1)} aria-label="이전 장면">
              <span className="material-icons-round" aria-hidden>chevron_left</span>
            </button>
          )}
          {hasNext && (
            <button type="button" className="sf-lb__nav sf-lb__nav--next" onClick={() => step(1)} aria-label="다음 장면">
              <span className="material-icons-round" aria-hidden>chevron_right</span>
            </button>
          )}
        </div>
        <div className="sf-lb__body">
          {act && (
            <span className="sf-lb__act">
              {act.act}막 · {act.title} · {index + 1}화
            </span>
          )}
          <h4 className="sf-lb__title">{ep.title}</h4>
          <p className="sf-lb__hook">{ep.hook}</p>
          <button
            type="button"
            className="sf-btn sf-btn--brand sf-lb__read"
            // 모달이 쌓아 둔 히스토리 엔트리를 화 주소로 바꿔 끼운다(replace) — 그래야 화에서
            // 뒤로가기 한 번에 여정 맵으로 돌아온다. 화면이 바뀌며 모달은 저절로 내려간다
            onClick={() => navigate(`/bible/story/${ep.id}`, { replace: true })}
          >
            <span className="material-icons-round" aria-hidden>auto_stories</span>
            이 이야기 다시 읽기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default StoryFinale
