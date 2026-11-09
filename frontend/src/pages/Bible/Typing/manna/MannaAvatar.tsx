export const Avatar = ({ name, url, className = '' }: { name: string; url: string | null; className?: string }) =>
  url ? (
    <img className={`mn-ava ${className}`} src={url} alt="" loading="lazy" />
  ) : (
    <span className={`mn-ava ${className}`} aria-hidden>
      {name.trim().charAt(0) || '?'}
    </span>
  )
