// 기도방 초대 랜딩 (/groups/join/:code)
// 카톡 등으로 받은 초대 링크의 도착지 — 방 미리보기 + 참여하기.
// 비로그인이면 로그인 후 이 페이지로 복귀한다 (redirect_after_login).
import { useNavigate, useParams } from 'react-router-dom'
import { useGroupPreview, useJoinGroup } from '../../hooks/useGroups'
import { isAuthenticated } from '../../utils/auth'
import { escapeKakaoInApp, isInAppBrowser, isKakaoInApp } from '../../utils/inappBrowser'
import { showToast } from '../../utils/toast'

const JoinGroup = () => {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const inviteCode = (code ?? '').toUpperCase()

  const { data, isLoading, error } = useGroupPreview(inviteCode)
  const group = data?.data
  const joinGroup = useJoinGroup()
  // 자동 탈출은 main.tsx에서 전역 처리 — 여기서는 실패 대비 수동 UI만 담당
  const inApp = isInAppBrowser()

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      showToast('초대 코드를 복사했어요. 앱의 [내 그룹 → 초대 코드로 참여]에 붙여넣어 주세요', 'success')
    } catch {
      showToast('복사에 실패했어요. 코드를 직접 입력해주세요: ' + inviteCode, 'error')
    }
  }

  const handleJoin = async () => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/groups/join/${inviteCode}`)
      showToast('로그인하면 바로 참여돼요', 'success')
      navigate('/login')
      return
    }
    try {
      const result = await joinGroup.mutateAsync({ invite_code: inviteCode })
      navigate(`/groups/${result.data.id}`, { replace: true })
    } catch {
      /* 토스트는 훅에서 처리 */
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen flex flex-col">
        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h1 className="text-base font-bold text-center text-gray-900 dark:text-white">
            기도방 초대장
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
          ) : error || !group ? (
            <div className="text-center">
              <span className="text-5xl block mb-4">😢</span>
              <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                초대장을 찾을 수 없어요
              </p>
              <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1.5">
                링크가 만료됐거나 잘못된 초대 코드예요
              </p>
              <button
                type="button"
                onClick={() => navigate('/groups')}
                className="mt-6 px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold"
              >
                내 그룹으로 가기
              </button>
            </div>
          ) : (
            <div className="w-full">
              {/* 초대 카드 */}
              <div className="relative overflow-hidden rounded-[26px] p-6 bg-brand text-white shadow-[0_16px_44px_-14px_var(--brand-glow)] text-center">
                <span className="absolute -right-3 -bottom-7 text-[110px] leading-none opacity-[0.14] rotate-12 select-none pointer-events-none">
                  {group.icon || '🙏'}
                </span>
                <div className="relative z-10">
                  <span className="text-[38px] block">{group.icon || '🙏'}</span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 mt-2">
                    Invitation
                  </p>
                  <h2 className="text-[22px] font-extrabold tracking-[-0.02em] leading-[1.3] mt-2 break-keep">
                    {group.name}
                  </h2>
                  {group.description && (
                    <p className="text-[13px] text-white/80 mt-2.5 leading-[1.6] break-keep">
                      {group.description}
                    </p>
                  )}
                  {group.theme && (
                    <p className="text-[12px] text-white/75 mt-2 inline-flex items-center gap-1">
                      <span className="material-icons-round text-[13px]">{group.theme.icon}</span>
                      {group.theme.name} 테마 기도방
                    </p>
                  )}
                </div>
              </div>

              {/* 오늘의 성구 미리보기 */}
              {group.theme_verse && (
                <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
                  <p className="text-[11.5px] font-bold text-gray-500 dark:text-white/55 mb-1.5">
                    오늘의 성구
                  </p>
                  <p className="text-[13.5px] text-gray-800 dark:text-white/85 leading-[1.7] break-keep">
                    {group.theme_verse.text}
                  </p>
                  <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/50 mt-1.5">
                    {group.theme_verse.book_name_ko} {group.theme_verse.chapter}:{group.theme_verse.verse}
                  </p>
                </div>
              )}

              {/* 함께하는 사람 + 기도 통계 */}
              <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
                <p className="text-[12px] font-bold text-gray-500 dark:text-white/55">
                  함께 기도하는 사람 {group.member_count}명
                </p>
                {group.member_names.length > 0 && (
                  <p className="text-[13.5px] text-gray-800 dark:text-white/85 mt-1.5 leading-[1.6]">
                    {group.member_names.join(' · ')}
                    {group.member_count > group.member_names.length &&
                      ` 외 ${group.member_count - group.member_names.length}명`}
                  </p>
                )}
                {group.prayer_count > 0 && (
                  <p className="text-[12px] text-gray-500 dark:text-white/50 mt-2">
                    지금까지 기도제목 {group.prayer_count}개
                    {group.answered_count > 0 && ` · 응답 ${group.answered_count}개 ✨`}
                  </p>
                )}
              </div>

              {/* CTA */}
              {group.is_member ? (
                <button
                  type="button"
                  onClick={() => navigate(`/groups/${group.id}`, { replace: true })}
                  className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)]"
                >
                  이미 함께하고 있어요 — 기도방으로 가기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joinGroup.isPending}
                  className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-50"
                >
                  {joinGroup.isPending ? '참여하는 중...' : '초대 수락하고 함께 기도하기'}
                </button>
              )}
              <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-2.5">
                기도제목을 나누고, 서로를 위해 기도하고, 응답을 함께 기뻐해요
              </p>

              {/* 설치된 앱으로 참여하고 싶은 경우 (특히 아이폰 PWA) */}
              <div className="mt-5 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.07]">
                <p className="text-[12px] font-bold text-gray-500 dark:text-white/55">
                  이미 앱을 설치하셨나요?
                </p>
                <p className="text-[12px] text-gray-500 dark:text-white/50 mt-1 leading-[1.6]">
                  앱을 열고 [내 그룹 → 초대 코드로 참여]에 아래 코드를 입력하면 앱에서 바로 함께할 수 있어요.
                </p>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="mt-2.5 w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]"
                >
                  <span className="text-[15px] font-extrabold tracking-[0.14em] text-gray-900 dark:text-white">
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

export default JoinGroup
