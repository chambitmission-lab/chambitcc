// 관리자 예배 시간 수정 — 하단 시트(모바일) / 가운데 모달(sm+).
// 예전엔 카드 자리에서 인라인으로 펼쳤지만, 주일 예배가 시간 타일 격자로 바뀌어
// 그 자리에 폼을 펼치면 격자가 깨진다. 필드 구성은 예전 인라인 폼과 같다.
import { createPortal } from 'react-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { WorshipService } from '../../../types/worship'

interface Props {
  data: WorshipService
  onChange: (field: keyof WorshipService, value: string | number) => void
  onCancel: () => void
  onSave: () => void
}

export default function WorshipEditSheet({ data, onChange, onCancel, onSave }: Props) {
  const { t } = useLanguage()
  useModalBackButton(onCancel)
  const sunday = data.service_type === 'sunday'

  const field = (key: keyof WorshipService, placeholder: string, extra = '') => (
    <input
      type="text"
      value={(data[key] as string | undefined) ?? ''}
      onChange={(e) => onChange(key, e.target.value)}
      className={`worship-input${extra}`}
      placeholder={placeholder}
    />
  )

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 sheet-backdrop sm:p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('edit')}
        className="worship-sheet pc-scale-sheet sheet-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="worship-sheet-title">{data.name}</p>
        <div className="worship-edit">
          {sunday ? (
            <div className="worship-edit-row">
              <input
                type="number"
                value={data.order}
                onChange={(e) => onChange('order', parseInt(e.target.value))}
                className="worship-input worship-input--order"
                min="1"
                max="10"
              />
              {field('name', '예배 이름', ' worship-input--name')}
            </div>
          ) : (
            field('name', '예배 이름', ' worship-input--name')
          )}
          {field('name_en', '예배 이름 (영어)')}
          {field('subtitle', sunday ? '부제목 (선택)' : '요일 (예: 매주 월~금)')}
          {field('subtitle_en', sunday ? '부제목 (영어)' : '요일 (영어, 예: Mon-Fri)')}
          {field('time', '시간')}
          {field('time_en', '시간 (영어)')}
          {field('location', sunday ? '장소 (선택)' : '추가 시간 정보 (선택)')}
          {field('location_en', sunday ? '장소 (영어)' : '추가 시간 정보 (영어)')}
          <div className="worship-edit-actions">
            <button type="button" onClick={onCancel} className="worship-btn worship-btn--cancel">
              {t('cancel')}
            </button>
            <button type="button" onClick={onSave} className="worship-btn worship-btn--save">
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
