// 개발 전용 시안 비교 (/#/dev/meditation-content) —
// 홈 묵상 카드 본문(본문 표기 · 핵심 절 · 오늘의 질문 · CTA) 영역만 떼어 네 가지 안을 나란히 본다.
// 핵심 절 박스(들판 장면)는 실제 CSS(.meditation-verse-quote)를 그대로 재사용한다.
import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import '../Home/components/DailyMeditationCard.css'
import './meditationContentLab.css'

type ReadState = 'none' | 'progress' | 'done'

const MOCK = {
  label: '시편 103:1-14',
  theme: '은택을 세어 보다',
  verseText: '동이 서에서 먼 것 같이 우리의 죄과를 우리에게서 멀리 옮기셨으며',
  verseRef: '시편 103:12',
  question: '용서받았다는 사실을 아직 믿지 못해 붙들고 있는 죄가 있습니까?',
}

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`} aria-hidden>
    {name}
  </span>
)

const VerseBox = () => (
  <blockquote className="meditation-verse-quote is-art-ready">
    <div className="meditation-verse-body">
      <span className="meditation-verse-glyph" aria-hidden>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.2 6.5c-2.6.9-4.2 3.1-4.2 6.1V17.5h5.5V12H5.6c.1-1.7 1-2.9 2.7-3.5zm9.3 0c-2.6.9-4.2 3.1-4.2 6.1V17.5h5.5V12h-2.9c.1-1.7 1-2.9 2.7-3.5z" />
        </svg>
      </span>
      <p className="meditation-verse-text">{MOCK.verseText}</p>
      <cite className="meditation-verse-reference">— {MOCK.verseRef}</cite>
    </div>
  </blockquote>
)

const timeText = (s: ReadState) => (s === 'progress' ? '6절부터 · 약 2분' : '약 3분')
const primaryLabel = (s: ReadState) =>
  s === 'done' ? '오늘 본문 완료' : s === 'progress' ? '이어 읽기' : '오늘 본문 읽기'

/* ── 현재 ─────────────────────────── */
const Current = ({ s }: { s: ReadState }) => (
  <>
    <div className="meditation-passage">
      <span className="meditation-passage-label">{MOCK.label}</span>
      <span className="meditation-passage-meta">
        <span className="meditation-passage-theme">{MOCK.theme}</span>
        {s !== 'done' && (
          <span className="meditation-passage-time">
            <Icon name="schedule" />
            {timeText(s)}
          </span>
        )}
      </span>
    </div>
    <VerseBox />
    <div className="meditation-question-block">
      <span className="meditation-question-label">
        <Icon name="auto_awesome" />
        오늘의 질문
      </span>
      <p className="meditation-question-text">{MOCK.question}</p>
      <button type="button" className="meditation-deepen-link">
        1분 묵상 이어가기
        <Icon name="arrow_forward" />
      </button>
    </div>
    <div className="meditation-actions">
      <button type="button" className={`meditation-cta is-primary${s === 'done' ? ' is-done' : ''}`}>
        {s === 'done' && <Icon name="check_circle" />}
        {primaryLabel(s)}
        {s !== 'done' && <Icon name="arrow_forward" className="meditation-cta-arrow" />}
      </button>
      <button type="button" className="meditation-cta">
        <Icon name="edit_note" />
        나의 묵상 나누기
      </button>
    </div>
  </>
)

/* 공통 — 제목 한 줄 + 아래 회색 메타 한 줄(칩 제거) */
const TitleBlock = ({ s }: { s: ReadState }) => (
  <div className="mcl-title">
    <h3 className="mcl-title-label">{MOCK.label}</h3>
    <p className="mcl-title-meta">
      <span>{MOCK.theme}</span>
      <span className="mcl-dot" aria-hidden>·</span>
      {s === 'done' ? (
        <span className="mcl-done-text">
          <Icon name="check_circle" /> 읽기 완료
        </span>
      ) : (
        <span>{timeText(s)}</span>
      )}
    </p>
  </div>
)

const PrimaryCta = ({ s, label }: { s: ReadState; label?: string }) => (
  <button type="button" className={`mcl-primary${s === 'done' ? ' is-done' : ''}`}>
    {s === 'done' && <Icon name="check_circle" />}
    {label ?? primaryLabel(s)}
    {s !== 'done' && <Icon name="arrow_forward" className="mcl-arrow" />}
  </button>
)

/* ── A. 정돈형 ───────────────────────
 * 칩 → 메타 한 줄, 질문은 통째로 누르는 소프트 카드(→ 1분 묵상),
 * 주 CTA 전폭 하나 + 보조는 아래 텍스트 버튼. */
const VariantA = ({ s }: { s: ReadState }) => (
  <>
    <TitleBlock s={s} />
    <VerseBox />
    <button type="button" className="mcl-a-question">
      <span className="mcl-a-qlabel">
        <Icon name="auto_awesome" />
        오늘의 질문
      </span>
      <span className="mcl-a-qtext">{MOCK.question}</span>
      <span className="mcl-a-qfoot">
        1분 묵상하기 <Icon name="chevron_right" />
      </span>
    </button>
    <PrimaryCta s={s} />
    <button type="button" className="mcl-text-btn">
      <Icon name="edit_note" />
      나의 묵상 나누기
    </button>
  </>
)

/* ── B. 질문에 답하기 ──────────────────
 * 질문 아래에 '한 줄 답' 입력칸(가짜) — 누르면 묵상 작성기.
 * [나의 묵상 나누기] 버튼이 질문 안으로 흡수돼 버튼이 하나 준다. */
const VariantB = ({ s }: { s: ReadState }) => (
  <>
    <TitleBlock s={s} />
    <VerseBox />
    <div className="mcl-b-question">
      <div className="mcl-b-head">
        <span className="mcl-b-label">
          <Icon name="auto_awesome" />
          오늘의 질문
        </span>
        <button type="button" className="mcl-b-deep">
          1분 묵상 <Icon name="chevron_right" />
        </button>
      </div>
      <p className="mcl-b-text">{MOCK.question}</p>
      <button type="button" className="mcl-b-answer">
        <span>이 질문에 한 줄로 답해 보세요…</span>
        <Icon name="edit" />
      </button>
    </div>
    <PrimaryCta s={s} />
  </>
)

/* ── C. 오늘의 세 걸음 ─────────────────
 * 읽기 → 묵상 → 나누기를 체크리스트로. 지금 할 한 걸음만 파랗게,
 * 아래 주 CTA 도 '다음 걸음'으로 바뀐다. */
const VariantC = ({ s }: { s: ReadState }) => {
  const steps = [
    {
      key: 'read',
      icon: 'menu_book',
      title: s === 'progress' ? '본문 이어 읽기' : '본문 읽기',
      sub: s === 'done' ? '다 읽었어요' : timeText(s),
      done: s === 'done',
    },
    { key: 'think', icon: 'auto_awesome', title: '질문 앞에 머물기', sub: MOCK.question, done: false },
    { key: 'share', icon: 'edit_note', title: '묵상 한 줄 나누기', sub: '교우들과 함께 보기', done: false },
  ]
  const current = steps.findIndex((st) => !st.done)
  const doneCount = steps.filter((st) => st.done).length
  const ctaLabel = ['', '1분 묵상하기', '묵상 나누기'][current] || primaryLabel(s)
  return (
    <>
      <div className="mcl-c-titlerow">
        <TitleBlock s={s} />
        <span className="mcl-c-count">
          <b>{doneCount}</b>/3
        </span>
      </div>
      <VerseBox />
      <ol className="mcl-c-steps">
        {steps.map((st, i) => (
          <li
            key={st.key}
            className={`mcl-c-step${st.done ? ' is-done' : ''}${i === current ? ' is-current' : ''}`}
          >
            <span className="mcl-c-dot">
              <Icon name={st.done ? 'check' : st.icon} />
            </span>
            <span className="mcl-c-body">
              <span className="mcl-c-title">{st.title}</span>
              <span className={`mcl-c-sub${st.key === 'think' ? ' is-question' : ''}`}>{st.sub}</span>
            </span>
          </li>
        ))}
      </ol>
      <PrimaryCta s={current === 0 ? s : 'none'} label={current === 0 ? undefined : ctaLabel} />
    </>
  )
}

/* ── D. 말씀 카드 일체형 ────────────────
 * 질문을 장면 박스 하단에 붙여 '말씀이 건네는 질문'으로 한 장에 묶는다.
 * 박스가 하나로 끝나 카드가 짧아지고, 아래는 버튼 두 개 같은 높이. */
const VariantD = ({ s }: { s: ReadState }) => (
  <>
    <TitleBlock s={s} />
    <div className="mcl-d-stack">
      <VerseBox />
      <button type="button" className="mcl-d-question">
        <span className="mcl-d-qlabel">
          <Icon name="auto_awesome" />
          말씀이 묻습니다
        </span>
        <span className="mcl-d-qtext">{MOCK.question}</span>
        <Icon name="chevron_right" className="mcl-d-chev" />
      </button>
    </div>
    <div className="mcl-d-actions">
      <PrimaryCta s={s} />
      <button type="button" className="mcl-d-icon-btn" aria-label="나의 묵상 나누기" title="나의 묵상 나누기">
        <Icon name="edit_note" />
        <span>나누기</span>
      </button>
    </div>
  </>
)

const VARIANTS = [
  { key: 'now', name: '현재', desc: '칩 두 개 · 왼쪽 세로 획 질문 · 버튼 2개 + 링크 1개', C: Current },
  { key: 'a', name: 'A. 정돈형', desc: '칩→메타 한 줄, 질문 카드 통째로 탭, 전폭 주 버튼 + 텍스트 보조', C: VariantA },
  { key: 'b', name: 'B. 질문에 답하기', desc: '질문 아래 한 줄 답 입력칸 → 묵상 작성기. 버튼 하나', C: VariantB },
  { key: 'c', name: 'C. 오늘의 세 걸음', desc: '읽기→묵상→나누기 체크리스트, 주 버튼이 다음 걸음으로', C: VariantC },
  { key: 'd', name: 'D. 말씀 카드 일체형', desc: '질문을 장면 박스 아래에 붙여 한 장으로, 버튼 한 줄', C: VariantD },
] as const

const MeditationContentLab = () => {
  const { theme, toggleTheme } = useTheme()
  const [s, setS] = useState<ReadState>('none')
  const [width, setWidth] = useState(340)

  return (
    <div className="mcl-page">
      <header className="mcl-toolbar">
        <h1>홈 묵상 카드 — 본문 영역 시안</h1>
        <div className="mcl-controls">
          <div className="mcl-seg">
            {(['none', 'progress', 'done'] as const).map((v) => (
              <button key={v} className={s === v ? 'on' : ''} onClick={() => setS(v)}>
                {v === 'none' ? '안 읽음' : v === 'progress' ? '읽는 중' : '완료'}
              </button>
            ))}
          </div>
          <div className="mcl-seg">
            {[340, 390].map((w) => (
              <button key={w} className={width === w ? 'on' : ''} onClick={() => setWidth(w)}>
                {w === 340 ? 'PC 좁은 열 340' : '모바일 390'}
              </button>
            ))}
          </div>
          <button className="mcl-theme" onClick={toggleTheme}>
            {theme === 'dark' ? '☀ 라이트' : '☾ 다크'}
          </button>
        </div>
      </header>
      <div className="mcl-grid">
        {VARIANTS.map(({ key, name, desc, C }) => (
          <section key={key} className="mcl-col" style={{ width }}>
            <div className="mcl-col-head">
              <strong>{name}</strong>
              <span>{desc}</span>
            </div>
            <div className="mcl-panel">
              <C s={s} />
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default MeditationContentLab
