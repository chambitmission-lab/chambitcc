// 후속 할 일 목록 — 심방 기록 화면과 목회자 홈이 공유. 체크하면 마친 일로.
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../../utils/toast'
import { updateVisit, type FollowUp } from '../../../api/pastor'
import { EmptyHint } from '../../Admin/components/StatCards'
import { formatDay } from './pastorUtils'

const FollowUpList = ({ items, compact = false }: { items: FollowUp[]; compact?: boolean }) => {
  const qc = useQueryClient()
  const done = useMutation({
    mutationFn: (visitId: number) => updateVisit(visitId, { follow_up_done: true }),
    onSuccess: () => {
      showToast('마친 일로 표시했습니다', 'success')
      for (const key of [['pastor-visits'], ['pastor-home'], ['pastor-member'], ['pastor-suggestions'], ['pastor-agenda'], ['pastor-report']]) {
        void qc.invalidateQueries({ queryKey: key, refetchType: 'all' })
      }
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  if (items.length === 0) return <EmptyHint text="남은 후속 할 일이 없습니다" />
  return (
    <ul className="space-y-1.5">
      {items.map(f => (
        <li key={f.visit_id} className="flex items-start gap-2.5">
          <button
            type="button"
            aria-label="마친 일로 표시"
            disabled={done.isPending}
            onClick={() => done.mutate(f.visit_id)}
            className="shrink-0 mt-0.5 text-gray-300 dark:text-white/45 hover:text-brand transition-colors"
          >
            <span className="material-icons-outlined text-[20px]">check_box_outline_blank</span>
          </button>
          <Link to={`/pastor/members/${f.member_user_id}`} className="flex-1 min-w-0 group">
            <span className="block text-[14px] font-semibold text-ink-strong group-hover:text-brand">
              {f.follow_up}
            </span>
            <span className="block text-[13px] text-gray-600 dark:text-white/60">
              {f.member_name}
              {f.follow_up_date ? (
                <span className={f.overdue ? 'text-[var(--amber)] font-bold' : ''}>
                  {' · '}
                  {f.overdue ? '지남 · ' : ''}
                  {formatDay(f.follow_up_date, !compact)}
                </span>
              ) : (
                ' · 날짜 없음'
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default FollowUpList
