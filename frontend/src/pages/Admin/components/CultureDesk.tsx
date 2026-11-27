// 문화교실 관리 — 관리 데스크(2026-11-27, 설문·푸시·새가족 데스크와 같은 문법)
//
// 예전 화면은 강좌·신청자·공지 세 탭이 좁은 카드 줄이라, 강좌 하나의 신청자를 보려면 탭을 건너가 select 로
// 다시 걸러야 했고, 모집 마감·숨김도 수정 창을 열어야만 바꿀 수 있었다. 그래서
//   PC(lg+)  왼쪽 = 세 탭(강좌·신청자·공지) 목록 + 검색 / 오른쪽 = 고른 항목 상세
//            · 강좌: 모집 스위치·숨김 해제 + 신청·정원·남은 자리 띠 + 이 강좌 신청자(바로 등록 완료) + /culture 카드 미리보기
//            · 신청: 상태 세그먼트(대기·등록·취소) + 연락처·생년월일·메모
//            · 공지: 공개 스위치 + 본문
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 데이터·저장은 CultureManagement 가 쥐고, 이 컴포넌트는 탭·검색·선택 같은 화면 상태만 갖는다.
import { useMemo, useRef, useState, type ReactNode } from 'react'
import type { CultureApplication, CultureApplicationStatus, CultureClassAdmin, CultureNotice } from '../../../types/culture'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { ClassCard } from '../../Culture/components/ClassCard'
import { STATUS_LABEL } from '../culture/constants'
import {
  APP_FILTERS,
  classPhase,
  filterApplications,
  filterClasses,
  filterNotices,
  formatPhone,
  longDate,
  seatsOf,
  shortDate,
  sortApplications,
  type AppFilter,
  type CultureTab,
} from './cultureDeskUtils'
import { I, TextBtn, Switch } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el as HTMLElement).isContentEditable)
const noop = () => {}

// ── 아이콘 ───────────────────────────────────────────────

const IC = {
  ...DESK_IC,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
  check: <path d="M20 6L9 17l-5-5" />,
}

// ── 작은 조각 ────────────────────────────────────────────

type Tone = 'brand' | 'warn' | 'off' | 'ok'
const TONE: Record<Tone, string> = {
  brand: 'bg-[var(--brand-soft)] text-brand',
  warn: 'bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200',
  ok: 'bg-emerald-100 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-200',
  off: 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65',
}
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`inline-flex items-center shrink-0 h-[20px] px-1.5 rounded-md text-[11.5px] font-bold ${TONE[tone]}`}>{children}</span>
)
const STATUS_TONE: Record<CultureApplicationStatus, Tone> = { pending: 'warn', confirmed: 'ok', cancelled: 'off' }

const PrimaryBtn = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
  >
    {children}
  </button>
)

const TopBar = ({ onClose, children }: { onClose?: () => void; children: ReactNode }) => (
  <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
    {onClose && (
      <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
        <I d={IC.back} size={20} />
      </button>
    )}
    {children}
  </div>
)

const Body = ({ children }: { children: ReactNode }) => (
  <div className="flex-1 min-h-0 overflow-y-auto">
    <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[720px] space-y-5">{children}</div>
  </div>
)

const SectionTitle = ({ children, aside }: { children: ReactNode; aside?: ReactNode }) => (
  <div className="mb-2.5 flex items-center justify-between gap-2">
    <h3 className="text-[13px] font-bold text-gray-500 dark:text-white/55">{children}</h3>
    {aside}
  </div>
)

const InfoList = ({ rows }: { rows: [string, ReactNode][] }) => (
  <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
    {rows.map(([k, v]) => (
      <div key={k} className="flex items-start justify-between gap-4 px-4 py-3">
        <dt className="shrink-0 text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
        <dd className="min-w-0 text-[14.5px] font-semibold text-ink-strong text-right break-words whitespace-pre-wrap">{v}</dd>
      </div>
    ))}
  </dl>
)

const NumberBand = ({ cells }: { cells: { k: string; v: string; u?: string; warn?: boolean }[] }) => (
  <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
    {cells.map(({ k, v, u, warn }) => (
      <div key={k} className="px-3 lg:px-4 py-3 min-w-0 bg-gray-50 dark:bg-card-dark">
        <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
        <dd className={`mt-0.5 whitespace-nowrap ${warn ? 'text-amber-700 dark:text-amber-300' : 'text-ink-strong'}`}>
          <span className="text-[22px] font-extrabold tabular-nums tracking-tight">{v}</span>
          {u && <span className="ml-0.5 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>}
        </dd>
      </div>
    ))}
  </dl>
)

// ── 액션 ─────────────────────────────────────────────────

export interface CultureDeskActions {
  onCreateClass: () => void
  onEditClass: (c: CultureClassAdmin) => void
  onDeleteClass: (c: CultureClassAdmin) => void
  onToggleOpen: (c: CultureClassAdmin) => void
  onToggleActive: (c: CultureClassAdmin) => void
  onSetAppStatus: (a: CultureApplication, status: CultureApplicationStatus) => void
  onCreateNotice: () => void
  onEditNotice: (n: CultureNotice) => void
  onDeleteNotice: (n: CultureNotice) => void
  onToggleNotice: (n: CultureNotice) => void
  onViewPublic: () => void
}

// ── 강좌 상세 ────────────────────────────────────────────

const ClassDetail = ({
  c,
  apps,
  onShowApps,
  onOpenApp,
  onClose,
  a,
}: {
  c: CultureClassAdmin
  apps: CultureApplication[]
  onShowApps: () => void
  onOpenApp: (id: number) => void
  onClose?: () => void
  a: CultureDeskActions
}) => {
  const seats = seatsOf(c)
  const phase = classPhase(c)
  const pending = apps.filter((x) => x.status === 'pending').length
  const recent = sortApplications(apps.filter((x) => x.status !== 'cancelled')).slice(0, 6)
  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar onClose={onClose}>
        <Switch on={c.is_open} onClick={() => a.onToggleOpen(c)} label="수강생 모집" />
        <span className={`text-[14px] font-bold whitespace-nowrap ${c.is_open ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>{c.is_open ? '모집 중' : '모집 마감'}</span>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={a.onViewPublic} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDeleteClass(c)} />
        </span>
        <PrimaryBtn onClick={() => a.onEditClass(c)}>
          <I d={IC.edit} size={15} />
          수정
        </PrimaryBtn>
      </TopBar>
      <Body>
        <header>
          <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">{[c.quarter, c.instructor && `${c.instructor} 강사`].filter(Boolean).join(' · ') || '문화교실 강좌'}</p>
          <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{c.title}</h2>
          {c.description && <p className="mt-1.5 text-[15px] leading-[1.7] text-gray-600 dark:text-white/65 whitespace-pre-wrap break-keep">{c.description}</p>}
        </header>

        <NumberBand
          cells={[
            { k: '신청', v: `${c.application_count}`, u: '명' },
            { k: '정원', v: seats.cap ? `${seats.cap}` : '없음', u: seats.cap ? '명' : '' },
            seats.cap ? { k: '남은 자리', v: `${seats.remaining}`, u: '석', warn: seats.full } : { k: '접수 대기', v: `${pending}`, u: '명', warn: pending > 0 },
          ]}
        />

        {phase === 'hidden' ? (
          <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3.5 flex items-start gap-3">
            <p className="flex-1 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">숨긴 강좌라 /culture 에 안 보이고 신청도 못 받아요.</p>
            <button type="button" onClick={() => a.onToggleActive(c)} className="shrink-0 h-9 px-3 rounded-xl bg-white dark:bg-white/10 text-[13.5px] font-bold text-ink-strong hover:bg-gray-100 dark:hover:bg-white/15 transition">
              다시 보이기
            </button>
          </div>
        ) : seats.full && c.is_open ? (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
            <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">정원이 다 찼어요. 성도 화면에선 이미 신청 버튼이 잠겨요 — 모집도 마감해 두면 목록이 분명해져요.</p>
            <button type="button" onClick={() => a.onToggleOpen(c)} className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition">
              모집 마감
            </button>
          </div>
        ) : null}

        <section>
          <SectionTitle
            aside={
              apps.length > 0 && (
                <button type="button" onClick={onShowApps} className="text-[13px] font-bold text-brand">
                  신청자 {apps.length}명 모두 보기
                </button>
              )
            }
          >
            최근 신청자{pending > 0 && ` · 대기 ${pending}`}
          </SectionTitle>
          {recent.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 px-4 py-6 text-center text-[14px] text-gray-500 dark:text-white/55">아직 신청자가 없어요</p>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
              {recent.map((x) => (
                <div key={x.id} className="flex items-center gap-3 px-4 py-2.5">
                  <button type="button" onClick={() => onOpenApp(x.id)} className="flex-1 min-w-0 text-left">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[14.5px] font-semibold text-ink-strong">{x.name}</span>
                      <Badge tone={STATUS_TONE[x.status]}>{STATUS_LABEL[x.status]}</Badge>
                    </span>
                    <span className="block text-[13px] text-gray-500 dark:text-white/55 tabular-nums">{formatPhone(x.phone)} · {shortDate(x.created_at)} 신청</span>
                  </button>
                  {x.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => a.onSetAppStatus(x, 'confirmed')}
                      className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[13px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition"
                    >
                      <I d={IC.check} size={14} />
                      등록 완료
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle>강좌 정보</SectionTitle>
          <InfoList
            rows={[
              ['일정', c.schedule || '–'],
              ['장소', c.location || '–'],
              ['수강료', c.fee || '–'],
              ['대상', c.detail?.target || '–'],
              ['기간', c.detail?.duration || '–'],
              ['수업 계획', c.detail?.curriculum?.length ? `${c.detail.curriculum.length}주` : '–'],
              ['보이기', phase === 'hidden' ? '숨김' : '성도에게 보임'],
            ]}
          />
          {phase !== 'hidden' && (
            <button type="button" onClick={() => a.onToggleActive(c)} className="mt-2 text-[13px] font-semibold text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80">
              성도 화면에서 숨기기
            </button>
          )}
        </section>

        <section>
          <SectionTitle>성도에게 이렇게 보여요</SectionTitle>
          <div className={`max-w-[400px] ${phase === 'hidden' ? 'opacity-50' : ''}`}>
            <ClassCard cultureClass={c} onApply={noop} onOpen={noop} />
          </div>
        </section>

        <div className="sm:hidden">
          <button type="button" onClick={() => a.onDeleteClass(c)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
            강좌 삭제
          </button>
        </div>
      </Body>
    </div>
  )
}

// ── 신청 상세 ────────────────────────────────────────────

const STATUS_STEPS: [CultureApplicationStatus, string][] = [
  ['pending', '대기'],
  ['confirmed', '등록 완료'],
  ['cancelled', '취소'],
]

const AppDetail = ({ x, onOpenClass, onClose, a }: { x: CultureApplication; onOpenClass: (id: number) => void; onClose?: () => void; a: CultureDeskActions }) => (
  <div className="flex flex-col h-full min-h-0">
    <TopBar onClose={onClose}>
      <div role="radiogroup" aria-label="신청 상태" className="inline-grid grid-cols-3 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.05]">
        {STATUS_STEPS.map(([k, label]) => {
          const on = x.status === k
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => !on && a.onSetAppStatus(x, k)}
              className={`h-8 px-3 rounded-lg text-[13.5px] font-bold whitespace-nowrap transition ${
                on ? (k === 'confirmed' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-white/[0.12] text-ink-strong shadow-sm') : 'text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="flex-1" />
      <a href={`tel:${x.phone.replace(/\D/g, '')}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13.5px] font-semibold text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition">
        <I d={IC.phone} size={15} />
        <span className="hidden sm:inline">전화</span>
      </a>
    </TopBar>
    <Body>
      <header>
        <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">{longDate(x.created_at)} 신청</p>
        <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight">
          {x.name}
          {x.gender && <span className="ml-1.5 text-[16px] font-bold text-gray-500 dark:text-white/55">{x.gender}</span>}
        </h2>
        {x.class_title ? (
          <button type="button" onClick={() => onOpenClass(x.class_id)} className="mt-1 text-[15px] font-semibold text-brand hover:underline">
            {x.class_title} →
          </button>
        ) : (
          <p className="mt-1 text-[15px] text-gray-500 dark:text-white/55">삭제된 강좌</p>
        )}
      </header>

      {x.status === 'pending' && (
        <p className="rounded-xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3 text-[14px] leading-[1.6] text-amber-900 dark:text-amber-100 break-keep">
          접수 대기 중이에요. 연락해 등록을 확인했다면 위에서 <b className="font-bold">등록 완료</b>로 바꿔 주세요.
        </p>
      )}
      {x.status === 'cancelled' && (
        <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
          취소된 신청은 정원 계산에서 빠져요.
        </p>
      )}

      <InfoList
        rows={[
          ['연락처', <a key="p" href={`tel:${x.phone.replace(/\D/g, '')}`} className="tabular-nums hover:text-brand">{formatPhone(x.phone)}</a>],
          ['생년월일', x.birth_date || '–'],
          ['성별', x.gender || '–'],
          ['메모', x.memo || '–'],
        ]}
      />
    </Body>
  </div>
)

// ── 공지 상세 ────────────────────────────────────────────

const NoticeDetail = ({ n, onClose, a }: { n: CultureNotice; onClose?: () => void; a: CultureDeskActions }) => (
  <div className="flex flex-col h-full min-h-0">
    <TopBar onClose={onClose}>
      <Switch on={n.is_active} onClick={() => a.onToggleNotice(n)} label="성도에게 공개" />
      <span className={`text-[14px] font-bold whitespace-nowrap ${n.is_active ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>{n.is_active ? '공개 중' : '비공개'}</span>
      <div className="flex-1" />
      <span className="hidden xl:contents">
        <TextBtn icon={IC.ext} label="성도 화면" onClick={a.onViewPublic} />
      </span>
      <span className="hidden sm:contents">
        <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDeleteNotice(n)} />
      </span>
      <PrimaryBtn onClick={() => a.onEditNotice(n)}>
        <I d={IC.edit} size={15} />
        수정
      </PrimaryBtn>
    </TopBar>
    <Body>
      <header>
        <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">
          {longDate(n.created_at)} 올림{n.updated_at && n.updated_at.slice(0, 10) !== n.created_at.slice(0, 10) && ` · ${longDate(n.updated_at)} 고침`}
        </p>
        <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{n.title}</h2>
      </header>
      {!n.is_active && (
        <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">비공개라 /culture 공지사항에 안 보여요.</p>
      )}
      <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] px-5 py-4 text-[15px] leading-[1.75] text-gray-800 dark:text-white/80 whitespace-pre-wrap break-words">{n.content}</div>
      <div className="sm:hidden">
        <button type="button" onClick={() => a.onDeleteNotice(n)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
          공지 삭제
        </button>
      </div>
    </Body>
  </div>
)

const MobileSheet = ({ onClose, children }: { onClose: () => void; children: ReactNode }) => {
  useModalBackButton(onClose)
  return <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">{children}</div>
}

// ── 목록 행 ──────────────────────────────────────────────

const rowCls = (active: boolean) =>
  `w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''} hover:bg-gray-50 dark:hover:bg-white/[0.04]`

const ClassRow = ({ c, pending, active, onClick }: { c: CultureClassAdmin; pending: number; active: boolean; onClick: () => void }) => {
  const seats = seatsOf(c)
  const phase = classPhase(c)
  return (
    <button id={`culture-row-${c.id}`} type="button" onClick={onClick} aria-current={active} className={rowCls(active)}>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className={`truncate text-[15.5px] font-bold ${phase === 'open' ? 'text-ink-strong' : 'text-gray-600 dark:text-white/65'}`}>{c.title}</span>
          {phase === 'hidden' ? <Badge tone="off">숨김</Badge> : phase === 'closed' ? <Badge tone="off">마감</Badge> : seats.full ? <Badge tone="warn">정원 참</Badge> : null}
          {pending > 0 && <Badge tone="warn">대기 {pending}</Badge>}
        </span>
        <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">{[c.schedule, c.instructor].filter(Boolean).join(' · ') || '일정 미정'}</span>
        {seats.cap && (
          <span className="mt-1.5 block h-1 rounded-full bg-gray-200/80 dark:bg-white/10 overflow-hidden">
            <span className={`block h-full rounded-full ${seats.full ? 'bg-amber-500' : 'bg-brand'}`} style={{ width: `${seats.ratio * 100}%` }} />
          </span>
        )}
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-[17px] font-extrabold tabular-nums leading-none ${c.application_count > 0 ? 'text-ink-strong' : 'text-gray-300 dark:text-white/25'}`}>
          {c.application_count}
          {seats.cap && <span className="text-[12.5px] font-bold text-gray-400 dark:text-white/40">/{seats.cap}</span>}
        </span>
        <span className="block mt-1 text-[11.5px] font-semibold text-gray-400 dark:text-white/40">신청</span>
      </span>
    </button>
  )
}

const AppRow = ({ x, active, onClick }: { x: CultureApplication; active: boolean; onClick: () => void }) => (
  <button id={`culture-row-${x.id}`} type="button" onClick={onClick} aria-current={active} className={rowCls(active)}>
    <span className="flex-1 min-w-0">
      <span className="flex items-center gap-1.5">
        <span className={`truncate text-[15.5px] font-bold ${x.status === 'cancelled' ? 'text-gray-500 dark:text-white/50 line-through' : 'text-ink-strong'}`}>{x.name}</span>
        <Badge tone={STATUS_TONE[x.status]}>{STATUS_LABEL[x.status]}</Badge>
      </span>
      <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">{x.class_title ?? '삭제된 강좌'} · {formatPhone(x.phone)}</span>
    </span>
    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-gray-400 dark:text-white/40">{shortDate(x.created_at)}</span>
  </button>
)

const NoticeRow = ({ n, active, onClick }: { n: CultureNotice; active: boolean; onClick: () => void }) => (
  <button id={`culture-row-${n.id}`} type="button" onClick={onClick} aria-current={active} className={rowCls(active)}>
    <span className="flex-1 min-w-0">
      <span className="flex items-center gap-1.5">
        <span className={`truncate text-[15.5px] font-bold ${n.is_active ? 'text-ink-strong' : 'text-gray-600 dark:text-white/65'}`}>{n.title}</span>
        {!n.is_active && <Badge tone="off">비공개</Badge>}
      </span>
      <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">{n.content}</span>
    </span>
    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-gray-400 dark:text-white/40">{shortDate(n.created_at)}</span>
  </button>
)

// ── 데스크 ───────────────────────────────────────────────

export interface CultureDeskProps extends CultureDeskActions {
  classes: CultureClassAdmin[]
  applications: CultureApplication[]
  notices: CultureNotice[]
  loading: boolean
  onBack: () => void
}

const TAB_LABEL: Record<CultureTab, string> = { classes: '강좌', applications: '신청자', notices: '공지' }

const CultureDesk = ({ classes, applications, notices, loading, onBack, ...a }: CultureDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<CultureTab>('classes')
  const [q, setQ] = useState('')
  const [appFilter, setAppFilter] = useState<AppFilter>('all')
  const [appClassId, setAppClassId] = useState<number | null>(null)
  const [sel, setSel] = useState<Record<CultureTab, number | null>>({ classes: null, applications: null, notices: null })
  const [sheetOpen, setSheetOpen] = useState(false)

  const pendingByClass = useMemo(() => {
    const m = new Map<number, number>()
    for (const x of applications) if (x.status === 'pending') m.set(x.class_id, (m.get(x.class_id) ?? 0) + 1)
    return m
  }, [applications])

  const shownClasses = useMemo(() => filterClasses(classes, q), [classes, q])
  const shownApps = useMemo(() => sortApplications(filterApplications(applications, q, appFilter, appClassId)), [applications, q, appFilter, appClassId])
  const shownNotices = useMemo(() => filterNotices(notices, q), [notices, q])

  const order = useMemo(
    () => (tab === 'classes' ? shownClasses : tab === 'applications' ? shownApps : shownNotices).map((x) => x.id),
    [tab, shownClasses, shownApps, shownNotices],
  )
  const activeId = order.includes(sel[tab] ?? -1) ? sel[tab] : (order[0] ?? null)

  const stats = useMemo(
    () => ({
      open: classes.filter((c) => classPhase(c) === 'open').length,
      live: classes.reduce((n, c) => n + c.application_count, 0),
      pending: applications.filter((x) => x.status === 'pending').length,
    }),
    [classes, applications],
  )

  const pick = (t: CultureTab, id: number) => setSel((s) => ({ ...s, [t]: id }))

  useDeskHotkeys({
    searchRef,
    isTyping: isTypingTarget,
    canMove: order.length > 0,
    onMove: (dir) => {
      const i = activeId == null ? -1 : order.indexOf(activeId)
      const id = order[stepIndex(order.length, i, dir)]
      pick(tab, id)
      document.getElementById(`culture-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (id: number) => {
    pick(tab, id)
    if (!isDesktop()) setSheetOpen(true)
  }

  const showAppsFor = (classId: number) => {
    setTab('applications')
    setAppClassId(classId)
    setAppFilter('all')
    setQ('')
    setSheetOpen(false)
  }
  const openApp = (id: number) => {
    setTab('applications')
    setAppClassId(null)
    setAppFilter('all')
    setQ('')
    pick('applications', id)
  }
  const openClass = (id: number) => {
    setTab('classes')
    setQ('')
    pick('classes', id)
  }

  // 상세 — PC 오른쪽과 모바일 시트가 같은 걸 그린다
  const renderDetail = (id: number | null, onClose?: () => void): ReactNode => {
    if (id == null) return null
    if (tab === 'classes') {
      const c = classes.find((x) => x.id === id)
      return c ? <ClassDetail key={onClose ? undefined : c.id} c={c} apps={applications.filter((x) => x.class_id === c.id)} onShowApps={() => showAppsFor(c.id)} onOpenApp={openApp} onClose={onClose} a={a} /> : null
    }
    if (tab === 'applications') {
      const x = applications.find((y) => y.id === id)
      return x ? <AppDetail x={x} onOpenClass={openClass} onClose={onClose} a={a} /> : null
    }
    const n = notices.find((y) => y.id === id)
    return n ? <NoticeDetail n={n} onClose={onClose} a={a} /> : null
  }

  const counts: Record<CultureTab, number> = { classes: classes.length, applications: applications.length, notices: notices.length }
  const filterClass = appClassId != null ? classes.find((c) => c.id === appClassId) : null

  const empty =
    tab === 'classes'
      ? { none: classes.length === 0, msg: '아직 강좌가 없어요', cta: '첫 강좌 만들기', act: a.onCreateClass }
      : tab === 'applications'
        ? { none: applications.length === 0, msg: '아직 신청이 없어요', cta: null, act: noop }
        : { none: notices.length === 0, msg: '아직 공지가 없어요', cta: '첫 공지 쓰기', act: a.onCreateNotice }

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
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">문화교실</h1>
                <button type="button" onClick={a.onViewPublic} className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55 hover:text-brand">
                  성도는 /culture 에서 보고 신청해요 →
                </button>
              </div>
              {tab !== 'applications' && (
                <button
                  type="button"
                  onClick={tab === 'classes' ? a.onCreateClass : a.onCreateNotice}
                  className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
                >
                  <I d={IC.plus} size={17} />
                  {tab === 'classes' ? '새 강좌' : '새 공지'}
                </button>
              )}
            </div>

            <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
              {(
                [
                  ['모집 중', stats.open, '개', false],
                  ['신청', stats.live, '명', false],
                  ['접수 대기', stats.pending, '명', stats.pending > 0],
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
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tab === 'classes' ? '강좌명·강사·분기 찾기' : tab === 'applications' ? '이름·전화번호·강좌 찾기' : '공지 제목·내용 찾기'}
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[var(--brand-glow)] focus:bg-white dark:focus:bg-white/[0.08] transition"
              />
              {q ? (
                <button type="button" onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white/80" aria-label="검색어 지우기">
                  <I d={IC.close} size={14} />
                </button>
              ) : (
                <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 dark:text-white/35 border border-gray-300 dark:border-white/15 rounded px-1.5 leading-[18px]">/</kbd>
              )}
            </label>

            <div role="tablist" className="grid grid-cols-3 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.05]">
              {(['classes', 'applications', 'notices'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={`h-8 rounded-lg text-[13.5px] font-semibold transition ${
                    tab === k ? 'bg-white dark:bg-white/[0.12] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80'
                  }`}
                >
                  {TAB_LABEL[k]} <span className="tabular-nums opacity-70">{counts[k]}</span>
                </button>
              ))}
            </div>

            {tab === 'applications' && (
              <div className="space-y-2">
                <div className="-mx-4 px-4 flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {APP_FILTERS.map(([k, label]) => {
                    const on = appFilter === k
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setAppFilter(k)}
                        aria-pressed={on}
                        className={`shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold transition ${
                          on ? 'bg-ink-strong text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                        }`}
                      >
                        {label}
                        {k === 'pending' && stats.pending > 0 && <span className="ml-1 tabular-nums">{stats.pending}</span>}
                      </button>
                    )
                  })}
                </div>
                <select
                  value={appClassId ?? ''}
                  onChange={(e) => setAppClassId(e.target.value ? Number(e.target.value) : null)}
                  aria-label="강좌로 거르기"
                  className="w-full h-10 px-3 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] font-semibold text-ink-strong outline-none focus:ring-2 focus:ring-[var(--brand-glow)]"
                >
                  <option value="">모든 강좌</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <div className="space-y-1 px-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[66px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : order.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[15px] font-bold text-ink-strong">{empty.none ? empty.msg : '맞는 항목이 없어요'}</p>
                {empty.none ? (
                  empty.cta && (
                    <button type="button" onClick={empty.act} className="mt-2 text-[14px] font-semibold text-brand">
                      {empty.cta}
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setQ('')
                      setAppFilter('all')
                      setAppClassId(null)
                    }}
                    className="mt-2 text-[14px] font-semibold text-brand"
                  >
                    거르기 풀기
                  </button>
                )}
              </div>
            ) : tab === 'classes' ? (
              shownClasses.map((c) => <ClassRow key={c.id} c={c} pending={pendingByClass.get(c.id) ?? 0} active={c.id === activeId} onClick={() => select(c.id)} />)
            ) : tab === 'applications' ? (
              <>
                {filterClass && (
                  <p className="px-3 pt-1 pb-1 text-[13px] font-extrabold text-gray-400 dark:text-white/40">
                    {filterClass.title} · {shownApps.length}명
                  </p>
                )}
                {shownApps.map((x) => (
                  <AppRow key={x.id} x={x} active={x.id === activeId} onClick={() => select(x.id)} />
                ))}
              </>
            ) : (
              shownNotices.map((n) => <NoticeRow key={n.id} n={n} active={n.id === activeId} onClick={() => select(n.id)} />)
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {renderDetail(activeId) ?? (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 항목을 골라요'}</div>
          )}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetOpen && sel[tab] != null && <MobileSheet onClose={() => setSheetOpen(false)}>{renderDetail(sel[tab], () => setSheetOpen(false))}</MobileSheet>}
    </div>
  )
}

export default CultureDesk
