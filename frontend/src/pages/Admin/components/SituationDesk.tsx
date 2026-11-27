// 상황별 성구 관리 — 관리 데스크(2026-11-27, 교회소식·말씀·헌금·플랜 데스크와 같은 문법)
//
// 예전 화면은 카테고리 카드 줄 + 우측 레일(추천 방식·씨드) + 구절 모달이라, 어떤 기도에 어떤 구절이
// 가는지·구절이 빈 카테고리가 추천에서 빠진다는 걸 알 수 없었다. 그래서
//   PC(lg+)  왼쪽 목록(맨 위 '기도 추천 규칙' + 카테고리) / 오른쪽 상세
//              - 추천 규칙: 추천 방식(AI 우선·관리자 지정) + 매칭 순서 + "이 기도엔?" 시험기
//              - 카테고리: 활성 스위치·수정 + 숫자 띠 + 연결 감정·키워드 + 구절 편집(모달 없이 그 자리)
//            ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 카테고리 작성·수정은 SituationCategoryComposer. 데이터·액션은 SituationManagement 가 쥔다.
import { useMemo, useRef, useState, type ReactNode } from 'react'
import type { SituationCategory } from '../../../types/situation'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import {
  EMOTION_OPTIONS,
  emotionLabel,
  isRecommendable,
  matchPrayer,
  type RecommendMode,
  type SituationSel,
} from './situationDeskUtils'
import { I, TextBtn, Switch } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

const selKey = (s: SituationSel) => (s.kind === 'rules' ? 'rules' : `cat-${s.id}`)

// ── 아이콘 ───────────────────────────────────────────────

const IC = {
  ...DESK_IC,
  spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></>,
  route: <><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5" /></>,
}

// ── 작은 조각 ────────────────────────────────────────────

const Badge = ({ tone, children }: { tone: 'off' | 'warn' | 'brand'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center shrink-0 h-[20px] px-1.5 rounded-md text-[11.5px] font-bold ${
      tone === 'warn'
        ? 'bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200'
        : tone === 'brand'
          ? 'bg-[var(--brand-soft)] text-brand'
          : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
    }`}
  >
    {children}
  </span>
)

const CatIcon = ({ cat, size = 44 }: { cat: Pick<SituationCategory, 'icon' | 'color'>; size?: number }) => (
  <span className="shrink-0 rounded-full flex items-center justify-center" style={{ width: size, height: size, background: `${cat.color}22` }}>
    <span className="material-icons-round" style={{ color: cat.color, fontSize: Math.round(size * 0.5) }} aria-hidden="true">
      {cat.icon}
    </span>
  </span>
)

const Chip = ({ children, on }: { children: ReactNode; on?: boolean }) => (
  <span
    className={`inline-flex items-center h-8 px-3 rounded-full text-[13.5px] font-semibold ${
      on ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-white/[0.07] text-gray-700 dark:text-white/80'
    }`}
  >
    {children}
  </span>
)

const SectionTitle = ({ children }: { children: ReactNode }) => <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">{children}</h3>

const MODE_TEXT: Record<RecommendMode, { title: string; desc: string }> = {
  ai: { title: 'AI 우선', desc: 'AI가 기도를 읽고 고르고, AI가 못 하면(한도 초과 등) 아래 카테고리 구절로' },
  admin: { title: '관리자 지정', desc: 'AI 없이 늘 아래 카테고리 구절로' },
}

// ── 목록 행 ──────────────────────────────────────────────

const RulesRow = ({ mode, active, onClick }: { mode: RecommendMode | null; active: boolean; onClick: () => void }) => (
  <button
    id="situation-row-rules"
    type="button"
    onClick={onClick}
    aria-current={active}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
      active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
    } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
  >
    <span className="shrink-0 w-11 h-11 rounded-[14px] bg-brand text-white flex items-center justify-center shadow-[0_6px_16px_-6px_var(--brand-glow)]">
      <I d={IC.spark} size={21} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block truncate text-[15.5px] font-bold text-ink-strong">기도 묵상 추천 규칙</span>
      <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
        {mode ? `${MODE_TEXT[mode].title} · 어떤 기도에 어떤 구절이 가는지 시험해 보기` : '추천 방식 · 시험해 보기'}
      </span>
    </span>
  </button>
)

const CatRow = ({ cat, active, onClick }: { cat: SituationCategory; active: boolean; onClick: () => void }) => {
  const emotions = (cat.emotion_keys ?? []).map(emotionLabel)
  return (
    <button
      id={`situation-row-cat-${cat.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className={cat.is_active ? '' : 'opacity-45 grayscale'}>
        <CatIcon cat={cat} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className={`truncate text-[15.5px] font-bold ${cat.is_active ? 'text-ink-strong' : 'text-gray-500 dark:text-white/55'}`}>{cat.name}</span>
          {cat.is_default && <Badge tone="brand">기본</Badge>}
          {!cat.is_active && <Badge tone="off">숨김</Badge>}
          {cat.is_active && cat.verse_count === 0 && <Badge tone="warn">구절 없음</Badge>}
        </span>
        <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
          {emotions.length ? emotions.join('·') : '연결 감정 없음'}
          {(cat.keywords?.length ?? 0) > 0 && ` · 키워드 ${cat.keywords.length}`}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-[17px] font-extrabold tabular-nums leading-none ${cat.verse_count > 0 ? 'text-ink-strong' : 'text-gray-300 dark:text-white/25'}`}>{cat.verse_count}</span>
        <span className="block mt-1 text-[11.5px] font-semibold text-gray-400 dark:text-white/40">구절</span>
      </span>
    </button>
  )
}

// ── 상세: 추천 규칙 ──────────────────────────────────────

export interface SituationDeskActions {
  onEdit: (c: SituationCategory) => void
  onToggleActive: (c: SituationCategory) => void
  onDelete: (c: SituationCategory) => void
  onModeChange: (m: RecommendMode) => void
  onViewPublic: () => void
}

interface DetailCtx {
  categories: SituationCategory[]
  mode: RecommendMode | null
  modePending: boolean
  renderVerses: (c: SituationCategory) => ReactNode
  onSelectCat: (id: number) => void
  onClose?: () => void
}

const BackBtn = ({ onClose }: { onClose?: () => void }) =>
  onClose ? (
    <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
      <I d={IC.back} size={20} />
    </button>
  ) : null

const MATCH_TEXT = {
  emotion: '감정 태그가 맞아서',
  keyword: '기도에 키워드가 들어 있어서',
  default: '맞는 감정·키워드가 없어 기본 카테고리로',
  random: '맞는 것도, 기본 카테고리도 없어 아무 카테고리에서',
} as const

const RulesDetail = ({ categories, mode, modePending, onSelectCat, onClose, ...a }: SituationDeskActions & DetailCtx) => {
  const [emotion, setEmotion] = useState<string | null>(null)
  const [text, setText] = useState('')
  const result = useMemo(() => matchPrayer(categories, emotion, text), [categories, emotion, text])
  const tried = !!emotion || !!text.trim()
  const left = categories.filter((c) => !isRecommendable(c))
  const hasDefault = categories.some((c) => c.is_default && isRecommendable(c))

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        <BackBtn onClose={onClose} />
        <span className="text-[15px] font-bold text-ink-strong">기도 묵상 추천 규칙</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-5 pb-10 max-w-[720px] space-y-6">
          <p className="text-[14.5px] leading-[1.7] text-gray-600 dark:text-white/65 break-keep">
            성도가 기도를 올리면 함께 묵상할 구절 3개가 붙어요. 그 구절을 어디서 고를지 정하고, 어떤 기도에 어떤 카테고리가 가는지 미리 시험해 볼 수 있어요.
          </p>

          <section>
            <SectionTitle>추천 방식</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {(['ai', 'admin'] as const).map((m) => {
                const on = mode === m
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={modePending || mode == null}
                    onClick={() => !on && a.onModeChange(m)}
                    aria-pressed={on}
                    className={`text-left rounded-2xl px-4 py-3.5 border transition disabled:opacity-60 ${
                      on ? 'border-brand bg-[var(--brand-soft)] ring-1 ring-[var(--brand-glow)]' : 'border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${on ? 'border-brand' : 'border-gray-300 dark:border-white/25'}`}>
                        {on && <span className="w-2 h-2 rounded-full bg-brand" />}
                      </span>
                      <span className={`text-[15px] font-bold ${on ? 'text-brand' : 'text-ink-strong'}`}>{MODE_TEXT[m].title}</span>
                    </span>
                    <span className="mt-1 block pl-6 text-[13px] leading-[1.55] text-gray-500 dark:text-white/55 break-keep">{MODE_TEXT[m].desc}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <SectionTitle>카테고리 구절을 고르는 순서</SectionTitle>
            <ol className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
              {[
                ['감정 태그', '기도에 붙인 감정(지칠 때·불안할 때…)이 연결된 카테고리'],
                ['키워드', '기도 제목·내용에 키워드가 가장 많이 들어간 카테고리'],
                ['기본 카테고리', hasDefault ? '"기본"으로 표시한 카테고리' : '"기본"으로 표시한 카테고리 — 지금은 없어요'],
                ['아무 카테고리', '위 셋 다 없을 때 — 구절이 하나도 없는 것보단 낫게'],
              ].map(([k, v], i) => (
                <li key={k} className="flex items-start gap-3 px-4 py-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-extrabold flex items-center justify-center tabular-nums">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-bold text-ink-strong">{k}</span>
                    <span className={`block text-[13.5px] break-keep ${i === 2 && !hasDefault ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500 dark:text-white/55'}`}>{v}</span>
                  </span>
                </li>
              ))}
            </ol>
            {left.length > 0 && (
              <p className="mt-2 px-1 text-[13px] text-gray-500 dark:text-white/55 break-keep">
                숨긴 카테고리와 구절이 없는 카테고리는 빠져요 — 지금 {left.map((c) => c.name).join(', ')}
              </p>
            )}
          </section>

          <section>
            <SectionTitle>이 기도엔 어떤 구절이 갈까? — 시험해 보기</SectionTitle>
            <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.04] p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {EMOTION_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setEmotion(emotion === o.key ? null : o.key)}
                    aria-pressed={emotion === o.key}
                    className={`h-8 px-3 rounded-full text-[13.5px] font-semibold transition ${
                      emotion === o.key ? 'bg-brand text-white' : 'bg-white dark:bg-white/[0.07] text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.1]'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="기도 제목·내용을 써 보세요 — 예) 다음 주 수술이 무서워요"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] text-[15px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:border-brand resize-none"
              />
              {tried &&
                (result ? (
                  <div className="rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] p-3.5">
                    <p className="text-[13px] font-semibold text-gray-500 dark:text-white/55">
                      {MATCH_TEXT[result.by]}
                      {result.cats.length > 1 && ` — 이 중 하나를 무작위로`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.cats.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onSelectCat(c.id)}
                          className="inline-flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full bg-gray-50 dark:bg-white/[0.06] hover:bg-[var(--brand-soft)] transition"
                        >
                          <CatIcon cat={c} size={28} />
                          <span className="text-[14.5px] font-bold text-ink-strong">{c.name}</span>
                          {result.hits[c.id] && <span className="text-[12.5px] font-semibold text-brand">“{result.hits[c.id].join('”·“')}”</span>}
                        </button>
                      ))}
                    </div>
                    {mode === 'ai' && <p className="mt-2 text-[12.5px] text-gray-400 dark:text-white/40 break-keep">AI 우선 모드라 평소엔 AI가 고르고, AI가 못 할 때 이렇게 골라요.</p>}
                  </div>
                ) : (
                  <p className="px-1 text-[13.5px] font-semibold text-amber-700 dark:text-amber-300">추천에 쓸 수 있는 카테고리(공개 + 구절 1개 이상)가 없어요.</p>
                ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ── 상세: 카테고리 ───────────────────────────────────────

const CatDetail = ({ cat, renderVerses, onClose, ...a }: SituationDeskActions & DetailCtx & { cat: SituationCategory }) => {
  const emotions = cat.emotion_keys ?? []
  const keywords = cat.keywords ?? []
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        <BackBtn onClose={onClose} />
        <div className="flex items-center gap-2.5">
          <Switch on={cat.is_active} onClick={() => a.onToggleActive(cat)} label="성도에게 보이기" />
          <span className={`text-[14px] font-bold whitespace-nowrap ${cat.is_active ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>{cat.is_active ? '보이는 중' : '숨김'}</span>
        </div>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={a.onViewPublic} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(cat)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(cat)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[720px] space-y-6">
          <header className="flex items-center gap-3.5">
            <CatIcon cat={cat} size={56} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{cat.name}</h2>
                {cat.is_default && <Badge tone="brand">기본</Badge>}
              </div>
              <p className="mt-0.5 text-[13.5px] text-gray-500 dark:text-white/55">목록 순서 {cat.order}</p>
            </div>
          </header>

          {cat.is_active && cat.verse_count === 0 && (
            <p className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
              구절이 하나도 없어 기도 묵상 추천에서 빠져요. 아래에 구절을 넣어 주세요.
            </p>
          )}
          {!cat.is_active && (
            <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
              숨김 상태라 성도 화면과 기도 묵상 추천에서 빠져 있어요. 위 스위치를 켜면 바로 돌아와요.
            </p>
          )}

          <section>
            <SectionTitle>이런 기도에 이 구절들이 가요</SectionTitle>
            <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
              <div className="px-4 py-3.5">
                <p className="text-[13px] font-semibold text-gray-500 dark:text-white/55">① 감정 태그</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {emotions.length ? emotions.map((k) => <Chip key={k}>{emotionLabel(k)}</Chip>) : <span className="text-[14px] text-gray-400 dark:text-white/35">연결 없음</span>}
                </div>
              </div>
              <div className="px-4 py-3.5">
                <p className="text-[13px] font-semibold text-gray-500 dark:text-white/55">② 기도 제목·내용에 이 단어가 있으면</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {keywords.length ? keywords.map((k) => <Chip key={k}>“{k}”</Chip>) : <span className="text-[14px] text-gray-400 dark:text-white/35">키워드 없음</span>}
                </div>
              </div>
              <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-gray-500 dark:text-white/55">③ 아무것도 안 맞을 때 기본으로</p>
                <span className={`text-[14px] font-bold ${cat.is_default ? 'text-brand' : 'text-gray-400 dark:text-white/35'}`}>{cat.is_default ? '예' : '아니요'}</span>
              </div>
            </div>
          </section>

          {renderVerses(cat)}

          <div className="sm:hidden">
            <button type="button" onClick={() => a.onDelete(cat)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              카테고리 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Detail = ({ sel, ...rest }: SituationDeskActions & DetailCtx & { sel: SituationSel }) => {
  if (sel.kind === 'rules') return <RulesDetail {...rest} />
  const cat = rest.categories.find((c) => c.id === sel.id)
  return cat ? <CatDetail cat={cat} {...rest} /> : null
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ onClose, ...rest }: SituationDeskActions & DetailCtx & { sel: SituationSel; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail {...rest} onClose={onClose} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface SituationDeskProps extends SituationDeskActions {
  categories: SituationCategory[]
  loading: boolean
  mode: RecommendMode | null
  modePending: boolean
  selected: SituationSel | null
  onSelect: (s: SituationSel) => void
  onCreate: () => void
  onSeed: () => void
  seeding: boolean
  onBack: () => void
  renderVerses: (c: SituationCategory) => ReactNode
}

const SituationDesk = ({ categories, loading, mode, modePending, selected, onSelect, onCreate, onSeed, seeding, onBack, renderVerses, ...actions }: SituationDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  const shown = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return categories
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.keywords ?? []).some((k) => k.toLowerCase().includes(q)) ||
        (c.emotion_keys ?? []).some((k) => emotionLabel(k).includes(q)),
    )
  }, [categories, searchTerm])

  const order = useMemo<SituationSel[]>(() => [{ kind: 'rules' }, ...shown.map((c) => ({ kind: 'cat' as const, id: c.id }))], [shown])
  const active = order.find((s) => selected && selKey(s) === selKey(selected)) ?? order[0]
  const sheetSel = sheetOpen && selected && order.some((s) => selKey(s) === selKey(selected)) ? selected : null

  const stats = useMemo(
    () => ({
      shown: categories.filter((c) => c.is_active).length,
      verses: categories.reduce((s, c) => s + c.verse_count, 0),
      empty: categories.filter((c) => c.is_active && c.verse_count === 0).length,
    }),
    [categories],
  )

  // '/' 검색, ↑↓ 이동 — PC 전용(확인창·모달이 떠 있거나 입력 중이면 무시)
  useDeskHotkeys({
    searchRef,
    onMove: (dir) => {
      const i = order.findIndex((s) => selKey(s) === selKey(active))
      const next = order[stepIndex(order.length, i, dir)]
      onSelect(next)
      document.getElementById(`situation-row-${selKey(next)}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (s: SituationSel) => {
    onSelect(s)
    if (!isDesktop()) setSheetOpen(true)
  }

  const ctx: DetailCtx = {
    categories,
    mode,
    modePending,
    renderVerses,
    onSelectCat: (id) => select({ kind: 'cat', id }),
  }

  return (
    <div className={DESK_PAGE_CLS}>
      <div className={DESK_FRAME_CLS}>
        {/* ── 왼쪽: 목록 ─────────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">상황별 성구</h1>
                <button type="button" onClick={actions.onViewPublic} className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-gray-500 dark:text-white/55 hover:text-brand transition-colors">
                  <I d={IC.ext} size={13} />
                  성경 › 상황별 말씀 · 기도 묵상 추천에 쓰여요
                </button>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                상황
              </button>
            </div>

            <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
              {(
                [
                  ['보이는 상황', stats.shown, '개', false],
                  ['구절', stats.verses, '개', false],
                  ['구절 빈 상황', stats.empty, '개', stats.empty > 0],
                ] as const
              ).map(([k, v, u, warn]) => (
                <div key={k} className="px-3 py-2.5 min-w-0 bg-gray-50 dark:bg-card-dark">
                  <dt className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                  <dd className={`mt-0.5 whitespace-nowrap ${warn ? 'text-amber-700 dark:text-amber-300' : 'text-ink-strong'}`}>
                    {loading ? (
                      <span className="inline-block w-8 h-6 rounded bg-gray-200/70 dark:bg-white/[0.08] animate-pulse align-middle" />
                    ) : (
                      <>
                        <span className="text-[21px] font-extrabold tabular-nums tracking-tight">{v}</span>
                        <span className="ml-0.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="상황·감정·키워드 찾기"
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[var(--brand-glow)] focus:bg-white dark:focus:bg-white/[0.08] transition"
              />
              {searchTerm ? (
                <button type="button" onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white/80" aria-label="검색어 지우기">
                  <I d={IC.close} size={14} />
                </button>
              ) : (
                <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 dark:text-white/35 border border-gray-300 dark:border-white/15 rounded px-1.5 leading-[18px]">/</kbd>
              )}
            </label>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <div className="space-y-1 px-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-[68px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <RulesRow mode={mode} active={active?.kind === 'rules'} onClick={() => select({ kind: 'rules' })} />
                <p className="px-3 pt-4 pb-1 text-[12.5px] font-bold text-gray-400 dark:text-white/40">상황 · 목록 순서</p>
                {categories.length === 0 ? (
                  <div className="mx-1 rounded-2xl border border-dashed border-gray-300 dark:border-white/15 px-5 py-8 text-center">
                    <p className="text-[14px] font-bold text-ink-strong">아직 상황이 없어요</p>
                    <p className="mt-1 text-[13px] text-gray-500 dark:text-white/55 break-keep">"두려울 때"처럼 상황을 만들거나, 기본 상황 묶음을 한 번에 넣어요</p>
                    <button
                      type="button"
                      onClick={onSeed}
                      disabled={seeding}
                      className="mt-3 h-10 px-4 rounded-xl bg-[var(--brand-soft)] text-brand text-[14px] font-bold hover:bg-[var(--brand-soft-strong)] disabled:opacity-50 transition"
                    >
                      기본 상황 묶음 넣기
                    </button>
                  </div>
                ) : shown.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-[15px] font-bold text-ink-strong">맞는 상황이 없어요</p>
                    <button type="button" onClick={() => setSearchTerm('')} className="mt-2 text-[14px] font-semibold text-brand">
                      검색어 지우기
                    </button>
                  </div>
                ) : (
                  shown.map((c) => <CatRow key={c.id} cat={c} active={active?.kind === 'cat' && active.id === c.id} onClick={() => select({ kind: 'cat', id: c.id })} />)
                )}
              </>
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {!loading && active && <Detail key={selKey(active)} sel={active} {...ctx} {...actions} />}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetSel && <MobileDetailSheet sel={sheetSel} {...ctx} {...actions} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}

export default SituationDesk
