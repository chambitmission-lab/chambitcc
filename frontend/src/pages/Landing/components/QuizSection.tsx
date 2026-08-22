import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../../utils/toast'
import { ChevronRightIcon } from '../../About/icons'
import { Reveal, SectionHeader } from './shared'

// "당신은 어떤 성도?" 3문항 — 결과는 앱의 칭호 세계관(레위기 생존자·유두고 등)과 맞닿아 있어
// 웃고 공유하다 보면 자연스럽게 "이 칭호, 앱에서 진짜로 받을 수 있어요"로 이어진다.

type Kind = 'levi' | 'eutychus' | 'obadiah' | 'hannah'

type Q = { q: string; options: { label: string; kind: Kind }[] }

const QUESTIONS = (ko: boolean): Q[] => [
  {
    q: ko ? '성경 일독을 결심했습니다. 당신의 현실은?' : 'You decided to read the whole Bible. Reality check?',
    options: [
      { label: ko ? '레위기에서 3번 포기, 4번째 도전 중' : 'Quit in Leviticus three times, on attempt #4', kind: 'levi' },
      { label: ko ? '자기 전에 틀어놓고 잠들어요 (들었으니 읽은 걸로)' : 'I play it at bedtime and fall asleep (counts, right?)', kind: 'eutychus' },
      { label: ko ? '오바댜가 어디 있는지부터 찾는 탐험가' : 'I start by hunting for where Obadiah even is', kind: 'obadiah' },
      { label: ko ? '읽다가 기도로 새는 편' : 'I drift from reading into praying', kind: 'hannah' },
    ],
  },
  {
    q: ko ? '주일 예배, 당신의 자리는?' : "Sunday service — where's your seat?",
    options: [
      { label: ko ? '맨 앞줄. 눈 마주쳐야 안 졸아요' : 'Front row. Eye contact keeps me awake', kind: 'levi' },
      { label: ko ? '기둥 뒤 명당 (졸아도 안 보임)' : 'Behind the pillar (nap-proof)', kind: 'eutychus' },
      { label: ko ? '매주 다른 자리. 새로운 사람 구경' : 'Different seat every week, people-watching', kind: 'obadiah' },
      { label: ko ? '구석에서 조용히. 눈물 날 수도 있어서' : 'A quiet corner, in case of tears', kind: 'hannah' },
    ],
  },
  {
    q: ko ? '교회 앱을 열면 제일 먼저 누르는 건?' : 'First tap when you open the church app?',
    options: [
      { label: ko ? '통독표. 오늘치 도장부터' : "The stamp chart. Today's stamp first", kind: 'levi' },
      { label: ko ? '설교 다시보기 (아까 못 들은 부분…)' : 'Sermon replay (the part I missed…)', kind: 'eutychus' },
      { label: ko ? '참비한테 아무거나 물어보기' : 'Ask Chambi something random', kind: 'obadiah' },
      { label: ko ? '기도 피드에 아멘 누르기' : 'Amen on the prayer feed', kind: 'hannah' },
    ],
  },
]

const RESULTS = (ko: boolean): Record<Kind, { emoji: string; title: string; desc: string; hook: string; to: string; cta: string }> => ({
  levi: {
    emoji: '🏕️',
    title: ko ? '레위기 생존자형' : 'The Leviticus Survivor',
    desc: ko
      ? '끈기가 은사입니다. 남들이 포기하는 곳에서 당신은 도장 하나를 더 찍습니다.'
      : 'Perseverance is your gift. Where others quit, you stamp one more box.',
    hook: ko ? '앱에 진짜 "레위기 생존자" 칭호가 있습니다. 27장만 버티면 됩니다.' : 'There is a real "Leviticus Survivor" title in the app. Just 27 chapters.',
    to: '/bible/plans',
    cta: ko ? '365 일독 플랜 보기' : 'See the 365-day plan',
  },
  eutychus: {
    emoji: '😴',
    title: ko ? '유두고형' : 'The Eutychus',
    desc: ko
      ? '졸다 깨도 은혜는 남습니다(행 20:9 참고). 당신에게 필요한 건 의지가 아니라 오디오북입니다.'
      : 'Grace survives the nap (see Acts 20:9). You don’t need willpower — you need the audiobook.',
    hook: ko ? '낭독 영화관 + 수면 타이머가 있습니다. 잠들면 알아서 멈춰요.' : 'Reading cinema + sleep timer. It pauses when you drift off.',
    to: '/bible',
    cta: ko ? '오디오북 들으러 가기' : 'Try the audiobook',
  },
  obadiah: {
    emoji: '🧭',
    title: ko ? '오바댜 탐험가형' : 'The Obadiah Explorer',
    desc: ko
      ? '호기심이 당신의 나침반. 21절짜리 책도 기어이 찾아내는 사람입니다.'
      : 'Curiosity is your compass. You will find the 21-verse book eventually.',
    hook: ko ? '"처음 만나는 성경" 42화 스토리 모드와 상황별 성구가 딱입니다.' : 'Story mode (42 eps) and verses-by-situation were made for you.',
    to: '/bible/story',
    cta: ko ? '스토리 모드 시작' : 'Start story mode',
  },
  hannah: {
    emoji: '🕯️',
    title: ko ? '골방 기도자형' : 'The Closet Pray-er',
    desc: ko
      ? '말보다 기도가 먼저 나오는 사람. 조용하지만 가장 멀리 갑니다.'
      : 'Prayer comes before words for you. Quiet, but you go the farthest.',
    hook: ko ? '익명으로 기도제목을 나누고 서로 아멘하는 기도 커뮤니티가 기다려요.' : 'An anonymous prayer community — share, and say amen for each other.',
    to: '/feed',
    cta: ko ? '기도 커뮤니티 둘러보기' : 'Explore the prayer feed',
  },
})

const QuizSection = ({ ko }: { ko: boolean }) => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [picks, setPicks] = useState<Kind[]>([])
  const questions = QUESTIONS(ko)
  const done = picks.length === questions.length

  const result = (() => {
    if (!done) return null
    const score: Record<Kind, number> = { levi: 0, eutychus: 0, obadiah: 0, hannah: 0 }
    picks.forEach((k, i) => { score[k] += i === 0 ? 2 : 1 }) // 첫 문항(성경) 가중치
    const best = (Object.keys(score) as Kind[]).reduce((a, b) => (score[b] > score[a] ? b : a))
    return RESULTS(ko)[best]
  })()

  const pick = (kind: Kind) => {
    setPicks((p) => [...p, kind])
    setStep((s) => s + 1)
  }
  const reset = () => { setPicks([]); setStep(0) }

  const share = async () => {
    if (!result) return
    const text = ko
      ? `나는 "${result.title}" — ${result.desc}\n당신은 어떤 성도? 참빛교회에서 확인 👉 ${window.location.origin}`
      : `I'm "${result.title}" — ${result.desc}\nWhich one are you? ${window.location.origin}`
    try {
      if (navigator.share) { await navigator.share({ text }); return }
      await navigator.clipboard.writeText(text)
      showToast(ko ? '결과를 복사했어요. 친구에게 붙여넣기!' : 'Copied — paste it to a friend!')
    } catch { /* 취소 */ }
  }

  return (
    <section className="mt-16">
      <Reveal>
        <SectionHeader
          kicker={ko ? '30초 테스트' : '30-second quiz'}
          title={ko ? '당신은 어떤 성도인가요?' : 'Which kind of believer are you?'}
        />
      </Reveal>
      <Reveal>
        <div className="feed-card rounded-3xl p-5 lg:p-7 overflow-hidden">
          {!done ? (
            <div key={step}>
              <div className="flex items-center gap-1.5 mb-4">
                {questions.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-brand' : 'w-4 bg-surface-container'}`} />
                ))}
                <span className="ml-auto text-[12px] font-bold text-ink-muted">{step + 1} / {questions.length}</span>
              </div>
              <p className="text-[18px] lg:text-[20px] font-extrabold tracking-tight text-ink-strong leading-snug">{questions[step].q}</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {questions[step].options.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => pick(o.kind)}
                    className="text-left rounded-2xl px-4 py-3.5 bg-surface-container ring-1 ring-inset ring-transparent hover:ring-[var(--brand-glow)] hover:bg-[var(--brand-soft)] active:scale-[0.99] transition-[background-color,box-shadow,transform] text-[14px] font-semibold text-ink"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ) : result && (
            <div className="ld-pop flex flex-col lg:flex-row lg:items-center gap-5">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-[var(--brand-soft)] flex items-center justify-center text-[40px] lg:text-[48px] shrink-0">{result.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-brand">{ko ? '당신은' : 'You are'}</p>
                <h3 className="text-[24px] lg:text-[28px] font-extrabold tracking-tight text-ink-strong leading-tight">{result.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink">{result.desc}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">💡 {result.hook}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate(result.to)} className="brand-gradient inline-flex items-center gap-1 px-4 py-2.5 rounded-full text-[13.5px] font-bold text-white">
                    {result.cta}<ChevronRightIcon size={15} />
                  </button>
                  <button type="button" onClick={share} className="px-4 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13.5px] font-bold hover:bg-[var(--brand-soft-strong)]">
                    {ko ? '결과 공유' : 'Share result'}
                  </button>
                  <button type="button" onClick={reset} className="px-3 py-2.5 text-[13px] font-semibold text-ink-muted hover:text-brand">
                    {ko ? '다시 하기' : 'Retake'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  )
}

export default QuizSection
