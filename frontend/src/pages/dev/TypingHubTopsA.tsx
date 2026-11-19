import { useState, type KeyboardEvent, type ReactNode } from 'react'
import Lamp from '../Bible/Typing/home/Lamp'

/**
 * /#/dev/typing-hub — A(말씀이 먼저) 계열 2차 시안 4종.
 *   A1 원고지 다듬기 · A2 몰입 무대 · A3 장 흐름 · A4 등불 빛
 * 표본: 시편 46편, 오늘 16절(목표 5), 3일 연속, 수요일 쉼표.
 */

type Size = 'pc' | 'm'

const CH = {
  book: '시편',
  chapter: 46,
  unit: '편',
  total: 11,
  done: 1, // 1절까지 썼다
  verses: [
    '하나님은 우리의 피난처시요 힘이시니 환난 중에 만날 큰 도움이시라',
    '그러므로 땅이 변하든지 산이 흔들려 바다 가운데에 빠지든지',
    '바닷물이 솟아나고 뛰놀든지 그것이 넘침으로 산이 흔들릴지라도 (셀라)',
  ],
}
const TODAY = 16
const GOAL = 5
const STREAK = 3
type DayState = 'full' | 'done' | 'rest' | 'miss' | 'future'
const WEEK: { d: string; s: DayState; n: number; today?: boolean }[] = [
  { d: '월', s: 'miss', n: 0 },
  { d: '화', s: 'full', n: 6 },
  { d: '수', s: 'rest', n: 0 },
  { d: '목', s: 'full', n: 16, today: true },
  { d: '금', s: 'future', n: 0 },
  { d: '토', s: 'future', n: 0 },
  { d: '일', s: 'future', n: 0 },
]

/* ── 공용: 치는 흉내 + 설정 팝오버 + 모드 탭 ── */

const useFakeTyping = (size: Size, len: number) => {
  const [typed, setTyped] = useState(0)
  const onKeyDown = (e: KeyboardEvent) => {
    if (size !== 'pc') return
    if (e.key === 'Escape') return setTyped(0)
    if (e.key === 'Backspace') return setTyped((t) => Math.max(0, t - 1))
    if (e.key.length === 1 || e.key === 'Process') {
      e.preventDefault()
      setTyped((t) => Math.min(len, t + 1))
    }
  }
  return { typed, onKeyDown }
}

const Verse = ({ text, typed, caret, className = '' }: { text: string; typed: number; caret: boolean; className?: string }) => (
  <p className={`ta-verse ${className}`}>
    {[...text].map((ch, i) => (
      <span key={i} className={i < typed ? 'is-ink' : ''}>
        {caret && i === typed && <i className="ta-caret" />}
        {ch}
      </span>
    ))}
  </p>
)

const ModeTabs = ({ small }: { small?: boolean }) => {
  const [mode, setMode] = useState<'copy' | 'memo'>('copy')
  return (
    <div className={`ta-seg${small ? ' is-small' : ''}`}>
      <button type="button" className={mode === 'copy' ? 'is-on' : ''} onClick={() => setMode('copy')}>
        따라 쓰기
      </button>
      <button type="button" className={mode === 'memo' ? 'is-on' : ''} onClick={() => setMode('memo')}>
        암송 쓰기
      </button>
    </div>
  )
}

const Settings = ({ align = 'right' }: { align?: 'right' | 'left' }) => {
  const [open, setOpen] = useState(false)
  const [punct, setPunct] = useState(true)
  const [goal, setGoal] = useState(GOAL)
  return (
    <span className="ta-set">
      <button type="button" className="ta-icon" aria-label="쓰기 설정" onClick={() => setOpen(!open)}>
        <span className="material-icons-round">tune</span>
      </button>
      {open && (
        <div className={`ta-pop is-${align}`}>
          <label className="ta-pop__row">
            <span>
              <b>문장부호 건너뛰기</b>
              <small>쉼표·마침표는 안 쳐도 돼요</small>
            </span>
            <button type="button" className={`ta-switch${punct ? ' is-on' : ''}`} onClick={() => setPunct(!punct)}>
              <i />
            </button>
          </label>
          <div className="ta-pop__row is-col">
            <span>
              <b>하루 목표</b>
              <small>등잔에 기름이 차는 기준</small>
            </span>
            <div className="ta-seg ta-seg--goal">
              {[1, 3, 5, 10].map((g) => (
                <button key={g} type="button" className={goal === g ? 'is-on' : ''} onClick={() => setGoal(g)}>
                  {g}절
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </span>
  )
}

const Keys = ({ children }: { children: ReactNode }) => <span className="ta-keys">{children}</span>
const Kbd = ({ children }: { children: ReactNode }) => <kbd className="ta-kbd">{children}</kbd>

const PcHint = () => (
  <Keys>
    <Kbd>아무 키</Kbd>나 누르면 시작 <Kbd>Tab</Kbd> 다음 절 <Kbd>Esc</Kbd> 처음부터
  </Keys>
)

const MobileGo = ({ label = '이 절부터 쓰기' }: { label?: string }) => (
  <button type="button" className="ta-cta">
    <span className="material-icons-round">edit</span>
    {label}
  </button>
)

/* ───────── A1 원고지 다듬기 ─────────
 * 1차 A의 뼈대 그대로 — 머리를 한 줄로 줄이고(링 작게 왼쪽), 이번 주 7칸을 접지 않고 아주 작게 늘 보여 준다.
 * 무대가 카드 높이의 대부분. */
export const TopA1 = ({ size }: { size: Size }) => {
  const { typed, onKeyDown } = useFakeTyping(size, CH.verses[1].length)
  const pc = size === 'pc'
  return (
    <section className={`ta-card ta1 is-${size}`} tabIndex={pc ? 0 : -1} onKeyDown={onKeyDown}>
      <header className="ta1__head">
        <span className="ta1__lamp">
          <Lamp fill={1} lit full />
        </span>
        <div className="ta1__sum">
          <p>
            오늘 <b>{TODAY}절</b> <span className="ta-ok">목표 {GOAL}절 달성</span>
          </p>
          <ol className="ta1__week" aria-label="이번 주">
            {WEEK.map((w) => (
              <li key={w.d} className={`is-${w.s}${w.today ? ' is-today' : ''}`} title={`${w.d} ${w.n}절`}>
                <i />
                {w.d}
              </li>
            ))}
            <li className="ta1__streak">{STREAK}일째 켜짐</li>
          </ol>
        </div>
        <Settings />
      </header>

      <div className="ta1__paper">
        <div className="ta1__bar">
          <ModeTabs small />
          <span className="ta1__ref">
            이어서 · {CH.book} {CH.chapter}
            {CH.unit} <b>2절</b>
          </span>
        </div>
        <Verse text={CH.verses[1]} typed={typed} caret={pc} className="ta1__verse" />
        <p className="ta1__next">
          <b>3</b> {CH.verses[2]}
        </p>
      </div>

      <footer className="ta-foot">{pc ? <PcHint /> : <MobileGo />}</footer>
    </section>
  )
}

/* ───────── A2 몰입 무대 ─────────
 * Monkeytype 그대로 — 숫자·버튼은 위아래 가는 줄 하나씩으로만. 가운데는 말씀뿐.
 * 아래에 장 안 진행선(11절 중 몇 절). */
export const TopA2 = ({ size }: { size: Size }) => {
  const { typed, onKeyDown } = useFakeTyping(size, CH.verses[1].length)
  const pc = size === 'pc'
  const chProg = ((CH.done + typed / CH.verses[1].length) / CH.total) * 100
  return (
    <section className={`ta-card ta2 is-${size}`} tabIndex={pc ? 0 : -1} onKeyDown={onKeyDown}>
      <header className="ta2__top">
        <span className="ta2__ref">
          {CH.book} {CH.chapter}:2
        </span>
        <ModeTabs small />
        <span className="ta2__stat">
          <span className="ta-flame" /> {STREAK}일
          <span className="ta2__sep" />
          오늘 <b>{TODAY}</b>/{GOAL}
        </span>
        <Settings />
      </header>

      <div className="ta2__stage">
        <Verse text={CH.verses[1]} typed={typed} caret={pc} className="ta2__verse" />
      </div>

      <div className="ta2__track" aria-label="이 편 진행">
        <i style={{ width: `${chProg}%` }} />
      </div>
      <footer className="ta2__foot">
        <span>
          {CH.book} {CH.chapter}
          {CH.unit} · {CH.done + (typed >= CH.verses[1].length ? 1 : 0)}/{CH.total}절
        </span>
        {pc ? <PcHint /> : null}
      </footer>
      {!pc && <MobileGo label="쓰기 시작" />}
    </section>
  )
}

/* ───────── A3 장 흐름 ─────────
 * 지금 절만이 아니라 '이 편 안의 나'를 보여 준다 — 왼쪽 절 번호 줄(쓴 절 ✓), 무대엔 쓴 앞 절(먹)·지금 절·다음 절.
 * 성경을 '이어서 쓰는' 느낌. */
export const TopA3 = ({ size }: { size: Size }) => {
  const { typed, onKeyDown } = useFakeTyping(size, CH.verses[1].length)
  const pc = size === 'pc'
  return (
    <section className={`ta-card ta3 is-${size}`} tabIndex={pc ? 0 : -1} onKeyDown={onKeyDown}>
      <header className="ta3__head">
        <div>
          <p className="ta-eyebrow">이어서 쓰기</p>
          <h2>
            {CH.book} {CH.chapter}
            {CH.unit}
          </h2>
        </div>
        <div className="ta3__today">
          <Lamp fill={1} lit full className="ta3__lamp" />
          <span>
            <b>{TODAY}</b>/{GOAL}절
            <small>{STREAK}일째</small>
          </span>
        </div>
      </header>

      <ol className="ta3__nums" aria-label="절">
        {Array.from({ length: CH.total }, (_, i) => i + 1).map((n) => (
          <li key={n} className={n <= CH.done ? 'is-done' : n === 2 ? 'is-now' : ''}>
            {n <= CH.done ? <span className="material-icons-round">check</span> : n}
          </li>
        ))}
      </ol>

      <div className="ta3__flow">
        <div className="ta3__v is-done">
          <span className="ta3__n">1</span>
          <p>{CH.verses[0]}</p>
        </div>
        <div className="ta3__v is-now">
          <span className="ta3__n">2</span>
          <Verse text={CH.verses[1]} typed={typed} caret={pc} className="ta3__verse" />
        </div>
        <div className="ta3__v is-next">
          <span className="ta3__n">3</span>
          <p>{CH.verses[2]}</p>
        </div>
      </div>

      <footer className="ta-foot ta3__foot">
        <ModeTabs small />
        <Settings align="left" />
        {pc ? <PcHint /> : null}
      </footer>
      {!pc && <MobileGo />}
    </section>
  )
}

/* ───────── A4 등불 빛 ─────────
 * 시 119:105 — 등잔에서 번진 빛이 말씀 위로 떨어지고, 친 글자는 그 빛을 받아 따뜻하게 남는다.
 * 이번 주는 작은 등잔 7개(켜짐·꺼짐·쉼). 참빛 고유 재료(등잔)로만, 재질 흉내 없음. */
export const TopA4 = ({ size }: { size: Size }) => {
  const { typed, onKeyDown } = useFakeTyping(size, CH.verses[1].length)
  const pc = size === 'pc'
  return (
    <section className={`ta-card ta4 is-${size}`} tabIndex={pc ? 0 : -1} onKeyDown={onKeyDown}>
      <span className="ta4__light" aria-hidden />
      <header className="ta4__head">
        <Lamp fill={Math.min(1, TODAY / GOAL)} lit full className="ta4__lamp" />
        <div>
          <h2>
            오늘 기름이 가득 찼어요
          </h2>
          <p>
            {TODAY}절 썼어요 · 목표 {GOAL}절 · <b>{STREAK}일째</b> 꺼지지 않은 등불
          </p>
        </div>
        <Settings />
      </header>

      <ol className="ta4__week">
        {WEEK.map((w) => (
          <li key={w.d} className={`is-${w.s}${w.today ? ' is-today' : ''}`}>
            {w.s === 'rest' ? (
              <span className="ta4__rest material-icons-round">bedtime</span>
            ) : (
              <Lamp fill={w.s === 'full' ? 1 : w.s === 'done' ? 0.5 : 0} lit={w.s === 'full' || w.s === 'done'} className="ta4__mini" />
            )}
            <span>{w.d}</span>
          </li>
        ))}
      </ol>

      <div className="ta4__stage">
        <div className="ta4__bar">
          <span className="ta4__ref">
            이어서 · {CH.book} {CH.chapter}
            {CH.unit} 2절
          </span>
          <ModeTabs small />
        </div>
        <Verse text={CH.verses[1]} typed={typed} caret={pc} className="ta4__verse" />
        <p className="ta4__motto">주의 말씀은 내 발에 등이요 내 길에 빛이니이다 · 시 119:105</p>
      </div>

      <footer className="ta-foot">{pc ? <PcHint /> : <MobileGo />}</footer>
    </section>
  )
}
