// 디지털 주보 PC 편집기 — 관리자 전용, lg+ 에서만 진입.
//
// 모바일의 필드별 인라인 편집(EditableField, 고칠 때마다 즉시 PUT)은 주보 한 부를 새로 쓰기엔
// 클릭·저장이 너무 잦다. PC 에선 한 화면에 전 섹션을 펼쳐 두고 초안으로 고친 뒤 한 번에 저장한다.
//
// - 좌: 섹션 목차(스크롤 위치 표시) / 중: 표 형태 입력 / 우(xl+): 실제 주보 화면 그대로의 미리보기
// - 표 칸에 엑셀·한글 표를 붙여넣으면 행·열로 펼쳐 넣는다(탭 구분, 여러 줄)
// - 표 칸 Enter = 아래 행 같은 칸(마지막 행이면 행 추가), Ctrl+S = 저장, Esc = 닫기
// - 초안은 localStorage 에 계속 적어 둔다 — 저장 안 하고 닫아도 다음에 열면 이어 쓰기 제안
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { showToast } from '../../../utils/toast'
import { useReplaceDigitalBulletin } from '../../../hooks/useDigitalBulletin'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type {
  AnnouncementItem,
  BulletinData,
  GroupItem,
  WeeklyScheduleItem,
  WorshipServiceItem,
} from '../../../types/digitalBulletin'
import DigitalBulletin from './DigitalBulletin'

const DRAFT_KEY = 'digital-bulletin-desk-draft'
const DAYS = ['월', '화', '수', '목', '금', '토', '주일'] as const

type SectionId = 'basic' | 'worship' | 'announcements' | 'groups' | 'schedule'
const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'basic', label: '기본 정보' },
  { id: 'worship', label: '주일오전예배' },
  { id: 'announcements', label: '교회 소식' },
  { id: 'groups', label: '구역 보고' },
  { id: 'schedule', label: '이번 주 일정' },
]

// ── 유틸 ─────────────────────────────────────────
const readDraft = (): BulletinData | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as BulletinData) : null
  } catch {
    return null
  }
}
const writeDraft = (data: BulletinData | null) => {
  try {
    if (data) localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* 저장소 막힘 — 초안 복구만 포기 */
  }
}

/** 기존 주보 날짜 표기("2026. 3. 15.")에 맞춘 주일 날짜. offsetWeeks=0 → 다가오는(오늘 포함) 주일 */
const sundayLabel = (offsetWeeks: number) => {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7) + offsetWeeks * 7)
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}

const normalizeDay = (raw: string) => {
  const s = raw.replace(/[()\s]/g, '').replace(/요일$/, '')
  if (s === '일' || s === '주일') return '주일'
  return (DAYS as readonly string[]).includes(s) ? s : raw.trim()
}
const dayOrder = (day: string) => {
  const i = (DAYS as readonly string[]).indexOf(normalizeDay(day))
  return i === -1 ? 99 : i
}

/** 클립보드 표 → 셀 2차원 배열. 엑셀·한글·구글시트는 탭 구분, 그 외엔 | 나 2칸 이상 공백도 받아준다 */
const parseTable = (text: string): string[][] => {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim() !== '')
  if (text.includes('\t')) return lines.map(l => l.split('\t').map(c => c.trim()))
  if (text.includes('|')) return lines.map(l => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim()))
  return lines.map(l => l.trim().split(/ {2,}/))
}

/** 소식 글 붙여넣기 → "1. 제목" 으로 시작하는 줄마다 새 항목, 번호가 없으면 빈 줄로 나눈다. 첫 줄 = 제목 */
const parseAnnouncements = (text: string): AnnouncementItem[] => {
  const lines = text.replace(/\r/g, '').split('\n')
  const numbered = lines.some(l => /^\s*\d+\s*[.)]\s*\S/.test(l))
  const blocks: string[][] = []
  let cur: string[] = []
  for (const line of lines) {
    const startsNew = numbered ? /^\s*\d+\s*[.)]\s*\S/.test(line) : line.trim() === ''
    if (startsNew && cur.some(l => l.trim())) {
      blocks.push(cur)
      cur = []
    }
    if (numbered || line.trim()) cur.push(line)
  }
  if (cur.some(l => l.trim())) blocks.push(cur)
  return blocks.map(b => {
    const ls = b.map(l => l.trim())
    const first = ls.findIndex(l => l !== '')
    return { title: ls[first], content: ls.slice(first + 1).join('\n').trim() }
  })
}

const move = <T,>(arr: T[], from: number, to: number) => {
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// ── 스타일 조각 ──────────────────────────────────
const inputCls =
  'w-full h-10 px-3 rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.09] ' +
  'text-[14.5px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none transition-colors ' +
  'hover:border-gray-300 dark:hover:border-white/[0.16] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft-strong)]'
const textareaCls = inputCls.replace('h-10', 'min-h-[84px]') + ' py-2.5 leading-[1.6] resize-y [field-sizing:content]'
const chipCls =
  'inline-flex items-center gap-1 h-8 px-3 rounded-full text-[13px] font-semibold border transition-colors ' +
  'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-[var(--brand)] hover:text-brand hover:bg-[var(--brand-soft)]'
const iconBtnCls =
  'w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 dark:text-white/40 transition-colors ' +
  'hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-ink-strong disabled:opacity-30 disabled:pointer-events-none'

const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const ICON = {
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  paste: 'M9 4h6v3H9zM7 5H5v16h14V5h-2',
  sort: 'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4',
}

// ── 본체 ─────────────────────────────────────────
interface BulletinDeskEditorProps {
  initial: BulletinData
  onClose: () => void
}

const BulletinDeskEditor = ({ initial, onClose }: BulletinDeskEditorProps) => {
  const replaceMutation = useReplaceDigitalBulletin()
  const [baseline, setBaseline] = useState<BulletinData>(initial)
  const [draft, setDraft] = useState<BulletinData>(initial)
  const [recoverable, setRecoverable] = useState<BulletinData | null>(() => {
    const saved = readDraft()
    return saved && JSON.stringify(saved) !== JSON.stringify(initial) ? saved : null
  })
  const [active, setActive] = useState<SectionId>('basic')
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionEl = (id: SectionId) =>
    scrollRef.current?.querySelector<HTMLElement>(`[data-desk-section="${id}"]`) ?? null

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline])

  useModalBackButton(onClose)

  // 초안 상시 기록 — 복구 배너가 떠 있는 동안엔 옛 초안을 덮어쓰지 않는다
  useEffect(() => {
    if (recoverable) return
    writeDraft(dirty ? draft : null)
  }, [draft, dirty, recoverable])

  const save = useCallback(async () => {
    if (!dirty || replaceMutation.isPending) return
    try {
      await replaceMutation.mutateAsync(draft)
      setBaseline(draft)
      setRecoverable(null)
      writeDraft(null)
      showToast('주보를 저장했어요', 'success')
    } catch (e) {
      console.error(e)
      showToast('저장에 실패했습니다', 'error')
    }
  }, [dirty, draft, replaceMutation])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      } else if (e.key === 'Escape' && !e.isComposing) {
        // 입력 중 Esc 는 칸에서 빠져나오기만 — 실수로 편집기가 닫히지 않게
        const el = document.activeElement
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.blur()
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save, onClose])

  // 저장 안 한 채 새로고침·탭 닫기 경고
  useEffect(() => {
    if (!dirty) return
    const onBefore = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBefore)
    return () => window.removeEventListener('beforeunload', onBefore)
  }, [dirty])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    let cur: SectionId = 'basic'
    for (const s of SECTIONS) {
      const node = sectionEl(s.id)
      if (node && node.offsetTop - el.offsetTop <= el.scrollTop + 80) cur = s.id
    }
    // 끝까지 내리면 마지막 섹션 머리가 위에 닿지 못하므로 바닥 = 마지막 섹션
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) cur = SECTIONS[SECTIONS.length - 1].id
    setActive(cur)
  }
  const jump = (id: SectionId) => sectionEl(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const set = <K extends keyof BulletinData>(key: K, value: BulletinData[K]) =>
    setDraft(d => ({ ...d, [key]: value }))
  const setWorship = <K extends keyof BulletinData['worship']>(key: K, value: BulletinData['worship'][K]) =>
    setDraft(d => ({ ...d, worship: { ...d.worship, [key]: value } }))

  const counts: Record<SectionId, string> = {
    basic: draft.date || '날짜 없음',
    worship: `${draft.worship.schedule.length}개 예배`,
    announcements: `${draft.announcements.length}건`,
    groups: `${draft.groups.length}구역`,
    schedule: `${draft.weeklySchedule.length}개 일정`,
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-stretch justify-center bg-black/45 backdrop-blur-[2px] p-4 xl:p-6" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="relative flex flex-col w-full max-w-[1680px] rounded-3xl overflow-hidden bg-background-light dark:bg-background-dark border border-black/[0.05] dark:border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        {/* 헤더 */}
        <header className="shrink-0 flex items-center gap-3 px-6 h-16 border-b border-gray-200/70 dark:border-white/[0.07] bg-white/80 dark:bg-card-dark">
          <div className="min-w-0">
            <p className="text-[18px] font-bold text-ink-strong tracking-[-0.01em]">디지털 주보 편집</p>
            <p className="text-[12.5px] text-gray-500 dark:text-white/50">
              Ctrl+S 저장 · 표 칸에 엑셀/한글 표를 붙여넣으면 한 번에 채워져요 · Enter로 아래 칸 이동
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={[
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold',
                dirty ? 'bg-[var(--brand-soft)] text-brand' : 'text-gray-500 dark:text-white/50',
              ].join(' ')}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dirty ? 'bg-[var(--brand)]' : 'bg-gray-300 dark:bg-white/30'}`} />
              {dirty ? '저장 안 된 변경 있음' : '저장됨'}
            </span>
            {dirty && (
              <button type="button" className={chipCls} onClick={() => setDraft(baseline)}>
                변경 취소
              </button>
            )}
            <button
              type="button"
              onClick={() => void save()}
              disabled={!dirty || replaceMutation.isPending}
              className="h-10 px-5 rounded-xl bg-brand text-white text-[14.5px] font-bold shadow-[0_8px_20px_-8px_var(--brand-glow)] transition-opacity disabled:opacity-40"
            >
              {replaceMutation.isPending ? '저장 중…' : '저장'}
            </button>
            <button type="button" onClick={onClose} className={iconBtnCls + ' w-10 h-10'} aria-label="닫기">
              <Icon d={ICON.close} size={20} />
            </button>
          </div>
        </header>

        {recoverable && (
          <div className="shrink-0 flex items-center gap-3 px-6 py-2.5 bg-[var(--brand-soft)] border-b border-[var(--brand-soft-strong)] text-[13.5px] text-brand">
            <span className="font-semibold">저장하지 않고 닫았던 작성 중 초안이 있어요.</span>
            <button
              type="button"
              className="ml-auto h-8 px-3 rounded-lg bg-brand text-white font-bold"
              onClick={() => {
                setDraft(recoverable)
                setRecoverable(null)
              }}
            >
              이어서 쓰기
            </button>
            <button
              type="button"
              className="h-8 px-3 rounded-lg font-semibold hover:bg-white/50 dark:hover:bg-white/10"
              onClick={() => {
                writeDraft(null)
                setRecoverable(null)
              }}
            >
              버리기
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 flex">
          {/* 목차 */}
          <nav className="shrink-0 w-[188px] p-3 border-r border-gray-200/70 dark:border-white/[0.07] space-y-1 overflow-y-auto">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => jump(s.id)}
                className={[
                  'w-full text-left px-3 py-2.5 rounded-xl transition-colors',
                  active === s.id
                    ? 'bg-[var(--brand-soft)] text-brand'
                    : 'text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.05]',
                ].join(' ')}
              >
                <span className="block text-[14.5px] font-bold">{s.label}</span>
                <span className="block text-[12px] opacity-70 truncate">{counts[s.id]}</span>
              </button>
            ))}
          </nav>

          {/* 입력 */}
          <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-w-0 overflow-y-auto overscroll-contain">
            <div className="max-w-[960px] mx-auto px-8 py-6 space-y-8 pb-[40vh]">
              <Section id="basic" title="기본 정보">
                <Field label="날짜">
                  <div className="flex items-center gap-2">
                    <input className={inputCls + ' max-w-[220px]'} value={draft.date} onChange={e => set('date', e.target.value)} placeholder="2026. 10. 4." />
                    <button type="button" className={chipCls} onClick={() => set('date', sundayLabel(0))}>
                      이번 주일 {sundayLabel(0)}
                    </button>
                    <button type="button" className={chipCls} onClick={() => set('date', sundayLabel(1))}>
                      다음 주일
                    </button>
                  </div>
                </Field>
                <Field label="대표 제목" hint="줄바꿈 그대로 표시돼요">
                  <textarea className={textareaCls} rows={3} value={draft.title} onChange={e => set('title', e.target.value)} />
                </Field>
                <Field label="성경 구절">
                  <input className={inputCls} value={draft.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="(에스겔 37:5, 10)" />
                </Field>
              </Section>

              <Section id="worship" title="주일오전예배">
                <RowTable<WorshipServiceItem>
                  tableId="services"
                  rows={draft.worship.schedule}
                  onChange={rows => setWorship('schedule', rows)}
                  columns={[
                    { key: 'name', label: '예배 이름', width: '1fr', placeholder: '1부 예배' },
                    { key: 'time', label: '시간', width: '160px', placeholder: '오전 9:30' },
                    { key: 'preacher', label: '설교자', width: '1fr', placeholder: '○○○ 목사' },
                  ]}
                  empty={() => ({ name: '', time: '', preacher: '' })}
                  fromCells={c => ({ name: c[0] ?? '', time: c[1] ?? '', preacher: c[2] ?? '' })}
                  addLabel="예배 추가"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="찬송">
                    <input className={inputCls} value={draft.worship.offering} onChange={e => setWorship('offering', e.target.value)} placeholder="456장 / 15장" />
                  </Field>
                  <Field label="기도">
                    <input className={inputCls} value={draft.worship.prayer} onChange={e => setWorship('prayer', e.target.value)} placeholder="○○○ 집사 / ○○○ 장로" />
                  </Field>
                </div>
                <Field label="설교 제목">
                  <textarea
                    className={textareaCls.replace('min-h-[84px]', 'min-h-[60px]')}
                    rows={2}
                    value={draft.worship.sermon.title}
                    onChange={e => setWorship('sermon', { ...draft.worship.sermon, title: e.target.value })}
                  />
                </Field>
                <Field label="설교 부제">
                  <input
                    className={inputCls}
                    value={draft.worship.sermon.subtitle}
                    onChange={e => setWorship('sermon', { ...draft.worship.sermon, subtitle: e.target.value })}
                  />
                </Field>
              </Section>

              <Section id="announcements" title="교회 소식">
                <AnnouncementsEditor rows={draft.announcements} onChange={rows => set('announcements', rows)} />
              </Section>

              <Section id="groups" title="구역 보고">
                <RowTable<GroupItem>
                  tableId="groups"
                  rows={draft.groups}
                  onChange={rows => set('groups', rows)}
                  columns={[
                    { key: 'name', label: '구역 이름', width: '1fr', placeholder: '1구역' },
                    { key: 'leader', label: '구역장', width: '1fr' },
                    { key: 'members', label: '인원', width: '96px', type: 'number' },
                    { key: 'meeting', label: '모임', width: '1.2fr', placeholder: '매주 수요일' },
                  ]}
                  empty={() => ({ name: '', leader: '', members: 0, meeting: '' })}
                  fromCells={c => ({
                    name: c[0] ?? '',
                    leader: c[1] ?? '',
                    members: Number(String(c[2] ?? '').replace(/[^\d]/g, '')) || 0,
                    meeting: c[3] ?? '',
                  })}
                  addLabel="구역 추가"
                />
              </Section>

              <Section
                id="schedule"
                title="이번 주 일정"
               
                action={
                  <button
                    type="button"
                    className={chipCls}
                    onClick={() =>
                      set(
                        'weeklySchedule',
                        [...draft.weeklySchedule].sort((a, b) => dayOrder(a.day) - dayOrder(b.day)),
                      )
                    }
                  >
                    <Icon d={ICON.sort} size={14} />
                    요일순 정렬
                  </button>
                }
              >
                <RowTable<WeeklyScheduleItem>
                  tableId="schedule"
                  rows={draft.weeklySchedule}
                  onChange={rows => set('weeklySchedule', rows)}
                  columns={[
                    { key: 'day', label: '요일', width: '220px', render: (v, setV) => <DayPicker value={String(v)} onChange={setV} /> },
                    { key: 'event', label: '일정명', width: '1.3fr', placeholder: '새벽기도회' },
                    { key: 'time', label: '시간', width: '130px', placeholder: '오전 5:30' },
                    { key: 'location', label: '장소', width: '1fr', placeholder: '본당' },
                  ]}
                  empty={() => ({ day: '월', event: '', time: '', location: '' })}
                  fromCells={c => ({ day: normalizeDay(c[0] ?? '월'), event: c[1] ?? '', time: c[2] ?? '', location: c[3] ?? '' })}
                  addLabel="일정 추가"
                />
              </Section>
            </div>
          </div>

          {/* 미리보기 — 실제 /news 디지털 주보 화면 그대로 */}
          <aside className="hidden xl:flex shrink-0 w-[440px] 2xl:w-[500px] flex-col border-l border-gray-200/70 dark:border-white/[0.07] bg-gray-50/80 dark:bg-black/20">
            <p className="shrink-0 px-5 pt-4 pb-2 text-[12.5px] font-bold text-gray-500 dark:text-white/50">
              미리보기 · 성도들에게 보이는 화면
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-8">
              <DigitalBulletin previewData={draft} />
            </div>
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── 섹션 · 필드 ──────────────────────────────────
const Section = ({
  id,
  title,
  action,
  children,
}: {
  id: SectionId
  title: string
  action?: ReactNode
  children: ReactNode
}) => (
  <section data-desk-section={id} className="scroll-mt-4">
    <div className="flex items-center gap-2 mb-3">
      <span className="w-1 h-5 rounded-full bg-[var(--brand)]" />
      <h2 className="text-[19px] font-bold text-ink-strong tracking-[-0.01em]">{title}</h2>
      {action && <div className="ml-auto">{action}</div>}
    </div>
    <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] p-5 space-y-4">
      {children}
    </div>
  </section>
)

const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <label className="block">
    <span className="flex items-baseline gap-2 mb-1.5">
      <span className="text-[13.5px] font-semibold text-gray-600 dark:text-white/70">{label}</span>
      {hint && <span className="text-[12px] text-gray-400 dark:text-white/40">{hint}</span>}
    </span>
    {children}
  </label>
)

const DayPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const norm = normalizeDay(value)
  return (
    <div className="flex gap-0.5">
      {DAYS.map(d => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={[
            'h-10 rounded-lg text-[13px] font-bold transition-colors',
            d === '주일' ? 'px-1.5' : 'w-7',
            norm === d
              ? 'bg-brand text-white'
              : 'text-gray-500 dark:text-white/55 hover:bg-[var(--brand-soft)] hover:text-brand',
          ].join(' ')}
        >
          {d}
        </button>
      ))}
    </div>
  )
}

// ── 표 편집 ──────────────────────────────────────
interface Column<T> {
  key: keyof T & string
  label: string
  width: string
  placeholder?: string
  type?: 'text' | 'number'
  render?: (value: T[keyof T], set: (v: string) => void) => ReactNode
}

interface RowTableProps<T> {
  tableId: string
  rows: T[]
  onChange: (rows: T[]) => void
  columns: Column<T>[]
  empty: () => T
  fromCells: (cells: string[]) => T
  addLabel: string
}

const focusCell = (tableId: string, row: number, col: number) =>
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLInputElement>(`[data-cell="${tableId}:${row}:${col}"]`)
    el?.focus()
    el?.select()
  })

function RowTable<T>({ tableId, rows, onChange, columns, empty, fromCells, addLabel }: RowTableProps<T>) {
  const [pasteOpen, setPasteOpen] = useState(false)
  const grid = `28px ${columns.map(c => c.width).join(' ')} 132px`

  const setCell = (r: number, key: keyof T, raw: string, type?: 'text' | 'number') => {
    const next = [...rows]
    next[r] = { ...next[r], [key]: type === 'number' ? Number(raw.replace(/[^\d]/g, '')) || 0 : raw }
    onChange(next)
  }

  /** 표 붙여넣기: 시작 칸(r,c)부터 오른쪽·아래로 채우고 모자라면 행을 늘린다 */
  const spread = (cells: string[][], r0: number, c0: number) => {
    const next = [...rows]
    cells.forEach((line, i) => {
      const r = r0 + i
      const base = next[r] ?? empty()
      // 시작 칸 앞 열은 기존 값 유지, 붙여넣은 칸만 덮어쓴다
      const current = columns.map(col => String(base[col.key] ?? ''))
      line.forEach((v, j) => {
        if (c0 + j < columns.length) current[c0 + j] = v
      })
      next[r] = fromCells(current)
    })
    onChange(next)
  }

  const onPaste = (e: React.ClipboardEvent, r: number, c: number) => {
    const text = e.clipboardData.getData('text/plain')
    if (!text.includes('\t') && !text.trim().includes('\n')) return // 한 칸짜리는 기본 동작
    e.preventDefault()
    spread(parseTable(text), r, c)
  }

  const onKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    e.preventDefault()
    if (r === rows.length - 1) onChange([...rows, empty()])
    focusCell(tableId, r + 1, c)
  }

  return (
    <div>
      <div className="grid gap-2 px-1 pb-1.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/50" style={{ gridTemplateColumns: grid }}>
        <span />
        {columns.map(c => (
          <span key={c.key}>{c.label}</span>
        ))}
        <span />
      </div>
      <div className="space-y-1.5">
        {rows.map((row, r) => (
          <div key={r} className="group grid gap-2 items-center px-1 py-0.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02]" style={{ gridTemplateColumns: grid }}>
            <span className="text-center text-[12.5px] font-bold text-gray-400 dark:text-white/35 tabular-nums">{r + 1}</span>
            {columns.map((col, c) =>
              col.render ? (
                <div key={col.key}>{col.render(row[col.key], v => setCell(r, col.key, v))}</div>
              ) : (
                <input
                  key={col.key}
                  data-cell={`${tableId}:${r}:${c}`}
                  className={inputCls + (col.type === 'number' ? ' text-right tabular-nums' : '')}
                  inputMode={col.type === 'number' ? 'numeric' : undefined}
                  value={String(row[col.key] ?? '')}
                  placeholder={col.placeholder}
                  onChange={e => setCell(r, col.key, e.target.value, col.type)}
                  onPaste={e => onPaste(e, r, c)}
                  onKeyDown={e => onKeyDown(e, r, c)}
                />
              ),
            )}
            <RowActions
              index={r}
              count={rows.length}
              onMove={to => onChange(move(rows, r, to))}
              onDuplicate={() => onChange([...rows.slice(0, r + 1), { ...row }, ...rows.slice(r + 1)])}
              onRemove={() => onChange(rows.filter((_, i) => i !== r))}
            />
          </div>
        ))}
        {rows.length === 0 && (
          <p className="px-2 py-4 text-center text-[13.5px] text-gray-400 dark:text-white/40">
            아직 항목이 없어요. 추가하거나 표를 붙여넣어 보세요.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          className={chipCls}
          onClick={() => {
            onChange([...rows, empty()])
            focusCell(tableId, rows.length, columns.findIndex(c => !c.render))
          }}
        >
          <Icon d={ICON.plus} size={14} />
          {addLabel}
        </button>
        <button type="button" className={chipCls} onClick={() => setPasteOpen(v => !v)}>
          <Icon d={ICON.paste} size={14} />
          표 붙여넣기
        </button>
      </div>
      {pasteOpen && (
        <PasteBox
          hint={`엑셀·한글에서 표를 복사해 붙여넣으세요. 열 순서: ${columns.map(c => c.label).join(' · ')}`}
          preview={text => `${parseTable(text).length}행 인식`}
          onApply={(text, mode) => {
            const parsed = parseTable(text).map(fromCells)
            onChange(mode === 'replace' ? parsed : [...rows, ...parsed])
            setPasteOpen(false)
          }}
          onCancel={() => setPasteOpen(false)}
        />
      )}
    </div>
  )
}

const RowActions = ({
  index,
  count,
  onMove,
  onDuplicate,
  onRemove,
}: {
  index: number
  count: number
  onMove: (to: number) => void
  onDuplicate: () => void
  onRemove: () => void
}) => (
  <div className="flex items-center justify-end opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
    <button type="button" className={iconBtnCls} disabled={index === 0} onClick={() => onMove(index - 1)} title="위로">
      <Icon d={ICON.up} />
    </button>
    <button type="button" className={iconBtnCls} disabled={index === count - 1} onClick={() => onMove(index + 1)} title="아래로">
      <Icon d={ICON.down} />
    </button>
    <button type="button" className={iconBtnCls} onClick={onDuplicate} title="복제">
      <Icon d={ICON.copy} size={15} />
    </button>
    <button type="button" className={iconBtnCls + ' hover:!text-red-500'} onClick={onRemove} title="삭제">
      <Icon d={ICON.trash} size={15} />
    </button>
  </div>
)

const PasteBox = ({
  hint,
  preview,
  onApply,
  onCancel,
}: {
  hint: string
  preview: (text: string) => string
  onApply: (text: string, mode: 'append' | 'replace') => void
  onCancel: () => void
}) => {
  const [text, setText] = useState('')
  return (
    <div className="mt-3 rounded-xl border border-dashed border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] p-3 space-y-2">
      <p className="text-[12.5px] text-brand">{hint}</p>
      <textarea autoFocus className={textareaCls + ' min-h-[120px]'} value={text} onChange={e => setText(e.target.value)} />
      <div className="flex items-center gap-2">
        {text.trim() && <span className="text-[12.5px] font-semibold text-brand">{preview(text)}</span>}
        <button type="button" className="ml-auto h-8 px-3 rounded-lg text-[13px] font-semibold text-gray-600 dark:text-white/70 hover:bg-white/60 dark:hover:bg-white/10" onClick={onCancel}>
          취소
        </button>
        <button type="button" disabled={!text.trim()} className={chipCls + ' bg-white dark:bg-transparent disabled:opacity-40'} onClick={() => onApply(text, 'append')}>
          뒤에 덧붙이기
        </button>
        <button type="button" disabled={!text.trim()} className="h-8 px-3 rounded-full bg-brand text-white text-[13px] font-bold disabled:opacity-40" onClick={() => onApply(text, 'replace')}>
          전부 바꾸기
        </button>
      </div>
    </div>
  )
}

// ── 소식 편집 ────────────────────────────────────
const AnnouncementsEditor = ({ rows, onChange }: { rows: AnnouncementItem[]; onChange: (rows: AnnouncementItem[]) => void }) => {
  const [pasteOpen, setPasteOpen] = useState(false)
  const setField = (i: number, key: keyof AnnouncementItem, v: string) => {
    const next = [...rows]
    next[i] = { ...next[i], [key]: v }
    onChange(next)
  }
  return (
    <div>
      <div className="space-y-3">
        {rows.map((item, i) => (
          <div key={i} className="group flex gap-3 rounded-xl border border-gray-200/70 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02] p-3">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-brand text-[13px] font-bold flex items-center justify-center tabular-nums">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0 space-y-2">
              <input className={inputCls + ' font-semibold'} value={item.title} placeholder="소식 제목" onChange={e => setField(i, 'title', e.target.value)} />
              <textarea className={textareaCls} rows={2} value={item.content} placeholder="내용" onChange={e => setField(i, 'content', e.target.value)} />
            </div>
            <div className="shrink-0 self-start">
              <RowActions
                index={i}
                count={rows.length}
                onMove={to => onChange(move(rows, i, to))}
                onDuplicate={() => onChange([...rows.slice(0, i + 1), { ...item }, ...rows.slice(i + 1)])}
                onRemove={() => onChange(rows.filter((_, j) => j !== i))}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button type="button" className={chipCls} onClick={() => onChange([...rows, { title: `${rows.length + 1}. `, content: '' }])}>
          <Icon d={ICON.plus} size={14} />
          소식 추가
        </button>
        <button type="button" className={chipCls} onClick={() => setPasteOpen(v => !v)}>
          <Icon d={ICON.paste} size={14} />
          글 통째로 붙여넣기
        </button>
      </div>
      {pasteOpen && (
        <PasteBox
          hint="한글·워드의 광고 원고를 그대로 붙여넣으세요. '1.' '2.' 처럼 번호로 시작하는 줄마다 새 소식(번호가 없으면 빈 줄로 구분), 첫 줄은 제목·나머지는 내용이 돼요."
          preview={text => `${parseAnnouncements(text).length}건 인식`}
          onApply={(text, mode) => {
            const parsed = parseAnnouncements(text)
            onChange(mode === 'replace' ? parsed : [...rows, ...parsed])
            setPasteOpen(false)
          }}
          onCancel={() => setPasteOpen(false)}
        />
      )}
    </div>
  )
}

export default BulletinDeskEditor
