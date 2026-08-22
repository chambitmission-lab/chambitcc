import { useNavigate } from 'react-router-dom'
import type { Sermon } from '../../../types/sermon'
import { BookOpenIcon, ChevronRightIcon } from '../../About/icons'
import { Reveal, SectionHeader } from './shared'

// "왜 참빛교회인가" 3기둥 — 설교 · 성경공부 · 스마트.
// 문장으로 주장하지 않고 실제 기능 이름(칩)과 실물(최신 설교)을 보여준다.

type Pillar = {
  key: string
  emoji: string
  title: string
  tagline: string
  desc: string
  chips: string[]
  to: string
  cta: string
}

const PILLARS = (ko: boolean): Pillar[] => [
  {
    key: 'sermon',
    emoji: '🎙️',
    title: ko ? '설교' : 'Sermons',
    tagline: ko ? '놓쳐도 괜찮아요. 설교는 도망 안 갑니다.' : "Missed it? Sermons don't run away.",
    desc: ko
      ? '주일 1~4부 설교가 월별 보관함에 차곡차곡. 본문 성구는 미리 펼쳐 보여드리고, 들은 말씀엔 아멘을 남길 수 있어요.'
      : 'Every Sunday sermon, archived by month. Scripture previews up front, and an amen button for the ones that land.',
    chips: ko
      ? ['주일 1~4부 다시보기', '월별 아카이브', '본문 성구 미리보기', '설교 아멘']
      : ['All 4 services on replay', 'Monthly archive', 'Scripture preview', 'Sermon amen'],
    to: '/sermon',
    cta: ko ? '최신 설교 듣기' : 'Latest sermons',
  },
  {
    key: 'bible',
    emoji: '📖',
    title: ko ? '성경공부' : 'Bible Study',
    tagline: ko ? '읽기만 하는 게 아니라, 도장 찍고 칭호 받습니다. 네, 게임처럼요.' : "You don't just read — you stamp, collect, and earn titles. Yes, like a game.",
    desc: ko
      ? '365일 일독 플랜, 장마다 도장 찍는 통독표, 모르는 단어는 단어장에, 오늘 읽은 말씀은 AI 묵상으로. 성경이 처음이면 42화짜리 스토리 모드부터.'
      : 'A 365-day plan, a reading chart you stamp chapter by chapter, a wordbook for hard words, AI reflections — and a 42-episode story mode if the Bible is new to you.',
    chips: ko
      ? ['365 일독 플랜', '통독표 도장', '처음 만나는 성경 42화', '단어장', 'AI 묵상', '상황별 성구', '완주 칭호']
      : ['365-day plan', 'Stamp chart', 'Story mode (42 eps)', 'Wordbook', 'AI reflection', 'Verses by situation', 'Titles'],
    to: '/bible',
    cta: ko ? '성경 펼쳐보기' : 'Open the Bible',
  },
  {
    key: 'smart',
    emoji: '✨',
    title: ko ? '스마트' : 'Smart',
    tagline: ko ? '교회 앱 맞습니다. 저희도 가끔 헷갈려요.' : "Yes, it's a church app. We forget sometimes too.",
    desc: ko
      ? '말씀 비서 참비가 예배 시간부터 성구 검색까지 대답하고, 낭독 영화관과 수면 타이머로 잠들기 전까지 말씀을 듣고, 우리반 알림장·타임캡슐·기도방까지 한 앱에.'
      : 'Chambi the Word assistant answers anything from service times to verse lookups; a reading cinema and sleep timer carry the Word to bedtime; class notices, time capsules and prayer rooms all live here.',
    chips: ko
      ? ['참비 챗봇', '낭독 영화관', '오디오북 수면 타이머', '기도 알림', '우리반 알림장', '타임캡슐', '기도방']
      : ['Chambi chatbot', 'Reading cinema', 'Audiobook sleep timer', 'Prayer reminders', 'Class notices', 'Time capsule', 'Prayer rooms'],
    to: '/feed',
    cta: ko ? '커뮤니티 둘러보기' : 'Explore the community',
  },
]

const PillarsSection = ({ ko, sermons }: { ko: boolean; sermons: Sermon[] }) => {
  const navigate = useNavigate()
  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return ko ? `${d.getMonth() + 1}월 ${d.getDate()}일` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <section className="mt-16">
      <Reveal>
        <SectionHeader
          kicker={ko ? '왜 참빛교회인가' : 'Why Chambit'}
          title={ko ? '설교 · 성경공부 · 스마트,\n세 가지는 자신 있습니다' : 'Sermons · Bible study · Smart.\nThree things we do well.'}
        />
      </Reveal>
      <div className="grid gap-4 lg:grid-cols-3">
        {PILLARS(ko).map((p, i) => (
          <Reveal key={p.key} delay={i * 80} className="h-full">
            <article className="feed-card rounded-3xl p-5 h-full flex flex-col">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center text-[22px]">{p.emoji}</span>
                <div>
                  <p className="text-[11.5px] font-bold tracking-[0.12em] uppercase text-brand">0{i + 1}</p>
                  <h3 className="text-[19px] font-extrabold tracking-tight text-ink-strong leading-tight">{p.title}</h3>
                </div>
              </div>
              <p className="mt-4 text-[15px] font-bold leading-snug text-ink-strong">“{p.tagline}”</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{p.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.chips.map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded-full bg-surface-container text-[12px] font-semibold text-ink">
                    {c}
                  </span>
                ))}
              </div>

              {p.key === 'sermon' && sermons.length > 0 && (
                <ul className="mt-4 divide-y divide-[var(--card-border)] rounded-2xl bg-surface-container overflow-hidden">
                  {sermons.slice(0, 2).map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => navigate('/sermon')}
                        className="w-full text-left px-3.5 py-3 hover:bg-[var(--brand-soft)] transition-colors"
                      >
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand">
                          <BookOpenIcon size={12} />
                          {fmtDate(s.sermon_date)}
                        </span>
                        <span className="block text-[14px] font-bold text-ink-strong leading-snug line-clamp-1">{s.title}</span>
                        <span className="block text-[12px] text-ink-muted truncate">
                          {s.pastor}
                          {s.bible_verse ? ` · ${s.bible_verse}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => navigate(p.to)}
                className="mt-auto pt-5 inline-flex items-center gap-1 text-[13.5px] font-bold text-brand hover:underline self-start"
              >
                {p.cta}
                <ChevronRightIcon size={15} />
              </button>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export default PillarsSection
