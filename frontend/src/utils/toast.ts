// 인스타그램 스타일 토스트 알림 유틸리티
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  // 기존 토스트 제거
  const existingToast = document.querySelector('.toast-notification')
  if (existingToast) {
    existingToast.remove()
  }

  // 새 토스트 생성
  const toast = document.createElement('div')
  toast.className = `toast-notification toast-${type}`
  
  // 다크모드 감지
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  
  // 타입별 스타일
  let bgColor = ''
  let textColor = ''
  let border = 'none'
  let shadow = '0 2px 8px rgba(0, 0, 0, 0.1)'

  if (type === 'info') {
    // 안내 메시지 — 새벽 블루 (메인 테마 톤)
    if (isDark) {
      bgColor = 'rgba(24, 37, 63, 0.96)'
      textColor = '#dbe7ff'
      border = '1px solid rgba(125, 170, 247, 0.28)'
      shadow = '0 4px 20px rgba(0, 0, 0, 0.45), 0 0 12px rgba(49, 130, 246, 0.15)'
    } else {
      bgColor = 'rgba(240, 246, 255, 0.98)'
      textColor = '#1e3a6e'
      border = '1px solid rgba(49, 130, 246, 0.22)'
      shadow = '0 4px 16px rgba(30, 58, 110, 0.15)'
    }
  } else {
    // 일반 메시지 - 인스타그램 스타일
    bgColor = isDark ? 'rgba(250, 250, 250, 0.95)' : 'rgba(38, 38, 38, 0.9)'
    textColor = isDark ? '#262626' : '#fafafa'
  }
  
  toast.innerHTML = `<span>${message}</span>`
  
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: ${bgColor};
    color: ${textColor};
    border: ${border};
    padding: 14px 24px;
    border-radius: 12px;
    box-shadow: ${shadow};
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    animation: toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 90%;
    text-align: center;
    word-break: keep-all;
  `

  // 애니메이션 스타일 추가
  if (!document.querySelector('#toast-animation-style')) {
    const style = document.createElement('style')
    style.id = 'toast-animation-style'
    style.textContent = `
      @keyframes toastSlideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
        }
      }
      @keyframes toastSlideUp {
        from {
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px) scale(0.95);
        }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(toast)

  // 2.5초 후 제거
  setTimeout(() => {
    toast.style.animation = 'toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    setTimeout(() => toast.remove(), 300)
  }, 2500)
}
