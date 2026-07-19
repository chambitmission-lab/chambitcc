// 초대 랜딩 (/join/:code)
// 카톡 등으로 받은 초대 링크의 도착지 — 방 미리보기 + 참여하기.
// 비로그인이면 로그인 후 이 페이지로 복귀한다 (redirect_after_login).
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useJoinRoom, useRoomPreview } from '../../hooks/useMeditationRoom'
import { isAuthenticated } from '../../utils/auth'
import { escapeKakaoInApp, isInAppBrowser, isKakaoInApp } from '../../utils/inappBrowser'
import { showToast } from '../../utils/toast'

const JoinRoom = () => {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const inviteCode = (code ?? '').toUpperCase()

  const { data: room, isLoading, error } = useRoomPreview(inviteCode)
  const joinRoom = useJoinRoom()
  const inApp = isInAppBrowser()

  // 카톡 인앱 브라우저면 외부 브라우저로 자동 탈출 (안드로이드는 설치된 PWA가 열림)
  useEffect(() => {
    if (isKakaoInApp()) escapeKakaoInApp()
  }, [])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      showToast('초대 코드를 복사했어요. 앱의 [공동 묵상방 → 초대 코드로 참여]에 붙여넣어 주세요', 'success')
    } catch {
      showToast('복사에 실패했어요. 코드를 직접 입력해주세요: ' + inviteCode, 'error')
    }
  }

  const handleJoin = async () => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/join/${inviteCode}`)
      showToast('로그인하면 바로 참여돼요', 'success')
      navigate('/login')
      return
    }
    try {
      const detail = await joinRoom.mutateAsync(inviteCode)
      showToast('묵상방에 참여했어요! 환영합니다 🕊️', 'success')
      navigate(`/rooms/${detail.id}`, { replace: true })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '참여에 실패했습니다', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen flex flex-col">
        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h1 className="text-base font-bold text-center text-gray-900 dark:text-white">
            공동 묵상 초대장
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
          ) : error || !room ? (
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
                onClick={() => navigate('/rooms')}
                className="mt-6 px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold"
              >
                묵상방 둘러보기
              </button>
            </div>
          ) : (
            <div className="w-full">
              {/* 초대 카드 */}
              <div className="relative overflow-hidden rounded-[26px] p-6 bg-brand text-white shadow-[0_16px_44px_-14px_var(--brand-glow)] text-center">
                <span className="absolute -right-3 -bottom-7 text-[110px] leading-none opacity-[0.14] rotate-12 select-none pointer-events-none">
                  {room.emoji || '🕊️'}
                </span>
                <div className="relative z-10">
                  <span className="text-[38px] block">{room.emoji || '🕊️'}</span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 mt-2">
                    Invitation
                  </p>
                  <h2 className="text-[22px] font-extrabold tracking-[-0.02em] leading-[1.3] mt-2 break-keep">
                    {room.title}
                  </h2>
                  <p className="text-[13px] text-white/80 mt-2.5">
                    {room.start_date}부터 {room.total_days}일 여정
                  </p>
                  {room.first_reference && (
                    <p className="text-[12.5px] text-white/70 mt-1">
                      첫 본문 · {room.first_reference}
                    </p>
                  )}
                </div>
              </div>

              {/* 참여자 */}
              <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
                <p className="text-[12px] font-bold text-gray-500 dark:text-white/55">
                  함께하는 사람 {room.member_count}명
                </p>
                <p className="text-[13.5px] text-gray-800 dark:text-white/85 mt-1.5 leading-[1.6]">
                  {room.member_names.join(' · ')}
                  {room.member_count > room.member_names.length &&
                    ` 외 ${room.member_count - room.member_names.length}명`}
                </p>
              </div>

              {/* CTA */}
              {room.is_member ? (
                <button
                  type="button"
                  onClick={() => navigate(`/rooms/${room.id}`, { replace: true })}
                  className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)]"
                >
                  이미 참여 중이에요 — 방으로 가기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joinRoom.isPending}
                  className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-50"
                >
                  {joinRoom.isPending ? '참여하는 중...' : '초대 수락하고 함께하기'}
                </button>
              )}
              <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-2.5">
                매일 같은 본문을 읽고, 서로의 묵상에 마음을 나눠요
              </p>

              {/* 설치된 앱으로 참여하고 싶은 경우 (특히 아이폰 PWA) */}
              <div className="mt-5 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.07]">
                <p className="text-[12px] font-bold text-gray-500 dark:text-white/55">
                  이미 앱을 설치하셨나요?
                </p>
                <p className="text-[12px] text-gray-500 dark:text-white/50 mt-1 leading-[1.6]">
                  앱을 열고 [공동 묵상방 → 초대 코드로 참여]에 아래 코드를 입력하면 앱에서 바로 함께할 수 있어요.
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

export default JoinRoom
