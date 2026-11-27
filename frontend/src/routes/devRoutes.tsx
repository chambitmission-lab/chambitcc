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
      // 홈 묵상 카드 본문(핵심 절·질문·CTA) 시안 비교
      ['meditation-content', () => import('../pages/dev/MeditationContentLab')],
      // 오디오북 재생 배경/애니메이션 시안 비교
      ['audio-bg', () => import('../pages/Bible/components/AudioBgPreview')],
      // 공지 포스터 확대 보기
      ['notice-poster', () => import('../pages/Home/components/NoticePosterPreview')],
      // 공지 본문 서식(경량 마크업) 렌더
      ['notice-markup', () => import('../pages/Admin/components/NoticeMarkupPreview')],
      // 타임캡슐 개봉 후 편지 화면(아침 하늘·우표·종이테이프) / ?arrival=1 도착·개봉 연출
      ['capsule-letter', () => import('../pages/Capsule/CapsuleLetterPreview')],
      // 홈 "올해의 말씀" 카드 리디자인 후보 비교
      ['annual-verse', () => import('../pages/Home/AnnualVersePreview')],
      // 장 상단 "함께 읽기" 한 줄 리디자인 후보 비교
      ['presence-pill', () => import('../pages/Bible/components/together/PresencePillPreview')],
      // 익명 중보 — 표본 데이터
      ['intercession', () => import('../pages/Intercession/IntercessionPreview')],
      // 섬기는 사람들 — 배치·다크모드 (표본 데이터)
      ['people', () => import('../pages/People/PeoplePreview')],
      // 섬기는 사람들 관리 데스크 — 관리자 로그인 없이 명단·상세·미리보기
      ['people-admin', () => import('../pages/dev/PeopleAdminPreview')],
      // 행사 앨범 관리 데스크 — 관리자 로그인 없이 목록·상세·미리보기
      ['event-albums-admin', () => import('../pages/dev/EventAlbumAdminPreview')],
      // 섬기는 사람들 카드 마우스 오버 시안 비교 — ?v=a~f (프록시로 운영 사진)
      ['people-hover', () => import('../pages/dev/PeopleHoverLab')],
      // 섬기는 사람들 사진 카드 입체감 시안 — 정적 효과 A~F 한 화면 비교
      ['people-depth', () => import('../pages/dev/PeopleDepthLab')],
      // 섬기는 사람들 사진 카드 움직임 시안 — 현상·보더 빔·빛 스윕·낙서·스티커·글래스
      ['people-motion', () => import('../pages/dev/PeopleMotionLab')],
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
      // PC 선거 관리 — 중계 스코어보드 + 말로 풀기 (?v=quiet 진행 중 없음 / ?v=empty)
      ['election-desk', () => import('../pages/dev/ElectionDeskPreview')],
      // 디지털 주보 PC 편집기 — 관리자 로그인 없이 배치·붙여넣기
      ['bulletin-desk', () => import('../pages/dev/BulletinDeskPreview')],
      // 가계도 시대순 "말씀 오솔길" — 진도 표본(?read=0.3)으로 로그인 없이
      ['genealogy-trail', () => import('../pages/dev/GenealogyTrailPreview')],
      // 가계도 상단 노선 카드 + 본문 노선 — 비로그인·진행 중(?read=0.6)·완주 전환
      ['genealogy-head', () => import('../pages/dev/GenealogyHeadPreview')],
      // 따라쓰기 릴레이 방 — 칸 판·소식 띠·응원·바통 시트(표본 방)
      ['typing-relay', () => import('../pages/dev/TypingRelayRoomPreview')],
      // 필사 화면 개편 — 혼자 쓸 때(같은 장 사람·알아두면 좋은 말) / 릴레이 방 독서실(?room=1)
      ['typing-together', () => import('../pages/dev/TypingTogetherPreview')],
      // 필사 허브 첫 화면(오늘의 필사 + 골라 쓰기) 개편 시안 — ?v=mix|b|c
      ['typing-hub', () => import('../pages/dev/TypingHubPreview')],
      // 홈 타임캡슐 카드 라이트 색 시안 — ?v=all|now|a|b|c|d
      ['capsule-card', () => import('../pages/dev/CapsuleCardPreview')],
      // 공동 기도제목(/prayer-topics) 개편 시안 비교 — ?v=a|b|c
      ['prayer-topics', () => import('../pages/dev/PrayerTopicsPreview')],
      // 설교 본문 작업대 · 원고 쓰기 · 강단 보기 — 표본 데이터(?v=study|manuscript|pulpit)
      ['sermon-desk', () => import('../pages/dev/SermonDeskPreview')],
      // 바이블 퀘스트 첫 진입 준비 중 화면(스켈레톤) — ?error=1 이면 실패 상태
      ['quest-skeleton', () => import('../pages/dev/QuestSkeletonPreview')],
      // 2독부터 장 머리 '다시 읽는 길' 카드 — 회차 렌즈 질문 + 지난 회차의 나(표본)
      ['read-again', () => import('../pages/dev/ReadAgainPreview')],
      // 전신갑주 토끼 — 단계·장비·표정별 지도 위(58px) / 내 토끼 히어로(200px)
      ['rabbit', () => import('../pages/dev/RabbitPreview')],
      // 레벨업 축하 모먼트(키네틱 리소) — ?lv=8 로 레벨 지정, 닫으면 다시 열림
      ['level-up', () => import('../pages/dev/LevelUpPreview')],
      // 칭호 해금 팝업(B1 풀아트 카드) — ?key=puzzle_cross|puzzle_master|dawn_riser
      ['title-unlock', () => import('../pages/dev/TitleUnlockPreview')],
      // 말씀 퍼즐 — 목록 카드(?state=progress|ready|done) · 맞추기 화면 · 조각 쪽지 (표본 데이터)
      ['puzzle', () => import('../pages/dev/PuzzlePreview')],
      // /growth 하루하루의 발자취 — 순간 강조 피드 + 하루 한 문장(표본, 오늘 기준 상대 날짜)
      ['footprints', () => import('../pages/dev/FootprintsPreview')],
      // /growth 인사이트 자리 대안 시안 — ?v=a|b|c|d|mix, &sparse=1
      ['growth-rewind', () => import('../pages/dev/GrowthRewindPreview')],
      // 마우스가 지나간 자리 빛 잔상 시안 비교 — ?v=a~f
      ['cursor-trail', () => import('../pages/dev/CursorTrailLab')],
      // 목양칼럼(/ministry) 전면 개편 시안 비교 — ?v=a|b|c|d (운영 칼럼 스냅샷)
      ['ministry-redesign', () => import('../pages/dev/MinistryRedesignPreview')],
      // /today '작년 오늘의 나' 개편 시안 비교 — ?v=a|b|c, &data=one(기록 하나)|rich
      ['today-memory', () => import('../pages/dev/TodayMemoryPreview')],
      // /news 주보 탭 '이번 주 주보' 히어로 개선 시안 — ?v=now|a|b|c|d, &device=mobile
      ['bulletin-hero', () => import('../pages/dev/BulletinHeroPreview')],
      // PC 좌측 레일 '나누기' 버튼 × 하단 삽화 어울림 시안 — 지금/A/B/C/D
      ['rail-share', () => import('../pages/dev/RailSharePreview')],
      // PC 좌측 레일 하단 삽화 사계절 나무 시연 — 봄·여름·가을·겨울(눈) + 한 해 흘려 보기
      ['rail-seasons', () => import('../pages/dev/RailSeasonsPreview')],
      // PC 좌측 레일 메뉴 '지금 있는 자리' 표시 개편 시안 — 지금/A 주보 차례/B 아치 창/C 수채 붓자국/D 소인
      ['rail-menu', () => import('../pages/dev/RailMenuPreview')],
      // /sermon 설교 영상 모달 감성 개편 시안 — ?v=a|b|c|d, &device=mobile
      ['sermon-player', () => import('../pages/dev/SermonPlayerPreview')],
      // 설교 극장 사계절 색 시안 — ?s=none|spring|summer|autumn|winter, &fx=1 계절 입자
      ['sermon-seasons', () => import('../pages/dev/SermonSeasonsPreview')],
      // 삭제·확인 모달(ConfirmDialog) 감성 개편 시안 — ?v=now|a|b|c|d
      ['confirm-dialog', () => import('../pages/dev/ConfirmDialogPreview')],
      // /about '다섯 만남' 장 개편 시안 — ?v=now|a|b|c|d
      ['about-meet', () => import('../pages/dev/AboutMeetPreview')],
      // /about 맨 아래 '초대' 장 개편 시안 — ?v=now|a|b|c|d
      ['about-invite', () => import('../pages/dev/AboutInvitePreview')],
      // 말씀 카드 카카오톡 피드 카드 개편 시안 — ?v=all|now|a|b|c|d|e
      ['kakao-postcard', () => import('../pages/dev/KakaoPostcardPreview')],
      // /greeting 담임목사 사진 입체 연출 시안 — ?v=all|a|b|c|d
      ['greeting-portrait', () => import('../pages/dev/GreetingPortraitPreview')],
      // /events 일정 목록 감성 개편 시안 — ?v=a 쪽지|b 일력|c 게시판|d 다이어리
      ['events-board', () => import('../pages/dev/EventsBoardPreview')],
      // /events 히어로를 우편엽서 목록과 맞추는 시안 — ?v=h1 봉투|h2 큰 사진|h3 초대장
      ['events-hero', () => import('../pages/dev/EventsHeroPreview')],
      // /events 달력 영역(달력+고른 날+다가오는 일정) 개편 시안 — ?v=a 벽달력|b 우표 시트|c 스티커판|d 일력
      ['events-calendar', () => import('../pages/dev/EventsCalendarPreview')],
      // /news 오른쪽 레일(NewsSidebar) 개편 시안 — ?v=all|now|a 주보 꽂이|b 주일 사이|c 꼭 챙길 일|d 쪽 넘겨보기
      ['news-rail', () => import('../pages/dev/NewsRailPreview')],
      // /worship 처음 온 성도 중심 전면 개편 시안 — ?v=a 초대+내 주일 아침|b 두 갈래 문|c 대림절 초대장
      ['worship-redesign', () => import('../pages/dev/WorshipRedesignPreview')],
      // /admin/chatbot 전면 개편 시안 — ?v=a 가르치기 교실|b 말 사전|c 질문함 3단 데스크
      ['chatbot-admin', () => import('../pages/dev/ChatbotAdminPreview')],
      // /admin/news 전면 개편 시안 — ?v=a 편집 데스크|b 주일 연재판|c 게시판 표+서랍
      ['news-admin', () => import('../pages/dev/NewsAdminPreview')],
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
