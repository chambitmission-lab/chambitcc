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
  
  if (type === 'info') {
    // 프로필 관련 - 그라데이션
    bgColor = 'linear-gradient(135deg, #a855f7, #ec4899)'
    textColor = '#ffffff'
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
    padding: 14px 24px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    font-size: 14px;
    font-weight: 400;
    animation: toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 90%;
    text-align: center;
    white-space: nowrap;
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
