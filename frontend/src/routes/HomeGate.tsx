import { lazy } from 'react'
import { useLocation } from 'react-router-dom'
import { tokenStore } from '../utils/tokenStore'
import { loadHome } from '../utils/homeChunk'

// 로그인 홈 피드 — 비로그인 방문자(랜딩·딥링크)는 받을 필요가 없어 메인 번들에서 뗀다.
// 토큰이 있으면 모듈 평가 직후 바로 받아 두어 라우트 진입 때 폭포수(메인 → 홈) 없이 그린다.
// 로그인 화면은 마중 연출 동안 같은 로더로 선요청한다(utils/homeChunk).
const NewHome = lazy(loadHome)
if (tokenStore.getAccess()) void loadHome()
// 비로그인 첫 화면 — 로그인 교인의 메인 번들에서 떼어내되, 비로그인이면 모듈 로드 즉시
// 청크를 받아둬서 라우트 진입 시 폭포수(메인 → 랜딩) 없이 바로 그린다.
const loadLanding = () => import('../pages/Landing/Landing')
const Landing = lazy(loadLanding)
// 딥링크(#/bible/1/1 등)로 들어온 비로그인 방문자에겐 랜딩 청크가 첫 화면과 무관하다 — 루트일 때만
const atRootHash = /^#?\/?(\?|$)/.test(window.location.hash)
if (!tokenStore.getAccess() && atRootHash) void loadLanding()

// 메인 분기 — 로그인 교인은 매일 쓰는 기도 피드 홈, 비로그인 방문자는 교회 소개 랜딩.
// (X·인스타그램 문법: 로그인 = 피드, 비로그인 = 소개 페이지)
// 비로그인이 피드를 구경하고 싶으면 랜딩의 "둘러보기" → /feed 로 간다.
export const HomeGate = () => {
  // location 을 "구독만" 한다 — 분기에 쓰지는 않는다.
  // <Route element={<HomeGate />}> 의 element 객체는 App 이 리렌더될 때만 새로 만들어진다.
  // 라우트 이동으로 리렌더되는 쪽은 Routes 아래뿐이라, 같은 element 참조를 다시 받은 React 는
  // 이 서브트리 렌더를 통째로 건너뛴다(bailout). 그래서 '/' 에서 로그아웃해 '/' 로
  // replace 하면 토큰은 지워졌는데도 HomeGate 가 다시 실행되지 않아 로그인 피드(NewHome)가
  // 그대로 남아 "로그아웃이 안 먹는" 것처럼 보였다.
  // useLocation() 은 컨텍스트 구독이라 bailout 된 서브트리에도 갱신이 전달된다 →
  // 같은 경로로의 navigate 에도 아래 토큰 검사가 다시 돈다.
  useLocation()
  return tokenStore.getAccess() ? <NewHome /> : <Landing />
}

export { NewHome, Landing }
