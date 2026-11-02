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

/** 반 전원이 응답한 글에 찍는 도장 문구 */
export const COMPLETE_STAMP: Record<StampKind, string> = {
  notice: '모두 확인',
  verse: '모두 외움',
  event: '모두 응답',
  poll: '모두 참여',
}

export interface WeekNote {
  /** 이번 주 칸이 없으면 '아직 남은 도장'(최근 30일 미완료)으로 대신 채운다 */
  mode: 'week' | 'leftover' | 'empty'
  slots: StampSlot[]
  /** 맨 위에 펼칠 말씀 — 가장 최근 암송요절 */
  versePost: ClassPost | null
  verseIsThisWeek: boolean
}

export const buildWeekNote = (posts: ClassPost[], memberCount: number, isTeacher: boolean): WeekNote => {
  const visible = posts.filter((p) => !p.is_scheduled)
  const now = thisWeekKey()
  const isDone = (s: StampSlot) => (isTeacher ? s.classComplete : s.doneByMe)
  const asSlots = (list: ClassPost[]) =>
    list
      .map((p) => toStampSlot(p, memberCount))
      .filter((s): s is StampSlot => s !== null && (isTeacher || !s.post.is_mine))

  const versePost =
    [...visible]
      .filter((p) => p.post_type === 'verse' && p.verse)
      .sort((a, b) => postCalendarDate(b).getTime() - postCalendarDate(a).getTime())[0] ?? null

  // 오래된 글이 위로 — 주 초에 올린 것부터 차례로 도장을 찍는다
  const byOldest = (a: StampSlot, b: StampSlot) =>
    postCalendarDate(a.post).getTime() - postCalendarDate(b.post).getTime()

  let mode: WeekNote['mode'] = 'week'
  let slots = asSlots(visible.filter((p) => weekKeyOf(p) === now)).sort(byOldest)
  if (slots.length === 0) {
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000
    slots = asSlots(visible.filter((p) => weekKeyOf(p) >= monthAgo))
      .filter((s) => !isDone(s))
      .sort(byOldest)
    mode = slots.length > 0 ? 'leftover' : 'empty'
  }

  return {
    mode,
    slots,
    versePost,
    verseIsThisWeek: versePost ? weekKeyOf(versePost) === now : false,
  }
}
