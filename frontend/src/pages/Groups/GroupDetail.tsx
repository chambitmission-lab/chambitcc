// 그룹 아지트 — /groups/:id
// 표시 항목: 이름/아이콘/설명/멤버수 + 다가오는 모임 + 관리자에게 초대코드/모임만들기
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useMyGroups } from '../../hooks/useGroups'
import { useEvents } from '../../hooks/useEvents'
import { isAuthenticated } from '../../utils/auth'
import CreateGroupMeetingModal from '../../components/group/CreateGroupMeetingModal'

const GroupDetail = () => {
  const { t } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const { data, isLoading } = useMyGroups()
  const [copied, setCopied] = useState(false)

  const groupId = Number(id)
  const group = data?.data.items.find((g) => g.id === groupId)

  // 오늘 자정(KST) 부터의 일정만 (이미 끝난 모임 숨김)
  const todayIso = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString().slice(0, 10) // YYYY-MM-DD
  }, [])
  const { events: meetings, loading: meetingsLoading } = useEvents(
    group ? todayIso : undefined,
    undefined,
    undefined,
    group ? groupId : undefined,
  )

  const [showCreate, setShowCreate] = useState(false)

  if (!loggedIn) {
    return (
      <div className="bg-gray-50 dark:bg-black min-h-screen pt-20 pb-20">
        <div className="max-w-md mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">{t('loginRequired')}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full"
          >
            {t('login')}
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-black min-h-screen pt-20 pb-20">
        <div className="max-w-md mx-auto px-4 py-8 text-center text-gray-500">
          {t('loading')}
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="bg-gray-50 dark:bg-black min-h-screen pt-20 pb-20">
        <div className="max-w-md mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">{t('noGroupsYet')}</p>
          <button
            onClick={() => navigate('/groups')}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full"
          >
            {t('back')}
          </button>
        </div>
      </div>
    )
  }

  const handleCopy = async () => {
    if (!group.invite_code) return
    try {
      await navigator.clipboard.writeText(group.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback for older browsers / insecure contexts
      const ta = document.createElement('textarea')
      ta.value = group.invite_code
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } finally {
        document.body.removeChild(ta)
      }
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen pt-20 pb-20">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        <button
          onClick={() => navigate('/groups')}
          className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300"
        >
          ← {t('back')}
        </button>

        {/* 그룹 헤더 */}
        <div className="px-4 pb-4 flex items-center gap-3">
          <div className="text-4xl shrink-0" aria-hidden="true">
            {group.icon || '👥'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {group.name}
              </h1>
              {group.is_admin && (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
                  ADMIN
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              👤 {group.member_count}
            </div>
          </div>
        </div>

        {group.description && (
          <div className="px-4 pb-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {group.description}
          </div>
        )}

        {/* 다가오는 모임 */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              📅 다가오는 모임
            </h2>
            {group.is_admin && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-xs px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow"
              >
                ＋ 모임 만들기
              </button>
            )}
          </div>
          {meetingsLoading ? (
            <div className="text-xs text-gray-500 py-3">{t('loading')}</div>
          ) : meetings.length === 0 ? (
            <div className="text-xs text-gray-500 py-3 text-center bg-surface-light dark:bg-surface-dark rounded-lg border border-dashed border-border-light dark:border-border-dark">
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
                    className="block p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
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

        {/* 초대 코드 (관리자만) */}
        {group.is_admin && group.invite_code && (
          <div className="mx-4 mb-6 p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-center">
            <div className="text-xs text-gray-500 mb-1">{t('inviteCode')}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-widest font-mono mb-2">
              {group.invite_code}
            </div>
            <div className="text-[11px] text-gray-500 mb-3">
              {t('shareInviteCode')}
            </div>
            <button
              onClick={handleCopy}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow"
            >
              {copied ? `✓ ${t('inviteCodeCopied')}` : t('copyInviteCode')}
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
