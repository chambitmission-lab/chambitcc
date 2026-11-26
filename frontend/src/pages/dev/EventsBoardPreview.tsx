import { useEffect, useState, type ReactNode } from 'react'
import { CHURCH_SEASON_PHOTO, visitSceneFor } from '../../utils/themeAssets'
import { getNaturalSeason } from '../../utils/naturalSeason'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily } from '../../utils/deferredFonts'
import type { EventCategory } from '../../types/event'
import { CategoryIcon } from '../Events/components/CategoryIcons'
import { CATEGORY_VISUAL } from '../Events/utils/categoryConfig'
import './eventsBoardPreview.css'

/**
 * /#/dev/events-board — /events 일정 목록(AgendaSection·AgendaCard) 감성 개편 시안.
 *   ?v=a 냉장고에 붙인 쪽지 · b 한 장씩 넘기는 일력 · c 현관 게시판 전단 · d 손글씨 주간 다이어리
 * 히어로·달력 레일은 건드리지 않고 '목록' 자리만 바꾼다. 표본 일정만 쓴다(오늘 = 2026-11-26 목).
 */

type VKey = 'final2' | 'final' | 'n1' | 'n2' | 'n3' | 'p1' | 'p2' | 'p3' | 'a41' | 'a42' | 'a43' | 'a44' | 'a1' | 'a2' | 'a3' | 'a4' | 'a' | 'b' | 'c' | 'd'

const VARIANTS: { key: VKey; label: string; bench: string; note: string }[] = [
  {
    key: 'final2',
    label: '최종 · N2 풍경 엽서 (읽기 쉽게)',
    bench: '향수 N2 풍경 엽서 세트 + 일정 줄을 어르신 눈높이로',
    note: '날짜 32px + 요일은 "금요일"처럼 온전히. 제목 20px 진하게. 시간은 굵게 앞에, 장소는 뒤에 — 회색·아이콘 빼고 잉크색 그대로. 남은 날은 알약("내일", "3일 뒤"), 지난 일은 흐리게 하지 않고 "마쳤어요" 알약. 손글씨 한마디는 26px로. "오늘" 줄은 손글씨 대신 또렷한 띠.',
  },
  {
    key: 'final',
    label: '최종 · 향수 N1 양피지',
    bench: '향수 N1 + 지금 교회 전경 + 양피지 몸통',
    note: '사진은 앨범 대신 지금 교회 전경(그 주 계절 — 이번 주 가을, 다음 주 첫눈). 엽서 몸통은 양피지: 가운데 밝고 가장자리로 갈수록 그을린 황갈색, 잉크는 고동색(철분 잉크), 손글씨 한마디는 세피아, 주일은 짙은 다홍. 줄은 가는 갈색 실선 하나로 정리, 오늘 줄은 위아래 점선 대신 옅은 띠 하나.',
  },
  {
    key: 'n1',
    label: '향수 N1 지난 주 한 장면',
    bench: '벤치마킹: 80년대 우체국 "우편엽서"(빨간 우편번호 칸) + 필름 카메라 주황 날짜 도장 + 동네 사진관 인화 사진',
    note: '사진 = 지난 주 행사 앨범에서 고른 실제 한 장("지난 주일, 학습·세례·입교식이 있던 날"). 매주 저절로 바뀌고, 성도 얼굴이 담겨 의미가 생긴다. 앨범이 없는 주는 계절 풍경으로. 받는 사람 "참빛 식구들에게", 끝에 "— 참빛교회에서".',
  },
  {
    key: 'n2',
    label: '향수 N2 풍경 엽서 세트',
    bench: '벤치마킹: 관광지 기념품점의 "풍경 엽서 세트"(No.1~12, 같은 곳 다른 구도)',
    note: '앨범 없이도 되는 방법. 같은 계절이어도 매주 구도를 돌려 쓴다(하늘과 성전 → 십자가 탑 → 정원 …) + 번호 "No.47". 몇 주 모으면 한 세트가 되는 재미.',
  },
  {
    key: 'n3',
    label: '향수 N3 그때 그 시절',
    bench: '벤치마킹: 교회 창립 기념 사진첩, 부모님 앨범의 바랜 흑백 사진',
    note: '가장 향수가 짙은 방법. 관리자가 옛 교회 사진(옛 성전·옛 행사)을 올려 두면 매주 한 장씩 "그때 그 시절" 흑백 사진 + 다음 주엔 "그리고 지금, 같은 자리". 사진은 예시(현재 사진을 흑백 처리).',
  },
  {
    key: 'p1',
    label: '엽서 P1 항공우편',
    bench: '벤치마킹: 빨강·파랑 사선 테두리의 항공우편(Par Avion) 엽서, 여행지 기념품점 사진 엽서',
    note: '사진은 /visit 계절 풍경 — 십자가 탑부터 1층 정원까지 건물 전체가 오른쪽에, 제목은 왼쪽 하늘에. 흰 여백 두른 인화 사진 + 쓰는 면엔 POST CARD·우표(교회 조각)·"참빛 2026.11.23" 소인. 테두리는 코랄·브랜드 블루 사선.',
  },
  {
    key: 'p2',
    label: '엽서 P2 빈티지 컬러',
    bench: '벤치마킹: 1950~60년대 "Greetings from ~" 여행 엽서(따뜻한 필름 색, 큰 레터링)',
    note: '사진에 따뜻한 필름 톤(채도·대비 살짝, 노란기)을 얹고 "참빛에서 보내는 / 이번 주" 큰 레터링(브랜드 블루 그림자). 쓰는 면은 아이보리 종이에 남색 잉크, 우표·소인.',
  },
  {
    key: 'p3',
    label: '엽서 P3 앞뒤 펼침',
    bench: '벤치마킹: 엽서를 앞뒤로 펼쳐 놓은 모습 — 왼쪽 사진 면, 오른쪽 쓰는 면',
    note: 'PC에선 한 주가 가로로 긴 엽서 한 장(왼쪽 세로 사진 크게, 오른쪽에 일정). 사진이 가장 크게 보인다. 모바일은 P1과 같다.',
  },
  {
    key: 'a41',
    label: 'A4-1 주보 오린 쪽지',
    bench: '벤치마킹: 주일 주보의 "교회 소식·이번 주 일정" 칸을 가위로 오려 냉장고에 붙이는 습관',
    note: '쪽지 머리가 진짜 주보 머리 — "참빛교회 주보 · 제1482호 · 대림절 첫째 주일"과 이중 괘선, 명조 날짜. 양 모서리만 테이프. 이번 주 줄 사이에 손글씨 "오늘은 여기"가 끼어 지금 위치를 알려준다.',
  },
  {
    key: 'a42',
    label: 'A4-2 교회 사진 엽서',
    bench: '벤치마킹: 여행지 사진 엽서 뒷면 메모, 교회 창립 기념 엽서',
    note: '쪽지 위쪽이 그 주 계절의 참빛교회 사진(다크=밤 사진). 이번 주는 가을, 다음 주(12월)는 겨울 교회로 저절로 바뀐다. 사진 위 손글씨 "이번 주"와 대림절 촛불.',
  },
  {
    key: 'a43',
    label: 'A4-3 이번 주 말씀 쪽지',
    bench: '벤치마킹: 어르신들이 냉장고에 붙여 두는 "이번 주 암송 말씀" 쪽지',
    note: '쪽지 머리에 그 주 말씀 한 절(개역개정)과 대림절 촛불 — 일정표가 아니라 "이번 주를 이렇게 살자"는 쪽지가 된다. 아래에 손글씨 제목과 일정.',
  },
  {
    key: 'a44',
    label: 'A4-4 떡메모 패드',
    bench: '벤치마킹: 문구점 떡메모지(위가 풀칠된 메모 패드), 미도리 메모 패드',
    note: '위쪽 브랜드 블루 풀칠 띠에 "참빛교회 · WEEKLY", 아래로 한 장 더 겹친 종이 끝이 살짝. 재질 흉내 없이 "한 장씩 뜯는 패드" 형태만. 오늘 날짜엔 손으로 그린 동그라미.',
  },
  {
    key: 'a1',
    label: 'A1 가지런한 쪽지',
    bench: '벤치마킹: 무인양품 마스킹테이프 메모판, 정리 잘 된 사무실 문 메모',
    note: 'A를 그대로 두고 소음만 뺐다. 기울기 0 · 테이프 한 가지 색 · 쪽지 높이 맞춤 · D-3 동그라미 대신 "3일 뒤" 한 단어. 지난 일정은 쪽지를 또 붙이지 않고 종이 한 장에 ✓ 목록.',
  },
  {
    key: 'a2',
    label: 'A2 가로 쪽지 띠',
    bench: '벤치마킹: 교회 사무실 화이트보드에 길게 붙인 주간 메모, 기차역 승강장 시간표',
    note: '쪽지를 가로로 눕혀 왼쪽은 손글씨 큰 날짜, 오른쪽은 시간·제목·장소. "이번 주 / 다음 주"로 묶어 날짜 흐름이 한 줄로 읽힌다. 모바일 한 열이라 어르신이 위에서 아래로 읽기 쉽다.',
  },
  {
    key: 'a3',
    label: 'A3 맨 앞 쪽지',
    bench: '벤치마킹: 냉장고 한가운데 자석으로 눌러 둔 "이번 주 꼭!" 메모',
    note: '가장 가까운 일정 하나만 크게, 자석 하나로 눌러 둔다. 관리자가 남긴 손글씨 한마디("첫 번째 촛불을 함께 켜요")가 감성을 맡고, 나머지는 작은 쪽지로 줄 맞춰 둔다.',
  },
  {
    key: 'a4',
    label: 'A4 한 주 = 쪽지 한 장',
    bench: '벤치마킹: 주보 귀퉁이에 이번 주 일정을 옮겨 적어 냉장고에 붙인 메모지',
    note: '일정마다 쪽지를 붙이지 않고, 한 주 일정을 쪽지 한 장에 적어 붙인다. 조각이 2장뿐이라 가장 정돈돼 보인다. 지난 일정은 같은 쪽지 안에서 ✓와 함께 흐려지고, 더 지난 건 접어 둔다.',
  },
  {
    key: 'a',
    label: 'A (1차)',
    bench: '벤치마킹: 집 냉장고·교회 사무실 문에 마스킹테이프로 붙인 메모, 다꾸 스티커 메모',
    note: '일정 하나 = 테이프로 붙인 쪽지 한 장. 날짜는 손글씨로 크게, 제목은 또렷한 고딕. 카테고리는 테이프 색. 지난 일정은 볼펜으로 쓱 체크하고 "다녀왔어요" — 0명 같은 숫자는 숨긴다.',
  },
  {
    key: 'b',
    label: 'B 일력',
    bench: '벤치마킹: 거실 벽 탁상 일력(하루 한 장 찢는 달력), 호보니치 데일리 페이지',
    note: '날짜가 주인공. 하루 = 일력 한 장, 주일은 빨간 숫자. 맨 위는 일정이 없어도 "오늘" 장을 둔다. 지난 날은 넘긴 장 더미로 접어 두고 누르면 펼친다.',
  },
  {
    key: 'c',
    label: 'C 현관 게시판',
    bench: '벤치마킹: 교회 현관 코르크 게시판의 행사 전단, 동네 도서관 프로그램 포스터',
    note: '일정 = 압정으로 꽂은 작은 전단. 위쪽에 지금 쓰는 카테고리 삽화를 그대로 잘라 쓴다. 지난 전단엔 "은혜로 마쳤어요" 도장. 행사가 많은 달에 한눈에 훑기 좋다.',
  },
  {
    key: 'd',
    label: 'D 주간 다이어리',
    bench: '벤치마킹: 몰스킨·호보니치 위클리 페이지, 수첩에 형광펜 긋는 습관',
    note: '한 주 = 다이어리 한 쪽. 월~주일 줄마다 그날 일정을 적고 제목엔 카테고리 색 형광펜. 오늘 줄엔 손글씨 "오늘". 지난 줄은 체크 표시만 남기고 흐리게.',
  },
]

// ── 표본 일정 ─────────────────────────────────────────────
interface Ev {
  id: number
  title: string
  cat: EventCategory
  date: string // YYYY-MM-DD
  time?: string // 없으면 종일
  place?: string
  going: number
}

const TODAY = '2026-11-26'

const EVENTS: Ev[] = [
  { id: 1, title: '유아세례', cat: 'education', date: '2026-11-15', going: 0 },
  { id: 2, title: '문답 교육 2차 교육', cat: 'education', date: '2026-11-21', time: '오후 3:00', place: '소예배실', going: 0 },
  { id: 3, title: '학습·세례·입교식', cat: 'education', date: '2026-11-22', going: 12 },
  { id: 4, title: '직분자 선거를 위한 특별새벽기도회', cat: 'worship', date: '2026-11-23', going: 0 },
  { id: 5, title: '금요 기도회', cat: 'worship', date: '2026-11-27', time: '오후 8:00', place: '본당', going: 14 },
  { id: 6, title: '대림절 첫째 주일 · 촛불 점화', cat: 'special', date: '2026-11-29', time: '오전 11:00', place: '본당', going: 31 },
  { id: 7, title: '여전도회 김장 나눔', cat: 'service', date: '2026-12-01', time: '오전 9:00', place: '교육관 마당', going: 18 },
  { id: 8, title: '성탄 찬양 연습', cat: 'meeting', date: '2026-12-05', time: '오후 2:00', place: '찬양대실', going: 9 },
  { id: 9, title: '공동의회 · 직분자 선거', cat: 'other', date: '2026-12-06', time: '오후 1:30', place: '본당', going: 0 },
]

const WD = ['주일', '월', '화', '수', '목', '금', '토']
const WD_SHORT = ['일', '월', '화', '수', '목', '금', '토']

const parse = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const md = (k: string) => {
  const d = parse(k)
  return { m: d.getMonth() + 1, d: d.getDate(), wd: d.getDay() }
}
const isPast = (e: Ev) => e.date < TODAY
const dday = (k: string) => {
  const diff = Math.round((parse(k).getTime() - parse(TODAY).getTime()) / 86400000)
  return diff === 0 ? '오늘' : diff === 1 ? '내일' : `D-${diff}`
}

const upcoming = EVENTS.filter((e) => !isPast(e))
const past = EVENTS.filter(isPast).reverse()

/** 카테고리별 종이·테이프·형광펜 색 — 브랜드 블루를 축으로 따뜻한 파스텔 몇 개만 */
const INK: Record<EventCategory, { tape: string; marker: string; label: string }> = {
  worship: { tape: 'rgba(120,170,255,0.55)', marker: 'rgba(120,170,255,0.38)', label: '예배' },
  meeting: { tape: 'rgba(255,205,110,0.6)', marker: 'rgba(255,205,110,0.5)', label: '모임' },
  service: { tape: 'rgba(130,215,180,0.6)', marker: 'rgba(130,215,180,0.45)', label: '봉사' },
  special: { tape: 'rgba(255,170,140,0.6)', marker: 'rgba(255,170,140,0.45)', label: '특별행사' },
  education: { tape: 'rgba(160,205,255,0.6)', marker: 'rgba(160,205,255,0.45)', label: '교육' },
  other: { tape: 'rgba(200,200,200,0.6)', marker: 'rgba(200,200,200,0.5)', label: '기타' },
}

const GroupTitle = ({ children, sub, mobile }: { children: string; sub?: string; mobile?: boolean }) => (
  <div className="flex items-baseline gap-2 mb-3 px-0.5">
    <h3 className={`ebp-hand text-ink-strong ${mobile ? 'text-[24px]' : 'text-[30px]'} leading-none`}>{children}</h3>
    {sub && <span className="text-[12.5px] text-gray-500 dark:text-white/55">{sub}</span>}
  </div>
)

// ── A 냉장고 쪽지 ─────────────────────────────────────────
const Slip = ({ e, i, mobile }: { e: Ev; i: number; mobile?: boolean }) => {
  const { m, d, wd } = md(e.date)
  const done = isPast(e)
  return (
    <article className={`ebp-slip ${done ? 'is-done' : ''}`} style={{ ['--tilt' as string]: `${[-1.4, 0.9, -0.5, 1.2, -1, 0.6][i % 6]}deg` }}>
      <span className="ebp-tape" style={{ background: INK[e.cat].tape, ['--tape-tilt' as string]: `${[-4, 3, -2, 5][i % 4]}deg` }} />
      <div className="flex items-start justify-between gap-2">
        <p className={`ebp-hand leading-none ${mobile ? 'text-[30px]' : 'text-[38px]'} ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-[#2b3a55] dark:text-[#e8ecf5]'}`}>
          {m}.{d}
          <span className={`ml-1 ${mobile ? 'text-[19px]' : 'text-[22px]'} opacity-75`}>{WD[wd]}</span>
        </p>
        {!done && <span className="ebp-hand ebp-circle text-rose-500 dark:text-rose-300 text-[22px]">{dday(e.date)}</span>}
      </div>
      <h4 className={`mt-2 font-bold text-[#1f2a3d] dark:text-white ${mobile ? 'text-[15.5px]' : 'text-[18px]'} leading-[1.35] break-keep`}>{e.title}</h4>
      <p className={`mt-1.5 text-[#5b6577] dark:text-white/65 ${mobile ? 'text-[12.5px]' : 'text-[14px]'}`}>
        {e.time ?? '하루 종일'}
        {e.place && <> · {e.place}</>}
      </p>
      {done ? (
        <span className="ebp-hand ebp-done-mark">다녀왔어요 ✓</span>
      ) : (
        e.going > 0 && <p className="ebp-hand mt-2 text-[23px] text-brand">{e.going}명 함께 가요</p>
      )}
    </article>
  )
}

const VariantA = ({ mobile }: { mobile?: boolean }) => (
  <div className={`ebp-fridge ${mobile ? 'px-3 py-5' : 'px-6 py-7'}`}>
    <GroupTitle mobile={mobile} sub={`${upcoming.length}장`}>앞으로 있을 일</GroupTitle>
    <div className={`grid ${mobile ? 'grid-cols-2 gap-x-3 gap-y-5' : 'grid-cols-3 gap-x-5 gap-y-7'} mb-9`}>
      {upcoming.map((e, i) => <Slip key={e.id} e={e} i={i} mobile={mobile} />)}
    </div>
    <GroupTitle mobile={mobile} sub="지난 쪽지">다녀온 자리</GroupTitle>
    <div className={`grid ${mobile ? 'grid-cols-2 gap-x-3 gap-y-5' : 'grid-cols-3 gap-x-5 gap-y-7'}`}>
      {past.map((e, i) => <Slip key={e.id} e={e} i={i + 3} mobile={mobile} />)}
    </div>
  </div>
)

// ── B 일력 ────────────────────────────────────────────────
const DayPage = ({ k, events, mobile, today }: { k: string; events: Ev[]; mobile?: boolean; today?: boolean }) => {
  const { m, d, wd } = md(k)
  const red = wd === 0
  const blue = wd === 6
  return (
    <article className={`ebp-day ${today ? 'is-today' : ''}`}>
      <div className="ebp-day-holes" aria-hidden="true" />
      <div className={`flex ${mobile ? 'gap-3 px-4 pb-4 pt-3' : 'gap-6 px-6 pb-5 pt-4'}`}>
        <div className={`shrink-0 text-center ${mobile ? 'w-[64px]' : 'w-[88px]'}`}>
          <p className="text-[12px] font-bold tracking-[0.15em] text-gray-400 dark:text-white/45">{m}월</p>
          <p
            className={`ebp-daynum leading-none tabular-nums ${mobile ? 'text-[52px]' : 'text-[72px]'} ${
              red ? 'text-rose-500 dark:text-rose-300' : blue ? 'text-brand' : 'text-[#1f2a3d] dark:text-white'
            }`}
          >
            {d}
          </p>
          <p className={`mt-1 text-[13px] font-bold ${red ? 'text-rose-500 dark:text-rose-300' : 'text-gray-500 dark:text-white/60'}`}>
            {WD[wd]}{wd === 0 ? '' : '요일'}
          </p>
        </div>
        <div className="flex-1 min-w-0 border-l border-dashed border-gray-200 dark:border-white/10 pl-4 py-1">
          {today && <p className="ebp-hand text-[28px] text-brand leading-none mb-2">오늘</p>}
          {events.length === 0 ? (
            <p className={`text-gray-500 dark:text-white/60 ${mobile ? 'text-[14px]' : 'text-[16px]'} break-keep`}>
              오늘은 잡힌 일정이 없어요.
              <br />
              <span className="ebp-hand text-[25px] text-[#2b3a55] dark:text-white/80">내일 저녁 금요 기도회에서 만나요</span>
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {events.map((e) => (
                <li key={e.id}>
                  <p className={`font-bold text-brand tabular-nums ${mobile ? 'text-[13px]' : 'text-[15px]'}`}>
                    {e.time ?? '하루 종일'}
                    {!today && <span className="ml-2 text-gray-400 dark:text-white/45 font-semibold">{dday(e.date)}</span>}
                  </p>
                  <p className={`mt-0.5 font-bold text-ink-strong leading-[1.35] break-keep ${mobile ? 'text-[17px]' : 'text-[21px]'}`}>
                    <CategoryIcon category={e.cat} width={mobile ? 15 : 18} height={mobile ? 15 : 18} className="inline-block align-[-2px] mr-1.5 text-brand" />
                    {e.title}
                  </p>
                  <p className={`mt-0.5 text-gray-500 dark:text-white/60 ${mobile ? 'text-[13px]' : 'text-[15px]'}`}>
                    {INK[e.cat].label}
                    {e.place && <> · {e.place}</>}
                    {e.going > 0 && <> · {e.going}명 함께</>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  )
}

const VariantB = ({ mobile }: { mobile?: boolean }) => {
  const [open, setOpen] = useState(false)
  const days = Array.from(new Set(upcoming.map((e) => e.date)))
  return (
    <div className={mobile ? 'px-3 py-5' : 'px-6 py-7'}>
      <div className={`flex flex-col ${mobile ? 'gap-4' : 'gap-5'}`}>
        <DayPage k={TODAY} events={upcoming.filter((e) => e.date === TODAY)} mobile={mobile} today />
        {days.filter((k) => k !== TODAY).map((k) => (
          <DayPage key={k} k={k} events={upcoming.filter((e) => e.date === k)} mobile={mobile} />
        ))}
      </div>

      <button type="button" onClick={() => setOpen((o) => !o)} className="ebp-torn-stack mt-8 w-full text-left">
        <span className="ebp-torn" />
        <span className="ebp-torn" />
        <span className="relative flex items-center justify-between px-5 py-4">
          <span>
            <span className="ebp-hand block text-[24px] leading-none text-[#2b3a55] dark:text-white/85">넘긴 장 {past.length}장</span>
            <span className="mt-1 block text-[13px] text-gray-500 dark:text-white/55">
              {md(past[past.length - 1].date).m}.{md(past[past.length - 1].date).d} ~ {md(past[0].date).m}.{md(past[0].date).d}
            </span>
          </span>
          <span className="text-[13px] font-bold text-brand">{open ? '접기' : '다시 넘겨보기'}</span>
        </span>
      </button>
      {open && (
        <ul className="mt-3 flex flex-col">
          {past.map((e) => {
            const { m, d, wd } = md(e.date)
            return (
              <li key={e.id} className="flex items-baseline gap-3 py-2.5 border-b border-dashed border-gray-200 dark:border-white/10 opacity-80">
                <span className={`w-16 shrink-0 font-bold tabular-nums text-[15px] ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-gray-500 dark:text-white/60'}`}>
                  {m}.{d} {WD_SHORT[wd]}
                </span>
                <span className="flex-1 text-[16px] font-semibold text-ink-strong">{e.title}</span>
                {e.going > 0 && <span className="text-[13px] text-gray-500 dark:text-white/55">{e.going}명</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── C 현관 게시판 ─────────────────────────────────────────
const Flyer = ({ e, i, mobile }: { e: Ev; i: number; mobile?: boolean }) => {
  const { m, d, wd } = md(e.date)
  const done = isPast(e)
  return (
    <article className={`ebp-flyer ${done ? 'is-done' : ''}`} style={{ ['--tilt' as string]: `${[-0.8, 0.6, -0.3, 0.9][i % 4]}deg` }}>
      <span className="ebp-pin" aria-hidden="true" />
      <div className="ebp-flyer-art">
        <img src={CATEGORY_VISUAL[e.cat].bg} alt="" aria-hidden="true" className="w-full h-full object-cover object-right" />
      </div>
      <div className={mobile ? 'px-3 pt-2.5 pb-3' : 'px-4 pt-3 pb-4'}>
        <p className={`ebp-poster-date ${mobile ? 'text-[22px]' : 'text-[28px]'} leading-none ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-[#1f2a3d] dark:text-white'}`}>
          {m}.{String(d).padStart(2, '0')}
          <span className="ml-1.5 text-[13px] font-bold align-[3px]">{WD[wd]}</span>
        </p>
        <h4 className={`mt-1.5 font-bold text-[#1f2a3d] dark:text-white leading-[1.3] break-keep ${mobile ? 'text-[15px]' : 'text-[18px]'}`}>{e.title}</h4>
        <p className={`mt-1 text-[#5b6577] dark:text-white/65 ${mobile ? 'text-[12px]' : 'text-[14px]'}`}>
          {e.time ?? '하루 종일'}
          {e.place && <> · {e.place}</>}
        </p>
        {!done && (
          <p className="mt-2 flex items-center justify-between text-[12.5px] font-bold">
            <span className="px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand">{dday(e.date)}</span>
            {e.going > 0 && <span className="text-gray-500 dark:text-white/60">{e.going}명 참석</span>}
          </p>
        )}
      </div>
      {done && (
        <span className="ebp-stamp">
          은혜로
          <br />
          마쳤어요
        </span>
      )}
    </article>
  )
}

const VariantC = ({ mobile }: { mobile?: boolean }) => (
  <div className={`ebp-board ${mobile ? 'px-3 py-5' : 'px-6 py-7'}`}>
    <GroupTitle mobile={mobile} sub="새로 붙은 전단">이번 달 교회 소식판</GroupTitle>
    <div className={`grid ${mobile ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-5'} mb-9`}>
      {upcoming.map((e, i) => <Flyer key={e.id} e={e} i={i} mobile={mobile} />)}
    </div>
    <GroupTitle mobile={mobile} sub={`${past.length}장`}>지난 전단</GroupTitle>
    <div className={`grid ${mobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-4'}`}>
      {past.map((e, i) => <Flyer key={e.id} e={e} i={i + 2} mobile={mobile} />)}
    </div>
  </div>
)

// ── D 주간 다이어리 ───────────────────────────────────────
const weekOf = (k: string) => {
  const d = parse(k)
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon)
    x.setDate(mon.getDate() + i)
    return keyOf(x)
  })
}

const WeekPage = ({ start, title, mobile, faded }: { start: string; title: string; mobile?: boolean; faded?: boolean }) => {
  const days = weekOf(start)
  const a = md(days[0])
  const b = md(days[6])
  return (
    <section className={`ebp-diary ${faded ? 'is-faded' : ''}`}>
      <header className={`flex items-baseline justify-between ${mobile ? 'px-4 pt-4 pb-2' : 'px-7 pt-6 pb-3'}`}>
        <h3 className={`ebp-hand text-[#2b3a55] dark:text-white leading-none ${mobile ? 'text-[26px]' : 'text-[32px]'}`}>{title}</h3>
        <span className="text-[13px] font-semibold text-gray-500 dark:text-white/55 tabular-nums">
          {a.m}.{a.d} – {b.m}.{b.d}
        </span>
      </header>
      <ol>
        {days.map((k) => {
          const { d, wd } = md(k)
          const evs = EVENTS.filter((e) => e.date === k)
          const today = k === TODAY
          const gone = k < TODAY
          return (
            <li key={k} className={`ebp-line ${today ? 'is-today' : ''} ${gone ? 'is-gone' : ''} flex ${mobile ? 'gap-3 px-4' : 'gap-5 px-7'}`}>
              <div className={`shrink-0 ${mobile ? 'w-11' : 'w-14'} pt-2.5`}>
                <p className={`font-bold tabular-nums leading-none ${mobile ? 'text-[20px]' : 'text-[24px]'} ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-[#2b3a55] dark:text-white/90'}`}>{d}</p>
                <p className={`mt-0.5 text-[12px] font-bold ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-gray-400 dark:text-white/45'}`}>{WD_SHORT[wd]}</p>
              </div>
              <div className="flex-1 min-w-0 py-2.5 min-h-[56px]">
                {today && evs.length === 0 && <p className="ebp-hand text-[26px] text-brand leading-[1.3]">오늘 — 조용한 하루, 말씀 한 장 어때요?</p>}
                {evs.map((e) => (
                  <div key={e.id} className="mb-1.5 last:mb-0">
                    <p className={`leading-[1.4] break-keep font-bold text-[#1f2a3d] dark:text-white ${mobile ? 'text-[16px]' : 'text-[19px]'}`}>
                      {gone && <span className="ebp-hand mr-1 text-brand text-[22px]">✓</span>}
                      <span className="ebp-marker" style={{ ['--marker' as string]: INK[e.cat].marker }}>{e.title}</span>
                    </p>
                    <p className={`text-[#5b6577] dark:text-white/60 ${mobile ? 'text-[12.5px]' : 'text-[14px]'}`}>
                      {e.time ?? '하루 종일'}
                      {e.place && <> · {e.place}</>}
                      {!gone && e.going > 0 && <span className="ebp-hand ml-2 text-[21px] text-brand">{e.going}명 함께</span>}
                    </p>
                  </div>
                ))}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const VariantD = ({ mobile }: { mobile?: boolean }) => {
  const [showPrev, setShowPrev] = useState(false)
  return (
    <div className={`flex flex-col ${mobile ? 'gap-5 px-3 py-5' : 'gap-7 px-6 py-7'}`}>
      <WeekPage start={TODAY} title="이번 주" mobile={mobile} />
      <WeekPage start="2026-11-30" title="다음 주" mobile={mobile} />
      <button type="button" onClick={() => setShowPrev((s) => !s)} className="ebp-hand self-start text-[22px] text-gray-500 dark:text-white/60 underline decoration-dashed underline-offset-4">
        {showPrev ? '지난 장 덮기' : '← 지난 주 다이어리 펼쳐 보기'}
      </button>
      {showPrev && <WeekPage start="2026-11-16" title="지난 주" mobile={mobile} faded />}
    </div>
  )
}

// ══ A 다듬기 (2차) ═══════════════════════════════════════
// 원칙: 기울기 없음 · 테이프 한 가지 색 · 손글씨는 날짜와 한마디에만 · 쪽지 높이 맞춤 · 지난 일정은 쪽지 대신 한 줄

const soon = (k: string) => {
  const diff = Math.round((parse(k).getTime() - parse(TODAY).getTime()) / 86400000)
  return diff === 0 ? '오늘' : diff === 1 ? '내일' : diff === 2 ? '모레' : `${diff}일 뒤`
}

/** 쪽지에 손으로 적어 둔 한마디 — 관리자가 일정 등록 때 한 줄 남기는 칸을 가정 */
const NOTES: Record<number, string> = {
  5: '직분자를 위해 같이 기도해요',
  6: '첫 번째 촛불을 함께 켜요',
  7: '앞치마 챙겨 오세요',
}

const thisWeek = weekOf(TODAY)
const nextWeek = weekOf('2026-11-30')

const Meta = ({ e, mobile }: { e: Ev; mobile?: boolean }) => (
  <span className={`inline-flex items-center gap-1 min-w-0 ${mobile ? 'text-[12.5px]' : 'text-[14px]'}`}>
    <CategoryIcon category={e.cat} width={mobile ? 13 : 15} height={mobile ? 13 : 15} className="shrink-0 text-brand" />
    <span className="truncate">
      {e.time ?? '하루 종일'}
      {e.place && <> · {e.place}</>}
    </span>
  </span>
)

/** 지난 일정 — 쪽지를 또 붙이지 않고 종이 한 장에 체크 목록으로 */
const PastPaper = ({ mobile, events = past }: { mobile?: boolean; events?: Ev[] }) => (
  <section className={`ebp-paper ${mobile ? 'px-4 py-4' : 'px-6 py-5'}`}>
    <div className="flex items-baseline justify-between mb-1.5">
      <h3 className={`ebp-hand text-[#2b3a55] dark:text-white/85 leading-none ${mobile ? 'text-[25px]' : 'text-[29px]'}`}>다녀온 자리</h3>
      <span className="text-[12.5px] text-gray-500 dark:text-white/50">{events.length}곳</span>
    </div>
    <ul>
      {events.map((e) => {
        const { m, d, wd } = md(e.date)
        return (
          <li key={e.id} className="flex items-baseline gap-3 py-2 border-t border-dashed border-[#e6e1d6] dark:border-white/[0.08] first:border-t-0">
            <span className="ebp-hand text-brand text-[22px] leading-none w-4 shrink-0">✓</span>
            <span className={`shrink-0 tabular-nums font-bold text-gray-400 dark:text-white/45 ${mobile ? 'w-[52px] text-[13px]' : 'w-[64px] text-[14.5px]'}`}>
              {m}.{d} {WD_SHORT[wd]}
            </span>
            <span className={`flex-1 min-w-0 text-gray-600 dark:text-white/70 font-semibold break-keep ${mobile ? 'text-[14.5px]' : 'text-[16px]'}`}>{e.title}</span>
            {e.going > 0 && <span className="shrink-0 text-[12.5px] text-gray-400 dark:text-white/45">{e.going}명 함께했어요</span>}
          </li>
        )
      })}
    </ul>
  </section>
)

const HandTitle = ({ children, sub, mobile }: { children: string; sub?: string; mobile?: boolean }) => (
  <div className="flex items-baseline justify-between mb-3 px-0.5">
    <h3 className={`ebp-hand text-[#2b3a55] dark:text-white leading-none ${mobile ? 'text-[26px]' : 'text-[31px]'}`}>{children}</h3>
    {sub && <span className="text-[12.5px] font-semibold text-gray-400 dark:text-white/45 tabular-nums">{sub}</span>}
  </div>
)

const range = (days: string[]) => `${md(days[0]).m}.${md(days[0]).d} – ${md(days[6]).m}.${md(days[6]).d}`

// ── A1 가지런한 쪽지 ──
const TidySlip = ({ e, mobile }: { e: Ev; mobile?: boolean }) => {
  const { m, d, wd } = md(e.date)
  return (
    <article className={`ebp-tidy h-full flex flex-col ${mobile ? 'px-3.5 pt-5 pb-3' : 'px-5 pt-6 pb-4'}`}>
      <span className="ebp-tidy-tape" aria-hidden="true" />
      <div className="flex items-baseline justify-between gap-2">
        <p className={`ebp-hand leading-none ${mobile ? 'text-[32px]' : 'text-[40px]'} ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-[#2b3a55] dark:text-white'}`}>
          {m}.{d}
          <span className={`ml-1 ${mobile ? 'text-[20px]' : 'text-[23px]'} opacity-70`}>{WD[wd]}</span>
        </p>
        <span className={`shrink-0 font-bold text-brand ${mobile ? 'text-[12px]' : 'text-[13.5px]'}`}>{soon(e.date)}</span>
      </div>
      <h4 className={`mt-2 flex-1 font-bold text-[#1f2a3d] dark:text-white leading-[1.35] break-keep ${mobile ? 'text-[15.5px]' : 'text-[18.5px]'}`}>{e.title}</h4>
      <div className="mt-3 pt-2.5 border-t border-dashed border-[#e6e1d6] dark:border-white/[0.08] flex items-center justify-between gap-2 text-[#5b6577] dark:text-white/60">
        <Meta e={e} mobile={mobile} />
        {e.going > 0 && <span className={`shrink-0 ${mobile ? 'text-[12px]' : 'text-[13.5px]'}`}>{e.going}명</span>}
      </div>
    </article>
  )
}

const VariantA1 = ({ mobile }: { mobile?: boolean }) => (
  <div className={`ebp-fridge-calm ${mobile ? 'px-3.5 py-5' : 'px-6 py-7'}`}>
    <HandTitle mobile={mobile} sub={`${upcoming.length}장`}>앞으로 있을 일</HandTitle>
    <div className={`grid items-stretch ${mobile ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-4'} mb-8`}>
      {upcoming.map((e) => <TidySlip key={e.id} e={e} mobile={mobile} />)}
    </div>
    <PastPaper mobile={mobile} />
  </div>
)

// ── A2 가로 쪽지 띠 ──
const StripSlip = ({ e, mobile }: { e: Ev; mobile?: boolean }) => {
  const { m, d, wd } = md(e.date)
  const sun = wd === 0
  return (
    <article className="ebp-strip flex">
      <span className="ebp-strip-tape" aria-hidden="true" />
      <div className={`shrink-0 text-center border-r border-dashed border-[#e6e1d6] dark:border-white/[0.08] ${mobile ? 'w-[70px] py-3' : 'w-[88px] py-4'}`}>
        <p className="text-[11.5px] font-bold tracking-[0.1em] text-gray-400 dark:text-white/45">{m}월</p>
        <p className={`ebp-hand leading-[0.9] ${mobile ? 'text-[44px]' : 'text-[52px]'} ${sun ? 'text-rose-500 dark:text-rose-300' : 'text-[#2b3a55] dark:text-white'}`}>{d}</p>
        <p className={`text-[12.5px] font-bold ${sun ? 'text-rose-500 dark:text-rose-300' : 'text-gray-500 dark:text-white/55'}`}>{WD[wd]}</p>
      </div>
      <div className={`flex-1 min-w-0 flex flex-col justify-center ${mobile ? 'px-3.5 py-3' : 'px-5 py-4'}`}>
        <p className={`font-bold text-brand tabular-nums ${mobile ? 'text-[13px]' : 'text-[14.5px]'}`}>
          {e.time ?? '하루 종일'} <span className="text-gray-400 dark:text-white/40 font-semibold">· {soon(e.date)}</span>
        </p>
        <h4 className={`mt-0.5 font-bold text-[#1f2a3d] dark:text-white leading-[1.35] break-keep ${mobile ? 'text-[16.5px]' : 'text-[19px]'}`}>{e.title}</h4>
        <p className={`mt-0.5 text-[#5b6577] dark:text-white/60 truncate ${mobile ? 'text-[12.5px]' : 'text-[14px]'}`}>
          {INK[e.cat].label}
          {e.place && <> · {e.place}</>}
          {e.going > 0 && <> · {e.going}명 함께</>}
        </p>
      </div>
    </article>
  )
}

const VariantA2 = ({ mobile }: { mobile?: boolean }) => {
  const groups = [
    { title: '이번 주', days: thisWeek },
    { title: '다음 주', days: nextWeek },
  ]
  return (
    <div className={`ebp-fridge-calm ${mobile ? 'px-3.5 py-5' : 'px-6 py-7'}`}>
      {groups.map((g) => {
        const evs = upcoming.filter((e) => g.days.includes(e.date))
        return (
          <section key={g.title} className="mb-8">
            <HandTitle mobile={mobile} sub={range(g.days)}>{g.title}</HandTitle>
            <div className={`grid ${mobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
              {evs.map((e) => <StripSlip key={e.id} e={e} mobile={mobile} />)}
            </div>
          </section>
        )
      })}
      <PastPaper mobile={mobile} />
    </div>
  )
}

// ── A3 자석 하나, 맨 앞 쪽지 ──
const VariantA3 = ({ mobile }: { mobile?: boolean }) => {
  const [first, ...rest] = upcoming
  const f = md(first.date)
  return (
    <div className={`ebp-fridge-calm ${mobile ? 'px-3.5 py-5' : 'px-6 py-7'}`}>
      <HandTitle mobile={mobile} sub="가장 가까운 일">맨 앞에 붙여 둔 쪽지</HandTitle>
      <article className={`ebp-magnet-slip is-lead mb-6 ${mobile ? 'px-5 pt-7 pb-5' : 'px-8 pt-9 pb-7'}`}>
        <span className="ebp-magnet" aria-hidden="true" />
        <div className={`flex ${mobile ? 'flex-col gap-2' : 'items-end justify-between gap-6'}`}>
          <div className="min-w-0">
            <p className={`ebp-hand leading-none text-[#2b3a55] dark:text-white ${mobile ? 'text-[40px]' : 'text-[54px]'}`}>
              {f.m}월 {f.d}일 <span className={mobile ? 'text-[26px]' : 'text-[32px]'}>{WD[f.wd]}{f.wd === 0 ? '' : '요일'}</span>
            </p>
            <h4 className={`mt-2 font-bold text-[#1f2a3d] dark:text-white leading-[1.3] break-keep ${mobile ? 'text-[21px]' : 'text-[27px]'}`}>{first.title}</h4>
            <p className={`mt-1.5 text-[#5b6577] dark:text-white/65 ${mobile ? 'text-[14px]' : 'text-[16px]'}`}>
              {first.time ?? '하루 종일'}
              {first.place && <> · {first.place}</>}
              {first.going > 0 && <> · {first.going}명 함께</>}
            </p>
          </div>
          <span className={`shrink-0 self-start ${mobile ? '' : 'self-end'} px-3 py-1 rounded-full bg-[var(--brand-soft)] text-brand font-bold ${mobile ? 'text-[13px]' : 'text-[15px]'}`}>{soon(first.date)}</span>
        </div>
        {NOTES[first.id] && (
          <p className={`ebp-hand mt-4 pt-3 border-t border-dashed border-[#e6e1d6] dark:border-white/[0.08] text-brand ${mobile ? 'text-[23px]' : 'text-[27px]'}`}>
            — {NOTES[first.id]}
          </p>
        )}
      </article>

      <HandTitle mobile={mobile} sub={`${rest.length}장`}>그다음</HandTitle>
      <div className={`grid items-stretch ${mobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-3.5'} mb-8`}>
        {rest.map((e) => {
          const { m, d, wd } = md(e.date)
          return (
            <article key={e.id} className={`ebp-magnet-slip h-full flex flex-col ${mobile ? 'px-3.5 pt-5 pb-3' : 'px-4 pt-6 pb-4'}`}>
              <span className="ebp-magnet is-small" aria-hidden="true" />
              <p className={`ebp-hand leading-none ${mobile ? 'text-[30px]' : 'text-[34px]'} ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-[#2b3a55] dark:text-white'}`}>
                {m}.{d} <span className="text-[20px] opacity-70">{WD[wd]}</span>
              </p>
              <h4 className={`mt-1.5 flex-1 font-bold text-[#1f2a3d] dark:text-white leading-[1.35] break-keep ${mobile ? 'text-[15px]' : 'text-[16.5px]'}`}>{e.title}</h4>
              {NOTES[e.id] && <p className="ebp-hand mt-1 text-[20px] leading-tight text-brand">{NOTES[e.id]}</p>}
              <p className="mt-2 text-[12.5px] text-[#5b6577] dark:text-white/60 truncate">{e.time ?? '하루 종일'}{e.place && <> · {e.place}</>}</p>
            </article>
          )
        })}
      </div>
      <PastPaper mobile={mobile} />
    </div>
  )
}

// ── A4 한 주 = 쪽지 한 장 ──
const WeekNote = ({ title, days, mobile, faded, events }: { title: string; days?: string[]; mobile?: boolean; faded?: boolean; events?: Ev[] }) => {
  const evs = events ?? EVENTS.filter((e) => days!.includes(e.date))
  return (
    <article className={`ebp-weeknote ${faded ? 'is-faded' : ''} ${mobile ? 'px-4 pt-6 pb-3' : 'px-6 pt-8 pb-4'}`}>
      <span className="ebp-tidy-tape is-wide" aria-hidden="true" />
      <div className="flex items-baseline justify-between mb-2">
        <h3 className={`ebp-hand text-[#2b3a55] dark:text-white leading-none ${mobile ? 'text-[28px]' : 'text-[33px]'}`}>{title}</h3>
        {days && <span className="text-[12.5px] font-semibold text-gray-400 dark:text-white/45 tabular-nums">{range(days)}</span>}
      </div>
      <ul>
        {evs.map((e) => {
          const { d, m, wd } = md(e.date)
          const gone = isPast(e)
          return (
            <li key={e.id} className={`flex gap-3 py-3 border-t border-dashed border-[#e6e1d6] dark:border-white/[0.08] ${gone ? 'opacity-55' : ''}`}>
              <div className={`shrink-0 text-center ${mobile ? 'w-10' : 'w-12'}`}>
                <p className={`font-extrabold tabular-nums leading-none ${mobile ? 'text-[21px]' : 'text-[25px]'} ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-[#2b3a55] dark:text-white/90'}`}>
                  {faded ? `${m}.${d}` : d}
                </p>
                <p className={`mt-1 text-[12px] font-bold ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-gray-400 dark:text-white/45'}`}>{WD_SHORT[wd]}</p>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-[#1f2a3d] dark:text-white leading-[1.35] break-keep ${mobile ? 'text-[16px]' : 'text-[18px]'}`}>
                  {gone && <span className="ebp-hand text-brand text-[22px] mr-1">✓</span>}
                  {e.title}
                </h4>
                <p className="mt-0.5 text-[#5b6577] dark:text-white/60">
                  <Meta e={e} mobile={mobile} />
                </p>
                {!gone && NOTES[e.id] && <p className={`ebp-hand mt-0.5 text-brand leading-tight ${mobile ? 'text-[20px]' : 'text-[22px]'}`}>{NOTES[e.id]}</p>}
              </div>
              {!gone && <span className={`shrink-0 font-bold text-brand ${mobile ? 'text-[12px]' : 'text-[13.5px]'}`}>{soon(e.date)}</span>}
            </li>
          )
        })}
      </ul>
    </article>
  )
}

const VariantA4 = ({ mobile }: { mobile?: boolean }) => {
  const [open, setOpen] = useState(false)
  const older = past.filter((e) => !thisWeek.includes(e.date))
  return (
    <div className={`ebp-fridge-calm ${mobile ? 'px-3.5 py-6' : 'px-6 py-8'}`}>
      <div className={`grid items-start ${mobile ? 'grid-cols-1 gap-6' : 'grid-cols-2 gap-5'}`}>
        <WeekNote title="이번 주" days={thisWeek} mobile={mobile} />
        <WeekNote title="다음 주" days={nextWeek} mobile={mobile} />
      </div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="ebp-hand mt-6 text-[23px] text-gray-500 dark:text-white/60 underline decoration-dashed underline-offset-4">
        {open ? '지난 쪽지 접기' : `지난 쪽지 ${older.length}개 꺼내 보기`}
      </button>
      {open && (
        <div className={`mt-5 ${mobile ? '' : 'max-w-[50%]'}`}>
          <WeekNote title="지난 쪽지" events={older} mobile={mobile} faded />
        </div>
      )}
    </div>
  )
}

// ══ A4 업그레이드 (3차) — 참빛 고유 재료: 주보·교회 사진·이번 주 말씀·대림절 촛불 ══

interface WeekInfo {
  key: string
  title: string
  days: string[]
  /** 그 주 주일의 교회력 이름 */
  sunday: string
  /** 주보 호수 */
  no: number
  /** 이번 주 말씀 — 개역개정 그대로 */
  verse: string
  ref: string
  /** 대림절 몇 번째 촛불까지 켰나(0 = 아직) */
  candles: number
}

const WEEKS: WeekInfo[] = [
  {
    key: 'this',
    title: '이번 주',
    days: thisWeek,
    sunday: '대림절 첫째 주일',
    no: 1482,
    verse: '그러므로 깨어 있으라 어느 날에 너희 주가 임할는지 너희가 알지 못함이니라',
    ref: '마태복음 24:42',
    candles: 1,
  },
  {
    key: 'next',
    title: '다음 주',
    days: nextWeek,
    sunday: '대림절 둘째 주일',
    no: 1483,
    verse: '밤이 깊고 낮이 가까웠으니 그러므로 우리가 어둠의 일을 벗고 빛의 갑옷을 입자',
    ref: '로마서 13:12',
    candles: 2,
  },
]

/** 한 주의 줄들 — 지난 일은 ✓, 오늘 자리엔 '오늘' 줄을 끼워 넣어 지금 어디쯤인지 보이게 */
const NoteRows = ({ days, mobile, serif }: { days: string[]; mobile?: boolean; serif?: boolean }) => {
  const evs = EVENTS.filter((e) => days.includes(e.date))
  const rows: ({ kind: 'ev'; e: Ev } | { kind: 'today' })[] = []
  const hasToday = days.includes(TODAY)
  let placed = false
  for (const e of evs) {
    if (hasToday && !placed && e.date >= TODAY) {
      if (e.date !== TODAY) rows.push({ kind: 'today' })
      placed = true
    }
    rows.push({ kind: 'ev', e })
  }
  if (hasToday && !placed) rows.push({ kind: 'today' })

  return (
    <ul>
      {rows.map((r, i) => {
        if (r.kind === 'today') {
          const t = md(TODAY)
          return (
            <li key="today" className="ebp-today-row flex items-center gap-3 py-2">
              <span className={`shrink-0 text-center ${mobile ? 'w-10' : 'w-12'}`}>
                <span className={`ebp-hand ebp-today-circle text-brand leading-none ${mobile ? 'text-[24px]' : 'text-[28px]'}`}>{t.d}</span>
              </span>
              <span className={`ebp-hand text-brand leading-tight ${mobile ? 'text-[21px]' : 'text-[24px]'}`}>
                오늘은 여기 — 조용한 {WD[t.wd]}요일
              </span>
            </li>
          )
        }
        const e = r.e
        const { d, wd } = md(e.date)
        const gone = isPast(e)
        return (
          <li key={e.id} className={`flex gap-3 py-3 ${i > 0 ? 'border-t border-[var(--ebp-rule)]' : ''} ${gone ? 'opacity-50' : ''}`}>
            <div className={`shrink-0 text-center ${mobile ? 'w-10' : 'w-12'}`}>
              <p className={`${serif ? 'ebp-serif' : ''} font-extrabold tabular-nums leading-none ${mobile ? 'text-[22px]' : 'text-[26px]'} ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-[#2b3a55] dark:text-white/90'}`}>{d}</p>
              <p className={`mt-1 text-[12px] font-bold ${wd === 0 ? 'text-rose-500 dark:text-rose-300' : 'text-gray-400 dark:text-white/45'}`}>{WD_SHORT[wd]}</p>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-[#1f2a3d] dark:text-white leading-[1.35] break-keep ${mobile ? 'text-[16px]' : 'text-[18px]'}`}>
                {gone && <span className="ebp-hand text-brand text-[22px] mr-1">✓</span>}
                {e.title}
              </h4>
              <p className="mt-0.5 text-[#5b6577] dark:text-white/60"><Meta e={e} mobile={mobile} /></p>
              {!gone && NOTES[e.id] && <p className={`ebp-hand mt-0.5 text-brand leading-tight ${mobile ? 'text-[20px]' : 'text-[22px]'}`}>{NOTES[e.id]}</p>}
            </div>
            {!gone && <span className={`shrink-0 font-bold text-brand ${mobile ? 'text-[12px]' : 'text-[13.5px]'}`}>{soon(e.date)}</span>}
          </li>
        )
      })}
    </ul>
  )
}

/** 대림절 촛불 네 자루 — 켠 만큼 불꽃 */
const AdventCandles = ({ lit, size = 18 }: { lit: number; size?: number }) => (
  <span className="inline-flex items-end gap-[3px]" aria-label={`대림절 촛불 ${lit}개 켬`}>
    {[0, 1, 2, 3].map((i) => (
      <svg key={i} width={size * 0.5} height={size} viewBox="0 0 10 20" aria-hidden="true">
        {i < lit && <path d="M5 1.2c1.6 2 2 3.4 0 5.4-2-2-1.6-3.4 0-5.4z" fill="#f5a524" />}
        <rect x="2.6" y="7.5" width="4.8" height="12" rx="1" className={i < lit ? 'fill-[#7c93c9] dark:fill-[#9fb3e6]' : 'fill-[#d5dae4] dark:fill-white/20'} />
      </svg>
    ))}
  </span>
)

const PastFold = ({ mobile, render }: { mobile?: boolean; render: (evs: Ev[]) => ReactNode }) => {
  const [open, setOpen] = useState(false)
  const older = past.filter((e) => !thisWeek.includes(e.date))
  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} className={`ebp-hand mt-6 text-gray-500 dark:text-white/60 underline decoration-dashed underline-offset-4 ${mobile ? 'text-[21px]' : 'text-[23px]'}`}>
        {open ? '지난 쪽지 접기' : `지난 쪽지 ${older.length}개 꺼내 보기`}
      </button>
      {open && <div className={`mt-5 ${mobile ? '' : 'max-w-[50%]'}`}>{render(older)}</div>}
    </>
  )
}

const OlderList = ({ evs, mobile }: { evs: Ev[]; mobile?: boolean }) => (
  <ul className="opacity-70">
    {evs.map((e, i) => {
      const { m, d, wd } = md(e.date)
      return (
        <li key={e.id} className={`flex items-baseline gap-3 py-2.5 ${i > 0 ? 'border-t border-[var(--ebp-rule)]' : ''}`}>
          <span className="ebp-hand text-brand text-[22px] leading-none">✓</span>
          <span className="w-[58px] shrink-0 text-[13.5px] font-bold tabular-nums text-gray-500 dark:text-white/55">{m}.{d} {WD_SHORT[wd]}</span>
          <span className={`flex-1 font-semibold text-[#1f2a3d] dark:text-white/85 ${mobile ? 'text-[15px]' : 'text-[16px]'}`}>{e.title}</span>
        </li>
      )
    })}
  </ul>
)

// ── A4-1 주보에서 오려 붙인 쪽지 ──
const BulletinCut = ({ w, mobile, children }: { w?: WeekInfo; mobile?: boolean; children: ReactNode }) => (
  <article className={`ebp-cut ${mobile ? 'px-4 pt-4 pb-3' : 'px-6 pt-5 pb-4'}`}>
    <span className="ebp-tidy-tape is-corner-l" aria-hidden="true" />
    <span className="ebp-tidy-tape is-corner-r" aria-hidden="true" />
    {w ? (
      <header className="ebp-masthead">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`ebp-serif font-bold tracking-[0.12em] text-[#2b3a55] dark:text-white ${mobile ? 'text-[13px]' : 'text-[14.5px]'}`}>참빛교회 주보</p>
          <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/50 tabular-nums">제{w.no}호 · {range(w.days)}</p>
        </div>
        <div className="flex items-end justify-between gap-2 mt-1.5">
          <h3 className={`ebp-serif font-bold text-[#1f2a3d] dark:text-white leading-none ${mobile ? 'text-[23px]' : 'text-[27px]'}`}>
            {w.title} <span className={`font-semibold text-gray-500 dark:text-white/60 ${mobile ? 'text-[14px]' : 'text-[16px]'}`}>교회 일정</span>
          </h3>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 dark:text-white/55">
            <AdventCandles lit={w.candles} size={22} />
            {w.sunday}
          </span>
        </div>
      </header>
    ) : (
      <header className="ebp-masthead">
        <h3 className={`ebp-serif font-bold text-[#1f2a3d] dark:text-white leading-none ${mobile ? 'text-[20px]' : 'text-[23px]'}`}>지난 주보 일정</h3>
      </header>
    )}
    {children}
  </article>
)

const VariantA41 = ({ mobile }: { mobile?: boolean }) => (
  <div className={`ebp-fridge-calm ${mobile ? 'px-3.5 py-6' : 'px-6 py-8'}`}>
    <div className={`grid items-start ${mobile ? 'grid-cols-1 gap-7' : 'grid-cols-2 gap-6'}`}>
      {WEEKS.map((w) => (
        <BulletinCut key={w.key} w={w} mobile={mobile}>
          <NoteRows days={w.days} mobile={mobile} serif />
        </BulletinCut>
      ))}
    </div>
    <PastFold mobile={mobile} render={(evs) => <BulletinCut mobile={mobile}><OlderList evs={evs} mobile={mobile} /></BulletinCut>} />
  </div>
)

// ── A4-2 교회 사진 엽서 ──
const PostcardNote = ({ w, mobile }: { w: WeekInfo; mobile?: boolean }) => {
  const { theme } = useTheme()
  const photo = CHURCH_SEASON_PHOTO[getNaturalSeason(parse(w.days[6]))]
  return (
    <article className="ebp-postcard">
      <span className="ebp-tidy-tape" aria-hidden="true" />
      <div className={`relative overflow-hidden ${mobile ? 'h-[128px]' : 'h-[150px]'}`}>
        <img src={theme === 'dark' ? photo.dark : photo.light} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-[50%_40%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className={`absolute left-0 right-0 bottom-0 flex items-end justify-between ${mobile ? 'px-4 pb-3' : 'px-5 pb-3.5'}`}>
          <div>
            <p className={`ebp-hand text-white leading-none drop-shadow ${mobile ? 'text-[30px]' : 'text-[36px]'}`}>{w.title}</p>
            <p className="mt-1 text-[12.5px] font-semibold text-white/85 tabular-nums">{range(w.days)} · {w.sunday}</p>
          </div>
          <span className="mb-0.5 px-2 py-1 rounded-full bg-black/25 backdrop-blur-sm">
            <AdventCandles lit={w.candles} size={22} />
          </span>
        </div>
      </div>
      <div className={mobile ? 'px-4 pt-1 pb-3' : 'px-5 pt-1.5 pb-4'}>
        <NoteRows days={w.days} mobile={mobile} />
      </div>
    </article>
  )
}

const VariantA42 = ({ mobile }: { mobile?: boolean }) => (
  <div className={`ebp-fridge-calm ${mobile ? 'px-3.5 py-6' : 'px-6 py-8'}`}>
    <div className={`grid items-start ${mobile ? 'grid-cols-1 gap-7' : 'grid-cols-2 gap-6'}`}>
      {WEEKS.map((w) => <PostcardNote key={w.key} w={w} mobile={mobile} />)}
    </div>
    <PastFold mobile={mobile} render={(evs) => (
      <article className={`ebp-postcard ${mobile ? 'px-4 py-3' : 'px-5 py-4'}`}><OlderList evs={evs} mobile={mobile} /></article>
    )} />
  </div>
)

// ══ A4-2 엽서 다듬기 (4차) — 건물 전체가 보이는 /visit 계절 풍경 + 여행 엽서 색 ══

/** 그 주 마지막 날 계절의 /visit 가로 풍경(건물 전체·십자가 탑이 오른쪽에 있다) */
const useScene = (w: WeekInfo) => {
  const { theme } = useTheme()
  return visitSceneFor(theme === 'dark' ? 'dark' : 'light', parse(w.days[6]))!.src
}

/** 우표 — 톱니 테두리 안에 교회 풍경 조각 */
const Stamp = ({ src, size = 52 }: { src: string; size?: number }) => (
  <span className="ebp-pc-stamp" style={{ width: size, height: size * 1.2 }}>
    <img src={src} alt="" aria-hidden="true" className="w-full h-full object-cover object-[88%_60%]" />
  </span>
)

/** 소인 — 동그란 날짜 도장 + 물결선 */
const Postmark = ({ date, className = '' }: { date: string; className?: string }) => {
  const { m, d } = md(date)
  return (
    <svg viewBox="0 0 120 60" className={`ebp-pc-postmark ${className}`} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="30" cy="30" r="25" />
        <circle cx="30" cy="30" r="19" strokeWidth="0.9" />
        {[18, 26, 34, 42].map((y) => (
          <path key={y} d={`M58 ${y} q7 -4 14 0 t14 0 t14 0 t14 0`} />
        ))}
      </g>
      <text x="30" y="26" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="currentColor">참빛</text>
      <text x="30" y="38" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor">2026.{m}.{d}</text>
    </svg>
  )
}

/** 사진 면 — 흰 여백을 두른 인화 사진처럼. 건물은 오른쪽, 제목은 왼쪽 하늘 위 */
const PhotoSide = ({ w, mobile, tall, vintage, greet }: { w: WeekInfo; mobile?: boolean; tall?: boolean; vintage?: boolean; greet?: boolean }) => {
  const src = useScene(w)
  return (
    <div className={`ebp-pc-print ${vintage ? 'is-vintage' : ''}`}>
      <div className={`relative overflow-hidden rounded-[3px] ${tall ? (mobile ? 'h-[170px]' : 'h-[200px]') : mobile ? 'h-[140px]' : 'h-[160px]'}`}>
        <img src={src} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-[96%_65%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/0 to-transparent" />
        {greet ? (
          <div className={`absolute left-0 bottom-0 ${mobile ? 'px-3.5 pb-3' : 'px-4 pb-3.5'}`}>
            <p className="ebp-serif text-white/95 text-[12px] font-bold tracking-[0.18em] drop-shadow">참빛에서 보내는</p>
            <p className={`ebp-pc-greet leading-none ${mobile ? 'text-[40px]' : 'text-[48px]'}`}>{w.title}</p>
          </div>
        ) : (
          <div className={`absolute left-0 top-0 ${mobile ? 'px-3.5 pt-3' : 'px-4 pt-3.5'}`}>
            <p className={`ebp-hand text-white leading-none ebp-pc-shadow ${mobile ? 'text-[34px]' : 'text-[40px]'}`}>{w.title}</p>
            <p className="mt-1 text-[12.5px] font-semibold text-white ebp-pc-shadow tabular-nums">{range(w.days)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** 쓰는 면 머리 — POST CARD + 우표 + 소인 */
const WriteHead = ({ w, mobile }: { w: WeekInfo; mobile?: boolean }) => {
  const src = useScene(w)
  return (
    <div className="relative flex items-start justify-between gap-3 pb-2">
      <div className="pt-1">
        <p className="ebp-serif text-[11.5px] font-bold tracking-[0.32em] text-[var(--pc-ink)] opacity-70">POST CARD</p>
        <p className={`mt-1.5 font-bold text-[var(--pc-ink)] ${mobile ? 'text-[14px]' : 'text-[15px]'}`}>{w.sunday}</p>
        <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--pc-ink)] opacity-70">
          <AdventCandles lit={w.candles} size={20} />
          촛불 {w.candles}개
        </span>
      </div>
      <div className="relative shrink-0 pr-0.5 pt-0.5">
        <Postmark date={w.days[0]} className="absolute -left-[62px] top-[14px] w-[96px]" />
        <Stamp src={src} size={mobile ? 46 : 52} />
      </div>
    </div>
  )
}

// ── P1 항공우편 엽서 ──
const AirmailCard = ({ w, mobile }: { w: WeekInfo; mobile?: boolean }) => (
  <article className="ebp-pc ebp-pc-air">
    <div className="ebp-pc-inner">
      <div className={mobile ? 'p-2.5' : 'p-3'}>
        <PhotoSide w={w} mobile={mobile} />
      </div>
      <div className={mobile ? 'px-4 pb-3' : 'px-5 pb-4'}>
        <WriteHead w={w} mobile={mobile} />
        <div className="ebp-pc-lines">
          <NoteRows days={w.days} mobile={mobile} />
        </div>
      </div>
    </div>
  </article>
)

// ── P2 "참빛에서 보내는" 빈티지 컬러 엽서 ──
const VintageCard = ({ w, mobile }: { w: WeekInfo; mobile?: boolean }) => (
  <article className="ebp-pc ebp-pc-vintage">
    <div className={mobile ? 'p-2.5' : 'p-3'}>
      <PhotoSide w={w} mobile={mobile} tall vintage greet />
    </div>
    <div className={mobile ? 'px-4 pb-3' : 'px-5 pb-4'}>
      <WriteHead w={w} mobile={mobile} />
      <div className="ebp-pc-lines">
        <NoteRows days={w.days} mobile={mobile} />
      </div>
    </div>
  </article>
)

// ── P3 엽서 앞뒤 펼침(PC 가로) ──
const SpreadCard = ({ w, mobile }: { w: WeekInfo; mobile?: boolean }) => {
  const src = useScene(w)
  if (mobile) return <AirmailCard w={w} mobile />
  return (
    <article className="ebp-pc ebp-pc-spread flex">
      <div className="relative w-[44%] shrink-0 p-3">
        <div className="ebp-pc-print h-full">
          <div className="relative h-full min-h-[300px] overflow-hidden rounded-[3px]">
            <img src={src} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-[86%_60%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <div className="absolute left-0 bottom-0 px-4 pb-4">
              <p className="ebp-hand text-white leading-none text-[44px] ebp-pc-shadow">{w.title}</p>
              <p className="mt-1 text-[13px] font-semibold text-white ebp-pc-shadow tabular-nums">{range(w.days)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 py-4 pr-5 pl-2">
        <WriteHead w={w} />
        <div className="ebp-pc-lines">
          <NoteRows days={w.days} />
        </div>
      </div>
    </article>
  )
}

const PostcardBoard = ({ mobile, Card, oneCol }: { mobile?: boolean; Card: (p: { w: WeekInfo; mobile?: boolean }) => ReactNode; oneCol?: boolean }) => (
  <div className={`ebp-fridge-calm ${mobile ? 'px-3.5 py-6' : 'px-6 py-8'}`}>
    <div className={`grid items-start ${mobile || oneCol ? 'grid-cols-1 gap-7' : 'grid-cols-2 gap-6'}`}>
      {WEEKS.map((w) => <Card key={w.key} w={w} mobile={mobile} />)}
    </div>
    <PastFold mobile={mobile} render={(evs) => (
      <article className={`ebp-pc ebp-pc-vintage ${mobile ? 'px-4 py-3' : 'px-5 py-4'}`}><OlderList evs={evs} mobile={mobile} /></article>
    )} />
  </div>
)

// ══ 향수 엽서 (5차) — 80년대 우편엽서 · 필름 날짜 도장 · 매주 다른 사진 ══

/** 한 주 엽서에 실을 사진 한 장 — 어디서 왔는지(출처)가 곧 의미 */
interface Shot {
  src: string
  pos: string
  /** 사진 아래 손글씨 한 줄 */
  caption: string
  /** 시안에서만 붙이는 설명 꼬리표 */
  tag?: string
  /** 옛 사진 처리(흑백 세피아) */
  old?: boolean
  /** 필름 날짜 도장 */
  imprint: string
}

type ShotPlan = 'series' | 'album' | 'archive' | 'church' | 'series2'

const useShots = (plan: ShotPlan): Record<string, Shot> => {
  const { theme } = useTheme()
  const t = theme === 'dark' ? 'dark' : 'light'
  const autumnWide = visitSceneFor(t, parse('2026-11-23'))!.src
  const winterWide = visitSceneFor(t, parse('2026-12-06'))!.src
  const autumnTall = CHURCH_SEASON_PHOTO.autumn[t]
  if (plan === 'church')
    return {
      this: { src: autumnWide, pos: '96% 65%', caption: '가을 끝자락의 참빛교회 — 대림절을 기다리며', imprint: "'26 11 23" },
      next: { src: winterWide, pos: '96% 65%', caption: '첫눈 내린 참빛교회 — 둘째 촛불을 켜는 주', imprint: "'26 11 30" },
    }
  if (plan === 'series2')
    return {
      this: { src: autumnWide, pos: '96% 65%', caption: '참빛 풍경 엽서 No.47 — 가을 하늘과 성전', imprint: "'26 11 23" },
      next: { src: autumnTall, pos: '50% 8%', caption: 'No.48 — 대림절, 십자가 탑을 올려다보며', imprint: "'26 11 30" },
    }
  if (plan === 'series')
    return {
      this: { src: autumnWide, pos: '96% 65%', caption: '참빛 풍경 엽서 No.47 — 가을 하늘과 성전', imprint: "'26 11 23" },
      next: { src: autumnTall, pos: '50% 8%', caption: 'No.48 — 대림절, 십자가 탑을 올려다보며', tag: '같은 가을이어도 매주 다른 구도', imprint: "'26 11 30" },
    }
  if (plan === 'album')
    return {
      this: { src: autumnTall, pos: '50% 78%', caption: '지난 주일, 학습·세례·입교식이 있던 날', tag: '실제론 행사 앨범에서 고른 사진', imprint: "'26 11 22" },
      next: { src: winterWide, pos: '96% 65%', caption: '이번 주 사진이 올라오면 바뀌어요', tag: '앨범 사진이 없으면 계절 풍경', imprint: "'26 11 30" },
    }
  return {
    this: { src: autumnTall, pos: '50% 55%', caption: '그때 그 시절 — 교회 앨범에서 꺼낸 한 장', tag: '예시: 옛 사진을 관리자가 올리면', old: true, imprint: "'98 11 22" },
    next: { src: autumnWide, pos: '94% 60%', caption: '그리고 지금, 같은 자리', imprint: "'26 11 30" },
  }
}

/** 80년대 인화 사진 — 흰 테두리 + 바랜 필름 색 + 주황 날짜 도장 */
const FilmPrint = ({ shot, mobile, tall }: { shot: Shot; mobile?: boolean; tall?: boolean }) => (
  <figure className="ebp-film">
    <div className={`relative overflow-hidden ${tall ? (mobile ? 'h-[190px]' : 'h-[220px]') : mobile ? 'h-[150px]' : 'h-[170px]'}`}>
      <img src={shot.src} alt="" aria-hidden="true" className={`absolute inset-0 w-full h-full object-cover ${shot.old ? 'ebp-film-old' : 'ebp-film-faded'}`} style={{ objectPosition: shot.pos }} />
      <span className="ebp-film-wash" aria-hidden="true" />
      <span className={`ebp-imprint ${mobile ? 'text-[13px]' : 'text-[15px]'}`}>{shot.imprint}</span>
      {shot.tag && <span className="absolute left-2 top-2 px-1.5 py-0.5 rounded bg-black/45 text-[10.5px] font-bold text-white">시안 · {shot.tag}</span>}
    </div>
    <figcaption className={`ebp-hand text-[var(--pc-ink)] leading-tight pt-1.5 ${mobile ? 'text-[19px]' : 'text-[21px]'}`}>{shot.caption}</figcaption>
  </figure>
)

/** "우 편 엽 서" 머리 + 받는 사람 + 빨간 우편번호 칸 + 우표 + 소인 */
const KoreanPostHead = ({ w, mobile, stamp }: { w: WeekInfo; mobile?: boolean; stamp: string }) => (
  <div className="relative">
    <div className="flex items-start justify-between gap-3">
      <div className="pt-0.5 min-w-0">
        <p className={`ebp-serif font-extrabold tracking-[0.55em] text-[var(--pc-coral)] ${mobile ? 'text-[15px]' : 'text-[17px]'}`}>우편엽서</p>
        <p className="mt-1 text-[13.5px] font-bold text-[var(--pc-ink)] opacity-80 tabular-nums">
          {w.sunday} · {range(w.days)}
        </p>
      </div>
      <div className="relative shrink-0 pt-0.5">
        <Postmark date={w.days[0]} className="absolute -left-[62px] top-[14px] w-[96px]" />
        <Stamp src={stamp} size={mobile ? 44 : 50} />
      </div>
    </div>
    <div className="mt-2 flex items-end justify-between gap-3">
      <p className={`min-w-0 flex-1 border-b border-[var(--pc-ink)]/40 pb-0.5 ${mobile ? 'text-[13px]' : 'text-[14px]'}`}>
        <span className="text-[var(--pc-ink)] opacity-70 font-bold mr-2">받는 사람</span>
        <span className={`ebp-hand text-[var(--pc-accent)] ${mobile ? 'text-[23px]' : 'text-[26px]'}`}>참빛 식구들에게</span>
      </p>
      <span className="ebp-zip shrink-0" aria-hidden="true">
        {[0, 1, 2].map((i) => <i key={i} />)}
        <b>-</b>
        {[0, 1, 2].map((i) => <i key={`b${i}`} />)}
      </span>
    </div>
  </div>
)

/** 읽기 쉬운 줄 — 날짜·요일 크게, 시간은 굵게, 남은 날은 알약, 손글씨는 크게, 지난 일은 흐리지 않고 '마쳤어요' */
const WD_FULL = ['주일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
const ReadableRows = ({ days, mobile }: { days: string[]; mobile?: boolean }) => {
  const evs = EVENTS.filter((e) => days.includes(e.date))
  const rows: ({ kind: 'ev'; e: Ev } | { kind: 'today' })[] = []
  const hasToday = days.includes(TODAY)
  let placed = false
  for (const e of evs) {
    if (hasToday && !placed && e.date >= TODAY) {
      if (e.date !== TODAY) rows.push({ kind: 'today' })
      placed = true
    }
    rows.push({ kind: 'ev', e })
  }
  if (hasToday && !placed) rows.push({ kind: 'today' })
  return (
    <ul className="ebp-rd">
      {rows.map((r) => {
        if (r.kind === 'today') {
          const t = md(TODAY)
          return (
            <li key="today" className={`ebp-rd-today ${mobile ? 'text-[15px]' : 'text-[16.5px]'}`}>
              <span className="ebp-rd-today-chip">오늘</span>
              <span className="font-bold">{t.m}월 {t.d}일 {WD_FULL[t.wd]}</span>
              <span className="opacity-75">· 일정 없는 날</span>
            </li>
          )
        }
        const e = r.e
        const { d, wd } = md(e.date)
        const gone = isPast(e)
        const sun = wd === 0
        return (
          <li key={e.id} className={`ebp-rd-row flex ${mobile ? 'gap-3 py-3.5' : 'gap-4 py-4'} ${gone ? 'is-gone' : ''}`}>
            <div className={`shrink-0 text-center ${mobile ? 'w-[50px]' : 'w-[58px]'}`}>
              <p className={`ebp-rd-day font-extrabold tabular-nums leading-none ${mobile ? 'text-[28px]' : 'text-[32px]'} ${sun ? 'is-sun' : ''}`}>{d}</p>
              <p className={`ebp-rd-wd mt-1.5 font-bold ${mobile ? 'text-[13px]' : 'text-[14px]'} ${sun ? 'is-sun' : ''}`}>{WD_FULL[wd]}</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className={`ebp-rd-title font-bold leading-[1.35] break-keep ${mobile ? 'text-[18px]' : 'text-[20px]'}`}>{e.title}</h4>
                <span className={`ebp-rd-pill shrink-0 ${gone ? 'is-done' : ''} ${mobile ? 'text-[13px]' : 'text-[14px]'}`}>{gone ? '마쳤어요' : soon(e.date)}</span>
              </div>
              <p className={`ebp-rd-meta mt-1 ${mobile ? 'text-[15px]' : 'text-[16.5px]'}`}>
                <b className="font-bold">{e.time ?? '하루 종일'}</b>
                {e.place && <span> · {e.place}</span>}
              </p>
              {!gone && NOTES[e.id] && (
                <p className={`ebp-hand ebp-rd-note mt-1 leading-tight ${mobile ? 'text-[24px]' : 'text-[26px]'}`}>{NOTES[e.id]}</p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const NostalgiaCard = ({ w, mobile, plan }: { w: WeekInfo; mobile?: boolean; plan: ShotPlan }) => {
  const shots = useShots(plan)
  const shot = shots[w.key]
  const { theme } = useTheme()
  const stamp = visitSceneFor(theme === 'dark' ? 'dark' : 'light', parse(w.days[6]))!.src
  return (
    <article className={`ebp-pc ebp-old ${plan === 'church' ? 'ebp-parch' : ''}`}>
      <div className={mobile ? 'px-3 pt-3' : 'px-3.5 pt-3.5'}>
        <FilmPrint shot={shot} mobile={mobile} tall={plan === 'archive'} />
      </div>
      <div className={mobile ? 'px-4 pt-3 pb-3' : 'px-5 pt-3.5 pb-4'}>
        <KoreanPostHead w={w} mobile={mobile} stamp={stamp} />
        <div className="ebp-pc-lines mt-3">
          {plan === 'series2' ? <ReadableRows days={w.days} mobile={mobile} /> : <NoteRows days={w.days} mobile={mobile} />}
        </div>
        <p className={`ebp-hand text-right text-[var(--pc-accent)] mt-1 ${plan === 'series2' ? (mobile ? 'text-[24px]' : 'text-[26px]') : mobile ? 'text-[20px]' : 'text-[22px]'}`}>— 참빛교회에서</p>
      </div>
    </article>
  )
}

const NostalgiaBoard = ({ mobile, plan }: { mobile?: boolean; plan: ShotPlan }) => (
  <div className={`ebp-fridge-calm ${mobile ? 'px-3.5 py-6' : 'px-6 py-8'}`}>
    <div className={`grid items-start ${mobile ? 'grid-cols-1 gap-7' : 'grid-cols-2 gap-6'}`}>
      {WEEKS.map((w) => <NostalgiaCard key={w.key} w={w} mobile={mobile} plan={plan} />)}
    </div>
    <PastFold mobile={mobile} render={(evs) => (
      <article className={`ebp-pc ebp-old ${plan === 'church' ? 'ebp-parch' : ''} ${mobile ? 'px-4 py-3' : 'px-5 py-4'}`}><OlderList evs={evs} mobile={mobile} /></article>
    )} />
  </div>
)

// ── A4-3 이번 주 말씀을 머리에 적은 쪽지 ──
const VerseNote = ({ w, mobile }: { w: WeekInfo; mobile?: boolean }) => (
  <article className="ebp-versenote">
    <span className="ebp-tidy-tape is-wide" aria-hidden="true" />
    <header className={`ebp-versehead ${mobile ? 'px-4 pt-6 pb-4' : 'px-6 pt-7 pb-5'}`}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="flex items-center gap-2 text-[12.5px] font-bold text-[#5a6b8c] dark:text-white/60">
          <AdventCandles lit={w.candles} size={22} />
          {w.sunday}
        </span>
        <span className="text-[12px] font-semibold text-gray-400 dark:text-white/45 tabular-nums">{range(w.days)}</span>
      </div>
      <p className={`ebp-serif text-[#24324d] dark:text-white/90 leading-[1.6] break-keep ${mobile ? 'text-[15px]' : 'text-[16.5px]'}`}>“{w.verse}”</p>
      <p className="mt-1 text-[12.5px] font-semibold text-gray-500 dark:text-white/50">{w.ref}</p>
    </header>
    <div className={mobile ? 'px-4 pt-3 pb-3' : 'px-6 pt-4 pb-4'}>
      <h3 className={`ebp-hand text-[#2b3a55] dark:text-white leading-none mb-1 ${mobile ? 'text-[27px]' : 'text-[31px]'}`}>{w.title} 교회 일정</h3>
      <NoteRows days={w.days} mobile={mobile} />
    </div>
  </article>
)

const VariantA43 = ({ mobile }: { mobile?: boolean }) => (
  <div className={`ebp-fridge-calm ${mobile ? 'px-3.5 py-6' : 'px-6 py-8'}`}>
    <div className={`grid items-start ${mobile ? 'grid-cols-1 gap-7' : 'grid-cols-2 gap-6'}`}>
      {WEEKS.map((w) => <VerseNote key={w.key} w={w} mobile={mobile} />)}
    </div>
    <PastFold mobile={mobile} render={(evs) => (
      <article className={`ebp-versenote ${mobile ? 'px-4 py-3' : 'px-6 py-4'}`}><OlderList evs={evs} mobile={mobile} /></article>
    )} />
  </div>
)

// ── A4-4 떡메모 패드 — 위 풀칠 띠 + 아래 겹친 장 + 오늘 동그라미 ──
const PadNote = ({ w, mobile }: { w: WeekInfo; mobile?: boolean }) => (
  <article className="ebp-pad">
    <span className="ebp-pad-under" aria-hidden="true" />
    <div className="ebp-pad-sheet">
      <div className={`ebp-pad-glue flex items-center justify-between ${mobile ? 'px-4' : 'px-6'}`}>
        <span className="text-[12px] font-bold tracking-[0.14em] text-white/95">참빛교회 · WEEKLY</span>
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white/90">
          <AdventCandles lit={w.candles} size={22} />
        </span>
      </div>
      <div className={mobile ? 'px-4 pt-4 pb-3' : 'px-6 pt-5 pb-4'}>
        <div className="flex items-baseline justify-between mb-1.5">
          <h3 className={`ebp-hand text-[#2b3a55] dark:text-white leading-none ${mobile ? 'text-[30px]' : 'text-[35px]'}`}>{w.title}</h3>
          <span className="text-[12.5px] font-semibold text-gray-400 dark:text-white/45 tabular-nums">{range(w.days)} · {w.sunday}</span>
        </div>
        <NoteRows days={w.days} mobile={mobile} />
      </div>
    </div>
  </article>
)

const VariantA44 = ({ mobile }: { mobile?: boolean }) => (
  <div className={`ebp-fridge-calm ${mobile ? 'px-3.5 py-6' : 'px-6 py-8'}`}>
    <div className={`grid items-start ${mobile ? 'grid-cols-1 gap-8' : 'grid-cols-2 gap-7'}`}>
      {WEEKS.map((w) => <PadNote key={w.key} w={w} mobile={mobile} />)}
    </div>
    <PastFold mobile={mobile} render={(evs) => (
      <article className="ebp-pad"><div className={`ebp-pad-sheet ${mobile ? 'px-4 py-3' : 'px-6 py-4'}`}><OlderList evs={evs} mobile={mobile} /></div></article>
    )} />
  </div>
)

const Variant = ({ v, mobile }: { v: VKey; mobile?: boolean }) =>
  v === 'final2' ? <NostalgiaBoard mobile={mobile} plan="series2" />
  : v === 'final' ? <NostalgiaBoard mobile={mobile} plan="church" />
  : v === 'n1' ? <NostalgiaBoard mobile={mobile} plan="album" />
  : v === 'n2' ? <NostalgiaBoard mobile={mobile} plan="series" />
  : v === 'n3' ? <NostalgiaBoard mobile={mobile} plan="archive" />
  : v === 'p1' ? <PostcardBoard mobile={mobile} Card={AirmailCard} />
  : v === 'p2' ? <PostcardBoard mobile={mobile} Card={VintageCard} />
  : v === 'p3' ? <PostcardBoard mobile={mobile} Card={SpreadCard} oneCol />
  : v === 'a41' ? <VariantA41 mobile={mobile} />
  : v === 'a42' ? <VariantA42 mobile={mobile} />
  : v === 'a43' ? <VariantA43 mobile={mobile} />
  : v === 'a44' ? <VariantA44 mobile={mobile} />
  : v === 'a1' ? <VariantA1 mobile={mobile} />
  : v === 'a2' ? <VariantA2 mobile={mobile} />
  : v === 'a3' ? <VariantA3 mobile={mobile} />
  : v === 'a4' ? <VariantA4 mobile={mobile} />
  : v === 'a' ? <VariantA mobile={mobile} /> : v === 'b' ? <VariantB mobile={mobile} /> : v === 'c' ? <VariantC mobile={mobile} /> : <VariantD mobile={mobile} />

export default function EventsBoardPreview() {
  const [params, setParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const meta = VARIANTS.find((x) => x.key === params.get('v')) ?? VARIANTS[0]

  useEffect(() => {
    void ensureFontFamily('nanumPen')
  }, [])

  const pill = (on: boolean) =>
    `text-[13px] px-3.5 py-1.5 rounded-full border ${
      on ? 'bg-[var(--brand)] text-white border-transparent font-bold' : 'text-gray-600 dark:text-white/70 border-gray-200 dark:border-white/[0.1]'
    }`

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <div className="mx-auto max-w-[1240px] px-5 pt-6">
        <h1 className="text-[18px] font-bold text-ink-strong">/events 일정 목록 — 감성 개편 시안</h1>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {VARIANTS.map((x) => (
            <button key={x.key} onClick={() => setParams({ v: x.key }, { replace: true })} className={pill(x.key === meta.key)}>
              {x.label}
            </button>
          ))}
          <button onClick={toggleTheme} className="ml-2 text-[13px] underline text-gray-500 dark:text-white/55">
            {theme === 'dark' ? '라이트로' : '다크로'}
          </button>
        </div>
        <p className="mt-2 text-[12.5px] font-semibold text-brand">{meta.bench}</p>
        <p className="mt-1 text-[13px] leading-[1.6] text-gray-500 dark:text-white/55 break-keep max-w-[860px]">{meta.note}</p>

        <div className="mt-6 flex flex-wrap items-start gap-6">
          <figure className="flex-1 min-w-[640px] max-w-[800px]">
            <figcaption className="mb-2 text-[12px] text-gray-400">PC 본문 칸</figcaption>
            <div className="rounded-3xl overflow-hidden border border-border-light dark:border-border-dark bg-[var(--app-canvas)] shadow-2xl">
              <Variant v={meta.key} />
            </div>
          </figure>
          <figure className="w-[375px] shrink-0">
            <figcaption className="mb-2 text-[12px] text-gray-400">모바일 (375)</figcaption>
            <div className="rounded-[28px] overflow-hidden border border-border-light dark:border-border-dark bg-[var(--app-canvas)] shadow-xl">
              <Variant v={meta.key} mobile />
            </div>
          </figure>
        </div>
      </div>
    </div>
  )
}
