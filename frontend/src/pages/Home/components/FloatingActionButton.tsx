interface FloatingActionButtonProps {
  onClick: () => void
}

const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => {
  return (
    <div className="absolute bottom-24 right-5 md:hidden z-40">
      <button
        onClick={onClick}
        className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center text-white hover:scale-105 transition-all active:scale-95"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  )
}

export default FloatingActionButton
