import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { PRAYER_WEEK_WINDOW, THANKS_HERO, type ThemePair } from '../../utils/themeAssets'
import './confirmDialogPreview.css'

/**
 * /#/dev/confirm-dialog — 삭제·확인 모달(ConfirmDialogHost · 기도 DeleteConfirmModal) 개편 시안.
 *   ?v=now 지금 · a 그림이 먼저 말을 건다 · b 지울 글을 한 번 더 · c 묻지 않고 되돌리기 · d 한 문장
 * 세 장면(감사 삭제 · 기도 삭제 · 관리자 일반 확인)을 PC·모바일 폭으로 나란히 본다. 표본 문구만 쓴다.
 */

type Tone = 'danger' | 'warning'

interface Scene {
  key: string
  label: string
  tone: Tone
  /** 지금 화면 문구 */
  nowTitle: string
  nowMsg: string
  nowDesc?: string
  nowIcon: string
  nowGo: string
  /** 시안 문구 */
  title: string
  sub: string
  keep: string
  go: string
  /** B — 지울 글 */
  quote?: string
  meta?: string
  noteClass: string
  art: ThemePair
  artClass: string
}

const HILL: ThemePair = { light: '/images/rail/bottom-mailbox-light.webp', dark: '/images/rail/bottom-mailbox-dark.webp' }

// 본당 십자가 사진 — 로컬 브라우저에 같은 주소의 옛 그림(창가)이 캐시돼 있을 수 있어 시안에서만 주소를 비튼다
const CHAPEL: ThemePair = { light: `${PRAYER_WEEK_WINDOW.light}?cdp`, dark: `${PRAYER_WEEK_WINDOW.dark}?cdp` }

const SCENES: Scene[] = [
  {
    key: 'thanks',
    label: '감사 삭제',
    tone: 'danger',
    nowTitle: '감사 삭제',
    nowMsg: '이 감사를 삭제할까요?',
    nowDesc: '삭제된 내용은 복구할 수 없습니다.',
    nowIcon: 'delete_outline',
    nowGo: '삭제',
    title: '이 감사를 지울까요?',
    sub: '지운 글은 다시 꺼내 볼 수 없어요.',
    keep: '그대로 둘게요',
    go: '지울게요',
    quote: '퇴근길에 딸이 마중 나와 줘서 감사합니다.',
    meta: '11월 16일 주일 · 감사 한 줄',
    noteClass: '',
    art: THANKS_HERO,
    artClass: 'is-thanks',
  },
  {
    key: 'prayer',
    label: '기도 삭제',
    tone: 'danger',
    nowTitle: '기도 요청 삭제',
    nowMsg: '이 기도 요청을 삭제하시겠습니까?',
    nowDesc: '삭제된 내용은 복구할 수 없습니다.',
    nowIcon: 'warning',
    nowGo: '삭제',
    title: '이 기도를 지울까요?',
    sub: '함께 기도한 12명의 마음도 같이 지워져요.',
    keep: '그대로 둘게요',
    go: '지울게요',
    quote: '어머니 수술이 잘 끝나고 속히 회복되게 해 주세요.',
    meta: '11월 12일 · 12명이 함께 기도했어요',
    noteClass: 'is-prayer',
    art: CHAPEL,
    artClass: 'is-prayer',
  },
  {
    key: 'admin',
    label: '일반 확인 (관리자)',
    tone: 'warning',
    nowTitle: '확인',
    nowMsg: '김은혜 님의 승인을 취소할까요?',
    nowIcon: 'error_outline',
    nowGo: '확인',
    title: '김은혜 님의 승인을 취소할까요?',
    sub: '다시 승인하기 전까지 로그인할 수 없어요.',
    keep: '아니요',
    go: '승인 취소',
    quote: '김은혜 · 3교구 · 11월 9일 가입',
    noteClass: 'is-plain',
    art: HILL,
    artClass: 'is-hill',
  },
]

/* ───────────── 무대 ───────────── */

const Stage = ({ mobile, sheet, children }: { mobile?: boolean; sheet?: boolean; children: ReactNode }) => (
  <div className={`cdp-stage ${mobile ? 'is-mobile' : 'is-pc'}`}>
    <div className="cdp-ghost" aria-hidden>
      <i /><i /><i /><i /><i /><i />
    </div>
    <div className={`cdp-dim ${sheet ? 'is-sheet' : ''}`}>{children}</div>
  </div>
)

interface DialogProps {
  s: Scene
  mobile?: boolean
}

/* ───────────── 지금 ───────────── */

const Now = ({ s }: DialogProps) => {
  const red = s.tone === 'danger'
  return (
    <div className="bg-background-light dark:bg-background-dark rounded-3xl p-6 max-w-sm w-full border border-border-light dark:border-border-dark shadow-[0_30px_80px_-20px_rgba(239,68,68,0.25)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <div className={`absolute inset-0 rounded-full blur-md animate-pulse ${red ? 'bg-red-400/30' : 'bg-amber-400/30'}`} />
          <div
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative z-10 bg-gradient-to-b ${
              red ? 'from-red-400/60 via-red-500/40 to-red-600/25 border-red-500/70' : 'from-amber-400/60 via-amber-500/40 to-amber-600/25 border-amber-500/70'
            }`}
          >
            <span className="material-icons-outlined text-white text-xl">{s.nowIcon}</span>
          </div>
        </div>
        <h3 className="text-[18px] font-bold text-ink-strong tracking-[-0.015em]">{s.nowTitle}</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-[1.7] mb-6">
        {s.nowMsg}
        {s.nowDesc && (
          <>
            <br />
            {s.nowDesc}
          </>
        )}
      </p>
      <div className="flex gap-3">
        <button className="flex-1 py-3 px-4 bg-surface-light dark:bg-white/[0.05] text-ink-strong rounded-2xl font-semibold text-sm">취소</button>
        <button
          className={`flex-1 py-3 px-4 rounded-2xl font-semibold text-sm text-white bg-gradient-to-tr shadow-lg ${
            red ? 'from-red-500 to-rose-500 shadow-red-500/30' : 'from-amber-500 to-orange-500 shadow-amber-500/30'
          }`}
        >
          {s.nowGo}
        </button>
      </div>
    </div>
  )
}

/* ───────────── A. 그림이 먼저 말을 건다 ───────────── */

const VariantA = ({ s }: DialogProps) => {
  const { theme } = useTheme()
  return (
    <div className="cdp-panel">
      <div className={`cdp-art ${s.artClass}`} style={{ backgroundImage: `url(${theme === 'dark' ? s.art.dark : s.art.light})` }} />
      <div className="cdp-a-body">
        <h3 className="cdp-title">{s.title}</h3>
        <p className="cdp-sub">{s.sub}</p>
        <div className="mt-5 flex gap-2.5">
          <button className="cdp-btn is-keep">{s.keep}</button>
          <button className={`cdp-btn is-go ${s.tone === 'warning' ? 'is-warning' : ''}`}>{s.go}</button>
        </div>
      </div>
    </div>
  )
}

/* ───────────── B. 지울 글을 한 번 더 ───────────── */

const VariantB = ({ s, mobile }: DialogProps) => (
  <div className={`cdp-panel ${mobile ? 'is-sheet' : ''}`}>
    {mobile && <div className="cdp-grab" />}
    <div className="px-6 pt-6 pb-5">
      <h3 className="cdp-title">{s.title}</h3>
      {s.quote && (
        <div className={`cdp-note ${s.noteClass}`}>
          {s.noteClass === 'is-plain' ? (
            <p className="text-[15px] font-semibold" style={{ color: 'var(--text-strong)' }}>{s.quote}</p>
          ) : (
            <p className="cdp-note-text cdp-pen">{s.quote}</p>
          )}
          {s.meta && <p className="cdp-note-meta">{s.meta}</p>}
        </div>
      )}
      <p className="cdp-sub mt-3">{s.sub}</p>
      <div className={`mt-5 flex gap-2.5 ${mobile ? 'flex-col-reverse' : ''}`}>
        <button className="cdp-btn is-keep">{s.keep}</button>
        <button className={`cdp-btn is-go ${s.tone === 'warning' ? 'is-warning' : ''}`}>{s.go}</button>
      </div>
    </div>
  </div>
)

/* ───────────── C. 묻지 않고 되돌리기 ───────────── */

const C_ITEMS = [
  { id: 1, text: '퇴근길에 딸이 마중 나와 줘서 감사합니다.', when: '11월 16일 주일' },
  { id: 2, text: '구역 식구들과 따뜻한 저녁을 나눠서 감사합니다.', when: '11월 14일 금요일' },
  { id: 3, text: '새벽예배에 늦지 않게 깨워 주셔서 감사합니다.', when: '11월 11일 화요일' },
]

const VariantC = ({ mobile }: { mobile?: boolean }) => {
  const { theme } = useTheme()
  const [gone, setGone] = useState<number[]>([])
  const [last, setLast] = useState<number | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const remove = (id: number) => {
    window.clearTimeout(timer.current)
    setGone((g) => [...g, id])
    setLast(id)
    timer.current = window.setTimeout(() => setLast(null), 6000)
  }
  const undo = () => {
    window.clearTimeout(timer.current)
    setGone((g) => g.filter((x) => x !== last))
    setLast(null)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const rest = C_ITEMS.filter((x) => !gone.includes(x.id))
  return (
    <div className={`cdp-stage ${mobile ? 'is-mobile' : 'is-pc'}`}>
      <div className="cdp-list">
        {rest.map((x) => (
          <div key={x.id} className="cdp-item">
            <p>
              {x.text}
              <small>{x.when}</small>
            </p>
            <button className="cdp-trash" aria-label="지우기" onClick={() => remove(x.id)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
              </svg>
            </button>
          </div>
        ))}
        {rest.length === 0 && (
          <button className="text-[13px] underline" style={{ color: 'var(--text-muted)' }} onClick={() => setGone([])}>
            (시안) 처음부터 다시
          </button>
        )}
      </div>
      {last != null && (
        <div className="cdp-toast" key={last} role="status">
          <div className="cdp-toast-art" style={{ backgroundImage: `url(${theme === 'dark' ? THANKS_HERO.dark : THANKS_HERO.light})` }} />
          <div>
            <b>감사를 지웠어요</b>
            <span>잠깐은 되돌릴 수 있어요</span>
          </div>
          <button className="cdp-undo" onClick={undo}>되돌리기</button>
          <i className="cdp-toast-bar" />
        </div>
      )}
    </div>
  )
}

/* ───────────── D. 한 문장 ───────────── */

type Copy = Pick<Scene, 'title' | 'sub' | 'keep' | 'go'>

/** D 말투 — &tone=plain 담백 · warm 다정한 농담 · fun 장난스럽게. 지우는 버튼 글자는 어느 말투든 뜻이 분명해야 한다 */
const D_TONES = [
  { key: 'plain', label: '담백 (처음 시안)' },
  { key: 'warm', label: '다정한 농담' },
  { key: 'fun', label: '장난스럽게' },
] as const

const D_COPY: Record<string, Record<string, Copy>> = {
  warm: {
    thanks: {
      title: '이 감사, 정말 보내 줄까요?',
      sub: '한번 떠나면 돌아오는 길을 몰라요.',
      keep: '아니요, 둘래요',
      go: '보내 줄게요',
    },
    prayer: {
      title: '이 기도, 여기서 내려놓을까요?',
      sub: '하나님은 이미 들으셨어요. 여기 적힌 글과 12명의 "함께 기도"만 지워져요.',
      keep: '더 둘게요',
      go: '내려놓을게요',
    },
    admin: {
      title: '김은혜 님, 잠깐 문 앞에서 기다리시게 할까요?',
      sub: '다시 승인하기 전까지 로그인할 수 없어요.',
      keep: '아니요',
      go: '승인 취소',
    },
  },
  fun: {
    thanks: {
      title: '앗, 이 감사 지우려고요?',
      sub: '지우개는 있는데, 되돌리기는 아직 없어요.',
      keep: '앗, 실수예요',
      go: '네, 지울게요',
    },
    prayer: {
      title: '잠깐만요, 이 기도 지워요?',
      sub: '12명이 같이 손 모은 기도예요. 지우면 다시 못 불러와요.',
      keep: '아직 둘게요',
      go: '네, 지울게요',
    },
    admin: {
      title: '김은혜 님 승인, 없던 일로 할까요?',
      sub: '다시 승인하기 전까지 로그인할 수 없어요.',
      keep: '아니요',
      go: '승인 취소',
    },
  },
}

const VariantD = ({ s, mobile, copyTone }: DialogProps & { copyTone?: string }) => {
  const c: Copy = D_COPY[copyTone ?? '']?.[s.key] ?? s
  return (
    <div className={`cdp-panel ${mobile ? 'is-sheet' : ''}`}>
      {mobile && <div className="cdp-grab" />}
      <div className="px-6 pt-7 pb-5">
        <h3 className="cdp-d-title">{c.title}</h3>
        <p className="cdp-sub">{c.sub}</p>
        <div className="mt-6 flex gap-2.5">
          <button className="cdp-btn is-keep">{c.keep}</button>
          <button className={`cdp-btn is-go-soft ${s.tone === 'warning' ? 'is-warning' : ''}`}>{c.go}</button>
        </div>
      </div>
    </div>
  )
}

/* ───────────── 페이지 ───────────── */

const VARIANTS = [
  { key: 'now', label: '지금', note: '붉은 경고 아이콘 + "삭제된 내용은 복구할 수 없습니다" — 시스템 경고창 말투.' },
  {
    key: 'a',
    label: 'A 그림이 먼저 말을 건다',
    note: '경고 아이콘 자리에 그 화면의 참빛 그림(감사 항아리의 양 · 예배당 십자가 빛 · 언덕 위 예배당). 말투는 해요체, 지우기 버튼은 번쩍임 없는 한 색. 듀오링고·당근처럼 캐릭터가 묻는 방식.',
  },
  {
    key: 'b',
    label: 'B 지울 글을 한 번 더',
    note: '무엇을 지우는지 그 글을 손글씨로 다시 보여 준다(기도는 골드, 감사는 블루 띠). 모바일은 아래에서 올라오는 시트 + 세로 버튼. Apple 메모·토스 방식 — 잘못 누른 글을 지우는 실수를 막는다.',
  },
  {
    key: 'c',
    label: 'C 묻지 않고 되돌리기',
    note: '모달 없이 바로 지우고 아래 띠에서 6초간 "되돌리기". Gmail·구글 포토 방식 — 휴지통 단추를 직접 눌러 보세요. 내 글(감사·기도·댓글)에만 쓰고, 관리자·되돌릴 수 없는 일은 A/B/D 모달을 그대로 쓴다.',
  },
  {
    key: 'd',
    label: 'D 한 문장',
    note: '아이콘·그림 없이 큰 질문 한 문장 + 옅은 붉은 버튼. 토스 방식 — 가장 조용하고 128곳 어디에나 그대로 맞는다.',
  },
] as const

const Dialog = ({ v, s, mobile, copyTone }: DialogProps & { v: string; copyTone?: string }) => {
  if (v === 'a') return <VariantA s={s} />
  if (v === 'b') return <VariantB s={s} mobile={mobile} />
  if (v === 'd') return <VariantD s={s} mobile={mobile} copyTone={copyTone} />
  return <Now s={s} />
}

export default function ConfirmDialogPreview() {
  const [params, setParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const meta = VARIANTS.find((x) => x.key === params.get('v')) ?? VARIANTS[1]
  const sheet = meta.key === 'b' || meta.key === 'd'
  const copyTone = D_TONES.find((x) => x.key === params.get('tone'))?.key ?? 'warm'

  useEffect(() => {
    void ensureFontFamily('nanumPen')
  }, [])

  const pill = (on: boolean) =>
    `text-[13px] px-3.5 py-1.5 rounded-full border ${
      on ? 'bg-[var(--brand)] text-white border-transparent font-bold' : 'text-gray-600 dark:text-white/70 border-gray-200 dark:border-white/[0.1]'
    }`

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <div className="mx-auto max-w-[1040px] px-5 pt-6">
        <h1 className="text-[18px] font-bold text-ink-strong">삭제·확인 모달 — 개편 시안</h1>
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
        <p className="mt-2 text-[13px] leading-[1.6] text-gray-500 dark:text-white/55 break-keep">{meta.note}</p>
        {meta.key === 'd' && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] text-gray-400">말투</span>
            {D_TONES.map((x) => (
              <button key={x.key} onClick={() => setParams({ v: 'd', tone: x.key }, { replace: true })} className={pill(x.key === copyTone)}>
                {x.label}
              </button>
            ))}
          </div>
        )}

        {meta.key === 'c' ? (
          <div className="mt-6 flex flex-wrap items-start gap-5">
            <figure>
              <figcaption className="mb-2 text-[12px] text-gray-400">PC</figcaption>
              <VariantC />
            </figure>
            <figure>
              <figcaption className="mb-2 text-[12px] text-gray-400">모바일 (375)</figcaption>
              <VariantC mobile />
            </figure>
          </div>
        ) : (
          SCENES.map((s) => (
            <section key={s.key} className="mt-7">
              <h2 className="mb-2 text-[13px] font-bold text-gray-500 dark:text-white/60">{s.label}</h2>
              <div className="flex flex-wrap items-start gap-5">
                <Stage>
                  <Dialog v={meta.key} s={s} copyTone={copyTone} />
                </Stage>
                <Stage mobile sheet={sheet}>
                  <Dialog v={meta.key} s={s} mobile copyTone={copyTone} />
                </Stage>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
