// 설교 폼 필드 — 섹션 그룹 + 입력 실시간 피드백 (성구 미리보기·예배 유형·유튜브 썸네일 제안)
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DatePicker from '../../../../components/common/DatePicker'
import { getBibleVerse } from '../../../../api/bible'
import {
  parseBibleReference,
  formatReference,
  deriveWorshipType,
  extractYouTubeVideoId,
  youtubeThumbnailUrl,
} from '../../utils/sermonMeta'
import type { SermonFormData } from './types'

interface SermonFormFieldsProps {
  formData: SermonFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export const SermonFormFields = ({ formData, onChange }: SermonFormFieldsProps) => {
  // DatePicker·썸네일 제안처럼 input 이벤트가 없는 값 변경용
  const setField = (name: string, value: string) => {
    const fakeEvent = {
      target: { name, value },
    } as React.ChangeEvent<HTMLInputElement>
    onChange(fakeEvent)
  }

  // 성구 입력 디바운스 후 파싱 → 첫 절 본문 미리보기 (목록 히어로와 동일한 파서·API)
  const [debouncedVerse, setDebouncedVerse] = useState(formData.bible_verse)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedVerse(formData.bible_verse), 500)
    return () => clearTimeout(timer)
  }, [formData.bible_verse])

  const parsed = useMemo(() => parseBibleReference(debouncedVerse), [debouncedVerse])

  const { data: previewVerse, isError: verseNotFound } = useQuery({
    queryKey: ['sermon-hero-verse', parsed?.book, parsed?.chapter, parsed?.verse ?? 1],
    queryFn: () => getBibleVerse(parsed!.book, parsed!.chapter, parsed!.verse ?? 1),
    enabled: !!parsed,
    staleTime: Infinity,
    retry: 0,
  })

  const worshipType = formData.title.trim() ? deriveWorshipType(formData.title) : null
  const videoId = extractYouTubeVideoId(formData.video_url || '')

  return (
    <>
      {/* 기본 정보 */}
      <div className="sf-section">
        <h3 className="sf-section-title">
          <span className="material-icons-outlined">edit_note</span>
          기본 정보
        </h3>

        <div className="sf-field">
          <label className="sf-label">
            제목<span className="sf-required">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onChange}
            className="sf-input"
            placeholder="예: 주일 3부 예배"
            required
          />
          {worshipType && (
            <span className="sf-derived-type">
              <span className="material-icons-outlined">sell</span>
              목록에서 &lsquo;{worshipType}&rsquo;로 분류됩니다
            </span>
          )}
        </div>

        <div className="sf-field">
          <label className="sf-label">
            설교자<span className="sf-required">*</span>
          </label>
          <input
            type="text"
            name="pastor"
            value={formData.pastor}
            onChange={onChange}
            className="sf-input"
            placeholder="예: 안동철 담임목사님"
            required
          />
        </div>

        <div className="sf-field">
          <label className="sf-label">
            설교 날짜<span className="sf-required">*</span>
          </label>
          <DatePicker
            value={formData.sermon_date}
            onChange={(date) => setField('sermon_date', date)}
            placeholder="날짜를 선택하세요"
          />
        </div>
      </div>

      {/* 본문 말씀 */}
      <div className="sf-section">
        <h3 className="sf-section-title">
          <span className="material-icons-outlined">menu_book</span>
          본문 말씀
        </h3>

        <div className="sf-field">
          <label className="sf-label">
            성경 구절<span className="sf-required">*</span>
          </label>
          <input
            type="text"
            name="bible_verse"
            value={formData.bible_verse}
            onChange={onChange}
            className="sf-input"
            placeholder="예: 요한복음 12장 20~33절"
            required
          />

          {parsed && previewVerse?.text && (
            <div className="sf-verse-preview">
              <div className="sf-verse-preview-ref">
                <span className="material-icons-outlined">check_circle</span>
                {formatReference(parsed)}
              </div>
              <p className="sf-verse-preview-text">{previewVerse.text}</p>
            </div>
          )}

          {parsed && verseNotFound && (
            <div className="sf-verse-preview miss">
              <div className="sf-verse-preview-ref">
                <span className="material-icons-outlined">help_outline</span>
                구절을 찾지 못했어요 — 책 이름·장·절 표기를 확인해 주세요
              </div>
            </div>
          )}

          {!parsed && formData.bible_verse.trim() !== '' && (
            <p className="sf-hint">
              &lsquo;요한복음 12장 20~33절&rsquo; 형식으로 입력하면 목록에 성구 본문 미리보기가
              표시됩니다
            </p>
          )}
        </div>
      </div>

      {/* 설교 내용 */}
      <div className="sf-section">
        <h3 className="sf-section-title">
          <span className="material-icons-outlined">notes</span>
          설교 내용
        </h3>

        <div className="sf-field">
          <textarea
            name="content"
            value={formData.content}
            onChange={onChange}
            rows={6}
            className="sf-textarea"
            placeholder="설교 요약이나 내용을 입력하세요"
            required
          />
          <p className="sf-hint">
            💡 등록 후 트랜스크립트 파일을 업로드하면 내용이 자동으로 생성됩니다
          </p>
        </div>
      </div>

      {/* 영상·썸네일 */}
      <div className="sf-section">
        <h3 className="sf-section-title">
          <span className="material-icons-outlined">smart_display</span>
          영상 · 썸네일
        </h3>

        <div className="sf-field">
          <label className="sf-label">유튜브 영상 URL</label>
          <input
            type="url"
            name="video_url"
            value={formData.video_url || ''}
            onChange={onChange}
            className="sf-input"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {videoId && (
            <span className="sf-url-valid">
              <span className="material-icons-outlined">check_circle</span>
              유효한 유튜브 영상입니다
            </span>
          )}
        </div>

        <div className="sf-field">
          <label className="sf-label">썸네일 이미지 URL</label>
          <input
            type="url"
            name="thumbnail_url"
            value={formData.thumbnail_url || ''}
            onChange={onChange}
            className="sf-input"
            placeholder="https://example.com/image.jpg"
          />

          {videoId && !formData.thumbnail_url && (
            <button
              type="button"
              className="sf-thumb-suggest"
              onClick={() => setField('thumbnail_url', youtubeThumbnailUrl(videoId))}
            >
              <span className="material-icons-outlined">auto_awesome</span>
              유튜브 영상 썸네일 자동 사용
            </button>
          )}

          {formData.thumbnail_url && (
            <div className="sf-thumb-preview">
              <img
                src={formData.thumbnail_url}
                alt="썸네일 미리보기"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).parentElement!.style.display = 'none'
                }}
                onLoad={(e) => {
                  ;(e.target as HTMLImageElement).parentElement!.style.display = ''
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
