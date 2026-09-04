import { useState } from 'react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAuth } from '../../../hooks/useAuth'
import { bookmarkKeys, useUpsertBookmark } from '../../../hooks/useBibleBookmark'
import { getBookmark } from '../../../api/bibleBookmark'
import type { BibleVerse } from '../../../types/bible'
import { HeartIcon, VerseCardIcon } from '../../../components/icons/ActionIcons'
import { showToast } from '../../../utils/toast'
import { copyVerses } from './verseCopy'

interface SearchVerseCardProps {
  verse: BibleVerse
  bookNumber: number
  bookNameKo: string
  /** 매칭 키워드 하이라이트가 입혀진 본문 */
  children: ReactNode
  onOpen: () => void
}

/** 복사 — 겹친 두 장 (Lucide copy 문법, 스트로크 1.8) */
const CopyIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
)

/**
 * 검색 결과의 절 카드 — 카드 전체는 그 절로 이동, 우측 액션은 이동 없이 바로 처리.
 * - 복사: 읽기 화면과 같은 포맷터(출처·딥링크 설정 공유)
 * - 즐겨찾기: 누를 때 기존 북마크를 한 번 읽어 메모·형광펜을 지우지 않고 is_favorite만 토글
 *   (카드마다 미리 조회하면 페이지당 30건의 N+1이라 눌렀을 때만 읽는다)
 * - 말씀 카드: 사진 위에 이 절을 얹는 화면으로 절을 미리 채워 진입
 */
const SearchVerseCard = ({ verse, bookNumber, bookNameKo, children, onOpen }: SearchVerseCardProps) => {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isLoggedIn } = useAuth()
  const upsert = useUpsertBookmark(verse.id)
  // null = 아직 모름(조회 전). 누른 뒤에는 서버 상태를 그대로 따른다
  const [favorite, setFavorite] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  const t = {
    ko: {
      copy: '복사',
      favorite: '즐겨찾기',
      unfavorite: '즐겨찾기 해제',
      card: '말씀 카드 만들기',
      loginNeeded: '로그인하면 즐겨찾기할 수 있어요',
      favAdded: (ref: string) => `${ref} 즐겨찾기에 담았어요`,
      favRemoved: (ref: string) => `${ref} 즐겨찾기를 해제했어요`,
      favFailed: '즐겨찾기 저장에 실패했어요',
    },
    en: {
      copy: 'Copy',
      favorite: 'Favorite',
      unfavorite: 'Remove favorite',
      card: 'Make a verse card',
      loginNeeded: 'Sign in to save favorites',
      favAdded: (ref: string) => `Added ${ref} to favorites`,
      favRemoved: (ref: string) => `Removed ${ref} from favorites`,
      favFailed: 'Could not save favorite',
    },
  }[language]

  const refLabel = `${bookNameKo} ${verse.chapter}:${verse.verse}`

  const stop = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation()
  }

  const handleCopy = (e: MouseEvent<HTMLButtonElement>) => {
    stop(e)
    void copyVerses({
      bookNameKo,
      bookNumber,
      chapter: verse.chapter,
      verses: [{ verse: verse.verse, text: verse.text }],
    })
  }

  const handleFavorite = async (e: MouseEvent<HTMLButtonElement>) => {
    stop(e)
    if (!isLoggedIn()) {
      showToast(t.loginNeeded, 'info')
      return
    }
    if (busy) return
    setBusy(true)
    try {
      const existing = await queryClient.fetchQuery({
        queryKey: bookmarkKeys.detail(verse.id),
        queryFn: () => getBookmark(verse.id),
        staleTime: 60 * 1000,
      })
      const next = !(favorite ?? existing?.is_favorite ?? false)
      await upsert.mutateAsync({
        highlight_color: existing?.highlight_color ?? null,
        note: existing?.note ?? null,
        is_favorite: next,
      })
      setFavorite(next)
      showToast(next ? t.favAdded(refLabel) : t.favRemoved(refLabel), 'success')
    } catch {
      showToast(t.favFailed, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleCard = (e: MouseEvent<HTMLButtonElement>) => {
    stop(e)
    navigate('/bible/photo-verse', { state: { presetVerse: { text: verse.text, refLabel } } })
  }

  return (
    <div
      className="bible-verse-item bible-verse-item--search"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="search-verse-head">
        <div className="bible-verse-reference">{refLabel}</div>
        {/* 액션은 카드의 클릭·키보드 이벤트를 삼켜 이동을 막는다 */}
        <div className="search-verse-actions" onKeyDown={stop}>
          <button type="button" className="search-verse-action" aria-label={t.copy} title={t.copy} onClick={handleCopy}>
            <CopyIcon />
          </button>
          <button
            type="button"
            className={`search-verse-action${favorite ? ' search-verse-action--on' : ''}`}
            aria-label={favorite ? t.unfavorite : t.favorite}
            aria-pressed={favorite ?? false}
            title={favorite ? t.unfavorite : t.favorite}
            disabled={busy}
            onClick={handleFavorite}
          >
            <HeartIcon size={16} filled={!!favorite} />
          </button>
          <button type="button" className="search-verse-action" aria-label={t.card} title={t.card} onClick={handleCard}>
            <VerseCardIcon size={16} />
          </button>
        </div>
      </div>
      <div className="bible-verse-text">{children}</div>
    </div>
  )
}

export default SearchVerseCard
