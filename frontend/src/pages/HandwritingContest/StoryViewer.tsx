// 작품 넘겨 보기 — 한 편씩 화면 가득. 글씨가 쓴 순서대로 다시 써지고, 사연을 읽을 만큼 머문 뒤 다음 작품으로.
// 왼쪽 1/3 탭 = 이전, 나머지 탭 = 다음, 꾹 누르면 멈춤, 좌우로 밀면 넘김, 아래로 밀면 닫기.
// 갤러리 끝까지 보면(아직 출품 전이면) 빈 종이 한 장 — "이제 당신 차례예요".
// 종이·잉크는 실물이라 테마와 무관하게 어두운 무대 위 크림 종이다.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useContestEntryInk, useHideEntry } from '../../hooks/useHandwritingContest'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import type { ContestDetail, ContestEntry } from '../../types/handwritingContest'
import { can } from '../../utils/access'
import { confirmDialog } from '../../utils/confirmDialog'
import { timeAgo } from '../../utils/dateUtils'
import { toastFeedback } from '../../utils/toast'
import { Avatar, CardIcon, HeartIcon, Medal, QuillIcon } from './contestShared'
import InkReplay from './InkReplay'
import { RANK_META } from './contestFormat'

/** 다 써진 뒤 머무는 시간 — 구절과 사연 길이만큼 늘린다 */
const dwellMs = (e: ContestEntry) =>
  Math.min(14000, 3500 + Math.min(e.verse_text.length, 220) * 22 + (e.comment?.length ?? 0) * 45)
/** 이 시간보다 오래 누르면 '멈춤', 짧으면 탭 */
const HOLD_MS = 220
/** 막대를 칸으로 나눠 보일 최대 편수 — 넘으면 한 줄 진행 막대 */
const MAX_SEGMENTS = 30

interface Props {
  contest: ContestDetail
  entries: ContestEntry[]
  startIndex: number
  /** 갤러리 전체 편수(아직 안 받은 페이지 포함) — "3 / 24" */
  total: number
  hasMore: boolean
  onLoadMore: () => void
  /** 끝까지 보면 '당신 차례' 장을 붙인다 */
  invite: boolean
  onWrite: () => void
  onClose: () => void
  onVote: (entry: ContestEntry) => void
  voting: boolean
}

const StoryViewer = ({ contest, entries, startIndex, total, hasMore, onLoadMore, invite, onWrite, onClose, onVote, voting }: Props) => {
  const navigate = useNavigate()
  useBodyScrollLock()
  useModalBackButton(onClose)
  useEscapeKey(onClose)
  const hide = useHideEntry(contest.id, toastFeedback({ success: (_d, v) => ((v as { hidden: boolean }).hidden ? '작품을 숨겼어요' : '다시 보이게 했어요') }))
  const isAdmin = can('admin:access')

  const slideCount = entries.length + (invite && !hasMore ? 1 : 0)
  const [index, setIndex] = useState(() => Math.min(startIndex, Math.max(0, entries.length - 1)))
  const [paused, setPaused] = useState(false)
  const [held, setHeld] = useState(false)
  const entry: ContestEntry | undefined = entries[index]
  const atInvite = !entry && invite
  const next = entries[index + 1]
  useContestEntryInk(contest.id, next?.id ?? 0, !!next?.has_ink) // 다음 작품의 획을 미리 받아 둔다

  // 끝에 가까워지면 다음 페이지
  useEffect(() => {
    if (hasMore && index >= entries.length - 3) onLoadMore()
  }, [hasMore, index, entries.length, onLoadMore])

  // 자동 넘김 — 재생 시간(InkReplay 가 알려 줌) + 머무는 시간. 막대는 리렌더 없이 ref 로 칠한다
  // 시간표는 넘기는 순간(이벤트 안)에 비운다 — 효과로 비우면 자식 InkReplay 의 onPlay(자식 효과가 먼저 돈다)를 지워 버린다
  const fillRef = useRef<HTMLSpanElement>(null)
  const timeline = useRef({ total: 0, elapsed: 0, known: false })
  const stopped = paused || held
  const moveTo = useCallback((to: number) => {
    timeline.current = { total: 0, elapsed: 0, known: false }
    if (fillRef.current) fillRef.current.style.transform = 'scaleX(0)'
    setIndex(to)
  }, [])

  // 끝에서 손으로 한 번 더 넘기면 닫는다. 자동 넘김은 끝에서 그냥 멈춘다
  const go = useCallback(
    (to: number, manual = true) => {
      if (to < 0) return
      if (to >= slideCount) {
        if (manual && !hasMore) onClose()
        return
      }
      moveTo(to)
    },
    [slideCount, hasMore, onClose, moveTo],
  )

  const handlePlay = useCallback(
    (ms: number) => {
      if (!entry) return
      timeline.current = { total: ms + dwellMs(entry), elapsed: 0, known: true }
    },
    [entry],
  )
  useEffect(() => {
    if (!entry || stopped) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const t = timeline.current
      const dt = document.hidden ? 0 : now - last
      last = now
      if (t.known) {
        t.elapsed += dt
        const p = Math.min(1, t.elapsed / t.total)
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`
        if (p >= 1) {
          go(index + 1, false)
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [entry, stopped, index, go])

  // 키보드 — 좌우 넘김·스페이스 멈춤 (Esc 는 useEscapeKey)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === ' ' && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault()
        setPaused((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index])

  // 무대 제스처 — 탭·꾹 누르기·밀기
  const press = useRef<{ x: number; y: number; t: number; timer: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    const timer = window.setTimeout(() => setHeld(true), HOLD_MS)
    press.current = { x: e.clientX, y: e.clientY, t: performance.now(), timer }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const p = press.current
    press.current = null
    if (!p) return
    window.clearTimeout(p.timer)
    const wasHeld = held
    setHeld(false)
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) return onClose()
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) return go(index + (dx < 0 ? 1 : -1))
    if (wasHeld) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    go(index + (e.clientX - rect.left < rect.width / 3 ? -1 : 1))
  }
  const onPointerCancel = () => {
    if (press.current) window.clearTimeout(press.current.timer)
    press.current = null
    setHeld(false)
  }

  const toggleHidden = async (target: ContestEntry) => {
    const nextHidden = !target.is_hidden
    if (nextHidden) {
      const ok = await confirmDialog({
        title: '이 작품을 숨길까요?',
        message: '갤러리와 순위에서 빠져요. 작성자에게는 그대로 보여요.',
        confirmText: '숨기기',
        tone: 'warning',
      })
      if (!ok) return
    }
    hide.mutate({ entryId: target.id, hidden: nextHidden }, { onSuccess: onClose })
  }

  const ratio = entry?.width && entry.height ? Math.min(1.5, Math.max(0.55, entry.height / entry.width)) : 1
  const segmented = slideCount <= MAX_SEGMENTS
  const canVote = !!entry && contest.phase === 'open' && !entry.is_mine
  const voteDisabled = voting || (!!entry && !entry.voted_by_me && contest.votes_left <= 0)

  return (
    <div className="hw-story fixed inset-0 z-[110] flex justify-center" role="dialog" aria-modal="true" aria-label="작품 넘겨 보기">
      <div className="relative flex h-full w-full max-w-[520px] flex-col">
        {/* 진행 막대 */}
        <div className="flex gap-[3px] px-3 pt-[calc(10px+env(safe-area-inset-top))]" aria-hidden>
          {segmented ? (
            Array.from({ length: slideCount }, (_, i) => (
              <span key={i} className="hw-story__bar">
                {i < index ? <span className="hw-story__fill" style={{ transform: 'scaleX(1)' }} /> : null}
                {i === index ? <span ref={fillRef} className="hw-story__fill" style={{ transform: atInvite ? 'scaleX(1)' : 'scaleX(0)' }} /> : null}
              </span>
            ))
          ) : (
            <span className="hw-story__bar">
              <span ref={fillRef} className="hw-story__fill" />
            </span>
          )}
        </div>

        {/* 머리 — 누가·무슨 구절 */}
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
          {entry ? (
            <>
              <Avatar name={entry.author.name} url={entry.author.avatar_url} size={34} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="flex items-center gap-1.5 text-[14px] font-bold truncate">
                  {entry.author.name}
                  {entry.is_mine ? <span className="text-[11px] font-bold opacity-70">내 작품</span> : null}
                  {entry.rank ? <Medal rank={entry.rank} size={18} /> : null}
                </p>
                <p className="mt-0.5 text-[12px] opacity-60 truncate">
                  {entry.verse_ref} · {timeAgo(entry.created_at)}
                  <span className="tabular-nums"> · {index + 1} / {Math.max(total, entries.length)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                className="w-10 h-10 inline-flex items-center justify-center rounded-full opacity-80"
                aria-label={paused ? '이어서 넘기기' : '멈추기'}
              >
                {paused ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
                    <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            <p className="flex-1 text-[14px] font-bold">다 봤어요</p>
          )}
          <button type="button" onClick={onClose} className="w-10 h-10 inline-flex items-center justify-center rounded-full opacity-80" aria-label="닫기">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {entry ? (
          <>
            {/* 무대 — 제스처는 여기서만 */}
            <div
              className="relative flex min-h-0 flex-1 items-center justify-center px-4 touch-none select-none"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onPointerLeave={onPointerCancel}
            >
              <InkReplay
                key={entry.id}
                entry={entry}
                bare
                maxRatio={1.5}
                onPlay={handlePlay}
                className={`hw-paper--lined hw-story__paper ${entry.rank ? `ring-2 ${RANK_META[entry.rank]?.ring ?? ''}` : ''}`}
                style={{ width: `min(100%, calc((100dvh - 360px) / ${ratio}))` }}
              />
              {stopped ? <span className="hw-story__paused">멈춤</span> : null}
              {/* PC — 화살표 */}
              <button type="button" onClick={() => go(index - 1)} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} disabled={index === 0} className="hw-story__arrow left-[-56px]" aria-label="이전 작품">
                ‹
              </button>
              <button type="button" onClick={() => go(index + 1)} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} className="hw-story__arrow right-[-56px]" aria-label="다음 작품">
                ›
              </button>
            </div>

            {/* 사연·한 표 */}
            <div className="max-h-[42%] overflow-y-auto px-5 pt-3 pb-[calc(18px+env(safe-area-inset-bottom))]">
              <p className="font-['Noto_Serif_KR',serif] text-[14px] leading-[1.75] tracking-[-0.01em] opacity-80 line-clamp-3">{entry.verse_text}</p>
              {entry.comment ? (
                <p className="mt-2.5 text-[14.5px] leading-[1.65] font-semibold">“{entry.comment}”</p>
              ) : null}
              {entry.is_hidden ? <p className="mt-2 text-[12px] font-bold text-amber-300">관리자가 숨긴 작품이에요</p> : null}

              <div className="mt-4 flex items-center gap-2">
                {canVote ? (
                  <button
                    type="button"
                    onClick={() => onVote(entry)}
                    disabled={voteDisabled}
                    aria-pressed={entry.voted_by_me}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-bold transition-colors disabled:opacity-50 ${
                      entry.voted_by_me ? 'bg-rose-500 text-white' : 'bg-white/[0.12]'
                    }`}
                  >
                    <HeartIcon filled={entry.voted_by_me} size={19} />
                    {entry.voted_by_me ? '한 표 드렸어요' : contest.votes_left > 0 ? '이 글씨에 한 표' : '표를 모두 썼어요'}
                  </button>
                ) : null}
                {entry.can_make_card ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/handwriting/${contest.id}/card/${entry.id}`)}
                    className={`inline-flex items-center justify-center gap-1.5 py-3.5 px-4 rounded-2xl text-[14.5px] font-bold ${
                      canVote ? 'bg-white/[0.12]' : 'flex-1 bg-[#f3ead8] text-[#14120f]'
                    }`}
                  >
                    <CardIcon />
                    말씀카드
                  </button>
                ) : null}
              </div>
              <p className="mt-2.5 text-center text-[12px] opacity-55">
                {canVote ? `남은 표 ${contest.votes_left} / ${contest.votes_per_user}` : ''}
                {canVote && entry.vote_count != null ? ' · ' : ''}
                {entry.vote_count != null ? `지금까지 ${entry.vote_count}표` : canVote ? ' · 표 수는 발표 때 공개돼요' : ''}
              </p>
              {isAdmin ? (
                <button type="button" onClick={() => toggleHidden(entry)} disabled={hide.isPending} className="mt-3 w-full py-2 text-[12px] font-bold opacity-50">
                  관리자 · {entry.is_hidden ? '다시 보이게 하기' : '이 작품 숨기기'}
                </button>
              ) : null}
            </div>
          </>
        ) : atInvite ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-[calc(24px+env(safe-area-inset-bottom))] text-center">
            <div className="hw-story__blank">
              <span className="hw-story__blank-text">여기에 당신의 글씨를</span>
            </div>
            <p className="mt-2 font-['Noto_Serif_KR',serif] text-[20px] leading-[1.5] font-semibold">
              {total}편을 다 봤어요
              <br />
              이제 당신 차례예요
            </p>
            <p className="text-[13px] opacity-65">마음에 남은 구절 하나, 손으로 옮겨 볼까요?</p>
            <button
              type="button"
              onClick={onWrite}
              className="mt-1 w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#f3ead8] text-[#14120f] text-[15.5px] font-bold"
            >
              <QuillIcon />내 글씨 남기기
            </button>
            <button type="button" onClick={() => moveTo(0)} className="text-[13px] font-bold opacity-60">
              처음부터 다시 보기
            </button>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[13px] opacity-60">불러오는 중…</div>
        )}
      </div>
    </div>
  )
}

export default StoryViewer
