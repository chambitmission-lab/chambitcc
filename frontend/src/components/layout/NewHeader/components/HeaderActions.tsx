import { useTheme } from '../../../../contexts/ThemeContext'

interface HeaderActionsProps {
  unreadCount: number
  isMenuOpen: boolean
  onNotificationClick: () => void
  onMenuToggle: () => void
}

const HeaderActions = ({ unreadCount, isMenuOpen, onNotificationClick, onMenuToggle }: HeaderActionsProps) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex items-center gap-5">
      <button 
        onClick={toggleTheme}
        className="text-gray-800 dark:text-white hover:text-primary transition-colors"
        aria-label="테마 변경"
      >
        <span className="material-icons-outlined text-2xl">
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
      
      <button 
        onClick={onNotificationClick}
        className="text-gray-800 dark:text-white hover:text-primary transition-colors relative"
        aria-label="알림"
      >
        <span className="material-icons-outlined text-2xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-black"></span>
        )}
      </button>
      
      <button 
        onClick={onMenuToggle}
        className={`relative transition-all ${
          isMenuOpen 
            ? 'text-red-500 dark:text-red-400' 
            : 'text-gray-800 dark:text-white hover:text-primary'
        }`}
        aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴"}
      >
        {/* X 버튼 빛나는 효과 (비상구 스타일) */}
        {isMenuOpen && (
          <>
            <div className="absolute inset-0 bg-red-500/30 dark:bg-red-400/30 blur-lg animate-pulse"></div>
            <div className="absolute inset-0 bg-red-500/20 dark:bg-red-400/20 blur-md"></div>
          </>
        )}
        <span className={`material-icons-outlined text-2xl relative z-10 ${
          isMenuOpen ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] dark:drop-shadow-[0_0_10px_rgba(248,113,113,0.9)]' : ''
        }`}>
          {isMenuOpen ? 'close' : 'more_vert'}
        </span>
      </button>
    </div>
  )
}

export default HeaderActions
