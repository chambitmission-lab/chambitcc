import { useState } from 'react'

interface ThanksAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: number
  /** brand: 카드 위(밝은 서피스) / onBrand: 브랜드 블루 배너 위 */
  tone?: 'brand' | 'onBrand'
  className?: string
}

/**
 * 감사 작성자 아바타 — 프로필 사진이 있으면 사진, 없으면 이름 첫 글자.
 * 사진 로드가 실패하면 조용히 이니셜로 되돌아간다.
 */
const ThanksAvatar = ({
  name,
  avatarUrl,
  size = 22,
  tone = 'brand',
  className = '',
}: ThanksAvatarProps) => {
  const [broken, setBroken] = useState(false)
  const initial = (name || '?').trim().charAt(0)
  const showPhoto = !!avatarUrl && !broken

  const box = { width: size, height: size } as const
  const ring =
    tone === 'onBrand'
      ? '0 0 0 1px rgba(255,255,255,0.35)'
      : '0 0 0 1px var(--card-border)'

  if (showPhoto) {
    return (
      <img
        src={avatarUrl!}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ ...box, boxShadow: ring, filter: 'var(--media-dim)' }}
      />
    )
  }

  return (
    <span
      className={`shrink-0 rounded-full flex items-center justify-center font-bold ${className}`}
      style={{
        ...box,
        fontSize: Math.max(10, Math.round(size * 0.46)),
        background:
          tone === 'onBrand' ? 'rgba(255,255,255,0.22)' : 'var(--brand-soft-strong)',
        color: tone === 'onBrand' ? '#fff' : 'var(--brand)',
        boxShadow: ring,
      }}
      aria-hidden
    >
      {initial}
    </span>
  )
}

export default ThanksAvatar
