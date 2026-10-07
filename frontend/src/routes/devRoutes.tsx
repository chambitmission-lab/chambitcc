import { lazy, type ComponentType } from 'react'
import { Route } from 'react-router-dom'

// dev 전용 미리보기 — /#/dev/<path>. 백엔드·로그인 없이 배치·시안을 확인한다.
// 프로덕션 빌드에선 import.meta.env.DEV 가 false 로 접혀 표 전체(동적 import 포함)가 번들에서 빠진다.
// 새 미리보기는 아래 표에 한 줄만 추가하면 된다.

type Loader = () => Promise<{ default: ComponentType }>

const previews: [path: string, load: Loader][] = import.meta.env.DEV
  ? [
      // 업적 모달
      ['achievements', () => import('../pages/Profile/components/AchievementModalPreview')],
      // 구절 공유 시트 — 포맷/카드
      ['verse-share', () => import('../pages/Bible/components/VerseSharePreview')],
      // 프로필 헤더 — 아바타 후광/칭호 칩 구도
      ['profile-header', () => import('../pages/Profile/components/ProfileHeaderPreview')],
      // 홈 묵상 카드 — 목 데이터로 레이아웃
      ['meditation-card', () => import('../pages/Home/components/DailyMeditationCardPreview')],
      // 오디오북 재생 배경/애니메이션 시안 비교
      ['audio-bg', () => import('../pages/Bible/components/AudioBgPreview')],
      // 공지 포스터 확대 보기
      ['notice-poster', () => import('../pages/Home/components/NoticePosterPreview')],
      // 공지 본문 서식(경량 마크업) 렌더
      ['notice-markup', () => import('../pages/Admin/components/NoticeMarkupPreview')],
      // 타임캡슐 개봉 후 편지 화면(아침 하늘·우표·종이테이프)
      ['capsule-letter', () => import('../pages/Capsule/CapsuleLetterPreview')],
      // 홈 "올해의 말씀" 카드 리디자인 후보 비교
      ['annual-verse', () => import('../pages/Home/AnnualVersePreview')],
      // 장 상단 "함께 읽기" 한 줄 리디자인 후보 비교
      ['presence-pill', () => import('../pages/Bible/components/together/PresencePillPreview')],
      // 익명 중보 — 표본 데이터
      ['intercession', () => import('../pages/Intercession/IntercessionPreview')],
      // 섬기는 사람들 — 배치·다크모드 (표본 데이터)
      ['people', () => import('../pages/People/PeoplePreview')],
      // PC 좌측 내비 레일 — 아이콘/항목 시안 비교
      ['nav-rail', () => import('../pages/dev/NavRailPreview')],
      // 성경 읽기 현황 히어로 — 진행률 카드 배치
      ['reading-hero', () => import('../pages/dev/ReadingHeroPreview')],
      // 홈 공지 배너 포스터 썸네일 — 크롭 방식 시안 비교
      ['notice-banner', () => import('../pages/dev/NoticeBannerPreview')],
      // 헤더 워드마크("참빛교회") — 로고 시안 비교
      ['logo', () => import('../pages/dev/LogoPreview')],
      // 선거 발표 화면(프로젝터) — 진행 중인 선거 없이 배치·삽화 자리
      ['election-stage', () => import('../pages/dev/ElectionStagePreview')],
      // 디지털 주보 PC 편집기 — 관리자 로그인 없이 배치·붙여넣기
      ['bulletin-desk', () => import('../pages/dev/BulletinDeskPreview')],
      // 가계도 시대순 "말씀 오솔길" — 진도 표본(?read=0.3)으로 로그인 없이
      ['genealogy-trail', () => import('../pages/dev/GenealogyTrailPreview')],
    ]
  : []

export const devRoutes = (
  <>
    {previews.map(([path, load]) => {
      const Preview = lazy(load)
      return <Route key={path} path={`/dev/${path}`} element={<Preview />} />
    })}
  </>
)
