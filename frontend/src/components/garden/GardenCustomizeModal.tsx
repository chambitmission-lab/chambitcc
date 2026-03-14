// 정원 꾸미기 모달

import { useState } from 'react'
import './GardenCustomizeModal.css'

interface GardenCustomizeModalProps {
  onClose: () => void
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

export const GardenCustomizeModal: React.FC<GardenCustomizeModalProps> = ({ onClose }) => {
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>('classic')
  const [customMoonFile, setCustomMoonFile] = useState<File | null>(null)
  const [customSunFile, setCustomSunFile] = useState<File | null>(null)
  const [moonPreview, setMoonPreview] = useState<string | null>(null)
  const [sunPreview, setSunPreview] = useState<string | null>(null)

  const handleMoonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCustomMoonFile(file)
      setSelectedTheme('custom')
      
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
      setCustomSunFile(file)
      setSelectedTheme('custom')
      
      // 미리보기 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        setSunPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    // TODO: 백엔드 API 호출
    console.log('Selected theme:', selectedTheme)
    console.log('Custom moon:', customMoonFile)
    console.log('Custom sun:', customSunFile)
    
    // 임시: 로컬 스토리지에 저장
    if (selectedTheme !== 'custom') {
      localStorage.setItem('gardenTheme', selectedTheme)
    }
    
    onClose()
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
          {/* 테마 프리셋 선택 */}
          <section className="customize-section">
            <h3 className="section-title">테마 선택</h3>
            <div className="theme-presets">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`theme-preset-card ${selectedTheme === preset.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTheme(preset.id)}
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
              원하는 달과 태양 이미지를 직접 업로드할 수 있어요
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
                  />
                  <span className="material-icons-round">upload</span>
                  태양 이미지 선택
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* 푸터 */}
        <div className="modal-footer">
          <button className="modal-button cancel-button" onClick={onClose}>
            취소
          </button>
          <button className="modal-button save-button" onClick={handleSave}>
            <span className="material-icons-round">check</span>
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
