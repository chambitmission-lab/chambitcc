// 타임캡슐함 (/capsule)
// 봉인 중인 캡슐(D-day)과 도착한 캡슐을 보여준다. 내용은 개봉 전까지 서버가 내려주지 않는다.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyCapsules } from '../../hooks/useTimeCapsule'
import type { CapsuleSummary } from '../../types/timeCapsule'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { daysUntil, formatKoreanDate } from './capsuleDates'
import capsuleHero from '../../assets/capsule/hero.jpg'
import './capsule.css'

const capsuleInviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/capsule/invite/${code}`

const shareInvite = async (capsule: CapsuleSummary) => {
  if (!capsule.invite_code) return
  const url = capsuleInviteUrl(capsule.invite_code)
  const toName = capsule.recipient_name ? `${capsule.recipient_name}님께` : '당신에게'
  const text = `🕰️ ${toName} 보내는 타임캡슐이 도착 예정이에요.\n${formatKoreanDate(
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
    showToast('초대 링크를 복사했어요. 받는 분께 전해주세요', 'success')
  } catch {
    showToast('링크 복사에 실패했어요', 'error')
  }
}

/** 상대 표시: 누구에게/누구로부터 */
const counterpartLabel = (c: CapsuleSummary): string => {
  if (c.role === 'self') return '미래의 나에게'
  if (c.role === 'sender') return `${c.recipient_name || '소중한 분'}에게 보냄`
  return `${c.sender_name}님이 보냄`
}

/** 밀랍 인장 — 누가 보냈는지는 옆 텍스트가 이미 말한다.
    그래서 인장에는 이름 대신 이 편지가 지금 어떤 상태인지를 새긴다. */
const WaxSeal = ({ state }: { state: 'sealed' | 'new' | 'read' }) => (
  <span className={`capsule-mail__seal capsule-mail__seal--${state}`} aria-hidden>
    <svg
      className="capsule-mail__sigil"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
    >
      <path d="M12 3.5v17M6.6 9.2h10.8" />
    </svg>
  </span>
)

/** 봉인 → 개봉까지 얼마나 왔는지 (0~1) — 기다림의 진행바 */
const waitProgress = (c: CapsuleSummary): number => {
  const sealed = new Date(c.sealed_at).getTime()
  const opened = new Date(c.open_at).getTime()
  if (Number.isNaN(sealed) || Number.isNaN(opened) || opened <= sealed) return 1
  const now = Date.now()
  return Math.min(1, Math.max(0.02, (now - sealed) / (opened - sealed)))
}

const SealedRow = ({ capsule }: { capsule: CapsuleSummary }) => {
  const navigate = useNavigate()
  const dday = daysUntil(capsule.open_at)
  const needsShare =
    capsule.role === 'sender' && capsule.capsule_type === 'invite' && !!capsule.invite_code
  const photos = capsule.photo_count ?? 0
  const progress = waitProgress(capsule)

  return (
    <article className="capsule-mail capsule-mail--sealed">
      <span className="capsule-mail__flap" aria-hidden />
      <button
        type="button"
        onClick={() => navigate(`/capsule/${capsule.id}`)}
        className="capsule-mail__hit"
      >
        <WaxSeal state="sealed" />

        <span className="flex-1 min-w-0">
          <span className="capsule-mail__title">
            {capsule.title || counterpartLabel(capsule)}
          </span>
          <span className="capsule-mail__from">
            {capsule.title ? `${counterpartLabel(capsule)} · ` : ''}
            <span className="capsule-mail__journey">
              {formatKoreanDate(capsule.open_at)} 아침에 열려요
            </span>
          </span>
          <span className="capsule-mail__chips">
            {capsule.open_label && <i className="capsule-mail__chip">✦ {capsule.open_label}</i>}
            {capsule.has_audio && <i className="capsule-mail__chip">🎙️ 음성편지</i>}
            {photos > 0 && <i className="capsule-mail__chip">📷 사진 {photos}장</i>}
          </span>
        </span>

        <span
          className="capsule-mail__dday"
          aria-label={dday > 0 ? `${dday}일 남음` : '오늘 열려요'}
        >
          {dday > 0 ? (
            <>
              <b>D-</b>
              <i>{dday}</i>
            </>
          ) : (
            <b className="capsule-mail__dday--today">오늘</b>
          )}
        </span>
      </button>

      {needsShare && (
        <div className="capsule-mail__foot">
          <span className="capsule-mail__foot-text">
            {capsule.claimed ? '받는 분이 초대를 확인했어요' : '아직 초대장을 전하지 않았어요'}
          </span>
          <button type="button" onClick={() => shareInvite(capsule)} className="capsule-mail__share">
            {capsule.claimed ? '다시 전달' : '초대 전달'}
          </button>
        </div>
      )}

      {/* 봉인부터 개봉까지 — 기다림이 얼마나 흘렀는지 */}
      <span className="capsule-mail__wait" aria-hidden>
        <i style={{ width: `${progress * 100}%` }} />
      </span>
    </article>
  )
}

/** 봉인부터 도착까지 건너온 시간 — 이 편지의 감정선 */
const journeyLabel = (c: CapsuleSummary): string | null => {
  const sealed = new Date(c.sealed_at).getTime()
  const opened = new Date(c.open_at).getTime()
  if (Number.isNaN(sealed) || Number.isNaN(opened)) return null
  const days = Math.round((opened - sealed) / 86_400_000)
  if (days >= 365) return `${Math.floor(days / 365)}년을 건너온 마음`
  if (days >= 28) return `${Math.round(days / 30)}개월을 건너온 마음`
  if (days >= 1) return `${days}일을 건너온 마음`
  return '오늘 봉인해 오늘 도착한 마음'
}

/** 소인(우표)에 찍히는 봉인 날짜 */
const postmarkParts = (iso: string): { year: string; day: string } | null => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return { year: String(d.getFullYear()), day: `${mm}.${dd}` }
}

const ArrivedRow = ({ capsule }: { capsule: CapsuleSummary }) => {
  const navigate = useNavigate()
  const unopened = !capsule.opened_at
  const journey = journeyLabel(capsule)
  const stamp = postmarkParts(capsule.sealed_at)
  const photos = capsule.photo_count ?? 0

  return (
    <article className={`capsule-mail ${unopened ? 'capsule-mail--new' : ''}`}>
      <span className="capsule-mail__flap" aria-hidden />
      <button
        type="button"
        onClick={() => navigate(`/capsule/${capsule.id}`)}
        className="capsule-mail__hit"
      >
        <WaxSeal state={unopened ? 'new' : 'read'} />

        <span className="flex-1 min-w-0">
          <span className="capsule-mail__title">
            {capsule.title || counterpartLabel(capsule)}
          </span>
          <span className="capsule-mail__from">
            {/* 제목이 없으면 제목 자리에 이미 쓰인 문구라 겹치지 않게 뺀다 */}
            {capsule.title ? `${counterpartLabel(capsule)}${journey ? ' · ' : ''}` : ''}
            {journey && <span className="capsule-mail__journey">{journey}</span>}
          </span>
          <span className="capsule-mail__chips">
            {capsule.has_audio && <i className="capsule-mail__chip">🎙️ 음성편지</i>}
            {photos > 0 && <i className="capsule-mail__chip">📷 사진 {photos}장</i>}
            {!unopened && <i className="capsule-mail__chip">읽음</i>}
          </span>
        </span>

        {unopened ? (
          <span className="capsule-mail__cta">
            {/* 글자를 감싸야 빛 스침(::before) 아래로 깔려 씻겨 보이지 않는다 */}
            <span>열어보기</span>
          </span>
        ) : (
          stamp && (
            <span
              className="capsule-mail__postmark"
              aria-label={`${formatKoreanDate(capsule.sealed_at)} 봉인`}
            >
              <b>{stamp.year}</b>
              <i>{stamp.day}</i>
            </span>
          )
        )}
      </button>
    </article>
  )
}

const CapsuleList = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useMyCapsules(isAuthenticated())

  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/capsule')
      navigate('/login')
    }
  }, [navigate])

  const sealed = data?.sealed ?? []
  const arrived = data?.arrived ?? []
  const unreadCount = arrived.filter((c) => !c.opened_at).length
  const nextOpenDday = sealed.length
    ? Math.min(...sealed.map((c) => daysUntil(c.open_at)))
    : null
  const isEmpty = !isLoading && sealed.length === 0 && arrived.length === 0

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-10 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-gray-700 dark:text-white/80"
            aria-label="뒤로"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-[16px] font-extrabold">타임캡슐</h1>
        </div>

        {/* 히어로 */}
        <section className="relative mx-4 mt-5 overflow-hidden rounded-[26px] px-6 py-7 bg-brand shadow-[0_10px_34px_-12px_var(--brand-glow)] text-white">
          {/* 배경 사진(별 쏟아지는 밤하늘) — 은하수·별똥별이 보이는 상단 하늘 위주로 크롭 */}
          <img
            src={capsuleHero}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-[50%_38%] select-none pointer-events-none"
          />
          {/* 스크림 — 사진이 원래 어두워 왼쪽 텍스트 구간만 은은히 눌러준다 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1a38]/75 via-[#122a55]/45 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0c1a38]/60 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
              Time Capsule
            </p>
            <h2 className="text-[21px] font-extrabold tracking-[-0.02em] leading-[1.35] mt-1.5 break-keep">
              미래의 나에게,
              <br />
              사랑하는 이에게
            </h2>
            <p className="text-[12.5px] text-white/80 mt-2 leading-[1.6]">
              오늘의 마음을 봉인하면 정해진 날 아침에 도착해요.
              <br />
              개봉 전엔 나도 열어볼 수 없어요.
            </p>
            <button
              type="button"
              onClick={() => navigate('/capsule/new')}
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-brand text-[13.5px] font-extrabold shadow-sm active:scale-[0.97]"
            >
              {/* 봉인된 편지 — 손+펜 이모지가 사진 히어로 위에서 겉돌아 스트로크 아이콘으로 교체 */}
              <svg
                className="w-4 h-4"
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
              새 캡슐 봉인하기
            </button>
          </div>
        </section>

        {isLoading && (
          <div className="mx-4 mt-5 space-y-3">
            <div className="h-16 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            <div className="h-16 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          </div>
        )}

        {/* 도착한 캡슐 — 우편함 */}
        {arrived.length > 0 && (
          <section className="px-4 pt-7">
            <div className="px-1 mb-2.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
                  도착한 캡슐 {arrived.length}통
                </p>
                <p className="text-[12.5px] mt-1 leading-[1.6] text-[var(--text-body)] break-keep">
                  지난 날 봉인한 마음이 여기 도착해 있어요
                </p>
              </div>
              {unreadCount > 0 && (
                <span className="shrink-0 mt-0.5 px-2.5 py-1 rounded-full bg-[var(--brand-soft-strong)] text-brand text-[11px] font-extrabold">
                  {unreadCount}통 안 읽음
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              {arrived.map((c) => (
                <ArrivedRow key={c.id} capsule={c} />
              ))}
            </div>
          </section>
        )}

        {/* 봉인 중인 캡슐 */}
        {sealed.length > 0 && (
          <section className="px-4 pt-7">
            <div className="px-1 mb-2.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
                  봉인 중인 캡슐 {sealed.length}통
                </p>
                <p className="text-[12.5px] mt-1 leading-[1.6] text-[var(--text-body)] break-keep">
                  아직 아무도 열어볼 수 없어요. 그날까지 조용히 기다립니다
                </p>
              </div>
              {nextOpenDday !== null && (
                <span className="shrink-0 mt-0.5 px-2.5 py-1 rounded-full bg-[var(--surface-inset)] border border-[var(--card-border)] text-[11px] font-extrabold text-[var(--text-body)] tabular-nums">
                  {nextOpenDday > 0 ? `가장 가까운 개봉 D-${nextOpenDday}` : '오늘 열려요'}
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              {sealed.map((c) => (
                <SealedRow key={c.id} capsule={c} />
              ))}
            </div>
            <p className="px-1 mt-2.5 text-[11px] text-[var(--text-muted)] leading-[1.6] break-keep">
              선물 캡슐은 [초대 전달]로 받는 분께 링크를 보내주세요. 개봉일 아침이 되면
              받는 분께 알림이 갑니다.
            </p>
          </section>
        )}

        {/* 빈 상태 */}
        {isEmpty && (
          <div className="mx-4 mt-6 p-8 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] text-center">
            <span className="text-4xl block mb-3">💌</span>
            <p className="text-[14.5px] font-bold text-ink-strong">
              아직 봉인한 캡슐이 없어요
            </p>
            <p className="text-[12.5px] text-gray-500 dark:text-white/50 mt-1.5 leading-[1.6]">
              1년 뒤의 나, 스무 살이 될 아이에게
              <br />
              오늘의 기도와 마음을 남겨보세요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CapsuleList
