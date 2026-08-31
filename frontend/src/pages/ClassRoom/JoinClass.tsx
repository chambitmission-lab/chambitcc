// 우리반 초대 랜딩 (/classes/join/:code)
// 카톡으로 받은 초대 링크의 도착지 — 반 미리보기 + 자녀 이름 입력 + 참여.
// 비로그인이면 로그인 후 이 페이지로 복귀한다 (redirect_after_login).
import { useState } from 'react'
import { EnvelopeIcon, SadFaceIcon, SchoolIcon } from './ClassIcons'
import { useNavigate, useParams } from 'react-router-dom'
import { useClassPreview, useJoinClass } from '../../hooks/useClassRoom'
import { isAuthenticated } from '../../utils/auth'
import { escapeKakaoInApp, isInAppBrowser, isKakaoInApp } from '../../utils/inappBrowser'
import { showToast } from '../../utils/toast'
import { DeptBadge } from './classUi'

const JoinClass = () => {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const inviteCode = (code ?? '').toUpperCase()

  const { data: cls, isLoading, error } = useClassPreview(inviteCode)
  const joinClass = useJoinClass()
  const [childName, setChildName] = useState('')
  const inApp = isInAppBrowser()

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      showToast('초대 코드를 복사했어요. 앱의 [우리반 알림장 → 초대 코드로 참여]에 붙여넣어 주세요', 'success')
    } catch {
      showToast('복사에 실패했어요. 코드를 직접 입력해주세요: ' + inviteCode, 'error')
    }
  }

  const handleJoin = async () => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/classes/join/${inviteCode}`)
      showToast('로그인하면 바로 참여돼요', 'success')
      navigate('/login')
      return
    }
    try {
      const detail = await joinClass.mutateAsync({
        inviteCode,
        childName: childName.trim() || undefined,
      })
      showToast('반에 참여했어요! 환영합니다 🏫', 'success')
      navigate(`/classes/${detail.id}`, { replace: true })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '참여에 실패했습니다', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen flex flex-col lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h1 className="text-base font-bold text-center text-ink-strong">우리반 초대장</h1>
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
          ) : error || !cls ? (
            <div className="text-center">
              <SadFaceIcon width={44} height={44} className="mx-auto mb-4 text-gray-400 dark:text-white/40" />
              <p className="text-[15px] font-bold text-ink-strong">초대장을 찾을 수 없어요</p>
              <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1.5">
                링크가 만료됐거나 잘못된 초대 코드예요
              </p>
              <button
                type="button"
                onClick={() => navigate('/classes')}
                className="mt-6 px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold"
              >
                우리반 알림장 둘러보기
              </button>
            </div>
          ) : (
            <div className="w-full">
              {/* 초대 카드 */}
              <div className="relative overflow-hidden rounded-[26px] p-6 bg-brand text-white shadow-[0_16px_44px_-14px_var(--brand-glow)] text-center">
                <SchoolIcon width={120} height={120} className="absolute -right-3 -bottom-7 opacity-[0.14] rotate-12 select-none pointer-events-none" />
                <div className="relative z-10">
                  <EnvelopeIcon width={38} height={38} className="mx-auto block" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 mt-2">
                    Invitation
                  </p>
                  <h2 className="text-[22px] font-extrabold tracking-[-0.02em] leading-[1.3] mt-2 break-keep">
                    {cls.name}
                  </h2>
                  <p className="text-[13px] text-white/85 mt-2.5">
                    {cls.department}
                    {cls.teacher_names.length > 0 &&
                      ` · ${cls.teacher_names.join('·')} 선생님`}
                  </p>
                  {cls.description && (
                    <p className="text-[12.5px] text-white/70 mt-1.5 leading-[1.6] break-keep">
                      {cls.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 참여자 수 */}
              <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-between">
                <p className="text-[12px] font-bold text-gray-500 dark:text-white/55">
                  함께하는 사람
                </p>
                <p className="text-[13.5px] font-bold text-ink-strong">
                  <DeptBadge department={cls.department} />
                  <span className="ml-2">{cls.member_count}명</span>
                </p>
              </div>

              {/* CTA */}
              {cls.is_member ? (
                <button
                  type="button"
                  onClick={() => navigate(`/classes/${cls.id}`, { replace: true })}
                  className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)]"
                >
                  이미 참여 중이에요 — 알림장으로 가기
                </button>
              ) : (
                <>
                  {/* 자녀 이름 — 선생님이 "누구네 학부모님"인지 알 수 있게 */}
                  <div className="mt-5">
                    <label className="block text-[12px] font-bold text-gray-500 dark:text-white/55 mb-1.5">
                      자녀 이름 (선택 — 학부모님이라면 입력해주세요)
                    </label>
                    <input
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      maxLength={50}
                      placeholder="예: 다솔"
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[14px] focus:outline-none focus:border-brand"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joinClass.isPending}
                    className="w-full mt-4 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-50"
                  >
                    {joinClass.isPending ? '참여하는 중...' : '초대 수락하고 함께하기'}
                  </button>
                </>
              )}
              <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-2.5">
                공지 확인·암송요절·일정 참석을 알림장 하나로 해결해요
              </p>

              {/* 설치된 앱으로 참여하고 싶은 경우 (특히 아이폰 PWA) */}
              <div className="mt-5 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.07]">
                <p className="text-[12px] font-bold text-gray-500 dark:text-white/55">
                  이미 앱을 설치하셨나요?
                </p>
                <p className="text-[12px] text-gray-500 dark:text-white/50 mt-1 leading-[1.6]">
                  앱을 열고 [우리반 알림장 → 초대 코드로 참여]에 아래 코드를 입력하면 앱에서
                  바로 함께할 수 있어요.
                </p>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="mt-2.5 w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]"
                >
                  <span className="text-[15px] font-extrabold tracking-[0.14em] text-ink-strong">
                    {inviteCode}
                  </span>
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

export default JoinClass
