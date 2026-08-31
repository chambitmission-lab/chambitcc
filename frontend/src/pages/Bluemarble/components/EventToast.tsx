import { useEffect } from 'react'
import BmIcon, { type BmIconName } from './BluemarbleIcons'

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

  const ICONS: Record<string, BmIconName> = {
    bonus: 'gift',
    rest: 'rest',
    warp: 'warp',
    lap: 'flag',
    finish: 'trophy',
    info: 'sparkle',
  }

  return (
    <div className={`bm-toast bm-toast-${variant}`}>
      <span className="bm-toast-icon">
        <BmIcon name={ICONS[variant] ?? 'sparkle'} size={22} strokeWidth={1.7} />
      </span>
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
