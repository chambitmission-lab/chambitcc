// 설교 상세 — '극장 몰입' (2026-11 개편, 시안 /#/dev/sermon-player?v=e)
//   어두운 극장 + 영상 대표 이미지의 앰비언트 빛 + 큰 영상 → 첫 절 인용 → 오늘의 본문 → 한 줄 붙잡기
//   → 음성·언급된 구절·설교 내용 → 이어서 들을 말씀.
//   불 끄기: 영상만 남기고 주변을 거의 지운다(영상 밖을 누르거나 Esc 로 다시 켜짐).
//   내리면 영상이 위에 한 줄로 붙고(docked), ⌄/'작게 띄우기'로 구석에 띄운 채 목록을 둘러본다(float).
// 플레이어(iframe)는 스크롤 영역 밖 한 자리에 두고, 펼친 상태에선 자리표시(slot) 위치를 따라간다 —
// 그래서 내용과 함께 자연스럽게 스크롤되면서도 붙거나 떠도 다시 로드되지 않는다.
// 화면 전체가 다크 섬(data-theme="dark")이라 안쪽 공용 조각(본문·구절·한 줄)은 다크 토큰으로 그려진다.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useNavigate } from 'react-router-dom'
import type { Sermon } from '../../../types/sermon'
import { API_URL } from '../../../config/api'
import { useSermonLeadVerse } from '../hooks/useSermonLeadVerse'
import { useSermonPassage } from '../hooks/useSermonPassage'
import { useDeleteSermon } from '../../../hooks/useSermons'
import { useSermonBibleReferences } from '../../../hooks/useSermonBibleReferences'
import { useSermonTakeaways } from '../../../hooks/useSermonTakeaways'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { BibleReferencesSection } from './BibleReferencesSection'
import SermonContentFormatter from './SermonContentFormatter'
import SermonTakeawayEditor from './SermonTakeawayEditor'
import {
  compactReference,
  extractSermonHighlight,
  extractYouTubeVideoId,
  youtubeThumbnailUrl,
  parseBibleReference,
  formatReference,
  formatSermonDate,
  stripTitleDate,
} from '../utils/sermonMeta'
import { pastorShortName, stampParts, worshipSlot } from '../utils/sermonLetter'
import { letterSeasonOf, seasonScene } from '../../Ministry/letterSeason'
import { safeStorage } from '../../../utils/safeStorage'
import './SermonDetail.css'
import { toastFeedback } from '../../../utils/toast'
import { can } from '../../../utils/access'

const YOUTUBE_ORIGIN = 'https://www.youtube.com'

// 끼우는 순간 = 보겠다는 뜻이므로 항상 autoplay. enablejsapi는 이동·정지(postMessage)와 상태 수신용.
const buildYouTubeEmbedSrc = (videoId: string, startSeconds?: number): string => {
  const params = new URLSearchParams({
    autoplay: '1',
    playsinline: '1',
    rel: '0',
    enablejsapi: '1',
    origin: window.location.origin,
  })
  if (startSeconds && startSeconds > 0) params.set('start', String(startSeconds))
  return `${YOUTUBE_ORIGIN}/embed/${videoId}?${params.toString()}`
}

// 플레이어·썸네일 서버와의 연결을 미리 연다 (한 번만 head에 추가)
const preconnectYouTube = () => {
  for (const href of [YOUTUBE_ORIGIN, 'https://i.ytimg.com']) {
    if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) continue
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = href
    document.head.appendChild(link)
  }
}

// '불을 끄면…' 권유는 처음 몇 번만 — 매주 보는 분께 잔소리가 되지 않게
const HINT_KEY = 'sermon-lights-hint'
const HINT_MAX = 3

type Mode = 'full' | 'docked' | 'float'

interface SermonDetailProps {
  sermon: Sermon
  /** 목록에서 음성/영상 버튼으로 진입한 경우 해당 미디어를 바로 재생 */
  initialMedia?: 'audio' | 'video' | null
  /** 아래 '이어서 들을 말씀' — 부모가 고른 다른 설교들 */
  others?: Sermon[]
  onOpenSermon?: (sermon: Sermon) => void
  onClose: () => void
  onDelete?: () => void
  onEdit?: () => void
}

const Icon = ({ n }: { n: string }) => (
  <span className="material-icons-outlined" aria-hidden>{n}</span>
)

const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l11.2-6.86a1 1 0 0 0 0-1.72L9.52 4.28A1 1 0 0 0 8 5.14z" />
  </svg>
)

const PipGlyph = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <rect x="12" y="11.5" width="7" height="5" rx="1.2" fill="currentColor" stroke="none" />
  </svg>
)

const SermonDetail = ({
  sermon,
  initialMedia = null,
  others = [],
  onOpenSermon,
  onClose,
  onDelete,
  onEdit,
}: SermonDetailProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const videoPlayerRef = useRef<HTMLIFrameElement>(null)
  const audioPlayerRef = useRef<HTMLAudioElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [mode, setMode] = useState<Mode>('full')
  const modeRef = useRef<Mode>('full')
  const [lightsOff, setLightsOff] = useState(false)
  const [hint, setHint] = useState(false)
  const [paused, setPaused] = useState(false)
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null)
  const adminUser = can('sermons:manage')
  const navigate = useNavigate()
  const deleteSermonMutation = useDeleteSermon(toastFeedback({ success: '설교가 삭제되었습니다', error: '설교 삭제에 실패했습니다' }))

  const changeMode = (next: Mode) => {
    modeRef.current = next
    setMode(next)
  }

  // 설교별 성경 구절 목록 조회 (설교 상세에 포함되지 않은 경우 별도 조회)
  const { data: bibleReferences, isLoading: isLoadingReferences } = useSermonBibleReferences(
    sermon.bible_references && sermon.bible_references.length > 0 ? null : sermon.id
  )
  const displayReferences = sermon.bible_references || bibleReferences || []

  const floating = mode === 'float'

  // 떠 있는 동안엔 목록을 둘러보는 중 — 뒤로가기·Esc·스크롤 잠금은 펼쳐 있을 때만
  useModalBackButton(() => {
    if (showDeleteConfirm) setShowDeleteConfirm(false)
    else onClose()
  }, !floating)

  useEscapeKey(() => {
    if (showDeleteConfirm) setShowDeleteConfirm(false)
    else if (lightsOff) setLightsOff(false)
    else onClose()
  }, !floating)

  useBodyScrollLock(!floating)

  const handleDelete = async () => {
    try {
      await deleteSermonMutation.mutateAsync(sermon.id)
      onDelete?.()
      onClose()
    } catch {
      // 삭제 실패는 mutation에서 처리
    }
  }

  const audioUrl = !sermon.audio_url
    ? ''
    : /^https?:\/\//.test(sermon.audio_url)
      ? sermon.audio_url
      : `${API_URL}${sermon.audio_url}`

  const videoId = sermon.video_url ? extractYouTubeVideoId(sermon.video_url) : null

  // 유튜브 플레이어는 무거워서(스크립트·요청 수십 개) 볼 뜻이 확인된 뒤에만 끼운다.
  // null = 아직 표지만. 목록의 영상 버튼으로 들어왔으면 바로 끼운다.
  // src는 한 번 정하면 바꾸지 않는다 — 바꾸면 플레이어가 통째로 다시 로드되고 히스토리도 쌓인다.
  const [videoSrc, setVideoSrc] = useState<string | null>(() =>
    videoId && initialMedia === 'video' ? buildYouTubeEmbedSrc(videoId) : null
  )
  const videoReadyRef = useRef(false)
  const pendingSeekRef = useRef<number | null>(null)

  useEffect(() => {
    if (videoId) preconnectYouTube()
  }, [videoId])

  const sendToPlayer = (func: string, args: unknown[] = []) => {
    videoPlayerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), YOUTUBE_ORIGIN)
  }

  const seekVideo = (seconds: number) => {
    sendToPlayer('seekTo', [seconds, true])
    sendToPlayer('playVideo')
  }

  const handleVideoLoad = () => {
    videoReadyRef.current = true
    // 재생·정지 상태를 받아 미니 플레이어 버튼을 맞춘다(영상 안에서 직접 멈춰도 따라감)
    videoPlayerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YOUTUBE_ORIGIN)
    if (pendingSeekRef.current !== null) {
      seekVideo(pendingSeekRef.current)
      pendingSeekRef.current = null
    }
  }

  useEffect(() => {
    if (!videoSrc) return
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YOUTUBE_ORIGIN || e.source !== videoPlayerRef.current?.contentWindow) return
      let data: { event?: string; info?: unknown }
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch {
        return
      }
      const state =
        data.event === 'onStateChange' ? data.info
          : data.event === 'infoDelivery' && data.info && typeof data.info === 'object'
            ? (data.info as { playerState?: number }).playerState
            : undefined
      if (state === 1) setPaused(false)
      else if (state === 2) setPaused(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [videoSrc])

  const offerLights = () => {
    const seen = Number(safeStorage.getJson(HINT_KEY)) || 0
    if (seen >= HINT_MAX) return
    safeStorage.setJson(HINT_KEY, seen + 1)
    setHint(true)
  }

  useEffect(() => {
    if (!hint) return
    const t = window.setTimeout(() => setHint(false), 4200)
    return () => window.clearTimeout(t)
  }, [hint])

  const startVideo = (seconds?: number) => {
    if (!videoId || videoSrc) return
    setVideoSrc(buildYouTubeEmbedSrc(videoId, seconds))
    if (!lightsOff) offerLights()
  }

  // 목록의 영상 버튼으로 바로 들어온 경우에도 한 번 권한다
  useEffect(() => {
    if (initialMedia === 'video' && videoId) offerLights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleLights = (off: boolean) => {
    setHint(false)
    setLightsOff(off)
  }

  const togglePause = () => {
    sendToPlayer(paused ? 'playVideo' : 'pauseVideo')
    setPaused((p) => !p)
  }

  const backToFull = () => {
    changeMode('full')
    scrollRef.current?.scrollTo({ top: 0 })
  }

  const goFloat = () => {
    setLightsOff(false)
    setHint(false)
    changeMode('float')
  }

  // 자리표시 위치를 재고(펼친 상태의 플레이어 좌표), 영상의 2/3가 상단 바 뒤로 들어가면 위에 붙인다.
  // /sermon 은 PC 글씨 크기 zoom 안이라 화면 좌표를 --az 로 나눠 style 에 넣는다.
  useEffect(() => {
    if (!videoId) return
    let raf = 0
    const measure = () => {
      raf = 0
      const root = rootRef.current
      const slot = slotRef.current
      const top = topRef.current
      if (!root || !slot || !top) return
      const az = parseFloat(getComputedStyle(root).getPropertyValue('--az')) || 1
      const r = root.getBoundingClientRect()
      const s = slot.getBoundingClientRect()
      setBox({ top: (s.top - r.top) / az, left: (s.left - r.left) / az, width: s.width / az })
      if (modeRef.current === 'float') return
      const next: Mode = s.bottom < top.getBoundingClientRect().bottom + s.height * 0.34 ? 'docked' : 'full'
      if (next !== modeRef.current) changeMode(next)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    const scroller = scrollRef.current
    scroller?.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const ro = new ResizeObserver(schedule)
    if (rootRef.current) ro.observe(rootRef.current)
    return () => {
      scroller?.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [videoId])

  // 성구 — 첫 절 인용(목록 히어로와 같은 쿼리키) · 본문 범위(말씀 편지 '본문 읽기'와 같은 캐시)
  const parsed = useMemo(() => parseBibleReference(sermon.bible_verse), [sermon.bible_verse])
  const { data: leadVerse } = useSermonLeadVerse(parsed)
  const { verses: passage, isLoading: passageLoading } = useSermonPassage(parsed, true)

  const referenceLabel = parsed ? formatReference(parsed) : sermon.bible_verse
  const titleText = stripTitleDate(sermon.title)
  const heading = referenceLabel || titleText
  const eyebrow = [sermon.pastor, referenceLabel ? titleText : null].filter(Boolean).join(' · ')
  const coverPhoto = seasonScene(letterSeasonOf(sermon.sermon_date), 'night')

  // "▶ …" 한 줄은 본문에서 빼내 핵심 포인트로 (없으면 본문 그대로)
  const { highlight, body: bodyContent } = useMemo(
    () => extractSermonHighlight(sermon.content),
    [sermon.content]
  )

  const { bySermon } = useSermonTakeaways()

  const openBible = () => {
    if (!parsed?.bookNumber) return
    navigate(`/bible/${parsed.bookNumber}/${parsed.chapter}${parsed.verse ? `?verse=${parsed.verse}` : ''}`)
  }

  // 목록에서 음성 버튼으로 진입 — 음성 칸으로 가서 바로 재생
  useEffect(() => {
    if (initialMedia !== 'audio') return
    const timer = setTimeout(() => {
      const audio = audioPlayerRef.current
      if (!audio) return
      audio.scrollIntoView({ block: 'center' })
      audio.play().catch(() => {
        // 브라우저 자동재생 정책에 막히면 사용자가 직접 재생
      })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 타임스탬프 — 음성 우선(트랜스크립트가 음성 기반), 없으면 영상
  const handleTimestampClick = (timestamp: number) => {
    const audio = audioPlayerRef.current
    if (audio && sermon.audio_url) {
      audio.currentTime = timestamp
      audio.play()
      audio.scrollIntoView({ block: 'center' })
      return
    }
    if (!videoId) return
    const seconds = Math.floor(timestamp)
    if (!videoSrc) startVideo(seconds)
    else if (videoReadyRef.current) seekVideo(seconds)
    else pendingSeekRef.current = seconds
    // 펼친 상태면 영상이 보이도록 맨 위로(붙어 있거나 떠 있으면 이미 보인다)
    if (modeRef.current === 'full') scrollRef.current?.scrollTo({ top: 0 })
  }

  const fullStyle: CSSProperties | undefined =
    mode === 'full' && box ? { top: box.top, left: box.left, width: box.width } : undefined

  return (
    <div
      ref={rootRef}
      data-theme="dark"
      className={`sermon-theater dark is-${mode}${lightsOff ? ' is-lights-off' : ''}${videoId ? ' has-video' : ''}`}
      role="dialog"
      aria-modal={!floating}
      aria-label={`${heading} 설교`}
    >
      <div className="st-stage" aria-hidden={floating}>
        <div className="st-ambient" aria-hidden>
          <img src={videoId ? youtubeThumbnailUrl(videoId) : coverPhoto} alt="" decoding="async" />
        </div>

        <header ref={topRef} className="st-top">
          {videoId ? (
            <button type="button" className="st-icon" aria-label="작게 띄우기" title="작게 띄우기" onClick={goFloat}>
              <Icon n="expand_more" />
            </button>
          ) : (
            <span className="st-top-spacer" />
          )}
          <span className="st-top-date">{formatSermonDate(sermon.sermon_date)}</span>
          <div className="st-top-actions">
            {adminUser && (
              <>
                <button type="button" className="st-pill st-dim" onClick={onEdit} title="수정">
                  <Icon n="edit" />
                  <span className="st-pill-label">수정</span>
                </button>
                <button type="button" className="st-pill st-pill--danger st-dim" onClick={() => setShowDeleteConfirm(true)} title="삭제">
                  <Icon n="delete" />
                  <span className="st-pill-label">삭제</span>
                </button>
              </>
            )}
            {videoId && (
              <button
                type="button"
                className={`st-pill${lightsOff ? ' is-on' : ''}`}
                onClick={() => toggleLights(!lightsOff)}
                aria-pressed={lightsOff}
              >
                <Icon n={lightsOff ? 'lightbulb' : 'nightlight'} />
                <span className="st-pill-label">{lightsOff ? '불 켜기' : '불 끄기'}</span>
              </button>
            )}
            <button type="button" className="st-icon st-dim" onClick={onClose} aria-label="닫기" title="닫기">
              <Icon n="close" />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="st-scroll">
          {videoId ? (
            <div ref={slotRef} className="st-slot" />
          ) : (
            // 영상이 없는 설교 — 같은 자리에 계절 교회 사진 표지(썸네일이 있으면 그것)
            <div className="st-slot st-still">
              <img src={sermon.thumbnail_url || coverPhoto} alt="" decoding="async" />
              <span className="st-cover-text">
                <span className="st-cover-ref">{heading}</span>
                <span className="st-cover-by">{sermon.pastor}</span>
              </span>
            </div>
          )}

          {/* 불이 꺼진 동안엔 영상 밖 아무 곳이나 누르면 다시 켜진다 */}
          <div
            className="st-content"
            onClickCapture={(e) => {
              if (!lightsOff) return
              e.stopPropagation()
              e.preventDefault()
              toggleLights(false)
            }}
          >
            <section className="st-info">
              <div className="st-info-main">
                {eyebrow && <p className="st-eyebrow">{eyebrow}</p>}
                <h1 className="st-title">{heading}</h1>
                {leadVerse?.text && <p className="st-lead">{leadVerse.text}</p>}
              </div>
              <div className="st-actions">
                {videoId && (
                  <>
                    <button type="button" className="st-act" onClick={() => toggleLights(true)}>
                      <Icon n="nightlight" />불 끄고 보기
                    </button>
                    <button type="button" className="st-act" onClick={goFloat}>
                      <PipGlyph />작게 띄우기
                    </button>
                  </>
                )}
                {parsed?.bookNumber && (
                  <button type="button" className="st-act" onClick={openBible}>
                    <Icon n="menu_book" />성경에서 열기
                  </button>
                )}
              </div>
            </section>

            {sermon.audio_url && (
              <section className="st-block">
                <h2><Icon n="headphones" />설교 음성</h2>
                <audio
                  ref={audioPlayerRef}
                  controls
                  src={audioUrl}
                  className="st-audio"
                  controlsList="nodownload"
                />
              </section>
            )}

            {parsed?.bookNumber != null && (passageLoading || passage.length > 0) && (
              <section className="st-block">
                <h2><Icon n="auto_stories" />오늘의 본문<small>{referenceLabel}</small></h2>
                {passageLoading ? (
                  <p className="st-muted">본문을 펼치는 중…</p>
                ) : (
                  <ol className="st-passage">
                    {passage.map((v) => (
                      <li key={v.id}>
                        <sup>{v.verse_label || v.verse}</sup>
                        {v.text}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}

            <section className="st-block st-take">
              <h2><Icon n="edit_note" />한 줄 붙잡기</h2>
              <p className="st-muted">말씀 중 마음에 남은 한 문장을 적어 두면, 지난 편지 위에 손글씨로 남아요</p>
              <SermonTakeawayEditor sermonId={sermon.id} />
            </section>

            {displayReferences.length > 0 && (
              <section className="st-block st-refs">
                <BibleReferencesSection
                  references={displayReferences}
                  videoId={videoId}
                  hasAudio={!!sermon.audio_url}
                  onTimestampClick={handleTimestampClick}
                />
              </section>
            )}

            {isLoadingReferences && (
              <section className="st-block st-muted st-loading">
                <Icon n="refresh" />성경 구절을 불러오는 중…
              </section>
            )}

            {(bodyContent.trim() || highlight) && (
              <section className="st-block">
                <h2><Icon n="article" />설교 내용</h2>
                {highlight && <p className="st-highlight">{highlight}</p>}
                {bodyContent.trim() && <SermonContentFormatter content={bodyContent} />}
              </section>
            )}

            {others.length > 0 && onOpenSermon && (
              <section className="st-more">
                <h2>이어서 들을 말씀</h2>
                <ul className="st-rail">
                  {others.map((s) => {
                    const { md } = stampParts(s.sermon_date)
                    const slot = worshipSlot(s.title)
                    const kept = bySermon.get(s.id)?.text
                    return (
                      <li key={s.id}>
                        <button type="button" onClick={() => onOpenSermon(s)}>
                          <span className="st-rail-date"><b>{md}</b>{slot ? `주일 ${slot}` : stripTitleDate(s.title)}</span>
                          <span className="st-rail-ref">{compactReference(s.bible_verse) || stripTitleDate(s.title)}</span>
                          <span className="st-rail-by">{pastorShortName(s.pastor)}</span>
                          {kept && <span className="st-rail-kept">{kept}</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>

        {hint && (
          <button type="button" className="st-hint" onClick={() => toggleLights(true)}>
            <Icon n="nightlight" />불을 끄면 말씀에 더 집중할 수 있어요
          </button>
        )}
      </div>

      {/* 플레이어 — 한 자리. full=자리표시 따라가기 / docked=위 한 줄 / float=구석 */}
      {videoId && (
        <div className="st-player-wrap" style={fullStyle}>
          <div className="st-player">
            {videoSrc ? (
              <iframe
                ref={videoPlayerRef}
                src={videoSrc}
                title="설교 영상"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onLoad={handleVideoLoad}
              />
            ) : (
              // 유튜브 썸네일은 매주 같은 'LIVE' 템플릿이라 표지는 계절 교회 사진 + 본문으로 만든다
              <button type="button" className="st-cover" onClick={() => startVideo()} aria-label="설교 영상 재생">
                <img src={coverPhoto} alt="" decoding="async" />
                <span className="st-cover-text">
                  <span className="st-cover-ref">{heading}</span>
                  <span className="st-cover-by">{sermon.pastor}</span>
                </span>
                <span className="st-cover-play"><PlayGlyph /></span>
              </button>
            )}
          </div>
          <div className="st-mini">
            <button type="button" className="st-mini-text" onClick={backToFull}>
              <b>{heading}</b>
              <span>{sermon.pastor}</span>
            </button>
            {videoSrc && (
              <button type="button" className="st-icon" aria-label={paused ? '재생' : '일시정지'} onClick={togglePause}>
                <Icon n={paused ? 'play_arrow' : 'pause'} />
              </button>
            )}
            <button type="button" className="st-icon" aria-label="크게 보기" title="크게 보기" onClick={backToFull}>
              <Icon n="open_in_full" />
            </button>
            {floating && (
              <button type="button" className="st-icon" aria-label="닫기" title="닫기" onClick={onClose}>
                <Icon n="close" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 삭제 확인 */}
      {showDeleteConfirm && (
        <div className="sermon-delete-confirm-overlay">
          <div className="sermon-delete-confirm-modal">
            <h3 className="sermon-delete-confirm-title">설교 삭제</h3>
            <p className="sermon-delete-confirm-text">
              이 설교를 삭제하시겠습니까? 음성 파일도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="sermon-delete-confirm-actions">
              <button onClick={() => setShowDeleteConfirm(false)} className="sermon-delete-confirm-cancel">
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteSermonMutation.isPending}
                className="sermon-delete-confirm-delete"
              >
                {deleteSermonMutation.isPending ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SermonDetail
