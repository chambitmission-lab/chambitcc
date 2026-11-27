// 교육과 훈련 관리 — 관리 데스크(2026-11-27, 교회소식·소그룹·공동 기도제목 데스크와 같은 문법)
//
// 예전 화면은 카테고리 카드를 펼쳐야 프로그램이 보이고, 그 안에 ↑↓·눈·휴지통 아이콘이 줄지어
// 있어 "어디가 비었는지·성도에게 어떻게 보이는지"를 알 수 없었다. 관리자가 하는 일은
// (1) 비어 있는 시간·담당·장소를 채우고 (2) 공개·순서를 고르는 것 — 그래서
//   PC(lg+)  왼쪽 트리(요약 숫자·채울 곳 띠·검색·세그먼트, 카테고리 아래 프로그램이 늘 펼쳐짐) /
//            오른쪽 상세(카테고리: 소개·말씀·프로그램 순서 / 프로그램: 정보표·시간표 읽힘·소개·안내)
//            — 각자 스크롤, ↑↓ 이동, / 검색
//   모바일   트리 → 상세 한 화면(뒤로가기로 닫힘)
// 작성·수정은 기존 EducationComposer(2단 모달). 데이터·액션은 EducationManagement 가 쥔다.
import { useRef, useState, type ReactNode } from 'react'
import type { EducationCategory, EducationProgram } from '../../../types/education'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { EduGlyph } from '../../Education/EduIcons'
import { DAY_SHORT_KO, formatTime, programSessions } from '../../Education/eduSchedule'
import { flattenSel, isPendingProgram, missingFields, type EduSeg, type EduSel } from './educationDeskUtils'
import { I, TextBtn, Switch } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

const rowId = (s: EduSel) => `edu-row-${s.kind}-${s.id}`

// ── 아이콘 ───────────────────────────────────────────────

const IC = {
  ...DESK_IC,
  up: <path d="M18 15l-6-6-6 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
}

// ── 작은 조각 ────────────────────────────────────────────

const Badge = ({ tone, children }: { tone: 'hidden' | 'pending'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center shrink-0 h-[20px] px-1.5 rounded-md text-[11.5px] font-bold ${
      tone === 'pending'
        ? 'bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200'
        : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
    }`}
  >
    {children}
  </span>
)

const OrderPair = ({ onMove, first, last }: { onMove: (d: 'up' | 'down') => void; first: boolean; last: boolean }) => (
  <span className="inline-flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shrink-0">
    <button type="button" onClick={() => onMove('up')} disabled={first} className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.07] disabled:opacity-30" aria-label="위로">
      <I d={IC.up} size={15} />
    </button>
    <button type="button" onClick={() => onMove('down')} disabled={last} className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.07] border-l border-gray-200 dark:border-white/10 disabled:opacity-30" aria-label="아래로">
      <I d={IC.down} size={15} />
    </button>
  </span>
)

const Tile = ({ emoji, size, muted }: { emoji?: string | null; size: 'sm' | 'lg'; muted?: boolean }) => (
  <span
    className={`shrink-0 flex items-center justify-center ${size === 'lg' ? 'w-16 h-16 rounded-[20px]' : 'w-10 h-10 rounded-[13px]'} ${
      muted ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/40' : 'bg-[var(--brand-soft)] text-brand'
    }`}
  >
    <EduGlyph emoji={emoji || '📘'} size={size === 'lg' ? 30 : 20} />
  </span>
)

const programMeta = (p: EducationProgram) => [p.meeting_time_ko, p.leader_ko, p.location_ko].filter(Boolean).join(' · ')

// ── 채울 곳 띠 ───────────────────────────────────────────

const PendingStrip = ({ count, active, onClick }: { count: number; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${
      active
        ? 'bg-amber-50 dark:bg-amber-400/10 ring-1 ring-amber-300 dark:ring-amber-300/30'
        : 'border border-dashed border-amber-300 dark:border-amber-300/30 bg-amber-50/60 dark:bg-amber-400/[0.06] hover:bg-amber-50 dark:hover:bg-amber-400/10'
    }`}
  >
    <span className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-amber-400 text-white">
      <I d={IC.pencil} size={19} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[14.5px] font-bold text-ink-strong">채울 곳 {count}개</span>
      <span className="block text-[13px] text-gray-600 dark:text-white/60 truncate">
        {active ? '채울 곳만 보는 중 — 다시 누르면 전체' : "시간·담당·장소가 비어 '곧 채워집니다'로 보여요"}
      </span>
    </span>
    <span className="shrink-0 text-amber-600 dark:text-amber-300">
      <I d={active ? IC.close : IC.chevron} size={18} />
    </span>
  </button>
)

// ── 트리 행 ──────────────────────────────────────────────

const CategoryRow = ({ category, total, active, onClick }: { category: EducationCategory; total: number; active: boolean; onClick: () => void }) => (
  <button
    id={rowId({ kind: 'category', id: category.id })}
    type="button"
    onClick={onClick}
    aria-current={active}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition ${
      active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
    } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
  >
    <Tile emoji={category.emoji} size="sm" muted={!category.is_active} />
    <span className="flex-1 min-w-0">
      <span className="flex items-center gap-1.5">
        <span className={`truncate text-[16px] font-extrabold tracking-[-0.015em] ${category.is_active ? 'text-ink-strong' : 'text-gray-500 dark:text-white/50'}`}>
          {category.name_ko}
        </span>
        {!category.is_active && <Badge tone="hidden">숨김</Badge>}
      </span>
      <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
        프로그램 {total}개{category.tagline_ko ? ` · ${category.tagline_ko}` : ''}
      </span>
    </span>
  </button>
)

const ProgramRow = ({ program, active, onClick }: { program: EducationProgram; active: boolean; onClick: () => void }) => {
  const pending = isPendingProgram(program)
  const meta = programMeta(program)
  return (
    <button
      id={rowId({ kind: 'program', id: program.id })}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-2 pl-[30px] pr-3 py-2 rounded-xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04] ${program.is_active ? '' : 'opacity-55'}`}
    >
      <span className="self-stretch w-px bg-gray-200 dark:bg-white/10 mr-2.5 shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[14.5px] font-bold text-ink-strong">{program.name_ko}</span>
          {program.target_ko && <span className="shrink-0 text-[12.5px] text-gray-500 dark:text-white/50">{program.target_ko}</span>}
          {!program.is_active && <Badge tone="hidden">숨김</Badge>}
        </span>
        {pending ? (
          <span className="mt-0.5 flex items-center gap-1 text-[12.5px] font-semibold text-amber-700 dark:text-amber-300">
            <I d={IC.pencil} size={12} />
            시간·담당·장소 비어 있음
          </span>
        ) : (
          <span className="block mt-0.5 truncate text-[12.5px] text-gray-500 dark:text-white/55">{meta}</span>
        )}
      </span>
    </button>
  )
}

const RowSkeleton = () => (
  <div className="space-y-1.5 px-1">
    {[60, 44, 44, 60, 44].map((h, i) => (
      <div key={i} className="rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" style={{ height: h }} />
    ))}
  </div>
)

// ── 상세 공통 ────────────────────────────────────────────

export interface EduDeskActions {
  onEditCategory: (c: EducationCategory) => void
  onEditProgram: (p: EducationProgram) => void
  onAddProgram: (c: EducationCategory) => void
  onToggleCategory: (c: EducationCategory) => void
  onToggleProgram: (p: EducationProgram) => void
  onMoveCategory: (c: EducationCategory, d: 'up' | 'down') => void
  onMoveProgram: (p: EducationProgram, d: 'up' | 'down') => void
  onDeleteCategory: (c: EducationCategory) => void
  onDeleteProgram: (p: EducationProgram) => void
  onViewPublic: (c?: EducationCategory) => void
}

interface DetailCtx {
  /** 전체 트리 — 필터와 무관하게 순서(↑↓ 가능 여부)·부모를 찾는다 */
  categories: EducationCategory[]
  onSelect: (s: EduSel) => void
  onClose?: () => void
}

const TopBar = ({
  onClose,
  on,
  onToggle,
  order,
  children,
  onEdit,
}: {
  onClose?: () => void
  on: boolean
  onToggle: () => void
  order: ReactNode
  children: ReactNode
  onEdit: () => void
}) => (
  <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
    {onClose && (
      <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
        <I d={IC.back} size={20} />
      </button>
    )}
    <div className="flex items-center gap-2.5 mr-1">
      <Switch on={on} onClick={onToggle} label="성도에게 공개" />
      <span className={`text-[14px] font-bold whitespace-nowrap ${on ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>{on ? '공개 중' : '숨김'}</span>
    </div>
    {order}
    <div className="flex-1" />
    {children}
    <button
      type="button"
      onClick={onEdit}
      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
    >
      <I d={IC.edit} size={15} />
      수정
    </button>
  </div>
)

const SectionTitle = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-2.5 flex items-center justify-between gap-2">
    <h3 className="text-[13px] font-bold text-gray-500 dark:text-white/55">{children}</h3>
    {action}
  </div>
)

// ── 카테고리 상세 ────────────────────────────────────────

const CategoryDetail = ({ category, categories, onSelect, onClose, ...a }: EduDeskActions & DetailCtx & { category: EducationCategory }) => {
  const idx = categories.findIndex((c) => c.id === category.id)
  const visible = category.programs.filter((p) => p.is_active).length
  const pending = category.programs.filter(isPendingProgram).length
  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar
        onClose={onClose}
        on={category.is_active}
        onToggle={() => a.onToggleCategory(category)}
        order={<OrderPair onMove={(d) => a.onMoveCategory(category, d)} first={idx <= 0} last={idx === categories.length - 1} />}
        onEdit={() => a.onEditCategory(category)}
      >
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onViewPublic(category)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDeleteCategory(category)} />
        </span>
      </TopBar>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[720px] space-y-5">
          <header className="flex items-start gap-4">
            <Tile emoji={category.emoji} size="lg" muted={!category.is_active} />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{category.name_ko}</h2>
                <code className="text-[12px] font-semibold text-gray-400 dark:text-white/35">{category.key}</code>
              </div>
              {category.tagline_ko ? (
                <p className="mt-1 text-[15px] font-semibold text-gray-700 dark:text-white/75 break-keep">{category.tagline_ko}</p>
              ) : (
                <p className="mt-1 text-[14px] text-gray-400 dark:text-white/40">한 줄 소개가 없어요</p>
              )}
            </div>
          </header>

          <dl className="grid grid-cols-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] divide-x divide-gray-200/70 dark:divide-white/[0.06]">
            {(
              [
                ['프로그램', category.programs.length, '개'],
                ['공개', visible, '개'],
                ['채울 곳', pending, '개'],
              ] as const
            ).map(([k, v, u]) => (
              <div key={k} className="px-3 lg:px-4 py-3 min-w-0">
                <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
                <dd className={`mt-0.5 whitespace-nowrap ${k === '채울 곳' && v > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-ink-strong'}`}>
                  <span className="text-[22px] lg:text-[24px] font-extrabold tabular-nums tracking-tight">{v}</span>
                  <span className="ml-1 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
                </dd>
              </div>
            ))}
          </dl>

          {!category.is_active && (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 text-[14px] font-medium px-4 py-2.5 break-keep">
              숨김 상태라 아래 프로그램까지 성도 화면에 안 보여요.
            </p>
          )}

          {(category.description_ko || category.verse_text_ko) && (
            <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] px-5 py-4 space-y-3">
              {category.description_ko && (
                <p className="text-[14.5px] leading-[1.75] text-gray-700 dark:text-white/75 whitespace-pre-wrap break-keep">{category.description_ko}</p>
              )}
              {category.verse_text_ko && (
                <blockquote className="border-l-[3px] border-[var(--brand-glow)] pl-3.5">
                  <p className="text-[14.5px] leading-[1.7] font-medium text-ink-strong break-keep">{category.verse_text_ko}</p>
                  {category.verse_ref_ko && <p className="mt-1 text-[13px] font-bold text-brand">{category.verse_ref_ko}</p>}
                </blockquote>
              )}
            </section>
          )}

          <section>
            <SectionTitle
              action={
                <button type="button" onClick={() => a.onAddProgram(category)} className="inline-flex items-center gap-1 text-[13.5px] font-bold text-brand hover:opacity-80">
                  <I d={IC.plus} size={15} />
                  프로그램 추가
                </button>
              }
            >
              프로그램 · 성도 화면 순서
            </SectionTitle>
            {category.programs.length === 0 ? (
              <button
                type="button"
                onClick={() => a.onAddProgram(category)}
                className="w-full rounded-2xl border border-dashed border-gray-300 dark:border-white/15 px-5 py-8 text-center hover:border-brand transition-colors"
              >
                <p className="text-[14px] font-bold text-ink-strong">아직 프로그램이 없어요</p>
                <p className="mt-1 text-[13px] text-gray-500 dark:text-white/55">눌러서 첫 프로그램(예: 영유아부)을 추가해요</p>
              </button>
            ) : (
              <ol className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06] overflow-hidden">
                {category.programs.map((p, i) => (
                  <li key={p.id} className={`flex items-center gap-2 pl-4 pr-2.5 py-2.5 ${p.is_active ? '' : 'opacity-55'}`}>
                    <span className="shrink-0 w-5 text-[13px] font-bold text-gray-400 dark:text-white/40 tabular-nums">{i + 1}</span>
                    <button type="button" onClick={() => onSelect({ kind: 'program', id: p.id })} className="flex-1 min-w-0 text-left">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[14.5px] font-bold text-ink-strong">{p.name_ko}</span>
                        {!p.is_active && <Badge tone="hidden">숨김</Badge>}
                        {isPendingProgram(p) && <Badge tone="pending">채울 곳</Badge>}
                      </span>
                      <span className="block truncate text-[12.5px] text-gray-500 dark:text-white/55">{programMeta(p) || '시간·담당·장소 비어 있음'}</span>
                    </button>
                    <OrderPair onMove={(d) => a.onMoveProgram(p, d)} first={i === 0} last={i === category.programs.length - 1} />
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

// ── 프로그램 상세 ────────────────────────────────────────

const ProgramDetail = ({ program, categories, onSelect, onClose, ...a }: EduDeskActions & DetailCtx & { program: EducationProgram }) => {
  const parent = categories.find((c) => c.id === program.category_id)
  const siblings = parent?.programs ?? []
  const idx = siblings.findIndex((p) => p.id === program.id)
  const missing = missingFields(program)
  const pending = isPendingProgram(program)
  const sessions = programSessions(program)

  const rows: [string, string | null | undefined][] = [
    ['모이는 때', program.meeting_time_ko],
    ['담당', program.leader_ko],
    ['장소', program.location_ko],
    ['대상', program.target_ko],
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar
        onClose={onClose}
        on={program.is_active}
        onToggle={() => a.onToggleProgram(program)}
        order={<OrderPair onMove={(d) => a.onMoveProgram(program, d)} first={idx <= 0} last={idx === siblings.length - 1} />}
        onEdit={() => a.onEditProgram(program)}
      >
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onViewPublic(parent)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDeleteProgram(program)} />
        </span>
      </TopBar>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-5 pb-10 max-w-[720px] space-y-5">
          {parent && (
            <button
              type="button"
              onClick={() => onSelect({ kind: 'category', id: parent.id })}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-gray-500 dark:text-white/55 hover:text-brand transition-colors"
            >
              <EduGlyph emoji={parent.emoji || '📘'} size={15} />
              {parent.name_ko}
              <I d={IC.chevron} size={14} />
              <span className="text-gray-400 dark:text-white/40">{idx + 1}번째</span>
            </button>
          )}

          <header>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{program.name_ko}</h2>
              {pending && <Badge tone="pending">채울 곳</Badge>}
            </div>
            {program.name_en && <p className="mt-0.5 text-[13.5px] text-gray-400 dark:text-white/40">{program.name_en}</p>}
          </header>

          {(!program.is_active || pending || (parent && !parent.is_active)) && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                {!program.is_active
                  ? '숨김 상태라 성도 화면에 안 보여요.'
                  : parent && !parent.is_active
                    ? `'${parent.name_ko}'가 숨김이라 이 프로그램도 안 보여요.`
                    : "시간·담당·장소가 모두 비어 성도 화면에 '곧 채워집니다'로 보여요. 레거시 홈페이지 이미지를 참고해 채워 주세요."}
              </p>
              {pending && program.is_active && (
                <button
                  type="button"
                  onClick={() => a.onEditProgram(program)}
                  className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
                >
                  채우기
                </button>
              )}
            </div>
          )}

          <section>
            <SectionTitle>
              {missing.length > 0 && !pending ? `기본 정보 · ${missing.join('·')} 비어 있음` : '기본 정보'}
            </SectionTitle>
            <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-start gap-4 px-4 py-3">
                  <dt className="shrink-0 w-[72px] text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
                  <dd className="flex-1 min-w-0 text-[14.5px] font-semibold break-keep">
                    {v?.trim() ? (
                      <span className="text-ink-strong whitespace-pre-wrap">{v}</span>
                    ) : (
                      <button type="button" onClick={() => a.onEditProgram(program)} className="text-amber-700 dark:text-amber-300 hover:underline underline-offset-2">
                        비어 있음 — 채우기
                      </button>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 성도 화면의 '이번 주 시간표'·'다음 모임' 칩은 문장에서 요일·시각을 읽어 만든다 —
              읽히는지 여기서 바로 보여 줘야 관리자가 표기를 고칠 수 있다 */}
          <section>
            <SectionTitle>이번 주 시간표에 이렇게 올라가요</SectionTitle>
            {sessions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sessions.map((s) => (
                  <span key={s.key} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[var(--brand-soft)] text-brand text-[13.5px] font-bold">
                    <I d={IC.clock} size={14} />
                    {DAY_SHORT_KO[s.day]} {formatTime(s.h, s.mi, true)}
                    {s.ban && <span className="font-semibold opacity-75">· {s.ban}</span>}
                  </span>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[13.5px] text-gray-600 dark:text-white/60 break-keep">
                요일·시각을 읽지 못해 시간표엔 안 올라가요.
                {program.meeting_time_ko ? ' "주일 오전 11:20", "목요일 19:00-20:00"처럼 쓰면 읽혀요.' : ''}
              </p>
            )}
          </section>

          {program.description_ko && (
            <section>
              <SectionTitle>소개</SectionTitle>
              <p className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] px-5 py-4 text-[14.5px] leading-[1.75] text-gray-700 dark:text-white/75 whitespace-pre-wrap break-keep">
                {program.description_ko}
              </p>
            </section>
          )}

          {program.notice_ko && (
            <section>
              <SectionTitle>안내</SectionTitle>
              <p className="rounded-2xl bg-[var(--brand-soft)] px-5 py-3.5 text-[14px] leading-[1.7] text-ink-strong whitespace-pre-wrap break-keep">{program.notice_ko}</p>
            </section>
          )}

          {(program.link_url || program.image_url) && (
            <section className="space-y-2.5">
              <SectionTitle>링크 · 사진</SectionTitle>
              {program.link_url && (
                <a
                  href={program.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] hover:border-[var(--brand-glow)] transition-colors"
                >
                  <I d={IC.link} size={16} className="shrink-0 text-brand" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-bold text-ink-strong">{program.link_label_ko || '바로 가기'}</span>
                    <span className="block truncate text-[12.5px] text-gray-500 dark:text-white/50">{program.link_url}</span>
                  </span>
                </a>
              )}
              {program.image_url && (
                <img src={program.image_url} alt="" loading="lazy" className="w-full max-w-[420px] rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-gray-100 dark:bg-white/[0.04]" />
              )}
            </section>
          )}

          <div className="sm:hidden grid grid-cols-2 gap-2">
            <button type="button" onClick={() => a.onViewPublic(parent)} className="h-11 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] font-semibold text-gray-700 dark:text-white/80">
              성도 화면
            </button>
            <button type="button" onClick={() => a.onDeleteProgram(program)} className="h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Detail = ({ sel, ...rest }: EduDeskActions & DetailCtx & { sel: EduSel }) => {
  if (sel.kind === 'category') {
    const c = rest.categories.find((x) => x.id === sel.id)
    return c ? <CategoryDetail category={c} {...rest} /> : null
  }
  const p = rest.categories.flatMap((c) => c.programs).find((x) => x.id === sel.id)
  return p ? <ProgramDetail program={p} {...rest} /> : null
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ onClose, ...rest }: EduDeskActions & DetailCtx & { sel: EduSel; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail {...rest} onClose={onClose} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

const SEGS: [EduSeg, string][] = [
  ['all', '전체'],
  ['pending', '채울 곳'],
  ['hidden', '숨김'],
]

export interface EducationDeskProps extends EduDeskActions {
  categories: EducationCategory[]
  filtered: EducationCategory[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  seg: EduSeg
  onSegChange: (v: EduSeg) => void
  selected: EduSel | null
  onSelect: (s: EduSel) => void
  onCreateCategory: () => void
  onBack: () => void
  onClearFilters: () => void
}

const sameSel = (a: EduSel | null, b: EduSel | null) => !!a && !!b && a.kind === b.kind && a.id === b.id

const EducationDesk = ({
  categories,
  filtered,
  loading,
  searchTerm,
  onSearchChange,
  seg,
  onSegChange,
  selected,
  onSelect,
  onCreateCategory,
  onBack,
  onClearFilters,
  ...actions
}: EducationDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 고른 항목이 필터에서 빠지면(지웠거나 걸러졌으면) 맨 위 항목을 보여 준다
  const order = flattenSel(filtered)
  const active = order.find((s) => sameSel(s, selected)) ?? order[0] ?? null
  // 모바일 시트는 고른 항목으로만 — 지운 항목이면 저절로 닫힌다
  const sheetSel =
    sheetOpen && selected && flattenSel(categories).some((s) => sameSel(s, selected)) ? selected : null

  const allPrograms = categories.flatMap((c) => c.programs)
  const pendingCount = allPrograms.filter(isPendingProgram).length
  const hiddenCount = categories.filter((c) => !c.is_active).length + allPrograms.filter((p) => !p.is_active).length
  const counts: Record<EduSeg, number> = { all: allPrograms.length, pending: pendingCount, hidden: hiddenCount }
  const totalOf = (id: number) => categories.find((c) => c.id === id)?.programs.length ?? 0

  // '/' 검색, ↑↓ 이동 — PC 전용(확인창·모달이 떠 있거나 입력 중이면 무시)
  useDeskHotkeys({
    searchRef,
    canMove: order.length > 0,
    onMove: (dir) => {
      const i = order.findIndex((s) => sameSel(s, active))
      const next = order[stepIndex(order.length, i, dir)]
      onSelect(next)
      document.getElementById(rowId(next))?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (s: EduSel) => {
    onSelect(s)
    if (!isDesktop()) setSheetOpen(true)
  }

  const filtering = !!searchTerm || seg !== 'all'
  const ctx = { categories, onSelect: select }

  return (
    <div className={DESK_PAGE_CLS}>
      <div className={DESK_FRAME_CLS}>
        {/* ── 왼쪽: 트리 ─────────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">교육과 훈련</h1>
                <button type="button" onClick={() => actions.onViewPublic()} className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-gray-500 dark:text-white/55 hover:text-brand transition-colors">
                  <I d={IC.ext} size={13} />
                  성도 화면에서 보기
                </button>
              </div>
              <button
                type="button"
                onClick={onCreateCategory}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                카테고리
              </button>
            </div>

            <dl className="grid grid-cols-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] divide-x divide-gray-200/70 dark:divide-white/[0.06]">
              {(
                [
                  ['카테고리', categories.length, '개'],
                  ['프로그램', allPrograms.length, '개'],
                  ['숨김', hiddenCount, '개'],
                ] as const
              ).map(([k, v, u]) => (
                <div key={k} className="px-3 py-2.5 min-w-0">
                  <dt className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                  <dd className="mt-0.5 text-ink-strong whitespace-nowrap">
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

            {!loading && pendingCount > 0 && (
              <PendingStrip count={pendingCount} active={seg === 'pending'} onClick={() => onSegChange(seg === 'pending' ? 'all' : 'pending')} />
            )}

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="부서·담당·장소·대상"
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[var(--brand-glow)] focus:bg-white dark:focus:bg-white/[0.08] transition"
              />
              {searchTerm ? (
                <button type="button" onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white/80" aria-label="검색어 지우기">
                  <I d={IC.close} size={14} />
                </button>
              ) : (
                <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 dark:text-white/35 border border-gray-300 dark:border-white/15 rounded px-1.5 leading-[18px]">/</kbd>
              )}
            </label>

            <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-white/[0.06]">
              {SEGS.map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onSegChange(k)}
                  className={`flex-1 whitespace-nowrap px-2 h-8 rounded-lg text-[13px] font-semibold transition ${
                    seg === k ? 'bg-white dark:bg-white/[0.14] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-ink-strong'
                  }`}
                >
                  {l} <span className={seg === k ? (k === 'pending' ? 'text-amber-600 dark:text-amber-300' : 'text-brand') : ''}>{counts[k]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <RowSkeleton />
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] font-bold text-ink-strong">
                  {filtering ? (seg === 'pending' && !searchTerm ? '채울 곳이 없어요 — 모두 채웠어요' : '조건에 맞는 항목이 없어요') : '아직 카테고리가 없어요'}
                </p>
                {filtering ? (
                  <button type="button" onClick={onClearFilters} className="mt-2 text-[14px] font-semibold text-brand">
                    검색·필터 지우기
                  </button>
                ) : (
                  <p className="mt-1 text-[13.5px] text-gray-500 dark:text-white/55">위 '카테고리'로 주일학교·청년부 같은 묶음부터 만들어요</p>
                )}
              </div>
            ) : (
              filtered.map((c) => (
                <div key={c.id} className="pb-1.5">
                  <CategoryRow category={c} total={totalOf(c.id)} active={sameSel(active, { kind: 'category', id: c.id })} onClick={() => select({ kind: 'category', id: c.id })} />
                  {c.programs.map((p) => (
                    <ProgramRow key={p.id} program={p} active={sameSel(active, { kind: 'program', id: p.id })} onClick={() => select({ kind: 'program', id: p.id })} />
                  ))}
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {active ? (
            <Detail key={`${active.kind}-${active.id}`} sel={active} {...ctx} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 항목을 골라 주세요'}</div>
          )}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 카테고리↔프로그램을 오가도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetSel && (
        <MobileDetailSheet sel={sheetSel} {...ctx} {...actions} onClose={() => setSheetOpen(false)} />
      )}
    </div>
  )
}

export default EducationDesk
