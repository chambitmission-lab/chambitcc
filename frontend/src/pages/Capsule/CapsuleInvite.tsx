// 타임캡슐 초대 랜딩 (/capsule/invite/:code)
// 카톡 등으로 받은 캡슐 링크의 도착지 — 미리보기 + 내 캡슐로 받기.
// 비로그인이면 로그인/가입 후 이 페이지로 복귀한다 (redirect_after_login).
// 개봉 전 내용은 어디에도 노출되지 않는다 (서버가 안 내려줌).
//
// 화면 언어: 이 앱을 처음 보는 사람이 닿는 유일한 화면이라, 브랜드 슬래브 한 장 대신
// "도착한 편지 한 통" 자체를 그린다 — 항공우편 테두리·우표·소인·손글씨 수취인·밀랍 인장.
// 캡슐함(capsule-mail)과 개봉 화면(capsule-envelope)이 이미 쓰는 재질을 그대로 이어받는다.
import { useNavigate, useParams } from 'react-router-dom'
import { useCapsulePreview, useClaimCapsule } from '../../hooks/useTimeCapsule'
import { isAuthenticated } from '../../utils/auth'
import { escapeKakaoInApp, isInAppBrowser, isKakaoInApp } from '../../utils/inappBrowser'
import { showToast } from '../../utils/toast'
import { daysUntil, formatKoreanDate } from './capsuleDates'
import { Icon, LockShackle, MicGlyph, PhotoGlyph, SigilGlyph } from './capsuleIcons'
import './capsule.css'

/** 소인 각인: 2026-07-29 → { year: "'26", day: "7 · 29" } */
const postmark = (dateStr: string): { year: string; day: string } => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return { year: '', day: '' }
  return {
    year: `'${String(d.getFullYear()).slice(2)}`,
    day: `${d.getMonth() + 1} · ${d.getDate()}`,
  }
}

/** 봉인된 편지지 — 블러 처리된 글줄. 내용을 못 받는다는 사실을 촉감으로 바꾼다. */
const REDACTED_WIDTHS = ['100%', '88%', '94%', '61%']

const CapsuleInvite = () => {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const inviteCode = code ?? ''

  const { data: preview, isLoading, error } = useCapsulePreview(inviteCode)
  const claimCapsule = useClaimCapsule()
  const inApp = isInAppBrowser()

  const handleClaim = async () => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/capsule/invite/${inviteCode}`)
      showToast('로그인하면 캡슐이 내 캡슐함에 담겨요', 'success')
      navigate('/login')
      return
    }
    try {
      const summary = await claimCapsule.mutateAsync(inviteCode)
      showToast('캡슐을 받았어요! 개봉일에 알려드릴게요 🕰️', 'success')
      navigate(`/capsule/${summary.id}`, { replace: true })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '캡슐 받기에 실패했습니다', 'error')
    }
  }

  const dday = preview ? daysUntil(preview.open_at) : 0
  const mark = preview ? postmark(preview.sealed_at) : { year: '', day: '' }
  const photos = preview?.photo_count ?? 0

  return (
    <div className="capsule-invite-stage min-h-screen">
      <div className="relative z-[1] max-w-md mx-auto min-h-screen flex flex-col px-5 pb-10">
        {/* 초대장이 스스로 말하게 두고, 헤더는 최소한의 이정표만 */}
        <p className="pt-5 pb-1 text-center text-[11px] font-bold tracking-[0.34em] text-[var(--text-muted)]">
          TIME CAPSULE
        </p>

        {/* 인앱 브라우저 안내: 자동 탈출이 막힌 경우의 수동 경로 */}
        {inApp && (
          <div className="mt-3 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/25">
            <p className="text-[13px] font-bold text-amber-700 dark:text-amber-300">
              {isKakaoInApp() ? '카카오톡' : '인앱'} 브라우저로 보고 계세요
            </p>
            <p className="text-[12px] text-gray-600 dark:text-white/60 mt-1 leading-[1.6]">
              앱이 설치돼 있다면 외부 브라우저로 열어야 앱으로 이어져요.
              {!isKakaoInApp() && ' 우측 상단 메뉴(⋯)에서 [다른 브라우저로 열기]를 눌러주세요.'}
            </p>
            {isKakaoInApp() && (
              <button
                type="button"
                onClick={() => escapeKakaoInApp()}
                className="mt-2.5 px-4 py-2 rounded-full bg-amber-500 text-white text-[12.5px] font-bold"
              >
                외부 브라우저로 열기
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 h-[520px] rounded-[22px] bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        ) : error || !preview ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <span className="capsule-invite__lost">
              <Icon size={26}>
                <LockShackle />
              </Icon>
            </span>
            <p className="text-[15px] font-bold text-ink-strong mt-4">초대장을 찾을 수 없어요</p>
            <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1.5">
              링크가 만료됐거나 잘못된 초대 링크예요
            </p>
          </div>
        ) : (
          <>
            {/* ── 봉투 ─────────────────────────────────────────── */}
            <article className="capsule-invite mt-3">
              <span className="capsule-invite__border" aria-hidden />

              {/* 우표 + 소인 */}
              <header className="capsule-invite__head">
                <span className="capsule-invite__stamp" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
                    <SigilGlyph />
                  </svg>
                </span>
                <span className="capsule-invite__postmark" aria-hidden>
                  <b>{mark.year}</b>
                  <i>{mark.day}</i>
                  <em>SEALED</em>
                </span>
              </header>

              {/* 손글씨 수취인 — 이 편지가 "나에게" 왔다는 사실이 화면의 주인공 */}
              <div className="capsule-invite__address">
                <p className="capsule-invite__from">
                  From. <b>{preview.sender_name}</b>
                </p>
                <p className="capsule-invite__to">
                  To. <b>{preview.recipient_name || '당신'}</b>
                  {preview.recipient_name ? ' 님께' : '에게'}
                </p>
              </div>

              {/* 밀랍 인장 + D-day */}
              <div className="capsule-invite__seal-zone">
                <span className="capsule-invite__seal" aria-hidden>
                  <Icon size={19}>
                    <LockShackle />
                  </Icon>
                </span>
                {preview.openable ? (
                  <p className="capsule-invite__dday capsule-invite__dday--now">지금 열 수 있어요</p>
                ) : (
                  <>
                    <p className="capsule-invite__dday">D-{dday}</p>
                    <p className="capsule-invite__dday-sub">
                      {dday === 1 ? '내일 아침이면 열려요' : `${dday}일 뒤에 열려요`}
                    </p>
                  </>
                )}
              </div>

              {/* 봉인된 편지지 — 안에 뭔가 들어 있다는 촉감 */}
              <div className="capsule-invite__letter">
                <div className="capsule-invite__lines" aria-hidden>
                  {REDACTED_WIDTHS.map((w) => (
                    <span key={w} style={{ width: w }} />
                  ))}
                </div>
                {(photos > 0 || preview.has_audio) && (
                  <div className="capsule-invite__enclosed">
                    {photos > 0 && (
                      <span>
                        <Icon size={12}>
                          <PhotoGlyph />
                        </Icon>
                        사진 {photos}장 동봉
                      </span>
                    )}
                    {preview.has_audio && (
                      <span>
                        <Icon size={12}>
                          <MicGlyph />
                        </Icon>
                        음성 편지
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 개봉일 — 봉투 아랫단 */}
              <footer className="capsule-invite__foot">
                {formatKoreanDate(preview.open_at)}
                {preview.open_label ? ` (${preview.open_label})` : ''} 아침에 열려요
              </footer>
            </article>

            {/* ── CTA ─────────────────────────────────────────── */}
            {preview.is_mine ? (
              <button
                type="button"
                onClick={() => navigate('/capsule', { replace: true })}
                className="w-full mt-5 py-4 rounded-2xl bg-brand text-white text-[15px] font-extrabold shadow-[0_10px_30px_-8px_var(--brand-glow)]"
              >
                이미 받았어요 — 내 캡슐함으로
              </button>
            ) : preview.claimed ? (
              <div className="w-full mt-5 py-4 rounded-2xl bg-gray-100 dark:bg-white/[0.07] text-center text-[14px] font-bold text-gray-400 dark:text-white/40">
                이미 다른 분이 받은 캡슐이에요
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaim}
                disabled={claimCapsule.isPending}
                className="w-full mt-5 py-4 rounded-2xl bg-brand text-white text-[15.5px] font-extrabold shadow-[0_12px_32px_-10px_var(--brand-glow)] disabled:opacity-50"
              >
                {claimCapsule.isPending ? '받는 중...' : '이 캡슐 받기'}
              </button>
            )}
            <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-3 leading-[1.75]">
              받아두면 개봉일 아침에 알림으로 알려드려요.
              <br />
              개봉일 전에는 보낸 분도, 받는 분도 내용을 볼 수 없어요.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default CapsuleInvite
