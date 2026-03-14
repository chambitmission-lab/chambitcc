import { useState, useEffect } from 'react'
import { getBulletins, getBulletinDetail } from '../../api/bulletin'
import { showToast } from '../../utils/toast'
import type { Bulletin } from '../../types/bulletin'
import InstagramBulletinViewer from './components/InstagramBulletinViewer'
import DigitalBulletin from './components/DigitalBulletin'
import '../../pages/Bulletin/Bulletin.css'

const News = () => {
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'view'>('list')
  const [bulletinType, setBulletinType] = useState<'image' | 'digital'>('image')

  useEffect(() => {
    loadBulletins()
  }, [])

  const loadBulletins = async () => {
    try {
      setLoading(true)
      const data = await getBulletins(0, 20) // 최근 20개 조회
      setBulletins(data)
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
      <InstagramBulletinViewer 
        bulletin={selectedBulletin}
        onClose={handleBack}
      />
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

          {/* 탭 전환 */}
          <div className="bulletin-tabs">
            <button 
              className={`bulletin-tab ${bulletinType === 'image' ? 'active' : ''}`}
              onClick={() => setBulletinType('image')}
            >
              <span className="material-icons-round">image</span>
              이미지 주보
            </button>
            <button 
              className={`bulletin-tab ${bulletinType === 'digital' ? 'active' : ''}`}
              onClick={() => setBulletinType('digital')}
            >
              <span className="material-icons-round">article</span>
              디지털 주보
            </button>
          </div>

          {/* 이미지 주보 */}
          {bulletinType === 'image' && (
            <>
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
                      {bulletin.thumbnail_url && (
                        <div className="bulletin-thumbnail">
                          <img 
                            src={bulletin.thumbnail_url} 
                            alt={bulletin.title}
                          />
                          <div className="page-badge">
                            {bulletin.page_count}페이지
                          </div>
                        </div>
                      )}
                      
                      <div className="bulletin-info">
                        <h3 className="bulletin-title">{bulletin.title}</h3>
                        {bulletin.description && (
                          <p className="bulletin-description">{bulletin.description}</p>
                        )}
                        <div className="bulletin-meta">
                          <div className="bulletin-date">
                            {new Date(bulletin.bulletin_date).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="bulletin-views">👁️ {bulletin.views}</div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* 디지털 주보 */}
          {bulletinType === 'digital' && <DigitalBulletin />}
        </div>
      </div>
    </div>
  )
}

export default News
