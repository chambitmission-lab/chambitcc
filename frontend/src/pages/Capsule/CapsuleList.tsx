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

const SealedRow = ({ capsule }: { capsule: CapsuleSummary }) => {
  const navigate = useNavigate()
  const dday = daysUntil(capsule.open_at)
  const needsShare =
    capsule.role === 'sender' && capsule.capsule_type === 'invite' && !!capsule.invite_code
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <button
        type="button"
        onClick={() => navigate(`/capsule/${capsule.id}`)}
        className="flex-1 min-w-0 flex items-center gap-3 text-left"
      >
        <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center text-[19px]">
          ✉️
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-bold text-gray-900 dark:text-white truncate">
            {capsule.title || counterpartLabel(capsule)}
          </span>
          <span className="block text-[11.5px] text-gray-400 dark:text-white/45 mt-0.5 truncate">
            {counterpartLabel(capsule)} · {formatKoreanDate(capsule.open_at)}
            {capsule.open_label ? ` · ${capsule.open_label}` : ''}
            {capsule.has_audio ? ' · 🎙️' : ''}
            {(capsule.photo_count ?? 0) > 0 ? ' · 📷' : ''}
          </span>
        </span>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.07] text-[12px] font-extrabold text-gray-600 dark:text-white/70 tabular-nums">
          D-{dday}
        </span>
      </button>
      {needsShare && (
        <button
          type="button"
          onClick={() => shareInvite(capsule)}
          className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--brand-soft)] text-brand text-[12px] font-bold"
        >
          {capsule.claimed ? '전달됨' : '전달'}
        </button>
      )}
    </div>
  )
}

const ArrivedRow = ({ capsule }: { capsule: CapsuleSummary }) => {
  const navigate = useNavigate()
  const unopened = !capsule.opened_at
  return (
    <button
      type="button"
      onClick={() => navigate(`/capsule/${capsule.id}`)}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
    >
      <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--amber-soft)] flex items-center justify-center text-[19px]">
        {unopened ? '📬' : '📖'}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-bold text-gray-900 dark:text-white truncate">
          {capsule.title || counterpartLabel(capsule)}
        </span>
        <span className="block text-[11.5px] text-gray-400 dark:text-white/45 mt-0.5 truncate">
          {counterpartLabel(capsule)} · {formatKoreanDate(capsule.sealed_at)} 봉인
          {capsule.has_audio ? ' · 🎙️' : ''}
          {(capsule.photo_count ?? 0) > 0 ? ' · 📷' : ''}
        </span>
      </span>
      {unopened ? (
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-brand text-white text-[12px] font-extrabold animate-pulse">
          열어보기
        </span>
      ) : (
        <span className="shrink-0 text-[12px] font-bold text-gray-400 dark:text-white/40">
          읽음
        </span>
      )}
    </button>
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
  const isEmpty = !isLoading && sealed.length === 0 && arrived.length === 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-10">
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

        {/* 도착한 캡슐 */}
        {arrived.length > 0 && (
          <section className="px-4 pt-6">
            <p className="px-1 mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
              도착한 캡슐
            </p>
            <div className="feed-card rounded-2xl overflow-hidden divide-y divide-[var(--card-border)]">
              {arrived.map((c) => (
                <ArrivedRow key={c.id} capsule={c} />
              ))}
            </div>
          </section>
        )}

        {/* 봉인 중인 캡슐 */}
        {sealed.length > 0 && (
          <section className="px-4 pt-6">
            <p className="px-1 mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
              봉인 중인 캡슐 {sealed.length}개
            </p>
            <div className="feed-card rounded-2xl overflow-hidden divide-y divide-[var(--card-border)]">
              {sealed.map((c) => (
                <SealedRow key={c.id} capsule={c} />
              ))}
            </div>
            <p className="px-1 mt-2 text-[11px] text-gray-400 dark:text-white/35 leading-[1.6]">
              선물 캡슐은 [전달]로 받는 분께 초대 링크를 보내주세요. 개봉일이 되면
              받는 분께 알림이 갑니다.
            </p>
          </section>
        )}

        {/* 빈 상태 */}
        {isEmpty && (
          <div className="mx-4 mt-6 p-8 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] text-center">
            <span className="text-4xl block mb-3">💌</span>
            <p className="text-[14.5px] font-bold text-gray-900 dark:text-white">
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
