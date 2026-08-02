import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { API_V1 } from '../../config/api'
import { clearAllPersistedCache } from '../../config/persister'
import { restorePushSubscriptionForUser } from '../../utils/pushNotification'
import { deriveTimeOfDay } from '../../hooks/useDailyMeditation'
import { EyeIcon, StatusIcon } from './AuthIcons'
import './AuthForm.css'

/* 아이디 저장 — 사용자가 명시적으로 켰을 때만 남긴다.
   (로그인 성공 시 저장되는 last_cached_username은 캐시 분리용이라 별개) */
const REMEMBER_KEY = 'login_remembered_username'

const GREETING_KEYS = {
  morning: 'loginGreetingMorning',
  afternoon: 'loginGreetingAfternoon',
  evening: 'loginGreetingEvening',
} as const

const Login = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    username: localStorage.getItem(REMEMBER_KEY) || '',
    password: ''
  })
  const [error, setError] = useState('')
  /* 승인 대기는 사용자 잘못이 아니라 상태 안내라 빨강 대신 브랜드 톤으로 보여준다 */
  const [errorTone, setErrorTone] = useState<'error' | 'info'>('error')
  /* 같은 메시지가 반복돼도 흔들림이 다시 재생되도록 세는 카운터 */
  const [errorSeq, setErrorSeq] = useState(0)
  const fieldsRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(() => !!localStorage.getItem(REMEMBER_KEY))
  const [showForgotHelp, setShowForgotHelp] = useState(false)

  const greeting = t(GREETING_KEYS[deriveTimeOfDay(new Date().getHours())])

  /* 로그인 실패 시 흔들림 재생. 리마운트(key 교체)로 처리하면 입력 포커스가
     날아가므로, 클래스를 뗐다 붙이며 reflow로 애니메이션만 다시 돌린다. */
  useEffect(() => {
    const el = fieldsRef.current
    if (!errorSeq || !el) return
    el.classList.remove('auth-shake')
    void el.offsetWidth
    el.classList.add('auth-shake')
  }, [errorSeq])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setErrorTone('error')

    try {
      const formBody = new URLSearchParams()
      formBody.append('username', formData.username)
      formBody.append('password', formData.password)

      const response = await fetch(`${API_V1}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody
      })

      const data = await response.json()

      if (!response.ok) {
        // 백엔드 detail 문구는 한국어/영어로 고정되어 있으므로 그대로 노출하지 않고,
        // 현재 선택된 언어에 맞는 번역 메시지로 변환해서 보여준다.
        // 403은 사유가 여러 개(승인 대기 / 거절 / 정지)라 X-Auth-Reason 헤더로 구분한다.
        let message = t('loginFailed')
        if (response.status === 401) {
          message = t('loginInvalidCredentials')
        } else if (response.status === 403) {
          const reason = response.headers.get('X-Auth-Reason')
          message =
            reason === 'pending_approval'
              ? t('loginPendingApproval')
              : reason === 'rejected'
                ? t('loginRejectedAccount')
                : t('loginInactiveAccount')
          // 승인 대기는 "기다리면 되는 상태"라 경고가 아닌 안내 톤으로
          if (reason === 'pending_approval') setErrorTone('info')
        }
        throw new Error(message)
      }

      // 아이디 저장 — 체크했을 때만 다음 방문에 프리필한다 (비밀번호는 저장하지 않음)
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, formData.username)
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }

      // 토큰 저장
      localStorage.setItem('access_token', data.access_token)
      
      // Refresh token 저장 (백엔드에서 제공하는 경우)
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      
      // 사용자 정보 저장 (username과 full_name)
      if (data.username) {
        localStorage.setItem('user_username', data.username)
        localStorage.setItem('last_cached_username', data.username)
      } else {
        // 백엔드에서 username을 반환하지 않으면 입력한 값 사용
        localStorage.setItem('user_username', formData.username)
        localStorage.setItem('last_cached_username', formData.username)
      }
      if (data.full_name) {
        localStorage.setItem('user_full_name', data.full_name)
      }
      
      // 이전 사용자의 캐시 완전히 제거 (사용자별 캐시 분리)
      clearAllPersistedCache()

      // React Query 캐시 초기화 (메모리 캐시)
      queryClient.clear()

      // 같은 사용자가 이전 세션에서 푸시 알림을 켜뒀다면 자동으로 재구독.
      // 로그아웃 시 브라우저 구독은 정리되지만 사용자별 'push_pref_<username>'
      // 플래그는 localStorage에 남아있어 복원이 가능하다. 다른 사용자로 로그인하면
      // 그 사용자의 플래그가 따로 적용되므로 사용자 간 격리는 유지된다.
      // 화면 전환을 막지 않도록 await 없이 백그라운드로 복원한다.
      const loggedInUsername = data.username || formData.username
      restorePushSubscriptionForUser(loggedInUsername).catch((pushError) => {
        console.warn('로그인 후 푸시 자동 복원 중 에러 (무시):', pushError)
      })

      // 저장된 리다이렉트 경로가 있으면 그곳으로, 없으면 홈으로
      const redirectPath = sessionStorage.getItem('redirect_after_login')
      if (redirectPath) {
        sessionStorage.removeItem('redirect_after_login')
        navigate(redirectPath, { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginFailed'))
      setErrorSeq((seq) => seq + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    /* 세로 중앙 정렬. 여백·간격은 auth-page 토큰이 기기 높이에 따라 조절한다
       (작은 폰에서 고정 여백이 화면을 꽉 채워 답답해 보이던 문제).
       min-height라 내용이 길어지면 컨테이너가 같이 늘어나 잘리지 않는다. */
    <div className="bg-surface screen-fit-minus-header auth-page flex flex-col justify-center">
      <div className="w-full max-w-sm mx-auto">
        {/* 헤드라인 — 좌측 정렬 2줄. 헤더에 이미 로고가 있어 브랜드 마크는 넣지 않는다.
            카드도 부제도 없이 여백이 위계를 만든다. */}
        <h1 className="auth-title font-display font-bold tracking-tight text-ink-strong">
          {greeting}
          <br />
          {t('loginHeadline')}
        </h1>

        <form onSubmit={handleSubmit} className="auth-lead">
          <div ref={fieldsRef}>
            <div className="auth-field">
              <input
                id="login-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder=" "
                required
                disabled={loading}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
              />
              <label htmlFor="login-username">{t('loginUsername')}</label>
            </div>

            <div className="auth-field auth-gap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder=" "
                required
                disabled={loading}
                autoComplete="current-password"
                enterKeyHint="go"
              />
              <label htmlFor="login-password">{t('loginPassword')}</label>
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={t(showPassword ? 'loginHidePassword' : 'loginShowPassword')}
                aria-pressed={showPassword}
                tabIndex={-1}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
          </div>

          {/* 에러는 배너가 아니라 필드 바로 아래 인라인으로 — 레이아웃이 튀지 않는다 */}
          {error && (
            <p
              className={`auth-msg mt-3 ${errorTone === 'info' ? 'auth-msg--info' : 'auth-msg--error'}`}
              role="alert"
            >
              <StatusIcon tone={errorTone} />
              <span>{error}</span>
            </p>
          )}

          <div className="flex items-center justify-between mt-5">
            <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                className="auth-check"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              {t('loginRemember')}
            </label>
            <button
              type="button"
              onClick={() => setShowForgotHelp((v) => !v)}
              className="text-[13px] text-ink-muted hover:text-brand transition-colors"
              aria-expanded={showForgotHelp}
            >
              {t('loginForgot')}
            </button>
          </div>

          {showForgotHelp && (
            <p className="mt-3 rounded-xl bg-[var(--brand-soft)] px-3.5 py-2.5 text-[13px] leading-relaxed text-ink animate-pop-in">
              {t('loginForgotHelp')}
            </p>
          )}

          {/* CTA는 폼 바로 아래 — 바닥에 붙이면 큰 화면에서 가운데가 텅 빈다 */}
          <div className="auth-cta">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] flex items-center justify-center gap-2 bg-brand hover:bg-brand-dim text-white font-semibold rounded-2xl text-[15px] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-[0_10px_28px_-10px_var(--brand-glow)]"
            >
              {loading && <span className="auth-spinner" aria-hidden="true" />}
              {loading ? t('loginLoading') : t('loginButton')}
            </button>

            <p className="mt-5 text-center text-[13px] text-ink-muted">
              {t('loginFirstTime')}{' '}
              <Link
                to="/register"
                className="font-semibold text-brand hover:text-brand-dim transition-colors"
              >
                {t('loginSignUp')}
              </Link>
              <span className="mx-2 opacity-40">·</span>
              <Link to="/" className="hover:text-brand transition-colors">
                {t('loginBrowse')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
