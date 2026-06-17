import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { getMe, changePassword, type ChangePasswordError } from '../../api/account'
import { logout } from '../../utils/auth'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const AccountSettings = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()

  // 로그인 체크
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const { data: me, isLoading, error } = useQuery({
    queryKey: ['account', 'me'],
    queryFn: getMe,
    enabled: !!localStorage.getItem('access_token'),
    staleTime: 1000 * 60,
  })

  // 비밀번호 변경 폼 상태
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSuccessMsg('')

    // 클라이언트 측 검증 (현재 언어에 맞는 메시지)
    if (newPassword.length < 6) {
      setFormError(t('accountPasswordTooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      setFormError(t('accountPasswordMismatch'))
      return
    }

    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccessMsg(t('accountPasswordChanged'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
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

  const handleLogout = async () => {
    await logout() // 푸시 구독 해제 + 토큰 제거 + React Query 캐시 정리
    navigate('/login', { replace: true })
  }

  const inputClass =
    'w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl min-h-screen border-x border-border-light dark:border-border-dark">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-purple-300 transition-colors"
            onClick={() => navigate(-1)}
          >
            <span className="material-icons-outlined">arrow_back</span>
            <span className="text-sm font-semibold">{t('accountBack')}</span>
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-[-0.015em]">
            {t('accountTitle')}
          </h1>
          <button
            className="flex items-center gap-1 text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:from-purple-600 hover:to-pink-600 transition-all"
            onClick={handleLogout}
          >
            <span className="material-icons-outlined text-lg bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">logout</span>
            <span>{t('logout')}</span>
          </button>
        </div>

        {isLoading && (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {!isLoading && (error || !me) && (
          <div className="p-8 text-center">
            <p className="text-red-500">{t('accountCannotLoad')}</p>
          </div>
        )}

        {me && (
          <div className="p-4 space-y-6">
            {/* 계정 정보 */}
            <section>
              <h2 className="text-sm font-bold text-gray-500 dark:text-white/55 mb-2 px-1">
                {t('accountInfoSection')}
              </h2>
              <div className="rounded-2xl border border-border-light dark:border-white/[0.08] bg-white/80 dark:bg-card-dark divide-y divide-border-light dark:divide-white/[0.06]">
                <InfoRow label={t('accountUsername')} value={me.username} />
                <InfoRow label={t('accountFullName')} value={me.full_name || t('accountNotSet')} />
                <InfoRow label={t('accountEmail')} value={me.email || t('accountNotSet')} />
                <InfoRow
                  label={t('accountJoinedAt')}
                  value={new Date(me.created_at).toLocaleDateString(
                    language === 'ko' ? 'ko-KR' : 'en-US'
                  )}
                />
              </div>
            </section>

            {/* 비밀번호 변경 */}
            <section>
              <h2 className="text-sm font-bold text-gray-500 dark:text-white/55 mb-2 px-1">
                {t('accountChangePasswordSection')}
              </h2>
              <div className="rounded-2xl border border-border-light dark:border-white/[0.08] bg-white/80 dark:bg-card-dark p-4">
                {formError && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                  </div>
                )}
                {successMsg && (
                  <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400">{successMsg}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('accountCurrentPassword')}
                    required
                    disabled={submitting}
                    autoComplete="current-password"
                    className={inputClass}
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('accountNewPassword')}
                    required
                    disabled={submitting}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('accountConfirmNewPassword')}
                    required
                    disabled={submitting}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg text-sm hover:from-purple-600 hover:to-pink-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm"
                  >
                    {submitting ? t('accountChanging') : t('accountChangePasswordButton')}
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <span className="text-sm text-gray-500 dark:text-white/55">{label}</span>
    <span className="text-sm font-semibold text-gray-900 dark:text-white text-right break-all">
      {value}
    </span>
  </div>
)

export default AccountSettings
