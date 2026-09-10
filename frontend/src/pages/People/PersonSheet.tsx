// 인물 상세 — 하단 시트
//
// 카드 그리드는 얼굴과 이름만 보여주고, 담당 사역·소개·연락처는 여기서 편다.
// 목록 페이지를 떠나지 않으므로 여러 사람을 연달아 확인하기 쉽다.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarBlank,
  ChatCircleText,
  EnvelopeSimple,
  MapPin,
  PencilSimple,
  Phone,
  Quotes,
  X,
} from '../../components/icons/phosphor'
import CountryFlag from '../../components/common/CountryFlag'
import { useLanguage } from '../../contexts/LanguageContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { can } from '../../utils/access'
import {
  CATEGORY_DATE_LABEL,
  assignmentList,
  personDateLabel,
  personInitial,
  personText,
} from '../../types/people'
import type { Person } from '../../types/people'

interface PersonSheetProps {
  person: Person
  onClose: () => void
}

/** 전화 걸기/문자에 쓸 수 있게 숫자와 +만 남긴다 */
const dialable = (phone: string) => phone.replace(/[^\d+]/g, '')

const PersonSheet = ({ person, onClose }: PersonSheetProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'
  const isAdminUser = can('content:manage')

  useModalBackButton(onClose)

  // 데스크톱에서 Esc — 모바일 뒤로가기는 useModalBackButton 이 맡는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const name = personText(person, 'name', language)
  const role = personText(person, 'role', language)
  const group = personText(person, 'group', language)
  const field = personText(person, 'field', language)
  const org = personText(person, 'org', language)
  const bio = personText(person, 'bio', language)
  const verse = personText(person, 'verse', language)
  const assignments = assignmentList(person, language)
  const since = personDateLabel(person.started_on)
  const phone = (person.phone ?? '').trim()
  const email = (person.email ?? '').trim()

  return (
    <div className="ppl-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="ppl-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={name}
      >
        <div className="ppl-sheet-handle" aria-hidden />
        <button type="button" className="ppl-sheet-close" onClick={onClose} aria-label={ko ? '닫기' : 'Close'}>
          <X size={16} weight="bold" />
        </button>

        {/* 머리 — 사진 + 이름/직분 + 메타 칩 */}
        <div className="ppl-sheet-head">
          <div className="ppl-sheet-photo">
            {person.photo_url ? (
              <img src={person.photo_url} alt={name} />
            ) : (
              <span className="ppl-card-initial">{personInitial(name)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="ppl-sheet-name">{name}</p>
            {role && <p className="ppl-sheet-role">{role}</p>}

            <div className="ppl-sheet-meta">
              {group && <span className="ppl-meta-chip">{group}</span>}
              {field && (
                <span className="ppl-meta-chip">
                  {person.country_code ? (
                    <CountryFlag code={person.country_code} />
                  ) : (
                    <MapPin size={12} weight="duotone" />
                  )}
                  {field}
                </span>
              )}
              {org && <span className="ppl-meta-chip">{org}</span>}
              {since && (
                <span className="ppl-meta-chip">
                  <CalendarBlank size={12} weight="duotone" />
                  {CATEGORY_DATE_LABEL[person.category][ko ? 'ko' : 'en']} {since}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 담당 사역 */}
        {assignments.length > 0 && (
          <div className="ppl-sheet-section">
            <p className="ppl-sheet-label">{ko ? '담당 사역' : 'Serving'}</p>
            <div className="ppl-chips">
              {assignments.map((item) => (
                <span key={item} className="ppl-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 소개 */}
        {bio && (
          <div className="ppl-sheet-section">
            <p className="ppl-sheet-label">{ko ? '소개' : 'About'}</p>
            <p className="ppl-sheet-body">{bio}</p>
          </div>
        )}

        {/* 삶의 말씀 */}
        {verse && (
          <div className="ppl-sheet-section">
            <p className="ppl-sheet-label">{ko ? '삶의 말씀' : 'Life verse'}</p>
            <div className="ppl-verse">
              <Quotes size={16} weight="duotone" className="ppl-verse-mark" />
              {verse}
            </div>
          </div>
        )}

        {/* 연락처 — 교회 대표·내선 성격이라 공개한다 */}
        {(phone || email) && (
          <div className="ppl-sheet-section">
            <p className="ppl-sheet-label">{ko ? '연락처' : 'Contact'}</p>
            <div className="ppl-contact">
              {phone && (
                <a className="ppl-contact-btn" href={`tel:${dialable(phone)}`}>
                  <Phone size={18} weight="duotone" />
                  {ko ? '전화' : 'Call'}
                </a>
              )}
              {phone && (
                <a className="ppl-contact-btn" href={`sms:${dialable(phone)}`}>
                  <ChatCircleText size={18} weight="duotone" />
                  {ko ? '문자' : 'Text'}
                </a>
              )}
              {email && (
                <a className="ppl-contact-btn" href={`mailto:${email}`}>
                  <EnvelopeSimple size={18} weight="duotone" />
                  {ko ? '메일' : 'Email'}
                </a>
              )}
            </div>
            <p className="ppl-contact-value">
              {phone}
              {phone && email && <span className="mx-1.5 opacity-40">·</span>}
              {email}
            </p>
          </div>
        )}

        <div className="ppl-sheet-foot">
          {isAdminUser && (
            <button
              type="button"
              onClick={() => navigate('/admin/people')}
              className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand text-[12.5px] font-bold"
            >
              <PencilSimple size={14} weight="bold" />
              {ko ? '인물 정보 수정' : 'Edit'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PersonSheet
