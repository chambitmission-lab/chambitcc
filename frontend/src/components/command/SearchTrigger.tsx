import { useLanguage } from '../../contexts/LanguageContext'
import { isMacLike, openCommandPalette } from './commandEvents'

// 헤더 캡슐(PC) — 누르면 ⌘K 팔레트. 단축키 힌트를 함께 보여줘 "스마트한 교회"를 헤더에서부터 드러낸다.
export const SearchCapsule = () => {
  const { t } = useLanguage()
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      className="group flex items-center gap-2 h-9 pl-3 pr-2 rounded-full text-[13px] whitespace-nowrap text-gray-500 dark:text-white/55 bg-black/[0.04] dark:bg-white/[0.06] ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06] hover:text-brand hover:bg-[var(--brand-soft)] hover:ring-transparent transition-colors duration-150"
      aria-label={t('cmdkTrigger')}
      aria-keyshortcuts="Meta+K Control+K"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-[15px] h-[15px] shrink-0" aria-hidden>
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <span className="font-medium">{t('cmdkTrigger')}</span>
      <span className="ml-1 inline-flex items-center gap-0.5 text-[10.5px] font-bold text-gray-400 dark:text-white/40 group-hover:text-brand/70">
        <span className="px-1.5 h-[18px] inline-flex items-center rounded-md bg-black/[0.05] dark:bg-white/[0.08]">{isMacLike() ? '⌘' : 'Ctrl'}</span>
        <span className="px-1.5 h-[18px] inline-flex items-center rounded-md bg-black/[0.05] dark:bg-white/[0.08]">K</span>
      </span>
    </button>
  )
}

// 모바일 헤더 아이콘 — 같은 팔레트를 연다
export const SearchIconButton = ({ className }: { className?: string }) => {
  const { t } = useLanguage()
  return (
    <button type="button" onClick={openCommandPalette} className={className} aria-label={t('cmdkTrigger')}>
      <span className="material-icons-outlined text-2xl leading-none inline-flex items-center justify-center w-6 h-6 overflow-hidden">search</span>
    </button>
  )
}
