import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurveys } from '../../../hooks/useSurvey'
import { isAuthenticated } from '../../../utils/auth'
import { stopSpeaking } from './speech'
import StoryBook from './StoryBook'
import Newspaper from './Newspaper'
import MyJourney from './MyJourney'
import HistoryQuiz from './HistoryQuiz'
import './HistoryLab.css'

/*
 * 새 발자취(시범) — /history/new
 * 성도 의견을 받는 동안 기존 /history 는 그대로 두고 이 화면을 따로 띄운다.
 * 기존 화면 스냅샷은 git 태그 `history-v1`.
 *
 * 의견은 기존 설문 기능으로 받는다. 제목에 FEEDBACK_KEYWORD 가 들어간 진행 중 설문이 있으면
 * 그 설문으로 바로 가고, 없으면 설문 목록으로 보낸다 — 설문 id 를 코드에 박지 않기 위함.
 */
const FEEDBACK_KEYWORD = '발자취'

type TabKey = 'story' | 'paper' | 'me' | 'quiz'

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: 'story', label: '이야기책', desc: '이정표를 한 장씩 크게 넘겨 보세요. 읽어주기도 됩니다.' },
  { key: 'paper', label: '참빛신보', desc: '해를 고르면 그 해 소식이 옛날 신문 1면으로 나옵니다.' },
  { key: 'me', label: '나와 참빛', desc: '처음 오신 해를 고르면 함께 걸어온 길을 보여 드려요.' },
  { key: 'quiz', label: '역사 퀴즈', desc: '참빛의 역사, 얼마나 알고 계세요? 다섯 문제입니다.' },
]

const SCALES = [1, 1.15, 1.3]
const SCALE_KEY = 'history-lab-scale'
const TAB_KEY = 'history-lab-tab'

const readStored = <T,>(key: string, fallback: T, valid: (v: unknown) => boolean): T => {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const v = JSON.parse(raw)
    return valid(v) ? (v as T) : fallback
  } catch {
    return fallback
  }
}

const writeStored = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 저장 불가(사생활 보호 모드 등) — 무시 */
  }
}

export default function HistoryLab() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>(() =>
    readStored(TAB_KEY, 'story', (v) => TABS.some((t) => t.key === v)),
  )
  const [scaleIdx, setScaleIdx] = useState(() =>
    readStored(SCALE_KEY, 0, (v) => typeof v === 'number' && v >= 0 && v < SCALES.length),
  )

  const loggedIn = isAuthenticated()
  const { data: surveys } = useSurveys(loggedIn)
  const feedbackSurvey = surveys?.find(
    (s) => s.status === 'open' && s.title.includes(FEEDBACK_KEYWORD),
  )
  const feedbackPath = feedbackSurvey ? `/survey/${feedbackSurvey.id}` : '/survey'

  useEffect(() => writeStored(TAB_KEY, tab), [tab])
  useEffect(() => writeStored(SCALE_KEY, scaleIdx), [scaleIdx])
  useEffect(() => () => stopSpeaking(), [])

  const switchTab = (key: TabKey) => {
    stopSpeaking()
    setTab(key)
  }

  const current = TABS.find((t) => t.key === tab) ?? TABS[0]

  return (
    <div
      className="hlab bg-[var(--app-canvas)] min-h-screen page-stage"
      style={{ ['--hlab-fs' as string]: SCALES[scaleIdx] }}
    >
      <div className="hlab-wrap">
        {/* 시범 안내 + 예전 화면으로 */}
        <div className="hlab-notice">
          <span className="hlab-notice-badge">시범 운영</span>
          <span className="hlab-notice-text">새로운 발자취 화면을 미리 보고 계세요. 의견을 들려주시면 반영하겠습니다.</span>
          <button type="button" className="hlab-notice-back" onClick={() => navigate('/history')}>
            ← 예전 화면으로
          </button>
        </div>

        <header className="hlab-head">
          <div>
            <p className="hlab-kicker">SINCE 1994 · 참빛의 발자취</p>
            <h1 className="hlab-title">참으로, 빛으로 걸어온 길</h1>
          </div>
          <div className="hlab-scale" role="group" aria-label="글자 크기">
            <span>글자 크기</span>
            {SCALES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === scaleIdx ? 'is-on' : ''}
                aria-pressed={i === scaleIdx}
                aria-label={['보통', '크게', '아주 크게'][i]}
                style={{ fontSize: 15 + i * 3 }}
                onClick={() => setScaleIdx(i)}
              >
                가
              </button>
            ))}
          </div>
        </header>

        <nav className="hlab-tabs" role="tablist">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === tab}
              className={`hlab-tab${t.key === tab ? ' is-on' : ''}`}
              onClick={() => switchTab(t.key)}
            >
              <span className="hlab-tab-n">{i + 1}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <p className="hlab-tab-desc">{current.desc}</p>

        <main className="hlab-panel" key={tab}>
          {tab === 'story' && <StoryBook />}
          {tab === 'paper' && <Newspaper />}
          {tab === 'me' && <MyJourney />}
          {tab === 'quiz' && <HistoryQuiz />}
        </main>

        {/* 의견 남기기 */}
        <section className="hlab-card hlab-feedback">
          <div>
            <h2>이 화면, 어떠셨어요?</h2>
            <p>어느 화면이 좋았는지, 글씨는 편하셨는지 알려 주세요. 여러분의 의견으로 발자취 화면을 정합니다.</p>
          </div>
          <div className="hlab-feedback-actions">
            <button type="button" className="hlab-btn hlab-btn--primary" onClick={() => navigate(feedbackPath)}>
              의견 남기기
            </button>
            <button type="button" className="hlab-btn" onClick={() => navigate('/history')}>
              예전 화면 보기
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
