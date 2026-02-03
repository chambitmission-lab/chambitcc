interface BottomNavigationProps {
  onComposerOpen: () => void
  onProfileClick: () => void
}

const BottomNavigation = ({ onComposerOpen, onProfileClick }: BottomNavigationProps) => {
  return (
    <nav className="sticky bottom-0 bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark h-[84px] pb-5 px-6 flex justify-between items-center z-50">
      {/* Home */}
      <button className="flex flex-col items-center justify-center w-10 text-gray-900 dark:text-white transition-all hover:opacity-60">
        <svg className="w-[27px] h-[27px]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 23h-6.001a1 1 0 0 1-1-1v-5.455a2.997 2.997 0 1 0-5.993 0V22a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V11.543a1.002 1.002 0 0 1 .31-.724l10-9.543a1.001 1.001 0 0 1 1.38 0l10 9.543a1.002 1.002 0 0 1 .31.724V22a1 1 0 0 1-1 1Z"/>
        </svg>
      </button>
      
      {/* Search */}
      <button className="flex flex-col items-center justify-center w-10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">
        <svg className="w-[27px] h-[27px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
          <circle cx="10.5" cy="10.5" r="7.5"/>
          <line x1="16.5" y1="16.5" x2="22" y2="22"/>
        </svg>
      </button>
      
      {/* Add/Create */}
      <button
        onClick={onComposerOpen}
        className="flex flex-col items-center justify-center w-10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
      >
        <svg className="w-[27px] h-[27px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </button>
      
      {/* Likes/Favorites */}
      <button className="flex flex-col items-center justify-center w-10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">
        <svg className="w-[27px] h-[27px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      
      {/* Profile */}
      <button 
        onClick={onProfileClick}
        className="flex flex-col items-center justify-center w-10 transition-all hover:opacity-80"
      >
        <div className="w-[27px] h-[27px] rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
          <svg className="w-[16px] h-[16px]" fill="white" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </button>
    </nav>
  )
}

export default BottomNavigation
