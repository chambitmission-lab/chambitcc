// 타임캡슐 초대 랜딩 (/capsule/invite/:code)
// 카톡 등으로 받은 캡슐 링크의 도착지 — 미리보기 + 내 캡슐로 받기.
// 비로그인이면 로그인/가입 후 이 페이지로 복귀한다 (redirect_after_login).
// 개봉 전 내용은 어디에도 노출되지 않는다 (서버가 안 내려줌).
import { useNavigate, useParams } from 'react-router-dom'
import { useCapsulePreview, useClaimCapsule } from '../../hooks/useTimeCapsule'
import { isAuthenticated } from '../../utils/auth'
import { escapeKakaoInApp, isInAppBrowser, isKakaoInApp } from '../../utils/inappBrowser'
import { showToast } from '../../utils/toast'
import { daysUntil, formatKoreanDate } from './capsuleDates'

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen flex flex-col">
        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h1 className="text-base font-bold text-center text-gray-900 dark:text-white">
            타임캡슐 초대장
          </h1>
        </div>

        {/* 인앱 브라우저 안내: 자동 탈출이 막힌 경우의 수동 경로 */}
        {inApp && (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/25">
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

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          {isLoading ? (
            <div className="w-full h-64 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          ) : error || !preview ? (
            <div className="text-center">
              <span className="text-5xl block mb-4">😢</span>
              <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                초대장을 찾을 수 없어요
              </p>
              <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1.5">
                링크가 만료됐거나 잘못된 초대 링크예요
              </p>
            </div>
          ) : (
            <div className="w-full">
              {/* 초대 카드 */}
              <div className="relative overflow-hidden rounded-[26px] p-6 bg-brand text-white shadow-[0_16px_44px_-14px_var(--brand-glow)] text-center">
                <span className="absolute -right-3 -bottom-7 text-[110px] leading-none opacity-[0.14] rotate-12 select-none pointer-events-none">
                  🕰️
                </span>
                <div className="relative z-10">
                  <span className="text-[38px] block">💌</span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 mt-2">
                    Time Capsule
                  </p>
                  <h2 className="text-[21px] font-extrabold tracking-[-0.02em] leading-[1.35] mt-2 break-keep">
                    {preview.sender_name}님이
                    <br />
                    {preview.recipient_name ? `${preview.recipient_name}님께` : '당신에게'} 남긴
                    편지
                  </h2>
                  <p className="text-[13px] text-white/80 mt-2.5">
                    {formatKoreanDate(preview.sealed_at)}에 봉인
                    {preview.has_audio && ' · 🎙️ 음성 포함'}
                    {(preview.photo_count ?? 0) > 0 && ` · 📷 사진 ${preview.photo_count}장`}
                  </p>
                  <p className="text-[13px] text-white/80 mt-1">
                    {formatKoreanDate(preview.open_at)}
                    {preview.open_label ? ` (${preview.open_label})` : ''}에 열려요
                    {!preview.openable && ` · D-${daysUntil(preview.open_at)}`}
                  </p>
                </div>
              </div>

              {/* CTA */}
              {preview.is_mine ? (
                <button
                  type="button"
                  onClick={() => navigate('/capsule', { replace: true })}
                  className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)]"
                >
                  이미 받았어요 — 내 캡슐함으로
                </button>
              ) : preview.claimed ? (
                <div className="w-full mt-5 py-3.5 rounded-2xl bg-gray-100 dark:bg-white/[0.07] text-center text-[14px] font-bold text-gray-400 dark:text-white/40">
                  이미 다른 분이 받은 캡슐이에요
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={claimCapsule.isPending}
                  className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-50"
                >
                  {claimCapsule.isPending ? '받는 중...' : '🕰️ 이 캡슐 받기'}
                </button>
              )}
              <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-2.5 leading-[1.7]">
                받아두면 개봉일 아침에 알림으로 알려드려요.
                <br />
                개봉일 전에는 보낸 분도, 받는 분도 내용을 볼 수 없어요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CapsuleInvite
