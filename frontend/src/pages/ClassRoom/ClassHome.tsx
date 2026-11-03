import { Lock } from '../../components/icons/phosphor'
// 우리반 알림장 홈 (/classes/:classId) — '주간 매거진' (2026-11-03 개편)
// 한 주 = 한 호(VOL.). 스토리 링(안 본·할 일) → 호 머리말 → 표지(이번 주 암송 말씀 + 반 삽화)
// → 이번 호 꼭지(공지·일정·사진·투표) → 지난 호 보관함
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { prefetchClassStars, useClassDetail, useClassPosts, useLeaveClass } from '../../hooks/useClassRoom'
import { queryClient } from '../../config/queryClient'
import { useThemeArt } from '../../hooks/useThemeArt'
import type { ClassPost } from '../../types/classRoom'
import { isAuthenticated } from '../../utils/auth'
import { classInviteUrl } from '../../utils/inviteLink'
import { safeStorage } from '../../utils/safeStorage'
import { CLASS_HERO } from '../../utils/themeAssets'
import { showToast } from '../../utils/toast'
import ClassStories from './components/ClassStories'
import IssueChapter from './components/IssueChapter'
import IssueCover from './components/IssueCover'
import PastIssues from './components/PastIssues'
import VersePracticeSheet from './components/VersePracticeSheet'
import { Shell } from './classUi'
import {
  awaitingMe,
  groupIssues,
  issueNo,
  latestVersePost,
  thisWeekKey,
  toStampSlot,
  weekKeyOf,
  weekLabel,
  type StampSlot,
} from './classWeek'
import { goClassSubPage, warmClassSubPage, warmClassSubPageChunks, type ClassSubPage } from './classSubPage'
import {
  CameraIcon,
  ChartIcon,
  ClipboardIcon,
  EnvelopeIcon,
  MailboxIcon,
  SproutIcon,
  StarIcon,
  type IconFn,
} from './ClassIcons'
import { confirmDialog } from '../../utils/confirmDialog'
import { redirectAfterLogin } from '../../utils/redirectAfterLogin'
import './class-hero.css'
import './class-magazine.css'

// 시트들은 열기 전엔 한 줄도 쓰이지 않는데, 정적 import면 첫 진입에 같이 받는다.
// (작성 시트가 DatePicker·TimePicker·useBible·imageResize를, 상태 시트가
//  MemberSearchInput을, 댓글 시트가 EmojiPickerPanel·ReplyList를 끌고 온다)
// → lazy로 떼어내 첫 진입 페이로드를 줄이고, 아래 useEffect에서 idle에 데워둔다.
const loadStatusSheets = () => import('./components/ClassStatusSheets')
const ClassComposerSheet = lazy(() => import('./components/ClassComposerSheet'))
const ClassCommentSheet = lazy(() => import('./components/ClassCommentSheet'))
const MembersSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.MembersSheet })))
const CheckStatusSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.CheckStatusSheet })))
const RecitationSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.RecitationSheet })))
const RsvpDetailSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.RsvpDetailSheet })))
const PollDetailSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.PollDetailSheet })))
const StarsSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.StarsSheet })))
const GrowthSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.GrowthSheet })))

// 스토리 '본 것' 기록 — 이 기기에서만(응답이 필요한 글은 응답 여부가 우선)
const seenKey = (classId: number) => `class_story_seen_v1_${classId}`
const MAX_SEEN = 300
const MAX_STORIES = 10
const STORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

const loadSeen = (classId: number): Set<number> => {
  const raw = safeStorage.getJson(seenKey(classId))
  return new Set(Array.isArray(raw) ? raw.filter((v): v is number => typeof v === 'number') : [])
}

const ClassHome = () => {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const id = Number(classId)

  const { data: cls, isLoading, error } = useClassDetail(id, isAuthenticated())
  const leaveClass = useLeaveClass()

  const [showComposer, setShowComposer] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showStars, setShowStars] = useState(false)
  const [showGrowth, setShowGrowth] = useState(false)
  const [commentPost, setCommentPost] = useState<ClassPost | null>(null)
  const [checkPost, setCheckPost] = useState<ClassPost | null>(null)
  const [recitePost, setRecitePost] = useState<ClassPost | null>(null)
  const [rsvpPost, setRsvpPost] = useState<ClassPost | null>(null)
  const [pollPost, setPollPost] = useState<ClassPost | null>(null)
  const [practiceId, setPracticeId] = useState<number | null>(null)
  // 바로가기 중 청크를 받는 중인 행 — 그 행 아이콘 자리에 스피너
  const [pendingSub, setPendingSub] = useState<ClassSubPage | null>(null)
  const [seen, setSeen] = useState<Set<number>>(() => loadSeen(id))

  const heroArtReady = useThemeArt(CLASS_HERO)
  const postsQuery = useClassPosts(id, undefined)
  const posts = useMemo(() => postsQuery.data?.pages.flatMap((p) => p.items) ?? [], [postsQuery.data])
  const memberCount = cls?.member_count ?? 0
  const isTeacher = !!cls?.is_teacher

  // ── 호 구성 ──
  const magazine = useMemo(() => {
    const nowKey = thisWeekKey()
    const issues = groupIssues(posts)
    const current = issues[0]?.weekKey === nowKey ? issues[0] : null
    const past = current ? issues.slice(1) : issues
    const versePost = latestVersePost(posts)
    const verseIsThisIssue = !!versePost && weekKeyOf(versePost) === nowKey
    const pinned = posts.filter((p) => p.is_pinned && !p.is_scheduled)
    const scheduled = posts.filter((p) => p.is_scheduled)
    const chapters = [
      ...pinned,
      ...scheduled,
      ...(current?.posts ?? []).filter((p) => !(verseIsThisIssue && p.id === versePost?.id)),
    ]
    return { nowKey, current, past, versePost, verseIsThisIssue, chapters }
  }, [posts])

  // ── 스토리: 이번 주 소식 + (학부모) 최근 30일 안 아직 응답 안 한 소식 ──
  const isSeen = useCallback(
    (p: ClassPost) => {
      if (p.is_mine) return true
      const slot = toStampSlot(p, memberCount)
      if (slot && !isTeacher) return slot.doneByMe
      return seen.has(p.id)
    },
    [seen, memberCount, isTeacher],
  )
  // 링 순서(안 본 것 먼저)는 목록이 처음 잡힐 때 정한다 — 보는 중에 응답해도 링이 자리를 바꾸지 않게
  const [storyOrder, setStoryOrder] = useState<{ key: string; ids: number[] } | null>(null)
  const storyPool = useMemo(() => {
    const since = magazine.nowKey - STORY_WINDOW_MS
    return posts
      .filter(
        (p) =>
          !p.is_scheduled &&
          (weekKeyOf(p) === magazine.nowKey || (weekKeyOf(p) >= since && !isTeacher && awaitingMe(p, memberCount))),
      )
      .reverse()
  }, [posts, magazine.nowKey, isTeacher, memberCount])
  const poolKey = storyPool.map((p) => p.id).join(',')
  if (cls && !postsQuery.isLoading && storyOrder?.key !== poolKey) {
    // 이미 링에 오른 글은 응답해서 조건에서 빠져도 그 자리에 둔다(삭제된 글만 뺀다) — 새 글만 뒤에 붙인다
    const alive = new Set(posts.map((p) => p.id))
    const kept = (storyOrder?.ids ?? []).filter((pid) => alive.has(pid))
    const fresh = storyPool.filter((p) => !kept.includes(p.id))
    const ids = [...kept, ...fresh.filter((p) => !isSeen(p)).map((p) => p.id), ...fresh.filter(isSeen).map((p) => p.id)]
    setStoryOrder({ key: poolKey, ids: ids.slice(0, MAX_STORIES) })
  }
  const stories = useMemo(() => {
    const byId = new Map(posts.map((p) => [p.id, p]))
    return (storyOrder?.ids ?? []).map((pid) => byId.get(pid)).filter((p): p is ClassPost => !!p)
  }, [posts, storyOrder])
  const seenIds = useMemo(() => new Set(stories.filter(isSeen).map((p) => p.id)), [stories, isSeen])

  const markSeen = useCallback(
    (postId: number) => {
      setSeen((prev) => {
        if (prev.has(postId)) return prev
        const next = new Set(prev)
        next.add(postId)
        safeStorage.setJson(seenKey(id), [...next].slice(-MAX_SEEN))
        return next
      })
    },
    [id],
  )

  // ── 호 머리말 한 줄 ──
  const headline = useMemo(() => {
    if (isTeacher) {
      const thisWeek = [
        ...magazine.chapters,
        ...(magazine.verseIsThisIssue && magazine.versePost ? [magazine.versePost] : []),
      ].filter((p) => !p.is_scheduled && weekKeyOf(p) === magazine.nowKey)
      const slots = thisWeek.map((p) => toStampSlot(p, memberCount)).filter((s): s is StampSlot => s !== null)
      if (slots.length === 0) return '이번 호에 첫 소식을 실어 보세요'
      const done = slots.reduce((n, s) => n + Math.min(s.classDone, s.target), 0)
      const total = slots.reduce((n, s) => n + s.target, 0)
      return `이번 주 반 응답률 ${Math.round((done / Math.max(1, total)) * 100)}%`
    }
    const left = stories.filter((p) => awaitingMe(p, memberCount)).length
    if (left > 0) return `응답할 소식이 ${left}개 남았어요`
    return magazine.current ? '이번 주 소식에 모두 응답했어요' : '이번 주 새 소식을 기다리고 있어요'
  }, [isTeacher, magazine, memberCount, stories])

  // 스토리 → 알림장의 그 꼭지로 (지난 호에 있어 접혀 있으면 조용히 넘어간다)
  const jumpToPost = useCallback((post: ClassPost) => {
    window.setTimeout(() => {
      const el = document.getElementById(`class-post-${post.id}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.remove('cm-flash')
      void el.offsetWidth
      el.classList.add('cm-flash')
      window.setTimeout(() => el.classList.remove('cm-flash'), 1700)
    }, 80)
  }, [])

  // 바로가기 — 손이 닿으면 청크·첫 요청을 데우고, 누르면 받아둔 게 있을 때 즉시 간다
  const warmSub = useCallback((page: ClassSubPage) => warmClassSubPage(id, page), [id])
  const goSub = useCallback(
    (page: ClassSubPage) => void goClassSubPage(id, page, navigate, setPendingSub),
    [id, navigate],
  )
  const warmStars = useCallback(() => {
    void loadStatusSheets()
    prefetchClassStars(queryClient, id)
  }, [id])

  // 교사: 응답 현황 시트(명단 + 다시 알리기)
  const openStatus = useCallback((post: ClassPost) => {
    if (post.post_type === 'notice') setCheckPost(post)
    else if (post.post_type === 'verse') setRecitePost(post)
    else if (post.post_type === 'event') setRsvpPost(post)
    else if (post.post_type === 'poll') setPollPost(post)
  }, [])
  const openPractice = useCallback((post: ClassPost) => setPracticeId(post.id), [])
  const practicePost = practiceId !== null ? (posts.find((p) => p.id === practiceId) ?? null) : null

  useEffect(() => {
    if (!isAuthenticated()) {
      redirectAfterLogin.set(`/classes/${id}`)
      navigate('/login')
    }
  }, [id, navigate])

  // 피드가 그려진 뒤 한가할 때 시트 청크를 데워둔다 — 첫 진입은 가볍게,
  // 정작 시트를 열 때는 기다림이 없게 (BibleBottomNav와 같은 문법)
  useEffect(() => {
    const warm = () => {
      void loadStatusSheets()
      void import('./components/ClassCommentSheet')
      void import('./components/ClassComposerSheet')
    }
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(warm, { timeout: 3000 })
      return () => window.cancelIdleCallback(handle)
    }
    const handle = window.setTimeout(warm, 1500)
    return () => window.clearTimeout(handle)
  }, [])

  // 바로가기 목적지 청크도 유휴 때 미리 — 반 정보가 와서 교사 여부를 알고 난 뒤 한 번.
  const hasCls = !!cls
  useEffect(() => {
    if (!hasCls) return
    const pages: ClassSubPage[] = isTeacher ? ['report', 'attendance', 'album'] : ['album']
    const warm = () => warmClassSubPageChunks(pages, id)
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(warm, { timeout: 4000 })
      return () => window.cancelIdleCallback(handle)
    }
    const handle = window.setTimeout(warm, 2500)
    return () => window.clearTimeout(handle)
  }, [id, hasCls, isTeacher])

  // '알림 쓰기' FAB가 떠 있는 동안 전역 챗봇 버튼을 위로 밀어 우하단 겹침을 막는다.
  useEffect(() => {
    if (!isTeacher) return
    document.documentElement.style.setProperty('--chat-fab-lift', '3rem')
    return () => {
      document.documentElement.style.removeProperty('--chat-fab-lift')
    }
  }, [isTeacher])

  const handleShare = async () => {
    if (!cls?.invite_code) return
    const url = classInviteUrl(cls.invite_code)
    const text = `🏫 '${cls.name}' 알림장에 초대해요!\n공지 확인·암송요절·일정 참석을 알림장 하나로 함께해요.\n\n${url}\n\n앱을 설치했다면 [우리반 알림장 → 초대 코드로 참여]에 코드 ${cls.invite_code} 를 입력해도 돼요.`
    if (navigator.share) {
      try {
        await navigator.share({ title: cls.name, text, url })
        return
      } catch {
        /* 사용자가 취소 — 폴백 없이 종료 */
        return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast('초대 링크를 복사했어요. 카톡 반 단톡방에 붙여넣어 보내주세요!', 'success')
    } catch {
      showToast('복사에 실패했어요. 초대 코드를 직접 알려주세요: ' + cls.invite_code, 'error')
    }
  }

  const handleLeave = async () => {
    if (
      !(await confirmDialog({
        title: '반 나가기',
        message: '이 반에서 나가시겠어요?',
        description: '다시 들어오려면 초대 코드가 필요해요.',
        confirmText: '나가기',
        icon: 'logout',
      }))
    )
      return
    try {
      await leaveClass.mutateAsync(id)
      showToast('반에서 나왔어요', 'success')
      navigate('/classes')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  // 목록 캐시로 먼저 그리는 경우 cls가 있어도 요청은 실패할 수 있다 — 에러를 먼저 본다
  if (error) {
    return (
      <Shell onBack={() => navigate('/classes')} title="우리반 알림장">
        <div className="text-center py-16 px-6">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-3"><Lock size={26} weight="duotone" color="currentColor" aria-hidden="true" /></span>
          <p className="text-[13px] text-gray-500 dark:text-white/55">
            {error instanceof Error ? error.message : '반을 불러오지 못했습니다'}
          </p>
        </div>
      </Shell>
    )
  }

  if (isLoading || !cls) {
    return (
      <Shell onBack={() => navigate('/classes')} title="우리반 알림장">
        <div className="px-4 pt-4 space-y-3">
          <div className="flex gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-16 h-16 rounded-full bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            ))}
          </div>
          <div className="h-[430px] rounded-[28px] bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        </div>
      </Shell>
    )
  }

  const vol = issueNo(magazine.nowKey, cls.created_at)

  return (
    <Shell
      onBack={() => navigate('/classes')}
      title={cls.name}
      actions={
        <button
          type="button"
          onClick={handleLeave}
          className="text-[12px] font-semibold text-gray-400 dark:text-white/40 hover:text-red-500"
        >
          나가기
        </button>
      }
      rail={
        /* lg+ 우측 레일 — 글쓰기 FAB·퀵액션(lg:hidden)을 대신한다 */
        <>
          {cls.is_teacher && (
            <button
              type="button"
              onClick={() => setShowComposer(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-brand text-white text-[14px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] hover:-translate-y-0.5 transition-all"
            >
              <PenGlyph />
              이번 호에 소식 싣기
            </button>
          )}

          <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-none">
            <p className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
              바로가기
            </p>
            <div className="flex flex-col -mx-1">
              {cls.is_teacher && (
                <>
                  <RailAction icon={ChartIcon} label="리포트" pending={pendingSub === 'report'} onWarm={() => warmSub('report')} onClick={() => goSub('report')} />
                  <RailAction icon={ClipboardIcon} label="출석부" pending={pendingSub === 'attendance'} onWarm={() => warmSub('attendance')} onClick={() => goSub('attendance')} />
                </>
              )}
              <RailAction icon={CameraIcon} label="앨범" pending={pendingSub === 'album'} onWarm={() => warmSub('album')} onClick={() => goSub('album')} />
              <RailAction icon={StarIcon} label="암송 별" onWarm={warmStars} onClick={() => setShowStars(true)} />
              {!cls.is_teacher && (
                <RailAction icon={SproutIcon} label="성장 카드" onClick={() => setShowGrowth(true)} />
              )}
            </div>
          </section>
        </>
      }
    >
      {/* 스토리 링 */}
      <ClassStories
        posts={stories}
        seen={seenIds}
        isTeacher={cls.is_teacher}
        memberCount={cls.member_count}
        onSeen={markSeen}
        onOpenStatus={openStatus}
        onPractice={openPractice}
        onJump={jumpToPost}
      />

      {/* 호 머리말 */}
      <header className="px-5 pt-5 lg:px-6">
        <p className="text-[12px] font-extrabold tracking-[0.08em] text-brand tabular-nums">
          VOL. {vol} · {weekLabel(magazine.nowKey)}
        </p>
        <h2 className="mt-1.5 text-[27px] lg:text-[30px] font-extrabold leading-[1.25] tracking-[-0.035em] text-ink-strong break-keep">
          {headline}
        </h2>
        <p className="mt-1.5 text-[13px] font-semibold text-gray-400 dark:text-white/45">
          {cls.department} · {cls.name} · 함께하는 {cls.member_count}명
        </p>
      </header>

      {/* 표지 */}
      <IssueCover
        cls={cls}
        versePost={magazine.versePost}
        verseIsThisIssue={magazine.verseIsThisIssue}
        artReady={heroArtReady}
        onShare={handleShare}
        onOpenMembers={() => setShowMembers(true)}
        onPractice={openPractice}
        onOpenRecitations={setRecitePost}
      />

      {/* 퀵 액션 — 리포트·출석부(교사) / 앨범·별·성장카드 (lg에선 레일의 '바로가기') */}
      <div className="lg:hidden flex gap-2 overflow-x-auto px-4 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cls.is_teacher && (
          <>
            <QuickAction icon={ChartIcon} label="리포트" pending={pendingSub === 'report'} onWarm={() => warmSub('report')} onClick={() => goSub('report')} />
            <QuickAction icon={ClipboardIcon} label="출석부" pending={pendingSub === 'attendance'} onWarm={() => warmSub('attendance')} onClick={() => goSub('attendance')} />
          </>
        )}
        <QuickAction icon={CameraIcon} label="앨범" pending={pendingSub === 'album'} onWarm={() => warmSub('album')} onClick={() => goSub('album')} />
        <QuickAction icon={StarIcon} label="암송 별" onWarm={warmStars} onClick={() => setShowStars(true)} />
        {!cls.is_teacher && (
          <QuickAction icon={SproutIcon} label="성장 카드" onClick={() => setShowGrowth(true)} />
        )}
      </div>

      {/* 혼자면 초대 넛지 */}
      {cls.member_count <= 1 && (
        <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-[var(--brand-soft)] text-[12.5px] text-gray-600 dark:text-white/70 leading-[1.6]">
          <EnvelopeIcon width={13} height={13} className="inline-block align-[-2px] mr-1 text-brand" />
          아직 혼자예요. 표지의 <b className="text-brand">초대</b>를 눌러 카톡 반 단톡방에
          링크를 공유하면 학부모님들이 바로 들어올 수 있어요.
        </div>
      )}

      {/* 이번 호 꼭지 */}
      <section className="px-4 pt-8">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-[19px] font-extrabold tracking-[-0.02em] text-ink-strong">이번 호 소식</h3>
          {magazine.chapters.length > 0 && (
            <span className="text-[12px] font-semibold text-gray-400 dark:text-white/40 tabular-nums">
              {magazine.chapters.length}개
            </span>
          )}
        </div>
        <div className="mt-3 space-y-3">
          {postsQuery.isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-44 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            ))
          ) : magazine.chapters.length === 0 ? (
            <div className="text-center py-10 px-6 rounded-3xl bg-white dark:bg-card-dark">
              <MailboxIcon width={34} height={34} className="mx-auto mb-3 text-gray-400 dark:text-white/40" />
              <p className="text-[13.5px] text-gray-500 dark:text-white/55 leading-[1.7] break-keep">
                {cls.is_teacher
                  ? '이번 호는 아직 비어 있어요. 공지·일정·사진을 실어 보세요!'
                  : magazine.verseIsThisIssue
                    ? '이번 주는 표지 말씀이 전부예요. 함께 외워 볼까요?'
                    : '이번 주 소식을 기다리고 있어요. 지난 호를 펼쳐 보세요.'}
              </p>
            </div>
          ) : (
            magazine.chapters.map((post, i) => (
              <IssueChapter
                key={post.id}
                post={post}
                index={i + 1}
                isTeacher={cls.is_teacher}
                memberCount={cls.member_count}
                onOpenComments={setCommentPost}
                onOpenStatus={openStatus}
                onPractice={openPractice}
              />
            ))
          )}
        </div>
      </section>

      {/* 지난 호 */}
      <div className="pb-24">
        <PastIssues
          issues={magazine.past}
          classCreatedAt={cls.created_at}
          isTeacher={cls.is_teacher}
          memberCount={cls.member_count}
          hasMore={!!postsQuery.hasNextPage}
          loadingMore={postsQuery.isFetchingNextPage}
          onLoadMore={() => void postsQuery.fetchNextPage()}
          onOpenComments={setCommentPost}
          onOpenStatus={openStatus}
          onPractice={openPractice}
        />
      </div>

      {/* 교사 전용 글쓰기 FAB */}
      {cls.is_teacher && (
        <button
          type="button"
          onClick={() => setShowComposer(true)}
          className="lg:hidden fixed bottom-20 z-30 inline-flex items-center gap-1.5 px-5 py-3.5 rounded-full bg-brand text-white text-[14px] font-bold shadow-[0_12px_32px_-8px_var(--brand-glow)] active:scale-95 transition-transform"
          style={{ right: 'max(16px, calc(50% - 13rem))' }}
        >
          <PenGlyph />
          소식 싣기
        </button>
      )}

      {practicePost && <VersePracticeSheet post={practicePost} onClose={() => setPracticeId(null)} />}

      {/* 시트들 — lazy 청크. idle에 데워두므로 대개 fallback 없이 바로 뜬다 */}
      <Suspense fallback={null}>
        {showComposer && (
          <ClassComposerSheet classId={id} onClose={() => setShowComposer(false)} />
        )}
        {showMembers && <MembersSheet cls={cls} onClose={() => setShowMembers(false)} />}
        {commentPost && (
          <ClassCommentSheet
            post={commentPost}
            isTeacher={cls.is_teacher}
            onClose={() => setCommentPost(null)}
          />
        )}
        {checkPost && <CheckStatusSheet post={checkPost} onClose={() => setCheckPost(null)} />}
        {recitePost && (
          <RecitationSheet
            post={recitePost}
            isTeacher={cls.is_teacher}
            memberCount={cls.member_count}
            onClose={() => setRecitePost(null)}
          />
        )}
        {rsvpPost && <RsvpDetailSheet post={rsvpPost} onClose={() => setRsvpPost(null)} />}
        {pollPost && <PollDetailSheet post={pollPost} onClose={() => setPollPost(null)} />}
        {showStars && <StarsSheet classId={id} onClose={() => setShowStars(false)} />}
        {showGrowth && <GrowthSheet classId={id} onClose={() => setShowGrowth(false)} />}
      </Suspense>
    </Shell>
  )
}

const PenGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 20h9" />
    <path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.4 3.6Z" />
  </svg>
)

// ── 레일 바로가기 행 (lg+) — 가로 칩 대신 세로 목록 ──
// onWarm: 호버·터치·포커스 때 목적지 청크·데이터를 데운다. pending: 청크를 받는 중(아이콘 자리에 스피너)
type ActionProps = {
  icon: IconFn
  label: string
  onClick: () => void
  onWarm?: () => void
  pending?: boolean
}

const Spinner = ({ size }: { size: number }) => (
  <span
    style={{ width: size, height: size }}
    className="inline-block shrink-0 rounded-full border-2 border-brand/30 border-t-brand animate-spin"
  />
)

const RailAction = ({ icon: Icon, label, onClick, onWarm, pending }: ActionProps) => (
  <button
    type="button"
    onClick={onClick}
    onMouseEnter={onWarm}
    onTouchStart={onWarm}
    onFocus={onWarm}
    aria-busy={pending}
    className="flex items-center gap-2.5 px-1 py-2 rounded-lg text-left hover:bg-[var(--brand-soft)] transition-colors"
  >
    <span className="w-5 flex justify-center text-brand">
      {pending ? <Spinner size={14} /> : <Icon width={15} height={15} />}
    </span>
    <span className="flex-1 min-w-0 truncate text-[12.5px] font-bold text-ink-strong">{label}</span>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400 dark:text-white/35">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </button>
)

// ── 퀵 액션 칩 ──
const QuickAction = ({ icon: Icon, label, onClick, onWarm, pending }: ActionProps) => (
  <button
    type="button"
    onClick={onClick}
    onMouseEnter={onWarm}
    onTouchStart={onWarm}
    onFocus={onWarm}
    aria-busy={pending}
    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[12.5px] font-bold text-gray-700 dark:text-white/75 shadow-sm active:scale-95 transition-transform"
  >
    {pending ? <Spinner size={13} /> : <Icon width={14} height={14} className="shrink-0 text-brand" />}
    {label}
  </button>
)

export default ClassHome
