// 우리반 알림장 '이번 주 공책' 계산 — 주(週) 경계 · 도장 칸 · 반 전체 완료 판정
// 교회학교 리듬에 맞춰 한 주는 서울 기준 주일 00:00 에 시작한다.
import type { ClassPost } from '../../types/classRoom'
import { kstNow, toKstCalendarDate } from '../../utils/kstTime'

export type StampKind = 'notice' | 'verse' | 'event' | 'poll'

export interface StampSlot {
  post: ClassPost
  kind: StampKind
  /** 칸 아래 짧은 이름 — "공지 확인", "말씀 외우기" */
  label: string
  /** 나(학부모·학생)의 응답 여부 */
  doneByMe: boolean
  /** 반 전체 응답 수 / 대상 수 (교사 시점) */
  classDone: number
  target: number
  classComplete: boolean
}

const ORDINAL = ['첫째', '둘째', '셋째', '넷째', '다섯째']

/** 작성자(선생님)를 뺀 인원이 응답 대상 — ClassPostCard 의 CheckSection·VerseSection 과 같은 규칙 */
export const responseTarget = (memberCount: number) => Math.max(1, memberCount - 1)

/** 캘린더 Date(서울 필드) → 그 주 주일 00:00 */
const weekStartOf = (cal: Date) => new Date(cal.getFullYear(), cal.getMonth(), cal.getDate() - cal.getDay())

const postCalendarDate = (post: ClassPost) => toKstCalendarDate(post.publish_at ?? post.created_at)

export const weekKeyOf = (post: ClassPost) => weekStartOf(postCalendarDate(post)).getTime()

export const thisWeekKey = () => weekStartOf(kstNow()).getTime()

/** "11월 첫째 주" — 주일이 속한 달 기준 */
export const weekLabel = (weekKey: number) => {
  const d = new Date(weekKey)
  return `${d.getMonth() + 1}월 ${ORDINAL[Math.min(4, Math.floor((d.getDate() - 1) / 7))]} 주`
}

/** 피드 주 머리말의 보조 라벨 — 이번 주 / 지난주 / 없음 */
export const weekRelative = (weekKey: number) => {
  const diff = Math.round((thisWeekKey() - weekKey) / (7 * 24 * 60 * 60 * 1000))
  if (diff === 0) return '이번 주'
  if (diff === 1) return '지난주'
  return null
}

const KIND_LABEL: Record<StampKind, string> = {
  notice: '공지 확인',
  verse: '말씀 외우기',
  event: '참석 응답',
  poll: '투표하기',
}

/** 도장이 걸린 글이면 칸 정보를, 아니면(사진 등) null */
export const toStampSlot = (post: ClassPost, memberCount: number): StampSlot | null => {
  const target = responseTarget(memberCount)
  let doneByMe: boolean
  let classDone: number
  switch (post.post_type) {
    case 'notice':
      doneByMe = post.checked_by_me
      classDone = post.check_count
      break
    case 'verse':
      if (!post.verse) return null
      doneByMe = post.recited_by_me
      classDone = post.recite_count
      break
    case 'event':
      if (!post.event) return null
      doneByMe = post.event.my_status != null
      classDone = post.event.attending_count + post.event.maybe_count + post.event.not_attending_count
      break
    case 'poll':
      if (!post.poll) return null
      doneByMe = post.poll.options.some((o) => o.voted_by_me)
      classDone = post.poll.total_voters
      break
    default:
      return null
  }
  const kind = post.post_type as StampKind
  return {
    post,
    kind,
    label: KIND_LABEL[kind],
    doneByMe,
    classDone,
    target,
    classComplete: classDone >= target,
  }
}

// ── 주간 매거진(2026-11-03 개편) — 한 주 = 한 호(VOL.) ──

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** 반이 만들어진 주를 1호로 센 발행 번호 */
export const issueNo = (weekKey: number, classCreatedAt: string) => {
  const first = weekStartOf(toKstCalendarDate(classCreatedAt)).getTime()
  return Math.max(1, Math.round((weekKey - first) / WEEK_MS) + 1)
}

export interface Issue {
  weekKey: number
  /** 최신순(서버 순서 그대로) */
  posts: ClassPost[]
}

/** 고정·예약 글을 뺀 나머지를 주 단위 호로 묶는다 — 최신 호가 앞 */
export const groupIssues = (posts: ClassPost[]): Issue[] => {
  const issues: Issue[] = []
  for (const post of posts) {
    if (post.is_pinned || post.is_scheduled) continue
    const key = weekKeyOf(post)
    const last = issues[issues.length - 1]
    if (last && last.weekKey === key) last.posts.push(post)
    else issues.push({ weekKey: key, posts: [post] })
  }
  return issues
}

/** 표지 말씀 — 가장 최근 암송요절(예약 글 제외) */
export const latestVersePost = (posts: ClassPost[]): ClassPost | null =>
  posts.find((p) => p.post_type === 'verse' && p.verse && !p.is_scheduled) ?? null

/** 내가 아직 응답하지 않은 글인가 (내가 쓴 글·사진은 해당 없음) */
export const awaitingMe = (post: ClassPost, memberCount: number) => {
  if (post.is_mine || post.is_scheduled) return false
  const slot = toStampSlot(post, memberCount)
  return slot ? !slot.doneByMe : false
}
