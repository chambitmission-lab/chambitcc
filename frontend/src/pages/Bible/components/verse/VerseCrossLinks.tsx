import { formatRef, type CrossLink } from '../../data/crossRefs'

const KIND_PREFIX: Record<CrossLink['kind'], string> = {
  quotes: '구약 인용',
  quotedBy: '신약에서 인용',
  parallel: '다른 복음서',
}

interface VerseCrossLinksProps {
  links: CrossLink[]
  /** 이어읽기 문단 안이면 인라인 아이콘 하나로 줄인다 (문단을 칩으로 끊지 않게) */
  inline?: boolean
  onOpen: (link: CrossLink) => void
}

/**
 * 절 아래 연결 구절 칩 — "구약 인용 · 이사야 7:14", "다른 복음서 · 마가복음 4:35-41".
 * 이어읽기에선 절 끝에 작은 고리 아이콘만 두고, 누르면 첫 연결을 연다(나머지는 절별 보기에서).
 */
const VerseCrossLinks = ({ links, inline, onOpen }: VerseCrossLinksProps) => {
  if (!links.length) return null

  if (inline) {
    return (
      <button
        type="button"
        className="verse-crosslink-inline"
        onClick={(e) => {
          e.stopPropagation()
          onOpen(links[0])
        }}
        title={`${KIND_PREFIX[links[0].kind]} · ${formatRef(links[0].target)}`}
        aria-label={`연결 구절 ${formatRef(links[0].target)} 보기`}
      >
        <span className="material-icons-round" aria-hidden>link</span>
      </button>
    )
  }

  return (
    <div className="verse-crosslinks">
      {links.map((link) => (
        <button
          key={`${link.kind}-${formatRef(link.target)}`}
          type="button"
          className={`verse-crosslink verse-crosslink--${link.kind}`}
          onClick={(e) => {
            e.stopPropagation()
            onOpen(link)
          }}
        >
          <span className="verse-crosslink__kind">{KIND_PREFIX[link.kind]}</span>
          <span className="verse-crosslink__ref">{formatRef(link.target)}</span>
        </button>
      ))}
    </div>
  )
}

export default VerseCrossLinks
