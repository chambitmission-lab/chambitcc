// 그룹 생성/가입 모달 — 다크 합의 토큰 (purple→pink, #1c1c26 솔리드, outline X 버튼)
import { useState, type ReactNode } from 'react'
import { useCreateGroup, useJoinGroup } from '../../hooks/useGroups'
import { useLanguage } from '../../contexts/LanguageContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { showToast } from '../../utils/toast'
import type { PrayerGroup } from '../../types/prayer'

const ICON_OPTIONS = ['🙏', '⛪', '✝️', '🎵', '📖', '💒', '👥', '🕊️', '🌟', '❤️']

// ── 공통 모달 셸 ──────────────────────────────────────
interface ModalShellProps {
  title: string
  onClose: () => void
  children: ReactNode
}

const ModalShell = ({ title, onClose, children }: ModalShellProps) => {
  // 뒤로가기 → 모달만 닫기 (Create/Join 공통)
  useModalBackButton(onClose)

  return (
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
    onClick={onClose}
  >
    <div
      className="relative w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="hidden dark:block absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-400/10 dark:from-pink-500/10 dark:to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
        <h2 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
          aria-label="닫기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
    </div>
  </div>
  )
}

// ── Create Group ──────────────────────────────────────
interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateGroupModal = ({ isOpen, onClose }: CreateGroupModalProps) => {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🙏')
  const [createdGroup, setCreatedGroup] = useState<PrayerGroup | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const createMutation = useCreateGroup()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    try {
      const result = await createMutation.mutateAsync({ name, description, icon })
      setCreatedGroup(result.data)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('이미 존재하는 그룹 이름')) {
        setErrorMessage(t('groupExistsError'))
      } else {
        setErrorMessage(message || t('groupCreateFailed'))
      }
    }
  }

  const handleCopyCode = async () => {
    if (!createdGroup?.invite_code) return
    try {
      await navigator.clipboard.writeText(createdGroup.invite_code)
      showToast(t('inviteCodeCopied'), 'success')
    } catch {
      showToast('복사에 실패했습니다', 'error')
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setIcon('🙏')
    setCreatedGroup(null)
    setErrorMessage('')
    onClose()
  }

  return (
    <ModalShell
      title={createdGroup ? t('groupCreatedTitle') : t('createGroupTitle')}
      onClose={handleClose}
    >
      {createdGroup ? (
        <div className="px-5 py-5">
          <p className="text-[13px] text-gray-600 dark:text-white/65 mb-4 leading-[1.6]">
            {t('groupCreatedMessage')}
          </p>

          {/* 그룹 미리보기 */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] mb-3">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[22px] shadow-[0_6px_18px_-6px_rgba(168,85,247,0.55)]">
              {createdGroup.icon || '👥'}
            </div>
            <div className="min-w-0">
              <p className="text-[14.5px] font-bold text-gray-900 dark:text-white truncate">
                {createdGroup.name}
              </p>
              <p className="text-[11.5px] text-gray-500 dark:text-white/55">
                👤 1명 · 방금 만들어짐
              </p>
            </div>
          </div>

          {/* 초대 코드 카드 */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_18px_44px_-18px_rgba(168,85,247,0.6)]">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.15) 100%)',
              }}
            />
            <div
              className="absolute -top-6 -right-6 w-32 h-32 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />
            <div className="relative text-center">
              <p className="text-white/85 text-[11px] font-bold tracking-[0.12em] uppercase mb-2">
                {t('inviteCode')}
              </p>
              <p className="text-white text-[28px] font-bold tracking-[0.25em] font-mono mb-3 select-all">
                {createdGroup.invite_code}
              </p>
              <p className="text-white/85 text-[11.5px] mb-3 leading-[1.5]">
                {t('shareInviteCode')}
              </p>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[13px] font-bold transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {t('copyCode')}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full mt-4 px-4 h-11 rounded-full bg-gray-900 dark:bg-white/[0.08] text-white dark:text-white text-[13.5px] font-bold hover:bg-gray-800 dark:hover:bg-white/[0.12] transition-colors"
          >
            {t('confirm')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 px-5 py-5 space-y-5">
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30">
                <span className="text-red-500 text-[15px] shrink-0">⚠️</span>
                <p className="text-[12.5px] text-red-700 dark:text-red-300 leading-[1.5]">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* 미리보기 */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-500/5 dark:bg-purple-500/8 border border-purple-500/15 dark:border-purple-500/20">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[20px] shadow-[0_4px_14px_-4px_rgba(168,85,247,0.55)]">
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-gray-900 dark:text-white truncate">
                  {name.trim() || '그룹 이름'}
                </p>
                <p className="text-[11.5px] text-gray-500 dark:text-white/55 truncate">
                  {description.trim() || '아래에 설명을 적어주세요'}
                </p>
              </div>
            </div>

            {/* 이름 */}
            <FieldGroup label={t('groupName')} required>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrorMessage('')
                }}
                placeholder={t('groupNamePlaceholder')}
                required
                maxLength={50}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
              />
            </FieldGroup>

            {/* 설명 */}
            <FieldGroup label={t('groupDescription')}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('groupDescriptionPlaceholder')}
                rows={3}
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors resize-none leading-[1.6]"
              />
              <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 mt-1 text-right tabular-nums">
                {description.length}/200
              </p>
            </FieldGroup>

            {/* 아이콘 선택 */}
            <FieldGroup label={t('groupIcon')}>
              <div className="grid grid-cols-5 gap-2">
                {ICON_OPTIONS.map((opt) => {
                  const active = icon === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setIcon(opt)}
                      className={[
                        'aspect-square flex items-center justify-center text-[22px] rounded-xl transition-all',
                        active
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_4px_14px_-4px_rgba(168,85,247,0.55)] ring-2 ring-purple-400/40 dark:ring-purple-400/30'
                          : 'bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                      ].join(' ')}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </FieldGroup>
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {createMutation.isPending ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {t('creatingGroup')}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('createGroup')}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  )
}

// ── Join Group ────────────────────────────────────────
interface JoinGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

export const JoinGroupModal = ({ isOpen, onClose }: JoinGroupModalProps) => {
  const { t } = useLanguage()
  const [inviteCode, setInviteCode] = useState('')

  const joinMutation = useJoinGroup()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await joinMutation.mutateAsync({ invite_code: inviteCode })
      setInviteCode('')
      onClose()
    } catch (error) {
      console.error('그룹 가입 실패:', error)
    }
  }

  const handleClose = () => {
    setInviteCode('')
    onClose()
  }

  return (
    <ModalShell title={t('joinGroup')} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 px-5 py-5 space-y-5">
          {/* 안내 일러스트 */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-3">
              <span className="text-[28px]">🎟️</span>
            </div>
            <p className="text-[13.5px] text-gray-600 dark:text-white/70 leading-[1.6]">
              그룹 관리자에게 받은 초대 코드로
              <br />
              모임에 함께해보세요
            </p>
          </div>

          {/* 코드 입력 */}
          <FieldGroup label={t('inviteCode')} required>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder={t('enterInviteCode')}
              required
              className="w-full px-3 py-3.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[18px] font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors uppercase tracking-[0.2em] font-mono text-center"
            />
            <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-2 pl-0.5 leading-[1.5]">
              💡 {t('inviteCodeAdminHint')}
            </p>
          </FieldGroup>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={!inviteCode.trim() || joinMutation.isPending}
            className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {joinMutation.isPending ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {t('joiningGroup')}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t('joinGroupShort')}
              </>
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Helpers ──────────────────────────────────────────
const FieldGroup = ({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
        {label}
      </p>
      {required && <span className="text-pink-500 text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)
