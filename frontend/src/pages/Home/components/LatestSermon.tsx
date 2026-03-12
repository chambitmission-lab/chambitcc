import { useSermons } from '../../../hooks/useSermons'

const LatestSermon = () => {
  const { data: sermons, isLoading } = useSermons(0, 1)
  const latestSermon = sermons?.[0]

  // YouTube Video ID 추출
  const extractYouTubeVideoId = (url: string): string | null => {
    if (!url) return null
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  if (isLoading || !latestSermon) {
    return null
  }

  const videoId = latestSermon.video_url ? extractYouTubeVideoId(latestSermon.video_url) : null

  return (
    <section className="latest-sermon">
      <div className="container">
        <div className="sermon-content">
          <div className="sermon-info">
            <span className="section-label">Latest Sermon</span>
            <h2 className="section-title">최근 설교</h2>
            <h3 className="sermon-title">{latestSermon.title}</h3>
            <p className="sermon-verse">{latestSermon.bible_verse}</p>
            <div className="sermon-meta">
              <span>{latestSermon.pastor}</span>
              <span>•</span>
              <span>{formatDate(latestSermon.sermon_date)}</span>
            </div>
            {latestSermon.video_url && (
              <div className="sermon-actions">
                <a 
                  href={latestSermon.video_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  유튜브에서 보기
                </a>
              </div>
            )}
          </div>
          {videoId && (
            <div className="sermon-thumbnail">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="최근 설교"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="sermon-video"
              ></iframe>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default LatestSermon
