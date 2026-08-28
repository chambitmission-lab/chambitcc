// 그룹 생성/가입 모달 — 토스 블루 플랫 테마 (theme.css 브랜드 토큰, card-dark 솔리드, outline X 버튼)
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { renderSVG } from 'uqr'
import { useCreateGroup, useJoinGroup } from '../../hooks/useGroups'
import { useSituationCategories } from '../../hooks/useSituation'
import { useLanguage } from '../../contexts/LanguageContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { showToast } from '../../utils/toast'
import type { PrayerGroup, GroupVisibility } from '../../types/prayer'
import { groupInviteUrl } from '../../utils/inviteLink'
import { GroupGlyph, PersonIcon, TicketIcon } from '../../pages/Groups/GroupIcons'

const ICON_OPTIONS = ['🙏', '⛪', '✝️', '🎵', '📖', '💒', '👥', '🕊️', '🌟', '❤️']

// 생성 템플릿 — 교회에서 실제로 만드는 모임 유형을 프리셋으로.
// 고르면 아이콘·설명이 채워져 3탭이면 방이 만들어진다
const TEMPLATES: {
  key: string
  label: string
  icon: string
  emoji: string
  namePlaceholder: string
  description: string
}[] = [
  {
    key: 'cell',
    label: '셀·구역',
    icon: '👥',
    emoji: '👥',
    namePlaceholder: '예: 3구역 사랑셀',
    description: '매주 모여 말씀과 삶을 나누고, 한 주간 서로의 기도제목을 품는 우리 셀이에요.',
  },
  {
    key: 'intercession',
    label: '중보기도팀',
    icon: '🙏',
    emoji: '🙏',
    namePlaceholder: '예: 새벽 중보기도팀',
    description: '맡겨주신 기도제목을 품고 매일 중보하는 방이에요. 응답의 기록이 쌓여가요.',
  },
  {
    key: 'newcomer',
    label: '새가족반',
    icon: '🌱',
    emoji: '🌱',
    namePlaceholder: '예: 2026 새가족 1기',
    description: '교회에 새로 오신 분들과 함께 첫걸음을 걷는 방이에요. 편하게 기도제목을 나눠요.',
  },
  {
    key: 'praise',
    label: '찬양팀',
    icon: '🎵',
    emoji: '🎵',
    namePlaceholder: '예: 호산나 찬양팀',
    description: '연습 일정과 섬김을 나누고, 예배를 위해 함께 기도하는 방이에요.',
  },
  {
    key: 'youth',
    label: '청년 소모임',
    icon: '🌟',
    emoji: '🌟',
    namePlaceholder: '예: 청년부 목요모임',
    description: '또래끼리 신앙과 일상을 나누는 소모임이에요. 부담 없이 함께해요.',
  },
]

const VISIBILITY_CHOICES: { value: GroupVisibility; label: string; desc: string }[] = [
  { value: 'private', label: '비공개', desc: '초대로만' },
  { value: 'approval', label: '승인제', desc: '신청 후 승인' },
  { value: 'public', label: '공개', desc: '누구나 바로' },
]

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
      className="relative w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="hidden dark:block absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/15 to-sky-400/10 dark:from-blue-500/15 dark:to-sky-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-sky-400/10 to-blue-400/10 dark:from-sky-500/10 dark:to-blue-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
        <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
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
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🙏')
  const [themeCategoryId, setThemeCategoryId] = useState<number | null>(null)
  const [visibility, setVisibility] = useState<GroupVisibility>('private')
  const [templateKey, setTemplateKey] = useState<string | null>(null)
  const [createdGroup, setCreatedGroup] = useState<PrayerGroup | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const createMutation = useCreateGroup()
  const { data: themeCategories } = useSituationCategories()

  const template = TEMPLATES.find((tpl) => tpl.key === templateKey) ?? null

  // 생성 완료 화면의 QR — 초대 링크를 그 자리에서 찍어 바로 가입
  const createdInviteCode = createdGroup?.invite_code
  const inviteQr = useMemo(
    () => (createdInviteCode ? renderSVG(groupInviteUrl(createdInviteCode), { ecc: 'M', border: 2 }) : null),
    [createdInviteCode],
  )

  if (!isOpen) return null

  // 템플릿 선택 — 아이콘·설명을 프리셋으로 채운다 (이미 직접 쓴 설명은 덮지 않음)
  const applyTemplate = (key: string) => {
    const tpl = TEMPLATES.find((x) => x.key === key)
    if (!tpl) return
    if (templateKey === key) {
      setTemplateKey(null)
      return
    }
    setTemplateKey(key)
    setIcon(tpl.icon)
    const isPresetDesc = TEMPLATES.some((x) => x.description === description)
    if (!description.trim() || isPresetDesc) {
      setDescription(tpl.description)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    try {
      const result = await createMutation.mutateAsync({
        name,
        description,
        icon,
        theme_category_id: themeCategoryId,
        visibility,
      })
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

  const handleShareLink = async () => {
    if (!createdGroup?.invite_code) return
    const url = groupInviteUrl(createdGroup.invite_code)
    const text = `🙏 '${createdGroup.name}' 기도방에 초대해요!\n함께 기도제목을 나누고, 응답이 쌓이는 걸 지켜봐요.\n\n${url}\n\n앱을 설치했다면 [내 그룹 → 초대 코드로 참여]에 코드 ${createdGroup.invite_code} 를 입력해도 돼요.`
    if (navigator.share) {
      try {
        await navigator.share({ title: createdGroup.name, text, url })
        return
      } catch {
        /* 사용자가 취소 — 폴백 없이 종료 */
        return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast('초대 링크를 복사했어요. 카톡에 붙여넣어 보내주세요!', 'success')
    } catch {
      showToast('복사에 실패했어요. 초대 코드를 직접 알려주세요: ' + createdGroup.invite_code, 'error')
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setIcon('🙏')
    setThemeCategoryId(null)
    setVisibility('private')
    setTemplateKey(null)
    setCreatedGroup(null)
    setErrorMessage('')
    onClose()
  }

  // 생성 완료 → 방으로 바로 이동해 첫 기도제목·첫 모임으로 이어지게
  const handleGoToGroup = () => {
    const id = createdGroup?.id
    handleClose()
    if (id) navigate(`/groups/${id}`)
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
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-white shadow-[0_6px_18px_-6px_var(--brand-glow)]">
              <GroupGlyph emoji={createdGroup.icon || '👥'} size={26} />
            </div>
            <div className="min-w-0">
              <p className="text-[14.5px] font-bold text-ink-strong truncate">
                {createdGroup.name}
              </p>
              <p className="text-[11.5px] text-gray-500 dark:text-white/55 inline-flex items-center gap-1">
                <PersonIcon size={12} /> 1명 · 방금 만들어짐
              </p>
            </div>
          </div>

          {/* 초대 코드 카드 */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-brand shadow-[0_18px_44px_-18px_var(--brand-glow)]">
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
              <div className="flex items-center justify-center gap-2">
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
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-white text-brand text-[13px] font-bold shadow-sm hover:bg-white/90 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  링크 공유
                </button>
              </div>
            </div>
          </div>

          {/* QR 초대 — 모임 자리에서 바로 보여줄 수 있게 */}
          {inviteQr && (
            <div className="mt-3 flex items-center gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08]">
              <div
                className="shrink-0 w-20 h-20 p-1 rounded-xl bg-white border border-gray-200 [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: inviteQr }}
              />
              <p className="text-[11.5px] text-gray-500 dark:text-white/55 leading-[1.6]">
                모임 자리에서 이 QR을 보여주면
                <br />
                카메라로 찍고 바로 들어올 수 있어요.
                <br />
                <span className="text-gray-400 dark:text-white/40">멤버 탭에서 언제든 다시 볼 수 있어요</span>
              </p>
            </div>
          )}

          {/* 다음 단계 안내 — 만든 직후 방이 비지 않도록 */}
          <div className="mt-3 p-3.5 rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]">
            <p className="text-[12px] font-bold text-brand mb-1.5">이제 이렇게 시작해보세요</p>
            <ol className="text-[12px] text-gray-600 dark:text-white/65 space-y-1 leading-[1.6] list-none">
              <li>① 위 버튼으로 멤버를 초대하고</li>
              <li>② 첫 기도제목을 나눠보세요</li>
              <li>③ 모임 탭에서 첫 모임 날짜도 잡을 수 있어요</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={handleGoToGroup}
            className="w-full mt-4 px-4 h-11 rounded-full bg-gray-900 dark:bg-white/[0.08] text-white dark:text-ink-strong text-[13.5px] font-bold hover:bg-gray-800 dark:hover:bg-white/[0.12] transition-colors"
          >
            그룹 열어보기 →
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
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-brand flex items-center justify-center text-white shadow-[0_4px_14px_-4px_var(--brand-glow)]">
                <GroupGlyph emoji={icon} size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-ink-strong truncate">
                  {name.trim() || '그룹 이름'}
                </p>
                <p className="text-[11.5px] text-gray-500 dark:text-white/55 truncate">
                  {description.trim() || '아래에 설명을 적어주세요'}
                </p>
              </div>
            </div>

            {/* 템플릿 — 고르면 아이콘·설명이 채워져 3탭이면 완성 */}
            <FieldGroup label="어떤 모임인가요? (선택)">
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map((tpl) => {
                  const active = templateKey === tpl.key
                  return (
                    <button
                      key={tpl.key}
                      type="button"
                      onClick={() => applyTemplate(tpl.key)}
                      className={[
                        'inline-flex items-center gap-1 px-2.5 h-8 rounded-full text-[12px] font-semibold transition-all border',
                        active
                          ? 'bg-brand text-white border-transparent shadow-sm'
                          : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                      ].join(' ')}
                    >
                      <span className="inline-flex"><GroupGlyph emoji={tpl.emoji} size={16} /></span>
                      {tpl.label}
                    </button>
                  )
                })}
              </div>
            </FieldGroup>

            {/* 이름 */}
            <FieldGroup label={t('groupName')} required>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrorMessage('')
                }}
                placeholder={template?.namePlaceholder ?? t('groupNamePlaceholder')}
                required
                maxLength={50}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors resize-none leading-[1.6]"
              />
              <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 mt-1 text-right tabular-nums">
                {description.length}/200
              </p>
            </FieldGroup>

            {/* 기도방 테마 (선택) — 테마를 고르면 상황별 성구가 방의 오늘의 성구로 이어진다 */}
            {themeCategories && themeCategories.length > 0 && (
              <FieldGroup label="기도방 테마 (선택)">
                <p className="text-[11.5px] text-gray-500 dark:text-white/50 -mt-1 mb-2 leading-[1.5]">
                  테마를 고르면 매일 그 상황에 맞는 성경 구절이 방에 함께 보여요
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {themeCategories.map((cat) => {
                    const active = themeCategoryId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setThemeCategoryId(active ? null : cat.id)}
                        className={[
                          'inline-flex items-center gap-1 px-2.5 h-8 rounded-full text-[12px] font-semibold transition-all border',
                          active
                            ? 'text-white border-transparent shadow-sm'
                            : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                        ].join(' ')}
                        style={active ? { backgroundColor: cat.color } : undefined}
                      >
                        <span className="material-icons-round text-[14px]">{cat.icon}</span>
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              </FieldGroup>
            )}

            {/* 공개 설정 — 둘러보기 노출 여부 */}
            <FieldGroup label="공개 설정">
              <div className="grid grid-cols-3 gap-1.5">
                {VISIBILITY_CHOICES.map((opt) => {
                  const active = visibility === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className={[
                        'px-2 py-2 rounded-xl border text-center transition-all',
                        active
                          ? 'bg-[var(--brand-soft)] border-[var(--brand-soft-strong)]'
                          : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08]',
                      ].join(' ')}
                    >
                      <span className={`block text-[12.5px] font-bold ${active ? 'text-brand' : 'text-ink-strong'}`}>
                        {opt.label}
                      </span>
                      <span className="block text-[10.5px] text-gray-500 dark:text-white/50 mt-0.5">
                        {opt.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1.5 leading-[1.5]">
                공개·승인제로 하면 [내 그룹 → 둘러보기]에 소개돼 초대 없이도 성도들이 찾아올 수 있어요
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
                          ? 'bg-brand shadow-[0_4px_14px_-4px_var(--brand-glow)] ring-2 ring-[var(--brand-soft-strong)]'
                          : 'bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                      ].join(' ')}
                    >
                      <GroupGlyph emoji={opt} size={24} className={active ? 'text-white' : 'text-ink-strong/70'} />
                    </button>
                  )
                })}
              </div>
            </FieldGroup>
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
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
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--brand-soft-strong)] mb-3">
              <TicketIcon size={32} className="text-brand" />
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
              className="w-full px-3 py-3.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[18px] font-bold text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors uppercase tracking-[0.2em] font-mono text-center"
            />
            <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-2 pl-0.5 leading-[1.5]">
              💡 {t('inviteCodeAdminHint')}
            </p>
          </FieldGroup>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
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
            className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
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
      {required && <span className="text-rose-500 text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)
