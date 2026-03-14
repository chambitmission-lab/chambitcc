// 정원 꾸미기 모달

import { useState, useEffect } from 'react'
import { getGardenTheme, saveGardenTheme, uploadGardenImage, type PresetName } from '../../api/garden'
import './GardenCustomizeModal.css'

interface GardenCustomizeModalProps {
  onClose: () => void
  onSave?: () => void
}

type ThemePreset = 'classic' | 'fantasy' | 'space' | 'watercolor' | 'custom'

const THEME_PRESETS = [
  {
    id: 'classic' as ThemePreset,
    name: '클래식',
    description: '기본 달과 태양',
    moonEmoji: '🌕',
    sunEmoji: '☀️',
  },
  {
    id: 'fantasy' as ThemePreset,
    name: '판타지',
    description: '환상적인 분위기',
    moonEmoji: '🌙',
    sunEmoji: '🌟',
  },
  {
    id: 'space' as ThemePreset,
    name: '우주',
    description: '신비로운 우주',
    moonEmoji: '🪐',
    sunEmoji: '⭐',
  },
  {
    id: 'watercolor' as ThemePreset,
    name: '수채화',
    description: '부드러운 느낌',
    moonEmoji: '🎨',
    sunEmoji: '🖌️',
  },
]

export const GardenCustomizeModal: React.FC<GardenCustomizeModalProps> = ({ onClose, onSave }) => {
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>('classic')
  const [customMoonFile, setCustomMoonFile] = useState<File | null>(null)
  const [customSunFile, setCustomSunFile] = useState<File | null>(null)
  const [moonPreview, setMoonPreview] = useState<string | null>(null)
  const [sunPreview, setSunPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 현재 테마 설정 불러오기
  useEffect(() => {
    const loadTheme = async () => {
      try {
        setIsLoading(true)
        const theme = await getGardenTheme()
        
        if (theme.theme_type === 'preset' && theme.preset_name) {
          setSelectedTheme(theme.preset_name)
        } else if (theme.theme_type === 'custom') {
          setSelectedTheme('custom')
          setMoonPreview(theme.moon_image_url)
          setSunPreview(theme.sun_image_url)
        }
      } catch (err) {
        console.error('테마 불러오기 실패:', err)
        // 에러 시 기본 테마 사용
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [])

  const handleMoonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 크기는 5MB 이하여야 합니다')
        return
      }

      setCustomMoonFile(file)
      setSelectedTheme('custom')
      setError(null)
      
      // 미리보기 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        setMoonPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSunFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 크기는 5MB 이하여야 합니다')
        return
      }

      setCustomSunFile(file)
      setSelectedTheme('custom')
      setError(null)
      
      // 미리보기 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        setSunPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      let moonImageUrl: string | null = null
      let sunImageUrl: string | null = null

      // 커스텀 테마인 경우 이미지 업로드
      if (selectedTheme === 'custom') {
        // 달 이미지 업로드
        if (customMoonFile) {
          console.log('Uploading moon image...')
          moonImageUrl = await uploadGardenImage(customMoonFile, 'moon')
          console.log('Moon image uploaded:', moonImageUrl)
        } else if (moonPreview && moonPreview.startsWith('http')) {
          // 기존 업로드된 이미지 유지
          moonImageUrl = moonPreview
        }

        // 태양 이미지 업로드
        if (customSunFile) {
          console.log('Uploading sun image...')
          sunImageUrl = await uploadGardenImage(customSunFile, 'sun')
          console.log('Sun image uploaded:', sunImageUrl)
        } else if (sunPreview && sunPreview.startsWith('http')) {
          // 기존 업로드된 이미지 유지
          sunImageUrl = sunPreview
        }

        // 커스텀 테마 저장
        console.log('Saving custom theme:', { moonImageUrl, sunImageUrl })
        const savedTheme = await saveGardenTheme({
          theme_type: 'custom',
          preset_name: null,
          moon_image_url: moonImageUrl,
          sun_image_url: sunImageUrl,
        })
        console.log('Theme saved:', savedTheme)
      } else {
        // 프리셋 테마 저장
        console.log('Saving preset theme:', selectedTheme)
        const savedTheme = await saveGardenTheme({
          theme_type: 'preset',
          preset_name: selectedTheme as PresetName,
          moon_image_url: null,
          sun_image_url: null,
        })
        console.log('Theme saved:', savedTheme)
      }

      // 저장 성공 후 콜백 호출
      console.log('Calling onSave callback')
      onSave?.()
      onClose()
    } catch (err) {
      console.error('테마 저장 실패:', err)
      setError(err instanceof Error ? err.message : '테마 저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="garden-customize-modal-overlay" onClick={onClose}>
      <div className="garden-customize-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="material-icons-round">palette</span>
            정원 꾸미기
          </h2>
          <button className="modal-close-button" onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>

        {/* 내용 */}
        <div className="modal-content">
          {/* 로딩 상태 */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner">로딩 중...</div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div style={{ 
              padding: '1rem', 
              marginBottom: '1rem', 
              background: '#fee', 
              color: '#c33', 
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {!isLoading && (
            <>
              {/* 테마 프리셋 선택 */}
              <section className="customize-section">
                <h3 className="section-title">테마 선택</h3>
                <div className="theme-presets">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`theme-preset-card ${selectedTheme === preset.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTheme(preset.id)}
                      disabled={isSaving}
                    >
                      <div className="preset-emojis">
                        <span className="preset-emoji">{preset.moonEmoji}</span>
                        <span className="preset-emoji">{preset.sunEmoji}</span>
                      </div>
                      <div className="preset-name">{preset.name}</div>
                      <div className="preset-description">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* 커스텀 이미지 업로드 */}
              <section className="customize-section">
                <h3 className="section-title">커스텀 이미지 (선택)</h3>
                <p className="section-description">
                  원하는 달과 태양 이미지를 직접 업로드할 수 있어요 (최대 5MB)
                </p>

                <div className="custom-upload-grid">
                  {/* 달 이미지 업로드 */}
                  <div className="upload-card">
                    <div className="upload-preview">
                      {moonPreview ? (
                        <img src={moonPreview} alt="달 미리보기" className="preview-image" />
                      ) : (
                        <div className="preview-placeholder">
                          <span className="material-icons-round">nightlight</span>
                          <span>달 이미지</span>
                        </div>
                      )}
                    </div>
                    <label className="upload-button">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMoonFileChange}
                        style={{ display: 'none' }}
                        disabled={isSaving}
                      />
                      <span className="material-icons-round">upload</span>
                      달 이미지 선택
                    </label>
                  </div>

                  {/* 태양 이미지 업로드 */}
                  <div className="upload-card">
                    <div className="upload-preview">
                      {sunPreview ? (
                        <img src={sunPreview} alt="태양 미리보기" className="preview-image" />
                      ) : (
                        <div className="preview-placeholder">
                          <span className="material-icons-round">wb_sunny</span>
                          <span>태양 이미지</span>
                        </div>
                      )}
                    </div>
                    <label className="upload-button">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSunFileChange}
                        style={{ display: 'none' }}
                        disabled={isSaving}
                      />
                      <span className="material-icons-round">upload</span>
                      태양 이미지 선택
                    </label>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="modal-footer">
          <button 
            className="modal-button cancel-button" 
            onClick={onClose}
            disabled={isSaving}
          >
            취소
          </button>
          <button 
            className="modal-button save-button" 
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            <span className="material-icons-round">
              {isSaving ? 'hourglass_empty' : 'check'}
            </span>
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
