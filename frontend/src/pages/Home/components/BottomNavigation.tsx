interface BottomNavigationProps {
  onProfileClick: () => void
}

const BottomNavigation = ({ onProfileClick }: BottomNavigationProps) => {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className="sticky bottom-0 bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark h-[84px] pb-5 px-6 flex justify-center items-center z-50">
      <div className="flex justify-between items-center w-full max-w-[200px]">
        {/* Home - Scroll to Top */}
        <button 
          onClick={handleScrollToTop}
          className="flex flex-col items-center justify-center w-10 text-gray-900 dark:text-white transition-all hover:opacity-60"
        >
          <svg className="w-[27px] h-[27px]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 23h-6.001a1 1 0 0 1-1-1v-5.455a2.997 2.997 0 1 0-5.993 0V22a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V11.543a1.002 1.002 0 0 1 .31-.724l10-9.543a1.001 1.001 0 0 1 1.38 0l10 9.543a1.002 1.002 0 0 1 .31.724V22a1 1 0 0 1-1 1Z"/>
          </svg>
        </button>
        
        {/* Profile - Center */}
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
      </div>
    </nav>
  )
}

export default BottomNavigation
