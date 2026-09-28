import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createOutline, fetchOutlines, type OutlineSummary } from '../../api/pastor'
import { showToast } from '../../utils/toast'
import DatePicker from '../../components/common/DatePicker'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import { SermonTabs } from './components/sermonNotes'
import { formatDay, inputCls, pickerCls, usePastorGate } from './components/pastorUtils'

// 설교 개요 보드 목록 — 새 개요 만들기 + 준비 중 / 마친 설교

/** 다가오는 주일 'YYYY-MM-DD' (오늘이 주일이면 오늘) */
const nextSunday = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const PastorSermonOutlines = () => {
  const pastor = usePastorGate()
  const { data, isPending } = useQuery<OutlineSummary[]>({
    queryKey: ['pastor-outlines'],
    queryFn: fetchOutlines,
    enabled: pastor,
    refetchOnMount: 'always',
  })
  const drafts = (data ?? []).filter(o => o.status === 'draft')
  const done = (data ?? []).filter(o => o.status === 'done')

  return (
    <PastorShell>
      <SermonTabs />
      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="contents lg:block lg:min-w-0">
          {isPending && !data ? (
            <StatSpinner label="개요를 불러오는 중..." />
          ) : (
            <>
              <SectionCard title={`준비 중 ${drafts.length || ''}`.trim()}>
                {drafts.length === 0 ? <EmptyHint text="준비 중인 개요가 없습니다" /> : <OutlineList items={drafts} />}
              </SectionCard>
              {done.length > 0 && (
                <SectionCard title={`마친 설교 ${done.length}`}>
                  <OutlineList items={done} />
                </SectionCard>
              )}
            </>
          )}
        </div>
        <div className="contents lg:block">
          <NewOutlineCard />
        </div>
      </div>
    </PastorShell>
  )
}

const OutlineList = ({ items }: { items: OutlineSummary[] }) => (
  <ul className="space-y-1.5">
    {items.map(o => (
      <li key={o.id}>
        <Link
          to={`/pastor/sermon/outlines/${o.id}`}
          className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02] hover:border-brand transition-colors"
        >
          <span className="material-icons-outlined text-[22px] text-brand">{o.status === 'done' ? 'task_alt' : 'view_agenda'}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13.5px] font-bold text-ink-strong truncate">{o.title}</span>
            <span className="block text-[12px] text-gray-600 dark:text-white/60 truncate">
              {[o.passage, o.preach_on && formatDay(o.preach_on), o.note_count ? `메모 ${o.note_count}` : null].filter(Boolean).join(' · ')}
            </span>
          </span>
          <span className="material-icons-outlined text-[20px] text-gray-400">chevron_right</span>
        </Link>
      </li>
    ))}
  </ul>
)

const NewOutlineCard = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [passage, setPassage] = useState('')
  const [preachOn, setPreachOn] = useState(nextSunday())
  const create = useMutation({
    mutationFn: () => createOutline({ title: title.trim(), passage: passage.trim() || null, preach_on: preachOn || null }),
    onSuccess: o => {
      void qc.invalidateQueries({ queryKey: ['pastor-outlines'] })
      navigate(`/pastor/sermon/outlines/${o.id}`)
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
  return (
    <SectionCard title="새 설교 개요">
      <p className="text-[12px] text-gray-600 dark:text-white/60 leading-relaxed">
        서론·본론·적용·결론 칸에 생각을 적고, 모아 둔 메모를 끌어와 배치합니다. 설교를 마치면 쓴 메모가 표시됩니다.
      </p>
      <input className={inputCls} value={title} maxLength={200} placeholder="설교 제목 (가제도 좋아요)" onChange={e => setTitle(e.target.value)} />
      <input className={inputCls} value={passage} maxLength={100} placeholder="본문 — 예: 빌 4:4-7" onChange={e => setPassage(e.target.value)} />
      <DatePicker value={preachOn} onChange={setPreachOn} placeholder="설교할 날" className={pickerCls} />
      <button
        type="button"
        disabled={!title.trim() || create.isPending}
        onClick={() => create.mutate()}
        className="w-full py-2.5 rounded-xl bg-brand text-white text-[13.5px] font-bold disabled:opacity-40"
      >
        {create.isPending ? '만드는 중...' : '개요 만들기'}
      </button>
    </SectionCard>
  )
}

export default PastorSermonOutlines
