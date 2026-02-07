import { useState, useEffect } from 'react'
import { getBulletins, getBulletinDetail } from '../../api/bulletin'
import { showToast } from '../../utils/toast'
import type { Bulletin } from '../../types/bulletin'
import '../../pages/Bulletin/Bulletin.css'

const News = () => {
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'view'>('list')

  useEffect(() => {
    loadBulletins()
  }, [])

  const loadBulletins = async () => {
    try {
      setLoading(true)
      const data = await getBulletins()
      setBulletins(data.bulletins || [])
    } catch (error) {
      console.error('주보 로드 에러:', error)
      showToast(error instanceof Error ? error.message : '주보를 불러오는데 실패했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBulletinClick = async (bulletin: Bulletin) => {
    try {
      const detail = await getBulletinDetail(bulletin.id)
      setSelectedBulletin(detail)
      setViewMode('view')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '주보를 불러오는데 실패했습니다', 'error')
    }
  }

  const handleBack = () => {
    setSelectedBulletin(null)
    setViewMode('list')
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-black min-h-screen">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
          <div className="bulletin-container">
            <div className="loading-spinner">로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'view' && selectedBulletin) {
    return (
      <div className="bg-gray-50 dark:bg-black min-h-screen">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
          <div className="bulletin-viewer">
            <div className="viewer-header">
              <button onClick={handleBack} className="back-button">
                <span className="material-icons">arrow_back</span>
                <span>목록으로</span>
              </button>
              <div className="viewer-title">
                <h1>{selectedBulletin.title}</h1>
                <p className="viewer-date">
                  {new Date(selectedBulletin.bulletin_date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="viewer-content">
              {selectedBulletin.pages
                .sort((a, b) => a.page_number - b.page_number)
                .map((page) => (
                  <div key={page.page_number} className="bulletin-page">
                    <img 
                      src={page.image_data} 
                      alt={`페이지 ${page.page_number}`}
                      loading="lazy"
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        <div className="bulletin-container">
          <div className="bulletin-header">
            <h1>📰 교회소식 · 주보</h1>
            <p className="bulletin-subtitle">참빛교회 주간 소식</p>
          </div>

          {bulletins.length === 0 ? (
            <div className="bulletin-empty">
              <div className="empty-icon">📰</div>
              <p>등록된 주보가 없습니다</p>
            </div>
          ) : (
            <div className="bulletin-grid">
              {bulletins.map((bulletin) => (
                <article 
                  key={bulletin.id} 
                  className="bulletin-card"
                  onClick={() => handleBulletinClick(bulletin)}
                >
                  {bulletin.pages && bulletin.pages.length > 0 && (
                    <div className="bulletin-thumbnail">
                      <img 
                        src={bulletin.pages[0].image_data} 
                        alt={bulletin.title}
                      />
                      <div className="page-badge">
                        {bulletin.pages.length}페이지
                      </div>
                    </div>
                  )}
                  
                  <div className="bulletin-info">
                    <h3 className="bulletin-title">{bulletin.title}</h3>
                    {bulletin.description && (
                      <p className="bulletin-description">{bulletin.description}</p>
                    )}
                    <div className="bulletin-date">
                      {new Date(bulletin.bulletin_date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default News
