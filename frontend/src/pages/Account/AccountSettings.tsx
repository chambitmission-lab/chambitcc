// 내 정보 (/account)
// 브랜드(토스 블루) 톤 + "정보 변경이 쉬운" 설정 화면.
//  - 아이덴티티 히어로: 얼굴·이름·함께한 날수 + 오늘의 말씀을 한 카드에 (사진 교체도 여기서)
//  - 계정 정보 카드: 행마다 아이콘 타일, 이름은 행에서 바로 인라인 수정, 변경 불가 항목은 잠금 표시
//  - 보안 카드: 비밀번호 변경은 접힌 상태로 두고 펼칠 때만 입력 노출(규칙 실시간 체크)
//  - 성공 메시지는 토스트로 — 카드 안에서 초록 박스가 튀어나와 레이아웃이 밀리지 않게
// 아이콘은 손으로 그리던 인라인 SVG를 걷고 최근 화면들과 같은 Phosphor 세트(AccountIcons)로 통일.
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { getMe, changePassword, updateName, type ChangePasswordError, type UpdateNameError } from '../../api/account'
import { getProfileStats } from '../../api/profile'
import type { ProfileDetail } from '../../types/profile'
import { useDailyVerse } from '../../hooks/useDailyVerse'
import { useUploadAvatar } from '../../hooks/useProfile'
import { resizeImageToBlob } from '../../utils/imageResize'
import { logout } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  BackIcon,
  CalendarIcon,
  CameraIcon,
  CheckIcon,
  ChevronIcon,
  EyeIcon,
  EyeOffIcon,
  LeafIcon,
  LockIcon,
  LogoutIcon,
  MailIcon,
  PencilIcon,
  PersonIcon,
  PrayIcon,
  RefreshIcon,
  ShieldIcon,
  type AccountIconProps,
} from './AccountIcons'

/* 행 앞 아이콘 타일 — 소프트 브랜드 배경 위 duotone 아이콘 (계정 정보·보안 공용) */
const RowTile = ({ Icon, size = 20 }: { Icon: (p: AccountIconProps) => React.ReactElement; size?: number }) => (
  <div className="shrink-0 w-10 h-10 rounded-2xl bg-[var(--brand-soft-strong)] text-brand flex items-center justify-center">
    <Icon size={size} />
  </div>
)

const AccountSettings = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const queryClient = useQueryClient()

  // 로그인 체크
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const { data: me, isLoading, error, refetch } = useQuery({
    queryKey: ['account', 'me'],
    queryFn: getMe,
    enabled: !!localStorage.getItem('access_token'),
    staleTime: 1000 * 60,
  })

  /* 프로필 사진 — /auth/me 응답에는 avatar_url이 없어 프로필 통계에서 가져온다.
     /profile을 다녀왔다면 이미 받아 둔 값이 캐시에 있으므로 첫 프레임부터 사진이 뜨고,
     사진을 바꾸면 업로드 훅의 ['profile'] 무효화가 이 키에도 걸려 함께 갱신된다. */
  const { data: profileStats } = useQuery({
    queryKey: ['profile', 'stats'],
    queryFn: getProfileStats,
    enabled: !!localStorage.getItem('access_token'),
    staleTime: 1000 * 60 * 5,
    initialData: () =>
      queryClient.getQueryData<ProfileDetail>(['profile', 'detail'])?.stats,
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['profile', 'detail'])?.dataUpdatedAt,
  })

  // 이미지 주소가 깨졌을 때(파일 삭제 등) 조용히 이니셜로 되돌아간다
  const [avatarBroken, setAvatarBroken] = useState(false)
  const avatarUrl = profileStats?.avatar_url ?? null
  useEffect(() => {
    setAvatarBroken(false)
  }, [avatarUrl])

  /* 사진 교체 — 프로필 화면까지 가지 않아도 "내 정보"에서 바로 바꾼다.
     업로드 훅의 ['profile'] · ['me'] 무효화가 이 화면과 헤더 아바타를 함께 갱신한다.
     (삭제는 프로필 화면에 남겨 둔다 — 여기선 교체만 필요하다) */
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAvatar = useUploadAvatar()
  const avatarBusy = uploadAvatar.isPending

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 재선택 허용
    if (!file || avatarBusy) return
    try {
      await uploadAvatar.mutateAsync(await resizeImageToBlob(file, 512))
      showToast(t('accountPhotoUploaded'), 'success')
    } catch {
      showToast(t('accountPhotoFailed'), 'error')
    }
  }

  /* 히어로의 오늘의 말씀 — 홈과 같은 쿼리 키(24h 캐시)를 빌려 쓰므로 추가 요청이 없다.
     말씀이 아직 등록되지 않은 날(404)이면 조용히 자리를 비운다 */
  const { data: verse } = useDailyVerse()

  /* ── 이름 인라인 수정 ─────────────────────────────────── */
  const [editingName, setEditingName] = useState(false)
  const [fullName, setFullName] = useState('')
  const [nameError, setNameError] = useState('')
  const [nameSubmitting, setNameSubmitting] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const startEditName = () => {
    setFullName(me?.full_name || '')
    setNameError('')
    setEditingName(true)
  }

  const cancelEditName = () => {
    setEditingName(false)
    setNameError('')
  }

  // 편집 모드로 들어가면 바로 입력할 수 있게 커서를 끝에 둔다
  useEffect(() => {
    if (!editingName) return
    const el = nameInputRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [editingName])

  const nameTrimmed = fullName.trim()
  const nameUnchanged = nameTrimmed === (me?.full_name || '')

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')

    if (!nameTrimmed) {
      setNameError(t('accountNameEmpty'))
      return
    }
    if (nameUnchanged) {
      setEditingName(false)
      return
    }

    setNameSubmitting(true)
    try {
      await updateName(nameTrimmed)
      // 기도/답글 작성 시 참조하는 로컬 이름도 동기화
      localStorage.setItem('user_full_name', nameTrimmed)
      queryClient.invalidateQueries({ queryKey: ['account', 'me'] })
      setEditingName(false)
      showToast(t('accountNameChanged'), 'success')
    } catch (err) {
      const kind = (err instanceof Error ? err.message : 'failed') as UpdateNameError
      setNameError(t(
        kind === 'invalid' ? 'accountNameEmpty'
          : kind === 'duplicate' ? 'accountNameDuplicate'
            : 'accountChangeNameFailed'
      ))
    } finally {
      setNameSubmitting(false)
    }
  }

  /* ── 비밀번호 변경 ────────────────────────────────────── */
  const [pwOpen, setPwOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 입력하는 동안 바로 보이는 규칙 — 다 통과해야 버튼이 활성화된다
  const ruleLength = newPassword.length >= 6
  const ruleMatch = newPassword.length > 0 && newPassword === confirmPassword
  const ruleDifferent = newPassword.length > 0 && newPassword !== currentPassword
  const pwReady = !!currentPassword && ruleLength && ruleMatch && ruleDifferent

  const resetPwForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setFormError('')
    setShowPw(false)
  }

  const togglePwSection = () => {
    if (pwOpen) resetPwForm()
    setPwOpen((v) => !v)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!ruleLength) {
      setFormError(t('accountPasswordTooShort'))
      return
    }
    if (!ruleMatch) {
      setFormError(t('accountPasswordMismatch'))
      return
    }

    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      resetPwForm()
      setPwOpen(false)
      showToast(t('accountPasswordChanged'), 'success')
    } catch (err) {
      const kind = (err instanceof Error ? err.message : 'failed') as ChangePasswordError
      const messageKey =
        kind === 'wrong_current' ? 'accountWrongCurrentPassword'
          : kind === 'too_short' ? 'accountPasswordTooShort'
            : 'accountChangePasswordFailed'
      setFormError(t(messageKey))
    } finally {
      setSubmitting(false)
    }
  }

  /* ── 로그아웃 (한 번 더 확인) ─────────────────────────── */
  const [logoutConfirm, setLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    await logout() // 푸시 구독 해제 + 토큰 제거 + React Query 캐시 정리
    navigate('/login', { replace: true })
  }

  const locale = language === 'ko' ? 'ko-KR' : 'en-US'
  const joinedDate = me ? new Date(me.created_at) : null
  const joinedText = joinedDate ? joinedDate.toLocaleDateString(locale) : ''
  // 함께한 날수 — 가입 당일도 1일로 센다
  const togetherDays = joinedDate
    ? Math.max(1, Math.floor((Date.now() - joinedDate.getTime()) / 86400000) + 1)
    : 0

  const displayName = me?.full_name?.trim() || me?.username || ''
  const initial = displayName.charAt(0).toUpperCase()

  const inputClass =
    'w-full h-12 px-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.09] text-[15px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand focus:bg-white dark:focus:bg-white/[0.06] transition-colors disabled:opacity-60'

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen border-x border-border-light dark:border-border-dark pb-12 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
        {/* 헤더 — 뒤로 + 제목 (로그아웃은 오탭 방지를 위해 맨 아래로) */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 -ml-1 px-1 py-1 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            onClick={() => navigate(-1)}
          >
            <BackIcon size={18} />
            <span className="text-sm font-semibold">{t('accountBack')}</span>
          </button>
          <h1 className="text-base font-bold text-ink-strong tracking-[-0.015em] mx-auto pr-12">
            {t('accountTitle')}
          </h1>
        </div>

        {isLoading && (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {!isLoading && (error || !me) && (
          <div className="px-6 py-20 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--brand-soft)] flex items-center justify-center text-brand">
              <RefreshIcon size={26} />
            </div>
            <p className="mt-4 text-[14.5px] font-semibold text-ink">{t('accountCannotLoad')}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-5 h-10 rounded-xl bg-brand text-white text-sm font-bold active:scale-[0.98] transition-transform"
            >
              {t('accountRetry')}
            </button>
          </div>
        )}

        {me && (
          <div className="px-4 pt-4 space-y-5">
            {/* 아이덴티티 히어로 — 얼굴·이름·함께한 날수, 그리고 오늘의 말씀.
                "내 정보"의 첫 화면이 서류가 아니라 사람이 되도록 카드 하나로 묶었다 */}
            <div className="relative overflow-hidden rounded-3xl border border-[var(--card-border)] bg-white dark:bg-card-dark shadow-[0_10px_28px_-20px_var(--brand-glow)]">
              {/* 브랜드 그라데이션 + 우상단 빛무리 + 잎사귀 워터마크 (다크는 토큰이 알아서 톤을 낮춘다) */}
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--brand-soft-strong),transparent_62%)]" />
              <div aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[radial-gradient(circle,var(--brand-glow),transparent_68%)] opacity-70" />
              <LeafIcon size={132} className="pointer-events-none absolute -bottom-7 right-1 rotate-[18deg] text-brand opacity-[0.09]" />

              <div className="relative flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:gap-5 lg:p-5">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  {/* 얼굴 — 카메라 배지로 여기서 바로 교체 */}
                  <div className="relative shrink-0">
                    {avatarUrl && !avatarBroken ? (
                      <img
                        src={avatarUrl}
                        alt={t('accountAvatarAlt')}
                        onError={() => setAvatarBroken(true)}
                        className="h-[68px] w-[68px] rounded-full object-cover bg-[var(--surface-inset)] ring-4 ring-white dark:ring-white/10 shadow-[0_6px_18px_var(--brand-glow)]"
                        style={{ filter: 'var(--media-dim)' }}
                      />
                    ) : (
                      <div
                        className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-brand text-[26px] font-bold tracking-[-0.02em] text-white ring-4 ring-white dark:ring-white/10 shadow-[0_6px_18px_var(--brand-glow)]"
                        aria-hidden="true"
                      >
                        {initial}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarBusy}
                      aria-label={t(avatarUrl ? 'accountPhotoChange' : 'accountPhotoAdd')}
                      className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white ring-2 ring-white dark:ring-card-dark shadow-[0_2px_8px_var(--brand-glow)] transition-transform hover:scale-110 active:scale-95 disabled:opacity-60"
                    >
                      {avatarBusy ? <RefreshIcon size={14} className="animate-spin" /> : <CameraIcon size={14} />}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarFile}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[20px] font-bold tracking-[-0.02em] text-ink-strong break-all">
                        {displayName}
                      </span>
                      {me.is_admin && (
                        <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10.5px] font-bold text-white">
                          {t('accountAdminBadge')}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] text-ink-muted break-all">@{me.username}</p>
                    {togetherDays > 0 && (
                      /* 함께한 날수 — 숫자가 아니라 "동행"으로 읽히도록 기도손 칩 */
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-white/70 dark:bg-white/[0.06] px-2.5 py-1 text-[12px] font-bold text-brand">
                        <PrayIcon size={14} />
                        {togetherDays}
                        {t('accountTogetherDays')}
                      </span>
                    )}
                  </div>
                </div>

                {/* 오늘의 말씀 — 설정 화면에도 붙들 말씀 한 줄을 둔다 */}
                {verse && (
                  <div className="min-w-0 border-t border-[var(--card-border)] pt-3.5 lg:max-w-[46%] lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
                    <p className="whitespace-pre-line text-[13.5px] leading-[1.6] text-ink">
                      {verse.verse_text}
                    </p>
                    <p className="mt-1.5 text-[11.5px] font-semibold text-ink-muted">
                      {verse.verse_reference}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 계정 정보 */}
            <section>
              <h2 className="text-[12.5px] font-bold text-ink-muted mb-2 px-1 tracking-[-0.01em]">
                {t('accountInfoSection')}
              </h2>
              <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm divide-y divide-gray-100 dark:divide-white/[0.06] overflow-hidden">
                {/* 이름 — 행에서 바로 수정 */}
                {editingName ? (
                  <form onSubmit={handleNameSubmit} className="p-4">
                    <label
                      htmlFor="account-name"
                      className="block text-[12.5px] font-semibold text-ink-muted mb-2"
                    >
                      {t('accountFullName')}
                    </label>
                    <input
                      id="account-name"
                      ref={nameInputRef}
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value)
                        setNameError('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelEditName()
                      }}
                      placeholder={t('accountNamePlaceholder')}
                      maxLength={50}
                      required
                      disabled={nameSubmitting}
                      autoComplete="name"
                      className={inputClass}
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2 min-h-[18px]">
                      <p className="text-[12px] text-red-500 dark:text-red-400">{nameError}</p>
                      <span className="shrink-0 text-[11.5px] text-ink-muted tabular-nums">
                        {nameTrimmed.length}/50
                      </span>
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        onClick={cancelEditName}
                        disabled={nameSubmitting}
                        className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-white/[0.12] text-[14.5px] font-bold text-ink active:scale-[0.98] transition-transform disabled:opacity-50"
                      >
                        {t('accountCancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={nameSubmitting || !nameTrimmed || nameUnchanged}
                        className="flex-[1.4] h-11 rounded-xl bg-brand text-white text-[14.5px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100"
                      >
                        {nameSubmitting ? t('accountChanging') : t('accountSave')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={startEditName}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[var(--brand-soft)] active:bg-[var(--brand-soft-strong)] transition-colors"
                  >
                    <RowTile Icon={PersonIcon} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] text-ink-muted">{t('accountFullName')}</p>
                      <p
                        className={`mt-0.5 text-[15px] font-semibold break-all ${
                          me.full_name ? 'text-ink-strong' : 'text-ink-muted'
                        }`}
                      >
                        {me.full_name || t('accountNotSet')}
                      </p>
                    </div>
                    <span className="shrink-0 flex h-9 items-center gap-1 rounded-full bg-[var(--brand-soft-strong)] px-3 text-[13px] font-bold text-brand">
                      <PencilIcon size={14} />
                      {t('accountEdit')}
                    </span>
                  </button>
                )}

                <LockedRow
                  icon={MailIcon}
                  label={t('accountEmail')}
                  value={me.email || t('accountNotSet')}
                  muted={!me.email}
                  hint={t('accountLockedHint')}
                />
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <RowTile Icon={CalendarIcon} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] text-ink-muted">{t('accountJoinedAt')}</p>
                    <p className="mt-0.5 text-[15px] font-semibold text-ink-strong">{joinedText}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 보안 */}
            <section>
              <h2 className="text-[12.5px] font-bold text-ink-muted mb-2 px-1 tracking-[-0.01em]">
                {t('accountSecuritySection')}
              </h2>
              <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={togglePwSection}
                  aria-expanded={pwOpen}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[var(--brand-soft)] active:bg-[var(--brand-soft-strong)] transition-colors"
                >
                  <RowTile Icon={ShieldIcon} size={21} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-bold text-ink-strong tracking-[-0.01em]">
                      {t('accountChangePasswordSection')}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-ink-muted">
                      {t('accountPasswordRowDesc')}
                    </p>
                  </div>
                  <ChevronIcon
                    size={20}
                    className={`shrink-0 text-ink-muted transition-transform duration-200 ${
                      pwOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {pwOpen && (
                  <form
                    onSubmit={handleSubmit}
                    className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-white/[0.06] animate-pop-in"
                  >
                    <div className="space-y-2 pt-3">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value)
                          setFormError('')
                        }}
                        placeholder={t('accountCurrentPassword')}
                        required
                        disabled={submitting}
                        autoComplete="current-password"
                        className={inputClass}
                      />
                      <div className="relative">
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value)
                            setFormError('')
                          }}
                          placeholder={t('accountNewPassword')}
                          required
                          disabled={submitting}
                          autoComplete="new-password"
                          className={`${inputClass} pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          aria-label={t(showPw ? 'accountHidePassword' : 'accountShowPassword')}
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 dark:text-white/35 hover:text-brand transition-colors"
                        >
                          {showPw ? <EyeOffIcon size={19} /> : <EyeIcon size={19} />}
                        </button>
                      </div>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          setFormError('')
                        }}
                        placeholder={t('accountConfirmNewPassword')}
                        required
                        disabled={submitting}
                        autoComplete="new-password"
                        className={inputClass}
                      />
                    </div>

                    {/* 규칙 체크리스트 — 입력하면서 바로 통과 여부를 본다 */}
                    <ul className="mt-3 space-y-1.5">
                      <Rule ok={ruleLength} text={t('accountPwRuleLength')} />
                      <Rule ok={ruleMatch} text={t('accountPwRuleMatch')} />
                      <Rule ok={ruleDifferent} text={t('accountPwRuleDifferent')} />
                    </ul>

                    {formError && (
                      <p className="mt-3 text-[13px] font-semibold text-red-500 dark:text-red-400">
                        {formError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !pwReady}
                      className="mt-3.5 w-full h-12 rounded-xl bg-brand text-white text-[15px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100"
                    >
                      {submitting ? t('accountChanging') : t('accountChangePasswordButton')}
                    </button>
                  </form>
                )}
              </div>
            </section>

            {/* 로그아웃 — 한 번 더 확인 */}
            <div className="pt-1">
              {logoutConfirm ? (
                <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4">
                  <p className="text-[14px] font-semibold text-ink-strong text-center">
                    {t('accountLogoutConfirm')}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setLogoutConfirm(false)}
                      className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-white/[0.12] text-[14.5px] font-bold text-ink active:scale-[0.98] transition-transform"
                    >
                      {t('accountCancel')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 h-11 rounded-xl bg-red-500 text-white text-[14.5px] font-bold active:scale-[0.98] transition-transform"
                    >
                      {t('logout')}
                    </button>
                  </div>
                </div>
              ) : (
                /* 풀폭 솔리드 — 브랜드 파랑(주요 행동)도 빨강(위험)도 아닌 잉크 톤.
                   확인 한 단계를 거치므로 크게 둬도 오탭이 곧장 로그아웃이 되진 않는다.
                   다크에선 검은 버튼이 배경에 묻히므로 살짝 떠 있는 표면 + 테두리로 바꾼다 */
                <button
                  onClick={() => setLogoutConfirm(true)}
                  className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold text-white bg-[linear-gradient(135deg,#3b4252,#1c2029)] shadow-[0_8px_20px_-12px_rgba(0,0,0,0.55)] active:scale-[0.99] transition-transform dark:bg-none dark:border dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-white/90 dark:shadow-none"
                >
                  <LogoutIcon size={18} />
                  {t('logout')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* 변경할 수 없는 항목 — 값 + 잠금 아이콘으로 "왜 안 눌리는지"를 바로 알린다 */
const LockedRow = ({
  icon,
  label,
  value,
  hint,
  muted = false,
}: {
  icon: (p: AccountIconProps) => React.ReactElement
  label: string
  value: string
  hint: string
  muted?: boolean
}) => (
  <div className="flex items-center gap-3 px-4 py-3.5">
    <RowTile Icon={icon} />
    <div className="min-w-0 flex-1">
      <p className="text-[12.5px] text-ink-muted">{label}</p>
      <p
        className={`mt-0.5 text-[15px] font-semibold break-all ${
          muted ? 'text-ink-muted' : 'text-ink-strong'
        }`}
      >
        {value}
      </p>
    </div>
    <span className="shrink-0 flex items-center gap-1 text-ink-muted text-[11.5px] font-semibold">
      <LockIcon size={13} />
      {hint}
    </span>
  </div>
)

/* 비밀번호 규칙 한 줄 */
const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
  <li className="flex items-center gap-1.5">
    <span
      className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
        ok ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-white/[0.12] text-transparent'
      }`}
    >
      <CheckIcon size={11} />
    </span>
    <span
      className={`text-[12.5px] transition-colors ${
        ok ? 'text-brand font-semibold' : 'text-ink-muted'
      }`}
    >
      {text}
    </span>
  </li>
)

export default AccountSettings
