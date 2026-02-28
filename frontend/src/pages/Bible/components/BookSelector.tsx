import { useLanguage } from '../../../contexts/LanguageContext'
import type { BibleBook } from '../../../types/bible'

interface BookSelectorProps {
  books: BibleBook[] | undefined
  isLoading: boolean
  error: Error | null
  onBookSelect: (bookId: number, bookName: string) => void
}

const BookSelector = ({ books, isLoading, error, onBookSelect }: BookSelectorProps) => {
  const { language } = useLanguage()
  
  const texts = {
    ko: {
      selectBook: '책 선택',
      oldTestament: '구약',
      newTestament: '신약',
      loadingBooks: '성경 책 목록을 불러오는 중...',
      errorBooks: '성경 책 목록을 불러오는데 실패했습니다. 백엔드 API를 확인해주세요.',
      noBooks: '성경 책 데이터가 없습니다.',
    },
    en: {
      selectBook: 'Select Book',
      oldTestament: 'Old Testament',
      newTestament: 'New Testament',
      loadingBooks: 'Loading bible books...',
      errorBooks: 'Failed to load bible books. Please check backend API.',
      noBooks: 'No bible book data available.',
    }
  }
  
  const t = texts[language]
  
  const oldTestament = books?.filter(b => b.testament === 'OLD') || []
  const newTestament = books?.filter(b => b.testament === 'NEW') || []
  
  if (isLoading) {
    return (
      <div className="bible-books-section">
        <h2 className="section-title">{t.selectBook}</h2>
        <div className="loading-spinner">
          <span className="material-icons-round spinning">refresh</span>
          <p style={{ marginTop: '1rem', color: 'var(--ig-secondary-text)' }}>
            {t.loadingBooks}
          </p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bible-books-section">
        <h2 className="section-title">{t.selectBook}</h2>
        <div className="no-results">
          <span className="material-icons-round">error_outline</span>
          <p>{t.errorBooks}</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Error: {error.message}
          </p>
        </div>
      </div>
    )
  }
  
  if (!books || books.length === 0) {
    return (
      <div className="bible-books-section">
        <h2 className="section-title">{t.selectBook}</h2>
        <div className="no-results">
          <span className="material-icons-round">menu_book</span>
          <p>{t.noBooks}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bible-books-section">
      <h2 className="section-title">{t.selectBook}</h2>
      
      <div className="testament-section">
        <h3 className="testament-title">{t.oldTestament} ({oldTestament.length})</h3>
        <div className="books-grid">
          {oldTestament.map(book => (
            <button
              key={book.id}
              className="book-button"
              onClick={() => onBookSelect(book.id, book.book_name_ko)}
            >
              {book.book_name_ko}
            </button>
          ))}
        </div>
      </div>
      
      <div className="testament-section">
        <h3 className="testament-title">{t.newTestament} ({newTestament.length})</h3>
        <div className="books-grid">
          {newTestament.map(book => (
            <button
              key={book.id}
              className="book-button"
              onClick={() => onBookSelect(book.id, book.book_name_ko)}
            >
              {book.book_name_ko}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BookSelector
