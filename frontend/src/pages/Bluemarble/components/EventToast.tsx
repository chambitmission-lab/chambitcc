import { useEffect } from 'react'

interface Props {
  message: string
  variant?: 'bonus' | 'rest' | 'warp' | 'lap' | 'finish' | 'info'
  scoreDelta?: number
  duration?: number
  onClose: () => void
}

export default function EventToast({
  message,
  variant = 'info',
  scoreDelta,
  duration = 2200,
  onClose,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  const ICONS: Record<string, string> = {
    bonus: '🎁',
    rest: '🛌',
    warp: '🌪️',
    lap: '🏁',
    finish: '🏆',
    info: '✨',
  }

  return (
    <div className={`bm-toast bm-toast-${variant}`}>
      <span className="bm-toast-icon">{ICONS[variant]}</span>
      <div className="bm-toast-body">
        <div className="bm-toast-msg">{message}</div>
        {scoreDelta != null && scoreDelta !== 0 && (
          <div className={`bm-toast-points ${scoreDelta > 0 ? 'positive' : 'negative'}`}>
            {scoreDelta > 0 ? '+' : ''}
            {scoreDelta}pt
          </div>
        )}
      </div>
    </div>
  )
}
