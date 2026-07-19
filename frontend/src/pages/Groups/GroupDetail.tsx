// 기도방 홈 — /groups/:id
// 오늘의 성구(테마) · 응답률 진행바 · 함께 기도 통계 · 기도 피드 진입 · 다가오는 모임 · 초대 공유
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useGroup, useLeaveGroup } from '../../hooks/useGroups'
import { useEvents } from '../../hooks/useEvents'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { groupInviteUrl } from '../../components/prayer/GroupModals'
import CreateGroupMeetingModal from '../../components/group/CreateGroupMeetingModal'

const GroupDetail = () => {
  const { t } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()

  const groupId = Number(id)
  const { data, isLoading } = useGroup(groupId)
  const group = data?.data
  const leaveGroup = useLeaveGroup()

  const [copied, setCopied] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  // 오늘 자정(KST) 부터의 일정만 (이미 끝난 모임 숨김)
  const todayIso = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString().slice(0, 10) // YYYY-MM-DD
  }, [])
  const { events: meetings, loading: meetingsLoading } = useEvents(
    group?.is_member ? todayIso : undefined,
    undefined,
    undefined,
    group?.is_member ? groupId : undefined,
  )

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-surface text-gray-900 dark:text-gray-100">
        <div className="max-w-md mx-auto bg-surface border-x border-border-light dark:border-border-dark min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <p className="text-gray-600 dark:text-gray-300 mb-4">{t('loginRequired')}</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-6 h-11 rounded-full bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)]"
          >
            {t('login')}
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-md mx-auto bg-surface border-x border-border-light dark:border-border-dark min-h-screen px-4 pt-14 space-y-3">
          <div className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          <div className="h-32 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          <div className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-surface text-gray-900 dark:text-gray-100">
        <div className="max-w-md mx-auto bg-surface border-x border-border-light dark:border-border-dark min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <span className="text-5xl mb-4">😢</span>
          <p className="text-gray-600 dark:text-gray-300 mb-5">기도방을 찾을 수 없어요</p>
          <button
            type="button"
            onClick={() => navigate('/groups')}
            className="px-6 h-11 rounded-full bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)]"
          >
            {t('back')}
          </button>
        </div>
      </div>
    )
  }

  const answered = group.answered_count ?? 0
  const total = group.prayer_count ?? 0
  const prayed = group.prayed_count ?? 0
  const answeredRate = total > 0 ? Math.round((answered / total) * 100) : 0

  const handleCopy = async () => {
    if (!group.invite_code) return
    try {
      await navigator.clipboard.writeText(group.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast('복사에 실패했어요. 코드를 직접 알려주세요: ' + group.invite_code, 'error')
    }
  }

  const handleShare = async () => {
    if (!group.invite_code) return
    const url = groupInviteUrl(group.invite_code)
    const text = `🙏 '${group.name}' 기도방에 초대해요!\n함께 기도제목을 나누고, 응답이 쌓이는 걸 지켜봐요.\n\n${url}\n\n앱을 설치했다면 [내 그룹 → 초대 코드로 참여]에 코드 ${group.invite_code} 를 입력해도 돼요.`
    if (navigator.share) {
      try {
        await navigator.share({ title: group.name, text, url })
        return
      } catch {
        /* 사용자가 취소 — 폴백 없이 종료 */
        return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast('초대 링크를 복사했어요. 카톡에 붙여넣어 보내주세요!', 'success')
    } catch {
      showToast('복사에 실패했어요. 초대 코드를 직접 알려주세요: ' + group.invite_code, 'error')
    }
  }

  const handleLeave = async () => {
    if (!confirm('이 기도방에서 나가시겠어요?')) return
    try {
      await leaveGroup.mutateAsync(groupId)
      navigate('/groups')
    } catch {
      /* 토스트는 훅에서 처리 */
    }
  }

  return (
    <div className="min-h-screen bg-surface text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-surface border-x border-border-light dark:border-border-dark min-h-screen pb-20">
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300"
        >
          ← {t('back')}
        </button>

        {/* 방 헤더 */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="shrink-0 w-14 h-14 rounded-2xl bg-brand flex items-center justify-center text-[26px] shadow-[0_6px_18px_-6px_var(--brand-glow)]">
            {group.icon || '🙏'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-bold text-gray-900 dark:text-white tracking-[-0.015em] truncate">
                {group.name}
              </h1>
              {group.is_admin && (
                <span className="shrink-0 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand tracking-[0.05em]">
                  ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11.5px] text-gray-500 dark:text-white/55">
              <span>👤 {group.member_count}명</span>
              {total > 0 && (
                <>
                  <span className="text-gray-300 dark:text-white/20">·</span>
                  <span>🙏 기도 {total}개</span>
                </>
              )}
              {group.theme && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: group.theme.color }}
                >
                  <span className="material-icons-round text-[11px]">{group.theme.icon}</span>
                  {group.theme.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {group.description && (
          <p className="px-4 pb-3 text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-[1.6]">
            {group.description}
          </p>
        )}

        {/* 오늘의 성구 — 테마가 있는 방에만 */}
        {group.theme_verse && group.theme && (
          <div className="mx-4 mb-3 relative overflow-hidden rounded-2xl p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: group.theme.color }}
            />
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="material-icons-round text-[15px]"
                style={{ color: group.theme.color }}
              >
                {group.theme.icon}
              </span>
              <p className="text-[11.5px] font-bold text-gray-500 dark:text-white/55">
                오늘의 성구 · {group.theme.name}
              </p>
            </div>
            <p className="text-[14px] text-gray-800 dark:text-white/90 leading-[1.7] break-keep">
              {group.theme_verse.text}
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <p className="text-[12px] font-semibold text-gray-500 dark:text-white/50">
                {group.theme_verse.book_name_ko} {group.theme_verse.chapter}:{group.theme_verse.verse}
              </p>
              <Link
                to="/bible/situation"
                className="text-[11.5px] font-bold text-brand inline-flex items-center gap-0.5"
              >
                이 상황의 구절 더 보기
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* 기도 진행률 — 응답이 쌓이는 게 보이는 카드 */}
        <div className="mx-4 mb-3 rounded-2xl p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] font-bold text-gray-500 dark:text-white/55">우리 방의 기도</p>
            {total > 0 && (
              <p className="text-[12px] font-bold text-brand tabular-nums">응답률 {answeredRate}%</p>
            )}
          </div>

          {total === 0 ? (
            <div className="py-3 text-center">
              <p className="text-[13.5px] font-bold text-gray-800 dark:text-white/85 mb-1">
                아직 올라온 기도제목이 없어요
              </p>
              <p className="text-[12px] text-gray-500 dark:text-white/50 leading-[1.5]">
                첫 기도제목을 나누면 여기에서 응답이 쌓여가요
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-[22px] font-bold text-gray-900 dark:text-white tabular-nums">
                  {answered}
                </span>
                <span className="text-[13px] text-gray-500 dark:text-white/55">
                  / {total}개 기도가 응답됐어요 {answered > 0 && '✨'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-500"
                  style={{ width: `${answeredRate}%` }}
                />
              </div>
              {prayed > 0 && (
                <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-2">
                  멤버들이 서로를 위해 <b className="text-brand">{prayed}번</b> 함께 기도했어요
                </p>
              )}
            </>
          )}

          {group.is_member ? (
            <button
              type="button"
              onClick={() =>
                navigate(total === 0 ? `/?group=${groupId}&compose=1` : `/?group=${groupId}`)
              }
              className="w-full mt-3 h-11 rounded-xl bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all"
            >
              {total === 0 ? '첫 기도제목 나누러 가기' : '이 방의 기도 보러 가기'}
            </button>
          ) : (
            <p className="mt-3 text-[12px] text-gray-500 dark:text-white/50 text-center leading-[1.6]">
              멤버만 기도제목을 볼 수 있어요.
              <br />
              관리자에게 초대 링크나 초대 코드를 받아 참여해주세요.
            </p>
          )}
        </div>

        {/* 다가오는 모임 */}
        {group.is_member && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">📅 다가오는 모임</h2>
              {group.is_admin && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="text-xs px-2.5 py-1 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand font-bold"
                >
                  ＋ 모임 만들기
                </button>
              )}
            </div>
            {meetingsLoading ? (
              <div className="text-xs text-gray-500 py-3">{t('loading')}</div>
            ) : meetings.length === 0 ? (
              <div className="text-xs text-gray-500 py-3 text-center bg-white/60 dark:bg-white/[0.03] rounded-xl border border-dashed border-border-light dark:border-border-dark">
                아직 등록된 모임이 없습니다
              </div>
            ) : (
              <div className="space-y-2">
                {meetings.map((m) => {
                  const start = new Date(m.start_datetime)
                  const dateStr = start.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                  })
                  const timeStr = start.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return (
                    <Link
                      key={m.id}
                      to={`/events/${m.id}`}
                      className="block p-3 bg-white/80 dark:bg-card-dark rounded-xl border border-gray-200/70 dark:border-white/[0.08] hover:border-[var(--brand-soft-strong)] transition-colors"
                    >
                      <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {m.title}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {dateStr} · {timeStr}
                        {m.location ? ` · ${m.location}` : ''}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        👤 {m.attendance_count}
                        {m.rsvp_deadline && (
                          <span className="ml-2">
                            ⏰ {new Date(m.rsvp_deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 초대 (관리자만) */}
        {group.is_admin && group.invite_code && (
          <div className="mx-4 mb-4 p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] rounded-2xl text-center">
            <div className="text-xs text-gray-500 dark:text-white/55 mb-1">{t('inviteCode')}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-widest font-mono mb-1.5 select-all">
              {group.invite_code}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-white/50 mb-3">
              {t('shareInviteCode')}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 h-11 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-800 dark:text-white text-[13px] font-bold hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
              >
                {copied ? `✓ ${t('inviteCodeCopied')}` : t('copyInviteCode')}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 h-11 rounded-full bg-brand text-white text-[13px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all"
              >
                🔗 초대 링크 공유
              </button>
            </div>
          </div>
        )}

        {/* 방 나가기 (관리자 아닌 멤버만 — 관리자는 권한 이양 필요) */}
        {group.is_member && !group.is_admin && (
          <div className="px-4 pb-6 text-center">
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaveGroup.isPending}
              className="text-[12px] text-gray-400 dark:text-white/40 underline underline-offset-2 hover:text-gray-600 dark:hover:text-white/60 transition-colors disabled:opacity-50"
            >
              기도방 나가기
            </button>
          </div>
        )}
      </div>

      <CreateGroupMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        groupId={groupId}
        groupName={group.name}
      />
    </div>
  )
}

export default GroupDetail
