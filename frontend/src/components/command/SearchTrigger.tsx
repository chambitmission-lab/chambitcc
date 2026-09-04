import { useLanguage } from '../../contexts/LanguageContext'
import { isMacLike, openCommandPalette, preloadCommandPalette } from './commandEvents'

// 헤더 캡슐(PC) — 누르면 ⌘K 팔레트. 단축키 힌트를 함께 보여줘 "스마트한 교회"를 헤더에서부터 드러낸다.
export const SearchCapsule = () => {
  const { t } = useLanguage()
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      onMouseEnter={preloadCommandPalette}
      onFocus={preloadCommandPalette}
      className="search-capsule group flex items-center gap-2 h-9 min-w-[236px] xl:min-w-[276px] pl-3.5 pr-2 rounded-full text-[13.5px] whitespace-nowrap"
      aria-label={t('cmdkTrigger')}
      aria-keyshortcuts="Meta+K Control+K"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="search-capsule-icon w-[15px] h-[15px] shrink-0" aria-hidden>
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <span className="font-medium flex-1 text-left">{t('cmdkTrigger')}</span>
      {/* 단축키 키캡 — 실제 키보드 버튼처럼 입체감 있는 <kbd> 두 개 */}
      <span className="ml-1 inline-flex items-center gap-1" aria-hidden="true">
        <kbd className="keycap">{isMacLike() ? '⌘' : 'Ctrl'}</kbd>
        <kbd className="keycap">K</kbd>
      </span>
    </button>
  )
}

// 모바일 헤더 아이콘 — 같은 팔레트를 연다
export const SearchIconButton = ({ className }: { className?: string }) => {
  const { t } = useLanguage()
  return (
    <button type="button" onClick={openCommandPalette} onTouchStart={preloadCommandPalette} onFocus={preloadCommandPalette} className={className} aria-label={t('cmdkTrigger')}>
      <span className="material-icons-outlined text-2xl leading-none inline-flex items-center justify-center w-6 h-6 overflow-hidden">search</span>
    </button>
  )
}
