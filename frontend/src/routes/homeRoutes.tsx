import { lazy } from 'react'
import { Route } from 'react-router-dom'
import { menuRouteLoaders } from '../utils/routePreload'
import { tokenStore } from '../utils/tokenStore'
import { HomeGate, NewHome, Landing } from './HomeGate'

// 첫 화면·인증·내 계정 — 진입 직후 필요한 청크라 모듈 평가 시점에 미리 받는다

// 로그인 화면 — 로그인 교인에겐 쓸 일 없는 코드·CSS(AuthForm·환영 전환)라 메인 번들에서 뗀다.
// 비로그인이면 어느 경로로 들어왔든(보호 페이지 딥링크 → /login 리다이렉트 포함) 곧바로 받아둔다.
const loadLogin = () => import('../pages/Auth/Login')
const Login = lazy(loadLogin)
if (!tokenStore.getAccess()) void loadLogin()
const Register = lazy(() => import('../pages/Auth/Register'))
const Profile = lazy(menuRouteLoaders['/profile'])
const AccountSettings = lazy(menuRouteLoaders['/account'])

export const homeRoutes = (
  <>
    <Route path="/" element={<HomeGate />} />
    {/* 비로그인 둘러보기용 피드 직행 경로 (랜딩 CTA에서 진입) */}
    <Route path="/feed" element={<NewHome />} />
    {/* 로그인(관리자) 상태에서도 비로그인 랜딩을 열어 카피를 편집·미리보기 */}
    <Route path="/welcome" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/account" element={<AccountSettings />} />
  </>
)
