import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { API_V1 } from '../../config/api'
import { showToast } from '../../utils/toast'
import { EyeIcon, StatusIcon } from './AuthIcons'
import './AuthForm.css'

const MIN_PASSWORD_LENGTH = 6

const Register = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  })
  const [error, setError] = useState('')
  /* 같은 메시지가 반복돼도 흔들림이 다시 재생되도록 세는 카운터 */
  const [errorSeq, setErrorSeq] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // 관리자가 가입 승인제를 켰는지 — 가입 전에 미리 안내하기 위해 조회한다
  const [requireApproval, setRequireApproval] = useState(false)
  const fieldsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API_V1}/auth/signup-policy`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) setRequireApproval(!!data.require_approval)
      })
      .catch(() => {
        // 정책 조회 실패는 가입 자체를 막지 않는다 — 안내만 생략된다
      })
  }, [])

  /* 가입 실패 시 흔들림 재생. 리마운트(key 교체)로 처리하면 입력 포커스가
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

  /* 제출 전에 필드 아래에서 미리 알려주는 상태들 — 다 채우고 나서야
     "비밀번호가 다릅니다"를 만나는 일이 없도록 한다 */
  const passwordTooShort =
    formData.password.length > 0 && formData.password.length < MIN_PASSWORD_LENGTH
  const confirmTouched = formData.confirmPassword.length > 0
  const passwordMismatch = confirmTouched && formData.password !== formData.confirmPassword
  const passwordMatched =
    confirmTouched && !passwordMismatch && formData.password.length >= MIN_PASSWORD_LENGTH

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(t('registerPasswordMismatch'))
      setErrorSeq((seq) => seq + 1)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_V1}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || t('registerFailed'))
      }

      // 정책이 도중에 바뀌었을 수 있으니 실제 생성된 상태를 기준으로 안내한다.
      // 토스트는 document.body에 직접 붙어 화면 전환 후에도 남는다.
      const pending = data.approval_status === 'pending'
      showToast(
        pending ? t('registerSuccessPending') : t('registerSuccess'),
        pending ? 'info' : 'success'
      )
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerFailed'))
      setErrorSeq((seq) => seq + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    /* 세로 중앙 정렬 + 아래쪽 여백을 더 줘 광학적으로 살짝 위에 앉힌다.
       min-height라 내용이 길어지면 컨테이너가 같이 늘어나 잘리지 않는다. */
    <div className="bg-surface screen-fit-minus-header flex flex-col justify-center px-6 pt-10 pb-16">
      <div className="w-full max-w-sm mx-auto">
        {/* 헤드라인 — 헤더에 이미 로고가 있어 브랜드 마크는 넣지 않는다 */}
        <h1 className="font-display text-[28px] leading-[1.35] font-bold tracking-tight text-ink-strong">
          {t('registerGreeting')}
          <br />
          {t('registerHeadline')}
        </h1>

        {/* 승인제가 켜져 있으면 가입 "전에" 알려준다 — 나중에 로그인이 막혀
            당황하는 일이 없도록 */}
        {requireApproval && (
          <p className="auth-msg auth-msg--info mt-5 rounded-xl bg-[var(--brand-soft)] px-3.5 py-3">
            <StatusIcon tone="info" />
            <span>{t('registerApprovalNotice')}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8">
          <div ref={fieldsRef}>
            <div className="auth-field">
              <input
                id="register-username"
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
              <label htmlFor="register-username">{t('registerUsername')}</label>
            </div>

            <div className="auth-field mt-6">
              <input
                id="register-fullname"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder=" "
                disabled={loading}
                autoComplete="name"
                enterKeyHint="next"
              />
              <label htmlFor="register-fullname">{t('registerFullName')}</label>
            </div>
            <p className="auth-msg auth-msg--hint mt-2">
              <span>{t('registerFullNameHelp')}</span>
            </p>

            <div className="auth-field mt-6">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder=" "
                required
                minLength={MIN_PASSWORD_LENGTH}
                disabled={loading}
                autoComplete="new-password"
                enterKeyHint="next"
              />
              <label htmlFor="register-password">{t('registerPassword')}</label>
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
            {/* 규칙은 항상 보이고, 짧을 때만 빨갛게 바뀐다 */}
            <p
              className={`auth-msg mt-2 ${passwordTooShort ? 'auth-msg--error' : 'auth-msg--hint'}`}
            >
              <span>{t('registerPasswordRule')}</span>
            </p>

            <div className="auth-field mt-6">
              <input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder=" "
                required
                minLength={MIN_PASSWORD_LENGTH}
                disabled={loading}
                autoComplete="new-password"
                enterKeyHint="go"
              />
              <label htmlFor="register-confirm">{t('registerConfirmPassword')}</label>
            </div>
            {/* 다 입력한 뒤가 아니라 치는 도중에 일치 여부를 알려준다 */}
            {(passwordMismatch || passwordMatched) && (
              <p
                className={`auth-msg mt-2 ${passwordMismatch ? 'auth-msg--error' : 'auth-msg--success'}`}
              >
                <StatusIcon tone={passwordMismatch ? 'error' : 'success'} />
                <span>
                  {passwordMismatch ? t('registerPasswordMismatch') : t('registerPasswordOk')}
                </span>
              </p>
            )}
          </div>

          {/* 서버 에러는 배너가 아니라 폼 아래 인라인으로 — 레이아웃이 튀지 않는다 */}
          {error && (
            <p className="auth-msg auth-msg--error mt-4" role="alert">
              <StatusIcon tone="error" />
              <span>{error}</span>
            </p>
          )}

          <div className="mt-9">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] flex items-center justify-center gap-2 bg-brand hover:bg-brand-dim text-white font-semibold rounded-2xl text-[15px] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-[0_10px_28px_-10px_var(--brand-glow)]"
            >
              {loading && <span className="auth-spinner" aria-hidden="true" />}
              {loading ? t('registerLoading') : t('registerButton')}
            </button>

            <p className="mt-5 text-center text-[13px] text-ink-muted">
              {t('registerHaveAccount')}{' '}
              <Link
                to="/login"
                className="font-semibold text-brand hover:text-brand-dim transition-colors"
              >
                {t('registerLogin')}
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

export default Register
