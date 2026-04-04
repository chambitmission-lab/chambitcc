import { useLanguage } from '../../../contexts/LanguageContext'

interface ChapterNavigationProps {
  selectedBook: string
  selectedChapter: number
  totalChapters: number
  onChapterChange: (chapter: number) => void
  onBackToBooks: () => void
}

const ChapterNavigation = ({
  selectedBook,
  selectedChapter,
  totalChapters,
  onChapterChange,
  onBackToBooks
}: ChapterNavigationProps) => {
  const { language } = useLanguage()
  
  const texts = {
    ko: { prevChapter: '이전 장', nextChapter: '다음 장' },
    en: { prevChapter: 'Previous', nextChapter: 'Next' }
  }
  
  const t = texts[language]
  
  return (
    <>
      {/* 책 정보 헤더 */}
      <div className="book-header">
        <button className="back-button" onClick={onBackToBooks}>
          <span className="material-icons-round">arrow_back</span>
        </button>
        <div className="book-info">
          <h2 className="book-title">{selectedBook}</h2>
          <p className="book-progress">
            {selectedChapter}장 / {totalChapters}장
          </p>
        </div>
      </div>
      
      {/* 장 네비게이션 */}
      <div className="chapter-navigation">
        <button 
          className="nav-button prev"
          onClick={() => onChapterChange(selectedChapter - 1)}
          disabled={selectedChapter === 1}
          title={t.prevChapter}
        >
          <span className="material-icons-round">chevron_left</span>
        </button>
        
        <div className="chapter-dropdown">
          <select 
            value={selectedChapter}
            onChange={(e) => onChapterChange(Number(e.target.value))}
            className="chapter-select"
          >
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map(ch => (
              <option key={ch} value={ch}>{ch}장</option>
            ))}
          </select>
        </div>
        
        <button 
          className="nav-button next"
          onClick={() => onChapterChange(selectedChapter + 1)}
          disabled={selectedChapter === totalChapters}
          title={t.nextChapter}
        >
          <span className="material-icons-round">chevron_right</span>
        </button>
      </div>
    </>
  )
}

export default ChapterNavigation
