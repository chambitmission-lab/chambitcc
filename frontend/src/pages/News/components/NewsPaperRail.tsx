// /news 우측 레일(PC) — '참빛 주보 1면' (2026-11-26 E2 큰 숫자안).
// 주보를 교회 신문 1면처럼: 명조 제호 + 머리기사(큰 날짜) + 단신(큰 시각) + 이번 주일 말씀,
// 그 아래 '이번 호 차례'(다른 소식 탭)와 '지난 호'. 글자 크기가 다 같아 보이지 않게 숫자를 크게 띄운다.
// 새 API 없음 — 이미지 주보 목록(useBulletins)과 디지털 주보(useDigitalBulletin, 같은 캐시)만 쓴다.
// 시안: /#/dev/news-rail?v=v-none
import { useEffect, useMemo } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useDigitalBulletin } from '../../../hooks/useDigitalBulletin'
import type { Bulletin } from '../../../types/bulletin'
import type { BulletinData } from '../../../types/digitalBulletin'
import { ensureSerifKr } from '../../../utils/deferredFonts'
import { fill, issueDateText, issueFullDateText, toIssue } from './bulletinIssue'
import { WEEKDAY_KO, parseBulletinWeek, todoItems, type WeekEvent } from './bulletinWeekly/bulletinWeek'

export interface PaperSection<K extends string> {
  key: K
  label: string
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
}

const Chevron = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm ${className}`}>
    {children}
  </section>
)

/** "오전 5:30" → { mer: '오전', clock: '5:30' } — 큰 숫자와 작은 오전/오후를 따로 그린다 */
const splitClock = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return { mer: h < 12 ? '오전' : '오후', clock: `${h % 12 || 12}:${String(m).padStart(2, '0')}` }
}

/** "【 가장 좋은 길 】 / 【 무덤에서 집으로! 】" + "고린도전서 12장 31절~13장 13절(신약 279쪽) / …" → 설교 목록 */
const sermonsOf = (data: BulletinData) => {
  const titles = data.worship.sermon.title.split('/').map(s => s.replace(/[【】]/g, '').trim())
  const refs = data.worship.sermon.subtitle.split('/').map(s => s.replace(/\((?:신|구)약\s*\d+\s*쪽\)/g, '').trim())
  return titles.filter(Boolean).map((title, i) => ({ title, ref: refs[i] ?? '' }))
}

/** 머리기사 = 아직 오지 않은 일 중 주보에 먼저 적힌 것(편집자가 가장 중요한 걸 위에 둔다),
 *  단신 = 남은 것 중 시각이 있는 가장 가까운 일 */
const pickStories = (data: BulletinData, now: Date) => {
  const todos = todoItems(parseBulletinWeek(data), now)
  if (!todos.length) return { headline: null, brief: null }
  const headline = [...todos].sort((a, b) => a.ev.index - b.ev.index)[0]
  const brief = todos.find(t => t !== headline && t.ev.minutes != null) ?? null
  return { headline, brief }
}

const firstLine = (ev: WeekEvent) => ev.body.split('\n')[0].trim()

export default function NewsPaperRail<K extends string>({
  bulletins,
  sections,
  openingId,
  onSectionChange,
  onBulletinClick,
}: {
  bulletins: Bulletin[]
  /** 이번 호 차례에 늘어놓을 다른 소식 — 지금 보고 있는 섹션은 뺀 목록 */
  sections: PaperSection<K>[]
  openingId: number | null
  onSectionChange: (next: K) => void
  onBulletinClick: (bulletin: Bulletin) => void
}) {
  const { t, language } = useLanguage()
  const ko = language !== 'en'
  const { data, isFromDefault } = useDigitalBulletin()

  // 명조 제호 — 첫 화면 뒤에 붙는 서체라 이 레일이 뜰 때 미리 당긴다(중복 호출은 무시)
  useEffect(() => void ensureSerifKr(), [])

  const latest = bulletins[0]
  const issue = latest ? toIssue(latest) : null
  const past = bulletins.slice(1, 5).map(toIssue)

  // 기본(빈 DB) 데이터는 가짜 소식이라 1면 기사로 쓰지 않는다
  const { headline, brief } = useMemo(
    () => (isFromDefault ? { headline: null, brief: null } : pickStories(data, new Date())),
    [data, isFromDefault],
  )
  const sermons = useMemo(() => (isFromDefault ? [] : sermonsOf(data)), [data, isFromDefault])

  const hl = headline?.ev
  // 기간 행사(특새 월~금)는 이미 지난 첫날이 아니라 다음에 오는 날을 크게 — todoItems 의 at
  const hlStart = headline?.at ?? null

  return (
    <>
      {issue && latest && (
        <Card className="overflow-hidden">
          {/* 제호 */}
          <div className="px-5 pt-4">
            <div className="flex items-end justify-between gap-3">
              <p className="font-serif-kr text-[30px] font-bold tracking-[0.14em] text-ink-strong leading-none">{t('newsPaperMasthead')}</p>
              <p className="text-right text-[12.5px] font-bold leading-[1.35] text-ink-strong/75 tabular-nums whitespace-pre-line">
                {fill(t('newsPaperVolumeNo'), { vol: issue.vol, no: issue.no })}
              </p>
            </div>
            <div className="mt-3 border-t-[3px] border-double border-ink-strong/70" />
            <p className="py-1.5 text-[13.5px] font-bold text-ink-strong/80 border-b border-ink-strong/20">
              {issueFullDateText(issue, language)}
              {ko && ' 주일'}
            </p>
          </div>

          {/* 머리기사 — 큰 날짜 블록 */}
          {hl && (
            <div className="px-5 pt-3.5">
              <span className="inline-flex h-6 px-2 rounded-[4px] bg-[#c2410c] dark:bg-[#ea7a3a] text-white text-[12.5px] font-extrabold items-center">
                {t('newsPaperHeadline')}
              </span>
              <div className="mt-2.5 flex gap-3.5">
                {hlStart && (
                  <div className="shrink-0 w-[68px] self-start rounded-xl bg-[#fff1e6] dark:bg-[#ea7a3a]/15 py-2 text-center text-[#c2410c] dark:text-[#fb923c]">
                    <p className="text-[13px] font-extrabold">{hlStart.getMonth() + 1}월</p>
                    <p className="font-serif-kr text-[38px] leading-none font-bold tabular-nums">{hlStart.getDate()}</p>
                    <p className="mt-1 text-[13px] font-extrabold">{WEEKDAY_KO[hlStart.getDay()]}{hlStart.getDay() ? '요일' : ''}</p>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-serif-kr text-[21px] leading-[1.3] font-bold text-ink-strong break-keep">{hl.title}</p>
                  <p className="mt-1 text-[14.5px] leading-[1.5] font-semibold text-ink-strong/85 line-clamp-3">{firstLine(hl)}</p>
                </div>
              </div>
            </div>
          )}

          {/* 단신 — 큰 시각 */}
          {brief && brief.ev.minutes != null && (
            <div className="mx-5 mt-4 border-t border-ink-strong/20 pt-3 flex items-center gap-3">
              <p className="shrink-0 font-serif-kr font-bold text-ink-strong leading-none tabular-nums">
                <span className="block text-[12.5px] font-sans font-extrabold text-ink-strong/75 mb-0.5">{splitClock(brief.ev.minutes).mer}</span>
                <span className="text-[30px]">{splitClock(brief.ev.minutes).clock}</span>
              </p>
              <div className="min-w-0">
                <p className="text-[16px] font-extrabold text-ink-strong leading-snug break-keep">{brief.ev.title}</p>
                <p className="text-[14px] font-semibold text-ink-strong/80">
                  {[
                    brief.ev.start &&
                      `${brief.ev.start.getMonth() + 1}/${brief.ev.start.getDate()}${brief.ev.end ? `~${brief.ev.end.getDate()}` : ''}`,
                    brief.ev.place,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>
          )}

          {/* 이번 주일 말씀 */}
          {sermons.length > 0 && (
            <div className="mx-5 mt-4 border-t-[3px] border-double border-ink-strong/50 pt-3">
              <p className="font-serif-kr text-[16px] font-bold text-ink-strong">{t('newsPaperSermons')}</p>
              <ul className="mt-1">
                {sermons.map((s, i) => (
                  <li key={i} className="flex gap-3 py-2 border-b border-ink-strong/10 last:border-0">
                    <span className="shrink-0 w-5 font-serif-kr text-[20px] font-bold text-brand tabular-nums leading-tight">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block text-[16.5px] font-extrabold text-ink-strong leading-snug break-keep">{s.title}</span>
                      {s.ref && <span className="block text-[13.5px] font-semibold text-ink-strong/75">{s.ref}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-5 pt-4">
            <button
              type="button"
              onClick={() => onBulletinClick(latest)}
              disabled={openingId === latest.id}
              className={`w-full h-12 rounded-xl bg-brand text-white text-[16px] font-bold inline-flex items-center justify-center gap-1 shadow-[0_6px_18px_-6px_var(--brand-glow)] ${
                openingId === latest.id ? 'opacity-60' : ''
              }`}
            >
              {t('newsPaperOpen')}
              <Chevron size={14} />
            </button>
          </div>
        </Card>
      )}

      {/* 이번 호 차례 — 다른 소식 탭. 큰 번호가 눈의 디딤돌 */}
      <Card className="p-5">
        <p className="font-serif-kr text-[18px] font-bold text-ink-strong mb-1">{t('newsPaperIndex')}</p>
        <ul>
          {sections.map((sec, i) => (
            <li key={sec.key}>
              <button
                type="button"
                onClick={() => onSectionChange(sec.key)}
                className="group w-full flex items-center gap-3 py-1.5 text-left"
              >
                <span className="w-9 text-center font-serif-kr text-[26px] font-bold leading-none tabular-nums text-ink-strong/30 group-hover:text-brand transition-colors">
                  {i + 2}
                </span>
                <span className="text-[16.5px] font-bold text-ink-strong group-hover:text-brand transition-colors">{sec.label}</span>
                <Chevron className="ml-auto text-ink-strong/35 group-hover:text-brand transition-colors" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {/* 지난 호 — 큰 호수 */}
      {past.length > 0 && (
        <Card className="p-5">
          <p className="font-serif-kr text-[18px] font-bold text-ink-strong mb-1">{t('newsPaperPast')}</p>
          <ul>
            {past.map(p => (
              <li key={p.bulletin.id} className="border-b border-ink-strong/10 last:border-0">
                <button
                  type="button"
                  onClick={() => onBulletinClick(p.bulletin)}
                  disabled={openingId === p.bulletin.id}
                  className={`group w-full flex items-center gap-3 py-2 text-left ${openingId === p.bulletin.id ? 'opacity-60' : ''}`}
                >
                  <span className="w-10 font-serif-kr text-[24px] font-bold leading-none tabular-nums text-ink-strong/30 group-hover:text-brand transition-colors">
                    {p.no}
                  </span>
                  <span className="text-[16px] font-bold text-ink-strong">{issueDateText(p, language)}</span>
                  <Chevron className="ml-auto text-ink-strong/35 group-hover:text-brand transition-colors" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
