// 설교 내용 포맷터 - 섹션별 접기/펼치기 기능
import React, { useState } from 'react'

interface SermonContentFormatterProps {
  content: string
}

interface SermonSection {
  title: string
  content: string
}

/* 플랫 편집 스타일 — 카드 중첩·이모지 없이 헤어라인으로만 섹션을 구분한다.
 * 색은 전부 theme.css 토큰(다크 분기는 토큰이 담당). */
const SERMON_CONTENT_STYLES = `
  .sermon-accordion {
    display: flex;
    flex-direction: column;
  }

  .sermon-section {
    border-top: 1px solid var(--card-border);
  }

  .sermon-section:first-child {
    border-top: none;
  }

  .sermon-section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 0;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .sermon-section-title {
    font-size: 0.9375rem;
    font-weight: 700;
    letter-spacing: -0.015em;
    color: var(--text-strong);
  }

  .sermon-section-header:hover .sermon-section-title {
    color: var(--brand);
  }

  .sermon-section-arrow {
    font-size: 0.7rem;
    color: var(--text-muted);
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .sermon-section-arrow.expanded {
    transform: rotate(180deg);
  }

  .sermon-section-content {
    padding: 0 0 1rem;
    animation: sermon-section-in 0.2s ease-out;
  }

  @keyframes sermon-section-in {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 장시간 읽는 본문 — 행간·자간 여유 */
  .sermon-section-text {
    color: var(--text-body);
    font-size: 15px;
    line-height: 1.9;
    letter-spacing: 0.01em;
    word-break: break-word;
  }

  .sermon-bible-ref {
    color: var(--brand);
    font-weight: 600;
  }

  [data-theme="dark"] .sermon-bible-ref {
    color: var(--brand-muted);
  }

  .sermon-emphasis {
    font-weight: 700;
    color: var(--text-strong);
  }
`

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
  
  // HTML 이스케이프 — dangerouslySetInnerHTML에 넣기 전에 원문의 태그를 무력화해
  // 본문에 섞인 <script> 등이 실행되는 저장형 XSS를 차단한다.
  // 이스케이프 후에 하이라이트 span을 입히므로 주입되는 HTML은 우리가 만든 span뿐이다.
  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  // 중요 키워드 하이라이트
  const highlightKeywords = (text: string) => {
    const keywords = ['하나님', '예수님', '성령님', '그리스도', '주님', '사랑', '은혜', '믿음', '소망', '구원', '축복']
    const biblePattern = /([가-힣]+\s*\d+(?:장|:)\s*\d+(?:절|편)?(?:-\d+(?:절|편)?)?)/g

    let result = escapeHtml(text)

    // 성경 구절 하이라이트
    result = result.replace(biblePattern, '<span class="sermon-bible-ref">$1</span>')
    
    // 키워드 하이라이트
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'g')
      result = result.replace(regex, '<span class="sermon-emphasis">$1</span>')
    })
    
    return result
  }

  // [제목] 구분이 없는 본문은 아코디언 없이 프로즈로만 — "설교 내용" 헤더 아래
  // 같은 이름의 접기 헤더가 또 생기는 중복을 막는다
  if (sections.length === 1) {
    return (
      <div className="sermon-accordion">
        <div
          className="sermon-section-text"
          dangerouslySetInnerHTML={{
            __html: highlightKeywords(sections[0].content).replace(/\n/g, '<br/>'),
          }}
        />
        <style>{SERMON_CONTENT_STYLES}</style>
      </div>
    )
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
              <span className="sermon-section-title">{section.title}</span>
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
      
      <style>{SERMON_CONTENT_STYLES}</style>
    </div>
  )
}

export default SermonContentFormatter
