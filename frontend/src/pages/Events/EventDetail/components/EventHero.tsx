interface EventHeroProps {
  category: string
  title: string
}

export const EventHero = ({ category, title }: EventHeroProps) => {
  return (
    <div className="event-detail-hero">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <div className="hero-badge">{category}</div>
        <h1 className="hero-title">{title}</h1>
      </div>
    </div>
  )
}
