// 3. 액션 벤토 (말씀 알림 · 말씀 카드).

import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { AlarmIcon, ImageIcon } from '../EmotionIcons'
import { ArrowUpRight } from '../../../../components/icons/phosphor'

// ── 3. 액션 벤토 (말씀 알림 · 말씀 카드) ───────────────────────────────

// 두 배너를 나란한 2칸 타일로 압축 — 타일 전체가 버튼, 이모지 대신 Phosphor 선화.
// 알림 타일은 브랜드 그래디언트(주 행동), 말씀 카드 타일은 라벤더 틴트(보조 행동).
interface ActionTile {
  key: string
  title: string
  body: string
  cta: string
  icon: ReactNode
  tone: 'brand' | 'lavender'
  onClick: () => void
}

const ActionBento = ({ tiles }: { tiles: ActionTile[] }) => (
  <div className="grid grid-cols-2 gap-2">
    {tiles.map((tile) => {
      const brand = tile.tone === 'brand'
      return (
        <button
          key={tile.key}
          type="button"
          onClick={tile.onClick}
          className={`group relative flex min-h-[132px] flex-col overflow-hidden rounded-2xl p-3.5 text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
            brand
              ? 'text-white hover:shadow-[0_14px_28px_-12px_var(--brand-glow)]'
              : 'border border-[var(--card-border)] bg-[#f3efff] text-ink-strong dark:bg-[#1c1730]'
          }`}
          style={
            brand
              ? {
                  background: 'linear-gradient(150deg, var(--brand-dim) 0%, var(--brand) 55%, #6cb0ff 100%)',
                  boxShadow: '0 8px 20px -10px var(--brand-glow), inset 0 1px 0 rgba(255,255,255,0.28)',
                }
              : undefined
          }
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full"
            style={{
              background: brand
                ? 'radial-gradient(circle, rgba(255,255,255,0.4), rgba(255,255,255,0) 70%)'
                : 'radial-gradient(circle, rgba(124,102,217,0.28), rgba(124,102,217,0) 70%)',
            }}
          />
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
              brand ? 'bg-white/20 text-white' : 'bg-[#7c66d9]/15 text-[#7c66d9] dark:text-[#b7a8f2]'
            }`}
          >
            {tile.icon}
          </span>
          <span className="mt-auto pt-3">
            <span className="block text-[13px] font-bold leading-snug tracking-[-0.02em]">
              {tile.title}
            </span>
            <span className={`mt-0.5 block text-[11px] leading-snug ${brand ? 'text-white/75' : 'text-ink-muted'}`}>
              {tile.body}
            </span>
          </span>
          <span
            className={`mt-2 inline-flex items-center gap-0.5 text-[11.5px] font-bold ${
              brand ? 'text-white' : 'text-[#7c66d9] dark:text-[#b7a8f2]'
            }`}
          >
            {tile.cta}
            <ArrowUpRight
              size={13}
              weight="bold"
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </span>
        </button>
      )
    })}
  </div>
)

const ActionBentoWidget = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const tiles: ActionTile[] = [
    {
      key: 'alarm',
      title: `${t('homeRailAlarmTitle1')} ${t('homeRailAlarmTitle2')}`,
      body: t('homeRailAlarmBody1'),
      cta: t('homeRailAlarmCta'),
      icon: <AlarmIcon size={18} />,
      tone: 'brand',
      onClick: () => navigate('/bible/alarm'),
    },
    {
      key: 'verse-card',
      title: t('homeRailVerseCardTitle'),
      body: t('homeRailVerseCardBody1'),
      cta: t('railShareVerseCard'),
      icon: <ImageIcon size={18} />,
      tone: 'lavender',
      onClick: () => navigate('/bible/photo-verse'),
    },
  ]
  return (
    <section className="px-4 pt-3">
      <ActionBento tiles={tiles} />
    </section>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { ActionBentoWidget }
