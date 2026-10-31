// /groups 목록의 가사 카드 — D3(Spotify 가사 화면) + D1(성구 한 단어 커버)
// 방 색 판 위에 그 방 테마의 한 단어를 크게 박고, 식구들이 올린 최근 기도가 가사처럼 한 줄씩 밝아진다.
// 판·글자 색의 라이트/다크 차이는 theme.css 의 --gl-* 토큰이 맡는다(myGroupsList.css 참고).
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GroupRecentPrayer, PrayerGroup } from '../../../types/prayer'
import { groupKeyword, keywordSize, roomStyle, verseRef } from '../utils/groupKeyword'
import { timeAgo as relativeTime } from '../../../utils/dateUtils'
import { GroupGlyph } from '../GroupIcons'
import '../myGroupsList.css'

export const KeywordCover = ({
  group,
  size,
  radius = 10,
  showRef,
  solo,
}: {
  group: PrayerGroup
  size: number
  radius?: number
  showRef?: boolean
  solo?: boolean
}) => {
  const word = groupKeyword(group)
  const ref = showRef ? verseRef(group) : null
  return (
    <span
      className={`gl-cover${solo ? ' is-solo' : ''}`}
      style={{ ...roomStyle(group), '--w': `${size}px`, '--rad': `${radius}px`, '--fs': `${keywordSize(word, size)}px` } as CSSProperties}
      aria-hidden
    >
      <span className="gl-cover-icon">
        <GroupGlyph emoji={group.icon || '👥'} size={Math.max(12, Math.round(size * 0.12))} />
      </span>
      {ref && size >= 110 && <span className="gl-cover-ref">{ref}</span>}
      <span className="gl-cover-kw">{word}</span>
    </span>
  )
}

// ── 가사 줄 ─────────────────────────────────────────
const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// 화면에 보일 때만 2.6초마다 다음 줄로 — 안 보이는 카드·움직임 줄이기에서는 멈춘다
const useLyricIndex = (count: number) => {
  const ref = useRef<HTMLDivElement>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el || count < 2 || reducedMotion() || typeof IntersectionObserver === 'undefined') return
    let timer: number | undefined
    const stop = () => {
      if (timer !== undefined) window.clearInterval(timer)
      timer = undefined
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (timer === undefined) timer = window.setInterval(() => setTick((t) => t + 1), 2600)
      } else stop()
    })
    io.observe(el)
    return () => {
      io.disconnect()
      stop()
    }
  }, [count])
  return { ref, index: count ? tick % count : 0 }
}

const lineMeta = (p: GroupRecentPrayer) => {
  const parts = [p.is_anonymous ? '익명' : p.author_name]
  const ago = relativeTime(p.created_at, { maxDays: 30 })
  if (ago) parts.push(ago)
  if (p.is_answered) parts.push('응답받은 기도')
  else if (p.prayed_count > 0) parts.push(`${p.prayed_count}명 함께 기도`)
  return parts.join(' · ')
}

// 구버전 백엔드(recent_prayers 없음)·빈 방에서 가사 자리를 채우는 한 줄
const fallbackLine = (g: PrayerGroup) => {
  if (g.recent_prayers == null) return g.description?.trim() || '방에 들어가 식구들의 기도를 확인해 보세요'
  return '아직 올라온 기도가 없어요'
}

export const LyricLines = ({ group, max = 3 }: { group: PrayerGroup; max?: number }) => {
  const prayers = (group.recent_prayers ?? []).slice(0, max)
  const { ref, index } = useLyricIndex(prayers.length)
  if (!prayers.length) {
    return (
      <div className="gl-lines">
        <p className="gl-line is-quiet">
          {fallbackLine(group)}
          {group.recent_prayers != null && <span className="gl-line-meta">첫 줄을 남겨 주면 식구들이 함께 기도해요</span>}
        </p>
      </div>
    )
  }
  return (
    <div className="gl-lines" ref={ref} aria-live="off">
      {prayers.map((p, i) => (
        <p key={p.id} className={`gl-line ${i < index ? 'is-past' : i === index ? 'is-on' : ''}`}>
          {p.text}
          <span className="gl-line-meta">{lineMeta(p)}</span>
        </p>
      ))}
    </div>
  )
}

// ── 상태 줄 ─────────────────────────────────────────
export const RoomStatus = ({ group }: { group: PrayerGroup }) => {
  const hasSignals = group.checkins_today != null
  const newP = group.new_prayers_week ?? 0
  return (
    <span className="gl-sub">
      {newP > 0 && <span className="gl-new">새 기도 {newP}</span>}
      {group.my_checked_in_today && (
        <span className="inline-flex items-center gap-1">
          <CheckGlyph /> 오늘 기도함 ·
        </span>
      )}
      <span>
        {hasSignals
          ? `오늘 ${group.checkins_today ?? 0}/${group.member_count}명`
          : `${group.member_count}명`}
      </span>
    </span>
  )
}

export const TodayFaces = ({ group, size = 24 }: { group: PrayerGroup; size?: number }) => {
  const faces = group.today_faces ?? []
  if (!faces.length) return null
  return (
    <span className="gl-faces" style={{ '--s': `${size}px` } as CSSProperties} aria-label={`오늘 기도한 식구 ${faces.map((f) => f.name).join(', ')}`}>
      {faces.map((f, i) => (
        <span key={`${f.name}-${i}`} className="gl-face">
          {f.avatar_url ? <img src={f.avatar_url} alt="" loading="lazy" /> : f.name.slice(0, 1)}
        </span>
      ))}
    </span>
  )
}

// ── 아이콘 ─────────────────────────────────────────
export const PlayGlyph = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" />
  </svg>
)
const PenGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 20l4-1 11-11-3-3L5 16z" />
  </svg>
)
const ClockGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </svg>
)
const CheckGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12l5 5 9-10" />
  </svg>
)

// 카드 안 버튼 — 카드 자체의 이동(방 들어가기)과 겹치지 않게 전파를 끊는다
const useRoomActions = (group: PrayerGroup) => {
  const navigate = useNavigate()
  const go = (to: string) => (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    navigate(to)
  }
  return {
    open: () => navigate(`/groups/${group.id}`),
    pray: go(`/groups/${group.id}?pray=1`),
    compose: go(`/groups/${group.id}?tab=prayers&compose=1`),
  }
}

const cardKeyDown = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.target !== e.currentTarget) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    fn()
  }
}

// ── 모바일 hero (맨 위, 펼친 방) ────────────────────────
export const RoomHeroCard = ({ group, onWarm }: { group: PrayerGroup; onWarm?: () => void }) => {
  const a = useRoomActions(group)
  const verse = group.theme_verse?.text
  return (
    <article
      className="gl-room gl-hero is-hero"
      style={roomStyle(group)}
      role="link"
      tabIndex={0}
      aria-label={`${group.name} 들어가기`}
      onClick={a.open}
      onKeyDown={cardKeyDown(a.open)}
      onPointerEnter={onWarm}
      onPointerDown={onWarm}
    >
      <div className="gl-hero-band">
        <KeywordCover group={group} size={124} showRef />
        <div className="gl-hero-meta">
          <span className="gl-hero-name">{group.name}</span>
          <RoomStatus group={group} />
          <TodayFaces group={group} />
        </div>
        <button type="button" className="gl-play" style={{ '--p': '46px' } as CSSProperties} onClick={a.pray} aria-label={`${group.name} 중보 시작`}>
          <PlayGlyph size={18} />
        </button>
      </div>
      {verse ? <p className="gl-verse">“{verse}”</p> : group.description ? <p className="gl-verse">{group.description}</p> : null}
      <LyricLines group={group} />
      <div className="gl-hero-ft">
        <button type="button" className="gl-ghost" onClick={a.compose}>
          <PenGlyph /> 기도 올리기
        </button>
        {group.prayer_time && (
          <span className="gl-pill">
            <ClockGlyph /> 함께 기도 {group.prayer_time}
          </span>
        )}
      </div>
    </article>
  )
}

// ── 모바일 compact (나머지 방 — 누르면 hero 로 펼친다) ──────
export const RoomCompactCard = ({
  group,
  onExpand,
  onWarm,
}: {
  group: PrayerGroup
  onExpand: () => void
  onWarm?: () => void
}) => {
  const a = useRoomActions(group)
  const first = group.recent_prayers?.[0]
  return (
    <div
      className="gl-room gl-compact"
      style={roomStyle(group)}
      role="button"
      tabIndex={0}
      aria-label={`${group.name} 펼치기`}
      onClick={onExpand}
      onKeyDown={cardKeyDown(onExpand)}
      onPointerEnter={onWarm}
      onPointerDown={onWarm}
    >
      <div className="gl-compact-top">
        <KeywordCover group={group} size={60} radius={9} />
        <div className="min-w-0 flex-1">
          <span className="gl-compact-name">{group.name}</span>
          <RoomStatus group={group} />
        </div>
        <button type="button" className="gl-play" style={{ '--p': '36px' } as CSSProperties} onClick={a.pray} aria-label={`${group.name} 중보 시작`}>
          <PlayGlyph size={14} />
        </button>
      </div>
      <div className="gl-lines">
        <p className={`gl-line ${first ? 'is-on' : 'is-quiet'}`}>{first ? first.text : fallbackLine(group)}</p>
        {first && <span className="gl-compact-meta">{lineMeta(first)}</span>}
      </div>
    </div>
  )
}

// ── PC 무대 ────────────────────────────────────────
export const RoomStage = ({ group, children }: { group: PrayerGroup; children?: ReactNode }) => {
  const a = useRoomActions(group)
  const verse = group.theme_verse?.text
  // '함께한 지 N일' — 방이 바뀔 때만 다시 센다 (렌더마다 시계를 읽지 않게)
  // eslint-disable-next-line react-hooks/purity
  const days = useMemo(() => Math.max(0, Math.floor((Date.now() - new Date(group.created_at).getTime()) / 86_400_000)), [group.created_at])
  const newP = group.new_prayers_week ?? 0
  return (
    <article className="gl-room gl-stage" style={roomStyle(group)}>
      <div className="gl-stage-band">
        <KeywordCover group={group} size={208} radius={14} showRef />
        <div className="gl-stage-info">
          <span className="gl-stage-kicker">
            기도방 · 함께한 지 {days.toLocaleString()}일{group.prayer_time ? ` · 매일 ${group.prayer_time} 함께 기도` : ''}
          </span>
          <h2 className="gl-stage-name">{group.name}</h2>
          {(verse || group.description) && <p className="gl-stage-verse">{verse ? `“${verse}”` : group.description}</p>}
          <div className="flex items-center gap-2">
            <TodayFaces group={group} size={26} />
            <RoomStatus group={group} />
          </div>
        </div>
      </div>
      <LyricLines group={group} />
      <div className="gl-stage-ft">
        <button type="button" className="gl-play" style={{ '--p': '56px' } as CSSProperties} onClick={a.pray} aria-label={`${group.name} 중보 시작`}>
          <PlayGlyph size={22} />
        </button>
        <span className="gl-hint">중보 모드 · {newP > 0 ? `새 기도 ${newP}개를` : '기도를'} 한 장씩</span>
        <button type="button" className="gl-ghost" onClick={a.compose}>
          <PenGlyph /> 기도 올리기
        </button>
        <button type="button" className="gl-ghost" onClick={(e) => { e.stopPropagation(); a.open() }}>
          방 들어가기
        </button>
        {children}
      </div>
    </article>
  )
}
