import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { GrowthGlyph, JourneyStageGlyph, type GrowthGlyphName } from '../../components/icons/GrowthIcons'
import thanksLight from '../../assets/thanks/hero-light.webp'
import thanksDark from '../../assets/thanks/hero-dark.webp'
import './growthRewindPreview.css'

/**
 * /#/dev/growth-rewind — /growth '말씀 여정 인사이트' 자리에 들어갈 대안 시안.
 *   ?v=a 다시 꺼내보는 기록(추천) · b 마음에 담아 둔 말씀 · c 이번 주 작은 한 걸음
 *       d 인사이트 한 줄로 줄이기 · mix 추천 조합(d+a)
 * 표본 데이터만 쓴다. 왼쪽 = 모바일 폭(375), 오른쪽 = PC 오른쪽 칸(312).
 */

/* ───────────────────────── 공통 셸 ───────────────────────── */

const SectionTitle = ({ glyph, children }: { glyph: GrowthGlyphName; children: ReactNode }) => (
  <h3 className="text-[14px] font-bold text-ink-strong mb-3 flex items-center gap-2 tracking-[-0.01em]">
    <GrowthGlyph name={glyph} size={20} className="text-brand" />
    {children}
  </h3>
)

const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div
    className={`
      grw-card relative overflow-hidden rounded-2xl
      bg-white dark:bg-card-dark
      border border-gray-200/70 dark:border-white/[0.06] shadow-sm
      dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]
      ${className}
    `}
  >
    {children}
  </div>
)

const ThemeArt = ({ light, dark, height, position = 'center', scrim }: { light: string; dark: string; height: number; position?: string; scrim?: string }) => (
  <div className="grw-art" style={{ height, ...(scrim ? ({ '--grw-scrim': scrim } as CSSProperties) : {}) }}>
    <img src={light} alt="" className="dark:hidden" style={{ objectPosition: position }} />
    <img src={dark} alt="" className="hidden dark:block" style={{ objectPosition: position }} />
  </div>
)

/* ─────────────── A. 다시 꺼내보는 기록 (추천) ─────────────── */

type Kind = 'prayer' | 'thanks' | 'meditation'
const KIND_LABEL: Record<Kind, { label: string; glyph: GrowthGlyphName }> = {
  prayer: { label: '기도', glyph: 'prayer' },
  thanks: { label: '감사', glyph: 'thanks' },
  meditation: { label: '묵상', glyph: 'note' },
}

interface Memory {
  ago: string
  date: string
  kind: Kind
  title?: string
  text: string
  /** 그때 이후 이어진 일 — 응답·이어진 기도 */
  since?: string
}

const MEMORIES_RICH: Memory[] = [
  {
    ago: '1년 전 오늘',
    date: '2025년 11월 12일 수요일 · 아침 6:53',
    kind: 'prayer',
    title: '어머니 무릎 수술',
    text: '주님, 어머니가 다음 주에 수술을 받으십니다. 두려운 마음보다 주님을 의지하는 마음을 주시고, 집도하시는 손길 위에 함께하여 주옵소서.',
    since: '12월 3일에 응답으로 기록하셨어요',
  },
  {
    ago: '한 달 전 이맘때',
    date: '2026년 10월 11일 토요일 · 밤 9:10',
    kind: 'thanks',
    text: '아이가 처음으로 식사 기도를 했어요. 짧았지만 "하나님 고맙습니다" 그 한마디에 하루 피곤이 다 녹았습니다.',
  },
  {
    ago: '지난주 오늘',
    date: '2026년 11월 5일 수요일 · 아침 7:02',
    kind: 'meditation',
    title: '시편 23편',
    text: '부족함이 없으리로다. 오늘 내가 부족하다고 느낀 것들을 다시 세어 보았다. 세어 보니 대부분은 이미 받은 것이었다.',
  },
]

const MEMORIES_FIRST: Memory[] = [
  {
    ago: '처음 남기신 기도',
    date: '2026년 9월 28일 주일 · 오후 1:20',
    kind: 'prayer',
    text: '참빛교회에 처음 왔습니다. 낯설지만 이곳에서 주님을 더 가까이 알아가고 싶습니다.',
  },
]

const WaitingPrayer = () => {
  const [state, setState] = useState<'ask' | 'answered' | 'keep'>('ask')
  return (
    <div className="mt-4 rounded-2xl border border-gray-200/80 dark:border-white/[0.07] bg-gray-50/70 dark:bg-white/[0.03] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-gray-500 dark:text-white/50">응답을 기다리는 기도</span>
        <span className="text-[11px] text-gray-400 dark:text-white/40">2개 중 1</span>
      </div>
      <div className="mt-2 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-ink-strong leading-snug tracking-[-0.01em]">
            큰아들 취업 준비
          </p>
          <p className="mt-0.5 text-[12px] text-gray-500 dark:text-white/50">
            기도한 지 <b className="text-brand font-bold">142일</b> · 함께 기도한 성도 12명
          </p>
        </div>
        {state === 'answered' && <span className="grw-stamp shrink-0">응답</span>}
      </div>

      {state === 'ask' && (
        <>
          <p className="mt-3 text-[13px] text-gray-700 dark:text-white/75">이 기도, 어떻게 되었나요?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setState('answered')}
              className="py-2.5 rounded-xl text-[14px] font-bold border"
              style={{ borderColor: 'var(--grw-gold)', color: 'var(--grw-gold)', background: 'var(--grw-gold-soft)' }}
            >
              응답받았어요
            </button>
            <button
              onClick={() => setState('keep')}
              className="py-2.5 rounded-xl text-[14px] font-bold text-gray-600 dark:text-white/70 bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08]"
            >
              계속 기도할게요
            </button>
          </div>
        </>
      )}
      {state === 'answered' && (
        <div className="grw-fade mt-3 flex items-center justify-between gap-2">
          <p className="text-[13px] text-gray-700 dark:text-white/75">발자취에 응답으로 남겨 둘게요.</p>
          <button className="shrink-0 text-[13px] font-bold text-brand">간증 한 줄 →</button>
        </div>
      )}
      {state === 'keep' && (
        <p className="grw-fade mt-3 text-[13px] text-gray-700 dark:text-white/75">
          주님께 계속 맡겨 드려요. 한 달 뒤에 다시 여쭐게요.
        </p>
      )}
      {state !== 'ask' && (
        <button onClick={() => setState('ask')} className="mt-2 text-[11px] text-gray-400 dark:text-white/35 underline">
          (시안) 다시 보기
        </button>
      )}
    </div>
  )
}

const RewindCard = ({ sparse }: { sparse: boolean }) => {
  const list = sparse ? MEMORIES_FIRST : MEMORIES_RICH
  const [idx, setIdx] = useState(0)
  const m = list[Math.min(idx, list.length - 1)]
  const kind = KIND_LABEL[m.kind]

  return (
    <div className="px-4 pt-5">
      <SectionTitle glyph="days">다시 꺼내보는 기록</SectionTitle>
      <Card>
        <div className="relative">
          {/* 예수님과 양이 함께 같은 곳을 바라보는 언덕 — 지난 기록을 '함께 돌아본다' */}
          <ThemeArt light="/images/home/verse-scene-light.webp" dark="/images/home/verse-scene-dark.webp" height={140} position="100% 78%" scrim="24%" />
          <div className="grw-glow" />
          <div className="absolute left-4 top-3.5">
            <span className="inline-block rounded-full bg-white/85 dark:bg-black/35 backdrop-blur px-2.5 py-1 text-[12px] font-bold text-brand">
              {m.ago}
            </span>
          </div>
        </div>

        <div key={`${sparse}-${idx}`} className="grw-fade relative px-4 pb-4 -mt-5">
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-white/50">
            <GrowthGlyph name={kind.glyph} size={14} className="text-brand" />
            <span className="font-bold text-gray-700 dark:text-white/75">{kind.label}</span>
            {m.title && <span>· {m.title}</span>}
          </div>
          <p className="grw-letter mt-2 text-[16px] leading-[1.8]">{m.text}</p>
          <p className="mt-2 text-[11px] text-gray-400 dark:text-white/40">{m.date}</p>
          {m.since && (
            <p
              className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
              style={{ color: 'var(--grw-gold)', background: 'var(--grw-gold-soft)' }}
            >
              <GrowthGlyph name="answered" size={13} /> {m.since}
            </p>
          )}

          {sparse && (
            <p className="mt-3 text-[13px] leading-relaxed text-gray-600 dark:text-white/65">
              기록이 쌓이면 한 달 전, 1년 전 오늘의 글을 이 자리에서 다시 만나실 수 있어요.
            </p>
          )}

          {/* 기억 고르기 — 이동 없이 제자리 전환 */}
          {list.length > 1 && (
            <div className="mt-3.5 flex gap-1.5" role="tablist" aria-label="다시 볼 기록">
              {list.map((it, i) => (
                <button
                  key={it.ago}
                  role="tab"
                  aria-selected={i === idx}
                  onClick={() => setIdx(i)}
                  className={`text-[12px] px-3 py-1 rounded-full font-medium border ${
                    i === idx
                      ? 'bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)] font-bold'
                      : 'text-gray-500 dark:text-white/55 border-gray-200 dark:border-white/[0.08]'
                  }`}
                >
                  {it.ago.replace(' 오늘', '').replace(' 이맘때', '')}
                </button>
              ))}
            </div>
          )}

          {!sparse && <WaitingPrayer />}

          <button className="mt-3.5 w-full text-center text-[13px] font-bold text-brand py-1">
            그날의 발자취 보기
          </button>
        </div>
      </Card>
    </div>
  )
}

/* ─────────────── B. 마음에 담아 둔 말씀 ─────────────── */

const MyVerseCard = () => (
  <div className="px-4 pt-5">
    <SectionTitle glyph="book">마음에 담아 둔 말씀</SectionTitle>
    <Card>
      <div className="relative">
        <ThemeArt light="/images/home/verse-scene-light.webp" dark="/images/home/verse-scene-dark.webp" height={120} position="88% 60%" />
        <div className="grw-glow" />
      </div>
      <div className="relative px-4 pb-4 -mt-3">
        <div className="text-[12px] font-bold text-brand">시편 23:1</div>
        <p className="grw-letter mt-1.5 text-[18px] leading-[1.7] font-bold">
          여호와는 나의 목자시니 내게 부족함이 없으리로다
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[12px]">
          {['밑줄 3번', '묵상 2번', '카드로 1번 나눔'].map((t) => (
            <span key={t} className="rounded-full px-2.5 py-1 bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65">
              {t}
            </span>
          ))}
        </div>
        <p className="mt-2.5 text-[12px] text-gray-500 dark:text-white/50">
          처음 마음에 담으신 날 · 2025년 3월 2일 주일
        </p>

        <div className="mt-4 text-[12px] font-bold text-gray-500 dark:text-white/50">함께 담아 두신 말씀</div>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-white/[0.06]">
          {[
            { ref: '빌립보서 4:6', text: '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로…', n: 2 },
            { ref: '이사야 41:10', text: '두려워하지 말라 내가 너와 함께 함이라…', n: 2 },
          ].map((v) => (
            <div key={v.ref} className="py-2.5 flex items-baseline gap-2">
              <span className="shrink-0 w-[76px] text-[12px] font-bold text-ink-strong">{v.ref}</span>
              <span className="flex-1 min-w-0 truncate text-[13px] text-gray-600 dark:text-white/65">{v.text}</span>
              <span className="shrink-0 text-[11px] text-gray-400 dark:text-white/40">{v.n}번</span>
            </div>
          ))}
        </div>

        <button className="mt-3 w-full py-2.5 rounded-full brand-gradient font-bold text-[14px] shadow-[0_2px_10px_var(--brand-glow)]">
          말씀 카드로 간직하기
        </button>
      </div>
    </Card>
  </div>
)

/* ─────────── B-얇게. A 아래 붙는 '나의 말씀' 띠 (삽화 없음) ─────────── */

const MyVerseSlim = () => {
  const [open, setOpen] = useState(false)
  return (
    <div className="px-4 pt-3">
      <Card>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full text-left px-4 py-3.5 flex items-start gap-3"
        >
          <span className="shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-brand bg-[var(--brand-soft)]">
            <GrowthGlyph name="book" size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] text-gray-500 dark:text-white/50">
              마음에 담아 둔 말씀 · <b className="text-brand">시편 23:1</b>
            </span>
            <span className={`grw-letter block mt-1 text-[15px] leading-[1.65] font-bold ${open ? '' : 'line-clamp-2'}`}>
              여호와는 나의 목자시니 내게 부족함이 없으리로다
            </span>
            <span className="block mt-1 text-[11px] text-gray-400 dark:text-white/40">
              밑줄 3번 · 묵상 2번 · 2025년 3월 2일에 처음 담으셨어요
            </span>
          </span>
          <span className={`material-icons-outlined text-xl text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>
        {open && (
          <div className="grw-fade px-4 pb-4 -mt-1">
            <div className="divide-y divide-gray-100 dark:divide-white/[0.06] border-t border-gray-100 dark:border-white/[0.06]">
              {[
                { ref: '빌립보서 4:6', text: '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로…', n: 2 },
                { ref: '이사야 41:10', text: '두려워하지 말라 내가 너와 함께 함이라…', n: 2 },
              ].map((v) => (
                <div key={v.ref} className="py-2.5 flex items-baseline gap-2">
                  <span className="shrink-0 w-[76px] text-[12px] font-bold text-ink-strong">{v.ref}</span>
                  <span className="flex-1 min-w-0 truncate text-[13px] text-gray-600 dark:text-white/65">{v.text}</span>
                  <span className="shrink-0 text-[11px] text-gray-400 dark:text-white/40">{v.n}번</span>
                </div>
              ))}
            </div>
            <button className="mt-2 w-full py-2.5 rounded-full text-[14px] font-bold text-brand bg-[var(--brand-soft)]">
              말씀 카드로 간직하기
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ─────────────── C. 이번 주 작은 한 걸음 ─────────────── */

const WEEK = [
  { d: '일', on: ['prayer', 'verses'] },
  { d: '월', on: ['verses'] },
  { d: '화', on: [] },
  { d: '수', on: ['prayer', 'verses'], today: true },
  { d: '목', on: [] },
  { d: '금', on: [] },
  { d: '토', on: [] },
] as { d: string; on: string[]; today?: boolean }[]

const SmallStepCard = () => {
  const [done, setDone] = useState(false)
  return (
    <div className="px-4 pt-5">
      <SectionTitle glyph="sprout">이번 주 작은 한 걸음</SectionTitle>
      <Card>
        <ThemeArt light={thanksLight} dark={thanksDark} height={112} position="85% 70%" />
        <div className="relative px-4 pb-4 -mt-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEK.map((w) => (
              <div key={w.d} className="flex flex-col items-center gap-1">
                <span className={`text-[11px] ${w.today ? 'font-bold text-brand' : 'text-gray-400 dark:text-white/40'}`}>{w.d}</span>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    w.on.length
                      ? 'bg-[var(--brand-soft)] text-brand'
                      : w.today
                        ? 'border-2 border-dashed border-[var(--brand-soft-strong)]'
                        : 'bg-gray-100 dark:bg-white/[0.05]'
                  }`}
                >
                  {w.on.length > 0 && <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[13px] text-gray-500 dark:text-white/55">
            이번 주엔 기도와 말씀을 꾸준히 남기셨어요.
          </p>
          <p className="mt-1 text-[17px] font-bold text-ink-strong leading-snug tracking-[-0.015em]">
            오늘 고마웠던 일 하나만 적어 볼까요?
          </p>
          <p className="mt-1 text-[12px] text-gray-400 dark:text-white/40">
            숙제가 아니에요 · 한 주에 하나만 제안해 드려요
          </p>

          {!done ? (
            <button
              onClick={() => setDone(true)}
              className="mt-3.5 w-full py-2.5 rounded-full brand-gradient font-bold text-[14px] shadow-[0_2px_10px_var(--brand-glow)]"
            >
              감사 한 줄 쓰기
            </button>
          ) : (
            <div className="grw-fade mt-3.5 rounded-xl bg-[var(--brand-soft)] px-3.5 py-3 text-[13px] text-gray-700 dark:text-white/80">
              감사 항아리에 한 장 담겼어요. 다음 주엔 다른 걸음을 제안해 드릴게요.
              <button onClick={() => setDone(false)} className="ml-1 text-[11px] text-gray-400 underline">(다시)</button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

/* ─────────────── D. 인사이트 한 줄로 줄이기 ─────────────── */

const InsightChip = () => {
  const [open, setOpen] = useState(false)
  return (
    <div className="px-4 pt-5">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm"
      >
        <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-brand bg-[var(--brand-soft)]">
          <JourneyStageGlyph stage="zion" size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-gray-500 dark:text-white/50">요즘 말씀 여정</span>
          <span className="block text-[14px] font-bold text-ink-strong truncate">시온의 자리 · 찬양과 감사의 계절</span>
        </span>
        <span className={`material-icons-outlined text-xl text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="grw-fade mt-2 rounded-2xl px-4 py-3.5 bg-[var(--brand-soft)] text-[13px] leading-relaxed text-gray-700 dark:text-white/80">
          유다서에서 요한계시록으로, 완성될 하나님 나라의 소망을 바라보고 계세요.
          <div className="mt-2.5 text-[12px] font-bold text-brand">시편 100:4</div>
          <p className="mt-0.5">감사함으로 그의 문에 들어가며 찬송함으로 그의 궁정에 들어가서…</p>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── 미리보기 틀 ───────────────────────── */

const VARIANTS = [
  { key: 'a', label: 'A 다시 꺼내보는 기록', note: '추천 · 1년 전/한 달 전/지난주 오늘 내가 쓴 글 + 응답을 기다리는 기도' },
  { key: 'b', label: 'B 마음에 담아 둔 말씀', note: '밑줄·묵상·나눔이 가장 많은 구절 = 나의 말씀' },
  { key: 'c', label: 'C 이번 주 작은 한 걸음', note: '이번 주 빈 영역 하나만 부드럽게 제안 (/garden 퀘스트와 겹칠 수 있음)' },
  { key: 'd', label: 'D 인사이트 한 줄', note: '기존 인사이트를 접힌 한 줄로 — 눌러야 펼쳐짐' },
  { key: 'mix', label: '추천 조합 (D+A)', note: '한 줄 인사이트 위, 다시 꺼내보는 기록 아래' },
  { key: 'ab', label: 'A+B 얇게 (추천)', note: 'A는 삽화 카드 그대로, B는 삽화 없는 한 띠 — 누르면 함께 담은 말씀이 펼쳐짐' },
  { key: 'ab-full', label: 'A+B 그대로 쌓기', note: '비교용 — 두 삽화 카드를 그대로 쌓으면 이만큼 길어진다' },
] as const

const Body = ({ v, sparse }: { v: string; sparse: boolean }) => {
  if (v === 'b') return <MyVerseCard />
  if (v === 'c') return <SmallStepCard />
  if (v === 'd') return <InsightChip />
  if (v === 'ab')
    return (
      <>
        <RewindCard key={String(sparse)} sparse={sparse} />
        <MyVerseSlim />
      </>
    )
  if (v === 'ab-full')
    return (
      <>
        <RewindCard key={String(sparse)} sparse={sparse} />
        <MyVerseCard />
      </>
    )
  if (v === 'mix')
    return (
      <>
        <InsightChip />
        <RewindCard key={String(sparse)} sparse={sparse} />
      </>
    )
  return <RewindCard key={String(sparse)} sparse={sparse} />
}

export default function GrowthRewindPreview() {
  const [params, setParams] = useSearchParams()
  const v = params.get('v') ?? 'a'
  const sparse = params.get('sparse') === '1'
  const { theme, toggleTheme } = useTheme()
  const meta = VARIANTS.find((x) => x.key === v) ?? VARIANTS[0]

  useEffect(() => {
    void ensureFontFamily('gowunBatang')
  }, [])

  const set = (k: string, val: string | null) => {
    const next = new URLSearchParams(params)
    if (val === null) next.delete(k)
    else next.set(k, val)
    setParams(next, { replace: true })
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-16">
      <div className="max-w-[860px] mx-auto px-4 pt-6">
        <h1 className="text-[18px] font-bold text-ink-strong">/growth 인사이트 자리 — 대안 시안</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {VARIANTS.map((x) => (
            <button
              key={x.key}
              onClick={() => set('v', x.key)}
              className={`text-[12px] px-3 py-1.5 rounded-full border ${
                x.key === meta.key
                  ? 'bg-[var(--brand)] text-white border-transparent font-bold'
                  : 'text-gray-600 dark:text-white/70 border-gray-200 dark:border-white/[0.1]'
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-gray-500 dark:text-white/55">
          <span>{meta.note}</span>
          {(v === 'a' || v === 'mix' || v.startsWith('ab')) && (
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" checked={sparse} onChange={(e) => set('sparse', e.target.checked ? '1' : null)} />
              기록 적은 성도
            </label>
          )}
          <button onClick={toggleTheme} className="underline">{theme === 'dark' ? '라이트로' : '다크로'}</button>
        </div>

        <div className="mt-6 flex flex-wrap gap-8 items-start justify-center">
          <figure>
            <figcaption className="text-[11px] text-gray-400 mb-2 text-center">모바일 (375)</figcaption>
            <div className="w-[375px] max-w-[calc(100vw-32px)] rounded-[28px] border border-gray-200 dark:border-white/[0.08] bg-background-light dark:bg-background-dark pb-6 overflow-hidden">
              <Body v={v} sparse={sparse} />
            </div>
          </figure>
          <figure className="hidden md:block">
            <figcaption className="text-[11px] text-gray-400 mb-2 text-center">PC 오른쪽 칸 (312)</figcaption>
            <div className="w-[312px]">
              <Body v={v} sparse={sparse} />
            </div>
          </figure>
        </div>
      </div>
    </div>
  )
}
