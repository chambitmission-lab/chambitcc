// 편지지 위 장식 — 아침 하늘 · 기념우표와 소인.

/* ── 편지가 도착한 아침 하늘 ──────────────────────────────────
   캡슐함 히어로와 같은 양 마스코트 삽화(배달을 끝내고 뻗은 우체부 양) 위에
   헤더와 편지가 놓인다. 삽화·그라데이션 폴백·스크림은 전부 capsule.css. */
const DawnSky = () => (
  <div className="capsule-sky" aria-hidden>
    <span className="capsule-sky__scrim" />
  </div>
)

/* ── 우표 + 소인 ───────────────────────────────────────────────
   봉인하던 달이 찍힌 기념우표 한 장. 톱니는 mask로 파고(미지원 브라우저는
   그냥 네모 우표로 남는다), 소인은 우표 모서리를 물고 물결선을 흘린다. */
const LetterStamp = ({ sealedAt }: { sealedAt: string }) => {
  const d = new Date(sealedAt)
  const ym = Number.isNaN(d.getTime())
    ? ''
    : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
  return (
    <span className="capsule-stamp" aria-hidden>
      <span className="capsule-stamp__perf">
        <span className="capsule-stamp__scene">
          <i className="capsule-stamp__sun" />
          <i className="capsule-stamp__cross" />
          <i className="capsule-stamp__ridge" />
        </span>
      </span>
      <span className="capsule-stamp__mark">
        <em>TIME CAPSULE</em>
        <b>{ym}</b>
      </span>
      <svg className="capsule-stamp__waves" viewBox="0 0 54 20" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
        <path d="M2 4.5c5-3 9 3 14 0s9 3 14 0 9 3 14 0" />
        <path d="M2 10c5-3 9 3 14 0s9 3 14 0 9 3 14 0" />
        <path d="M2 15.5c5-3 9 3 14 0s9 3 14 0 9 3 14 0" />
      </svg>
    </span>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { DawnSky, LetterStamp }
