import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureSerifKr } from '../../utils/deferredFonts'
import AnnualThemeVerse from '../Home/components/AnnualThemeVerse'
import {
  AlbumIcon,
  ArchiveIcon,
  BulletinIcon,
  MegaphoneIcon,
  NoticeBoardIcon,
  OfferingBoxIcon,
  SparkleIcon,
  SproutIcon,
  CheckIcon,
} from '../News/components/NewsIcons'

/**
 * /#/dev/news-rail — /news 우측 레일(NewsSidebar) 전면 개편 시안.
 *   ?v=all(나란히) | now | a 주보 꽂이 | b 주일과 주일 사이 | c 꼭 챙길 일 | d 쪽 넘겨보기
 * 레일 폭(312px)·카드 틀은 그대로, 안쪽만 바꾼다. 데이터는 실제 11/22 주보(제33권 47호) 표본.
 * 오늘 = 2026-11-26(목).
 */

const SB = 'https://omkzokuhaxadkfrgklcm.supabase.co/storage/v1/object/public/sermon-audio/bulletins/'

const ISSUES = [
  { id: 37, date: '11월 22일', md: '11. 22.', no: 47, cover: SB + 'bulletin_37_page_1_thumb_20261120_030115_62a8de73.webp' },
  { id: 33, date: '11월 15일', md: '11. 15.', no: 46, cover: SB + 'bulletin_33_page_1_thumb_20261113_023516_1880de2c.webp' },
  { id: 30, date: '11월 8일', md: '11. 8.', no: 45, cover: SB + 'bulletin_30_page_1_20261106_014803_b0c19b41.png' },
  { id: 29, date: '11월 1일', md: '11. 1.', no: 44, cover: SB + 'bulletin_29_page_1_thumb_20261030_020508_dd18cd1f.webp' },
  { id: 28, date: '10월 25일', md: '10. 25.', no: 43, cover: SB + 'bulletin_28_page_1_thumb_20261024_181526_520174b9.webp' },
  { id: 27, date: '10월 18일', md: '10. 18.', no: 42, cover: SB + 'bulletin_27_page_1_thumb_20261024_181539_b8e2ce73.webp' },
]

const PAGES = [
  'bulletin_37_page_1_mini_20261120_030115_b037c95a.webp',
  'bulletin_37_page_2_mini_20261120_030115_a7ad5b23.webp',
  'bulletin_37_page_3_mini_20261120_030114_592580ce.webp',
  'bulletin_37_page_4_mini_20261120_030116_7d19a6b3.webp',
  'bulletin_37_page_5_mini_20261120_030125_5fd0d262.webp',
  'bulletin_37_page_6_20261120_030116_c531a88a.png',
  'bulletin_37_page_7_mini_20261120_030128_eb743ee4.webp',
  'bulletin_37_page_8_mini_20261120_030129_7a846ac0.webp',
].map(f => SB + f)

const OTHER = [
  { key: 'news', label: '소식', Icon: MegaphoneIcon, latest: '김장 나눔 봉사자를 찾아요', when: '어제', fresh: true },
  { key: 'notice', label: '공지', Icon: NoticeBoardIcon, latest: '공동의회 전자투표 안내', when: '2일 전', fresh: true },
  { key: 'new-family', label: '새가족', Icon: SproutIcon, latest: '이번 주 두 가정이 오셨어요', when: '11월 22일', fresh: false },
  { key: 'event-album', label: '행사', Icon: AlbumIcon, latest: '학습·세례·입교식 사진 24장', when: '11월 22일', fresh: false },
  { key: 'offering', label: '헌금', Icon: OfferingBoxIcon, latest: '계좌로 드리는 방법', when: '', fresh: false },
]

const Chevron = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const Card = ({ children, className = '', pad = 'p-5' }: { children: ReactNode; className?: string; pad?: string }) => (
  <section className={`rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm ${pad} ${className}`}>
    {children}
  </section>
)

const CardTitle = ({ Icon, children, right }: { Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement; children: ReactNode; right?: ReactNode }) => (
  <p className="flex items-center gap-1.5 mb-3 text-[15px] font-bold text-ink-strong">
    <Icon width={18} height={18} className="shrink-0 text-brand" />
    {children}
    {right && <span className="ml-auto">{right}</span>}
  </p>
)

const Verse = () => (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm overflow-hidden">
    <AnnualThemeVerse />
  </div>
)

// ── 지금 ────────────────────────────────────────
const RailNow = () => (
  <>
    <Card>
      <CardTitle Icon={BulletinIcon}>이번 주 주보</CardTitle>
      <p className="text-[14.5px] font-semibold text-gray-500 dark:text-white/55">2026년 11월 22일</p>
      <p className="mt-1 text-[17.5px] font-bold text-ink-strong">2026년 11월 22일</p>
      <span className="mt-3 inline-flex items-center gap-1 h-11 px-5 rounded-full bg-brand text-white text-[15.5px] font-bold">읽어보기 <Chevron size={13} /></span>
    </Card>
    <Card>
      <CardTitle Icon={ArchiveIcon}>주보 바로가기</CardTitle>
      {ISSUES.slice(1, 6).map(i => (
        <div key={i.id} className="flex gap-2.5 px-1.5 py-2.5 text-[15.5px] font-semibold text-ink-strong">
          <span className="text-[14px] text-gray-500 font-bold tabular-nums">{i.md}</span>2026년 {i.date}
        </div>
      ))}
    </Card>
    <Card>
      <CardTitle Icon={SparkleIcon}>다른 소식</CardTitle>
      <div className="flex flex-col gap-1.5">
        {OTHER.map(o => (
          <div key={o.key} className="flex items-center gap-2.5 h-12 px-3.5 rounded-xl border border-[var(--card-border)] text-[15.5px] font-bold text-ink-strong">
            <o.Icon width={19} height={19} className="text-brand" />
            {o.label}
            <Chevron className="ml-auto text-gray-400" />
          </div>
        ))}
      </div>
    </Card>
    <Verse />
  </>
)

// ── A 주보 꽂이 ─────────────────────────────────
// 현관 주보 꽂이에서 한 부 뽑아 드는 느낌 — 진짜 표지 사진이 주인공, 날짜 제목 중복 제거
const RailA = () => {
  const [cur, ...past] = ISSUES
  return (
    <>
      <Card pad="p-0" className="overflow-hidden">
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-b from-[var(--brand-soft)] to-transparent">
          <p className="text-[14px] font-bold text-brand">이번 주 주보</p>
          <div className="mt-3 flex gap-4 items-end">
            <img
              src={cur.cover}
              alt=""
              className="w-[104px] aspect-[480/717] object-cover rounded-[4px] shadow-[0_10px_24px_-8px_rgba(20,40,80,.45),0_0_0_1px_rgba(0,0,0,.06)] -rotate-2"
            />
            <div className="min-w-0 pb-1">
              <p className="text-[14px] font-bold text-ink-strong/75 tabular-nums">제33권 {cur.no}호</p>
              <p className="mt-0.5 text-[24px] leading-[1.2] font-extrabold text-ink-strong">{cur.date}<br />주일</p>
              <p className="mt-1.5 text-[14px] font-semibold text-ink-strong/75">8쪽</p>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button className="w-full h-12 rounded-xl bg-brand text-white text-[16px] font-bold inline-flex items-center justify-center gap-1">
            펼쳐 읽기 <Chevron size={14} />
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle Icon={ArchiveIcon} right={<span className="text-[14px] font-bold text-brand">모두 보기</span>}>지난 주보</CardTitle>
        <div className="grid grid-cols-4 gap-2">
          {past.slice(0, 4).map(i => (
            <button key={i.id} className="text-center group">
              <img src={i.cover} alt="" className="w-full aspect-[480/717] object-cover rounded-[3px] shadow-[0_4px_10px_-4px_rgba(20,40,80,.4),0_0_0_1px_rgba(0,0,0,.06)] group-hover:ring-2 group-hover:ring-brand" />
              <span className="block mt-1.5 text-[14px] font-bold text-ink-strong tabular-nums">{i.md.replace(/\.$/, '')}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle Icon={SparkleIcon}>다른 소식</CardTitle>
        <div className="grid grid-cols-3 gap-2">
          {OTHER.map(o => (
            <button key={o.key} className="relative flex flex-col items-center justify-center gap-1.5 h-[76px] rounded-xl bg-[var(--brand-soft)] hover:ring-2 hover:ring-brand/50 text-[15px] font-bold text-ink-strong">
              <o.Icon width={24} height={24} className="text-brand" />
              {o.label}
              {o.fresh && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f04452]" />}
            </button>
          ))}
        </div>
      </Card>
      <Verse />
    </>
  )
}

// ── B 주일과 주일 사이 ───────────────────────────
// 주보는 '한 주'를 산다 — 지난 주일부터 다음 주일까지 한 줄 위에 이번 주 일정과 다음 주보를 놓는다
const WEEK = ['일', '월', '화', '수', '목', '금', '토', '일']
const RailB = () => {
  const [alarm, setAlarm] = useState(true)
  const today = 4 // 목
  return (
    <>
      <Card>
        <CardTitle Icon={BulletinIcon}>주일과 주일 사이</CardTitle>
        {/* 8칸 한 주 줄 */}
        <div className="relative mt-1">
          <div className="grid grid-cols-8 text-center">
            {WEEK.map((w, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className={`text-[13px] font-bold ${i === 0 || i === 7 ? 'text-[#e5484d]' : 'text-ink-strong/70'}`}>{w}</span>
                <span
                  className={`mt-1 grid place-items-center w-8 h-8 rounded-full text-[14px] font-extrabold tabular-nums ${
                    i === today
                      ? 'bg-brand text-white'
                      : i < today
                        ? 'text-ink-strong/60'
                        : 'text-ink-strong'
                  } ${i === 0 || i === 7 ? 'ring-2 ring-brand/40' : ''}`}
                >
                  {22 + i > 30 ? 22 + i - 30 : 22 + i}
                </span>
              </div>
            ))}
          </div>
          {/* 특별새벽기도 띠 월~금 */}
          <div className="grid grid-cols-8 mt-2">
            <div className="col-start-2 col-span-5 h-7 rounded-full bg-amber-100 dark:bg-amber-400/15 text-amber-900 dark:text-amber-200 text-[13px] font-bold grid place-items-center">
              특별새벽기도 5:30
            </div>
          </div>
          <div className="grid grid-cols-8 mt-1.5">
            <div className="col-start-6 col-span-3 h-7 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold grid place-items-center">
              공동의회
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="text-left rounded-xl border border-[var(--card-border)] p-3">
            <p className="text-[13px] font-bold text-ink-strong/70">지난 주일</p>
            <p className="text-[17px] font-extrabold text-ink-strong">11월 22일</p>
            <p className="mt-1 text-[14px] font-bold text-brand inline-flex items-center">주보 읽기<Chevron size={13} /></p>
          </button>
          <div className="rounded-xl border-2 border-dashed border-brand/35 p-3">
            <p className="text-[13px] font-bold text-ink-strong/70">다음 주일</p>
            <p className="text-[17px] font-extrabold text-ink-strong">11월 29일</p>
            <p className="mt-1 text-[14px] font-bold text-[#7a4fd0] dark:text-[#b79cf2]">대림절 첫째 주</p>
          </div>
        </div>

        <button
          onClick={() => setAlarm(a => !a)}
          className="mt-3 w-full flex items-center gap-3 rounded-xl bg-[var(--brand-soft)] px-3.5 py-3 text-left"
        >
          <span className="flex-1">
            <span className="block text-[15px] font-bold text-ink-strong">다음 주보, 금요일쯤 와요</span>
            <span className="block text-[13.5px] font-semibold text-ink-strong/75">{alarm ? '오면 바로 알려드릴게요' : '알림이 꺼져 있어요'}</span>
          </span>
          <span className={`relative w-11 h-6 rounded-full transition-colors ${alarm ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-[left] ${alarm ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>
      </Card>

      <Card>
        <CardTitle Icon={ArchiveIcon}>지난 주보</CardTitle>
        <ol className="relative ml-2 border-l-2 border-[var(--brand-soft-strong)]">
          {ISSUES.slice(1, 5).map(i => (
            <li key={i.id}>
              <button className="w-full flex items-center gap-3 pl-4 py-2.5 text-left relative hover:bg-[var(--brand-soft)] rounded-r-lg">
                <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-white dark:bg-card-dark border-2 border-brand" />
                <span className="text-[16px] font-bold text-ink-strong">{i.date}</span>
                <span className="ml-auto mr-2 text-[13.5px] font-bold text-ink-strong/70 tabular-nums">{i.no}호</span>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardTitle Icon={SparkleIcon}>다른 소식</CardTitle>
        <div className="flex flex-wrap gap-2">
          {OTHER.map(o => (
            <button key={o.key} className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full border border-[var(--card-border)] hover:border-brand text-[15px] font-bold text-ink-strong">
              <o.Icon width={18} height={18} className="text-brand" />
              {o.label}
            </button>
          ))}
        </div>
      </Card>
      <Verse />
    </>
  )
}

// ── C 꼭 챙길 일 ─────────────────────────────────
// 주보 8쪽을 다 읽지 않아도 — 이번 주보에서 '내가 움직여야 하는 것' 셋만 먼저
const TODO = [
  { title: '공동의회 · 직분자 선거', when: '11월 29일 주일 오전 11시', tip: '휴대폰 꼭 챙기기 (전자투표)', pill: '3일 뒤', tone: 'brand' },
  { title: '특별새벽기도회', when: '월~금 오전 5시 30분 · 본당', tip: '', pill: '내일 마지막', tone: 'amber' },
  { title: '2027년 사역 지원서', when: '교역자실로 제출', tip: '주보에 끼워 둔 지원서', pill: '이번 달', tone: 'gray' },
]
const RailC = () => {
  const [done, setDone] = useState<Record<number, boolean>>({})
  return (
    <>
      <Card>
        <CardTitle Icon={BulletinIcon} right={<span className="text-[13.5px] font-bold text-ink-strong/70">11월 22일 주보</span>}>
          이번 주 꼭 챙길 일
        </CardTitle>
        <ul className="flex flex-col gap-2">
          {TODO.map((t, i) => (
            <li key={i}>
              <button
                onClick={() => setDone(d => ({ ...d, [i]: !d[i] }))}
                className="w-full flex gap-3 text-left rounded-xl border border-[var(--card-border)] p-3"
              >
                <span
                  className={`mt-0.5 shrink-0 grid place-items-center w-6 h-6 rounded-full border-2 ${
                    done[i] ? 'bg-brand border-brand text-white' : 'border-gray-300 dark:border-white/25 text-transparent'
                  }`}
                >
                  <CheckIcon width={14} height={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span className={`text-[16px] font-bold leading-snug text-ink-strong ${done[i] ? 'line-through decoration-2 decoration-brand/60' : ''}`}>{t.title}</span>
                    <span
                      className={`ml-auto shrink-0 px-2 h-6 rounded-full text-[12.5px] font-bold grid place-items-center ${
                        t.tone === 'brand'
                          ? 'bg-brand text-white'
                          : t.tone === 'amber'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200'
                            : 'bg-gray-100 text-ink-strong/80 dark:bg-white/10'
                      }`}
                    >
                      {t.pill}
                    </span>
                  </span>
                  <span className="block mt-1 text-[14px] font-bold text-ink-strong/85">{t.when}</span>
                  {t.tip && <span className="block text-[14px] font-semibold text-ink-strong/70">{t.tip}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button className="mt-3 w-full h-12 rounded-xl bg-brand text-white text-[16px] font-bold inline-flex items-center justify-center gap-1">
          주보 전체 읽기 <Chevron size={14} />
        </button>
        <div className="mt-3 flex items-center gap-2 text-[14px] font-bold text-ink-strong/75">
          지난 주보
          {ISSUES.slice(1, 4).map(i => (
            <button key={i.id} className="h-8 px-2.5 rounded-full bg-gray-100 dark:bg-white/10 text-ink-strong tabular-nums hover:ring-2 hover:ring-brand/40">
              {i.md.replace(/\.$/, '')}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle Icon={SparkleIcon}>다른 소식 새 글</CardTitle>
        <ul className="-mx-1">
          {OTHER.map(o => (
            <li key={o.key}>
              <button className="w-full flex items-center gap-3 px-1 py-2.5 rounded-lg text-left hover:bg-[var(--brand-soft)]">
                <span className="relative shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-brand">
                  <o.Icon width={20} height={20} />
                  {o.fresh && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#f04452] ring-2 ring-white dark:ring-card-dark" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold text-brand">
                    {o.label}
                    {o.when && <span className="text-ink-strong/70"> · {o.when}</span>}
                  </span>
                  <span className="block truncate text-[15.5px] font-bold text-ink-strong">{o.latest}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Verse />
    </>
  )
}

// ── D 쪽 넘겨보기 ────────────────────────────────
// 주보 = 8쪽짜리 종이. 실제 쪽 미리보기를 펼쳐 두고 '읽던 쪽부터' 열기 + 내가 읽은 주보 도장
const RailD = () => {
  const [page, setPage] = useState(2)
  const read = new Set([33, 30, 28])
  return (
    <>
      <Card>
        <CardTitle Icon={BulletinIcon} right={<span className="text-[13.5px] font-bold text-ink-strong/70 tabular-nums">제33권 47호</span>}>
          11월 22일 주보
        </CardTitle>
        <div className="rounded-xl bg-gray-100 dark:bg-white/[0.06] p-3">
          <img src={PAGES[page]} alt="" className="mx-auto h-[210px] w-auto rounded-[3px] shadow-[0_8px_20px_-8px_rgba(0,0,0,.45)] bg-white" />
        </div>
        <div className="mt-3 grid grid-cols-8 gap-1">
          {PAGES.map((src, i) => (
            <button key={i} onClick={() => setPage(i)} className="flex flex-col items-center">
              <img
                src={src}
                alt=""
                className={`w-full aspect-[3/4.4] object-cover rounded-[2px] bg-white ${i === page ? 'ring-2 ring-brand ring-offset-1 dark:ring-offset-card-dark' : 'opacity-90'}`}
              />
              <span className={`mt-1 text-[12.5px] font-bold tabular-nums ${i === page ? 'text-brand' : 'text-ink-strong/70'}`}>{i + 1}</span>
            </button>
          ))}
        </div>
        <button className="mt-3 w-full h-12 rounded-xl bg-brand text-white text-[16px] font-bold inline-flex items-center justify-center gap-1">
          {page + 1}쪽부터 읽기 <Chevron size={14} />
        </button>
        <p className="mt-2 text-center text-[13.5px] font-semibold text-ink-strong/75">지난번에 3쪽까지 보셨어요</p>
      </Card>

      <Card>
        <CardTitle Icon={ArchiveIcon} right={<span className="text-[13.5px] font-bold text-brand">4주 중 3주 읽음</span>}>
          지난 주보
        </CardTitle>
        <ul className="-mx-1">
          {ISSUES.slice(1, 5).map(i => (
            <li key={i.id}>
              <button className="w-full flex items-center gap-3 px-1.5 py-2 rounded-lg hover:bg-[var(--brand-soft)] text-left">
                <img src={i.cover} alt="" className="w-8 h-11 object-cover rounded-[2px] shadow-sm" />
                <span className="text-[16px] font-bold text-ink-strong">{i.date}</span>
                {read.has(i.id) ? (
                  <span className="ml-auto inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold">
                    <CheckIcon width={13} height={13} />
                    읽음
                  </span>
                ) : (
                  <span className="ml-auto h-7 px-2.5 grid place-items-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200 text-[13px] font-bold">
                    아직
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card pad="p-3">
        <div className="grid grid-cols-5 gap-1">
          {OTHER.map(o => (
            <button key={o.key} className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-[var(--brand-soft)] text-[13.5px] font-bold text-ink-strong">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-[var(--brand-soft)] text-brand">
                <o.Icon width={20} height={20} />
              </span>
              {o.label}
            </button>
          ))}
        </div>
      </Card>
      <Verse />
    </>
  )
}

// ═══ 2차 시안 ═══════════════════════════════════

const SERMONS = [
  { time: '9:20 · 11:20', title: '가장 좋은 길', ref: '고린도전서 12:31~13:13' },
  { time: '7:30', title: '무덤에서 집으로!', ref: '마가복음 5:1~20' },
  { time: '오후 1:30', title: '오늘 너는 알라', ref: '신명기 9:1~5' },
]

// ── E 참빛 신문 1면 ─────────────────────────────
// 주보를 '교회 신문'으로 — 명조 제호·머리기사·단신·이번 호 차례. 다른 소식 탭은 '면'이 된다
const RailE = () => {
  useState(() => void ensureSerifKr())
  const INDEX = [
    { label: '교회 소식', page: '2면' },
    { label: '공지', page: '3면' },
    { label: '새가족', page: '4면' },
    { label: '행사 사진', page: '5면' },
    { label: '헌금 안내', page: '6면' },
  ]
  return (
    <>
      <Card pad="p-0" className="overflow-hidden">
        <div className="px-5 pt-4 pb-3 text-center">
          <p className="font-serif-kr text-[28px] font-bold tracking-[0.18em] text-ink-strong leading-none">참빛 주보</p>
          <p className="mt-2 text-[13.5px] font-bold text-ink-strong/80 tabular-nums">제33권 47호 · 2026년 11월 22일 주일</p>
        </div>
        <div className="mx-5 border-t-[3px] border-double border-ink-strong/60" />
        <div className="px-5 pt-3.5">
          <p className="text-[13px] font-extrabold text-[#c2410c] dark:text-[#fb923c]">머리기사</p>
          <p className="mt-1 font-serif-kr text-[22px] leading-[1.3] font-bold text-ink-strong">다음 주일, 직분자 선거 공동의회</p>
          <p className="mt-1.5 text-[15px] leading-[1.55] font-semibold text-ink-strong/85">
            11월 29일 오전 11시 통합예배 후. 전자투표라 <b className="text-ink-strong">휴대폰을 꼭</b> 챙기세요.
          </p>
        </div>
        <div className="mx-5 mt-3.5 grid grid-cols-2 border-y border-ink-strong/20">
          <div className="py-3 pr-3 border-r border-ink-strong/20">
            <p className="font-serif-kr text-[16px] font-bold text-ink-strong leading-snug">특별새벽기도</p>
            <p className="mt-1 text-[14px] font-semibold text-ink-strong/80">월~금 5:30 본당</p>
          </div>
          <div className="py-3 pl-3">
            <p className="font-serif-kr text-[16px] font-bold text-ink-strong leading-snug">세례·입교식</p>
            <p className="mt-1 text-[14px] font-semibold text-ink-strong/80">함께 축하해요</p>
          </div>
        </div>
        <div className="px-5 pt-3.5">
          <p className="text-[13px] font-extrabold text-ink-strong/75">이번 주일 말씀</p>
          <ul className="mt-1.5 flex flex-col gap-2">
            {SERMONS.map(s => (
              <li key={s.title}>
                <p className="font-serif-kr text-[17px] font-bold text-ink-strong leading-snug">「{s.title}」</p>
                <p className="text-[13.5px] font-semibold text-ink-strong/75">{s.ref}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 pt-4">
          <button className="w-full h-12 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-[16px] font-bold inline-flex items-center justify-center gap-1">
            주보 전체 펼치기 <Chevron size={14} />
          </button>
        </div>
      </Card>

      <Card>
        <p className="font-serif-kr text-[17px] font-bold text-ink-strong mb-2">이번 호 차례</p>
        <ul>
          {INDEX.map(x => (
            <li key={x.label}>
              <button className="w-full flex items-baseline gap-2 py-2 text-left group">
                <span className="text-[16px] font-bold text-ink-strong group-hover:text-brand">{x.label}</span>
                <span className="flex-1 border-b-2 border-dotted border-ink-strong/25 -translate-y-1" />
                <span className="font-serif-kr text-[15px] font-bold text-ink-strong/80">{x.page}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <p className="font-serif-kr text-[17px] font-bold text-ink-strong mb-1">지난 호</p>
        {ISSUES.slice(1, 5).map(i => (
          <button key={i.id} className="w-full flex items-center gap-3 py-2.5 border-b border-ink-strong/10 last:border-0 text-left">
            <span className="font-serif-kr text-[15px] font-bold text-ink-strong/75 w-11 tabular-nums">{i.no}호</span>
            <span className="text-[16px] font-bold text-ink-strong">{i.date}</span>
            <Chevron className="ml-auto text-ink-strong/40" />
          </button>
        ))}
      </Card>
      <Verse />
    </>
  )
}

// ── F 표지가 주인공 ──────────────────────────────
// 매주 바뀌는 진짜 표지 사진을 레일 맨 위에 크게. 그 아래는 '이날 들은 말씀' — 설교 세 편
const RailF = () => {
  const [cur, ...past] = ISSUES
  return (
    <>
      <Card pad="p-0" className="overflow-hidden">
        <button className="block w-full relative">
          <img src={cur.cover} alt="" className="w-full h-[300px] object-cover object-top" />
          <span className="absolute left-3 top-3 h-8 px-3 rounded-full bg-white/95 text-gray-900 text-[13.5px] font-extrabold grid place-items-center shadow">
            이번 주 주보 · 47호
          </span>
        </button>
        <div className="px-5 pt-4 pb-5">
          <p className="text-[22px] font-extrabold text-ink-strong">11월 22일 주일</p>
          <p className="mt-3 text-[13.5px] font-extrabold text-ink-strong/75">이날 들은 말씀</p>
          <ul className="mt-1.5 flex flex-col">
            {SERMONS.map(s => (
              <li key={s.title} className="flex items-start gap-3 py-2 border-b border-[var(--card-border)] last:border-0">
                <span className="mt-0.5 shrink-0 w-[62px] text-[13px] font-bold text-[#c2410c] dark:text-[#fb923c] tabular-nums leading-tight">{s.time}</span>
                <span className="min-w-0">
                  <span className="block text-[16.5px] font-bold text-ink-strong leading-snug">{s.title}</span>
                  <span className="block text-[13.5px] font-semibold text-ink-strong/75">{s.ref}</span>
                </span>
              </li>
            ))}
          </ul>
          <button className="mt-3 w-full h-12 rounded-xl bg-brand text-white text-[16px] font-bold inline-flex items-center justify-center gap-1">
            주보 펼쳐 읽기 <Chevron size={14} />
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle Icon={ArchiveIcon}>지난 주보</CardTitle>
        <div className="flex pl-1">
          {past.slice(0, 5).map((i, n) => (
            <button key={i.id} className="relative -mr-4 last:mr-0" style={{ zIndex: 10 - n, transform: `rotate(${(n - 2) * 2.5}deg)` }}>
              <img src={i.cover} alt="" className="w-[66px] aspect-[480/717] object-cover rounded-[3px] shadow-[0_6px_14px_-6px_rgba(0,0,0,.5),0_0_0_1px_rgba(0,0,0,.08)]" />
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {past.slice(0, 5).map(i => (
            <button key={i.id} className="h-9 px-3 rounded-full border border-[var(--card-border)] text-[14.5px] font-bold text-ink-strong hover:border-brand">{i.date}</button>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle Icon={SparkleIcon}>다른 소식</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          {OTHER.map((o, n) => (
            <button key={o.key} className={`flex items-center gap-2 h-12 px-3 rounded-xl border border-[var(--card-border)] hover:border-brand text-[15.5px] font-bold text-ink-strong ${n === 4 ? 'col-span-2' : ''}`}>
              <o.Icon width={19} height={19} className="text-brand" />
              {o.label}
              {o.fresh && <span className="ml-auto h-5 px-1.5 rounded-full bg-[#f04452] text-white text-[11.5px] font-bold grid place-items-center">새 글</span>}
            </button>
          ))}
        </div>
      </Card>
      <Verse />
    </>
  )
}

// ── G 올해의 주일 52번 ───────────────────────────
// 제33권 47호 = 올해 47번째 주일. 한 해 주보를 달 한 줄씩 동그라미로 — 계절판 색, 절기, 누르면 그 주 주보
type Sun = { m: number; d: number; n: number }
const SUNDAYS: Sun[] = (() => {
  const out: Sun[] = []
  for (let t = Date.UTC(2026, 0, 4), n = 1; new Date(t).getUTCFullYear() === 2026; t += 7 * 864e5, n++) {
    const dt = new Date(t)
    out.push({ m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), n })
  }
  return out
})()
const SEASON_DOT = (m: number) =>
  m >= 3 && m <= 5 ? '#e8789c' : m >= 6 && m <= 8 ? '#2ea193' : m >= 9 && m <= 11 ? '#dd7432' : '#5f8fcf'
const FEAST: Record<string, string> = { '4-5': '부활절', '5-24': '성령강림절', '11-29': '대림절 시작' }
const RailG = () => {
  const CUR = 47
  const [sel, setSel] = useState(CUR)
  const s = SUNDAYS[sel - 1]
  const issue = ISSUES.find(i => i.no === sel)
  return (
    <>
      <Card>
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[16px] font-extrabold text-ink-strong">2026년의 주일</p>
          <p className="text-[14px] font-bold text-ink-strong/80">
            <b className="text-[20px] text-brand tabular-nums">47</b>번째 / 52
          </p>
        </div>
        <div className="flex flex-col gap-[5px]">
          {Array.from({ length: 12 }, (_, k) => k + 1).map(m => {
            const row = SUNDAYS.filter(x => x.m === m)
            const feast = row.map(x => FEAST[`${x.m}-${x.d}`]).find(Boolean)
            return (
              <div key={m} className="flex items-center gap-2">
                <span className="w-8 text-[13.5px] font-bold text-ink-strong/80 tabular-nums">{m}월</span>
                <div className="flex gap-[5px]">
                  {row.map(x => {
                    const done = x.n <= CUR
                    const advent = x.n >= 48
                    return (
                      <button
                        key={x.n}
                        onClick={() => done && setSel(x.n)}
                        className={`w-[26px] h-[26px] rounded-full grid place-items-center text-[11.5px] font-extrabold tabular-nums ${
                          sel === x.n ? 'ring-[3px] ring-brand ring-offset-2 dark:ring-offset-card-dark' : ''
                        } ${done ? 'text-white' : advent ? 'text-[#7c3aed] dark:text-[#c4b5fd] border-2 border-dashed border-[#a78bfa]' : 'text-ink-strong/45 border-2 border-ink-strong/15'}`}
                        style={done ? { background: SEASON_DOT(x.m) } : undefined}
                      >
                        {x.d}
                      </button>
                    )
                  })}
                </div>
                {feast && <span className="ml-auto text-[12.5px] font-bold text-ink-strong/80">{feast}</span>}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] font-bold text-ink-strong/80">
          {[['봄판', '#e8789c'], ['여름판', '#2ea193'], ['가을판', '#dd7432'], ['겨울판', '#5f8fcf']].map(([l, c]) => (
            <span key={l} className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}</span>
          ))}
        </div>

        <button className="mt-4 w-full flex gap-3 items-center rounded-xl bg-[var(--brand-soft)] p-3 text-left">
          {issue ? (
            <img src={issue.cover} alt="" className="w-[52px] aspect-[480/717] object-cover rounded-[3px] shadow" />
          ) : (
            <span className="w-[52px] h-[78px] rounded-[3px] bg-white/70 dark:bg-white/10" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-ink-strong/75 tabular-nums">제33권 {sel}호</span>
            <span className="block text-[18px] font-extrabold text-ink-strong">{s.m}월 {s.d}일 주일</span>
            <span className="mt-0.5 text-[14px] font-bold text-brand inline-flex items-center">{sel === CUR ? '이번 주 주보 읽기' : '이 주보 읽기'}<Chevron size={13} /></span>
          </span>
        </button>
        <p className="mt-3 text-[14.5px] font-bold text-ink-strong leading-snug">
          다음 주일부터 <span className="text-[#7c3aed] dark:text-[#c4b5fd]">대림절</span> — 성탄까지 주일 네 번 남았어요
        </p>
      </Card>

      <Card pad="p-3">
        <div className="grid grid-cols-5 gap-1">
          {OTHER.map(o => (
            <button key={o.key} className="relative flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-[var(--brand-soft)] text-[13.5px] font-bold text-ink-strong">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-[var(--brand-soft)] text-brand">
                <o.Icon width={20} height={20} />
              </span>
              {o.label}
              {o.fresh && <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#f04452]" />}
            </button>
          ))}
        </div>
      </Card>
      <Verse />
    </>
  )
}

const VARIANTS = [
  { key: 'now', label: '지금', note: '날짜가 두 번 반복되고, 목록 셋이 모두 비슷한 모양이라 눈이 머물 곳이 없어요.', Rail: RailNow },
  {
    key: 'e',
    label: 'E 참빛 신문 1면',
    note: '주보를 교회 신문처럼 — 명조 제호 "참빛 주보", 머리기사(공동의회)·단신 두 칸·이번 주일 말씀 세 편. 다른 소식은 "이번 호 차례"의 면(2면 소식, 3면 공지…)이 되고, 지난 주보는 "지난 호".',
    Rail: RailE,
  },
  {
    key: 'f',
    label: 'F 표지가 주인공',
    note: '매주 바뀌는 진짜 표지 사진(교회 건물·표어)을 맨 위에 크게. 그 아래 "이날 들은 말씀" — 예배 시간별 설교 제목·본문. 지난 주보는 표지를 부채처럼 겹쳐 두고 날짜 단추로도.',
    Rail: RailF,
  },
  {
    key: 'g',
    label: 'G 올해의 주일 52번',
    note: '"47호" = 올해 47번째 주일. 한 해 주보를 달마다 한 줄 동그라미로 — 계절판 색, 부활절·성령강림·대림절 표시. 누르면 그 주 주보가 아래에, 앞으로 올 대림절은 보라 점선.',
    Rail: RailG,
  },
  {
    key: 'a',
    label: '1차 A 주보 꽂이',
    note: '현관 주보 꽂이에서 한 부 뽑아 드는 느낌. 진짜 표지 사진 + "제33권 47호 · 11월 22일 주일"로 중복 제목을 없애고, 지난 주보는 표지 4장으로 한눈에. 다른 소식은 3칸 타일 + 새 글 빨간 점.',
    Rail: RailA,
  },
  {
    key: 'b',
    label: '1차 B 주일과 주일 사이',
    note: '주보는 한 주를 산다 — 지난 주일~다음 주일 한 줄 위에 주보 속 일정(특새 월~금, 주일 공동의회)을 띠로. 다음 주일은 "대림절 첫째 주" + 새 주보 도착 알림 스위치(이미 있는 기능). 지난 주보는 호수 타임라인.',
    Rail: RailB,
  },
  {
    key: 'c',
    label: '1차 C 꼭 챙길 일',
    note: '8쪽을 다 안 읽어도 되게 — 이번 주보에서 내가 움직여야 할 것 셋만(공동의회·특새·지원서) + 남은 날 알림 + 체크. 다른 소식은 "최신 글 제목"까지 보여 줘서 누르기 전에 무엇이 새로 왔는지 알 수 있어요.',
    Rail: RailC,
  },
  {
    key: 'd',
    label: '1차 D 쪽 넘겨보기',
    note: '실제 8쪽 미리보기를 펼쳐 두고 원하는 쪽부터 바로 열기(뷰어가 이미 쪽 지정을 지원). "지난번 3쪽까지" 이어 보기 + 지난 주보 읽음/아직 표시. 다른 소식은 한 줄 아이콘 5칸으로 작게.',
    Rail: RailD,
  },
] as const

const NewsRailPreview = () => {
  const [params, setParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const v = params.get('v') ?? 'all'
  const shown = v === 'all' ? VARIANTS.filter(x => 'nowefg'.includes(x.key)) : v === 'old' ? VARIANTS.filter(x => !'efg'.includes(x.key)) : VARIANTS.filter(x => x.key === v)

  return (
    <div className="min-h-screen bg-[#f2f4f6] dark:bg-[#121212] px-6 py-6">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <h1 className="text-[18px] font-extrabold text-ink-strong mr-3">/news 오른쪽 레일 시안</h1>
        {[{ key: 'all', label: '2차 나란히' }, { key: 'old', label: '1차 나란히' }, ...VARIANTS].map(x => (
          <button
            key={x.key}
            onClick={() => setParams({ v: x.key })}
            className={`h-9 px-3.5 rounded-full text-[14px] font-bold ${v === x.key ? 'bg-brand text-white' : 'bg-white dark:bg-white/10 text-ink-strong'}`}
          >
            {x.label}
          </button>
        ))}
        {(
          <button onClick={toggleTheme} className="ml-2 h-9 px-3.5 rounded-full text-[14px] font-bold bg-gray-800 text-white dark:bg-white dark:text-gray-900">
            {theme === 'dark' ? '라이트로' : '다크로'}
          </button>
        )}
      </div>
      <div className="flex gap-6 overflow-x-auto pb-6 items-start">
        {shown.map(({ key, label, note, Rail }) => (
          <div key={key} className="w-[312px] shrink-0">
            <p className="text-[16px] font-extrabold text-ink-strong">{label}</p>
            <p className="mt-1 mb-3 min-h-[96px] text-[13px] leading-[1.55] font-medium text-ink-strong/75">{note}</p>
            <div className="flex flex-col gap-3">
              <Rail />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NewsRailPreview
