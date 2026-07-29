// 타임캡슐 상세/개봉 (/capsule/:id)
// - 개봉 전: 봉인된 봉투 + D-day (내용은 서버가 내려주지 않는다)
// - 개봉 가능: 봉투 뜯는 연출 → 편지(글·음성·봉인한 날의 스냅샷)
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
  EnvelopeGlyph,
  Icon,
  LockShackle,
  MicGlyph,
  PhotoGlyph,
} from './capsuleIcons'
import './capsule.css'

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

/** 음성 길이 표기: 60초 미만은 "45초", 그 이상은 "2분 30초" */
const formatAudioDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}초`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}분 ${s}초` : `${m}분`
}

const senderLine = (capsule: CapsuleDetail): string => {
  if (capsule.role === 'self') return '과거의 나로부터'
  if (capsule.role === 'recipient') return `${capsule.sender_name}님으로부터`
  return `${capsule.recipient_name || '소중한 분'}에게 보낸 캡슐`
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
    if (!window.confirm('이 캡슐을 삭제할까요? 되돌릴 수 없어요.')) return
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
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-12">
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

        {isLoading && (
          <div className="mx-4 mt-6 h-72 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        )}

        {(error || (!isLoading && !capsule)) && (
          <div className="text-center pt-24 px-6">
            <span className="text-5xl block mb-4">😢</span>
            <p className="text-[15px] font-bold">캡슐을 찾을 수 없어요</p>
            <button
              type="button"
              onClick={() => navigate('/capsule')}
              className="mt-6 px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold"
            >
              캡슐함으로
            </button>
          </div>
        )}

        {capsule && phase !== 'letter' && (
          <div className="px-6 pt-10 text-center">
            {/* 봉투는 "열 수 있다"는 신호다 — 잠긴 캡슐엔 봉인 다이얼만 보여준다 */}
            {capsule.openable ? (
              <div
                className={`capsule-envelope ${
                  phase === 'opening' ? 'capsule-envelope--opening' : 'capsule-envelope--sealed'
                }`}
              >
                <div className="capsule-envelope__letter" />
                <div className="capsule-envelope__body" />
                <div className="capsule-envelope__flap" />
                <span className="capsule-envelope__seal">
                  <Icon size={20}>
                    <LockShackle open />
                  </Icon>
                </span>
              </div>
            ) : (
              <SealDial sealedAt={capsule.sealed_at} openAt={capsule.open_at} />
            )}

            <p className="mt-9 text-[12.5px] font-bold text-[var(--text-muted)]">
              {senderLine(capsule)}
            </p>
            <h2 className="text-[20px] font-extrabold mt-1.5 break-keep">
              {capsule.title ||
                (capsule.openable ? '캡슐이 도착했어요' : '봉인된 타임캡슐')}
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

            {capsule.openable ? (
              <button
                type="button"
                onClick={handleOpen}
                disabled={openCapsule.isPending || phase === 'opening'}
                className="mt-8 w-full py-4 rounded-2xl bg-brand text-white text-[15.5px] font-extrabold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <Icon size={18}>
                  <EnvelopeGlyph />
                </Icon>
                {phase === 'opening' ? '봉투를 여는 중...' : '봉투 열기'}
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {/* 편지 */}
        {capsule && phase === 'letter' && content && (
          <div className="px-4 pt-6">
            <div className="capsule-letter-enter rounded-[24px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm overflow-hidden">
              {/* 편지 머리 */}
              <div className="px-6 pt-6 pb-4 border-b border-dashed border-gray-200 dark:border-white/[0.08]">
                <p className="text-[12px] font-bold text-[var(--text-muted)]">
                  {senderLine(capsule)}
                </p>
                <h2 className="text-[19px] font-extrabold mt-1 break-keep leading-[1.4]">
                  {content.title || capsule.title || '봉인됐던 편지'}
                </h2>
                <p className="text-[11.5px] text-gray-400 dark:text-white/40 mt-1.5">
                  {formatKoreanDate(capsule.sealed_at)} 봉인 →{' '}
                  {formatKoreanDate(capsule.open_at)} 개봉
                </p>
              </div>

              {/* 본문 */}
              {content.message && (
                <p className="px-6 py-5 text-[14.5px] leading-[1.9] whitespace-pre-wrap break-keep text-gray-800 dark:text-white/85">
                  {content.message}
                </p>
              )}

              {/* 음성 */}
              {content.audio_url && (
                <div className="px-6 pb-5 pt-1">
                  <p className="text-[12px] font-bold text-[var(--text-muted)] mb-2">
                    🎙️ 그날의 목소리
                    {content.audio_duration ? ` · ${formatAudioDuration(content.audio_duration)}` : ''}
                  </p>
                  <audio controls src={content.audio_url} className="w-full" preload="metadata" />
                </div>
              )}

              {/* 사진 — 봉인됐던 인화지가 이제야 현상된다 */}
              {photos.length > 0 && (
                <div className="px-6 pb-7 pt-2">
                  <p className="text-[12px] font-bold text-[var(--text-muted)] mb-4">
                    📷 그날의 사진 · 지금 막 인화되고 있어요
                  </p>
                  <div className="flex flex-col items-center gap-6">
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
                      className="mt-6 w-full py-3.5 rounded-2xl bg-gray-900 dark:bg-white/[0.1] text-white text-[14px] font-bold inline-flex items-center justify-center gap-2"
                    >
                      🎞️ 목소리 들으며 사진 보기
                    </button>
                  )}
                </div>
              )}
            </div>

            {showSlideshow && content.audio_url && (
              <CapsuleSlideshow
                photos={photos}
                audioUrl={content.audio_url}
                audioDuration={content.audio_duration}
                senderLine={senderLine(capsule)}
                onClose={() => setShowSlideshow(false)}
              />
            )}

            {/* 봉인하던 그날 스냅샷 */}
            {snapshot && (
              <div className="capsule-letter-enter capsule-letter-enter--delayed mt-4 rounded-[24px] bg-[var(--brand-soft)] px-6 py-5">
                <p className="text-[12px] font-bold text-brand">
                  🗓️ 봉인하던 그날 — {snapshot.sealed_date ? formatKoreanDate(snapshot.sealed_date) : ''}
                  {snapshot.season_label ? ` · ${snapshot.season_label}` : ''}
                </p>
                {snapshot.verse_text && (
                  <p className="mt-2.5 text-[13.5px] leading-[1.8] text-gray-800 dark:text-white/85 break-keep">
                    “{snapshot.verse_text}”
                    {snapshot.verse_reference && (
                      <span className="block mt-1 text-[12px] text-gray-500 dark:text-white/50">
                        — {snapshot.verse_reference}
                      </span>
                    )}
                  </p>
                )}
                {stats && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {stats.meditation_streak != null && stats.meditation_streak > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/[0.08] text-[11.5px] font-bold text-gray-700 dark:text-white/70">
                        🔥 묵상 {stats.meditation_streak}일 연속 중
                      </span>
                    )}
                    {stats.verses_read != null && stats.verses_read > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/[0.08] text-[11.5px] font-bold text-gray-700 dark:text-white/70">
                        📖 말씀 {stats.verses_read.toLocaleString()}절
                      </span>
                    )}
                    {stats.prayers != null && stats.prayers > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/[0.08] text-[11.5px] font-bold text-gray-700 dark:text-white/70">
                        🙏 기도 {stats.prayers}개
                      </span>
                    )}
                    {stats.thanks != null && stats.thanks > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/[0.08] text-[11.5px] font-bold text-gray-700 dark:text-white/70">
                        💛 감사 {stats.thanks}개
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 답장 체인 — 개봉이 다음 봉인의 입구 */}
            <div className="capsule-letter-enter capsule-letter-enter--delayed mt-5 text-center">
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
