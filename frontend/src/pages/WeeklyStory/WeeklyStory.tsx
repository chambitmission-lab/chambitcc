// 주간 기도 스토리 — A안 "키네틱 랩드" (2026-10-31 전면 개편)
//
// 벤치마크: Spotify Wrapped · Duolingo Year in Review · Instagram Stories.
// - 요일 7장 반복 → '이번 주의 리듬' 한 장(막대 7개)으로 압축, 전체 6장.
// - 장마다 색면이 바뀌고 큰 숫자·단어가 튀어 오른다(Black Han Sans).
// - 소리: 92BPM 루프 한 곡이 흐르고 장이 넘어갈수록 악기가 쌓인다(storyBeat).
// - 마지막 장은 자동으로 닫지 않고 카드 저장 · 새 기도 두 갈래 출구.
// - PC(lg): 가운데 9:16 카드 + 배경 전체가 카드 색 + 왼쪽 목차 + 오른쪽 조작 패널.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PrayerEmotion } from '../../types/prayer'
import type {
  WeeklyAINarrative,
  WeeklyAnswered,
  WeeklyDayCard,
  WeeklyEmotionShift,
  WeeklyHighlight,
  WeeklyStoryData,
} from '../../types/weeklyStory'
import { useWeeklyStory } from '../../hooks/useWeeklyStory'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { showToast } from '../../utils/toast'
import { storyBeat } from './storyBeat'
import { weeklyStoryCardFile } from './weeklyStoryCard'
import './WeeklyStory.css'

void ensureFontFamily('blackHanSans')

type Scene =
  | { kind: 'hook' }
  | { kind: 'rhythm'; days: WeeklyDayCard[] }
  | { kind: 'emotion'; data: WeeklyEmotionShift }
  | { kind: 'highlight'; data: WeeklyHighlight }
  | { kind: 'answered'; data: WeeklyAnswered }
  | { kind: 'closing'; data: WeeklyAINarrative }
  | { kind: 'empty' }

type Kind = Scene['kind']

/** 장별 색면 · 글자 톤 · 머무는 시간 · 목차 이름 */
const LOOK: Record<Kind, { bg: string; glow: string; ink: 'light' | 'dark'; ms: number; name: string }> = {
  hook: { bg: '#3182f6', glow: '#6aa8ff', ink: 'light', ms: 5500, name: '이번 주 기도' },
  rhythm: { bg: '#ff6b4a', glow: '#ff9a7f', ink: 'light', ms: 6500, name: '이번 주의 리듬' },
  emotion: { bg: '#0f2a5c', glow: '#2a4f99', ink: 'light', ms: 7500, name: '마음의 변화' },
  highlight: { bg: '#ffd84d', glow: '#fff0a6', ink: 'dark', ms: 7500, name: '함께 모인 기도' },
  answered: { bg: '#14b37d', glow: '#4fd6a2', ink: 'light', ms: 7500, name: '응답의 기록' },
  closing: { bg: '#191f28', glow: '#33404f', ink: 'light', ms: 10000, name: '한 문장 정리' },
  empty: { bg: '#0f2a5c', glow: '#2a4f99', ink: 'light', ms: 6000, name: '쉼표의 한 주' },
}

const EMOTION_LABEL: Record<PrayerEmotion, string> = {
  tired: '지침',
  anxious: '불안',
  grateful: '감사',
  sad: '슬픔',
  lonely: '외로움',
  angry: '분노',
  hopeful: '소망',
  confused: '혼란',
}
const EMOTION_COLOR: Record<PrayerEmotion, string> = {
  tired: '#a3acb9',
  anxious: '#7c9cf0',
  grateful: '#ffd84d',
  sad: '#8fb3d9',
  lonely: '#c3a6e6',
  angry: '#ff8a6b',
  hopeful: '#5fd69f',
  confused: '#9fd6e0',
}

const buildScenes = (s: WeeklyStoryData): Scene[] => {
  if (!s.has_activity) return [{ kind: 'empty' }, { kind: 'closing', data: s.ai_narrative }]
  const out: Scene[] = [{ kind: 'hook' }]
  if (s.days.some((d) => d.prayer_count + d.new_prayer_count > 0)) out.push({ kind: 'rhythm', days: s.days })
  if (s.emotion_shift && s.emotion_shift.distribution.length > 0) out.push({ kind: 'emotion', data: s.emotion_shift })
  if (s.highlight) out.push({ kind: 'highlight', data: s.highlight })
  if (s.answered && s.answered.prayers.length > 0) out.push({ kind: 'answered', data: s.answered })
  out.push({ kind: 'closing', data: s.ai_narrative })
  return out
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** 0 → to 로 빠르게 올라가는 숫자 */
const CountUp = ({ to, delay = 150 }: { to: number; delay?: number }) => {
  const [n, setN] = useState(() => (reducedMotion() ? to : 0))
  useEffect(() => {
    if (reducedMotion()) return
    let raf = 0
    const t0 = performance.now() + delay
    const dur = Math.min(900, 300 + to * 25)
    const step = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - t0) / dur))
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, delay])
  return <>{n}</>
}

const md = (iso: string) => iso.slice(5).replace('-', '.')

/* ── 아이콘(인라인 선화) ── */
const Ico = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)
const I_CLOSE = 'M6 6l12 12M18 6L6 18'
const I_SOUND = 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11'
const I_MUTE = 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5'
const I_PAUSE = 'M8.5 5.5v13M15.5 5.5v13'
const I_PLAY = 'M7.5 5.5l11 6.5-11 6.5z'

export default function WeeklyStory() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useWeeklyStory()
  const story: WeeklyStoryData | null = data?.data ?? null
  const scenes = useMemo(() => (story ? buildScenes(story) : []), [story])

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false) // 사용자가 직접 멈춤(버튼·Space)
  const [holding, setHolding] = useState(false) // 꾹 누르는 동안 잠깐 멈춤
  const [muted, setMuted] = useState(storyBeat.muted)
  const [saving, setSaving] = useState(false)

  const scene = scenes[index]
  const look = scene ? LOOK[scene.kind] : LOOK.hook
  const isLast = index === scenes.length - 1
  const stopped = paused || holding || isLast

  const close = useCallback(() => {
    storyBeat.stop()
    if (window.history.length > 1) navigate(-1)
    else navigate('/profile', { replace: true })
  }, [navigate])

  const go = useCallback(
    (to: number) => setIndex(Math.max(0, Math.min(scenes.length - 1, to))),
    [scenes.length],
  )

  // ── 자동 진행: 남은 시간을 기억해 멈춤·재개해도 이어서 흐른다 ──
  const remainingRef = useRef(0)
  const startedRef = useRef(0)
  useEffect(() => {
    remainingRef.current = look.ms
  }, [index, look.ms])
  useEffect(() => {
    if (!scene || stopped) return
    startedRef.current = Date.now()
    const t = window.setTimeout(() => go(index + 1), Math.max(200, remainingRef.current))
    return () => {
      window.clearTimeout(t)
      remainingRef.current -= Date.now() - startedRef.current
    }
  }, [index, stopped, scene, go])

  // ── 소리: 루프는 들어오자마자, 장마다 악기 한 겹 + 장면 효과음 ──
  useEffect(() => {
    if (!scene) return
    storyBeat.layer = scene.kind === 'closing' ? 5 : Math.min(4, index + 1)
    if (!muted && !paused) storyBeat.start()
    switch (scene.kind) {
      case 'hook':
      case 'highlight':
        storyBeat.count()
        break
      case 'answered':
        storyBeat.riser()
        storyBeat.stamp(0.75)
        break
      case 'closing':
        storyBeat.chord()
        break
      default:
        storyBeat.riser()
    }
    // muted·paused 는 아래 effect 가 처리 — 장 전환 때만 효과음을 낸다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, scene])

  useEffect(() => {
    if (muted || paused) storyBeat.stop()
    else if (scene) storyBeat.start()
  }, [muted, paused, scene])

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) storyBeat.stop()
      else if (!storyBeat.muted && !paused) storyBeat.start()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      storyBeat.stop()
    }
  }, [paused])

  const toggleMute = () => {
    const m = !muted
    storyBeat.setMuted(m)
    setMuted(m)
    if (!m) storyBeat.tap()
  }
  const togglePause = () => {
    storyBeat.tap()
    setPaused((p) => !p)
  }

  // ── 키보드 ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, go, close])

  // ── 탭·꾹 누르기·스와이프 ──
  const pressRef = useRef<{ x: number; y: number; t: number; w: number; left: number } | null>(null)
  const holdTimer = useRef<number | null>(null)
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return
    const r = e.currentTarget.getBoundingClientRect()
    pressRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), w: r.width, left: r.left }
    holdTimer.current = window.setTimeout(() => setHolding(true), 220)
  }
  const endPress = (e: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    const p = pressRef.current
    pressRef.current = null
    const wasHolding = holding
    setHolding(false)
    if (!p || cancelled) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (dy > 110 && Math.abs(dx) < 80) return close() // 아래로 쓸어내려 닫기
    if (Math.abs(dx) > 50 && Math.abs(dy) < 80) return go(dx < 0 ? index + 1 : index - 1)
    if (wasHolding || Date.now() - p.t > 300) return // 꾹 누름은 멈춤만
    const rel = (p.x - p.left) / p.w
    go(rel < 0.33 ? index - 1 : index + 1)
  }

  const saveCard = async () => {
    if (!story || saving) return
    storyBeat.stamp()
    setSaving(true)
    try {
      const file = await weeklyStoryCardFile(story)
      if (!file) throw new Error('export')
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: '이번 주 기도 스토리' })
      } else {
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 4000)
        showToast('이번 주 카드를 저장했어요', 'success')
      }
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') showToast('카드를 만들지 못했어요', 'error')
    } finally {
      setSaving(false)
    }
  }

  const startPrayer = () => {
    storyBeat.stop()
    navigate('/', { state: { openComposer: true } })
  }

  if (isLoading) {
    return (
      <div className="ws-root ws-status-root" style={{ ['--ws-bg' as string]: LOOK.hook.bg }}>
        <div className="ws-status">
          <div className="ws-loader" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>이번 주 이야기를 모으고 있어요</span>
        </div>
      </div>
    )
  }

  if (error || !story || !scene) {
    const message = error instanceof Error ? error.message : '이번 주 이야기를 찾지 못했어요'
    return (
      <div className="ws-root ws-status-root" style={{ ['--ws-bg' as string]: LOOK.empty.bg }}>
        <div className="ws-status">
          <span>{message}</span>
          <button type="button" className="ws-status-btn" onClick={close}>
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  const range = `${md(story.week_start)} – ${md(story.week_end)}`
  const rootStyle = { ['--ws-bg' as string]: look.bg, ['--ws-glow' as string]: look.glow } as CSSProperties
  const soundBtn = (
    <button type="button" className="ws-icon-btn" onClick={toggleMute} aria-label={muted ? '소리 켜기' : '소리 끄기'} aria-pressed={!muted}>
      <Ico d={muted ? I_MUTE : I_SOUND} />
    </button>
  )
  const pauseBtn = (
    <button type="button" className="ws-icon-btn" onClick={togglePause} aria-label={paused ? '다시 재생' : '일시정지'}>
      <Ico d={paused ? I_PLAY : I_PAUSE} />
    </button>
  )

  return (
    <div className="ws-root" style={rootStyle} data-ink={look.ink}>
      {/* PC 왼쪽 목차 */}
      <nav className="ws-side ws-side-l" aria-label="스토리 목차">
        <div className="ws-side-eye">{range} · 주간 기도</div>
        {scenes.map((s, i) => (
          <button
            key={s.kind}
            type="button"
            className={`ws-toc ${i === index ? 'is-on' : ''} ${i < index ? 'is-done' : ''}`}
            onClick={() => go(i)}
            aria-current={i === index ? 'step' : undefined}
          >
            <small>{i + 1}</small>
            {LOOK[s.kind].name}
          </button>
        ))}
      </nav>

      <div className="ws-center">
        <div
          className={`ws-card ${holding || paused ? 'is-paused' : ''}`}
          data-ink={look.ink}
          onPointerDown={onPointerDown}
          onPointerUp={(e) => endPress(e)}
          onPointerCancel={(e) => endPress(e, true)}
        >
          <div className="ws-bars" aria-hidden="true">
            {scenes.map((_, i) => (
              <div key={i} className={i < index ? 'is-done' : i === index ? 'is-run' : ''}>
                <i key={i === index ? `run-${index}` : undefined} style={{ animationDuration: `${look.ms}ms` }} />
              </div>
            ))}
          </div>
          <div className="ws-top">
            <span className="ws-top-title">주간 기도 스토리</span>
            <div className="ws-top-acts">
              {pauseBtn}
              {soundBtn}
              <button type="button" className="ws-icon-btn" onClick={close} aria-label="닫기">
                <Ico d={I_CLOSE} />
              </button>
            </div>
          </div>

          <div className="ws-scene" key={index}>
            <SceneView
              scene={scene}
              story={story}
              range={range}
              saving={saving}
              onSave={saveCard}
              onPray={startPrayer}
              onReplay={() => go(0)}
            />
          </div>

          {(paused || holding) && (
            <div className="ws-paused-chip" aria-live="polite">
              <Ico d={I_PAUSE} size={14} /> 멈춤
            </div>
          )}
        </div>
      </div>

      {/* PC 오른쪽 조작 패널 */}
      <aside className="ws-side ws-side-r">
        <div className="ws-side-eye">지금 장면</div>
        <div className="ws-side-now">{look.name}</div>
        <div className="ws-side-acts">
          <button type="button" className="ws-pbtn is-primary" onClick={saveCard} disabled={saving}>
            {saving ? '카드 만드는 중…' : '이번 주 카드 저장'}
          </button>
          <button type="button" className="ws-pbtn" onClick={togglePause}>
            <Ico d={paused ? I_PLAY : I_PAUSE} size={18} /> {paused ? '다시 재생' : '일시정지'}
          </button>
          <button type="button" className="ws-pbtn" onClick={toggleMute}>
            <Ico d={muted ? I_MUTE : I_SOUND} size={18} /> {muted ? '소리 켜기' : '소리 끄기'}
          </button>
        </div>
        <dl className="ws-keys">
          <dt><kbd>←</kbd> <kbd>→</kbd></dt>
          <dd>이전 · 다음 장</dd>
          <dt><kbd>Space</kbd></dt>
          <dd>멈춤 · 재생</dd>
          <dt><kbd>Esc</kbd></dt>
          <dd>닫기</dd>
        </dl>
        <button type="button" className="ws-side-close" onClick={close}>
          <Ico d={I_CLOSE} size={18} /> 닫기
        </button>
      </aside>
    </div>
  )
}

/* ───────────────────── 장면 ───────────────────── */

interface SceneProps {
  scene: Scene
  story: WeeklyStoryData
  range: string
  saving: boolean
  onSave: () => void
  onPray: () => void
  onReplay: () => void
}

const delay = (s: number) => ({ animationDelay: `${s}s` }) as CSSProperties

const SceneView = ({ scene, story, range, saving, onSave, onPray, onReplay }: SceneProps) => {
  const hook = story.hook

  if (scene.kind === 'hook') {
    return (
      <>
        <div className="ws-blob" aria-hidden="true" />
        <div className="ws-eye ws-in">{range} · 이번 주</div>
        <div className="ws-huge ws-pop" style={delay(0.15)}>
          <CountUp to={hook.prayer_count} />
        </div>
        <div className="ws-big ws-in" style={delay(0.35)}>
          번 기도했어요
        </div>
        <p className="ws-body ws-in" style={delay(0.5)}>{hook.sub}</p>
        <div className="ws-chips ws-in" style={delay(0.65)}>
          <span className="ws-chip">새 기도 {hook.new_prayer_count}</span>
          <span className="ws-chip">응답 {hook.answered_count}</span>
        </div>
      </>
    )
  }

  if (scene.kind === 'rhythm') {
    const vals = scene.days.map((d) => d.prayer_count + d.new_prayer_count)
    const max = Math.max(1, ...vals)
    const flagged = scene.days.findIndex((d) => d.is_peak)
    const peakIdx = flagged >= 0 ? flagged : vals.indexOf(max)
    const peak = scene.days[peakIdx]
    const activeDays = vals.filter((v) => v > 0).length
    return (
      <>
        <div className="ws-eye ws-in">이번 주의 리듬</div>
        <h2 className="ws-big ws-in ws-mt" style={delay(0.1)}>
          {peak.weekday}요일이
          <br />
          가장 뜨거웠어요
        </h2>
        <p className="ws-body ws-in" style={delay(0.25)}>
          7일 중 {activeDays}일 기도의 자리에 앉았어요
        </p>
        <div className="ws-bars7">
          {scene.days.map((d, i) => (
            <div key={d.date}>
              <em className="ws-in" style={delay(0.6 + i * 0.07)}>{vals[i] > 0 ? vals[i] : ''}</em>
              <i
                className={i === peakIdx ? 'is-peak' : ''}
                style={{ height: `${Math.max(4, (vals[i] / max) * 100)}%`, ...delay(0.3 + i * 0.07) }}
              />
              <span>{d.weekday}</span>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (scene.kind === 'emotion') {
    const dist = scene.data.distribution
    const label = (k?: PrayerEmotion | null) => (k ? dist.find((e) => e.key === k)?.label ?? EMOTION_LABEL[k] : '')
    const early = scene.data.early_dominant
    const late = scene.data.late_dominant
    const shifted = !!early && !!late && early !== late
    const top = [...dist].sort((a, b) => b.count - a.count)[0]
    return (
      <>
        <div className="ws-eye ws-in">마음의 변화</div>
        <div className="ws-push" />
        {shifted ? (
          <>
            <div className="ws-mid ws-in" style={delay(0.1)}>주 초반엔</div>
            <div className="ws-word ws-in" style={delay(0.25)}>
              <span className="ws-strike">{label(early)}</span>
            </div>
            <div className="ws-mid ws-in ws-mt-s" style={delay(1.05)}>주말엔</div>
            <div className="ws-word is-lit ws-pop" style={{ ...delay(1.2), color: EMOTION_COLOR[late!] }}>
              {label(late)}
            </div>
          </>
        ) : (
          <>
            <div className="ws-mid ws-in" style={delay(0.1)}>이번 주 가장 많았던 마음</div>
            <div className="ws-word is-lit ws-pop" style={{ ...delay(0.3), color: EMOTION_COLOR[top.key] }}>
              {top.label || EMOTION_LABEL[top.key]}
            </div>
          </>
        )}
        {scene.data.shift_message && (
          <p className="ws-body ws-in" style={delay(shifted ? 1.5 : 0.6)}>{scene.data.shift_message}</p>
        )}
        <div className="ws-chips ws-in" style={delay(shifted ? 1.65 : 0.75)}>
          {dist.map((e) => (
            <span key={e.key} className="ws-chip">
              <i className="ws-dot" style={{ background: EMOTION_COLOR[e.key] }} />
              {e.label || EMOTION_LABEL[e.key]} {e.count}
            </span>
          ))}
        </div>
      </>
    )
  }

  if (scene.kind === 'highlight') {
    const p = scene.data.prayer
    return (
      <>
        <div className="ws-eye ws-in">가장 많이 모인 기도</div>
        <div className="ws-huge ws-pop ws-huge-s" style={delay(0.15)}>
          <CountUp to={p.prayer_count} />
        </div>
        <div className="ws-big ws-in" style={delay(0.3)}>
          명이 함께
          <br />
          손을 모았어요
        </div>
        <div className="ws-quote ws-in" style={delay(0.6)}>
          {p.title && <div className="ws-quote-t">{p.title}</div>}
          <div className="ws-quote-s">{p.snippet}</div>
          <div className="ws-quote-m">{scene.data.reason}</div>
        </div>
      </>
    )
  }

  if (scene.kind === 'answered') {
    const list = scene.data.prayers.slice(0, 2)
    return (
      <>
        <div className="ws-eye ws-in">응답의 기록</div>
        <h2 className="ws-big ws-in ws-mt" style={delay(0.1)}>
          기도 {scene.data.prayers.length}개가
          <br />
          응답됐어요
        </h2>
        <div className="ws-answers">
          {list.map((p, i) => (
            <div key={p.id} className="ws-answer ws-in" style={delay(0.4 + i * 0.45)}>
              <div className="ws-answer-t">{p.title || p.snippet}</div>
              {p.title && <div className="ws-answer-s">{p.snippet}</div>}
              <span className="ws-stamp" style={delay(0.75 + i * 0.45)}>응답</span>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (scene.kind === 'closing') {
    const ai = scene.data
    return (
      <>
        <div className="ws-eye ws-in">이번 주를 한 문장으로</div>
        <h2 className="ws-big ws-big-s ws-in ws-mt" style={delay(0.1)}>{ai.title}</h2>
        <p className="ws-body ws-in" style={delay(0.3)}>{ai.body}</p>
        {ai.verse_text && (
          <blockquote className="ws-verse ws-in" style={delay(0.6)}>
            “{ai.verse_text}”
            {ai.verse_reference && <cite>{ai.verse_reference}</cite>}
          </blockquote>
        )}
        <div className="ws-cta ws-in" style={delay(0.9)}>
          {story.has_activity && (
            <button type="button" className="ws-cta-main" onClick={onSave} disabled={saving}>
              {saving ? '카드 만드는 중…' : '이번 주 카드 저장하기'}
            </button>
          )}
          <div className="ws-cta-row">
            <button type="button" className="ws-cta-sub" onClick={onPray}>새 기도 올리기</button>
            <button type="button" className="ws-cta-sub" onClick={onReplay}>처음부터 다시</button>
          </div>
        </div>
      </>
    )
  }

  // empty
  return (
    <>
      <div className="ws-eye ws-in">{range} · 조용한 한 주</div>
      <div className="ws-push" />
      <div className="ws-huge ws-pop" style={delay(0.15)}>쉼표</div>
      <h2 className="ws-big ws-big-s ws-in" style={delay(0.35)}>
        이번 주는 잠시
        <br />
        숨을 골랐네요
      </h2>
      <p className="ws-body ws-in" style={delay(0.5)}>
        한 줄 기도라도 다시 시작하면, 다음 주 스토리가 채워져요.
      </p>
    </>
  )
}
