// 설교 내용 포맷터 - 섹션별 접기/펼치기 기능
import React, { useState } from 'react'

interface SermonContentFormatterProps {
  content: string
}

interface SermonSection {
  title: string
  content: string
}

const SermonContentFormatter: React.FC<SermonContentFormatterProps> = ({ content }) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0])) // 첫 번째 섹션은 기본 열림
  
  // 설교 내용을 섹션별로 파싱
  const parseContent = (text: string): SermonSection[] => {
    const sections: SermonSection[] = []
    
    // [제목] 패턴으로 분리
    const parts = text.split(/(\[[^\]]+\])/)
    
    let currentTitle = ''
    let currentContent = ''
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim()
      if (!part) continue
      
      // 제목인 경우
      if (part.startsWith('[') && part.endsWith(']')) {
        // 이전 섹션 저장
        if (currentTitle || currentContent) {
          sections.push({
            title: currentTitle || '서론',
            content: currentContent.trim()
          })
        }
        // 새 섹션 시작
        currentTitle = part.slice(1, -1) // 대괄호 제거
        currentContent = ''
      } else {
        // 내용인 경우
        currentContent += part + '\n\n'
      }
    }
    
    // 마지막 섹션 저장
    if (currentTitle || currentContent) {
      sections.push({
        title: currentTitle || '본문',
        content: currentContent.trim()
      })
    }
    
    // 섹션이 없으면 전체를 하나의 섹션으로
    if (sections.length === 0 && text.trim()) {
      sections.push({
        title: '설교 내용',
        content: text.trim()
      })
    }
    
    return sections
  }
  
  const sections = parseContent(content)
  
  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }
  
  // 중요 키워드 하이라이트
  const highlightKeywords = (text: string) => {
    const keywords = ['하나님', '예수님', '성령님', '그리스도', '주님', '사랑', '은혜', '믿음', '소망', '구원', '축복']
    const biblePattern = /([가-힣]+\s*\d+(?:장|:)\s*\d+(?:절|편)?(?:-\d+(?:절|편)?)?)/g
    
    let result = text
    
    // 성경 구절 하이라이트
    result = result.replace(biblePattern, '<span class="sermon-bible-ref">$1</span>')
    
    // 키워드 하이라이트
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'g')
      result = result.replace(regex, '<span class="sermon-emphasis">$1</span>')
    })
    
    return result
  }

  return (
    <div className="sermon-accordion">
      {sections.map((section, index) => {
        const isExpanded = expandedSections.has(index)
        
        return (
          <div key={index} className="sermon-section">
            <button
              className="sermon-section-header"
              onClick={() => toggleSection(index)}
            >
              <div className="sermon-section-title-wrapper">
                <span className="sermon-section-icon">
                  {isExpanded ? '📖' : '📚'}
                </span>
                <span className="sermon-section-title">{section.title}</span>
              </div>
              <span className={`sermon-section-arrow ${isExpanded ? 'expanded' : ''}`}>
                ▼
              </span>
            </button>
            
            {isExpanded && (
              <div className="sermon-section-content">
                <div 
                  className="sermon-section-text"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightKeywords(section.content).replace(/\n/g, '<br/>') 
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
      
      <style>{`
        .sermon-accordion {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .sermon-section {
          border: 1px solid #efefef;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
        }
        
        .dark .sermon-section {
          border-color: #262626;
        }
        
        .sermon-section-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        
        .sermon-section-header:hover {
          background: #f9f9f9;
        }
        
        .dark .sermon-section-header:hover {
          background: #1a1a1a;
        }
        
        .sermon-section-header:active {
          background: #f0f0f0;
        }
        
        .dark .sermon-section-header:active {
          background: #0a0a0a;
        }
        
        .sermon-section-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex: 1;
        }
        
        .sermon-section-icon {
          font-size: 1.125rem;
          flex-shrink: 0;
        }
        
        .sermon-section-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #0095f6;
          flex: 1;
        }
        
        .dark .sermon-section-title {
          color: #3b82f6;
        }
        
        .sermon-section-arrow {
          font-size: 0.75rem;
          color: #8e8e8e;
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        
        .sermon-section-arrow.expanded {
          transform: rotate(180deg);
        }
        
        .sermon-section-content {
          padding: 0 1rem 1rem 1rem;
          animation: slideDown 0.2s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .sermon-section-text {
          color: #262626;
          font-size: 0.9375rem;
          line-height: 1.8;
          letter-spacing: -0.01em;
        }
        
        .dark .sermon-section-text {
          color: #e5e7eb;
        }
        
        .sermon-bible-ref {
          color: #8b5cf6;
          font-weight: 600;
          background: rgba(139, 92, 246, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        
        .dark .sermon-bible-ref {
          color: #a78bfa;
          background: rgba(167, 139, 250, 0.15);
        }
        
        .sermon-emphasis {
          color: #ea580c;
          font-weight: 600;
        }
        
        .dark .sermon-emphasis {
          color: #fb923c;
        }
      `}</style>
    </div>
  )
}

export default SermonContentFormatter
