// 역대 담임목사 상세 — 하단 시트
//
// 역대 목사도 인사말·약력을 그대로 보관하므로(church_pastors 는 덮어쓰지 않는다)
// 카드를 누르면 그분이 남긴 글을 그대로 읽을 수 있다.
import { useLanguage } from '../../../contexts/LanguageContext'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { pastorTermLabel, pastorText } from '../../../types/pastor'
import type { Pastor, PastorTextField } from '../../../types/pastor'
import { UsersIcon, XIcon } from '../icons'

interface PastorSheetProps {
  pastor: Pastor
  onClose: () => void
}

const toLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

const PastorSheet = ({ pastor, onClose }: PastorSheetProps) => {
  const { language } = useLanguage()
  const ko = language === 'ko'

  useModalBackButton(onClose)

  const name = pastorText(pastor, 'name', language)
  const role = pastorText(pastor, 'role', language)
  const term = pastorTermLabel(pastor, language)
  const greetingTitle = pastorText(pastor, 'greeting_title', language)
  const greetingBody = pastorText(pastor, 'greeting_body', language)
  const signature = pastorText(pastor, 'signature', language)
  const profileIntro = pastorText(pastor, 'profile_intro', language)

  const credentials: [string, PastorTextField][] = [
    [ko ? '학력' : 'Education', 'education'],
    [ko ? '주요 경력' : 'Ministry', 'career'],
    [ko ? '수상 내역' : 'Awards', 'awards'],
  ]
  const filledCredentials = credentials.filter(
    ([, field]) => pastorText(pastor, field, language).trim().length > 0,
  )

  const hasBody =
    greetingBody.trim().length > 0 ||
    profileIntro.trim().length > 0 ||
    filledCredentials.length > 0

  return (
    <div className="gr-sheet-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="gr-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="gr-sheet-grip" aria-hidden="true" />

        <div className="gr-sheet-head">
          <span className="gr-sheet-photo">
            {pastor.photo_url ? (
              <img src={pastor.photo_url} alt={name} />
            ) : (
              <UsersIcon size={24} />
            )}
          </span>
          <div className="gr-sheet-head-text">
            <p className="gr-sheet-name">{name}</p>
            <p className="gr-sheet-meta">
              {role}
              {term && (
                <>
                  <span className="gr-dot">·</span>
                  {term}
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            className="gr-sheet-close"
            onClick={onClose}
            aria-label={ko ? '닫기' : 'Close'}
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="gr-sheet-body">
          {!hasBody ? (
            <p className="gr-sheet-empty">
              {ko
                ? '남겨진 인사말이나 약력이 없습니다.'
                : 'No greeting or profile was recorded.'}
            </p>
          ) : (
            <>
              {greetingTitle && <h3 className="gr-sheet-title">{greetingTitle}</h3>}
              {greetingBody && (
                <p className="gr-sheet-text" style={{ whiteSpace: 'pre-line' }}>
                  {greetingBody}
                </p>
              )}
              {signature && <p className="gr-sheet-signature">{signature}</p>}

              {profileIntro && (
                <p className="gr-sheet-intro" style={{ whiteSpace: 'pre-line' }}>
                  {profileIntro}
                </p>
              )}

              {filledCredentials.map(([label, field]) => (
                <div className="gr-credential" key={field}>
                  <div className="gr-credential-label">{label}</div>
                  <ul className="gr-credential-list">
                    {toLines(pastorText(pastor, field, language)).map((line, i) => (
                      <li key={i} className="gr-credential-line">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PastorSheet
