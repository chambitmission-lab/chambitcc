// 댓글 작성 컴포넌트 (Single Responsibility: 댓글 입력만 담당)
// 기본은 한 줄 알약(placeholder)로 접혀 있다 — 펼쳐진 큰 입력창이 상세 화면을
// 복잡하게 만든다는 피드백. 탭하면 전체 폼(텍스트영역·이모티콘·익명 체크)이 열린다.
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useProfileDetail } from '../../hooks/useProfile'
import EmojiPickerPanel from './EmojiPickerPanel'
import { showToast } from '../../utils/toast'
import { tokenStore, sessionStore } from '../../utils/tokenStore'

interface ReplyComposerProps {
  onSubmit: (content: string, displayName: string) => void
  isSubmitting: boolean
  /** 펼침/접힘 상태 알림 — 상세 모달이 작성 중에 하단 기도 바를 숨겨 오탭을 막는 데 사용 */
  onExpandedChange?: (expanded: boolean) => void
}

const ReplyComposer = ({ onSubmit, isSubmitting, onExpandedChange }: ReplyComposerProps) => {
  const { t } = useLanguage()
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [showStickers, setShowStickers] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isLoggedIn = !!tokenStore.getAccess()

  // 펼쳐지는 즉시 바로 쓸 수 있게 포커스
  useEffect(() => {
    if (expanded) {
      textareaRef.current?.focus()
    }
    onExpandedChange?.(expanded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  // 빈 채로 폼 밖을 탭하면 다시 접는다 — 작성 의사가 없어졌는데 폼(과 숨겨진
  // 기도 바 상태)만 남아있지 않도록. 초안이 있으면 유지해 내용을 잃지 않는다.
  const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    if (content.trim()) return
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) return
    setShowStickers(false)
    setExpanded(false)
  }

  // 폼 내부 탭(이모지·체크박스 등)은 텍스트영역 포커스를 뺏지 않게 한다 —
  // iOS에서 blur가 클릭보다 먼저 처리돼 접히면서 버튼 클릭이 유실되는 것 방지
  const keepFocusInside = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault()
    }
  }

  // 프로필 사진 — 캐시된 프로필 상세에서 (미등록/비로그인 시 null → 이니셜 아바타)
  const { data: profileDetail } = useProfileDetail()
  const avatarUrl = profileDetail?.stats.avatar_url ?? null

  // 로그인한 사용자 이름 가져오기
  // 로그인 응답에 full_name이 없으면 localStorage에 이름이 저장되지 않으므로
  // 프로필 상세(stats.full_name)를 최우선으로 사용한다 — 실제 노출도 이름 기준
  const getUserName = (): string => {
    if (!isLoggedIn || isAnonymous) return '익명'

    const fullName =
      profileDetail?.stats.full_name || sessionStore.get('fullName')
    const username = sessionStore.get('username')

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
      showToast('로그인이 필요합니다', 'error')
      return
    }

    onSubmit(content.trim(), displayName)

    // 폼 초기화 — 작성 완료 후엔 다시 한 줄로 접는다
    setContent('')
    setShowStickers(false)
    setExpanded(false)
  }

  const avatarEl = isAnonymous ? (
    /* 골방 기도자 — 피드/작성 모달과 동일한 뉴트럴 아바타 */
    <div className="mt-0.5 w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-[0_0_0_1px_var(--card-border)] flex-shrink-0">
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
  )

  // 접힌 상태 — 아바타 + 한 줄 알약. 탭하면 전체 폼으로 펼쳐진다
  if (!expanded) {
    return (
      <div className="flex items-center gap-3">
        {avatarEl}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex-1 text-left px-4 py-2.5 rounded-full text-sm bg-surface-light dark:bg-white/[0.05] border border-border-light dark:border-border-dark text-gray-500 dark:text-gray-400 hover:bg-[var(--brand-soft)] dark:hover:bg-white/[0.08] transition-colors"
        >
          {isLoggedIn
            ? '함께 기도하는 마음을 전해주세요...'
            : '로그인 후 댓글을 작성할 수 있습니다'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} onBlur={handleBlur} onMouseDown={keepFocusInside} className="reply-composer">
      <div className="flex items-start gap-3">
        {avatarEl}

        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isLoggedIn ? "함께 기도하는 마음을 전해주세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
            className="w-full px-4 py-4 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-ink-strong placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-glow)] resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            rows={3}
            disabled={isSubmitting || !isLoggedIn}
          />

          {/* 움직이는 이모티콘 피커 — 문자는 일반 이모지로 입력되고 표시 시 애니메이션으로 그려진다.
           * 자주 쓴 행(로컬 저장) + 카테고리 탭 구성이라 이모지를 계속 늘려도 높이가 안 터진다 */}
          {showStickers && (
            <EmojiPickerPanel
              className="mt-2"
              disabled={isSubmitting || !isLoggedIn}
              onSelect={(char) => setContent((c) => c + char)}
            />
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
                  : 'text-gray-500 dark:text-gray-400 hover:text-[var(--brand)]'
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
