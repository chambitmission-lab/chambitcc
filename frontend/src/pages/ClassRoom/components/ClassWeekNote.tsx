// 우리반 알림장 '이번 주 공책' — 한 주 = 공책 한 장
// 위: 지금 외우는 말씀(테이프 붙인 카드 + 반 친구 자리) / 아래: 이번 주 도장판(할 일 칸)
// 학부모·학생은 내 도장, 교사는 반 전체 응답(칸을 누르면 현황 시트 → 다시 알리기)을 본다.
import { useMemo, useState } from 'react'
import { useToggleClassPostRecite } from '../../../hooks/useClassRoom'
import type { ClassPost } from '../../../types/classRoom'
import { BallotIcon, CalendarIcon, MegaphoneIcon, OpenBookIcon, StarIcon, TargetIcon, type IconFn } from '../ClassIcons'
import { buildWeekNote, thisWeekKey, weekLabel, weekKeyOf, type StampKind, type StampSlot } from '../classWeek'
import VersePracticeSheet from './VersePracticeSheet'

const KIND_ICON: Record<StampKind, IconFn> = {
  notice: MegaphoneIcon,
  verse: OpenBookIcon,
  event: CalendarIcon,
  poll: BallotIcon,
}

const MAX_SLOTS = 4
const MAX_SEATS = 8

const snippet = (post: ClassPost, fallback: string) => {
  const text = (post.title || post.content || '').replace(/\s+/g, ' ').trim()
  if (!text) return fallback
  return text.length > 16 ? `${text.slice(0, 16)}…` : text
}

interface Props {
  posts: ClassPost[]
  loading: boolean
  memberCount: number
  isTeacher: boolean
  onJump: (post: ClassPost) => void
  onOpenSlot: (slot: StampSlot) => void
  onOpenRecitations: (post: ClassPost) => void
  onCompose: () => void
}

const ClassWeekNote = ({
  posts,
  loading,
  memberCount,
  isTeacher,
  onJump,
  onOpenSlot,
  onOpenRecitations,
  onCompose,
}: Props) => {
  const note = useMemo(() => buildWeekNote(posts, memberCount, isTeacher), [posts, memberCount, isTeacher])
  const isDone = (s: StampSlot) => (isTeacher ? s.classComplete : s.doneByMe)

  // 처음 그릴 때 이미 찍혀 있던 도장은 그대로, 보는 중에 새로 찍힌 도장만 '꾹' 애니메이션
  // (렌더 중 '이전 값 기억' 패턴 — 첫 데이터가 온 렌더에서 한 번만 잡는다)
  const [initialDone, setInitialDone] = useState<Set<number> | null>(null)
  if (initialDone === null && !loading) {
    setInitialDone(new Set(note.slots.filter(isDone).map((s) => s.post.id)))
  }
  const justStamped = (s: StampSlot) => isDone(s) && initialDone !== null && !initialDone.has(s.post.id)

  const shown = note.slots.slice(0, MAX_SLOTS)
  const doneCount = note.slots.filter(isDone).length
  const allDone = note.slots.length > 0 && doneCount === note.slots.length
  const next = note.slots.find((s) => !isDone(s)) ?? null
  const label = weekLabel(note.mode === 'week' || note.mode === 'empty' ? thisWeekKey() : weekKeyOf(note.slots[0].post))

  if (loading) {
    return <div className="mx-4 mt-3 h-64 rounded-[6px_22px_22px_6px] bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
  }

  return (
    <section
      aria-label="이번 주 공책"
      className="cn-paper mx-4 mt-3 rounded-[6px_22px_22px_6px] pl-9 pr-4 pt-4 pb-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06] shadow-[0_18px_34px_-26px_rgba(20,30,60,0.55)]"
    >
      {/* 머리말 */}
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.04em] text-gray-400 dark:text-white/40">
            {note.mode === 'leftover' ? '아직 남은 도장' : '이번 주 우리 반'}
          </p>
          <h3 className="cn-hand text-[26px] leading-[1.1] font-bold text-ink-strong">{label}</h3>
        </div>
        {note.slots.length > 0 && (
          <p className="shrink-0 text-[12px] font-bold text-gray-500 dark:text-white/55 tabular-nums">
            도장 <span className="text-[var(--cn-stamp)] text-[15px]">{doneCount}</span>/{note.slots.length}
          </p>
        )}
      </header>

      <div className={`mt-3 ${note.versePost ? 'lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-7 lg:items-start' : ''}`}>
        {note.versePost && (
          <VerseBlock
            post={note.versePost}
            isThisWeek={note.verseIsThisWeek}
            memberCount={memberCount}
            isTeacher={isTeacher}
            onOpenRecitations={onOpenRecitations}
          />
        )}

        {/* 도장판 */}
        <div className={`relative ${note.versePost ? 'mt-5 lg:mt-1' : ''}`}>
          {note.mode === 'empty' ? (
            <div className="py-3">
              <p className="cn-hand text-[19px] leading-[1.4] text-gray-600 dark:text-white/70">
                {isTeacher ? '이번 주 도장판이 비어 있어요.' : '이번 주는 아직 조용해요.'}
              </p>
              <p className="text-[12.5px] text-gray-500 dark:text-white/50 mt-1 leading-[1.6]">
                {isTeacher
                  ? '공지·암송·일정·투표를 올리면 칸이 생기고, 반 친구들이 응답할 때마다 도장이 찍혀요.'
                  : '선생님이 알림을 올리면 여기에 도장 칸이 생겨요.'}
              </p>
              {isTeacher && (
                <button
                  type="button"
                  onClick={onCompose}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-white text-[12.5px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-95 transition-transform"
                >
                  첫 알림 쓰기
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-4 gap-1.5">
                {shown.map((s) => {
                  const done = isDone(s)
                  const isNext = next?.post.id === s.post.id
                  const Icon = KIND_ICON[s.kind]
                  return (
                    <li key={s.post.id}>
                      <button
                        type="button"
                        onClick={() => (isTeacher ? onOpenSlot(s) : onJump(s.post))}
                        aria-label={`${s.label}${done ? ' 완료' : ''} — ${snippet(s.post, s.label)}`}
                        className="w-full flex flex-col items-center gap-1.5 text-center active:scale-95 transition-transform"
                      >
                        {done ? (
                          <span className={`cn-stamp w-14 h-14 ${justStamped(s) ? 'cn-stamp-press' : ''}`}>
                            <Icon width={22} height={22} />
                          </span>
                        ) : (
                          <span
                            className={`w-14 h-14 rounded-full grid place-items-center ${
                              isNext
                                ? 'bg-[var(--brand-soft)] text-brand ring-2 ring-brand/60'
                                : 'cn-slot-empty text-gray-400 dark:text-white/35'
                            }`}
                          >
                            <Icon width={21} height={21} />
                          </span>
                        )}
                        <span className="text-[11px] font-bold leading-[1.25] text-gray-600 dark:text-white/65 break-keep">
                          {s.label}
                        </span>
                        {isTeacher && (
                          <span className="-mt-1 text-[10.5px] font-semibold tabular-nums text-gray-400 dark:text-white/40">
                            {Math.min(s.classDone, s.target)}/{s.target}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {note.slots.length > MAX_SLOTS && (
                <p className="mt-2 text-right text-[11px] font-semibold text-gray-400 dark:text-white/40">
                  +{note.slots.length - MAX_SLOTS}칸 더 · 아래 알림에서 이어져요
                </p>
              )}

              {allDone ? (
                <div className="relative mt-4 flex items-center gap-3 min-h-[64px]">
                  <span className={`cn-stamp w-[68px] h-[68px] text-[11px] shrink-0 ${note.slots.some(justStamped) ? 'cn-stamp-press' : ''}`}>
                    <span>
                      <b className="block text-[13px]">{isTeacher ? '모두' : '참'}</b>
                      {isTeacher ? '완료' : '잘했어요'}
                    </span>
                  </span>
                  <p className="cn-hand text-[18px] leading-[1.35] text-gray-700 dark:text-white/80">
                    {isTeacher ? '반 친구 모두가 이번 주 알림에 답했어요!' : '이번 주 도장을 다 모았어요!'}
                  </p>
                </div>
              ) : (
                next && (
                  <button
                    type="button"
                    onClick={() => (isTeacher ? onOpenSlot(next) : onJump(next.post))}
                    className="mt-4 w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-brand text-white text-[13px] font-bold shadow-[0_8px_20px_-8px_var(--brand-glow)] active:scale-[0.98] transition-transform"
                  >
                    <span className="min-w-0 truncate">
                      {isTeacher
                        ? `${next.label} · ${Math.max(0, next.target - next.classDone)}명 남음`
                        : `다음 도장 · ${snippet(next.post, next.label)}`}
                    </span>
                    <span className="shrink-0 text-[12px] opacity-90">{isTeacher ? '현황 보기' : '하러 가기'} →</span>
                  </button>
                )
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

// ── 지금 외우는 말씀 — 테이프 붙인 카드 + 반 친구 자리 ──
const VerseBlock = ({
  post,
  isThisWeek,
  memberCount,
  isTeacher,
  onOpenRecitations,
}: {
  post: ClassPost
  isThisWeek: boolean
  memberCount: number
  isTeacher: boolean
  onOpenRecitations: (post: ClassPost) => void
}) => {
  const toggleRecite = useToggleClassPostRecite(post.class_id)
  const [practice, setPractice] = useState(false)
  const verse = post.verse!
  const target = Math.max(1, memberCount - 1)
  const seats = Math.min(target, MAX_SEATS)
  const filled = Math.min(post.recite_count, seats)

  return (
    <>
    <div className="relative mt-2 rounded-[4px] bg-amber-50/90 dark:bg-amber-300/[0.07] px-4 pt-5 pb-3.5 -rotate-[0.6deg] shadow-[0_10px_22px_-18px_rgba(120,80,0,0.6)]">
      <span className="cn-tape" aria-hidden />
      <p className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.04em] text-amber-700 dark:text-amber-300">
        <OpenBookIcon width={12} height={12} />
        {isThisWeek ? '이번 주 말씀' : '지금 외우는 말씀'}
        {verse.week_label && <span className="font-bold opacity-80">· {verse.week_label}</span>}
      </p>
      <blockquote className="font-serif-kr text-[18.5px] leading-[1.7] font-medium text-gray-900 dark:text-white/92 mt-2 break-keep [text-wrap:balance]">
        “{verse.text}”
      </blockquote>
      <p className="text-[12px] font-bold text-amber-700 dark:text-amber-300 mt-1 text-right">{verse.reference}</p>

      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => post.recite_count > 0 && onOpenRecitations(post)}
          className="flex items-center gap-1 text-amber-600 dark:text-amber-300"
          aria-label={`우리 반 암송 ${post.recite_count}/${target}명`}
        >
          {Array.from({ length: seats }).map((_, i) =>
            i < filled ? (
              <span key={i} className="w-5 h-5 rounded-full bg-amber-400 text-white grid place-items-center">
                <StarIcon width={11} height={11} />
              </span>
            ) : (
              <span key={i} className="w-5 h-5 rounded-full border-[1.5px] border-dashed border-amber-400/70" />
            ),
          )}
          <span className="ml-1 text-[11.5px] font-bold tabular-nums">
            {post.recite_count}/{target}
            {target > seats && ' 명'}
          </span>
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPractice(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 text-white text-[12px] font-bold active:scale-95 transition-transform shadow-[0_4px_12px_-4px_rgba(245,158,11,0.5)]"
          >
            <TargetIcon width={13} height={13} />
            외우기 연습
          </button>
          {isTeacher ? (
            <button
              type="button"
              onClick={() => onOpenRecitations(post)}
              className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.08] text-amber-700 dark:text-amber-300 text-[12px] font-bold"
            >
              누가 외웠나
            </button>
          ) : (
            <button
              type="button"
              onClick={() => toggleRecite.mutate(post.id)}
              disabled={toggleRecite.isPending}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold active:scale-95 transition-all ${
                post.recited_by_me
                  ? 'bg-amber-400/25 text-amber-700 dark:text-amber-300'
                  : 'bg-white/80 dark:bg-white/[0.08] text-gray-600 dark:text-white/65'
              }`}
            >
              <StarIcon width={12} height={12} />
              {post.recited_by_me ? '외웠어요!' : '암송했어요'}
            </button>
          )}
        </div>
      </div>
    </div>
    {/* 카드가 살짝 기울어(transform) 있어 그 안에 두면 fixed 시트가 카드에 갇힌다 — 밖에 둔다 */}
    {practice && <VersePracticeSheet post={post} onClose={() => setPractice(false)} />}
    </>
  )
}

export default ClassWeekNote
