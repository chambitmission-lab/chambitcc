import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useBibleSearch } from '../../../hooks/useBible'

const BibleSearch = () => {
  const { language } = useLanguage()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data: searchResults, isLoading: searchLoading } = useBibleSearch(searchQuery)
  
  const texts = {
    ko: {
      searchPlaceholder: '검색어를 입력하세요...',
      searchResults: '검색 결과',
      noResults: '검색 결과가 없습니다',
    },
    en: {
      searchPlaceholder: 'Enter search keyword...',
      searchResults: 'Search Results',
      noResults: 'No results found',
    }
  }
  
  const t = texts[language]
  
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchKeyword.trim()) {
      setSearchQuery(searchKeyword.trim())
    }
  }
  
  return (
    <div className="bible-search-section">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="search-input"
          />
          <button type="submit" className="search-button">
            <span className="material-icons-round">search</span>
          </button>
        </div>
      </form>
      
      {searchLoading ? (
        <div className="loading-spinner">
          <span className="material-icons-round spinning">refresh</span>
        </div>
      ) : searchResults ? (
        <div className="search-results">
          <p className="results-count">
            {t.searchResults}: {searchResults.total}개
          </p>
          <div className="verses-list">
            {searchResults.results.map(verse => (
              <div key={verse.id} className="bible-verse-item bible-verse-item--search">
                <div className="bible-verse-reference">
                  {verse.book_name_ko} {verse.chapter}:{verse.verse}
                </div>
                <div className="bible-verse-text">{verse.text}</div>
              </div>
            ))}
          </div>
        </div>
      ) : searchQuery ? (
        <div className="no-results">
          <span className="material-icons-round">search_off</span>
          <p>{t.noResults}</p>
        </div>
      ) : null}
    </div>
  )
}

export default BibleSearch
