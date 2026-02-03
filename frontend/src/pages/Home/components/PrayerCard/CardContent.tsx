interface CardContentProps {
  title: string
  content: string
  isExpanded: boolean
  onToggleExpand: () => void
}

const CardContent = ({
  title,
  content,
  isExpanded,
  onToggleExpand,
}: CardContentProps) => {
  const MAX_LENGTH = 120

  const truncateContent = (text: string) => {
    if (text.length <= MAX_LENGTH) return text
    return text.slice(0, MAX_LENGTH) + '...'
  }

  const shouldShowExpandButton = content.length > MAX_LENGTH

  return (
    <>
      <h3 className="card-title">{title}</h3>

      <div className="card-content">
        <p className={`card-text ${isExpanded ? 'expanded' : ''}`}>
          {isExpanded ? content : truncateContent(content)}
        </p>
        {shouldShowExpandButton && (
          <button className="card-expand" onClick={onToggleExpand}>
            {isExpanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
    </>
  )
}

export default CardContent
