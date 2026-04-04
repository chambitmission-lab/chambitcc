import { useState, useEffect } from 'react'
import { showPWAInstallPrompt, isPWAInstallable } from '../../utils/pwa'

const PWAInstallButton = () => {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // PWA 설치 가능 이벤트 리스닝
    const handleInstallable = () => {
      setIsInstallable(true)
    }

    const handleInstalled = () => {
      setIsInstallable(false)
    }

    window.addEventListener('pwa-installable', handleInstallable)
    window.addEventListener('pwa-installed', handleInstalled)

    // 초기 상태 확인
    setIsInstallable(isPWAInstallable())

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable)
      window.removeEventListener('pwa-installed', handleInstalled)
    }
  }, [])

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const accepted = await showPWAInstallPrompt()
      if (accepted) {
        console.log('✅ 사용자가 설치를 수락했습니다')
      } else {
        console.log('❌ 사용자가 설치를 거부했습니다')
      }
    } catch (error) {
      console.error('설치 중 오류:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  // 설치 불가능하면 버튼 숨김
  if (!isInstallable) {
    return null
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      <span className="material-icons-outlined text-xl">
        {isInstalling ? 'hourglass_empty' : 'get_app'}
      </span>
      <span className="text-sm">
        {isInstalling ? '설치 중...' : '앱 설치하기'}
      </span>
    </button>
  )
}

export default PWAInstallButton
