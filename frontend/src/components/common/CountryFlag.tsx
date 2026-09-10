import { useEffect, useState } from 'react'
import './LangFlag.css'

/* flag-icons 전체 CSS(250여 개국이 data-URI 로 인라인되어 600KB+)는 로드하지 않는다.
   LangFlag 는 지원 언어 8개를 정적으로 import 하지만, 파송 선교사의 사역지는 나라가
   열려 있어 코드를 미리 알 수 없다 — 경로 표(flagLoaders)는 국기를 실제로 그릴 때만
   동적 import 하고, 그 안에서 해당 국기 한 장만 받아온다. */

// 같은 국기를 여러 카드가 쓰므로 해석된 URL 을 모듈에 캐시한다
const resolved = new Map<string, string | null>()

interface CountryFlagProps {
  /** ISO 3166-1 alpha-2 (대소문자 무관) — 'kh', 'US' */
  code?: string | null
  className?: string
  title?: string
}

/**
 * 국가 국기 SVG.
 * OS 이모지 폰트에 없는 나라가 있어(베트남 등) 이모지 대신 SVG 로 통일한다.
 * 코드가 없거나 알 수 없는 나라면 아무것도 그리지 않는다 — 지어내지 않는다.
 */
const CountryFlag = ({ code, className = '', title }: CountryFlagProps) => {
  const normalized = (code ?? '').trim().toLowerCase()
  const [src, setSrc] = useState<string | null>(() => resolved.get(normalized) ?? null)

  useEffect(() => {
    if (!normalized || normalized.length !== 2) {
      setSrc(null)
      return
    }
    if (resolved.has(normalized)) {
      setSrc(resolved.get(normalized) ?? null)
      return
    }
    let alive = true
    void import('./flagLoaders')
      .then((m) => m.flagUrl(normalized))
      .then((url) => {
        resolved.set(normalized, url)
        if (alive) setSrc(url)
      })
      .catch(() => {
        if (alive) setSrc(null)
      })
    return () => {
      alive = false
    }
  }, [normalized])

  if (!src) return null
  return (
    <span
      className={`fi ${className}`.trim()}
      style={{ backgroundImage: `url("${src}")` }}
      title={title}
      aria-hidden="true"
    />
  )
}

export default CountryFlag
