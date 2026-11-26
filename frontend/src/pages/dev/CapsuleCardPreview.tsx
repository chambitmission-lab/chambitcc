import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureSerifKr } from '../../utils/deferredFonts'
import '../Home/components/TimeCapsuleCard.css'
import './CapsuleCardPreview.css'

/**
 * /#/dev/capsule-card — 홈 타임캡슐 카드(TimeCapsuleCard) 라이트 색 시안.
 *   ?v=all | now | a | b | c | d
 * 양 삽화·레이아웃·문구는 그대로, 카드 바탕·글자색·액센트만 바꾼다.
 * 각 시안은 세 상태(도착 / 봉인 D-day / 비어 있음)를 함께 보여준다.
 */

type State = 'arrived' | 'sealed' | 'empty'

const VARIANTS = [
  { key: 'live', cls: '', name: '적용됨 (A + A4 + S3)', note: '실제 TimeCapsuleCard.css 만으로 그린 카드 — 시안 클래스 없음. 다크도 이 칸으로 확인' },
  { key: 'now', cls: '', name: '지금', note: '회청색 판 위에 흰 하늘 삽화 — 오른쪽 이음매가 떠 보인다' },
  { key: 'a', cls: 'tcv tcv--clean tcv-a', name: 'A. 흰 카드', note: '토스 기본 문법. 양이 주인공, 라벨은 파란 알약, 도착은 주황 점' },
  { key: 'b', cls: 'tcv tcv-b', name: 'B. 새벽 하늘', note: '위 하늘빛 → 아래 살구빛. 편지 화면 아침 하늘과 한 이야기, 양 발밑이 따뜻' },
  { key: 'c', cls: 'tcv tcv--clean tcv-c', name: 'C. 편지지 아이보리', note: '봉투·밀랍 도장에서 뽑은 종이색, 도착·D-day는 금빛, 버튼은 먹색' },
  { key: 'd', cls: 'tcv tcv-d', name: 'D. 맑은 하늘(지금 다듬기)', note: '하늘빛 정체성 유지, 탁한 회청 → 맑은 하늘, 아래로 옅어져 삽화와 이어짐' },
  // ── A 흰 카드 위 글자 처리 시안 ──
  { key: 'a1', cls: 'tcv tcv--clean tcv-a tcv-a1', name: 'A1. 먹색 + 형광펜', note: '제목은 한 색, "도착하는 편지"에만 옅은 하늘빛 밑줄. 도착 알림도 브랜드 파랑' },
  { key: 'a2', cls: 'tcv tcv--clean tcv-a tcv-a2', name: 'A2. 편지 명조', note: '제목만 명조(Noto Serif KR) — 편지 한 통의 말투. 나머지는 산스' },
  { key: 'a3', cls: 'tcv tcv--clean tcv-a tcv-a3', name: 'A3. 상태 알약', note: '라벨은 조용히, 상태 줄을 색 알약으로 — 도착은 주황, D-day는 파랑, 없음은 회색' },
  { key: 'a4', cls: 'tcv tcv--clean tcv-a tcv-a4', name: 'A4. 두 단 위계', note: '"시간을 건너,"는 가볍게 회색, 둘째 줄을 크고 굵게 — 한 줄이 먼저 읽힌다' },
  { key: 'a5', cls: 'tcv tcv--clean tcv-a tcv-a5', name: 'A5. 내 캡슐이 제목', note: '문구 자체를 바꿈 — 상태를 큰 제목으로, "시간을 건너 도착하는 편지"는 라벨로' },
  // ── A4 위 상태 줄 트렌디 시안 ──
  { key: 's1', cls: 'tcv tcv--clean tcv-a tcv-a4 tcv-s1', name: 'S1. 숫자 배지', note: '알림 앱 문법 — 파란 숫자 배지 + 먹색 문장. 점·색 글씨 없이 숫자가 먼저 보인다' },
  { key: 's2', cls: 'tcv tcv--clean tcv-a tcv-a4 tcv-s2', name: 'S2. 아이콘 타일', note: '작은 둥근 타일 안 라인 아이콘(봉투·모래시계·펜) + 굵은 한마디 · 회색 보조. 도착은 빨간 점' },
  { key: 's3', cls: 'tcv tcv--clean tcv-a tcv-a4 tcv-s3', name: 'S3. 숫자 크게', note: '장식 없이 숫자만 크게 — "기다리는 편지 1통", "열리기까지 28일". 토스 홈 금액 문법' },
  { key: 's4', cls: 'tcv tcv--clean tcv-a tcv-a4 tcv-s4', name: 'S4. 반짝 그라데이션', note: '도착했을 때만 파랑 그라데이션 글씨에 빛이 한 번씩 스친다. 평소엔 조용한 회색' },
  { key: 's5', cls: 'tcv tcv--clean tcv-a tcv-a4 tcv-s5', name: 'S5. 흰 칩 + 그림자', note: '상태를 떠 있는 흰 칩으로 — 옅은 테두리·그림자, 안에 작은 아이콘. 요즘 iOS 위젯 느낌' },
]

const TEXT_SET = ['a', 'a1', 'a2', 'a3', 'a4', 'a5']
const STATUS_SET = ['live', 'a4', 's1', 's2', 's3', 's4', 's5']

const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)
const ICON = {
  mail: 'M4 6h16v12H4z M4 7l8 6 8-6',
  hourglass: 'M7 3h10 M7 21h10 M8 3c0 5 8 5 8 9s-8 4-8 9 M16 3c0 5-8 5-8 9s8 4 8 9',
  pen: 'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',
}

/** S1~S5 상태 줄 */
const TrendStatus = ({ k, state }: { k: string; state: State }) => {
  if (k === 's1') {
    if (state === 'arrived') return <span className="tcs"><b className="tcs-badge">1</b>통의 편지가 도착했어요</span>
    if (state === 'sealed') return <span className="tcs"><b className="tcs-badge tcs-badge--wide">D-28</b>성탄절에 열려요</span>
    return <span className="tcs"><b className="tcs-badge tcs-badge--ghost">+</b>지금 마음을 봉인해보세요</span>
  }
  if (k === 's2' || k === 's5') {
    const [ic, strong, sub, dot] =
      state === 'arrived' ? [ICON.mail, '편지 1통 도착', '열어보기', true]
      : state === 'sealed' ? [ICON.hourglass, 'D-28', '성탄절에 열려요', false]
      : [ICON.pen, '첫 캡슐 쓰기', '지금 이 마음', false]
    return (
      <span className="tcs">
        <span className="tcs-tile">
          <Ico d={ic as string} />
          {dot ? <i className="tcs-dot" /> : null}
        </span>
        <b>{strong}</b>
        <span className="tcs-sub">· {sub}</span>
      </span>
    )
  }
  if (k === 's3') {
    if (state === 'arrived') return <span className="tcs">기다리는 편지 <b className="tcs-num">1</b>통</span>
    if (state === 'sealed') return <span className="tcs">열리기까지 <b className="tcs-num">28</b>일 <span className="tcs-sub">· 성탄절</span></span>
    return <span className="tcs">아직 봉인한 편지가 없어요</span>
  }
  // s4
  if (state === 'arrived') return <span className="tcs"><span className="tcs-shine">✦ 도착한 편지 1통이 기다려요</span></span>
  if (state === 'sealed') return <span className="tcs">다음 개봉까지 <b className="tcs-blue">D-28</b> <span className="tcs-sub">· 성탄절</span></span>
  return <span className="tcs">지금 이 마음을 봉인해보세요</span>
}

/** A5 전용 — 상태별 제목/보조 줄 */
const A5_COPY: Record<State, { title: ReactNode; sub: string }> = {
  arrived: { title: <>편지 <em>1통</em>이<br />도착했어요</>, sub: '지금 열어보기' },
  sealed: { title: <>성탄절에 열릴 편지,<br /><em>28일</em> 남았어요</>, sub: '봉인한 캡슐 보기' },
  empty: { title: <>지금 이 마음을<br /><em>봉인</em>해볼까요?</>, sub: '첫 캡슐 쓰기' },
}

const Status = ({ state }: { state: State }) => {
  if (state === 'arrived')
    return (
      <span className="tc-card__status tc-card__status--arrived">
        <span className="tc-card__pulse" aria-hidden />
        도착한 캡슐 1개가 기다려요
      </span>
    )
  if (state === 'sealed')
    return (
      <span className="tc-card__status tc-card__status--sealed">
        다음 개봉까지
        <strong className="tc-card__dday tabular-nums">D-28</strong>
        <span className="tc-card__when">· 성탄절</span>
      </span>
    )
  return <span className="tc-card__status">지금 이 마음을 봉인해보세요</span>
}

/** 적용된 카드와 같은 상태 줄 마크업 (TimeCapsuleCard.tsx) */
const LiveStatus = ({ state }: { state: State }) => {
  if (state === 'arrived')
    return (
      <span className="tc-card__status tc-card__status--arrived">
        <span>기다리는 편지<strong className="tc-card__num">1</strong>통</span>
      </span>
    )
  if (state === 'sealed')
    return (
      <span className="tc-card__status tc-card__status--sealed">
        <span>열리기까지<strong className="tc-card__num">111</strong>일</span>
        <span className="tc-card__when">· 성탄절</span>
      </span>
    )
  return <span className="tc-card__status">아직 봉인한 편지가 없어요</span>
}

const Card = ({ cls, state, k }: { cls: string; state: State; k: string }) => (
  <button type="button" className={`tc-card ${cls}`}>
    <span className="tc-card__milkyway" aria-hidden />
    <span className="tc-card__stars" aria-hidden />
    <span className="tc-card__meteor" aria-hidden />
    <span className="tc-card__art" aria-hidden />
    {k === 'a5' ? (
      <span className="tc-card__body">
        <span className="tc-card__label">타임캡슐 · 시간을 건너 온 편지</span>
        <span className="tc-card__title">{A5_COPY[state].title}</span>
        <span className="tcv-sub">{A5_COPY[state].sub} ›</span>
      </span>
    ) : (
      <span className="tc-card__body">
        <span className="tc-card__label">타임캡슐</span>
        <span className="tc-card__title">
          시간을 건너,
          <br />
          <span className={k === 'live' ? 'tc-card__title-main' : 'tcv-line2'}>
            그날 <em>도착하는 편지</em>
          </span>
        </span>
        {k === 'live' ? <LiveStatus state={state} /> : k.startsWith('s') ? <TrendStatus k={k} state={state} /> : <Status state={state} />}
      </span>
    )}
    <span className="tc-card__go" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M5 12h13M12.5 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  </button>
)

const CapsuleCardPreview = () => {
  const [params, setParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  useState(() => void ensureSerifKr())
  const v = params.get('v') ?? 'status'
  const shown =
    v === 'all'
      ? VARIANTS
      : v === 'status'
        ? VARIANTS.filter(x => STATUS_SET.includes(x.key))
      : v === 'text'
        ? VARIANTS.filter(x => TEXT_SET.includes(x.key))
        : VARIANTS.filter(x => x.key === v)

  return (
    <div className="min-h-screen bg-[#f2f4f6] dark:bg-[#101114] px-4 py-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <h1 className="text-[18px] font-extrabold text-[#191f28] dark:text-white mr-2">타임캡슐 카드 색 시안</h1>
          {['status', 'text', 'all', ...VARIANTS.map(x => x.key)].map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setParams({ v: k })}
              className={`px-3 py-1 rounded-full text-[13px] font-bold ${v === k ? 'bg-[#3182f6] text-white' : 'bg-white dark:bg-white/10 text-[#4e5968] dark:text-white/70'}`}
            >
              {k === 'status' ? 'A4 상태 줄' : k === 'text' ? 'A 글자 시안' : k === 'all' ? '전체' : k === 'now' ? '지금' : k.toUpperCase()}
            </button>
          ))}
          <button type="button" onClick={toggleTheme} className="ml-auto px-3 py-1 rounded-full text-[13px] font-bold bg-white dark:bg-white/10 text-[#4e5968] dark:text-white/70">
            {theme === 'dark' ? '라이트로' : '다크로'} (시안은 라이트 전용)
          </button>
        </div>

        <div className="grid gap-x-6 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(372px,1fr))]">
          {shown.map(x => (
            <section key={x.key}>
              <h2 className="text-[15px] font-extrabold text-[#191f28] dark:text-white">{x.name}</h2>
              <p className="text-[13px] text-[#4e5968] dark:text-white/60 mt-0.5 mb-3 min-h-[38px]">{x.note}</p>
              {/* 홈 피드 칼럼과 같은 폭(모바일 390 → 카드 358) 위에 흰 홈 바탕을 깐다 */}
              <div className="rounded-2xl bg-white dark:bg-[#17171c] py-3 flex flex-col gap-3 w-[372px] max-w-full">
                {(['arrived', 'sealed', 'empty'] as State[]).map(s => (
                  <div key={s} className="px-[7px]">
                    <Card cls={x.cls} state={s} k={x.key} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CapsuleCardPreview
