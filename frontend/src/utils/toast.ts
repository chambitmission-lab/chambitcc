// 간단한 토스트 알림 유틸리티 (Single Responsibility)
export const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // 기존 토스트 제거
  const existingToast = document.querySelector('.toast-notification')
  if (existingToast) {
    existingToast.remove()
  }

  // 새 토스트 생성
  const toast = document.createElement('div')
  toast.className = `toast-notification toast-${type}`
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    animation: slideUp 0.3s ease-out;
  `

  // 애니메이션 스타일 추가
  if (!document.querySelector('#toast-animation-style')) {
    const style = document.createElement('style')
    style.id = 'toast-animation-style'
    style.textContent = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(toast)

  // 3초 후 제거
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease-out reverse'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}
