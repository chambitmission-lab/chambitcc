import { pastorKeys } from '../../../hooks/queryKeys'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchOutline, fetchOutlines, type OutlineSummary, type SermonOutline } from '../../../api/pastor'
import { timeAgo } from '../../../utils/dateUtils'
import { SectionCard } from '../../Admin/components/StatCards'
import { daysSince, formatDay, todayIso } from './pastorUtils'

// 목양 브리핑 우측 맨 위 — 이번 주일 설교 개요가 어디까지 왔는지.
// 개요 보드와 같은 쿼리 키를 써서, '이어서 쓰기'로 들어가면 캐시를 그대로 이어받는다.
// 보드는 저장할 때마다 outline(id) 캐시를 갈아 끼우므로 돌아오면 칸 진행이 바로 맞는다.

/** 다가오는 주일 'YYYY-MM-DD' (오늘이 주일이면 오늘) */
const upcomingSunday = (): string => todayIso((7 - new Date().getDay()) % 7)

const day = (o: OutlineSummary): string => o.preach_on?.slice(0, 10) ?? ''

/**
 * 보여 줄 개요 하나 —
 * ① 이번 주일로 잡힌 개요(준비 중 우선, 주일 오후엔 마친 것도)
 * ② 앞으로 설교할 준비 중 개요 중 가장 가까운 것
 * ③ 날짜가 없거나 지난 준비 중 개요 중 최근에 손댄 것
 */
const pickOutline = (items: OutlineSummary[], sunday: string): OutlineSummary | null => {
  const onSunday = items
    .filter(o => day(o) === sunday)
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
  if (onSunday[0]) return onSunday[0]
  const drafts = items.filter(o => o.status === 'draft')
  const today = todayIso()
  const upcoming = drafts.filter(o => day(o) >= today).sort((a, b) => day(a).localeCompare(day(b)))
  if (upcoming[0]) return upcoming[0]
  return [...drafts].sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))[0] ?? null
}

/** 설교일까지 — '오늘' / '내일' / 'D-3' / '2일 지남' */
const dDay = (iso: string): { label: string; late: boolean } | null => {
  const ago = daysSince(iso)
  if (ago == null) return null
  if (ago === 0) return { label: '오늘', late: false }
  if (ago === -1) return { label: '내일', late: false }
  if (ago < 0) return { label: `D-${-ago}`, late: false }
  return { label: `${ago}일 지남`, late: true }
}

const isFilled = (s: SermonOutline['sections'][number]) => !!s.text.trim() || s.note_ids.length > 0

const SundaySermonCard = () => {
  const sunday = upcomingSunday()
  const { data: list } = useQuery<OutlineSummary[]>({
    queryKey: pastorKeys.outlines(),
    queryFn: fetchOutlines,
  })
  const picked = list ? pickOutline(list, sunday) : null
  const { data: detail } = useQuery<SermonOutline>({
    queryKey: pastorKeys.outline(picked?.id ?? 0),
    queryFn: () => fetchOutline(picked!.id),
    enabled: !!picked && picked.status === 'draft',
  })

  const isThisSunday = !!picked && day(picked) === sunday
  const title = !picked || isThisSunday ? '이번 주일 설교' : '준비 중인 설교'

  return (
    <SectionCard
      title={title}
      action={
        <Link to="/pastor/sermon/outlines" className="text-[13px] font-semibold text-brand hover:underline">
          개요 보드
        </Link>
      }
    >
      {!list ? (
        <div className="h-[120px] rounded-xl bg-gray-50 dark:bg-white/[0.03] animate-pulse" />
      ) : !picked ? (
        <EmptyOutline sunday={sunday} />
      ) : picked.status === 'done' ? (
        <DoneOutline outline={picked} />
      ) : (
        <DraftOutline outline={picked} detail={detail?.id === picked.id ? detail : undefined} />
      )}
    </SectionCard>
  )
}

const DraftOutline = ({ outline, detail }: { outline: OutlineSummary; detail?: SermonOutline }) => {
  const due = outline.preach_on ? dDay(outline.preach_on) : null
  const sections = detail?.sections ?? []
  const filled = sections.filter(isFilled).length
  const edited = outline.updated_at ? timeAgo(outline.updated_at) : ''

  return (
    <>
      <div>
        <p className="flex items-center gap-2 text-[12.5px] font-semibold text-gray-600 dark:text-white/65">
          {outline.preach_on ? formatDay(outline.preach_on) : '설교할 날 미정'}
          {due && (
            <span
              className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${
                due.late ? 'bg-[var(--amber-soft)] text-[var(--amber)]' : 'bg-[var(--brand-soft)] text-brand'
              }`}
            >
              {due.label}
            </span>
          )}
        </p>
        <p className="mt-1.5 text-[16px] font-bold text-ink-strong tracking-[-0.02em] line-clamp-2">{outline.title}</p>
        {outline.passage && <p className="mt-0.5 text-[13px] text-gray-600 dark:text-white/60 truncate">{outline.passage}</p>}
      </div>

      {/* 칸 진행 — 상세가 오기 전엔 자리만 잡아 둔다 */}
      {detail ? (
        sections.length > 0 && (
          <div>
            <div className="flex gap-1">
              {sections.map(s => (
                <span
                  key={s.id}
                  className={`h-1.5 flex-1 rounded-full ${isFilled(s) ? 'bg-brand' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                />
              ))}
            </div>
            <p className="mt-2 text-[12.5px] font-semibold text-gray-600 dark:text-white/65">
              {sections.length}칸 중 <span className="text-brand">{filled}칸</span> 작성
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {sections.map(s => (
                <li
                  key={s.id}
                  className={`px-2 py-0.5 rounded-md text-[12px] font-semibold ${
                    isFilled(s)
                      ? 'bg-[var(--brand-soft)] text-brand'
                      : 'border border-dashed border-gray-300 dark:border-white/[0.15] text-gray-500 dark:text-white/50'
                  }`}
                >
                  {s.label || '이름 없는 칸'}
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <div className="h-[52px] rounded-lg bg-gray-50 dark:bg-white/[0.03] animate-pulse" />
      )}

      <p className="text-[12px] text-gray-500 dark:text-white/50">
        {[outline.note_count ? `붙인 메모 ${outline.note_count}장` : '붙인 메모 없음', edited && `${edited} 수정`]
          .filter(Boolean)
          .join(' · ')}
      </p>

      <Link
        to={`/pastor/sermon/outlines/${outline.id}`}
        className="flex items-center justify-center gap-1 w-full py-2.5 rounded-xl bg-brand text-white text-[13.5px] font-bold active:opacity-90"
      >
        이어서 쓰기
        <span className="material-icons-outlined text-[18px]">chevron_right</span>
      </Link>
    </>
  )
}

const DoneOutline = ({ outline }: { outline: OutlineSummary }) => (
  <>
    <Link to={`/pastor/sermon/outlines/${outline.id}`} className="flex items-center gap-3 group">
      <span className="material-icons-outlined text-[24px] text-brand">task_alt</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-bold text-ink-strong truncate group-hover:text-brand">{outline.title}</span>
        <span className="block text-[12.5px] text-gray-600 dark:text-white/60 truncate">
          {['설교를 마쳤습니다', outline.note_count ? `쓴 메모 ${outline.note_count}장` : null].filter(Boolean).join(' · ')}
        </span>
      </span>
    </Link>
    <Link
      to="/pastor/sermon/outlines"
      className="block w-full py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.1] text-center text-[13.5px] font-bold text-brand hover:border-brand"
    >
      다음 설교 개요 만들기
    </Link>
  </>
)

const EmptyOutline = ({ sunday }: { sunday: string }) => (
  <>
    <div className="flex items-center gap-3">
      <span className="material-icons-outlined text-[24px] text-gray-400">view_agenda</span>
      <p className="text-[13.5px] text-gray-600 dark:text-white/65 leading-relaxed">
        {formatDay(sunday)} 설교 개요를
        <br />
        아직 시작하지 않으셨어요
      </p>
    </div>
    <Link
      to="/pastor/sermon/outlines"
      className="block w-full py-2.5 rounded-xl bg-brand text-white text-center text-[13.5px] font-bold active:opacity-90"
    >
      개요 만들기
    </Link>
  </>
)

export default SundaySermonCard
