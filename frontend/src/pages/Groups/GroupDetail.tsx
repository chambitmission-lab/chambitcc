// 기도방 홈 — /groups/:id
// 탭 구조(오늘/기도/우리): 기도 피드가 기본 랜딩 — 방에 오는 이유(멤버들의 기도제목)가 첫 화면.
// 오늘: 히어로(중보 CTA·체크인)·7일 스트립·성구·응답률·릴레이·다가오는 모임(구 모임 탭 흡수)
// 기도: 그룹 피드 임베드 + 은혜의 기록 / 우리: 멤버·초대(QR)·가입 신청·케어
// "오늘의 중보" 가이드 모드: 기도제목을 한 장씩 넘기며 기도 → 마지막 장에서 체크인 자동 기록
// PC: 상단바에 탭을 인라인으로 올리고, 우측 레일에 방 카드·최근 기도·최근 활동·멤버 미리보기
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useGroup, useGroupMembers, useGroupDigest } from '../../hooks/useGroups'
import { useEvents } from '../../hooks/useEvents'
import { isAuthenticated, getCurrentUser } from '../../utils/auth'
import CreateGroupMeetingModal from '../../components/group/CreateGroupMeetingModal'
import GroupHomeHero from './components/GroupHomeHero'
import GroupPrayerTab from './components/GroupPrayerTab'
import GroupMembersTab from './components/GroupMembersTab'
import GroupSettingsSheet from './components/GroupSettingsSheet'
import IntercessionRelayCard from './components/IntercessionRelayCard'
import IntercessionMode from './components/IntercessionMode'
import { MemberPreviewCard, RecentActivityCard, RecentPrayersCard } from './components/GroupRailWidgets'
import { shareGroupInvite } from './utils/shareInvite'
import { formatKstDateTime, kstDateKey, parseKstDate } from '../../utils/kstTime'
import {
  CalendarIcon,
  GearIcon,
  GroupGlyph,
  PeopleIcon,
  PersonIcon,
  PrayIcon,
  ShareIcon,
  SparkleIcon,
} from './GroupIcons'
import './groupDetail.css'

type TabKey = 'today' | 'prayers' | 'members'

const TABS: { key: TabKey; label: string; icon: (p: { size?: number }) => ReactNode }[] = [
  { key: 'today', label: '오늘', icon: SparkleIcon },
  { key: 'prayers', label: '기도', icon: PrayIcon },
  { key: 'members', label: '우리', icon: PeopleIcon },
]

// 구 URL(?tab=home|meetings)과의 호환 — 북마크·푸시 링크가 깨지지 않게
const LEGACY_TABS: Record<string, TabKey> = { home: 'today', meetings: 'today' }

const CARD = 'rounded-2xl p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]'

const GroupDetail = () => {
  const { t, language } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const loggedIn = isAuthenticated()

  const groupId = Number(id)
  const { data, isLoading } = useGroup(groupId)
  const group = data?.data

  // 탭 상태는 URL(?tab=)에 실어 뒤로가기·새로고침에도 유지 — 기본은 기도 피드
  const rawTab = searchParams.get('tab')
  const tabParam = (rawTab && LEGACY_TABS[rawTab]) || rawTab
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : 'prayers'
  const setTab = (next: TabKey, extra?: Record<string, string>) => {
    setSearchParams(next === 'prayers' && !extra ? {} : { tab: next, ...extra }, { replace: true })
  }
  // 레일의 "기도 제목 작성하기" — 기도 탭으로 가면서 컴포저를 바로 연다
  const openComposeInPrayers = () => setTab('prayers', { compose: '1' })

  const [showCreate, setShowCreate] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showIntercession, setShowIntercession] = useState(false)

  // 오늘 탭의 중보 릴레이·멤버 미리보기용 멤버 목록 (멤버 탭과 캐시 공유)
  const { data: membersData } = useGroupMembers(groupId, !!group?.is_member)
  const members = membersData?.data.items ?? []
  const myUsername = getCurrentUser().username

  // 오늘의 체크인 상태 — 히어로와 캐시 공유 (기도 탭 상단 중보 배너·레일 CTA 판정용)
  const { data: digestData } = useGroupDigest(groupId, !!group?.is_member)
  const digest = digestData?.data

  // 오늘 자정(KST) 부터의 일정만 (이미 끝난 모임 숨김)
  const todayIso = useMemo(() => kstDateKey(new Date()), [])
  // RSVP 마감 판정 기준 시각 — 진입 시점 한 번만 고정 (렌더 순수성)
  const nowMs = useMemo(() => new Date().getTime(), [])
  const { events: meetings, loading: meetingsLoading } = useEvents(
    group?.is_member ? todayIso : undefined,
    undefined,
    undefined,
    group?.is_member ? groupId : undefined,
  )

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 page-stage">
        <div className="max-w-md mx-auto bg-[var(--app-canvas)] border-x border-border-light dark:border-border-dark min-h-screen flex flex-col items-center justify-center px-6 py-12 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-[60vh]">
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
      <div className="min-h-screen bg-[var(--app-canvas)] page-stage">
        <div className="max-w-md mx-auto bg-[var(--app-canvas)] border-x border-border-light dark:border-border-dark min-h-screen px-4 pt-14 space-y-3 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
        <div className="h-52 rounded-[1.25rem] bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          <div className="h-32 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          <div className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 page-stage">
        <div className="max-w-md mx-auto bg-[var(--app-canvas)] border-x border-border-light dark:border-border-dark min-h-screen flex flex-col items-center justify-center px-6 py-12 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-[60vh]">
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

  // 오늘 탭이 아닌 곳에서는 방 헤더를 접는다 (피드가 첫 화면에 들어오도록)
  const compactHeader = !!group.is_member && tab !== 'today'
  const answered = group.answered_count ?? 0
  const total = group.prayer_count ?? 0
  const prayed = group.prayed_count ?? 0
  const answeredRate = total > 0 ? Math.round((answered / total) * 100) : 0
  const canShare = !!group.invite_code
  // 중보 모드를 권할 조건 — 기도제목이 있고 아직 오늘 기도를 안 했을 때
  const suggestIntercession = !!group.is_member && total > 0 && !!digest && !digest.my_checked_in

  const actionBtn =
    'w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors'

  const renderTabs = (variant: 'bar' | 'inline') => (
    <div className={variant === 'inline' ? 'flex items-stretch gap-1' : 'flex'}>
      {TABS.map(({ key, label, icon: Icon }) => {
        const active = tab === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              'relative inline-flex items-center justify-center gap-1.5 transition-colors',
              variant === 'inline' ? 'px-4 h-12 text-[13.5px]' : 'flex-1 py-2.5 text-[13px]',
              active ? 'font-bold text-ink-strong' : 'font-medium text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70',
            ].join(' ')}
          >
            <Icon size={variant === 'inline' ? 17 : 15} />
            {label}
            {active && (
              <span
                className={[
                  'absolute bottom-0 h-[2.5px] rounded-full bg-brand',
                  variant === 'inline' ? 'left-2 right-2' : 'left-1/4 right-1/4',
                ].join(' ')}
              />
            )}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 셸을 풀고 본문(탭 콘텐츠) + 우측 레일(방 정보) 2단.
          방 정체성과 근황이 어느 탭에서든 옆에 남는다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-[var(--app-canvas)] border-x border-border-light dark:border-border-dark min-h-screen pb-20 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0 lg:bg-surface">
        {/* ── 상단 바 ── 모바일: 뒤로 + 액션 / PC: 뒤로 + 탭(인라인) + 액션 */}
        <div className="flex items-center justify-between gap-2 pl-1 pr-3 lg:pl-3 lg:pr-4 lg:h-16 lg:border-b lg:border-border-light dark:lg:border-border-dark">
          <button
            type="button"
            onClick={() => navigate('/groups')}
            className="inline-flex items-center gap-1.5 px-3 py-3 text-[13.5px] text-gray-600 dark:text-gray-300 hover:text-ink-strong transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t('back')}
          </button>

          {group.is_member && <div className="hidden lg:block flex-1 min-w-0">{renderTabs('inline')}</div>}

          <div className="flex items-center gap-2">
            {canShare && (
              <button
                type="button"
                onClick={() => void shareGroupInvite(group)}
                className={actionBtn}
                aria-label="초대 링크 공유"
                title="초대 링크 공유"
              >
                <ShareIcon size={18} />
              </button>
            )}
            {group.is_member && (
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className={actionBtn}
                aria-label="기도방 설정"
                title="기도방 설정"
              >
                <GearIcon size={18} />
              </button>
            )}
          </div>
        </div>

        {/* 방 헤더(모바일) — 오늘 밖(기도·우리)에서는 접어서 콘텐츠에 첫 화면을 내준다.
            PC에서는 우측 레일의 방 카드가 이 역할을 맡는다 */}
        <div className={`px-4 flex items-center gap-3 lg:hidden ${compactHeader ? 'pb-2.5' : 'pb-3'}`}>
          <div
            className={`shrink-0 rounded-2xl bg-brand flex items-center justify-center shadow-[0_6px_18px_-6px_var(--brand-glow)] transition-all duration-300 ${
              compactHeader ? 'w-10 h-10' : 'w-14 h-14'
            }`}
          >
            <GroupGlyph emoji={group.icon || '🙏'} size={compactHeader ? 22 : 30} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className={`font-bold text-ink-strong tracking-[-0.015em] truncate ${
                  compactHeader ? 'text-[16.5px]' : 'text-[20px]'
                }`}
              >
                {group.name}
              </h1>
              {group.is_admin && (
                <span className="shrink-0 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand tracking-[0.05em]">
                  ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-gray-500 dark:text-white/55">
              <span className="inline-flex items-center gap-1"><PersonIcon size={12} /> {group.member_count}명</span>
              {total > 0 && (
                <>
                  <span className="text-gray-300 dark:text-white/20">·</span>
                  <span className="inline-flex items-center gap-1"><PrayIcon size={12} /> 기도 {total}개</span>
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

        {group.description && !compactHeader && (
          <p className="px-4 pb-3 text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-[1.6] lg:hidden">
            {group.description}
          </p>
        )}

        {/* 탭 바(모바일) — PC는 상단 바에 인라인 */}
        {group.is_member && (
          <div className="sticky top-0 z-40 bg-surface border-b border-border-light dark:border-border-dark px-4 lg:hidden">
            {renderTabs('bar')}
          </div>
        )}

        {/* ── 오늘 탭 ── */}
        {(!group.is_member || tab === 'today') && (
          <div className="pt-3 lg:pt-5">
            {/* 얇은 하늘 히어로 — 오늘의 중보 CTA + 체크인 + 주간 요약 + 7일 스트립 */}
            {group.is_member && (
              <GroupHomeHero
                groupId={groupId}
                hasPrayers={total > 0}
                onStartIntercession={() => setShowIntercession(true)}
                onCompose={openComposeInPrayers}
              />
            )}

            <div className="lg:grid lg:grid-cols-2 lg:gap-x-3 lg:items-start lg:px-4">
              {/* 오늘의 성구 — 테마가 있는 방에만 */}
              {group.theme_verse && group.theme && (
                <div className={`mx-4 mb-3 lg:mx-0 ${CARD} lg:p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="gd-quote text-[34px] font-black select-none" aria-hidden="true">
                      “
                    </span>
                    <p className="text-[13.5px] font-bold text-ink-strong">
                      오늘의 성구
                      <span className="ml-1.5 text-[11.5px] font-semibold" style={{ color: group.theme.color }}>
                        · {group.theme.name}
                      </span>
                    </p>
                  </div>
                  <p className="text-[15px] font-semibold text-ink-strong leading-[1.7] break-keep">
                    {group.theme_verse.text}
                  </p>
                  <div className="flex items-center justify-between mt-3.5">
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
              <div className={`mx-4 mb-3 lg:mx-0 ${CARD} lg:p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13.5px] font-bold text-ink-strong">우리 방의 기도</p>
                  {total > 0 && (
                    <p className="text-[12px] font-bold text-brand tabular-nums">응답률 {answeredRate}%</p>
                  )}
                </div>

                {total === 0 ? (
                  <div className="py-3 text-center">
                    <p className="text-[13.5px] font-bold text-ink-strong/85 mb-1">
                      아직 올라온 기도제목이 없어요
                    </p>
                    <p className="text-[12px] text-gray-500 dark:text-white/50 leading-[1.5]">
                      첫 기도제목을 나누면 여기에서 응답이 쌓여가요
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1.5 mb-2.5">
                      <span className="text-[26px] font-bold text-ink-strong tabular-nums leading-none">{answered}</span>
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
                      <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-2.5">
                        멤버들이 서로를 위해 <b className="text-brand">{prayed}번</b> 함께 기도했어요
                      </p>
                    )}
                  </>
                )}

                {group.is_member ? (
                  <button
                    type="button"
                    onClick={() => (total === 0 ? openComposeInPrayers() : setTab('prayers'))}
                    className="w-full mt-4 h-11 rounded-xl bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all"
                  >
                    {total === 0 ? '첫 기도제목 나누기' : '이 방의 기도 보기'}
                  </button>
                ) : (
                  <p className="mt-3 text-[12px] text-gray-500 dark:text-white/50 text-center leading-[1.6]">
                    멤버만 기도제목을 볼 수 있어요.
                    <br />
                    관리자에게 초대 링크나 초대 코드를 받아 참여해주세요.
                  </p>
                )}
              </div>

              {/* 중보 릴레이 — 매주 한 명씩 자동 순환 */}
              {group.is_member && (
                <div className="lg:[&>div]:mx-0">
                  <IntercessionRelayCard members={members} myUsername={myUsername} />
                </div>
              )}

              {/* 함께 기도 시간 */}
              {group.is_member && group.prayer_time && (
                <div className={`mx-4 mb-3 lg:mx-0 ${CARD} flex items-center gap-3`}>
                  <div className="shrink-0 w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-400/[0.12] flex items-center justify-center text-[20px]">
                    🕯️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold text-ink-strong">
                      매일 {group.prayer_time} 함께 기도해요
                    </p>
                    <p className="text-[11.5px] text-gray-500 dark:text-white/55 leading-[1.5]">
                      시간이 되면 멤버 모두에게 알림이 가요
                    </p>
                  </div>
                  <Link
                    to="/prayer-focus"
                    className="shrink-0 px-3 h-8 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[11.5px] font-bold inline-flex items-center"
                  >
                    골방 기도
                  </Link>
                </div>
              )}

              {/* 다가오는 모임 — 구 '모임' 탭을 흡수한 자리. 대부분의 방에서 비어 있던
                  탭 하나를 없애고, 있을 때만 오늘의 흐름 속에 자연스럽게 보인다 */}
              {group.is_member && (
                <div className={`mx-4 mb-3 lg:mx-0 lg:col-span-2 ${CARD}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-ink-strong inline-flex items-center gap-1.5">
                      <CalendarIcon size={16} /> 다가오는 모임
                    </h2>
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
                    <p className="text-xs text-gray-500 dark:text-white/45 py-2">
                      아직 등록된 모임이 없어요
                    </p>
                  ) : (
                    <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0 lg:items-start">
                      {meetings.map((m) => {
                        // 모임 시각은 교회 현지(서울) 기준으로 고정 표시
                        const start = parseKstDate(m.start_datetime)
                        const dateStr = start.toLocaleDateString(undefined, {
                          timeZone: 'Asia/Seoul',
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })
                        const timeStr = start.toLocaleTimeString(undefined, {
                          timeZone: 'Asia/Seoul',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        return (
                          <Link
                            key={m.id}
                            to={`/events/${m.id}`}
                            className="block p-3 bg-white/60 dark:bg-white/[0.03] rounded-xl border border-gray-200/70 dark:border-white/[0.08] hover:border-[var(--brand-soft-strong)] transition-colors"
                          >
                            <div className="font-semibold text-sm text-ink-strong truncate">{m.title}</div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {dateStr} · {timeStr}
                              {m.location ? ` · ${m.location}` : ''}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5 inline-flex items-center gap-1">
                              <PersonIcon size={11} /> {m.attendance_count}
                              {m.rsvp_deadline && (
                                <span className="ml-2">
                                  ⏰ {formatKstDateTime(m.rsvp_deadline, language)}
                                  {parseKstDate(m.rsvp_deadline).getTime() <= nowMs && ' · 접수 마감'}
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
            </div>
          </div>
        )}

        {/* ── 기도 탭 ── */}
        {group.is_member && tab === 'prayers' && (
          <div className="lg:max-w-[640px] lg:mx-auto">
            {/* 오늘 아직 기도하지 않았다면 — 피드 위에 중보 모드 입구 한 줄 */}
            {suggestIntercession && (
              <div className="px-4 pt-3">
                <button
                  type="button"
                  onClick={() => setShowIntercession(true)}
                  className="w-full h-11 rounded-full flex items-center gap-2.5 pl-4 pr-1.5 bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-left active:scale-[0.99] transition-transform"
                >
                  <PrayIcon size={15} className="shrink-0 text-brand" />
                  <span className="flex-1 min-w-0 truncate text-[12.5px] font-semibold text-brand">
                    오늘의 중보 — 기도제목을 한 장씩 넘기며 기도해요
                  </span>
                  <span className="shrink-0 h-8 px-3.5 rounded-full bg-brand text-white text-[12px] font-bold inline-flex items-center">
                    시작
                  </span>
                </button>
              </div>
            )}
            <GroupPrayerTab groupId={groupId} />
          </div>
        )}

        {/* ── 우리 탭 (멤버·초대·케어) ── */}
        {group.is_member && tab === 'members' && <GroupMembersTab group={group} />}
      </div>

      {/* 우측 위젯 레일 (lg+) — 본문 헤더(lg:hidden)를 대신하는 방 카드 + 방의 근황
          (최근 기도·최근 활동·멤버 미리보기·다음 모임·함께 기도 시간) */}
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
        <section className="rounded-2xl p-5 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-none">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-[68px] h-[68px] rounded-[1.25rem] bg-brand flex items-center justify-center text-white shadow-[0_10px_24px_-8px_var(--brand-glow)]">
              <GroupGlyph emoji={group.icon || '🙏'} size={34} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-[19px] font-bold text-ink-strong tracking-[-0.02em] truncate">
                  {group.name}
                </h2>
                {group.is_admin && (
                  <span className="shrink-0 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand tracking-[0.05em]">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5 mt-1.5 text-[12px] text-gray-500 dark:text-white/55">
                <span className="inline-flex items-center gap-1"><PersonIcon size={13} /> {group.member_count}명</span>
                <span className="inline-flex items-center gap-1"><PrayIcon size={13} /> {total}개</span>
              </div>
            </div>
          </div>

          {group.theme && (
            <span
              className="inline-flex items-center gap-1 mt-4 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: group.theme.color }}
            >
              <span className="material-icons-round text-[13px]">{group.theme.icon}</span>
              {group.theme.name}
            </span>
          )}

          {group.description && (
            <p className="mt-3.5 text-[13px] text-gray-600 dark:text-white/60 leading-[1.7] whitespace-pre-wrap line-clamp-4">
              {group.description}
            </p>
          )}

          <div className="mt-5">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[12px] font-bold text-gray-500 dark:text-white/50">응답률</span>
              <span className="text-[15px] font-bold text-brand tabular-nums">{answeredRate}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${answeredRate}%` }}
              />
            </div>
          </div>

          {/* 기본 랜딩이 기도 탭이라 PC에선 히어로가 안 보인다 — 레일에서 중보 모드로 */}
          {suggestIntercession && (
            <button
              type="button"
              onClick={() => setShowIntercession(true)}
              className="w-full mt-4 h-11 rounded-xl bg-brand text-white text-[13px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all inline-flex items-center justify-center gap-1.5"
            >
              <PrayIcon size={16} />
              오늘의 중보 시작하기
            </button>
          )}
        </section>

        {group.is_member && tab !== 'prayers' && (
          <RecentPrayersCard
            groupId={groupId}
            onViewAll={() => setTab('prayers')}
            onCompose={openComposeInPrayers}
          />
        )}

        {group.is_member && <RecentActivityCard groupId={groupId} onViewAll={() => setTab('prayers')} />}

        {group.is_member && tab !== 'members' && (
          <MemberPreviewCard
            members={members}
            memberCount={group.member_count}
            onViewAll={() => setTab('members')}
          />
        )}

        {group.is_member && group.prayer_time && (
          <section className="rounded-2xl p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-400/[0.12] flex items-center justify-center text-[18px]">
              🕯️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-bold text-ink-strong">
                매일 {group.prayer_time} 함께 기도
              </p>
              <Link to="/prayer-focus" className="text-[11.5px] font-bold text-brand">
                골방 기도 →
              </Link>
            </div>
          </section>
        )}

        {group.is_member && meetings.length > 0 && (
          <section className="rounded-2xl p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
            <p className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
              다가오는 모임
            </p>
            <div className="flex flex-col -mx-1">
              {meetings.slice(0, 3).map((m) => {
                const start = parseKstDate(m.start_datetime)
                return (
                  <Link
                    key={m.id}
                    to={`/events/${m.id}`}
                    className="flex items-center gap-2.5 px-1 py-2 rounded-lg hover:bg-[var(--brand-soft)] transition-colors"
                  >
                    <span className="shrink-0 w-10 text-[11px] font-bold tabular-nums text-gray-400 dark:text-white/40">
                      {start.toLocaleDateString(undefined, {
                        timeZone: 'Asia/Seoul',
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-[12.5px] font-semibold text-ink-strong">
                      {m.title}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </aside>
      </div>

      <CreateGroupMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        groupId={groupId}
        groupName={group.name}
      />

      {showSettings && <GroupSettingsSheet group={group} onClose={() => setShowSettings(false)} />}

      {showIntercession && (
        <IntercessionMode
          groupId={groupId}
          groupName={group.name}
          onClose={() => setShowIntercession(false)}
        />
      )}
    </div>
  )
}

export default GroupDetail
