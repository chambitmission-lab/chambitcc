import { useState } from 'react'

const WorshipTimes = () => {
  const [activeTab, setActiveTab] = useState<'sunday' | 'weekday'>('sunday')

  return (
    <section className="worship-times" id="worship-times">
      <div className="container">
        <h2 className="section-title center">예배 시간</h2>
        
        {/* 모바일 탭 네비게이션 */}
        <div className="worship-tabs">
          <button 
            className={`worship-tab ${activeTab === 'sunday' ? 'active' : ''}`}
            onClick={() => setActiveTab('sunday')}
          >
            주일예배
          </button>
          <button 
            className={`worship-tab ${activeTab === 'weekday' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekday')}
          >
            주중예배
          </button>
        </div>

        <div className={`worship-section ${activeTab === 'sunday' ? 'mobile-active' : 'mobile-hidden'}`}>
          <h3 className="worship-section-title">주일예배</h3>
          <div className="worship-grid">
            <div className="worship-card">
              <div className="card-icon">1부</div>
              <h3>주일 1부</h3>
              <p className="time">오전 7:30</p>
              <p className="location">오르엘홀</p>
            </div>
            <div className="worship-card">
              <div className="card-icon">2부</div>
              <h3>주일 2부</h3>
              <p className="time">오전 9:20</p>
              <p className="location">본당</p>
            </div>
            <div className="worship-card">
              <div className="card-icon">3부</div>
              <h3>주일 3부</h3>
              <p className="time">오전 11:20</p>
              <p className="location">본당</p>
            </div>
            <div className="worship-card">
              <div className="card-icon">4부</div>
              <h3>주일 4부</h3>
              <p className="time">오후 1:30</p>
              <p className="location">본당</p>
            </div>
          </div>
        </div>

        <div className={`worship-section ${activeTab === 'weekday' ? 'mobile-active' : 'mobile-hidden'}`}>
          <h3 className="worship-section-title">주중예배</h3>
          <div className="worship-grid">
            <div className="worship-card">
              <div className="card-icon-text">새벽</div>
              <h3>새벽기도회</h3>
              <p className="time">오전 5:30</p>
              <p className="location">오르엘홀</p>
            </div>
            <div className="worship-card">
              <div className="card-icon-text">수요</div>
              <h3>수요기도회</h3>
              <p className="time">오전 10:30 / 오후 7:30</p>
              <p className="location">오르엘홀 / 본당</p>
            </div>
            <div className="worship-card">
              <div className="card-icon-text">금요</div>
              <h3>금요기도회</h3>
              <p className="time">오후 8:30</p>
              <p className="location">본당</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WorshipTimes
