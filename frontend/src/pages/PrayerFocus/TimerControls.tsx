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
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all group"
        >
          <span className="material-icons-outlined text-3xl">pause</span>
        </button>
      )}

      {isPaused && (
        <button
          onClick={onResume}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center transition-all shadow-[0_10px_15px_-3px_rgba(168,85,247,0.3),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_6px_rgba(0,0,0,0.2)] group"
        >
          <span className="material-icons-outlined text-3xl">play_arrow</span>
        </button>
      )}

      <button
        onClick={onReset}
        className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all group"
      >
        <span className="material-icons-outlined text-3xl">refresh</span>
      </button>
    </div>
  )
}

export default TimerControls
