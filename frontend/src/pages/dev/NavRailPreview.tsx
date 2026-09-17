/**
 * PC 좌측 내비 레일 디자인 시안 미리보기 (DEV 전용 · /#/dev/nav-rail)
 *
 * 기능 추가가 아니라 "아이콘 개성 + 항목 트리트먼트"만 비교하기 위한 화면.
 * 실제 레일(DesktopNavRail)과 같은 목적지·같은 테마 토큰을 쓰고,
 * 각 시안은 넓은 폭(xl, 248px)과 아이콘만 보이는 폭(lg, 76px)을 나란히 보여준다.
 */
import { useState, type ReactNode } from 'react'
import {
  House,
  BookOpenText,
  Timer,
  ImageSquare,
  UsersThree,
  Path,
  UserCircle,
} from '../../components/icons/phosphor'
import { HeavenLetterIcon } from '../../components/icons/HeavenLetterIcon'
import { useTheme } from '../../contexts/ThemeContext'

type ItemKey = 'home' | 'bible' | 'focus' | 'card' | 'groups' | 'growth' | 'profile'

const ITEMS: { key: ItemKey; label: string }[] = [
  { key: 'home', label: '홈' },
  { key: 'bible', label: '성경' },
  { key: 'focus', label: '집중 기도' },
  { key: 'card', label: '말씀 카드' },
  { key: 'groups', label: '모임' },
  { key: 'growth', label: '신앙 여정' },
  { key: 'profile', label: '프로필' },
]

/* ─────────── 아이콘 세트 ─────────── */

// A. 현재 — 모노라인 1.8 (비교용 기준선)
const currentIcon = (key: ItemKey, active: boolean): ReactNode => {
  const p = {
    className: 'w-[26px] h-[26px] shrink-0',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2.2 : 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (key) {
    case 'home':
      return (
        <svg {...p}>
          <path d="M3 11.5 12 3l9 8.5" />
          <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
        </svg>
      )
    case 'bible':
      return <span className="material-icons-outlined text-[26px] shrink-0">menu_book</span>
    case 'focus':
      return (
        <svg {...p}>
          <path d="M10 2.5h4" />
          <circle cx="12" cy="14" r="7.5" />
          <path d="M12 14l2.7-2.7" />
        </svg>
      )
    case 'card':
      return (
        <svg {...p}>
          <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M4 17.5l4.8-4.8 3.2 3.2 3.5-3.5 4.5 4.5" />
        </svg>
      )
    case 'groups':
      return (
        <svg {...p}>
          <circle cx="9" cy="8.5" r="3.2" />
          <path d="M3.2 19.5v-.5a5.8 5.8 0 0 1 11.6 0v.5" />
          <path d="M15.4 5.9a3.2 3.2 0 1 1 .9 6.3" />
          <path d="M17 13.6a5.8 5.8 0 0 1 3.8 5.4v.5" />
        </svg>
      )
    case 'growth':
      return (
        <svg {...p}>
          <path d="M12 21.5v-8.5" />
          <path d="M12 13c0-3.6 2.7-6.1 6.7-6.1-.2 3.9-2.9 6.1-6.7 6.1Z" />
          <path d="M12 10.3c0-2.9-2.2-4.9-5.4-4.9.2 3.1 2.3 4.9 5.4 4.9" />
        </svg>
      )
    case 'profile':
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
        </svg>
      )
  }
}

// B. Phosphor — 활성 duotone(면), 비활성 bold(선)
const PHOSPHOR = {
  home: House,
  bible: BookOpenText,
  focus: Timer,
  card: ImageSquare,
  groups: UsersThree,
  growth: Path,
  profile: UserCircle,
} as const

const phosphorIcon =
  (size = 26) =>
  (key: ItemKey, active: boolean) => {
    const Glyph = PHOSPHOR[key]
    return <Glyph size={size} weight={active ? 'duotone' : 'bold'} className="shrink-0" />
  }

// C. 참빛 커스텀 — 교회·여정 모티프 손그림 라인
const chambitIcon = (key: ItemKey, active: boolean): ReactNode => {
  const p = {
    className: 'w-[26px] h-[26px] shrink-0',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 1.95 : 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (key) {
    case 'home': // 십자가 얹은 지붕 — 교회이자 집
      return (
        <svg {...p}>
          <path d="M12 1.6v2.9" />
          <path d="M10.8 2.7h2.4" />
          <path d="M3.6 11.6 12 4.9l8.4 6.7" />
          <path d="M5.5 10.6V19a1.2 1.2 0 0 0 1.2 1.2h10.6A1.2 1.2 0 0 0 18.5 19v-8.4" />
          <path d="M9.8 20.2v-3.6a2.2 2.2 0 0 1 4.4 0v3.6" />
        </svg>
      )
    case 'bible': // 펼친 성경 + 책갈피 리본
      return (
        <svg {...p}>
          <path d="M12 7c-1.8-1.4-4-2.1-6.3-2.1-.6 0-1 .4-1 1v10c0 .6.4 1 1 1 2.3 0 4.5.7 6.3 2.1" />
          <path d="M12 7c1.8-1.4 4-2.1 6.3-2.1.6 0 1 .4 1 1v10c0 .6-.4 1-1 1-2.3 0-4.5.7-6.3 2.1" />
          <path d="M12 7v12" />
          <path d="M15.1 4.9v4.4l1.5-1.1 1.5 1.1V5.1" />
        </svg>
      )
    case 'focus': // 모래시계 — 머무는 기도의 시간
      return (
        <svg {...p}>
          <path d="M7.4 3.4h9.2" />
          <path d="M7.4 20.6h9.2" />
          <path d="M8.7 3.4v2.9c0 1.5 3.3 3.8 3.3 5.7 0 1.9-3.3 4.2-3.3 5.7v2.9" />
          <path d="M15.3 3.4v2.9c0 1.5-3.3 3.8-3.3 5.7 0 1.9 3.3 4.2 3.3 5.7v2.9" />
          <path d="M10.4 17.3c.6-.9 1.1-1.4 1.6-1.4s1 .5 1.6 1.4" />
        </svg>
      )
    case 'card': // 폴라로이드 말씀 카드
      return (
        <svg {...p}>
          <rect x="4" y="3.2" width="16" height="17.6" rx="2.2" />
          <path d="M4 15.6h16" />
          <path d="M6.6 13.4 9.5 10l2.4 2.7 2.4-2.2 3.1 2.9" />
          <circle cx="9.1" cy="7.2" r="1.25" />
          <path d="M7.4 18.2h6.2" />
        </svg>
      )
    case 'groups': // 둘러앉은 셋 — 모임
      return (
        <svg {...p}>
          <circle cx="12" cy="5.8" r="2.4" />
          <circle cx="5.7" cy="14.6" r="2.4" />
          <circle cx="18.3" cy="14.6" r="2.4" />
          <path d="M10 7.9 7.6 12" />
          <path d="M14 7.9 16.4 12" />
          <path d="M8.3 16.9h7.4" />
        </svg>
      )
    case 'growth': // 굽은 길 끝의 깃발 — 걸어온 여정
      return (
        <svg {...p}>
          <path d="M5.2 20.8c0-3.2 2-4.7 4.3-5.7 2.5-1.1 4.9-2.2 4.9-5.5" />
          <path d="M14.4 10V2.9" />
          <path d="M14.4 3.4h5.9l-2 2.4 2 2.4h-5.9" />
          <circle cx="5.2" cy="20.8" r="1.2" />
        </svg>
      )
    case 'profile': // 후광 얹은 아바타
      return (
        <svg {...p}>
          <path d="M8.6 4.3a4.9 4.9 0 0 1 6.8 0" />
          <circle cx="12" cy="10.2" r="3.3" />
          <path d="M5.4 20.6a6.6 6.6 0 0 1 13.2 0" />
        </svg>
      )
  }
}

/* ─────────── 시안 정의 ─────────── */

type Variant = {
  id: string
  name: string
  desc: string
  railClass?: string
  icon: (key: ItemKey, active: boolean) => ReactNode
  /** 아이콘을 감싸는 그릇(타일·원형 등). 없으면 아이콘만 */
  slot?: (icon: ReactNode, active: boolean) => ReactNode
  item: (active: boolean) => string
  indicator?: (active: boolean) => ReactNode
  label?: (active: boolean) => string
}

const baseItem = (active: boolean) =>
  `group relative flex items-center gap-3.5 h-12 rounded-xl transition-all duration-200 ${
    active
      ? 'text-brand bg-[var(--brand-soft)]'
      : 'text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)]'
  }`

const bar = (active: boolean) =>
  active ? (
    <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-brand" />
  ) : null

const VARIANTS: Variant[] = [
  {
    id: 'current',
    name: '0. 현재',
    desc: '모노라인 1.8 · 소프트 pill · 좌측 바',
    icon: currentIcon,
    item: baseItem,
    indicator: bar,
  },
  {
    id: 'duotone',
    name: '1. 듀오톤 소프트',
    desc: '선→면 모프(활성만 duotone) · 캡슐 인디케이터',
    icon: phosphorIcon(26),
    item: (active) =>
      `group relative flex items-center gap-3.5 h-12 rounded-2xl transition-all duration-200 ${
        active
          ? 'text-brand bg-[var(--brand-soft-strong)]'
          : 'text-gray-500 dark:text-white/65 hover:text-brand hover:bg-[var(--brand-soft)]'
      }`,
    indicator: (active) =>
      active ? (
        <span className="absolute -left-3 top-1/2 h-7 w-[4px] -translate-y-1/2 rounded-r-full bg-brand shadow-[0_0_10px_var(--brand-glow)]" />
      ) : null,
  },
  {
    id: 'tile',
    name: '2. 스퀘어클 타일',
    desc: '아이콘마다 그릇 · 활성 타일은 브랜드 그라데이션',
    icon: phosphorIcon(21),
    slot: (icon, active) => (
      <span
        className={`w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0 transition-all duration-200 ${
          active
            ? 'text-white bg-[linear-gradient(150deg,#4593fc,var(--brand-dim))] shadow-[0_6px_14px_-5px_var(--brand-glow),inset_0_1px_0_rgba(255,255,255,0.3)]'
            : 'text-gray-500 dark:text-white/70 bg-black/[0.045] dark:bg-white/[0.07] group-hover:text-brand group-hover:bg-[var(--brand-soft-strong)]'
        }`}
      >
        {icon}
      </span>
    ),
    item: (active) =>
      `group relative flex items-center gap-3 h-12 rounded-xl transition-colors duration-200 ${
        active ? 'text-brand' : 'text-gray-600 dark:text-white/75 hover:text-brand'
      }`,
    label: (active) => `text-[15px] whitespace-nowrap ${active ? 'font-bold' : 'font-semibold'}`,
  },
  {
    id: 'chambit',
    name: '3. 참빛 커스텀 라인',
    desc: '교회·여정 모티프 손그림 · 활성은 빛무리 원',
    icon: chambitIcon,
    slot: (icon, active) => (
      <span className="relative w-10 h-10 flex items-center justify-center shrink-0">
        {active && (
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,var(--brand-soft-strong),transparent_72%)]" />
        )}
        <span className="relative">{icon}</span>
      </span>
    ),
    item: (active) =>
      `group relative flex items-center gap-3 h-[52px] rounded-2xl transition-colors duration-200 ${
        active ? 'text-brand' : 'text-gray-600 dark:text-white/75 hover:text-brand'
      }`,
    label: (active) =>
      `text-[15px] whitespace-nowrap tracking-[-0.01em] ${active ? 'font-bold' : 'font-medium'}`,
  },
  {
    id: 'glass',
    name: '4. 플로팅 카드',
    desc: '레일이 떠 있는 카드 · 활성은 브랜드 알약',
    railClass:
      'bg-[var(--surface-container)] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_10px_30px_-18px_rgba(16,24,40,0.45)]',
    icon: phosphorIcon(24),
    item: (active) =>
      `group relative flex items-center gap-3.5 h-12 rounded-full transition-all duration-200 ${
        active
          ? 'text-white bg-[linear-gradient(150deg,#4593fc,var(--brand-dim))] shadow-[0_8px_18px_-8px_var(--brand-glow)]'
          : 'text-gray-500 dark:text-white/70 hover:text-brand hover:bg-[var(--brand-soft)]'
      }`,
    label: (active) => `text-[15px] whitespace-nowrap ${active ? 'font-bold' : 'font-semibold'}`,
  },
  {
    id: 'emboss',
    name: '5. 소프트 엠보스',
    desc: '눌린 듯한 활성 홈 · 커스텀 라인 + 넉넉한 리듬',
    icon: chambitIcon,
    slot: (icon, active) => (
      <span
        className={`w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
          active
            ? 'text-brand bg-[var(--brand-soft-strong)] shadow-[inset_0_2px_5px_rgba(49,130,246,0.22),inset_0_-1px_0_rgba(255,255,255,0.5)]'
            : 'text-gray-500 dark:text-white/70 group-hover:text-brand group-hover:bg-[var(--brand-soft)]'
        }`}
      >
        {icon}
      </span>
    ),
    item: (active) =>
      `group relative flex items-center gap-3 h-[54px] rounded-2xl transition-colors duration-200 ${
        active ? 'text-brand' : 'text-gray-600 dark:text-white/75 hover:text-brand'
      }`,
    indicator: (active) =>
      active ? (
        <span className="absolute right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand" />
      ) : null,
    label: (active) => `text-[15px] whitespace-nowrap ${active ? 'font-bold' : 'font-semibold'}`,
  },
]

/* ─────────── 레일 목업 ─────────── */

const RailMock = ({
  variant,
  compact,
  activeKey,
  onPick,
}: {
  variant: Variant
  compact: boolean
  activeKey: ItemKey
  onPick: (key: ItemKey) => void
}) => (
  <div
    className={`flex flex-col rounded-2xl ${compact ? 'w-[76px] px-3' : 'w-[248px] px-4'} pt-5 pb-4 ${
      variant.railClass ?? 'bg-[var(--desktop-chrome)]'
    } min-h-[560px]`}
  >
    <nav className="flex flex-col gap-1">
      {ITEMS.map((it) => {
        const active = it.key === activeKey
        const icon = variant.icon(it.key, active)
        return (
          <button
            key={it.key}
            onClick={() => onPick(it.key)}
            className={`${variant.item(active)} ${compact ? 'justify-center px-0' : 'justify-start px-3'}`}
          >
            {variant.indicator?.(active)}
            {variant.slot ? variant.slot(icon, active) : icon}
            {!compact && (
              <span
                className={
                  variant.label?.(active) ??
                  `text-[15px] whitespace-nowrap ${active ? 'font-bold' : 'font-semibold'}`
                }
              >
                {it.label}
              </span>
            )}
          </button>
        )
      })}
    </nav>

    {/* 나누기 CTA — 시안별 비교 대상 아님(동일 유지) */}
    <div className={`mt-6 flex ${compact ? 'justify-center' : ''}`}>
      <button
        className={`relative flex items-center justify-center gap-2 text-white rounded-full bg-[radial-gradient(circle_at_28%_20%,rgba(255,255,255,0.28),transparent_48%),linear-gradient(155deg,#4593fc,var(--brand-dim))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),0_6px_16px_-4px_var(--brand-glow)] ${
          compact ? 'w-12 h-12' : 'w-full px-4 py-3'
        }`}
      >
        <span className="absolute inset-[3px] rounded-full border border-dashed border-white/30" />
        <HeavenLetterIcon className="w-6 h-6 shrink-0 rotate-90" />
        {!compact && <span className="text-[14.5px] font-bold">나누기</span>}
      </button>
    </div>

    <div
      className={`mt-auto pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center gap-1 ${
        compact ? 'flex-col' : 'justify-between'
      }`}
    >
      <span className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/75">
        <span className="material-icons-outlined text-2xl leading-none">dark_mode</span>
      </span>
      <span className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/75">
        <span className="material-icons-outlined text-2xl leading-none">more_vert</span>
      </span>
    </div>
  </div>
)

const VariantCard = ({ variant }: { variant: Variant }) => {
  const [activeKey, setActiveKey] = useState<ItemKey>('home')
  return (
    <section className="rounded-3xl bg-[var(--surface-container)] border border-black/[0.06] dark:border-white/[0.08] p-4">
      <header className="mb-3 px-1">
        <h2 className="text-[17px] font-bold text-[var(--text-strong)]">{variant.name}</h2>
        <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5">{variant.desc}</p>
      </header>
      <div className="flex gap-3 items-stretch">
        <RailMock variant={variant} compact={false} activeKey={activeKey} onPick={setActiveKey} />
        <RailMock variant={variant} compact activeKey={activeKey} onPick={setActiveKey} />
      </div>
    </section>
  )
}

const NavRailPreview = () => {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="min-h-screen bg-[var(--desktop-chrome)] px-6 pb-10 pt-20">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--text-strong)]">좌측 레일 디자인 시안</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">
            항목을 눌러 활성 상태를 확인하세요. 시안마다 넓은 폭(248px) / 아이콘만(76px) 쌍입니다.
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-[var(--surface-container)] text-[var(--text-strong)] border border-black/[0.08] dark:border-white/[0.12]"
        >
          {theme === 'dark' ? '라이트로' : '다크로'}
        </button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
        {VARIANTS.map((v) => (
          <VariantCard key={v.id} variant={v} />
        ))}
      </div>
    </div>
  )
}

export default NavRailPreview
