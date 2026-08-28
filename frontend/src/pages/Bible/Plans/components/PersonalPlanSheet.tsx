// 나만의 플랜 만들기 — slide-up 시트
// 성도가 "책 범위 + 기간"만 고르면 서버가 장을 균등 분배해 플랜을 만들고 바로 시작한다.
// 관리자 Composer(메타 10칸)와 달리 3단계로 최소화: 범위 → 기간 → 이름/이모지.
// AI 묵상 없음(개인 플랜은 캐시 공유 효과가 없어 비용만 커짐), 칭호 집계 제외.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useBibleBooks } from '../../../../hooks/useBible'
import { useCreatePersonalPlan } from '../../../../hooks/useBiblePlan'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import type { PlanDetail } from '../../../../types/biblePlan'
import { showToast } from '../../../../utils/toast'
import { accentGradient } from '../planVisuals'

interface Props {
  onClose: () => void
  onCreated: (plan: PlanDetail) => void
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

// 자주 고르는 범위 — 관리자 Composer 프리셋과 같은 구성 + 시편·잠언(청년들이 가장 많이 고르는 조합)
const PRESETS: { label: string; emoji: string; books: number[]; days: number }[] = [
  { label: '신약', emoji: '✝️', books: range(40, 66), days: 90 },
  { label: '복음서', emoji: '📜', books: [40, 41, 42, 43], days: 30 },
  { label: '시편·잠언', emoji: '🎵', books: [19, 20], days: 60 },
  { label: '모세오경', emoji: '⛰️', books: range(1, 5), days: 60 },
  { label: '구약', emoji: '📖', books: range(1, 39), days: 240 },
  { label: '성경 전체', emoji: '🌍', books: range(1, 66), days: 365 },
]

const DAY_OPTIONS = [7, 14, 30, 60, 90, 100, 365]
const EMOJIS = ['📖', '🔥', '🌱', '✨', '🕊️', '🙏', '💙', '🌅']
const ACCENTS = ['purple', 'pink', 'fuchsia', 'rose'] // planVisuals 의 블루 패밀리 키

const OT_GROUPS: { label: string; books: number[] }[] = [
  { label: '오경', books: range(1, 5) },
  { label: '역사서', books: range(6, 17) },
  { label: '시가서', books: range(18, 22) },
  { label: '대선지서', books: range(23, 27) },
  { label: '소선지서', books: range(28, 39) },
]
const NT_GROUPS: { label: string; books: number[] }[] = [
  { label: '복음서·사도행전', books: range(40, 44) },
  { label: '바울서신', books: range(45, 57) },
  { label: '일반서신·계시록', books: range(58, 66) },
]

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && a.every((n) => b.includes(n))

// 완료 예정일 — 오늘 + (일수 - 1)
const endDateLabel = (days: number) => {
  const dt = new Date()
  dt.setDate(dt.getDate() + Math.max(0, days - 1))
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}

const PersonalPlanSheet = ({ onClose, onCreated }: Props) => {
  const { data: books } = useBibleBooks()
  const create = useCreatePersonalPlan()
  useModalBackButton(onClose)

  const [selected, setSelected] = useState<number[]>(PRESETS[0].books)
  const [customOpen, setCustomOpen] = useState(false)
  const [testament, setTestament] = useState<'OLD' | 'NEW'>('NEW')
  const [days, setDays] = useState<number>(PRESETS[0].days)
  const [customDays, setCustomDays] = useState('')
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('📖')
  const [accent, setAccent] = useState('purple')

  const bookMap = useMemo(
    () => new Map((books ?? []).map((b) => [b.book_number, b])),
    [books],
  )
  const bookName = (n: number) => bookMap.get(n)?.book_name_ko ?? `${n}권`

  const sortedSelected = useMemo(() => [...selected].sort((a, b) => a - b), [selected])
  const totalChapters = useMemo(
    () => sortedSelected.reduce((sum, n) => sum + (bookMap.get(n)?.chapter_count ?? 0), 0),
    [sortedSelected, bookMap],
  )
  const activePreset = PRESETS.findIndex((p) => sameSet(p.books, sortedSelected))
  // 하루 분량이 장 수보다 많을 수 없다 — 서버도 min(days, chapters) 로 자르므로 미리 맞춰 보여준다
  const effectiveDays = totalChapters > 0 ? Math.min(days, totalChapters) : days
  const perDay = effectiveDays > 0 ? totalChapters / effectiveDays : 0

  // 자동 제목 — 서버 _auto_title 과 같은 규칙(사용자가 직접 쓰면 그 값 우선)
  const autoTitle = useMemo(() => {
    if (sortedSelected.length === 0) return ''
    let scope: string
    if (activePreset >= 0) scope = PRESETS[activePreset].label
    else if (sortedSelected.length === 1) scope = bookName(sortedSelected[0])
    else if (sortedSelected.length <= 3) scope = sortedSelected.map(bookName).join('·')
    else
      scope = `${bookName(sortedSelected[0])}~${bookName(sortedSelected[sortedSelected.length - 1])} ${sortedSelected.length}권`
    return `${scope} ${effectiveDays}일`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedSelected, activePreset, effectiveDays, bookMap])

  // 직접 고르기 패널을 열면 현재 선택의 성경 쪽 탭을 먼저 보여준다
  useEffect(() => {
    if (!customOpen) return
    if (sortedSelected.length && sortedSelected[0] >= 40) setTestament('NEW')
    else if (sortedSelected.length) setTestament('OLD')
  }, [customOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleBook = (n: number) =>
    setSelected((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]))
  const toggleGroup = (groupBooks: number[]) =>
    setSelected((prev) => {
      const allIn = groupBooks.every((n) => prev.includes(n))
      return allIn
        ? prev.filter((n) => !groupBooks.includes(n))
        : Array.from(new Set([...prev, ...groupBooks]))
    })

  const canSubmit = sortedSelected.length > 0 && effectiveDays >= 1 && !create.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    try {
      const plan = await create.mutateAsync({
        title: title.trim() || null,
        book_numbers: sortedSelected,
        total_days: effectiveDays,
        emoji,
        accent,
      })
      showToast('나만의 플랜을 만들었어요! 오늘 분량부터 시작해요 📖', 'success')
      onCreated(plan)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '플랜 만들기에 실패했습니다', 'error')
    }
  }

  const groups = testament === 'OLD' ? OT_GROUPS : NT_GROUPS
  const grad = accentGradient(accent)

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft-strong)] rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em]">MY PLAN</p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              나만의 플랜 만들기
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-5 space-y-6">
            {/* 1. 범위 */}
            <Step no={1} label="어디를 읽을까요?">
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p, i) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setSelected(p.books)
                      setDays(p.days)
                      setCustomDays('')
                    }}
                    className={[
                      'flex flex-col items-center gap-1 px-2 py-3 rounded-2xl border text-[12.5px] font-bold transition-all',
                      activePreset === i
                        ? 'bg-brand text-white border-transparent shadow-[0_6px_18px_-6px_var(--brand-glow)]'
                        : 'bg-white dark:bg-white/[0.03] text-gray-700 dark:text-white/75 border-gray-200 dark:border-white/[0.08] hover:border-[var(--brand-soft-strong)]',
                    ].join(' ')}
                  >
                    <span className="text-[20px] leading-none">{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCustomOpen((v) => !v)}
                className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline"
              >
                {customOpen ? '직접 고르기 접기' : '책을 직접 고를래요'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${customOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {customOpen && (
                <div className="mt-2.5 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02] p-3">
                  <div className="flex gap-1.5 mb-3">
                    {(['OLD', 'NEW'] as const).map((t) => (
                      <Pill key={t} active={testament === t} onClick={() => setTestament(t)}>
                        {t === 'OLD' ? '구약' : '신약'}
                      </Pill>
                    ))}
                    <span className="ml-auto self-center text-[11.5px] text-gray-400 dark:text-white/40">
                      {sortedSelected.length}권 선택
                    </span>
                  </div>
                  <div className="space-y-3">
                    {groups.map((g) => {
                      const allIn = g.books.every((n) => selected.includes(n))
                      return (
                        <div key={g.label}>
                          <button
                            type="button"
                            onClick={() => toggleGroup(g.books)}
                            className={`text-[11px] font-bold mb-1.5 ${allIn ? 'text-brand' : 'text-gray-500 dark:text-white/50'}`}
                          >
                            {g.label} {allIn ? '✓' : ''}
                          </button>
                          <div className="flex flex-wrap gap-1.5">
                            {g.books.map((n) => {
                              const on = selected.includes(n)
                              return (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => toggleBook(n)}
                                  className={[
                                    'px-2.5 h-8 rounded-full text-[12px] font-semibold transition-all',
                                    on
                                      ? 'bg-brand text-white'
                                      : 'bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/[0.08]',
                                  ].join(' ')}
                                >
                                  {bookName(n)}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Step>

            {/* 2. 기간 */}
            <Step no={2} label="며칠 동안 읽을까요?">
              <div className="flex gap-1.5 flex-wrap">
                {DAY_OPTIONS.map((d) => (
                  <Pill
                    key={d}
                    active={days === d && customDays === ''}
                    onClick={() => {
                      setDays(d)
                      setCustomDays('')
                    }}
                  >
                    {d}일
                  </Pill>
                ))}
                <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12.5px] text-gray-600 dark:text-white/65 focus-within:border-brand">
                  직접
                  <input
                    type="number"
                    min={1}
                    max={400}
                    inputMode="numeric"
                    value={customDays}
                    onChange={(e) => {
                      setCustomDays(e.target.value)
                      const n = Number(e.target.value)
                      if (n >= 1) setDays(Math.min(400, n))
                    }}
                    placeholder="일"
                    className="w-12 bg-transparent text-ink-strong font-bold text-center focus:outline-none"
                  />
                </label>
              </div>

              {/* 미리보기 — 얼마나 걸리고 하루에 얼마나 읽는지 즉시 보여줘야 기간을 고를 수 있다 */}
              <div className={`mt-3 relative overflow-hidden rounded-2xl p-4 text-white bg-gradient-to-br ${grad}`}>
                <span className="absolute -right-2 -bottom-5 text-[84px] leading-none opacity-[0.16] rotate-12 select-none pointer-events-none">
                  {emoji}
                </span>
                <div className="relative z-10 grid grid-cols-3 gap-2 text-center">
                  <Stat value={`${totalChapters}장`} label="전체 분량" />
                  <Stat
                    value={perDay > 0 ? `${perDay < 10 ? perDay.toFixed(1).replace(/\.0$/, '') : Math.round(perDay)}장` : '—'}
                    label="하루 분량"
                  />
                  <Stat value={endDateLabel(effectiveDays)} label="완료 예정" small />
                </div>
                {totalChapters > 0 && days > totalChapters && (
                  <p className="relative z-10 mt-2.5 text-[11px] text-white/80">
                    장 수보다 기간이 길어 {totalChapters}일로 맞춰져요
                  </p>
                )}
              </div>
            </Step>

            {/* 3. 이름/이모지 */}
            <Step no={3} label="플랜 이름을 정해요">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={autoTitle || '예) 올해 신약 한 번 읽기'}
                maxLength={120}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
              />
              <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/40">
                비워두면 “{autoTitle || '범위 + 일수'}”로 지어드려요
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    aria-label={e}
                    className={`w-9 h-9 rounded-full text-[18px] flex items-center justify-center transition-all ${
                      emoji === e
                        ? 'bg-[var(--brand-soft-strong)] ring-2 ring-brand'
                        : 'bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.07]'
                    }`}
                  >
                    {e}
                  </button>
                ))}
                <span className="mx-1 h-6 w-px bg-gray-200 dark:bg-white/[0.1]" />
                {ACCENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAccent(a)}
                    aria-label={`색상 ${a}`}
                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${accentGradient(a)} transition-all ${
                      accent === a ? 'ring-2 ring-offset-2 ring-brand dark:ring-offset-[#1c1c26]' : 'opacity-80'
                    }`}
                  />
                ))}
              </div>
            </Step>

            {/* 안내 — 관리자 플랜과 다른 점을 시작 전에 알려준다 */}
            <ul className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.07] px-4 py-3 space-y-1.5 text-[11.5px] leading-[1.6] text-gray-500 dark:text-white/55">
              <li>🤝 만든 뒤 초대 링크로 소그룹·가족과 같은 플랜을 함께 읽을 수 있어요</li>
              <li>📝 나만의 플랜은 한 번에 하나만 — 새로 만들려면 기존 플랜을 삭제해요</li>
              <li>✨ AI 묵상은 제공되지 않고, 칭호(업적) 집계에는 포함되지 않아요</li>
            </ul>
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {create.isPending ? '만드는 중…' : '플랜 만들고 시작하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Step = ({ no, label, children }: { no: number; label: string; children: ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-2.5">
      <span className="w-5 h-5 rounded-full bg-brand text-white text-[11px] font-extrabold flex items-center justify-center">
        {no}
      </span>
      <p className="text-[13px] font-bold text-ink-strong tracking-[-0.01em]">{label}</p>
    </div>
    {children}
  </div>
)

const Stat = ({ value, label, small }: { value: string; label: string; small?: boolean }) => (
  <div>
    <p
      className={`font-extrabold leading-none ${small ? 'text-[13px] mt-0.5' : 'text-[17px]'}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {value}
    </p>
    <p className="text-[10.5px] text-white/75 mt-1.5">{label}</p>
  </div>
)

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'inline-flex items-center px-3.5 h-9 rounded-full text-[12.5px] font-bold transition-all',
      active
        ? 'bg-brand text-white shadow-[0_4px_14px_-4px_var(--brand-glow)]'
        : 'bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
    ].join(' ')}
  >
    {children}
  </button>
)

export default PersonalPlanSheet
