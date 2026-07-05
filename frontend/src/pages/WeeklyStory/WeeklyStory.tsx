import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  WeeklyAINarrative,
  WeeklyAnswered,
  WeeklyDayCard,
  WeeklyEmotionShift,
  WeeklyHighlight,
  WeeklyHook,
  WeeklyPrayerSummary,
  WeeklyStoryData,
} from '../../types/weeklyStory'
import { useWeeklyStory } from '../../hooks/useWeeklyStory'
import { useSfx } from '../../hooks/useSfx'
import './WeeklyStory.css'

type CardKind =
  | { kind: 'hook'; data: WeeklyHook }
  | { kind: 'day'; data: WeeklyDayCard }
  | { kind: 'emotion'; data: WeeklyEmotionShift }
  | { kind: 'highlight'; data: WeeklyHighlight }
  | { kind: 'answered'; data: WeeklyAnswered }
  | { kind: 'ai'; data: WeeklyAINarrative }
  | { kind: 'empty' }

const CARD_DURATION_MS: Record<CardKind['kind'], number> = {
  hook: 5000,
  day: 6500,
  emotion: 6500,
  highlight: 6000,
  answered: 6500,
  ai: 8000,
  empty: 5000,
}

const buildCards = (story: WeeklyStoryData): CardKind[] => {
  if (!story.has_activity) {
    return [{ kind: 'empty' }, { kind: 'ai', data: story.ai_narrative }]
  }
  const cards: CardKind[] = [{ kind: 'hook', data: story.hook }]
  for (const d of story.days) cards.push({ kind: 'day', data: d })
  if (story.emotion_shift && story.emotion_shift.distribution.length > 0) {
    cards.push({ kind: 'emotion', data: story.emotion_shift })
  }
  if (story.highlight) cards.push({ kind: 'highlight', data: story.highlight })
  if (story.answered) cards.push({ kind: 'answered', data: story.answered })
  cards.push({ kind: 'ai', data: story.ai_narrative })
  return cards
}

/** 카드 전환 시 한 번씩 터지는 별빛 버스트 (key 교체로 매 장마다 재생) */
const SPARK_GLYPHS = ['✦', '✧', '✨', '⋆']
const SparkleBurst = () => (
  <div className="ws-spark-burst" aria-hidden="true">
    {Array.from({ length: 10 }).map((_, i) => (
      <span
        key={i}
        className="ws-spark"
        style={{
          left: `${(11 + i * 37) % 90}%`,
          top: `${(12 + i * 53) % 72}%`,
          fontSize: `${11 + (i % 3) * 5}px`,
          animationDelay: `${(i % 5) * 0.07}s`,
        }}
      >
        {SPARK_GLYPHS[i % SPARK_GLYPHS.length]}
      </span>
    ))}
  </div>
)

const EMOJI_BY_EMOTION: Record<string, string> = {
  tired: '😮‍💨',
  anxious: '😟',
  grateful: '🙏',
  sad: '😢',
  lonely: '🥺',
  angry: '😠',
  hopeful: '🌱',
  confused: '😵‍💫',
}

export default function WeeklyStory() {
  const navigate = useNavigate()
  const sfx = useSfx()
  const { data, isLoading, error } = useWeeklyStory()
  const story: WeeklyStoryData | null = data?.data ?? null
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const startTimeRef = useRef<number>(Date.now())
  const elapsedBeforePauseRef = useRef<number>(0)

  const cards = useMemo<CardKind[]>(
    () => (story ? buildCards(story) : []),
    [story],
  )

  const currentCard = cards[index]
  const duration = currentCard ? CARD_DURATION_MS[currentCard.kind] : 5000

  // 자동 진행 타이머
  useEffect(() => {
    if (!currentCard || paused) return
    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current
    const remaining = Math.max(200, duration - elapsedBeforePauseRef.current)
    const timer = window.setTimeout(() => {
      goNext()
    }, remaining)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, currentCard])

  // 카드 전환 시 사운드
  useEffect(() => {
    if (!currentCard) return
    elapsedBeforePauseRef.current = 0
    if (currentCard.kind === 'answered') sfx.play('correct')
    else if (currentCard.kind === 'ai') sfx.play('milestone')
    else sfx.play('select')
  }, [index, currentCard, sfx])

  const goNext = () => {
    setIndex((i) => {
      if (i >= cards.length - 1) {
        sfx.play('fanfare')
        navigate(-1)
        return i
      }
      return i + 1
    })
  }
  const goPrev = () => {
    setIndex((i) => Math.max(0, i - 1))
  }

  const close = () => {
    sfx.play('click')
    navigate(-1)
  }

  // 키보드
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length])

  // 터치 스와이프
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    touchRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: Date.now(),
    }
    pause()
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchRef.current
    touchRef.current = null
    resume()
    if (!start) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = Math.abs(e.changedTouches[0].clientY - start.y)
    if (Math.abs(dx) > 50 && dy < 80) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }
  const pause = () => {
    if (paused) return
    elapsedBeforePauseRef.current = Date.now() - startTimeRef.current
    setPaused(true)
  }
  const resume = () => {
    if (!paused) return
    setPaused(false)
  }

  if (isLoading) {
    return (
      <div className="ws-root">
        <div className="ws-status">
          <div className="ws-spinner" />
          <span>이번 주 이야기를 모으고 있어요…</span>
        </div>
      </div>
    )
  }

  if (error || !story) {
    const message =
      error instanceof Error ? error.message : '데이터가 없어요'
    return (
      <div className="ws-root">
        <div className="ws-status">
          <span>😔 {message}</span>
          <button className="ws-retry-btn" onClick={close}>
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="ws-root"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={pause}
      onMouseUp={resume}
      onMouseLeave={resume}
    >
      <div className="ws-progress-bar">
        {cards.map((_, i) => {
          let cls = 'ws-progress-fill'
          if (i < index) cls += ' ws-pf-done'
          else if (i === index) {
            cls += ' ws-pf-active'
            if (paused) cls += ' ws-pf-paused'
          }
          return (
            <div key={i} className="ws-progress-track">
              <div
                className={cls}
                style={{
                  ['--ws-duration' as string]: `${duration}ms`,
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="ws-header">
        <div className="ws-header-title">
          <span>📖</span>
          <span>주간 기도 스토리</span>
        </div>
        <button className="ws-close-btn" onClick={close} aria-label="닫기">
          ✕
        </button>
      </div>

      <div className="ws-card-area">
        {cards.map((card, i) => (
          <CardView
            key={i}
            card={card}
            isActive={i === index}
            weekRange={`${story.week_start} – ${story.week_end}`}
          />
        ))}

        {/* index가 바뀔 때마다 remount되어 버스트가 한 번씩 재생됨 */}
        <SparkleBurst key={index} />

        <div className="ws-tap-zones">
          <button
            type="button"
            className="ws-tap-prev"
            onClick={goPrev}
            aria-label="이전"
          />
          <button
            type="button"
            className="ws-tap-next"
            onClick={goNext}
            aria-label="다음"
          />
        </div>

        <div className="ws-footer">
          <span>{index + 1} / {cards.length}</span>
          <span>{story.week_start.replace(/-/g, '.').slice(5)} – {story.week_end.replace(/-/g, '.').slice(5)}</span>
        </div>
      </div>
    </div>
  )
}

interface CardProps {
  card: CardKind
  isActive: boolean
  weekRange: string
}

const CardView = ({ card, isActive, weekRange: _weekRange }: CardProps) => {
  const cls = (bg: string) =>
    `ws-card ${bg} ${isActive ? 'ws-card-active' : ''}`

  if (card.kind === 'hook') {
    return (
      <div className={cls('ws-bg-hook')}>
        <div className="ws-eyebrow">이번 주 한 장면</div>
        <div className="ws-big-num">{card.data.prayer_count}</div>
        <div className="ws-big-num-label">번의 기도</div>
        <h2 className="ws-headline">{card.data.headline}</h2>
        <p className="ws-sub">{card.data.sub}</p>
        <div className="ws-stats-grid">
          <div className="ws-stat-card">
            <div className="ws-stat-num">{card.data.new_prayer_count}</div>
            <div className="ws-stat-label">새 기도</div>
          </div>
          <div className="ws-stat-card">
            <div className="ws-stat-num">{card.data.prayer_count}</div>
            <div className="ws-stat-label">함께 기도</div>
          </div>
          <div className="ws-stat-card">
            <div className="ws-stat-num">{card.data.answered_count}</div>
            <div className="ws-stat-label">응답</div>
          </div>
        </div>
      </div>
    )
  }

  if (card.kind === 'day') {
    const d = card.data
    return (
      <div className={cls('ws-bg-day')}>
        <span className={`ws-day-pill ${d.is_peak ? 'ws-peak' : ''}`}>
          {d.is_peak && '⭐ '}
          {d.weekday}요일
        </span>
        <h2 className="ws-headline">
          {d.is_peak
            ? '평소보다 더 많이 기도한 날'
            : `${d.prayer_count + d.new_prayer_count}번의 기도`}
        </h2>
        <p className="ws-sub">
          {d.new_prayer_count > 0 && `새 기도 ${d.new_prayer_count}건 · `}
          함께 기도 {d.prayer_count}회
          {d.emotions.length > 0 && ` · ${d.emotions.map((e) => EMOJI_BY_EMOTION[e] ?? '').join(' ')}`}
        </p>
        {d.prayers.length > 0 && (
          <div className="ws-day-pray-list">
            {d.prayers.slice(0, 2).map((p) => (
              <PrayerLine key={p.id} prayer={p} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (card.kind === 'emotion') {
    const max = Math.max(1, ...card.data.distribution.map((e) => e.count))
    return (
      <div className={cls('ws-bg-emotion')}>
        <div className="ws-eyebrow">마음의 변화</div>
        <h2 className="ws-headline">이번 주 마음 분포</h2>
        <div className="ws-emo-bars">
          {card.data.distribution.map((e) => (
            <div key={e.key} className="ws-emo-bar">
              <span className="ws-emo-label">
                {EMOJI_BY_EMOTION[e.key] ?? ''} {e.label}
              </span>
              <div className="ws-emo-bar-track">
                <div
                  className="ws-emo-bar-fill"
                  style={{ width: `${(e.count / max) * 100}%` }}
                />
              </div>
              <span className="ws-emo-count">{e.count}</span>
            </div>
          ))}
        </div>
        {card.data.shift_message && (
          <div className="ws-emo-shift">✨ {card.data.shift_message}</div>
        )}
      </div>
    )
  }

  if (card.kind === 'highlight') {
    return (
      <div className={cls('ws-bg-highlight')}>
        <div className="ws-eyebrow">이번 주 하이라이트</div>
        <h2 className="ws-headline">함께 기도가 모인 순간</h2>
        <div className="ws-feature-card">
          <PrayerLine prayer={card.data.prayer} large />
          <div className="ws-feature-reason">🤝 {card.data.reason}</div>
        </div>
      </div>
    )
  }

  if (card.kind === 'answered') {
    return (
      <div className={cls('ws-bg-answered')}>
        {isActive && (
          <div className="ws-confetti" aria-hidden="true">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 100) / 14}%`,
                  animationDelay: `${(i % 5) * 0.1}s`,
                  animationDuration: `${1.6 + (i % 4) * 0.2}s`,
                }}
              >
                {['✨', '🎉', '⭐', '🕊️'][i % 4]}
              </span>
            ))}
          </div>
        )}
        <div className="ws-eyebrow">응답의 한 주</div>
        <h2 className="ws-headline">{card.data.headline}</h2>
        <p className="ws-sub">기도가 응답되는 순간을 함께 기억해요</p>
        {card.data.prayers.slice(0, 2).map((p) => (
          <div key={p.id} className="ws-feature-card">
            <PrayerLine prayer={p} large />
          </div>
        ))}
      </div>
    )
  }

  if (card.kind === 'ai') {
    return (
      <div className={cls('ws-bg-ai')}>
        <div className="ws-eyebrow">한 주를 마무리하며</div>
        <h2 className="ws-headline">{card.data.title}</h2>
        <p className="ws-sub">{card.data.body}</p>
        {card.data.verse_text && (
          <>
            <div className="ws-ai-quote">"{card.data.verse_text}"</div>
            {card.data.verse_reference && (
              <div className="ws-ai-ref">— {card.data.verse_reference}</div>
            )}
          </>
        )}
      </div>
    )
  }

  // empty
  return (
    <div className={cls('ws-bg-empty')}>
      <div className="ws-eyebrow">조용한 한 주</div>
      <h2 className="ws-headline">이번 주는 잠시 쉼표를 찍었네요</h2>
      <p className="ws-sub">
        한 줄 기도라도 다시 시작하면, 다음 주의 스토리가 채워질 거예요.
      </p>
    </div>
  )
}

const PrayerLine = ({
  prayer,
  large,
}: {
  prayer: WeeklyPrayerSummary
  large?: boolean
}) => (
  <div className={large ? '' : 'ws-pray-item'}>
    <div className="ws-pray-title">
      {prayer.emotion && <span>{EMOJI_BY_EMOTION[prayer.emotion]}</span>}
      {prayer.is_answered && <span>✨</span>}
      <span>{prayer.title}</span>
    </div>
    <div className="ws-pray-snippet">{prayer.snippet}</div>
    {prayer.prayer_count > 0 && (
      <div className="ws-pray-meta">
        <span>🙏 {prayer.prayer_count}명 함께 기도</span>
      </div>
    )}
  </div>
)
