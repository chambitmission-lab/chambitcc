// 3단계 — 편지. 회색 입력칸 대신 크림 편지지 한 장(개봉 화면과 같은 재질).
// 타자로도(글), 펜·손가락으로도(손글씨) 쓴다 — 전환해도 양쪽 내용은 남고 봉인 때 둘 다 담긴다.
// 막막한 첫 줄은 '생각 열쇠'가 열어 준다: 누르면 문장 첫머리가 편지 끝에 이어진다.
import { useRef } from 'react'
import { Icon, PenGlyph } from '../capsuleIcons'
import InkThumb from '../ink/InkThumb'
import { INK_MAX_PAGES, type InkPage } from '../ink/inkModel'

const SELF_KEYS = ['요즘 붙든 기도는 ', '지금 가장 고마운 사람은 ', '그때쯤 이뤄졌으면 하는 건 ', '요즘 자주 부르는 찬양은 ']
const OTHER_KEYS = ['요즘 너를 보며 ', '고마웠던 순간은 ', '그날의 너에게 바라는 건 ', '함께 기도하고 싶은 건 ']

const TypeGlyph = () => <path d="M4 7h16M4 12h16M4 17h10" />

const StepLetter = ({
  isSelf,
  addressee,
  title,
  onTitleChange,
  message,
  onMessageChange,
  maxLength,
  letterMode,
  onLetterModeChange,
  inkPages,
  writtenInkCount,
  onOpenInk,
}: {
  isSelf: boolean
  addressee: string
  title: string
  onTitleChange: (v: string) => void
  message: string
  onMessageChange: (v: string) => void
  maxLength: number
  letterMode: 'type' | 'pen'
  onLetterModeChange: (m: 'type' | 'pen') => void
  inkPages: InkPage[]
  writtenInkCount: number
  onOpenInk: () => void
}) => {
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const hasInk = writtenInkCount > 0

  const insertKey = (starter: string) => {
    const sep = message && !message.endsWith('\n') ? '\n' : ''
    const next = `${message}${sep}${starter}`.slice(0, maxLength)
    onMessageChange(next)
    // 이어 쓸 자리(끝)에 커서를 둔다
    requestAnimationFrame(() => {
      const el = bodyRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(next.length, next.length)
      el.scrollTop = el.scrollHeight
    })
  }

  return (
    <>
      <h2 className="cw-title">지금의 마음을 적어 주세요</h2>

      <div className="cw-seg mt-4" role="tablist" aria-label="편지 쓰는 방법">
        {(
          [
            { key: 'type' as const, label: '글로 쓰기', icon: <TypeGlyph />, badge: letterMode === 'pen' && message.trim() ? '씀' : '' },
            { key: 'pen' as const, label: '펜으로 쓰기', icon: <PenGlyph />, badge: hasInk ? `${writtenInkCount}장` : '' },
          ]
        ).map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={letterMode === m.key}
            onClick={() => onLetterModeChange(m.key)}
            className={`cw-seg__item ${letterMode === m.key ? 'is-on' : ''}`}
          >
            <Icon size={16}>{m.icon}</Icon>
            {m.label}
            {m.badge && <span className="cw-seg__badge">{m.badge}</span>}
          </button>
        ))}
      </div>

      <div className="cw-paper">
        <p className="cw-paper__to">To. {addressee}에게</p>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={50}
          placeholder="제목을 붙여도 좋아요"
          className="cw-paper__title"
          aria-label="제목 (선택)"
        />

        {letterMode === 'type' ? (
          <>
            <textarea
              ref={bodyRef}
              value={message}
              onChange={(e) => onMessageChange(e.target.value.slice(0, maxLength))}
              placeholder={
                isSelf
                  ? '캡슐을 여는 날의 나에게, 지금의 마음과 기도를 남겨보세요'
                  : '캡슐을 여는 날의 그 사람에게, 전하고 싶은 마음을 남겨보세요'
              }
              className="cw-paper__body"
              aria-label="편지 본문"
            />
            <div className="cw-paper__keys" aria-label="생각 열쇠">
              {(isSelf ? SELF_KEYS : OTHER_KEYS).map((k) => (
                <button key={k} type="button" onClick={() => insertKey(k)} className="cw-key">
                  + {k.trim()}
                </button>
              ))}
            </div>
            <span className="cw-paper__count">{message.length.toLocaleString()}자</span>
          </>
        ) : hasInk ? (
          <div className="cw-paper__ink">
            {/* 쓴 편지지 묶음 — 누르면 이어서 쓴다 */}
            <button type="button" onClick={onOpenInk} className="block w-full text-left" aria-label="손글씨 편지 이어 쓰기">
              <div className="ink-stack">
                {inkPages.map((p, i) => (
                  <span key={i} className="ink-stack__item">
                    <InkThumb page={p} width={112} />
                    <span className="ink-stack__no">{i + 1}</span>
                  </span>
                ))}
              </div>
            </button>
            <div className="cw-paper__ink-foot">
              <p>
                손으로 쓴 편지지 {writtenInkCount}장
                {inkPages.length > writtenInkCount ? ` (빈 장 ${inkPages.length - writtenInkCount})` : ''}
                <br />
                여는 날, 쓴 순서 그대로 다시 써져요
              </p>
              <button type="button" onClick={onOpenInk} className="cw-btn cw-btn--sm">
                이어 쓰기
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={onOpenInk} className="cw-paper__open">
            <span className="cw-paper__open-icon">
              <Icon size={26}>
                <PenGlyph />
              </Icon>
            </span>
            <b>편지지 펼치기</b>
            <span>
              S펜·애플펜슬이나 손가락으로 직접 써요
              <br />
              최대 {INK_MAX_PAGES}장, 내 글씨 그대로 봉인돼요
            </span>
          </button>
        )}
      </div>

      {letterMode === 'pen' && message.trim() && <p className="cw-note">글로 쓴 편지도 함께 담겨요</p>}
      {letterMode === 'type' && hasInk && <p className="cw-note">손으로 쓴 편지지 {writtenInkCount}장도 함께 담겨요</p>}
    </>
  )
}

export default StepLetter
