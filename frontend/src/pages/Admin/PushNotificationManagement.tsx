import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendPush, type PushPayload, type SendPushResult } from '../../api/push'
import { getUserList, type User } from '../../api/user'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'

type AudienceMode = 'all' | 'active' | 'admin' | 'selected'
type UserListFilter = 'all' | 'active' | 'admin'

const TITLE_MAX = 50
const BODY_MAX = 200
const DEFAULT_ICON = '/chambitcc/pwa-192x192.png'

interface Preset {
  key: string
  emoji: string
  title: string
  body: string
  url: string
  tag: string
  hint: string
}

const PRESETS: Preset[] = [
  {
    key: 'bulletin',
    emoji: '📰',
    title: '새로운 공지사항',
    body: '새로운 공지사항이 등록되었습니다. 확인해 주세요.',
    url: '/news',
    tag: 'bulletin',
    hint: '공지 등록 직후',
  },
  {
    key: 'sermon',
    emoji: '🎙️',
    title: '새로운 설교',
    body: '새로운 설교 영상이 업로드되었습니다.',
    url: '/sermon',
    tag: 'sermon',
    hint: '주일 설교 업로드 후',
  },
  {
    key: 'prayer',
    emoji: '🙏',
    title: '함께 기도해요',
    body: '오늘의 기도 제목에 함께 동참해 주세요.',
    url: '/home',
    tag: 'prayer',
    hint: '기도 캠페인 시작',
  },
  {
    key: 'event',
    emoji: '📅',
    title: '교회 일정 안내',
    body: '곧 다가오는 교회 일정을 확인해 주세요.',
    url: '/calendar',
    tag: 'event',
    hint: '주간 일정 리마인드',
  },
]

const URL_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '홈', value: '/home' },
  { label: '공지', value: '/news' },
  { label: '설교', value: '/sermon' },
  { label: '일정', value: '/calendar' },
  { label: '기도', value: '/' },
]

export const PushNotificationManagement = () => {
  const navigate = useNavigate()

  // 폼 상태
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/home')
  const [tag, setTag] = useState('notification')
  const [icon, setIcon] = useState(DEFAULT_ICON)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  // 대상 상태
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('all')
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [userListFilter, setUserListFilter] = useState<UserListFilter>('all')
  const [userSearch, setUserSearch] = useState('')

  // 사용자 / 전송 상태
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<
    | { ok: true; data: SendPushResult; audienceLabel: string }
    | { ok: false; message: string }
    | null
  >(null)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    void loadUsers()
  }, [navigate])

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const data = await getUserList()
      setUsers(data.users)
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
      showToast('사용자 목록을 불러오는데 실패했습니다', 'error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const adminCount = users.filter((u) => u.is_admin).length
  const activeCount = users.filter((u) => u.is_active).length

  // 사용자 리스트 (선택 발송 모드용)
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    return users.filter((u) => {
      if (userListFilter === 'active' && !u.is_active) return false
      if (userListFilter === 'admin' && !u.is_admin) return false
      if (!q) return true
      return (
        u.username.toLowerCase().includes(q) ||
        (u.full_name?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [users, userListFilter, userSearch])

  // 실제 발송 대상 user_ids (audienceMode 별)
  const audienceUserIds = useMemo<number[] | undefined>(() => {
    if (audienceMode === 'all') return undefined
    if (audienceMode === 'active') return users.filter((u) => u.is_active).map((u) => u.id)
    if (audienceMode === 'admin') return users.filter((u) => u.is_admin).map((u) => u.id)
    return selectedUserIds
  }, [audienceMode, users, selectedUserIds])

  const audienceCount =
    audienceMode === 'all' ? users.length : (audienceUserIds?.length ?? 0)

  const audienceLabel = (() => {
    if (audienceMode === 'all') return `전체 ${users.length}명`
    if (audienceMode === 'active') return `활성 회원 ${audienceCount}명`
    if (audienceMode === 'admin') return `관리자 ${audienceCount}명`
    return `선택 ${audienceCount}명`
  })()

  // 액션
  const applyPreset = (p: Preset) => {
    setTitle(p.title)
    setBody(p.body)
    setUrl(p.url)
    setTag(p.tag)
    showToast(`'${p.title}' 템플릿이 적용되었습니다`, 'success')
  }

  const toggleUser = (id: number) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredUsers.map((u) => u.id)
    const allSelected = visibleIds.every((id) => selectedUserIds.includes(id))
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      showToast('제목과 내용을 입력해주세요', 'error')
      return
    }
    if ((audienceMode === 'selected' || audienceMode === 'active' || audienceMode === 'admin') &&
        (!audienceUserIds || audienceUserIds.length === 0)) {
      showToast('전송할 대상이 없습니다', 'error')
      return
    }
    if (!confirm(`${audienceLabel}에게 푸시 알림을 전송하시겠습니까?`)) return

    setIsSending(true)
    setResult(null)

    try {
      const payload: PushPayload = {
        title: title.trim(),
        body: body.trim(),
        icon: icon.trim() || DEFAULT_ICON,
        image: '/chambitcc/pwa-512x512.png',
        url: url.trim() || '/',
        tag: tag.trim() || 'notification',
      }
      const data = await sendPush({ payload, user_ids: audienceUserIds })
      setResult({ ok: true, data, audienceLabel })
      if (data.failed === 0 && data.sent > 0) {
        showToast(`${data.sent}명에게 전송 완료`, 'success')
      } else if (data.sent === 0) {
        showToast('실제로 전송된 사용자가 없습니다', 'error')
      } else {
        showToast(`${data.sent}명 성공 · ${data.failed}명 실패`, 'success')
      }
    } catch (error: any) {
      const message = error?.message ?? '푸시 알림 전송에 실패했습니다'
      setResult({ ok: false, message })
      showToast(message, 'error')
    } finally {
      setIsSending(false)
    }
  }

  const handleReset = () => {
    setTitle('')
    setBody('')
    setUrl('/home')
    setTag('notification')
    setIcon(DEFAULT_ICON)
    setSelectedUserIds([])
    setAudienceMode('all')
    setResult(null)
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !isSending && audienceCount > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-28">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
          >
            <span className="material-icons-outlined">arrow_back</span>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white">푸시 알림</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 통계 칩 */}
        <div className="px-4 pt-4 pb-1 flex gap-2 flex-wrap">
          <StatChip label="회원" value={users.length} />
          <StatChip label="활성" value={activeCount} />
          <StatChip label="관리자" value={adminCount} accent />
        </div>

        {/* 빠른 템플릿 */}
        <SectionCard title="빠른 템플릿" subtitle="자주 보내는 알림을 한 번에 채워요">
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p)}
                className="group text-left rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:border-purple-300 dark:hover:border-purple-400/40 hover:bg-purple-50/40 dark:hover:bg-purple-500/[0.06] transition-all p-3 flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[16px]">{p.emoji}</span>
                  <span className="text-[12.5px] font-semibold text-gray-900 dark:text-white truncate">{p.title}</span>
                </div>
                <span className="text-[10.5px] text-gray-500 dark:text-white/50 truncate">{p.hint}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* 알림 작성 */}
        <SectionCard title="알림 작성">
          <FieldLabel htmlFor="push-title">
            제목
            <CharCount current={title.length} max={TITLE_MAX} />
          </FieldLabel>
          <input
            id="push-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            placeholder="알림 제목"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
          />

          <FieldLabel htmlFor="push-body" className="mt-4">
            내용
            <CharCount current={body.length} max={BODY_MAX} />
          </FieldLabel>
          <textarea
            id="push-body"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
            placeholder="알림 내용"
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors resize-none"
          />

          <FieldLabel className="mt-4">이동 위치</FieldLabel>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {URL_OPTIONS.map((opt) => (
              <FilterChip key={opt.value} active={url === opt.value} onClick={() => setUrl(opt.value)}>
                {opt.label}
              </FilterChip>
            ))}
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/news"
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12.5px] text-gray-700 dark:text-white/85 placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors font-mono"
          />

          {/* 고급 옵션 */}
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="mt-4 w-full flex items-center justify-between text-[12px] text-gray-500 dark:text-white/55 hover:text-gray-700 dark:hover:text-white/80 transition-colors"
          >
            <span>고급 옵션 (태그 · 아이콘 URL)</span>
            <span
              className={`material-icons-outlined text-[18px] transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`}
            >
              expand_more
            </span>
          </button>
          {advancedOpen && (
            <div className="mt-3 space-y-3">
              <div>
                <FieldLabel htmlFor="push-tag">태그</FieldLabel>
                <input
                  id="push-tag"
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="notification"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12.5px] text-gray-700 dark:text-white/85 placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors font-mono"
                />
                <p className="mt-1 text-[10.5px] text-gray-400 dark:text-white/40">같은 태그의 이전 알림은 새 알림으로 대체됩니다</p>
              </div>
              <div>
                <FieldLabel htmlFor="push-icon">아이콘 URL</FieldLabel>
                <input
                  id="push-icon"
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder={DEFAULT_ICON}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12.5px] text-gray-700 dark:text-white/85 placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors font-mono"
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* 미리보기 */}
        <SectionCard title="미리보기" subtitle="기기에서 이렇게 표시됩니다">
          <NotificationPreview
            title={title || '알림 제목'}
            body={body || '알림 내용이 여기에 표시됩니다'}
            icon={icon || DEFAULT_ICON}
          />
        </SectionCard>

        {/* 대상 */}
        <SectionCard title="전송 대상">
          <FilterRow label="대상">
            <FilterChip active={audienceMode === 'all'} onClick={() => setAudienceMode('all')}>
              전체
            </FilterChip>
            <FilterChip active={audienceMode === 'active'} onClick={() => setAudienceMode('active')}>
              활성 회원
            </FilterChip>
            <FilterChip active={audienceMode === 'admin'} onClick={() => setAudienceMode('admin')}>
              관리자
            </FilterChip>
            <FilterChip active={audienceMode === 'selected'} onClick={() => setAudienceMode('selected')}>
              직접 선택
            </FilterChip>
          </FilterRow>

          <div className="mt-3 rounded-xl bg-purple-50/60 dark:bg-purple-500/[0.08] border border-purple-200/60 dark:border-purple-400/20 px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-[12.5px] text-gray-700 dark:text-white/80">
              발송 대상
            </span>
            <span className="text-[13px] font-bold text-purple-700 dark:text-purple-300">
              {audienceLabel}
            </span>
          </div>

          {audienceMode === 'selected' && (
            <div className="mt-3 space-y-3">
              {/* 검색 */}
              <div className="relative">
                <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 text-[20px] pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="아이디 · 이름 검색"
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => setUserSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 p-1 rounded-full"
                    aria-label="검색어 지우기"
                  >
                    <span className="material-icons-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* 필터 + 일괄 선택 */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-1.5 flex-wrap">
                  <FilterChip active={userListFilter === 'all'} onClick={() => setUserListFilter('all')}>
                    전체
                  </FilterChip>
                  <FilterChip active={userListFilter === 'active'} onClick={() => setUserListFilter('active')}>
                    활성
                  </FilterChip>
                  <FilterChip active={userListFilter === 'admin'} onClick={() => setUserListFilter('admin')}>
                    관리자
                  </FilterChip>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAllVisible}
                  className="text-[11.5px] font-semibold text-purple-700 dark:text-purple-300 hover:underline px-2 py-1"
                >
                  {filteredUsers.every((u) => selectedUserIds.includes(u.id)) && filteredUsers.length > 0
                    ? '보이는 행 해제'
                    : '보이는 행 선택'}
                </button>
              </div>

              {/* 사용자 리스트 */}
              <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5 -mx-1 px-1">
                {isLoadingUsers ? (
                  <SkeletonRows />
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-3xl block mb-2">🔍</span>
                    <p className="text-[12.5px] text-gray-500 dark:text-white/55">검색 결과가 없습니다</p>
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <UserPickRow
                      key={u.id}
                      user={u}
                      selected={selectedUserIds.includes(u.id)}
                      onToggle={() => toggleUser(u.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </SectionCard>

        {/* 전송 결과 */}
        {result && (
          <SectionCard title="전송 결과">
            {result.ok ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`material-icons-outlined text-[20px] ${
                      result.data.failed === 0 && result.data.sent > 0
                        ? 'text-green-500'
                        : result.data.sent === 0
                        ? 'text-red-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {result.data.sent === 0
                      ? 'error_outline'
                      : result.data.failed === 0
                      ? 'check_circle'
                      : 'info'}
                  </span>
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                    {result.audienceLabel} 대상 전송 완료
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ResultStat label="성공" value={result.data.sent} tone="success" />
                  <ResultStat label="실패" value={result.data.failed} tone={result.data.failed > 0 ? 'danger' : 'muted'} />
                  <ResultStat label="구독자" value={result.data.users_notified} tone="muted" />
                </div>
                {result.data.failed > 0 && (
                  <p className="mt-3 text-[11.5px] text-gray-500 dark:text-white/55 leading-relaxed">
                    실패한 사용자는 구독 만료 또는 미구독 상태입니다. 해당 사용자에게 프로필에서 알림 재구독을 안내해주세요.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <span className="material-icons-outlined text-[20px] text-red-500 mt-0.5">error</span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-red-600 dark:text-red-300">전송 실패</p>
                  <p className="text-[12px] text-gray-600 dark:text-white/65 mt-1">{result.message}</p>
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {/* 안내 (접기) */}
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={() => setInfoOpen((v) => !v)}
            className="w-full flex items-center justify-between text-[12px] text-gray-500 dark:text-white/55 hover:text-gray-700 dark:hover:text-white/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-icons-outlined text-[16px]">info</span>
              사용 안내
            </span>
            <span
              className={`material-icons-outlined text-[18px] transition-transform duration-200 ${infoOpen ? 'rotate-180' : ''}`}
            >
              expand_more
            </span>
          </button>
          {infoOpen && (
            <ul className="mt-3 space-y-1.5 text-[11.5px] text-gray-500 dark:text-white/55 leading-relaxed pl-1.5">
              <li>· 프로필에서 알림을 활성화한 사용자에게만 전송됩니다.</li>
              <li>· 같은 태그의 이전 알림은 새 알림으로 대체되어 중복 푸시가 쌓이지 않습니다.</li>
              <li>· 전송 실패 사용자는 구독 만료/미구독 상태로, 재구독 안내가 필요합니다.</li>
              <li>· VAPID 키가 갱신되면 모든 사용자가 재구독해야 합니다.</li>
            </ul>
          )}
        </div>
      </div>

      {/* sticky 발송 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="m-3 rounded-2xl border border-white/[0.08] bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.18)] p-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSending}
              className="px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/80 text-[12.5px] font-semibold border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08] disabled:opacity-50"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-[0_0_18px_rgba(168,85,247,0.45)] disabled:opacity-50 disabled:hover:shadow-none transition-all"
            >
              {isSending ? (
                <>
                  <span className="material-icons-outlined text-[18px] animate-spin">progress_activity</span>
                  전송 중…
                </>
              ) : (
                <>
                  <span className="material-icons-outlined text-[18px]">send</span>
                  {audienceLabel}에게 전송
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 공통 컴포넌트 ─────────────────────────────────────────

const SectionCard = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) => (
  <div className="px-4 py-3">
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4">
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      <div className="relative z-10">
        <div className="mb-3">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-gray-900 dark:text-white">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-white/55">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  </div>
)

const StatChip = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
  <span
    className={
      accent
        ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-[12px] font-semibold text-purple-700 dark:text-purple-300'
        : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-[12px] font-semibold text-gray-700 dark:text-white/75'
    }
  >
    {label}
    <span className="font-bold">{value}</span>
  </span>
)

const FilterRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-[11px] font-semibold text-gray-500 dark:text-white/45 w-9 shrink-0">{label}</span>
    <div className="flex gap-1.5 flex-wrap min-w-0">{children}</div>
  </div>
)

const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150 ${
      active
        ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'
        : 'text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-100/70 dark:hover:bg-white/[0.04]'
    }`}
  >
    {children}
  </button>
)

const FieldLabel = ({
  htmlFor,
  children,
  className = '',
}: {
  htmlFor?: string
  children: ReactNode
  className?: string
}) => (
  <label
    htmlFor={htmlFor}
    className={`flex items-center justify-between text-[11.5px] font-semibold text-gray-500 dark:text-white/55 mb-1.5 ${className}`}
  >
    {children}
  </label>
)

const CharCount = ({ current, max }: { current: number; max: number }) => {
  const ratio = Math.min(1, current / max)
  const tone = ratio >= 1 ? 'text-red-500' : ratio >= 0.85 ? 'text-amber-500' : 'text-gray-400 dark:text-white/40'
  return (
    <span className={`text-[10.5px] font-mono ${tone}`}>
      {current}/{max}
    </span>
  )
}

const SkeletonRows = () => (
  <div className="space-y-1.5">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-[52px] rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ─── 사용자 선택 행 ───────────────────────────────────────

const UserPickRow = ({
  user,
  selected,
  onToggle,
}: {
  user: User
  selected: boolean
  onToggle: () => void
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${
      selected
        ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-300/60 dark:border-purple-400/30'
        : 'bg-white/60 dark:bg-white/[0.03] border-gray-200/70 dark:border-white/[0.06] hover:border-purple-200 dark:hover:border-purple-400/20'
    }`}
  >
    <span
      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
        selected
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
          : 'bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1]'
      }`}
    >
      {selected && <span className="material-icons-outlined text-[14px]">check</span>}
    </span>

    <div className="relative shrink-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[12px] font-bold">
        {(user.full_name || user.username).charAt(0).toUpperCase()}
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-background-light dark:ring-card-dark ${
          user.is_active ? 'bg-green-500' : 'bg-gray-400 dark:bg-white/30'
        }`}
      />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
          {user.full_name || user.username}
        </span>
        {user.is_admin && (
          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.05em] shrink-0">
            ADMIN
          </span>
        )}
      </div>
      <div className="text-[11px] text-gray-500 dark:text-white/45 truncate">@{user.username}</div>
    </div>
  </button>
)

// ─── 알림 미리보기 ────────────────────────────────────────

const NotificationPreview = ({
  title,
  body,
  icon,
}: {
  title: string
  body: string
  icon: string
}) => {
  const now = new Date()
  const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/[0.06] dark:to-white/[0.02] border border-gray-200/70 dark:border-white/[0.06] p-3">
      <div className="rounded-xl bg-white dark:bg-[#1f1f2a] border border-gray-200/80 dark:border-white/[0.06] shadow-sm p-3 flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <img
            src={icon}
            alt="icon"
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-semibold text-gray-500 dark:text-white/55">참빛교회</span>
            <span className="text-[10.5px] text-gray-400 dark:text-white/40">{timeLabel}</span>
          </div>
          <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{title}</p>
          <p className="text-[12px] text-gray-700 dark:text-white/75 leading-snug line-clamp-2 break-words">{body}</p>
        </div>
      </div>
    </div>
  )
}

// ─── 결과 통계 ────────────────────────────────────────────

const ResultStat = ({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'danger' | 'muted'
}) => {
  const toneCls =
    tone === 'success'
      ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-400/20'
      : tone === 'danger'
      ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-400/20'
      : 'bg-gray-50 dark:bg-white/[0.04] text-gray-700 dark:text-white/75 border-gray-200 dark:border-white/[0.06]'
  return (
    <div className={`rounded-xl border px-3 py-2 text-center ${toneCls}`}>
      <div className="text-[10.5px] font-semibold opacity-75">{label}</div>
      <div className="text-[18px] font-bold tracking-tight">{value}</div>
    </div>
  )
}

export default PushNotificationManagement
