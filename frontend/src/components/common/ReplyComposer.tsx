// 댓글 작성 컴포넌트 (Single Responsibility: 댓글 입력만 담당)
import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useProfileDetail } from '../../hooks/useProfile'
import { ANIMATED_EMOJIS, AnimatedEmojiImg } from './animatedEmoji'

interface ReplyComposerProps {
  onSubmit: (content: string, displayName: string) => void
  isSubmitting: boolean
}

const ReplyComposer = ({ onSubmit, isSubmitting }: ReplyComposerProps) => {
  const { t } = useLanguage()
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [showStickers, setShowStickers] = useState(false)
  const isLoggedIn = !!localStorage.getItem('access_token')

  // 프로필 사진 — 캐시된 프로필 상세에서 (미등록/비로그인 시 null → 이니셜 아바타)
  const { data: profileDetail } = useProfileDetail()
  const avatarUrl = profileDetail?.stats.avatar_url ?? null

  // 로그인한 사용자 이름 가져오기
  // 로그인 응답에 full_name이 없으면 localStorage에 이름이 저장되지 않으므로
  // 프로필 상세(stats.full_name)를 최우선으로 사용한다 — 실제 노출도 이름 기준
  const getUserName = (): string => {
    if (!isLoggedIn || isAnonymous) return '익명'

    const fullName =
      profileDetail?.stats.full_name || localStorage.getItem('user_full_name')
    const username = localStorage.getItem('user_username')

    return fullName || username || '익명'
  }

  const displayName = getUserName()
  // 화면 표시용 이름 — 데이터 값('익명')은 그대로 두고 골방 기도자로 보여준다 (마 6:6)
  const shownName = isAnonymous ? t('anonymousDisplayName') : displayName

  // 로그인 상태가 아니면 항상 익명
  useEffect(() => {
    if (!isLoggedIn) {
      setIsAnonymous(true)
    }
  }, [isLoggedIn])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    if (!isLoggedIn) {
      alert('로그인이 필요합니다')
      return
    }

    onSubmit(content.trim(), displayName)

    // 폼 초기화
    setContent('')
    setShowStickers(false)
  }

  return (
    <form onSubmit={handleSubmit} className="reply-composer">
      <div className="flex items-start gap-3">
        {isAnonymous ? (
          /* 골방 기도자 — 피드/작성 모달과 동일한 뉴트럴 아바타 */
          <div className="mt-0.5 w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-400 dark:text-gray-500 shadow-[0_0_0_1px_var(--card-border)] flex-shrink-0">
            <span className="material-icons-outlined text-[18px]">person</span>
          </div>
        ) : avatarUrl ? (
          /* 프로필 사진 아바타 */
          <img
            src={avatarUrl}
            alt=""
            className="mt-0.5 w-9 h-9 rounded-full object-cover shadow-[0_0_0_1px_var(--card-border)] flex-shrink-0"
          />
        ) : (
          /* 사진 미등록 시 이니셜 아바타 — 피드 아바타와 같은 브랜드 채움 */
          <div className="mt-0.5 w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-sm font-semibold shadow-[0_2px_10px_var(--brand-glow)] flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isLoggedIn ? "함께 기도하는 마음을 전해주세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
            className="w-full px-4 py-4 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-glow)] resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            rows={3}
            disabled={isSubmitting || !isLoggedIn}
          />

          {/* 움직이는 이모티콘 피커 — 문자는 일반 이모지로 입력되고 표시 시 애니메이션으로 그려진다 */}
          {showStickers && (
            <div className="mt-2 p-2.5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark grid grid-cols-8 gap-0.5">
              {ANIMATED_EMOJIS.map((e) => (
                <button
                  key={e.code}
                  type="button"
                  aria-label={e.label}
                  disabled={isSubmitting || !isLoggedIn}
                  onClick={() => setContent((c) => c + e.char)}
                  className="h-10 flex items-center justify-center rounded-lg hover:bg-[var(--brand-soft)] active:scale-90 transition-all disabled:opacity-50"
                >
                  <AnimatedEmojiImg emoji={e} size={28} />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 mt-4">
            <button
              type="button"
              aria-label="움직이는 이모티콘"
              aria-expanded={showStickers}
              disabled={isSubmitting || !isLoggedIn}
              onClick={() => setShowStickers((v) => !v)}
              className={`flex-shrink-0 w-8 h-8 -ml-1 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
                showStickers
                  ? 'text-[var(--brand)] bg-[var(--brand-soft)]'
                  : 'text-gray-400 dark:text-gray-500 hover:text-[var(--brand)]'
              }`}
            >
              <span className="material-icons-round text-[22px]">mood</span>
            </button>
            {isLoggedIn ? (
              <label className="flex items-center gap-2 cursor-pointer py-1 min-w-0 mr-auto">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 shrink-0 text-[var(--brand)] border-gray-300 dark:border-gray-600 rounded focus:ring-[var(--brand)]"
                  disabled={isSubmitting}
                />
                {/* 익명 체크 시 괄호 이름은 라벨과 중복이라 생략 — 실명 작성일 때만 노출 이름을 보여준다.
                 * 좁은 화면에서는 두 줄까지 허용하되 "(골방 기도/자)"처럼 단어 중간이 아니라
                 * 어절 경계에서 꺾이고, "(이름)" 묶음은 통째로 다음 줄로 내려간다 */}
                <span className="text-sm text-gray-600 dark:text-gray-400 break-keep">
                  {t('prayerComposerAnonymous')}
                  {!isAnonymous && (
                    <>
                      {' '}
                      <span className="font-semibold text-[var(--brand)] whitespace-nowrap">
                        ({shownName})
                      </span>
                    </>
                  )}
                </span>
              </label>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={!content.trim() || isSubmitting || !isLoggedIn}
              className="flex-shrink-0 px-5 py-2 text-sm brand-gradient font-semibold rounded-full shadow-[0_4px_14px_-4px_var(--brand-glow)] hover:shadow-[0_6px_18px_-4px_var(--brand-glow)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '작성중...' : isLoggedIn ? '댓글 작성' : '로그인이 필요합니다'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default ReplyComposer
