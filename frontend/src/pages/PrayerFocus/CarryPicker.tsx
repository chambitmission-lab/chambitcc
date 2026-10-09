// 설정 화면 '오늘 품을 기도제목' — 출처 탭(기도방 · 함께 기도 중 · 내 기도) + 체크 목록.
// 후보가 하나도 없으면(비로그인·첫 사용자) 아무것도 그리지 않는다 — 주제만으로도 기도는 된다.
import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { CANDLE_TONE, CANDLE_SELECTED } from './candleTone'
import { CARRY_MAX, type CarryCandidates, type CarryItem, type CarrySource } from './carryPrayers'

interface CarryPickerProps {
  candidates: CarryCandidates | undefined
  selected: CarryItem[]
  onToggle: (item: CarryItem) => void
}

const COLLAPSED_ROWS = 4

const CarryPicker = ({ candidates, selected, onToggle }: CarryPickerProps) => {
  const { t } = useLanguage()
  const tabs = (
    [
      { id: 'group', label: candidates?.groupName ?? t('carrySourceGroup'), items: candidates?.group ?? [] },
      { id: 'praying', label: t('carrySourcePraying'), items: candidates?.praying ?? [] },
      { id: 'mine', label: t('carrySourceMine'), items: candidates?.mine ?? [] },
    ] as { id: CarrySource; label: string; items: CarryItem[] }[]
  ).filter((tab) => tab.items.length > 0)

  // 고르기 전엔 첫 탭(들어온 기도방이 있으면 기도방)이 열린다
  const [tabId, setTabId] = useState<CarrySource | null>(null)
  const [expanded, setExpanded] = useState(false)

  if (tabs.length === 0) return null

  const active = tabs.find((tab) => tab.id === tabId) ?? tabs[0]
  const rows = expanded ? active.items : active.items.slice(0, COLLAPSED_ROWS)
  const selectedIds = new Set(selected.map((s) => s.id))
  const full = selected.length >= CARRY_MAX

  return (
    <div className="w-full mb-8">
      <p className="text-white/55 text-[13px] lg:text-[16px] lg:text-white/75 mb-1 text-center font-serif-kr">
        {t('carryTitle')}
      </p>
      <p className="text-[11.5px] lg:text-[14px] text-white/35 lg:text-white/55 mb-3 text-center">
        {selected.length > 0
          ? t('carrySelectedCount').replace('{n}', String(selected.length)).replace('{max}', String(CARRY_MAX))
          : t('carryHint')}
      </p>

      {tabs.length > 1 && (
        <div role="tablist" className="flex justify-center gap-1.5 mb-2.5 flex-wrap">
          {tabs.map((tab) => {
            const on = tab.id === active.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setTabId(tab.id)
                  setExpanded(false)
                }}
                className={`px-3 py-1 lg:px-4 lg:min-h-[40px] rounded-full text-[11.5px] lg:text-[14px] font-medium border transition-all max-w-[11rem] truncate ${
                  on ? 'text-white' : 'border-white/10 bg-white/[0.04] text-white/50 lg:text-white/70 hover:bg-white/[0.08]'
                }`}
                style={on ? CANDLE_SELECTED : undefined}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06] overflow-hidden">
        {rows.map((item) => {
          const on = selectedIds.has(item.id)
          const disabled = !on && full
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item)}
              disabled={disabled}
              aria-pressed={on}
              className="w-full flex items-start gap-3 px-3.5 py-3 lg:px-4 lg:py-3.5 text-left hover:bg-white/[0.04] transition-colors disabled:opacity-35"
            >
              <span
                className={`shrink-0 mt-0.5 w-5 h-5 lg:w-6 lg:h-6 rounded-full border flex items-center justify-center transition-colors ${
                  on ? '' : 'border-white/20'
                }`}
                style={on ? { backgroundColor: CANDLE_TONE.switchOn, borderColor: CANDLE_TONE.switchOn } : undefined}
              >
                {on && <span className="material-icons-outlined text-[14px] lg:text-[16px] text-white">check</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[13px] lg:text-[16px] leading-snug line-clamp-2 break-keep ${on ? 'text-white/95' : 'text-white/75 lg:text-white/85'}`}>
                  {item.text}
                </span>
                {item.who && (
                  <span className="block mt-0.5 text-[11px] lg:text-[13.5px] text-white/35 lg:text-white/55 truncate">{item.who}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {active.items.length > COLLAPSED_ROWS && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full text-center text-[11.5px] lg:text-[14px] text-white/40 lg:text-white/60 hover:text-white/70 py-1"
        >
          {expanded ? t('carryShowLess') : t('carryShowMore').replace('{n}', String(active.items.length - COLLAPSED_ROWS))}
        </button>
      )}
    </div>
  )
}

export default CarryPicker
