// 섬기는 사람들 관리 — 명단 데스크(2026-11-27 개편)
//
// 예전 화면은 큰 카드 행 + 왼쪽 파란 막대 + 칩 뭉치 + 펼침 안 버튼이라 "촌스럽다"는 평이었다.
// 교회소식 편집 데스크(NewsDesk)·회원 관리와 같은 '목록 + 상세' 2단으로 바꾼다.
//   PC(lg+)  왼쪽 명단(분류별 묶음 · 끌어서 순서) / 오른쪽 상세(공개 스위치·순서·수정
//            + 채운 정보 + 성도 화면 미리보기 = /people 카드·시트 그대로) — 각자 스크롤, ↑↓, /
//   모바일   명단 → 상세 한 화면(뒤로가기로 닫힘)
// 데이터·액션은 PeopleManagement 가 쥔다.
import { useEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { useDragSort } from '../../../hooks/useDragSort'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useReorderPeople } from '../../../hooks/usePeople'
import { showToast } from '../../../utils/toast'
import CountryFlag from '../../../components/common/CountryFlag'
import PersonTile from '../../People/PersonTile'
import { PersonSheetBody } from '../../People/PersonSheet'
import '../../People/people.css'
import {
  CATEGORY_DATE_LABEL,
  CATEGORY_LABEL,
  PERSON_CATEGORIES,
  assignmentList,
  looksLikeLeaderRole,
  personDateLabel,
  personInitial,
} from '../../../types/people'
import type { Person, PersonCategory } from '../../../types/people'
import type { PersonComposerStep } from './PersonComposer'
import { missingKeyLabels, personChecks } from './peopleChecks'

export type CategoryFilter = 'all' | PersonCategory
export type PeopleFlag = 'none' | 'hidden' | 'missing'

const SHORT_LABEL: Record<PersonCategory, string> = {
  pastor: '교역자',
  missionary: '선교사',
  elder: '장로',
  staff: '직원',
}

const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

// ── 아이콘 ───────────────────────────────────────────────

const I = ({ d, size = 16, className = '' }: { d: ReactNode; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d}
  </svg>
)
const IC = {
  search: <><circle cx="11" cy="11" r="7.5" /><path d="M21 21l-4.6-4.6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6l-1.4 14a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 6" /><path d="M9 6V4h6v2" /></>,
  ext: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  back: <path d="M15 18l-6-6 6-6" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  up: <path d="M6 15l6-6 6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  eye: <><path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  crown: <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />,
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
}

// ── 작은 조각 ────────────────────────────────────────────

const Switch = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    className={`relative shrink-0 w-11 h-[26px] rounded-full transition-colors ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/15'}`}
  >
    <span className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : ''}`} />
  </button>
)

const Badge = ({ tone, children }: { tone: 'hidden' | 'leader' | 'warn'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center gap-1 shrink-0 h-[22px] px-2 rounded-md text-[12px] font-bold whitespace-nowrap ${
      tone === 'leader'
        ? 'bg-[var(--brand-soft-strong)] text-brand'
        : tone === 'warn'
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200'
          : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
    }`}
  >
    {children}
  </span>
)

const TextBtn = ({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13.5px] font-semibold whitespace-nowrap transition ${
      danger
        ? 'text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.07]'
    }`}
  >
    <I d={icon} size={16} />
    <span>{label}</span>
  </button>
)

const Avatar = ({ person, size }: { person: Person; size: number }) => (
  <span
    className={`shrink-0 rounded-full overflow-hidden bg-[var(--brand-soft-strong)] ring-1 ring-black/[0.06] dark:ring-white/10 grid place-items-center ${
      person.is_published ? '' : 'opacity-45 grayscale'
    }`}
    style={{ width: size, height: size }}
  >
    {person.photo_url ? (
      // 작은 사본(200px, 5KB 안팎)이 있으면 그걸 쓰고 바로 받는다 — 명단 전체가 300KB 남짓이라
      // 스크롤을 기다릴 이유가 없다. 사본 없는 예전 사진은 원본(1200px, 80KB 안팎)이라 lazy 로 둔다
      <img
        src={person.photo_thumb_url || person.photo_url}
        alt=""
        loading={person.photo_thumb_url ? 'eager' : 'lazy'}
        decoding="async"
        className="w-full h-full object-cover object-[50%_18%]"
      />
    ) : (
      <span className="font-bold text-brand" style={{ fontSize: size * 0.4 }}>
        {personInitial(person.name_ko)}
      </span>
    )}
  </span>
)

// ── 명단 행 ──────────────────────────────────────────────

const DragHandle = (props: ComponentPropsWithoutRef<'span'>) => (
  <span
    {...props}
    role="img"
    title="끌어서 순서 바꾸기"
    aria-label="끌어서 순서 바꾸기"
    className="shrink-0 w-7 self-stretch flex items-center justify-center text-gray-300 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/60 cursor-grab active:cursor-grabbing select-none touch-none transition lg:opacity-0 lg:group-hover:opacity-100"
  >
    <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="3" r="1.5" />
      <circle cx="9" cy="3" r="1.5" />
      <circle cx="3" cy="9" r="1.5" />
      <circle cx="9" cy="9" r="1.5" />
      <circle cx="3" cy="15" r="1.5" />
      <circle cx="9" cy="15" r="1.5" />
    </svg>
  </span>
)

const Row = ({ person, active, handle, onClick }: { person: Person; active: boolean; handle: ReactNode; onClick: () => void }) => {
  const missing = missingKeyLabels(person)
  const assignments = assignmentList(person, 'ko')
  const missionary = person.category === 'missionary'
  const leader = looksLikeLeaderRole(person)
  const sub = missionary
    ? person.field_ko ?? ''
    : [person.group_ko, ...assignments.slice(0, 2)].filter(Boolean).join(' · ') +
      (assignments.length > 2 ? ` 외 ${assignments.length - 2}` : '')

  return (
    <div
      className={`group flex items-stretch rounded-2xl transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
      }`}
    >
      {handle}
      <button
        id={`ppl-row-${person.id}`}
        type="button"
        onClick={onClick}
        aria-current={active}
        className="flex-1 min-w-0 flex items-center gap-3 pr-3 py-2.5 text-left"
      >
        <Avatar person={person} size={46} />
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5 min-w-0">
            <span className={`truncate text-[15.5px] font-bold tracking-[-0.01em] ${person.is_published ? 'text-ink-strong' : 'text-gray-500 dark:text-white/50'}`}>
              {person.name_ko}
              {person.role_ko && (
                <span className={`ml-1 text-[14px] font-semibold ${person.is_published ? 'text-brand' : ''}`}>{person.role_ko}</span>
              )}
            </span>
            {leader && <Badge tone="leader">대표</Badge>}
            {!person.is_published && <Badge tone="hidden">숨김</Badge>}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 min-w-0 text-[13.5px] text-gray-600 dark:text-white/60">
            {missionary && person.country_code && (
              <span className="shrink-0 inline-flex w-[18px] h-[13px] overflow-hidden rounded-[3px] ring-1 ring-black/10">
                <CountryFlag code={person.country_code} />
              </span>
            )}
            <span className="truncate">{sub || (missionary ? '사역지 없음' : person.group_ko || '—')}</span>
          </span>
          {missing.length > 0 && (
            <span className="mt-1 block truncate text-[12.5px] font-semibold text-amber-700 dark:text-amber-300">
              {missing.join(' · ')} 비어 있어요
            </span>
          )}
        </span>
      </button>
    </div>
  )
}

/** 같은 분류끼리만 끌어서 자리를 바꾼다 */
const SortableRun = ({
  people,
  sortable,
  activeId,
  onSelect,
}: {
  people: Person[]
  sortable: boolean
  activeId: number | null
  onSelect: (id: number) => void
}) => {
  const reorder = useReorderPeople()
  const sort = useDragSort(
    people.map((p) => p.id),
    (ordered) =>
      reorder.mutate(ordered, {
        onError: (err) => {
          showToast(err instanceof Error ? err.message : '순서 변경에 실패했습니다', 'error')
          sort.resetOrder()
        },
      }),
  )
  const byId = new Map(people.map((p) => [p.id, p]))
  const canDrag = sortable && people.length > 1

  return (
    <div className="space-y-0.5">
      {sort.orderedIds.map((id) => {
        const person = byId.get(id)
        if (!person) return null
        return (
          <div
            key={id}
            ref={sort.setItemRef(id)}
            style={sort.itemStyle(id)}
            className={sort.draggingId === id ? 'relative z-10 rounded-2xl bg-white dark:bg-card-dark shadow-xl ring-1 ring-[var(--brand-glow)]' : undefined}
          >
            <Row
              person={person}
              active={person.id === activeId}
              onClick={() => onSelect(person.id)}
              handle={canDrag ? <DragHandle {...sort.handleProps(id)} /> : <span className="shrink-0 w-3" />}
            />
          </div>
        )
      })}
    </div>
  )
}

const RowSkeleton = () => (
  <div className="space-y-1.5 px-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-[66px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 상세 ─────────────────────────────────────────────────

interface DetailActions {
  onEdit: (person: Person, step?: PersonComposerStep) => void
  onToggleVisibility: (person: Person) => void
  onMove: (person: Person, direction: 'up' | 'down') => void
  onDelete: (person: Person) => void
  onViewPublic: (person: Person) => void
  onGoPastors: () => void
}

const InfoGroup = ({ title, step, rows, onEdit }: { title: string; step: PersonComposerStep; rows: [string, ReactNode][]; onEdit: (step: PersonComposerStep) => void }) => (
  <section className="rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3.5">
    <div className="flex items-center justify-between">
      <h3 className="text-[13px] font-bold text-gray-500 dark:text-white/55">{title}</h3>
      <button type="button" onClick={() => onEdit(step)} className="text-[13px] font-semibold text-brand hover:underline underline-offset-2">
        수정
      </button>
    </div>
    <dl className="mt-2 space-y-1.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-3 text-[14px]">
          <dt className="shrink-0 w-[68px] text-gray-500 dark:text-white/55">{k}</dt>
          <dd className={`min-w-0 break-all font-medium ${v ? 'text-ink-strong' : 'text-gray-400 dark:text-white/35'}`}>{v || '비어 있음'}</dd>
        </div>
      ))}
    </dl>
  </section>
)

const Detail = ({
  person,
  position,
  onClose,
  ...a
}: DetailActions & { person: Person; position: { index: number; total: number }; onClose?: () => void }) => {
  const checks = personChecks(person)
  const doneCount = checks.filter((c) => c.done).length
  const leader = looksLikeLeaderRole(person)
  const since = personDateLabel(person.started_on)
  const assignments = assignmentList(person, 'ko')
  const missionary = person.category === 'missionary'
  const edit = (step: PersonComposerStep) => a.onEdit(person, step)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 작업줄 */}
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="명단으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <div className="flex items-center gap-2.5 mr-1">
          <Switch on={person.is_published} onClick={() => a.onToggleVisibility(person)} label="성도 화면에 공개" />
          <span className={`text-[14px] font-bold whitespace-nowrap ${person.is_published ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>
            {person.is_published ? '공개 중' : '숨김'}
          </span>
        </div>

        {/* 순서 — 같은 분류 안에서만 */}
        <div className="flex items-center rounded-xl border border-gray-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => a.onMove(person, 'up')}
            disabled={position.index <= 0}
            className="h-9 w-9 grid place-items-center rounded-l-xl text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.07] disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="한 칸 위로"
            title="한 칸 위로"
          >
            <I d={IC.up} size={17} />
          </button>
          <span className="px-1.5 text-[13px] font-semibold tabular-nums text-gray-600 dark:text-white/65 whitespace-nowrap">
            {position.index + 1}
            <span className="text-gray-400 dark:text-white/35"> / {position.total}</span>
          </span>
          <button
            type="button"
            onClick={() => a.onMove(person, 'down')}
            disabled={position.index >= position.total - 1}
            className="h-9 w-9 grid place-items-center rounded-r-xl text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.07] disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="한 칸 아래로"
            title="한 칸 아래로"
          >
            <I d={IC.down} size={17} />
          </button>
        </div>

        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onViewPublic(person)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(person)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(person)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-5 pb-10 space-y-5">
          {/* 머리 — 사진 + 이름 + 소속 */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => edit('basic')}
              className="relative shrink-0 w-[92px] h-[116px] rounded-2xl overflow-hidden bg-[var(--brand-soft-strong)] ring-1 ring-black/[0.06] dark:ring-white/10 grid place-items-center group/photo"
              aria-label="사진 바꾸기"
            >
              {person.photo_url ? (
                <img src={person.photo_url} alt="" className="w-full h-full object-cover object-top" />
              ) : (
                <span className="text-[34px] font-bold text-brand">{personInitial(person.name_ko)}</span>
              )}
              <span className="absolute inset-x-0 bottom-0 py-1 text-center text-[12px] font-bold text-white bg-black/45 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                사진 바꾸기
              </span>
            </button>
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold text-brand">
                {CATEGORY_LABEL[person.category].ko}
                {person.group_ko && <span className="text-gray-500 dark:text-white/55 font-semibold"> · {person.group_ko}</span>}
              </div>
              <h2 className="mt-0.5 text-[26px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">
                {person.name_ko}
                {person.role_ko && <span className="ml-1.5 text-[19px] font-bold text-gray-600 dark:text-white/70">{person.role_ko}</span>}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-gray-600 dark:text-white/60">
                {missionary && person.field_ko && (
                  <span className="inline-flex items-center gap-1.5">
                    {person.country_code ? (
                      <span className="inline-flex w-[18px] h-[13px] overflow-hidden rounded-[3px] ring-1 ring-black/10">
                        <CountryFlag code={person.country_code} />
                      </span>
                    ) : (
                      <I d={IC.pin} size={14} />
                    )}
                    {person.field_ko}
                  </span>
                )}
                {since && (
                  <span>
                    {CATEGORY_DATE_LABEL[person.category].ko} {since}
                  </span>
                )}
                {!missionary && assignments.length > 0 && <span>담당 사역 {assignments.length}곳</span>}
              </div>
            </div>
          </div>

          {leader && (
            <div className="rounded-2xl bg-[var(--brand-soft)] ring-1 ring-[var(--brand-glow)] px-4 py-3.5">
              <p className="text-[14px] leading-[1.65] text-ink-strong break-keep">
                <span className="font-bold">대표 카드로 올라가는 분이에요.</span> 성도 화면 맨 위 담임·원로 자리에 합쳐지고, 교역자 목록엔 또 나오지 않아요. 이름·인사말은{' '}
                <span className="font-bold">인사말 관리</span>에서, 사진·담당 사역·연락처는 여기 기록을 써요.
              </p>
              <button type="button" onClick={a.onGoPastors} className="mt-2 text-[13.5px] font-bold text-brand hover:underline underline-offset-2">
                인사말 관리로 가기 →
              </button>
            </div>
          )}

          {!person.is_published && (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 text-[14px] font-medium px-4 py-2.5 break-keep">
              숨김이라 성도 화면엔 안 보여요. 위 스위치를 켜면 바로 올라가요.
            </p>
          )}

          {/* 채운 정보 */}
          <section>
            <div className="flex items-baseline justify-between">
              <h3 className="text-[15px] font-bold text-ink-strong">채운 정보</h3>
              <span className="text-[13.5px] font-semibold text-gray-500 dark:text-white/55 tabular-nums">
                <span className="text-brand text-[17px] font-extrabold">{doneCount}</span> / {checks.length}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
              <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${(doneCount / checks.length) * 100}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {checks.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => edit(c.step)}
                  className={`inline-flex items-center gap-1 h-8 px-3 rounded-full text-[13px] font-semibold transition ${
                    c.done
                      ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                      : c.key
                        ? 'bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 ring-1 ring-amber-200 dark:ring-amber-300/25 hover:bg-amber-100'
                        : 'border border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-white/55 hover:border-brand hover:text-brand'
                  }`}
                  title={c.done ? `${c.label} 고치기` : `${c.label} 채우기`}
                >
                  {c.done ? <I d={IC.check} size={13} className="text-brand" /> : <I d={IC.plus} size={13} />}
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* 기록 */}
          <div className="grid gap-2.5 xl:grid-cols-2">
            <InfoGroup
              title="연락처"
              step="contact"
              onEdit={edit}
              rows={[
                ['전화', person.phone],
                ['이메일', person.email],
                ...(missionary
                  ? ([
                      ['국가 코드', person.country_code?.toUpperCase()],
                      ['파송기관', person.org_ko],
                    ] as [string, ReactNode][])
                  : []),
              ]}
            />
            <InfoGroup
              title="영문 표기"
              step="basic"
              onEdit={edit}
              rows={[
                ['이름', person.name_en],
                ['직분', person.role_en],
                ['소속', person.group_en],
              ]}
            />
          </div>

          {/* 성도 화면 미리보기 */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
              <I d={IC.eye} size={15} />
              성도에게 이렇게 보여요
            </div>
            {leader ? (
              <p className="text-[14px] text-gray-600 dark:text-white/60 break-keep">
                대표 카드는 인사말 관리의 정보와 합쳐져 보여서 여기선 미리보기를 생략해요.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-3xl bg-gray-100 dark:bg-black/25 p-4 lg:p-5">
                <div className="shrink-0">
                  <p className="mb-2 text-[12.5px] font-semibold text-gray-500 dark:text-white/50">명단 카드</p>
                  <div className="w-[176px]">
                    <PersonTile person={person} index={0} language="ko" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="mb-2 text-[12.5px] font-semibold text-gray-500 dark:text-white/50">누르면 열리는 소개</p>
                  <div className="ppl-sheet is-inline">
                    <PersonSheetBody person={person} />
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="sm:hidden flex gap-2">
            <button type="button" onClick={() => a.onViewPublic(person)} className="flex-1 h-11 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] font-semibold text-gray-700 dark:text-white/80">
              성도 화면에서 보기
            </button>
            <button type="button" onClick={() => a.onDelete(person)} className="h-11 px-5 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 명단 */
const MobileDetailSheet = (props: DetailActions & { person: Person; position: { index: number; total: number }; onClose: () => void }) => {
  useModalBackButton(props.onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail {...props} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface PeopleDeskProps extends DetailActions {
  people: Person[]
  filtered: Person[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  category: CategoryFilter
  onCategoryChange: (v: CategoryFilter) => void
  flag: PeopleFlag
  onFlagChange: (v: PeopleFlag) => void
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onBack: () => void
  onClearFilters: () => void
}

const PeopleDesk = ({
  people,
  filtered,
  loading,
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  flag,
  onFlagChange,
  selectedId,
  onSelect,
  onCreate,
  onBack,
  onClearFilters,
  ...actions
}: PeopleDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 고른 분이 필터에서 빠지면 첫 분을 보여 준다
  const activeId = filtered.some((p) => p.id === selectedId) ? selectedId : (filtered[0]?.id ?? null)
  const selected = activeId != null ? (people.find((p) => p.id === activeId) ?? null) : null
  const sheetPerson = sheetOpen ? (people.find((p) => p.id === selectedId) ?? null) : null

  const counts = useMemo(() => {
    const map = { all: people.length } as Record<CategoryFilter, number>
    PERSON_CATEGORIES.forEach((c) => {
      map[c] = people.filter((p) => p.category === c).length
    })
    return map
  }, [people])
  const scoped = category === 'all' ? people : people.filter((p) => p.category === category)
  const hiddenCount = scoped.filter((p) => !p.is_published).length
  const missingCount = scoped.filter((p) => missingKeyLabels(p).length > 0).length

  // 같은 분류 안에서 몇 번째인지 — 서버가 분류 → 순서로 정렬해 준다
  const positionOf = (person: Person) => {
    const same = people.filter((p) => p.category === person.category)
    return { index: same.findIndex((p) => p.id === person.id), total: same.length }
  }

  // 분류별로 이어진 묶음 — 끌어서 옮기기도 이 묶음 안에서만
  const runs = useMemo(() => {
    const out: Person[][] = []
    filtered.forEach((p) => {
      const last = out[out.length - 1]
      if (last && last[0].category === p.category) last.push(p)
      else out.push([p])
    })
    return out
  }, [filtered])

  // 검색·골라 보기 중엔 일부만 보여서 순서를 바꾸면 헷갈린다 — 그때는 손잡이를 감춘다
  const sortable = !searchTerm.trim() && flag === 'none'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!isDesktop()) return
      if (document.querySelector('[role="alertdialog"], [role="dialog"]')) return
      if (isTypingTarget(document.activeElement)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || filtered.length === 0) return
      e.preventDefault()
      const i = filtered.findIndex((p) => p.id === activeId)
      const next = e.key === 'ArrowDown' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1)
      const id = filtered[next].id
      onSelect(id)
      document.getElementById(`ppl-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, activeId, onSelect])

  const select = (id: number) => {
    onSelect(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  const filtering = !!searchTerm || category !== 'all' || flag !== 'none'
  const SEGS: [CategoryFilter, string][] = [['all', '전체'], ...PERSON_CATEGORIES.map((c) => [c, SHORT_LABEL[c]] as [CategoryFilter, string])]

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:min-h-0 lg:h-[calc(100dvh-56px)] lg:p-4 lg:overflow-hidden">
      <div className="max-w-[1320px] mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:min-h-0 lg:h-full lg:grid lg:grid-cols-[420px_minmax(0,1fr)] lg:rounded-3xl lg:overflow-hidden lg:border lg:border-gray-200/70 dark:lg:border-white/[0.08] lg:shadow-2xl">
        {/* ── 왼쪽: 명단 ─────────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">
                  섬기는 사람들 <span className="text-brand tabular-nums">{loading ? '' : people.length}</span>
                </h1>
                <button
                  type="button"
                  onClick={actions.onGoPastors}
                  className="mt-0.5 inline-flex items-center gap-1.5 text-left text-[13px] text-gray-500 dark:text-white/55 hover:text-brand transition-colors"
                >
                  <I d={IC.crown} size={14} className="shrink-0" />
                  <span>
                    담임·원로목사는 <span className="font-bold underline underline-offset-2">인사말 관리</span>에서
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                인물 등록
              </button>
            </div>

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="이름·직분·담당 사역·사역지 검색"
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
                  onClick={() => onCategoryChange(k)}
                  className={`flex-1 min-w-0 whitespace-nowrap px-1 h-9 rounded-lg text-[13px] font-semibold leading-tight transition ${
                    category === k ? 'bg-white dark:bg-white/[0.14] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-ink-strong'
                  }`}
                >
                  {l} <span className={`tabular-nums ${category === k ? 'text-brand' : ''}`}>{counts[k] ?? 0}</span>
                </button>
              ))}
            </div>

            {(hiddenCount > 0 || missingCount > 0 || flag !== 'none') && (
              <div className="flex gap-1.5">
                {(
                  [
                    ['missing', `비어 있는 정보 ${missingCount}`],
                    ['hidden', `숨김 ${hiddenCount}`],
                  ] as [PeopleFlag, string][]
                ).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onFlagChange(flag === k ? 'none' : k)}
                    aria-pressed={flag === k}
                    className={`shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-full text-[13px] font-semibold transition ${
                      flag === k
                        ? 'bg-ink-strong text-white dark:bg-white dark:text-black'
                        : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65 hover:text-ink-strong'
                    }`}
                  >
                    {l}
                    {flag === k && <I d={IC.close} size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <RowSkeleton />
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] font-bold text-ink-strong">{filtering ? '조건에 맞는 분이 없어요' : '아직 등록된 분이 없어요'}</p>
                {filtering ? (
                  <button type="button" onClick={onClearFilters} className="mt-2 text-[14px] font-semibold text-brand">
                    검색·필터 지우기
                  </button>
                ) : (
                  <p className="mt-1 text-[13.5px] text-gray-500 dark:text-white/55">위 '인물 등록'으로 첫 분을 올려 보세요</p>
                )}
              </div>
            ) : (
              <>
                {runs.map((run) => (
                  <div key={run[0].category} className="mb-3">
                    {category === 'all' && (
                      <div className="sticky top-14 lg:top-0 z-[5] -mx-2 px-4 pt-2 pb-1.5 flex items-baseline gap-1.5 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
                        <span className="text-[14px] font-extrabold text-ink-strong">{CATEGORY_LABEL[run[0].category].ko}</span>
                        <span className="text-[13px] font-semibold text-gray-500 dark:text-white/50 tabular-nums">{run.length}</span>
                      </div>
                    )}
                    <SortableRun people={run} sortable={sortable} activeId={activeId} onSelect={select} />
                  </div>
                ))}
                <p className="px-3 pt-1 text-[12.5px] text-gray-500 dark:text-white/45 break-keep">
                  {sortable
                    ? '이름 왼쪽 점 손잡이를 끌면 성도 화면 순서가 바뀌어요. 같은 분류 안에서만 옮겨져요.'
                    : '검색하거나 골라 보는 중엔 순서를 바꿀 수 없어요.'}
                </p>
              </>
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} person={selected} position={positionOf(selected)} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 한 분을 골라 주세요'}</div>
          )}
        </section>
      </div>

      {/* 지운 분이면 sheetPerson 이 없어 저절로 닫힌다 */}
      {sheetOpen && sheetPerson && (
        <MobileDetailSheet key={sheetPerson.id} person={sheetPerson} position={positionOf(sheetPerson)} onClose={() => setSheetOpen(false)} {...actions} />
      )}
    </div>
  )
}

export default PeopleDesk
