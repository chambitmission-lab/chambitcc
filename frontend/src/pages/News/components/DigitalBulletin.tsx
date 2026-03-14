import { useState } from 'react'
import './DigitalBulletin.css'

// 임시 목 데이터 (나중에 백엔드에서 받아올 데이터)
const mockBulletinData = {
  date: '2026. 3. 15.',
  title: '2026표어\n너의 마른 뼈들아,\n이제 살아나리라!',
  subtitle: '(에스겔 37:5, 10)',
  
  worship: {
    schedule: [
      { name: '1부 예배', time: '오전 7:30', preacher: '배닛시 목사' },
      { name: '2부 예배', time: '오전 9:30', preacher: '배닛시 목사' },
      { name: '3부 예배', time: '오전 11:20', preacher: '안수현 목사' },
      { name: '4부 예배', time: '오후 1:30', preacher: '안수현 목사' }
    ],
    hymn: '오 하나님 그 빛난 얼굴 보고도 두는 줄로 나아가리',
    scripture: '다함께 (사랑의 시도신경)',
    offering: '456장 / 15장',
    prayer: '김정한 집사 / 김원만 장로 / 최우경 지배',
    sermon: {
      title: '하나님 나라의 비전과 사명으로 가득한 가정을 꿈꾸다',
      subtitle: 'Home centered Church'
    }
  },
  
  announcements: [
    {
      title: '1. 참빛교회에 오신 모든 분들 주님의 사랑으로 환영합니다.',
      content: '등록을 원하시는 성도님께서는 본당 입구 안내 위원에게 알려주시면 예배드리는 곳 등도록 하겠습니다.'
    },
    {
      title: '2. 새가족 수료식',
      content: '다음 주일(22) 3부 예배 시간에 있습니다.'
    },
    {
      title: '3. 학습·세례·입교 신청',
      content: '여러분 일정을 따라 진행됩니다.\n3층에 비치된 신청서를 작성하여 교역자실로 제출해 주시기 바랍니다.'
    },
    {
      title: '4. 고난주간 행사 안내',
      content: '성도님들의 많은 관심과 참여를 부탁드립니다. (3월30일(월)~4월4일(토))'
    },
    {
      title: '5. 경기도회',
      content: '다음 주일(22) 오후 2시 30분에 당회실에서 모입니다.'
    }
  ],
  
  groups: [
    { name: '구역', leader: '김철수', members: 15, meeting: '매주 수요일' },
    { name: '청년부', leader: '이영희', members: 32, meeting: '매주 토요일' },
    { name: '찬양팀', leader: '박민수', members: 12, meeting: '매주 금요일' }
  ],
  
  weeklySchedule: [
    { day: '월', event: '새벽기도회', time: '오전 5:30', location: '본당' },
    { day: '화', event: '새벽기도회', time: '오전 5:30', location: '본당' },
    { day: '수', event: '수요예배', time: '오후 7:30', location: '본당' },
    { day: '목', event: '새벽기도회', time: '오전 5:30', location: '본당' },
    { day: '금', event: '금요기도회', time: '오후 8:00', location: '본당' }
  ]
}

const DigitalBulletin = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['worship']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="digital-bulletin">
      {/* 헤더 */}
      <div className="digital-bulletin-header">
        <div className="bulletin-date">{mockBulletinData.date}</div>
        <h1 className="bulletin-main-title">{mockBulletinData.title}</h1>
        <p className="bulletin-scripture">{mockBulletinData.subtitle}</p>
      </div>

      {/* 예배 안내 - 기본 펼쳐짐 */}
      <section className="bulletin-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('worship')}
        >
          <div className="section-title">
            <span className="section-icon">🙏</span>
            <h2>주일오전예배</h2>
          </div>
          <span className={`expand-icon ${expandedSections.has('worship') ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.has('worship') && (
          <div className="section-content">
            <div className="worship-schedule">
              {mockBulletinData.worship.schedule.map((service, idx) => (
                <div key={idx} className="worship-service">
                  <div className="service-info">
                    <span className="service-name">{service.name}</span>
                    <span className="service-time">{service.time}</span>
                  </div>
                  <div className="service-preacher">{service.preacher}</div>
                </div>
              ))}
            </div>
            
            <div className="worship-details">
              <div className="detail-item">
                <span className="detail-label">찬송</span>
                <span className="detail-value">{mockBulletinData.worship.offering}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">기도</span>
                <span className="detail-value">{mockBulletinData.worship.prayer}</span>
              </div>
              <div className="detail-item sermon">
                <span className="detail-label">설교</span>
                <div className="sermon-info">
                  <div className="sermon-title">{mockBulletinData.worship.sermon.title}</div>
                  <div className="sermon-subtitle">{mockBulletinData.worship.sermon.subtitle}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 교회 소식 */}
      <section className="bulletin-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('announcements')}
        >
          <div className="section-title">
            <span className="section-icon">📢</span>
            <h2>교회 소식</h2>
          </div>
          <span className={`expand-icon ${expandedSections.has('announcements') ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.has('announcements') && (
          <div className="section-content">
            <div className="announcements-list">
              {mockBulletinData.announcements.map((item, idx) => (
                <div key={idx} className="announcement-item">
                  <h3 className="announcement-title">{item.title}</h3>
                  <p className="announcement-content">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 구역 보고 */}
      <section className="bulletin-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('groups')}
        >
          <div className="section-title">
            <span className="section-icon">👥</span>
            <h2>구역 보고</h2>
          </div>
          <span className={`expand-icon ${expandedSections.has('groups') ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.has('groups') && (
          <div className="section-content">
            <div className="groups-grid">
              {mockBulletinData.groups.map((group, idx) => (
                <div key={idx} className="group-card">
                  <div className="group-name">{group.name}</div>
                  <div className="group-info">
                    <div className="group-detail">
                      <span className="label">구역장</span>
                      <span className="value">{group.leader}</span>
                    </div>
                    <div className="group-detail">
                      <span className="label">인원</span>
                      <span className="value">{group.members}명</span>
                    </div>
                    <div className="group-detail">
                      <span className="label">모임</span>
                      <span className="value">{group.meeting}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 주간 일정 */}
      <section className="bulletin-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('schedule')}
        >
          <div className="section-title">
            <span className="section-icon">📅</span>
            <h2>이번 주 일정</h2>
          </div>
          <span className={`expand-icon ${expandedSections.has('schedule') ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.has('schedule') && (
          <div className="section-content">
            <div className="schedule-list">
              {mockBulletinData.weeklySchedule.map((item, idx) => (
                <div key={idx} className="schedule-item">
                  <div className="schedule-day">{item.day}</div>
                  <div className="schedule-details">
                    <div className="schedule-event">{item.event}</div>
                    <div className="schedule-meta">
                      <span className="schedule-time">{item.time}</span>
                      <span className="schedule-location">{item.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default DigitalBulletin
