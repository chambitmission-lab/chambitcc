// 나만의 플랜 초대 랜딩 (/bible/plans/join/:code)
// 카톡 등으로 받은 초대 링크의 도착지 — 플랜 미리보기 + 함께하기.
// 비로그인이면 로그인 후 이 페이지로 복귀한다 (redirect_after_login). 공동 묵상방 JoinRoom 과 같은 문법.
import { useNavigate, useParams } from 'react-router-dom'
import { useJoinPlanByCode, usePlanInvitePreview } from '../../../hooks/useBiblePlan'
import { isAuthenticated } from '../../../utils/auth'
import { escapeKakaoInApp, isInAppBrowser, isKakaoInApp } from '../../../utils/inappBrowser'
import { showToast } from '../../../utils/toast'
import { accentGradient } from './planVisuals'
import { CloudOffIcon, PlanGlyph } from './PlanIcons'

const JoinPlan = () => {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const inviteCode = (code ?? '').toUpperCase()

  const { data: plan, isLoading, error } = usePlanInvitePreview(inviteCode)
  const join = useJoinPlanByCode()
  const inApp = isInAppBrowser()

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      showToast('초대 코드를 복사했어요. 앱의 [읽기 플랜 → 초대 코드로 함께하기]에 붙여넣어 주세요', 'success')
    } catch {
      showToast('복사에 실패했어요. 코드를 직접 입력해주세요: ' + inviteCode, 'error')
    }
  }

  const handleJoin = async () => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/bible/plans/join/${inviteCode}`)
      showToast('로그인하면 바로 함께할 수 있어요', 'success')
      navigate('/login')
      return
    }
    try {
      const detail = await join.mutateAsync(inviteCode)
      showToast('플랜에 함께하게 됐어요! 오늘 분량부터 읽어볼까요? 📖', 'success')
      navigate(`/bible/plans/${detail.id}`, { replace: true })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '참여에 실패했습니다', 'error')
    }
  }

  const grad = accentGradient(plan?.accent)

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen flex flex-col lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h1 className="text-base font-bold text-center text-ink-strong">함께 읽기 초대장</h1>
        </div>

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
          ) : error || !plan ? (
            <div className="text-center">
              <span className="mx-auto mb-4 block w-fit text-gray-300 dark:text-white/25">
                <CloudOffIcon size={46} />
              </span>
              <p className="text-[15px] font-bold text-ink-strong">초대장을 찾을 수 없어요</p>
              <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1.5">
                링크가 만료됐거나(플랜 삭제) 잘못된 초대 코드예요
              </p>
              <button
                type="button"
                onClick={() => navigate('/bible/plans')}
                className="mt-6 px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold"
              >
                읽기 플랜 둘러보기
              </button>
            </div>
          ) : (
            <div className="w-full">
              {/* 초대 카드 */}
              <div className={`relative overflow-hidden rounded-[26px] p-6 bg-gradient-to-br ${grad} text-white shadow-[0_16px_44px_-14px_var(--brand-glow)] text-center`}>
                <span className="absolute -right-3 -bottom-7 opacity-[0.18] rotate-12 pointer-events-none">
                  <PlanGlyph emoji={plan.emoji} size={110} />
                </span>
                <div className="relative z-10">
                  <span className="flex justify-center">
                    <PlanGlyph emoji={plan.emoji} size={38} />
                  </span>
                  <p className="text-[11px] font-semibold tracking-[0.3em] text-white/70 mt-2">INVITATION</p>
                  <h2 className="text-[22px] font-extrabold tracking-[-0.02em] leading-[1.3] mt-2 break-keep">
                    {plan.title}
                  </h2>
                  <p className="text-[13px] text-white/85 mt-2.5">
                    {plan.owner_name}님이 {plan.total_days}일 여정에 초대했어요
                  </p>
                  {plan.first_reference && (
                    <p className="text-[12.5px] text-white/70 mt-1">첫 본문 · {plan.first_reference}</p>
                  )}
                </div>
              </div>

              {/* 참여자 */}
              <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
                <p className="text-[12px] font-bold text-gray-500 dark:text-white/55">
                  함께 읽는 사람 {plan.participant_count}명
                </p>
                <p className="text-[13.5px] text-gray-800 dark:text-white/85 mt-1.5 leading-[1.6]">
                  {plan.participant_names.join(' · ')}
                  {plan.participant_count > plan.participant_names.length &&
                    ` 외 ${plan.participant_count - plan.participant_names.length}명`}
                </p>
              </div>

              {plan.is_member ? (
                <button
                  type="button"
                  onClick={() => navigate(`/bible/plans/${plan.id}`, { replace: true })}
                  className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)]"
                >
                  이미 함께하고 있어요 — 플랜으로 가기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={join.isPending}
                  className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-50"
                >
                  {join.isPending ? '참여하는 중...' : '초대 수락하고 함께 읽기'}
                </button>
              )}
              <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-2.5">
                각자 자기 속도로 읽고, 서로의 진행률을 보며 힘을 얻어요
              </p>

              <div className="mt-5 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.07]">
                <p className="text-[12px] font-bold text-gray-500 dark:text-white/55">이미 앱을 설치하셨나요?</p>
                <p className="text-[12px] text-gray-500 dark:text-white/50 mt-1 leading-[1.6]">
                  앱을 열고 [읽기 플랜 → 초대 코드로 함께하기]에 아래 코드를 입력하면 앱에서 바로 함께할 수 있어요.
                </p>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="mt-2.5 w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]"
                >
                  <span className="text-[15px] font-extrabold tracking-[0.14em] text-ink-strong">{inviteCode}</span>
                  <span className="text-[12px] font-bold text-brand">복사</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JoinPlan
