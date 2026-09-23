// 성도 고르기 — 목회 일정에서 '심방 예약하기'를 누르면 먼저 누구를 찾아갈지 고른다
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchRoster, type RosterData, type RosterMember } from '../../../api/pastor'
import { Avatar, GhostButton, PastorModal } from './ui'
import { inputCls } from './pastorUtils'

interface Props {
  title?: string
  onPick: (m: RosterMember) => void
  onClose: () => void
}

const MemberPicker = ({ title = '누구를 찾아갈까요', onPick, onClose }: Props) => {
  const [q, setQ] = useState('')
  const { data, isPending } = useQuery<RosterData>({ queryKey: ['pastor-roster'], queryFn: fetchRoster })

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = data?.items ?? []
    if (!needle) return list
    return list.filter(m =>
      [m.name, m.district, m.church_title, m.phone].filter(Boolean).join(' ').toLowerCase().includes(needle),
    )
  }, [data, q])

  return (
    <PastorModal title={title} onClose={onClose} footer={<GhostButton onClick={onClose}>닫기</GhostButton>}>
      <input
        autoFocus
        className={inputCls}
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="이름 · 구역 · 연락처로 찾기"
      />
      {isPending && !data ? (
        <p className="py-8 text-center text-[13px] text-gray-600">성도 명부를 불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-gray-600">맞는 성도가 없습니다</p>
      ) : (
        <ul className="space-y-1">
          {rows.slice(0, 60).map(m => (
            <li key={m.user_id}>
              <button
                type="button"
                onClick={() => onPick(m)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--brand-soft)] transition-colors"
              >
                <Avatar name={m.name} url={m.avatar_url} size="sm" />
                <span className="flex-1 min-w-0">
                  <span className="text-[13.5px] font-bold text-ink-strong">{m.name}</span>
                  {m.church_title && <span className="ml-1.5 text-[12px] font-semibold text-brand">{m.church_title}</span>}
                  {m.district && <span className="ml-1.5 text-[12px] text-gray-600 dark:text-white/60">{m.district}</span>}
                </span>
                <span className="material-icons-outlined text-[18px] text-gray-300">chevron_right</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PastorModal>
  )
}

export default MemberPicker
