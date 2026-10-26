// 작품 크게 보기 — 종이 위에서 다시 써지는 글씨 + 구절 원문 + 소감, 그리고 한 표·말씀카드·(관리자) 숨기기
import { useNavigate } from 'react-router-dom'
import { SheetGrabber } from '../../components/common/SheetGrabber'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useHideEntry } from '../../hooks/useHandwritingContest'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import type { ContestDetail, ContestEntry } from '../../types/handwritingContest'
import { can } from '../../utils/access'
import { confirmDialog } from '../../utils/confirmDialog'
import { toastFeedback } from '../../utils/toast'
import { Avatar, CardIcon, HeartIcon, Medal } from './contestShared'
import InkReplay from './InkReplay'
import { RANK_META, formatDay } from './contestFormat'

interface Props {
  contest: ContestDetail
  entry: ContestEntry
  onClose: () => void
  onVote: (entry: ContestEntry) => void
  voting: boolean
}

const EntrySheet = ({ contest, entry, onClose, onVote, voting }: Props) => {
  const navigate = useNavigate()
  useBodyScrollLock()
  useModalBackButton(onClose)
  useEscapeKey(onClose)
  const hide = useHideEntry(contest.id, toastFeedback({ success: (_d, v) => ((v as { hidden: boolean }).hidden ? '작품을 숨겼어요' : '다시 보이게 했어요') }))
  const isAdmin = can('admin:access')

  const canVote = contest.phase === 'open' && !entry.is_mine
  const voteDisabled = voting || (!entry.voted_by_me && contest.votes_left <= 0)

  const toggleHidden = async () => {
    const next = !entry.is_hidden
    if (next) {
      const ok = await confirmDialog({
        title: '이 작품을 숨길까요?',
        message: '갤러리와 순위에서 빠져요. 작성자에게는 그대로 보여요.',
        confirmText: '숨기기',
        tone: 'warning',
      })
      if (!ok) return
    }
    hide.mutate({ entryId: entry.id, hidden: next }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end lg:items-center justify-center" role="dialog" aria-modal="true" aria-label={`${entry.author.name}님의 작품`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md lg:max-w-[560px] max-h-[calc(92vh/var(--az,1))] overflow-y-auto rounded-t-[24px] lg:rounded-[24px] bg-white dark:bg-[#15151d] px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl">
        <SheetGrabber onClose={onClose} className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-3 lg:hidden" />

        <div className="flex items-center gap-2.5 mb-3">
          <Avatar name={entry.author.name} url={entry.author.avatar_url} size={34} />
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-ink-strong truncate">
              {entry.author.name}
              {entry.is_mine ? <span className="ml-1.5 text-[11px] font-bold text-brand">내 작품</span> : null}
            </p>
            <p className="text-[12px] text-ink-muted">{formatDay(entry.created_at)} 출품</p>
          </div>
          {entry.rank ? (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-ink-strong">
              <Medal rank={entry.rank} size={24} />
              {RANK_META[entry.rank]?.label}
            </span>
          ) : null}
        </div>

        <InkReplay entry={entry} maxRatio={1.5} className={entry.rank ? `ring-2 ${RANK_META[entry.rank]?.ring ?? ''}` : ''} />

        <div className="mt-4">
          <p className="text-[13px] font-extrabold text-brand">{entry.verse_ref}</p>
          <p className="mt-1 text-[14.5px] leading-[1.75] text-ink-strong font-['Noto_Serif_KR',serif] tracking-[-0.01em]">
            {entry.verse_text}
          </p>
          {entry.comment ? (
            <p className="mt-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-muted">
              “{entry.comment}”
            </p>
          ) : null}
          {entry.is_hidden ? (
            <p className="mt-3 text-[12px] font-bold text-amber-600 dark:text-amber-300">관리자가 숨긴 작품이에요 (갤러리·순위에서 빠짐)</p>
          ) : null}
        </div>

        <div className="mt-5 flex gap-2">
          {canVote ? (
            <button
              type="button"
              onClick={() => onVote(entry)}
              disabled={voteDisabled}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[14.5px] font-bold transition-colors disabled:opacity-50 ${
                entry.voted_by_me
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25'
                  : 'bg-brand text-white'
              }`}
            >
              <HeartIcon filled={entry.voted_by_me} />
              {entry.voted_by_me ? '한 표 거두기' : contest.votes_left > 0 ? `한 표 주기 (남은 표 ${contest.votes_left})` : '표를 모두 썼어요'}
            </button>
          ) : null}
          {entry.can_make_card ? (
            <button
              type="button"
              onClick={() => navigate(`/handwriting/${contest.id}/card/${entry.id}`)}
              className={`inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl text-[14.5px] font-bold ${
                canVote
                  ? 'bg-gray-100 text-ink-strong dark:bg-white/[0.07]'
                  : 'flex-1 bg-brand text-white'
              }`}
            >
              <CardIcon />
              말씀카드 만들기
            </button>
          ) : null}
        </div>
        {entry.vote_count != null ? (
          <p className="mt-3 text-center text-[12.5px] text-ink-muted">
            지금까지 <b className="text-ink-strong tabular-nums">{entry.vote_count}</b>표를 받았어요
          </p>
        ) : contest.phase === 'open' ? (
          <p className="mt-3 text-center text-[12px] text-ink-muted">표 수는 발표 때 공개돼요</p>
        ) : null}

        {isAdmin ? (
          <button
            type="button"
            onClick={toggleHidden}
            disabled={hide.isPending}
            className="mt-4 w-full py-2.5 rounded-xl text-[12.5px] font-bold text-ink-muted border border-gray-200 dark:border-white/10"
          >
            관리자 · {entry.is_hidden ? '다시 보이게 하기' : '이 작품 숨기기'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default EntrySheet
