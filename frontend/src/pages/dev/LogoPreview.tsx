/**
 * /dev/logo — 헤더 워드마크("참빛교회") 시안 비교.
 *
 * 왜 어색한가 (현행 진단):
 *   1) 서체가 혼자 논다 — 헤더/레일은 G마켓 산스(.chrome-type)인데 로고만
 *      `font-display`(Pretendard)라 우측 메뉴와 획이 안 맞는다.
 *   2) 글자 하나가 맨 왼쪽에 덩그러니 — 심볼도 없고 받침점이 없어 "떠 있는 텍스트"로 읽힌다.
 *   3) tracking-tighter(-0.05em) 가 한글 네 글자를 붙여 덩어리로 만든다.
 *
 * 각 시안은 실제 헤더와 같은 골격(h-14 + chrome-type + 우측 메뉴)에 얹어서 본다.
 * 라이트/다크를 나란히 두는 이유: 로고 뒤 brand-glow 는 두 테마에서 전혀 다르게 앉는다.
 */
import { useState } from 'react'

/* ── 빛 심볼 ─────────────────────────────────────────────────────────────
   참빛 = 요 8:12 "나는 세상의 빛이니". 십자가를 직접 그리면 무겁고 낡아 보여서
   빛살(4점 스파클) 한 획으로 줄였다. currentColor 라 어디에 얹어도 따라온다. */
const SparkMark = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 2.2c.5 4.6 2.7 7.1 7.4 7.8-4.7.7-6.9 3.2-7.4 7.8-.5-4.6-2.7-7.1-7.4-7.8 4.7-.7 6.9-3.2 7.4-7.8Z"
      fill="currentColor"
    />
    <circle cx="18.6" cy="17.8" r="2.1" fill="currentColor" opacity="0.55" />
  </svg>
)

/* 등불 심볼 — 스파클보다 교회다운 대안(시 119:105 "내 발에 등이요").
   작은 크기에서 물방울로 읽히지 않게 불꽃 허리를 잘록하게 빼고 받침대를 세웠다. */
const LampMark = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    {/* 불꽃 */}
    <path
      d="M12 2c3.4 3.2 5.1 5.7 5.1 8.2a5.1 5.1 0 0 1-10.2 0C6.9 8.4 8 6.6 10 4.7c.2 1.5.7 2.5 1.5 3.1.3-2.2.5-4 .5-5.8Z"
      fill="currentColor"
    />
    {/* 심지 불빛 — 흰 점으로 속을 비워 실루엣이 불꽃으로 읽히게 */}
    <path d="M12 9.4c1.3 1.6 1.9 2.7 1.9 3.6a1.9 1.9 0 1 1-3.8 0c0-.9.6-2 1.9-3.6Z" fill="#fff" opacity="0.6" />
    {/* 받침 */}
    <path d="M8.4 18.2h7.2M10 21.4h4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
)

/* ── 시안들 ─────────────────────────────────────────────────────────────
   공통 규칙: 클래스에 font-display 를 쓰지 않는다 → 헤더의 G마켓 산스를 상속받아
   우측 메뉴와 같은 서체로 읽힌다(모바일은 지금처럼 Pretendard 로 떨어진다). */

/** 0안 — 현행 그대로 (비교 기준) */
const Current = () => (
  <span className="relative flex items-center gap-2">
    <span className="absolute inset-0 bg-[var(--brand-glow)] blur-md animate-pulse" />
    <h1
      className="relative z-10 select-none whitespace-nowrap font-display text-xl font-extrabold tracking-tighter text-[#333d4b] dark:text-ink-strong"
      style={{ filter: 'drop-shadow(0 0 10px var(--brand-glow)) drop-shadow(0 0 20px var(--brand-glow))' }}
    >
      참빛교회
    </h1>
  </span>
)

/** 1안 — 서체만 맞춘 최소 수정. 크롬 서체 상속 + 자간 복원 + 글로우 절제 */
const A = () => (
  <span className="relative flex items-center">
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-x-4 -inset-y-3"
      style={{ background: 'radial-gradient(ellipse at center, var(--brand-glow) 0%, transparent 68%)' }}
    />
    <h1
      className="relative z-10 select-none whitespace-nowrap text-[1.34rem] font-bold text-[#2b3542] dark:text-ink-strong"
      style={{ letterSpacing: '-0.012em' }}
    >
      참빛교회
    </h1>
  </span>
)

/** 2안 — 두 톤 워드마크. '참빛'은 브랜드 블루, '교회'는 무게를 덜어 뒤로 */
const B = () => (
  <span className="relative flex items-center">
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-x-4 -inset-y-3"
      style={{ background: 'radial-gradient(ellipse at center, var(--brand-glow) 0%, transparent 68%)' }}
    />
    <h1 className="relative z-10 select-none whitespace-nowrap text-[1.34rem]" style={{ letterSpacing: '-0.012em' }}>
      <span className="font-extrabold text-[var(--brand)]">참빛</span>
      <span className="font-semibold text-[#5b6675] dark:text-ink">교회</span>
    </h1>
  </span>
)

/** 3안 — 심볼 + 워드마크. 브랜드 타일에 빛살 한 획을 얹어 로고에 받침점을 준다 */
const C = () => (
  <span className="flex items-center gap-2">
    <span
      className="grid h-8 w-8 place-items-center rounded-[10px] text-white"
      style={{
        background: 'linear-gradient(145deg, var(--brand) 0%, var(--brand-dim) 100%)',
        boxShadow: '0 4px 12px -3px var(--brand-glow)',
      }}
    >
      <SparkMark size={17} />
    </span>
    <h1
      className="select-none whitespace-nowrap text-[1.28rem] font-bold text-[#2b3542] dark:text-ink-strong"
      style={{ letterSpacing: '-0.012em' }}
    >
      참빛교회
    </h1>
  </span>
)

/** 4안 — 등불 심볼 + 워드마크. 타일 없이 선 아이콘만 (가볍고 교회 톤) */
const D = () => (
  <span className="flex items-center gap-1.5">
    <span className="text-[var(--brand)]" style={{ filter: 'drop-shadow(0 0 8px var(--brand-glow))' }}>
      <LampMark size={23} />
    </span>
    <h1
      className="select-none whitespace-nowrap text-[1.3rem] font-bold text-[#2b3542] dark:text-ink-strong"
      style={{ letterSpacing: '-0.012em' }}
    >
      참빛교회
    </h1>
  </span>
)

/** 5안 — 워드마크 + 영문 캡션 2단. 헤더 높이(56px) 안에 딱 들어간다 */
const E = () => (
  <span className="flex flex-col justify-center leading-none">
    <h1
      className="select-none whitespace-nowrap text-[1.16rem] font-extrabold text-[#2b3542] dark:text-ink-strong"
      style={{ letterSpacing: '-0.012em' }}
    >
      참빛교회
    </h1>
    <span
      className="mt-[3px] select-none whitespace-nowrap text-[0.5rem] font-semibold text-[var(--brand)] opacity-80"
      style={{ letterSpacing: '0.18em' }}
    >
      CHAMBIT CHURCH
    </span>
  </span>
)

/** 6안 — 빛 점(dot) 액센트. '빛' 위에 작은 광점 하나만 얹어 이름을 그림으로 만든다 */
const F = () => (
  <span className="relative flex items-center">
    <h1
      className="relative z-10 select-none whitespace-nowrap text-[1.34rem] font-bold text-[#2b3542] dark:text-ink-strong"
      style={{ letterSpacing: '-0.012em' }}
    >
      참빛교회
    </h1>
    {/* '빛' 글자 위 — 폭 기준 약 40% 지점 */}
    <span
      aria-hidden
      className="absolute left-[1.55rem] top-[-2px] h-1.5 w-1.5 rounded-full"
      style={{ background: 'var(--brand)', boxShadow: '0 0 10px 2px var(--brand-glow)' }}
    />
  </span>
)

/** 7안 — 캡슐 배지. 로고 전체를 은은한 tint 면 위에 올려 "앱 이름표"로 */
const G = () => (
  <span
    className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
    style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-soft-strong)' }}
  >
    <span className="text-[var(--brand)]">
      <SparkMark size={15} />
    </span>
    <h1
      className="select-none whitespace-nowrap text-[1.1rem] font-bold text-[#2b3542] dark:text-ink-strong"
      style={{ letterSpacing: '-0.012em' }}
    >
      참빛교회
    </h1>
  </span>
)

/** 8안 — 빛 띠 밑줄. 심볼 없이 글자 아래 브랜드 그라데이션 한 줄로 받침을 만든다 */
const H = () => (
  <span className="relative flex flex-col items-start justify-center">
    <h1
      className="select-none whitespace-nowrap text-[1.3rem] font-extrabold text-[#2b3542] dark:text-ink-strong"
      style={{ letterSpacing: '-0.012em' }}
    >
      참빛교회
    </h1>
    <span
      aria-hidden
      className="mt-[3px] h-[3px] w-full rounded-full"
      style={{
        background: 'linear-gradient(90deg, var(--brand) 0%, var(--brand) 55%, transparent 100%)',
        boxShadow: '0 0 8px var(--brand-glow)',
      }}
    />
  </span>
)

const VARIANTS = [
  { key: 'current', title: '현행', desc: 'Pretendard + tracking-tighter + 이중 글로우', node: <Current /> },
  { key: 'a', title: '1안 · 서체 통일', desc: '크롬 서체(G마켓 산스) 상속 · 자간 복원 · 글로우 한 겹. 가장 안전한 최소 수정', node: <A /> },
  { key: 'b', title: '2안 · 두 톤 워드마크', desc: "'참빛' 브랜드 블루 + '교회' 톤다운. 이름의 뜻이 색으로 읽힌다", node: <B /> },
  { key: 'c', title: '3안 · 심볼 타일 + 워드마크', desc: '브랜드 타일에 빛살 한 획. 앱다운 받침점 · 파비콘/스플래시로도 재사용 가능', node: <C /> },
  { key: 'd', title: '4안 · 등불 심볼', desc: '타일 없이 선 아이콘만. 가볍고 교회 톤', node: <D /> },
  { key: 'e', title: '5안 · 2단 로크업', desc: '한글 + 영문 캡션. 클래식하고 "교회 홈페이지"다운 격식', node: <E /> },
  { key: 'f', title: '6안 · 빛 점 액센트', desc: "'빛' 위 광점 하나. 글자를 건드리지 않고 개성만 얹는다", node: <F /> },
  { key: 'g', title: '7안 · 캡슐 배지', desc: 'tint 면 위 이름표. 가장 앱스럽지만 헤더가 조금 무거워진다', node: <G /> },
  { key: 'h', title: '8안 · 빛 띠 밑줄', desc: '심볼 없이 글자 아래 브랜드 한 줄. 요즘 브랜드 워드마크에서 가장 흔한 문법', node: <H /> },
]

const Chevron = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

/** 실제 헤더 골격 — h-14 · chrome-type · 우측 메뉴까지 같이 둬야 서체 궁합이 보인다 */
function HeaderMock({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    // 다크 토큰은 [data-theme="dark"], Tailwind dark: 변형은 .dark — 둘 다 걸어야 실물과 같아진다
    <div className={dark ? 'dark' : undefined} data-theme={dark ? 'dark' : undefined}>
      <div
        className="chrome-type flex h-14 items-center justify-between overflow-hidden rounded-xl px-4"
        style={{
          background: dark ? '#1c1c1e' : 'linear-gradient(180deg, #f4f7fb 0%, #eef3fa 100%)',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        {children}
        <nav
          className="flex items-center gap-5 text-[0.9rem] font-medium"
          style={{ color: dark ? '#c9ccd1' : '#4e5968' }}
        >
          {/* 화살표는 SVG 로 — "⌄" 글자를 쓰면 G마켓 산스 서브셋 누락 경고가 뜬다 */}
          <span className="flex items-center gap-1">교회<Chevron /></span>
          <span className="flex items-center gap-1">예배·말씀<Chevron /></span>
        </nav>
      </div>
    </div>
  )
}

export default function LogoPreview() {
  const [only, setOnly] = useState<string | null>(null)
  const list = only ? VARIANTS.filter((v) => v.key === only) : VARIANTS

  return (
    <div className="min-h-screen bg-[var(--surface-page)] px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-xl font-bold text-ink-strong">헤더 워드마크 시안</h2>
        <p className="mt-1 text-sm text-ink-muted">
          왼쪽이 로고, 오른쪽은 실제 헤더 메뉴(G마켓 산스). 위=라이트, 아래=다크.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOnly(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${only === null ? 'bg-[var(--brand)] text-white' : 'bg-[var(--brand-soft)] text-[var(--brand)]'}`}
          >
            전체
          </button>
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setOnly(v.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${only === v.key ? 'bg-[var(--brand)] text-white' : 'bg-[var(--brand-soft)] text-[var(--brand)]'}`}
            >
              {v.title}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-7">
          {list.map((v) => (
            <section key={v.key}>
              <div className="mb-2">
                <span className="text-sm font-bold text-ink-strong">{v.title}</span>
                <p className="mt-0.5 text-xs text-ink-muted">{v.desc}</p>
              </div>
              <div className="space-y-2">
                <HeaderMock>{v.node}</HeaderMock>
                <HeaderMock dark>{v.node}</HeaderMock>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
