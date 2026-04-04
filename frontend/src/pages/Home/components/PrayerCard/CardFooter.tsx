interface CardFooterProps {
  prayerCount: number
  replyCount: number
  isPrayed: boolean
  isPraying: boolean
  onPrayClick: () => void
}

const CardFooter = ({
  prayerCount,
  replyCount,
  isPrayed,
  isPraying,
  onPrayClick,
}: CardFooterProps) => {
  return (
    <div className="card-footer">
      <button
        className={`prayer-button ${isPrayed ? 'prayed' : ''}`}
        onClick={onPrayClick}
        disabled={isPraying}
      >
        <span className="prayer-icon">🙏</span>
        <span className="prayer-count">{prayerCount}</span>
      </button>

      <div className="card-stats">
        <span className="stat-item">
          💬 {replyCount}
        </span>
      </div>
    </div>
  )
}

export default CardFooter
