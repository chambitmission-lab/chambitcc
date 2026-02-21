interface TimerControlsProps {
  isRunning: boolean
  isPaused: boolean
  onPause: () => void
  onResume: () => void
  onReset: () => void
}

const TimerControls = ({ isRunning, isPaused, onPause, onResume, onReset }: TimerControlsProps) => {
  return (
    <div className="flex items-center justify-center gap-4">
      {isRunning && !isPaused && (
        <button
          onClick={onPause}
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all group"
        >
          <span className="material-icons-outlined text-3xl">pause</span>
        </button>
      )}

      {isPaused && (
        <button
          onClick={onResume}
          className="w-16 h-16 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center transition-all shadow-lg shadow-purple-500/50 group"
        >
          <span className="material-icons-outlined text-3xl">play_arrow</span>
        </button>
      )}

      <button
        onClick={onReset}
        className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all group"
      >
        <span className="material-icons-outlined text-3xl">refresh</span>
      </button>
    </div>
  )
}

export default TimerControls
