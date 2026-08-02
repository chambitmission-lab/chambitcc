// 로그인 성공 "마중 모먼트" — 친한 친구 집에 들어설 때처럼, 앱이 이름을 부르며
// 맞아주는 1.5~2.5초의 문지방 연출. 스펙터클이 아니라 환대가 목적이다.
//
// 불변식 (로그인이 애니메이션에 인질로 잡히면 안 된다):
// - onNavigate는 성공·스킵·에러·모션최소화 어느 경로에서도 정확히 한 번 실행된다.
// - 오버레이는 document.body에 직접 붙인다 — Login이 언마운트돼도 연출이 살아야
//   하므로 React 트리에 두면 안 된다.
// - navigate는 화면이 완전히 덮인 시점(0.6s)에 실행해 라우트 교체 장면과
//   목적지 lazy 청크 로딩을 감춘다.
// - z-index 10000 (토스트 9999 바로 위, 앱 내 최고값).
import { deriveTimeOfDay } from '../hooks/useDailyMeditation'
import { getCurrentSeason, type ChurchSeason } from './churchCalendar'
import '../styles/welcomeTransition.css'

type Lang = 'ko' | 'en'

/* 마중 문구 — 시간대×상황 로테이션. 매번 같으면 3일 만에 배경이 되므로
   풀에서 무작위로 고른다. 특수 상황(오랜만·주일 아침)이 시간대보다 우선. */
const WELCOME_LINES: Record<Lang, Record<string, string[]>> = {
  ko: {
    longAway: ['오랜만이에요, 많이 기다렸어요', '다시 만나서 정말 반가워요'],
    sundayMorning: ['주님을 만나러 가는 아침이에요', '예배로 함께하는 주일이에요'],
    morning: ['오늘도 와주셨네요, 반가워요', '새 아침을 함께 열어요', '좋은 아침이에요, 기다리고 있었어요'],
    afternoon: ['잠시 쉬어가는 이 시간, 반가워요', '오후의 햇살처럼 반가운 걸음이에요', '기다리고 있었어요, 어서 오세요'],
    evening: ['하루 끝에 들러주셨네요', '오늘 하루도 애쓰셨어요', '고요한 저녁, 잘 오셨어요'],
  },
  en: {
    longAway: ["It's been a while — we missed you", 'So glad to see you again'],
    sundayMorning: ['A morning made for worship', "The Lord's day — welcome"],
    morning: ['So glad you came by this morning', "Let's open this new day together", "Good morning — we've been waiting"],
    afternoon: ['A welcome pause in your day', 'So good to see you this afternoon', "Come on in — we've been waiting"],
    evening: ["Welcome, at the day's end", "You've done well today", 'A quiet evening welcome'],
  },
}

const SEASON_LABELS: Record<Lang, Record<ChurchSeason, string>> = {
  ko: { advent: '대림절', christmas: '성탄절기', lent: '사순절', easter: '부활절기', epiphany: '주현절기', ordinary: '연중' },
  en: { advent: 'Advent', christmas: 'Christmastide', lent: 'Lent', easter: 'Eastertide', epiphany: 'Epiphany', ordinary: 'Ordinary Time' },
}

const LONG_AWAY_MS = 1000 * 60 * 60 * 24 * 7
const lastSeenKey = (username: string) => `welcome_last_seen_${username}`

const pickLine = (lang: Lang, now: Date, username: string): string => {
  const pools = WELCOME_LINES[lang]
  const tod = deriveTimeOfDay(now.getHours())

  let pool = pools[tod]
  try {
    const lastSeen = Number(localStorage.getItem(lastSeenKey(username)) || 0)
    if (lastSeen && now.getTime() - lastSeen > LONG_AWAY_MS) {
      pool = pools.longAway
    } else if (now.getDay() === 0 && tod === 'morning') {
      pool = pools.sundayMorning
    }
    localStorage.setItem(lastSeenKey(username), String(now.getTime()))
  } catch {
    /* localStorage 불가 환경 — 시간대 풀 유지 */
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

/* 날짜·절기 한 줄 — 절기는 백엔드가 아니라 churchCalendar 계산값이 진실 */
const buildSubLine = (lang: Lang, now: Date): string => {
  const season = SEASON_LABELS[lang][getCurrentSeason(now)]
  if (lang === 'en') {
    const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now)
    return `${date} · ${season}`
  }
  const day = '일월화수목금토'[now.getDay()]
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${day}요일 · ${season}`
}

export interface WelcomeTransitionOptions {
  /** 화면에 부를 이름 (full_name 우선) */
  name: string
  /** 오랜만 감지용 localStorage 키 분리 */
  username: string
  language: string
  /** 브랜드색이 번져 나오는 원점 — 보통 로그인 CTA 버튼 */
  originEl?: HTMLElement | null
  /** 정확히 한 번 호출 보장 — 여기서 라우트를 교체한다 */
  onNavigate: () => void
}

export const playWelcomeTransition = (opts: WelcomeTransitionOptions): void => {
  let navigated = false
  const go = () => {
    if (navigated) return
    navigated = true
    try {
      opts.onNavigate()
    } catch {
      /* 라우팅 실패는 연출이 책임질 수 없다 — 조용히 무시 */
    }
  }

  try {
    const lang: Lang = opts.language === 'en' ? 'en' : 'ko'
    const now = new Date()
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    const overlay = document.createElement('div')
    overlay.className = 'welcome-overlay'

    /* 원점: CTA 버튼 중심. 반지름은 원점에서 가장 먼 모서리까지 — 확실히 다 덮는다 */
    const rect = opts.originEl?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.7
    const r = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)))
    overlay.style.setProperty('--wx', `${x}px`)
    overlay.style.setProperty('--wy', `${y}px`)
    overlay.style.setProperty('--wr', `${r}px`)

    /* 이름은 사용자 입력값 — innerHTML 금지, textContent로만 */
    const inner = document.createElement('div')
    inner.className = 'welcome-inner'
    const nameEl = document.createElement('p')
    nameEl.className = 'welcome-name'
    nameEl.textContent = lang === 'en' ? `${opts.name},` : `${opts.name}님,`
    const lineEl = document.createElement('p')
    lineEl.className = 'welcome-line'
    lineEl.textContent = pickLine(lang, now, opts.username)
    const subEl = document.createElement('p')
    subEl.className = 'welcome-sub'
    subEl.textContent = buildSubLine(lang, now)
    inner.append(nameEl, lineEl, subEl)
    overlay.appendChild(inner)
    document.body.appendChild(overlay)

    /* rAF는 백그라운드 탭에서 멈추므로 전 구간 setTimeout으로 스케줄한다 */
    const timers: number[] = []
    const schedule = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      go()
      timers.forEach(clearTimeout)
      overlay.classList.add('is-leaving')
      window.setTimeout(() => overlay.remove(), 500)
    }

    /* 탭하면 즉시 스킵 — 연출은 언제나 사용자보다 아래에 있다 */
    overlay.addEventListener('pointerdown', finish)

    navigator.vibrate?.(12) /* Android만 — 문을 두드리는 촉감 한 번 */

    if (reduced) {
      overlay.classList.add('is-open', 'is-reduced')
      schedule(go, 200)
      schedule(finish, 1400)
    } else {
      void overlay.offsetWidth /* clip-path 초기값을 커밋시켜 transition을 보장 */
      overlay.classList.add('is-open')
      schedule(go, 600) /* 번짐 완료(0.55s) 직후 — 라우트 교체가 빛 뒤에 숨는다 */
      schedule(finish, 2400)
    }
  } catch {
    /* 연출이 어떤 이유로 죽어도 로그인은 완주한다 */
    go()
  }
}
