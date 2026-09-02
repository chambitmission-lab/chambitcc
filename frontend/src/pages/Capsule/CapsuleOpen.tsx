// 타임캡슐 상세/개봉 (/capsule/:id)
// - 개봉 전: 봉인된 봉투 + D-day (내용은 서버가 내려주지 않는다)
// - 개봉 가능: 밤하늘에 내려앉은 우편물 → 인장 뜯기 → 편지(글·음성·스냅샷)
// - 읽은 뒤: 답장 캡슐 이어쓰기 CTA (개봉이 다음 봉인의 입구)
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCapsule, useDeleteCapsule, useOpenCapsule } from '../../hooks/useTimeCapsule'
import type { CapsuleDetail, CapsulePhoto } from '../../types/timeCapsule'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import CapsuleSlideshow from './CapsuleSlideshow'
import { daysSealed, daysUntil, formatKoreanDate, sealProgress } from './capsuleDates'
import {
  CalendarGlyph,
  Icon,
  LockShackle,
  MicGlyph,
  PhotoGlyph,
  SigilGlyph,
} from './capsuleIcons'
import './capsule.css'
import { confirmDialog } from '../../utils/confirmDialog'

type Phase = 'sealed' | 'opening' | 'letter'

// 작성 화면과 같은 규칙의 기울기 — 편지지 위에 놓인 인화지 느낌
const POLAROID_TILTS = ['-2.2deg', '2.4deg', '-1.4deg']

/** 필름 카메라 날짜 각인: 2025-07-26 → '25 7 26 */
const filmStamp = (dateStr: string): string => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return `'${String(d.getFullYear()).slice(2)} ${d.getMonth() + 1} ${d.getDate()}`
}

/** 화면에 들어오고 이미지 로드가 끝나면 서서히 인화되는 폴라로이드 */
const DevelopingPolaroid = ({
  photo,
  tilt,
  stamp,
}: {
  photo: CapsulePhoto
  tilt: string
  stamp: string
}) => {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const developed = visible && loaded
  return (
    <figure
      ref={ref}
      className={`capsule-polaroid ${developed ? 'capsule-polaroid--developed' : ''}`}
      style={{ transform: `rotate(${tilt})` }}
    >
      {/* 편지지에 마스킹테이프로 붙여둔 인화지 */}
      <i className="capsule-polaroid__tape" aria-hidden />
      <div className="capsule-polaroid__img-wrap">
        <img
          src={photo.url}
          alt={photo.caption || '캡슐에 동봉된 사진'}
          className="capsule-polaroid__img"
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
        {stamp && <span className="capsule-polaroid__stamp">{stamp}</span>}
      </div>
      {photo.caption && (
        <figcaption className="capsule-polaroid__caption">{photo.caption}</figcaption>
      )}
    </figure>
  )
}

/** 봉인 정보 칩 — 이모지 나열 대신 한 줄로 정리 */
const MetaChip = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[12px] font-bold text-gray-600 dark:text-white/60">
    <Icon>{icon}</Icon>
    {children}
  </span>
)

/* ── 봉인 다이얼 ──────────────────────────────────────────────
   눈금 60개는 요소가 아니라 dasharray로 그린다.
   stroke-width가 반지름 방향이므로 짧은 dash = 방사형 눈금. */
const DIAL = 208
const TICK_R = 98
const ARC_R = 86
const TICK_LEN = 2 * Math.PI * TICK_R
const ARC_LEN = 2 * Math.PI * ARC_R
const TICK_GAP = TICK_LEN / 60

const SealDial = ({ sealedAt, openAt }: { sealedAt: string; openAt: string }) => {
  const progress = sealProgress(sealedAt, openAt)
  return (
    <div className="capsule-dial">
      <div className="capsule-dial__halo" />
      <svg className="capsule-dial__svg" viewBox={`0 0 ${DIAL} ${DIAL}`}>
        <circle
          className="capsule-dial__ticks"
          cx={DIAL / 2}
          cy={DIAL / 2}
          r={TICK_R}
          fill="none"
          strokeWidth={7}
          strokeDasharray={`${(TICK_GAP * 0.2).toFixed(2)} ${(TICK_GAP * 0.8).toFixed(2)}`}
        />
        <circle
          className="capsule-dial__track"
          cx={DIAL / 2}
          cy={DIAL / 2}
          r={ARC_R}
          fill="none"
          strokeWidth={4.5}
        />
        <circle
          className="capsule-dial__arc"
          cx={DIAL / 2}
          cy={DIAL / 2}
          r={ARC_R}
          fill="none"
          strokeWidth={4.5}
          strokeDasharray={ARC_LEN}
          strokeDashoffset={ARC_LEN * (1 - progress)}
        />
      </svg>
      <div className="capsule-dial__core">
        <span className="capsule-dial__lock">
          <Icon size={17}>
            <LockShackle />
          </Icon>
        </span>
        <span className="capsule-dial__label">개봉까지</span>
        <span className="capsule-dial__dday">D-{daysUntil(openAt)}</span>
        <span className="capsule-dial__elapsed">봉인 {daysSealed(sealedAt)}일째</span>
      </div>
    </div>
  )
}

/** 봉인된 편지 프리뷰 — 내용을 못 받는다는 사실 자체를 화면 언어로 쓴다 */
const REDACTED_WIDTHS = ['100%', '93%', '76%', '88%', '48%']

const SealedLetterPreview = ({ capsule }: { capsule: CapsuleDetail }) => (
  <div className="capsule-redacted">
    <p className="capsule-redacted__label">
      <Icon size={13}>
        <LockShackle />
      </Icon>
      봉인된 편지
    </p>
    <div className="capsule-redacted__lines" aria-hidden>
      {REDACTED_WIDTHS.map((w) => (
        <span key={w} className="capsule-redacted__line" style={{ width: w }} />
      ))}
    </div>
    {(capsule.photo_count ?? 0) > 0 && (
      <div className="capsule-redacted__strip" aria-hidden>
        {Array.from({ length: Math.min(capsule.photo_count ?? 0, 4) }).map((_, i) => (
          <span key={i} className="capsule-redacted__thumb" />
        ))}
      </div>
    )}
    <p className="capsule-redacted__foot">
      {formatKoreanDate(capsule.open_at)}
      {capsule.open_label ? ` (${capsule.open_label})` : ''} 아침에 열려요
    </p>
  </div>
)

const capsuleInviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/capsule/invite/${code}`

/** 카세트 카운터 표기: 83초 → 1:23 */
const fmtClock = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/* ── 그날의 목소리 = 카세트 테이프 ────────────────────────────────
   네이티브 <audio> 컨트롤은 편지지 위에 놓인 순간 "앱 UI"로 돌아가 버린다.
   음성이 봉인되던 시절의 물성 — 릴이 돌고 테이프가 왼쪽에서 오른쪽으로
   감겨 가는 카세트 — 로 그려서 소리에도 세월의 질감을 입힌다. */

/** 릴 하나 — 가운데 톱니 허브가 돌고, 감긴 테이프(어두운 원)는 재생에 따라 두께가 변한다 */
const TapeReel = ({ spinning, tapeR }: { spinning: boolean; tapeR: number }) => (
  <svg viewBox="0 0 36 36" className="capsule-tape__reel" aria-hidden>
    <circle cx="18" cy="18" r={tapeR} fill="#171310" />
    <circle
      className={`capsule-tape__hub ${spinning ? 'capsule-tape__hub--spin' : ''}`}
      cx="18"
      cy="18"
      r="6.5"
      fill="none"
      stroke="#f4ecdb"
      strokeWidth="2.6"
      strokeDasharray="3.1 3.7"
    />
    <circle cx="18" cy="18" r="2.1" fill="#f4ecdb" opacity="0.9" />
  </svg>
)

const VoiceTape = ({ src, duration }: { src: string; duration: number | null }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [now, setNow] = useState(0)
  const [total, setTotal] = useState(duration ?? 0)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }

  const seekBy = (delta: number) => {
    const el = audioRef.current
    if (!el || !total) return
    el.currentTime = Math.min(total, Math.max(0, el.currentTime + delta))
    setNow(el.currentTime)
  }

  const seekTo = (clientX: number) => {
    const el = audioRef.current
    const bar = barRef.current
    if (!el || !bar || !total) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    el.currentTime = ratio * total
    setNow(el.currentTime)
  }

  const progress = total > 0 ? Math.min(1, now / total) : 0

  return (
    <div className="capsule-tape">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setNow(0)}
        onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration
          if (Number.isFinite(d) && d > 0) setTotal(d)
        }}
      />
      <button
        type="button"
        className="capsule-tape__hit"
        onClick={toggle}
        aria-label={playing ? '음성 편지 일시정지' : '음성 편지 재생'}
      >
        <span className="capsule-tape__strip">
          <b>그날의 목소리</b>
          <i>
            {fmtClock(now)} / {total > 0 ? fmtClock(total) : '--:--'}
          </i>
        </span>
        <span className="capsule-tape__window">
          {/* 테이프는 왼쪽 릴에서 풀려 오른쪽 릴로 감긴다 */}
          <TapeReel spinning={playing} tapeR={8 + 7 * (1 - progress)} />
          <span className="capsule-tape__toggle" aria-hidden>
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
                <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.2 5.4c0-1 1.1-1.6 2-1.1l9.4 6.1c.8.5.8 1.7 0 2.2l-9.4 6.1c-.9.5-2-.1-2-1.1V5.4Z" />
              </svg>
            )}
          </span>
          <TapeReel spinning={playing} tapeR={8 + 7 * progress} />
        </span>
      </button>
      <div
        ref={barRef}
        className="capsule-tape__track"
        role="slider"
        tabIndex={0}
        aria-label="재생 위치"
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(now)}
        aria-valuetext={fmtClock(now)}
        onPointerDown={(e) => seekTo(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            seekBy(-5)
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            seekBy(5)
          }
        }}
      >
        <i style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}

const senderLine = (capsule: CapsuleDetail): string => {
  if (capsule.role === 'self') return '과거의 나로부터'
  if (capsule.role === 'recipient') return `${capsule.sender_name}님으로부터`
  return `${capsule.recipient_name || '소중한 분'}에게 보낸 캡슐`
}

/** 봉투에 손글씨로 적히는 수취인 */
const addressTo = (capsule: CapsuleDetail): string => {
  if (capsule.role === 'self') return '미래의 나'
  return capsule.recipient_name || '당신'
}

/** 편지 끝 서명 — 편지는 "~로부터" 머리말이 아니라 손글씨 서명으로 끝난다 */
const signatureFrom = (capsule: CapsuleDetail): string => {
  if (capsule.role === 'self') return '과거의 나'
  if (capsule.role === 'recipient') return capsule.sender_name || '보낸 사람'
  return '그날의 나'
}

/** 소인 각인: 2026-07-29 → { year: "'26", day: "7 · 29" } — 초대장 소인과 같은 규칙 */
const postmark = (dateStr: string): { year: string; day: string } => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return { year: '', day: '' }
  return {
    year: `'${String(d.getFullYear()).slice(2)}`,
    day: `${d.getMonth() + 1} · ${d.getDate()}`,
  }
}

/** 편지가 여행한 날수 — 봉인일→개봉일. 읽는 시점(오늘)이 아니다:
    도착한 편지를 열흘 뒤에 다시 읽어도 여행이 길어지지 않는다.
    (목록의 "N일을 건너온 마음"과 같은 기준) */
const journeyDays = (sealedAt: string, openAt: string): number => {
  const sealed = new Date(sealedAt)
  const open = new Date(openAt)
  if (Number.isNaN(sealed.getTime()) || Number.isNaN(open.getTime())) return 0
  const a = new Date(sealed.getFullYear(), sealed.getMonth(), sealed.getDate()).getTime()
  const b = new Date(open.getFullYear(), open.getMonth(), open.getDate()).getTime()
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

/** 건너온 시간 — 이 편지의 감정선. 날짜 사실("7월 29일 봉인")보다 먼저 읽혀야 한다. */
const journeyLine = (sealedAt: string, openAt: string): string => {
  const days = journeyDays(sealedAt, openAt)
  if (days === 0) return '오늘 봉인해 오늘 도착한 편지예요'
  if (days < 365) return `${days.toLocaleString()}일을 건너 도착했어요`
  const years = Math.floor(days / 365)
  return `${years}년 ${(days - years * 365).toLocaleString()}일, ${days.toLocaleString()}일을 건너왔어요`
}

/** 편지지 위 밤하늘의 내레이션 — 앱의 목소리는 편지 밖에서만 말한다.
    봉인일 사실은 소인·서명에도 있지만, 여기서 감정선과 한 문장으로 묶는다 */
const arrivalNarration = (sealedAt: string, openAt: string): string => {
  if (journeyDays(sealedAt, openAt) === 0) return journeyLine(sealedAt, openAt)
  return `${formatKoreanDate(sealedAt)}에 봉인되어, ${journeyLine(sealedAt, openAt)}`
}

/* ── 도착한 캡슐 = 밀랍 인장을 직접 뜯는 우편물 ────────────────────
   파란 버튼 한 번으로 끝내면 기대감이 쌓일 틈이 없다. 인장을 1초간 꾹 누르는
   동안 링이 차오르고 밀랍이 버티다 갈라지는 시간이 이 화면의 감정이다.
   (키보드·보조기기는 Enter/Space로 즉시 개봉 — 꾹 누르기는 촉감이지 관문이 아니다) */
const HOLD_MS = 1000
const BYPASS_AFTER_MS = 9000

const ArrivalEnvelope = ({
  capsule,
  opening,
  onOpen,
}: {
  capsule: CapsuleDetail
  opening: boolean
  onOpen: () => void
}) => {
  const [holding, setHolding] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [bypass, setBypass] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const nudgeTimer = useRef<number | undefined>(undefined)

  const mark = postmark(capsule.sealed_at)
  const hasPhoto = (capsule.photo_count ?? 0) > 0

  useEffect(() => {
    const t = window.setTimeout(() => setBypass(true), BYPASS_AFTER_MS)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(timer.current)
      window.clearTimeout(nudgeTimer.current)
    }
  }, [])

  const startHold = () => {
    if (opening || timer.current !== undefined) return
    setHolding(true)
    // 밀랍에 손이 닿은 순간의 촉감 (미지원 브라우저는 조용히 무시)
    navigator.vibrate?.(10)
    timer.current = window.setTimeout(() => {
      timer.current = undefined
      setHolding(false)
      onOpen()
    }, HOLD_MS)
  }

  // 다 누르기 전에 손을 뗐다 — 밀랍이 다시 굳고, 안내가 흔들려 알려준다
  const abortHold = () => {
    if (timer.current === undefined) return
    window.clearTimeout(timer.current)
    timer.current = undefined
    setHolding(false)
    setNudge(true)
    window.clearTimeout(nudgeTimer.current)
    nudgeTimer.current = window.setTimeout(() => setNudge(false), 700)
  }

  return (
    <>
      {/* 부유 애니메이션은 클래스를 떼지 않고 --opening에서 정지시킨다.
          중간에 떼면 봉투가 원위치로 톡 떨어지듯 튄다. */}
      <div className="capsule-mailpiece capsule-mailpiece--idle">
        {/* 봉투 밖으로 삐져나온 것들 — 안에 뭔가 들어 있다 */}
        {hasPhoto && (
          <span className="capsule-mailpiece__peek capsule-mailpiece__peek--photo" aria-hidden>
            <i />
          </span>
        )}
        <span className="capsule-mailpiece__peek capsule-mailpiece__peek--paper" aria-hidden />

        {/* 개봉 연출에서 솟아오르는 속지 (몸통 뒤에 숨어 있다) */}
        <div className="capsule-mailpiece__letter" aria-hidden />

        <div className="capsule-mailpiece__body">
          <span className="capsule-mailpiece__air" aria-hidden />
        </div>
        <div className="capsule-mailpiece__flap" aria-hidden />

        <span className="capsule-mailpiece__stamp" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
            <SigilGlyph />
          </svg>
        </span>
        <span className="capsule-mailpiece__postmark" aria-hidden>
          <b>{mark.year}</b>
          <i>{mark.day}</i>
          <em>SEALED</em>
        </span>
        <p className="capsule-mailpiece__to">
          To. <b>{addressTo(capsule)}</b>
        </p>

        <button
          type="button"
          className={`capsule-wax ${holding ? 'capsule-wax--holding' : ''} ${
            opening ? 'capsule-wax--released' : ''
          }`}
          onPointerDown={startHold}
          onPointerUp={abortHold}
          onPointerLeave={abortHold}
          onPointerCancel={abortHold}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen()
            }
          }}
          disabled={opening}
          aria-label="밀랍 인장을 꾹 눌러 봉투 뜯기"
        >
          <span className="capsule-wax__disc">
            <span className="capsule-wax__half capsule-wax__half--l" />
            <span className="capsule-wax__half capsule-wax__half--r" />
            <span className="capsule-wax__glare" aria-hidden />
            <span className="capsule-wax__sigil">
              <Icon size={19}>
                <LockShackle open />
              </Icon>
            </span>
          </span>
          <svg className="capsule-wax__ring" viewBox="0 0 72 72" aria-hidden>
            <circle cx="36" cy="36" r="34" />
          </svg>
        </button>
      </div>

      <div className="mt-7">
        {opening ? (
          <span className="capsule-arrival__hint">봉인이 풀렸어요</span>
        ) : (
          <span className={`capsule-arrival__hint ${nudge ? 'capsule-arrival__hint--nudge' : ''}`}>
            <i aria-hidden />
            {nudge ? '떼지 말고 조금만 더 —' : '인장을 꾹 눌러 뜯어주세요'}
          </span>
        )}
      </div>

      {bypass && !opening && (
        <div className="mt-3.5">
          <button type="button" className="capsule-arrival__bypass" onClick={onOpen}>
            바로 열기
          </button>
        </div>
      )}
    </>
  )
}

const CapsuleOpen = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const capsuleId = Number(id)

  const { data: capsule, isLoading, error } = useCapsule(capsuleId, isAuthenticated())
  const openCapsule = useOpenCapsule(capsuleId)
  const deleteCapsule = useDeleteCapsule()
  const [phase, setPhase] = useState<Phase>('sealed')
  const [showSlideshow, setShowSlideshow] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/capsule/${id}`)
      navigate('/login')
    }
  }, [id, navigate])

  // 이미 개봉한 캡슐(재열람)은 연출 없이 바로 편지를 보여준다
  useEffect(() => {
    if (capsule?.openable && capsule.opened_at && phase === 'sealed') {
      setPhase('letter')
    }
  }, [capsule, phase])

  const handleOpen = async () => {
    try {
      await openCapsule.mutateAsync()
      // 봉투가 뜯기는 순간의 촉감 — 미지원 브라우저(iOS Safari)는 조용히 무시
      navigator.vibrate?.([28, 45, 34])
      setPhase('opening')
      // 봉투 연출이 끝나면 편지로 전환
      window.setTimeout(() => setPhase('letter'), 1700)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '아직 캡슐을 열 수 없습니다', 'error')
    }
  }

  const handleDelete = async () => {
    if (
      !(await confirmDialog({
        title: '타임캡슐 삭제',
        message: '이 캡슐을 삭제할까요?',
        description: '한 번 삭제하면 되돌릴 수 없어요.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteCapsule.mutateAsync(capsuleId)
      showToast('캡슐을 삭제했어요', 'success')
      navigate('/capsule', { replace: true })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleShare = async () => {
    if (!capsule?.invite_code) return
    const url = capsuleInviteUrl(capsule.invite_code)
    const text = `🕰️ ${capsule.recipient_name || '당신'}에게 보내는 타임캡슐이에요.\n${formatKoreanDate(
      capsule.open_at,
    )}${capsule.open_label ? ` (${capsule.open_label})` : ''}에 열려요.`
    if (navigator.share) {
      try {
        // text에 URL을 넣고 url도 함께 넘기면 공유 대상 앱이 링크를 두 번 붙임
        await navigator.share({ title: '타임캡슐 초대장', text, url })
        return
      } catch {
        return
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`)
      showToast('초대 링크를 복사했어요', 'success')
    } catch {
      showToast('링크 복사에 실패했어요', 'error')
    }
  }

  const content = capsule?.content ?? null
  const snapshot = content?.snapshot ?? null
  const stats = snapshot?.stats ?? null
  // 배포 전 캐시 응답에는 photos가 없을 수 있다
  const photos = content?.photos ?? []

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-12 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/capsule')}
            className="p-1 -ml-1 text-gray-700 dark:text-white/80"
            aria-label="캡슐함으로"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-[16px] font-extrabold flex-1">타임캡슐</h1>
          {capsule && capsule.role !== 'recipient' && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-[12.5px] font-bold text-gray-400 dark:text-white/40"
            >
              삭제
            </button>
          )}
        </div>

        {/* 다크 모드에서 4%짜리 블록 하나만 두면 그냥 검은 화면으로 읽힌다 —
            불러오는 중이라는 게 보이도록 대비를 올리고 형태를 잡아둔다 */}
        {isLoading && (
          <div className="mx-4 mt-6 space-y-3">
            <div className="h-64 rounded-3xl bg-gray-100/70 dark:bg-white/[0.07] animate-pulse" />
            <div className="h-4 w-1/2 mx-auto rounded-full bg-gray-100/70 dark:bg-white/[0.07] animate-pulse" />
            <div className="h-4 w-2/3 mx-auto rounded-full bg-gray-100/70 dark:bg-white/[0.05] animate-pulse" />
          </div>
        )}

        {(error || (!isLoading && !capsule)) && (
          <div className="text-center pt-24 px-6">
            <span className="text-5xl block mb-4">😢</span>
            <p className="text-[15px] font-bold">삭제되었거나 볼 수 없는 캡슐이에요</p>
            <p className="mt-2 text-[13px] text-gray-500 dark:text-white/45 leading-[1.7]">
              보낸 사람이 캡슐을 지웠을 수 있어요. 알림은 남아 있어도 내용은 열 수 없습니다.
            </p>
            <button
              type="button"
              onClick={() => navigate('/capsule')}
              className="mt-6 px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold"
            >
              캡슐함으로
            </button>
          </div>
        )}

        {/* 개봉 가능 — 밤하늘에서 내려앉은 우편물 한 통.
            "열어보고 싶은 마음"은 파란 버튼이 아니라 봉투의 재질과 뜯는 동작에서 온다. */}
        {capsule && phase !== 'letter' && capsule.openable && (
          <div className={`capsule-arrival ${phase === 'opening' ? 'capsule-arrival--opening' : ''}`}>
            <span className="capsule-arrival__bloom" aria-hidden />
            <div className="capsule-arrival__inner px-6 pt-6 pb-10 text-center">
              <p className="capsule-invite__eyebrow pb-7 text-[11px] font-bold tracking-[0.3em]">
                {capsule.role === 'recipient' ? '편지가 도착했어요' : '오늘 열 수 있어요'}
              </p>

              <ArrivalEnvelope
                capsule={capsule}
                opening={phase === 'opening' || openCapsule.isPending}
                onOpen={handleOpen}
              />

              <p className="mt-9 text-[12.5px] font-bold text-[var(--text-muted)]">
                {senderLine(capsule)}
              </p>
              <h2 className="text-[21px] font-extrabold mt-1.5 break-keep">
                {capsule.title || '캡슐이 도착했어요'}
              </h2>
              <p className="mt-2 text-[13px] font-bold text-brand">
                {journeyLine(capsule.sealed_at, capsule.open_at)}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                <MetaChip icon={<CalendarGlyph />}>
                  {formatKoreanDate(capsule.sealed_at)} 봉인
                </MetaChip>
                {(capsule.photo_count ?? 0) > 0 && (
                  <MetaChip icon={<PhotoGlyph />}>사진 {capsule.photo_count}장</MetaChip>
                )}
                {capsule.has_audio && <MetaChip icon={<MicGlyph />}>음성 편지</MetaChip>}
              </div>
            </div>
          </div>
        )}

        {/* 아직 못 여는 캡슐 — 봉투는 "열 수 있다"는 신호라서 다이얼만 보여준다 */}
        {capsule && phase !== 'letter' && !capsule.openable && (
          <div className="px-6 pt-10 text-center">
            <SealDial sealedAt={capsule.sealed_at} openAt={capsule.open_at} />

            <p className="mt-9 text-[12.5px] font-bold text-[var(--text-muted)]">
              {senderLine(capsule)}
            </p>
            <h2 className="text-[20px] font-extrabold mt-1.5 break-keep">
              {capsule.title || '봉인된 타임캡슐'}
            </h2>

            <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
              <MetaChip icon={<CalendarGlyph />}>
                {formatKoreanDate(capsule.sealed_at)} 봉인
              </MetaChip>
              {(capsule.photo_count ?? 0) > 0 && (
                <MetaChip icon={<PhotoGlyph />}>사진 {capsule.photo_count}장</MetaChip>
              )}
              {capsule.has_audio && <MetaChip icon={<MicGlyph />}>음성 편지</MetaChip>}
            </div>

            <div className="mt-7">
              <SealedLetterPreview capsule={capsule} />
            </div>
            <p className="text-[12.5px] text-gray-400 dark:text-white/40 mt-4 leading-[1.7]">
              그날까지는 누구도 — 쓴 사람도 — 열어볼 수 없어요.
            </p>
            {capsule.role === 'sender' &&
              capsule.capsule_type === 'invite' &&
              capsule.invite_code && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="mt-6 w-full py-3.5 rounded-2xl bg-[var(--brand-soft)] text-brand text-[14px] font-bold"
                >
                  {capsule.claimed ? '받는 분이 등록을 마쳤어요 · 링크 다시 보내기' : '초대 링크 전달하기'}
                </button>
              )}
          </div>
        )}

        {/* 편지 — 봉투에서 방금 꺼낸 크림 편지지.
            봉투·초대장·폴라로이드가 쌓아온 재질 언어(크림 종이·소인·손글씨·밀랍)를
            여기서 끊지 않는다. 앱 카드가 아니라 세 겹으로 접혀 있던 종이 한 장이다. */}
        {capsule && phase === 'letter' && content && (
          <div className="capsule-reading px-4 pt-7">
            {/* 밤하늘의 내레이션 — 편지를 펼치기 전에 집배원이 건네는 한마디 */}
            <p className="capsule-reading__journey capsule-letter-enter">
              {arrivalNarration(capsule.sealed_at, capsule.open_at)}
            </p>
            <article className="capsule-paper capsule-letter-enter">
              {/* 편지 머리 — 뜯긴 인장 자국과 소인 */}
              <header className="capsule-paper__head">
                <div className="capsule-paper__marks">
                  <span className="capsule-paper__remnant" aria-hidden>
                    <Icon size={15}>
                      <SigilGlyph />
                    </Icon>
                  </span>
                  <span className="capsule-paper__postmark" aria-hidden>
                    <b>{postmark(capsule.sealed_at).year}</b>
                    <i>{postmark(capsule.sealed_at).day}</i>
                    <em>SEALED</em>
                  </span>
                </div>

                <p className="capsule-paper__to">
                  To. <b>{addressTo(capsule)}</b>
                </p>
                <h2 className="capsule-paper__title">
                  {content.title || capsule.title || '봉인됐던 편지'}
                </h2>
              </header>

              <div className="capsule-paper__rule" aria-hidden />

              {/* 본문 — 괘선 위에 명조 잉크로. 잉크가 스미듯 반 박자 늦게 떠오른다 */}
              {content.message && <p className="capsule-paper__message">{content.message}</p>}

              {/* 음성 — 릴이 돌아가는 카세트 */}
              {content.audio_url && (
                <div className="mt-7">
                  <VoiceTape src={content.audio_url} duration={content.audio_duration ?? null} />
                </div>
              )}

              {/* 사진 — 봉인됐던 인화지가 이제야 현상된다 */}
              {photos.length > 0 && (
                <div className="mt-8">
                  <p className="capsule-paper__label">
                    <Icon size={13}>
                      <PhotoGlyph />
                    </Icon>
                    동봉된 사진
                    <i>지금 막 인화되는 중</i>
                  </p>
                  <div className="mt-5 flex flex-col items-center gap-7">
                    {photos.map((photo, i) => (
                      <DevelopingPolaroid
                        key={photo.url}
                        photo={photo}
                        tilt={POLAROID_TILTS[i % POLAROID_TILTS.length]}
                        stamp={filmStamp(capsule.sealed_at)}
                      />
                    ))}
                  </div>

                  {/* 피날레 — 그 사람 목소리를 들으며 그날 사진을 본다 */}
                  {content.audio_url && (
                    <button
                      type="button"
                      onClick={() => setShowSlideshow(true)}
                      className="capsule-paper__show"
                    >
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        aria-hidden
                      >
                        <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
                        <path d="M7 5v14M17 5v14M2.5 9.5H7M2.5 14.5H7M17 9.5h4.5M17 14.5h4.5" />
                      </svg>
                      목소리 들으며 사진 보기
                    </button>
                  )}
                </div>
              )}

              {/* 서명 — 편지는 손글씨 이름으로 끝난다 */}
              <footer className="capsule-paper__sign">
                <p className="capsule-paper__sign-close">그날의 마음을 담아,</p>
                <p className="capsule-paper__sign-from">
                  From. <b>{signatureFrom(capsule)}</b>
                </p>
                <p className="capsule-paper__sign-date">
                  {formatKoreanDate(capsule.sealed_at)}에 씀
                </p>
              </footer>
            </article>

            {showSlideshow && content.audio_url && (
              <CapsuleSlideshow
                photos={photos}
                audioUrl={content.audio_url}
                audioDuration={content.audio_duration}
                senderLine={senderLine(capsule)}
                onClose={() => setShowSlideshow(false)}
              />
            )}

            {/* 함께 봉인한 그날의 기도 — 기도→묵상→캡슐 흐름으로 봉인된 캡슐에만 있다.
                편지를 읽은 뒤 "그때 이렇게 기도했었지"를 만나는 순간이 이 카드의 존재 이유 */}
            {snapshot?.prayer && (snapshot.prayer.content || snapshot.prayer.verses?.length) && (
              <aside className="capsule-ps capsule-letter-enter capsule-letter-enter--delayed">
                <span className="capsule-ps__clip" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
                    <path d="M8 8.5v7.8a4 4 0 0 0 8 0V7.2a2.7 2.7 0 1 0-5.4 0v8.6a1.35 1.35 0 0 0 2.7 0V8.5" />
                  </svg>
                </span>
                <p className="capsule-ps__label">
                  🙏 함께 봉인한 그날의 기도
                  {snapshot.prayer.title ? ` · ${snapshot.prayer.title}` : ''}
                </p>
                {snapshot.prayer.content && (
                  <p className="capsule-ps__verse">{snapshot.prayer.content}</p>
                )}
                {snapshot.prayer.verses && snapshot.prayer.verses.length > 0 && (
                  <>
                    <p className="capsule-ps__label" style={{ marginTop: 14 }}>
                      그날 붙들었던 말씀
                    </p>
                    <p className="capsule-ps__verse">
                      “{snapshot.prayer.verses[0].text}”
                      <span className="capsule-ps__ref">
                        — {snapshot.prayer.verses[0].reference}
                      </span>
                    </p>
                  </>
                )}
              </aside>
            )}

            {/* P.S. — 편지에 클립으로 끼워둔 그날의 기록 카드 */}
            {snapshot && (
              <aside className="capsule-ps capsule-letter-enter capsule-letter-enter--delayed">
                <span className="capsule-ps__clip" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
                    <path d="M8 8.5v7.8a4 4 0 0 0 8 0V7.2a2.7 2.7 0 1 0-5.4 0v8.6a1.35 1.35 0 0 0 2.7 0V8.5" />
                  </svg>
                </span>
                <p className="capsule-ps__label">
                  P.S. 봉인하던 그날
                  {snapshot.season_label ? ` · ${snapshot.season_label}` : ''}
                </p>
                {snapshot.verse_text && (
                  <p className="capsule-ps__verse">
                    “{snapshot.verse_text}”
                    {snapshot.verse_reference && (
                      <span className="capsule-ps__ref">— {snapshot.verse_reference}</span>
                    )}
                  </p>
                )}
                {stats &&
                  (() => {
                    const bits = [
                      stats.meditation_streak != null &&
                        stats.meditation_streak > 0 &&
                        `묵상 ${stats.meditation_streak}일 연속`,
                      stats.verses_read != null &&
                        stats.verses_read > 0 &&
                        `말씀 ${stats.verses_read.toLocaleString()}절`,
                      stats.prayers != null && stats.prayers > 0 && `기도 ${stats.prayers}개`,
                      stats.thanks != null && stats.thanks > 0 && `감사 ${stats.thanks}개`,
                    ].filter(Boolean)
                    return bits.length > 0 ? (
                      <p className="capsule-ps__stats">그날의 나 — {bits.join(', ')}</p>
                    ) : null
                  })()}
              </aside>
            )}

            {/* 답장 체인 — 개봉이 다음 봉인의 입구.
                여기부터는 편지가 아니라 앱이다 — 간격을 넉넉히 둬서 세계를 구분한다 */}
            <div className="capsule-letter-enter capsule-letter-enter--delayed mt-9 text-center">
              <p className="text-[12.5px] text-gray-500 dark:text-white/50 leading-[1.7]">
                편지를 읽은 지금의 마음, 그대로 흘려보내긴 아깝지 않나요?
              </p>
              <button
                type="button"
                onClick={() => navigate('/capsule/new')}
                className="mt-3 w-full py-3.5 rounded-2xl bg-brand text-white text-[14.5px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] inline-flex items-center justify-center gap-1.5"
              >
                {/* 봉인된 편지 — CapsuleList 히어로 버튼과 동일한 아이콘으로 통일 */}
                <svg
                  className="w-[18px] h-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="m3.5 6.5 8.5 6 8.5-6" />
                </svg>
                다음 캡슐 이어서 봉인하기
              </button>
              <button
                type="button"
                onClick={() => navigate('/capsule')}
                className="mt-2 w-full py-3 rounded-2xl text-[13.5px] font-bold text-gray-500 dark:text-white/55"
              >
                캡슐함으로
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CapsuleOpen
