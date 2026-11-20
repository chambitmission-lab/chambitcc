// 담임목사 소개 — "철을 따라" (2026-11-20 시안 A2)
//
// 별명 '복있는 사람'의 출처인 시편 1편 3절("시냇가에 심은 나무가 철을 따라 열매를 맺으며")로
// 약력을 계절에 엮는다: 봄=뿌리를 내리다(학력) · 여름=가지를 뻗다(경력) · 가을=열매를 맺다(수상),
// 맨 아래 시냇물 띠 = 지금 섬기는 자리(경력의 "현)" 줄).
// 데이터는 church_pastors 그대로 — 관리자가 어떤 형식으로 적어도 parseCredLine 이 전)/현)·꼬리 괄호만 뗀다.
// 계절은 비유라 연도와 맞출 필요가 없다. 페이지 문구(말씀·계절 제목·형광펜 목록)는 about_content 의 ✏️.
import type { ReactNode } from 'react'
import { EditableText } from '../../../components/AboutEditor'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { useLanguage } from '../../../contexts/LanguageContext'
import { pastorText } from '../../../types/pastor'
import type { Pastor } from '../../../types/pastor'
import type { AboutFieldKey } from '../../../types/aboutContent'
import EditablePastorText from './EditablePastorText'
import { parseCredLine } from './credLine'
import type { CredLine } from './credLine'
import type { CredentialField } from './CredentialTimeline'
import { BranchIcon, FruitIcon, SeedlingIcon } from '../icons'
import { ensureFontFamily } from '../../../utils/deferredFonts'

// 말씀 머리는 고운바탕 — 이 섹션이 그려질 때만 받는다
ensureFontFamily('gowunBatang')

const splitLines = (value: string): CredLine[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCredLine)

/** 한 줄에 하나씩 적은 말을, 본문에 그대로 있을 때만 형광펜으로 칠한다 */
const highlight = (text: string, phrases: string[]): ReactNode => {
  const found = phrases.filter((p) => p && text.includes(p))
  if (found.length === 0) return text
  const escaped = found
    .sort((a, b) => b.length - a.length)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'))
  return parts.map((part, i) =>
    found.includes(part) ? (
      <mark key={i} className="gr-hl">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

/** 한 줄 소개 안의 별명(따옴표 포함)만 손글씨로 — 별명이 없거나 문장에 없으면 평문 */
const withNickname = (headline: string, nickname: string): ReactNode => {
  const nick = nickname.trim()
  if (!nick) return headline
  const m = headline.match(
    new RegExp(`(['"‘“]?)${nick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"’”]?)`),
  )
  if (!m || m.index === undefined) return headline
  return (
    <>
      {headline.slice(0, m.index)}
      <span className="gr-nick-pen">"{nick}"</span>
      {headline.slice(m.index + m[0].length)}
    </>
  )
}

const YEAR = /^(\d{4})\s*년?$/

interface SeasonDef {
  key: 'spring' | 'summer' | 'autumn'
  field: CredentialField
  word: [string, string] // [ko, en]
  titleKey: AboutFieldKey
  labelKey: AboutFieldKey
  icon: ReactNode
}

const SEASONS: SeasonDef[] = [
  {
    key: 'spring',
    field: 'education',
    word: ['봄', 'Spring'],
    titleKey: 'greetingSpringTitle',
    labelKey: 'greetingEducationLabel',
    icon: <SeedlingIcon size={30} />,
  },
  {
    key: 'summer',
    field: 'career',
    word: ['여름', 'Summer'],
    titleKey: 'greetingSummerTitle',
    labelKey: 'greetingCareerLabel',
    icon: <BranchIcon size={30} />,
  },
  {
    key: 'autumn',
    field: 'awards',
    word: ['가을', 'Autumn'],
    titleKey: 'greetingAutumnTitle',
    labelKey: 'greetingAwardLabel',
    icon: <FruitIcon size={30} />,
  },
]

interface ProfileSeasonsProps {
  pastor: Pastor
  isAdmin: boolean
}

const ProfileSeasons = ({ pastor, isAdmin }: ProfileSeasonsProps) => {
  const { language } = useLanguage()
  const ko = language === 'ko'
  const { tx } = useAboutContent()

  const headline = pastorText(pastor, 'profile_headline', language)
  const intro = pastorText(pastor, 'profile_intro', language)
  const nickname = pastorText(pastor, 'nickname', language)
  const role = pastorText(pastor, 'role', language)
  const phrases = tx('greetingProfileHighlights')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const verseLines = tx('greetingSeasonVerse').split('\n')

  const career = splitLines(pastorText(pastor, 'career', language))
  // 시냇물 띠 = 지금 섬기는 자리. "현)" 줄이 없으면 직분으로 대신한다
  const nowLines = career.filter((c) => c.current).map((c) => c.text)
  const brookLines = nowLines.length > 0 ? nowLines : role ? [role] : []

  const seasons = SEASONS.map((s) => {
    const all = splitLines(pastorText(pastor, s.field, language))
    const items = s.field === 'career' ? all.filter((c) => !c.current) : all
    return { ...s, items }
  }).filter((s) => s.items.length > 0 || isAdmin)

  if (!headline.trim() && !intro.trim() && seasons.length === 0 && !isAdmin) return null

  return (
    <section id="greeting-profile" className="gr-profile">
      <h2 className="gr-section-title">
        <EditableText fieldKey="greetingProfileTitle" isAdmin={isAdmin}>
          {tx('greetingProfileTitle')}
        </EditableText>
      </h2>
      <span className="gr-rule" aria-hidden="true" />

      {/* 말씀 머리 — 가운데 줄("철을 따라 열매를 맺으며")을 초록으로 */}
      <blockquote className="gr-psalm">
        <EditableText fieldKey="greetingSeasonVerse" multiline isAdmin={isAdmin}>
          <p className="gr-psalm-text">
            {verseLines.map((line, i) => (
              <span
                key={i}
                className={
                  verseLines.length === 3 && i === 1 ? 'gr-psalm-line gr-psalm-line--em' : 'gr-psalm-line'
                }
              >
                {line}
              </span>
            ))}
          </p>
        </EditableText>
        <cite className="gr-psalm-ref">
          <EditableText fieldKey="greetingSeasonVerseRef" isAdmin={isAdmin}>
            {tx('greetingSeasonVerseRef')}
          </EditableText>
        </cite>
      </blockquote>

      {(headline || isAdmin) && (
        <p className="gr-profile-headline">
          <EditablePastorText pastor={pastor} field="profile_headline" isAdmin={isAdmin}>
            {headline
              ? withNickname(headline, nickname)
              : ko
                ? '한 줄 소개를 등록해주세요'
                : 'Add a one-line headline'}
          </EditablePastorText>
        </p>
      )}

      {(intro || isAdmin) && (
        <EditablePastorText pastor={pastor} field="profile_intro" multiline rows={8} isAdmin={isAdmin}>
          <p className="gr-profile-intro" style={{ whiteSpace: 'pre-line' }}>
            {intro ? highlight(intro, phrases) : ko ? '소개 글을 등록해주세요.' : 'Add an introduction.'}
          </p>
        </EditablePastorText>
      )}

      {isAdmin && (
        <p className="gr-admin-keys gr-admin-keys--profile">
          <EditableText fieldKey="greetingProfileHighlights" multiline isAdmin={isAdmin}>
            {ko
              ? `소개 글에서 형광펜으로 칠할 말 ${phrases.length}개 · 한 줄에 하나씩 고치기`
              : `${phrases.length} highlighted phrase(s) in the intro · one per line`}
          </EditableText>
        </p>
      )}

      {seasons.length > 0 && (
        <div className="gr-seasons">
          {seasons.map((s) => (
            <div key={s.key} className={`gr-season gr-season--${s.key}`}>
              <div className="gr-season-head">
                <span className="gr-season-icon" aria-hidden="true">
                  {s.icon}
                </span>
                <div className="gr-season-head-text">
                  <span className="gr-season-title">
                    <span className="gr-season-word">{ko ? s.word[0] : s.word[1]}</span>
                    <EditableText fieldKey={s.titleKey} isAdmin={isAdmin}>
                      {tx(s.titleKey)}
                    </EditableText>
                  </span>
                  <span className="gr-season-label">
                    <EditableText fieldKey={s.labelKey} isAdmin={isAdmin}>
                      {tx(s.labelKey)}
                    </EditableText>
                  </span>
                </div>
              </div>
              <EditablePastorText pastor={pastor} field={s.field} multiline rows={7} isAdmin={isAdmin}>
                {s.items.length > 0 ? (
                  <ul className="gr-season-list">
                    {s.items.map((item, i) => {
                      const year = item.tag?.match(YEAR)?.[1]
                      return (
                        <li key={i} className="gr-season-item">
                          {year && <span className="gr-season-year">{year}</span>}
                          {item.text}
                          {item.tag && !year && <small className="gr-season-tag">{item.tag}</small>}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="gr-credential-empty">{ko ? '아직 등록되지 않았습니다' : 'Not added yet'}</p>
                )}
              </EditablePastorText>
            </div>
          ))}
        </div>
      )}

      {brookLines.length > 0 && (
        <div className="gr-brook">
          <span className="gr-brook-lead">
            <EditableText fieldKey="greetingBrookLead" isAdmin={isAdmin}>
              {tx('greetingBrookLead')}
            </EditableText>
          </span>
          <div className="gr-brook-text">
            {brookLines.map((line) => (
              <strong key={line} className="gr-brook-title">
                {line}
              </strong>
            ))}
            <span className="gr-brook-sub">
              <EditableText fieldKey="greetingBrookSub" isAdmin={isAdmin}>
                {tx('greetingBrookSub')}
              </EditableText>
            </span>
          </div>
          <svg
            className="gr-brook-water"
            viewBox="0 0 800 26"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 14 C80 4 160 24 240 14 S400 4 480 14 640 24 800 12 V26 H0Z" />
          </svg>
        </div>
      )}
    </section>
  )
}

export default ProfileSeasons
