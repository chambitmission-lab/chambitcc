// 디지털 주보 PC 편집기 — 관리자 전용, lg+ 에서만 진입.
//
// 모바일의 필드별 인라인 편집(EditableField, 고칠 때마다 즉시 PUT)은 주보 한 부를 새로 쓰기엔
// 클릭·저장이 너무 잦다. PC 에선 한 화면에 전 섹션을 펼쳐 두고 초안으로 고친 뒤 한 번에 저장한다.
//
// - 좌: 섹션 목차(스크롤 위치 표시) / 중: 표 형태 입력 / 우(xl+): 실제 주보 화면 그대로의 미리보기
// - 표 칸에 엑셀·한글 표를 붙여넣으면 행·열로 펼쳐 넣는다(탭 구분, 여러 줄)
// - 표 칸 Enter = 아래 행 같은 칸(마지막 행이면 행 추가), Ctrl+S = 저장, Esc = 닫기
// - 초안은 localStorage 에 계속 적어 둔다 — 저장 안 하고 닫아도 다음에 열면 이어 쓰기 제안
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { announceSummary } from './bulletinWeekly/bulletinWeek'
import { kstNow } from '../../../utils/date'
import { createPortal } from 'react-dom'
import { showToast } from '../../../utils/toast'
import { useReplaceDigitalBulletin } from '../../../hooks/useDigitalBulletin'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { BulletinData, GroupItem, WeeklyScheduleItem, WorshipServiceItem } from '../../../types/digitalBulletin'
import DigitalBulletin from './DigitalBulletin'
import { extrasOf } from './bulletinExtras'
import { safeStorage } from '../../../utils/safeStorage'
import { AnnouncementsEditor } from './bulletinDesk/AnnouncementsEditor'
import { DeskIcon as Icon } from './bulletinDesk/DeskIcon'
import { ICON } from './bulletinDesk/deskIcons'
import { dayOrder, normalizeDay } from './bulletinDesk/deskParsers'
import { SECTIONS, type SectionId } from './bulletinDesk/deskSections'
import { chipCls, iconBtnCls, inputCls, textareaCls } from './bulletinDesk/deskStyles'
import { ExtrasEditor } from './bulletinDesk/ExtrasEditor'
import { RowTable } from './bulletinDesk/RowTable'
import { DayPicker, Field, Section } from './bulletinDesk/SectionField'

const DRAFT_KEY = 'digital-bulletin-desk-draft'

// ── 유틸 ─────────────────────────────────────────
const readDraft = (): BulletinData | null => {
  const saved = safeStorage.getJson(DRAFT_KEY)
  return saved && typeof saved === 'object' ? (saved as BulletinData) : null
}
/* 저장소 막힘 — 초안 복구만 포기 */
const writeDraft = (data: BulletinData | null) => {
  if (data) safeStorage.setJson(DRAFT_KEY, data)
  else safeStorage.remove(DRAFT_KEY)
}

/** 기존 주보 날짜 표기("2026. 3. 15.")에 맞춘 주일 날짜. offsetWeeks=0 → 다가오는(오늘 포함) 주일 */
const sundayLabel = (offsetWeeks: number) => {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7) + offsetWeeks * 7)
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}

// ── 본체 ─────────────────────────────────────────
interface BulletinDeskEditorProps {
  /** 공개본 — 저장 전 비교 기준 */
  initial: BulletinData
  /** 종이 주보를 AI 가 읽은 초안 — 넘기면 이걸로 시작하고, 저장하면 서버의 초안도 지운다 */
  aiDraft?: BulletinData
  onClose: () => void
}

const BulletinDeskEditor = ({ initial, aiDraft, onClose }: BulletinDeskEditorProps) => {
  const replaceMutation = useReplaceDigitalBulletin()
  const [baseline, setBaseline] = useState<BulletinData>(initial)
  const [draft, setDraft] = useState<BulletinData>(aiDraft ?? initial)
  // AI 초안으로 열었을 땐 localStorage 의 옛 작성분을 권하지 않는다 — 검토 대상이 분명하니까
  const [recoverable, setRecoverable] = useState<BulletinData | null>(() => {
    if (aiDraft) return null
    const saved = readDraft()
    return saved && JSON.stringify(saved) !== JSON.stringify(initial) ? saved : null
  })
  const [fromAiDraft, setFromAiDraft] = useState(aiDraft != null)
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
      // 알림 본문은 늘 보낸다 — 초안 없이 새 주 주보를 써도 서버가 date 로 주보를 찾아 도착 알림을 잡는다
      await replaceMutation.mutateAsync({
        data: draft,
        discardDraft: fromAiDraft,
        announce: announceSummary(draft, kstNow()),
      })
      setBaseline(draft)
      setFromAiDraft(false)
      setRecoverable(null)
      writeDraft(null)
      showToast('주보를 저장했어요', 'success')
    } catch (e) {
      console.error(e)
      showToast('저장에 실패했습니다', 'error')
    }
  }, [dirty, draft, fromAiDraft, replaceMutation])

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
    extras: `${extrasOf(draft).length}개 블록`,
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

        {fromAiDraft && (
          <div className="shrink-0 flex items-center gap-3 px-6 py-2.5 bg-amber-50 dark:bg-amber-400/10 border-b border-amber-200 dark:border-amber-400/20 text-[13.5px] text-amber-900 dark:text-amber-100">
            <span className="font-semibold">종이 주보를 AI 가 읽은 초안이에요.</span>
            <span className="text-amber-800/80 dark:text-amber-100/70">
              설교자·기도 담당 같은 이름과 계좌번호는 사진과 꼭 맞춰 보고 저장하세요. 저장하면 공개되고 초안은 지워져요.
            </span>
          </div>
        )}

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

              <Section id="extras" title="추가 안내" hint="당회 결정사항·봉사표·헌금 계좌처럼 종이 주보 하단에 싣던 요약 — 교회 소식 아래에 보여요">
                <ExtrasEditor blocks={extrasOf(draft)} onChange={blocks => set('extras', blocks)} />
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


export default BulletinDeskEditor
