// 타임캡슐함 (/capsule)
// 봉인 중인 캡슐(D-day)과 도착한 캡슐을 보여준다. 내용은 개봉 전까지 서버가 내려주지 않는다.
// 목록 자체(검색·월별 그룹·접기)는 CapsuleMailbox 가 맡는다 — 여기는 화면 껍데기.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyCapsules } from '../../hooks/useTimeCapsule'
import { isAuthenticated } from '../../utils/auth'
import CapsuleMailbox from './CapsuleMailbox'
import CapsuleRail from './CapsuleRail'
import './capsule.css'
import { useThemeArt } from '../../hooks/useThemeArt'
import { CAPSULE_HERO } from '../../utils/themeAssets'

const CapsuleList = () => {
  const navigate = useNavigate()
  // 도착함은 한 페이지씩 온다 — 아래 [더 보기]가 다음 페이지를 이어 붙인다
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useMyCapsules(
    isAuthenticated(),
  )

  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/capsule')
      navigate('/login')
    }
  }, [navigate])

  // 히어로 삽화는 CSS 배경이라 이 엘리먼트가 렌더된 뒤에야 요청이 나간다(themeAssets.ts 참고).
  // 홈 배너가 미리 데워 뒀으면 첫 렌더부터 보이고, 아니면 도착에 맞춰 페이드인한다.
  const artReady = useThemeArt(CAPSULE_HERO)

  const mailbox = data ?? { sealed: [], arrived: [], arrivedTotal: 0, unreadTotal: 0 }
  const isEmpty = !isLoading && mailbox.sealed.length === 0 && mailbox.arrived.length === 0

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 셸을 풀고 본문(캡슐함) + 우측 레일(봉인하기·한눈에·다가올 개봉) 2단 표준 규격 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-gray-700 dark:text-white/80"
            aria-label="뒤로"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-[16px] font-extrabold">타임캡슐</h1>
        </div>

        {/* 히어로 — 배경 삽화는 capsule.css 의 .capsule-hero-art (docs/capsule-hero-bg-prompts.md) */}
        <section className="capsule-hero relative mx-4 mt-5 overflow-hidden rounded-[26px] px-6 py-7">
          <div
            className={`capsule-hero-art absolute inset-0 pointer-events-none${artReady ? ' is-ready' : ''}`}
            aria-hidden
          />
          <div className="capsule-hero__body relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2f6bd8] dark:text-white/70">
              Time Capsule
            </p>
            {/* 제목·안내 첫 문장은 어느 폭에서나 한 줄로 흐른다.
                안내 한 줄은 289px 라, 모바일(카드 382 기준)에서 끝자락이 삽화의 **날아오르는
                편지 줄** 위를 지난다(다크 배경 밝기 p95 118 · 상한 110 — 사용자 확인 후 채택).
                여기서 문구를 더 늘리면 양 머리에 올라탄다. 늘릴 거면
                `python docs/capsule-hero-process.py` 의 밝기 검사를 다시 돌릴 것.
                더 좁은 폰(≤360)에서는 낱말 단위로 자연스럽게 접힌다(break-keep). */}
            <h2 className="text-[21px] font-extrabold tracking-[-0.02em] leading-[1.35] mt-1.5 break-keep text-[#152648] dark:text-white">
              미래의 나에게, 사랑하는 이에게
            </h2>
            <p className="text-[12.5px] mt-2 leading-[1.6] break-keep text-[#41527a] dark:text-white/80">
              오늘의 마음을 봉인하면 정해진 날 아침에 도착해요.
              <br />
              개봉 전엔 나도 열어볼 수 없어요.
            </p>
            <button
              type="button"
              onClick={() => navigate('/capsule/new')}
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand text-white text-[13.5px] font-extrabold shadow-[0_6px_16px_-6px_var(--brand-glow)] active:scale-[0.97] dark:bg-white dark:text-brand dark:shadow-sm"
            >
              {/* 봉인된 편지 — 손+펜 이모지가 삽화 위에서 겉돌아 스트로크 아이콘으로 교체 */}
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <path d="m3.5 6.5 8.5 6 8.5-6" />
              </svg>
              새 캡슐 봉인하기
            </button>
          </div>
        </section>

        {isLoading && (
          <div className="mx-4 mt-5 space-y-3">
            <div className="h-16 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            <div className="h-16 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          </div>
        )}

        <CapsuleMailbox
          data={mailbox}
          paging={{
            hasMore: !!hasNextPage,
            loadingMore: isFetchingNextPage,
            onLoadMore: () => void fetchNextPage(),
          }}
        />

        {/* 빈 상태 */}
        {isEmpty && (
          <div className="mx-4 mt-6 p-8 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] text-center">
            <span className="text-4xl block mb-3">💌</span>
            <p className="text-[14.5px] font-bold text-ink-strong">
              아직 봉인한 캡슐이 없어요
            </p>
            <p className="text-[12.5px] text-gray-500 dark:text-white/50 mt-1.5 leading-[1.6]">
              1년 뒤의 나, 스무 살이 될 아이에게
              <br />
              오늘의 기도와 마음을 남겨보세요
            </p>
          </div>
        )}
      </div>

      <CapsuleRail data={mailbox} />
      </div>
    </div>
  )
}

export default CapsuleList
