// 인스타그램 스타일 토스트 알림 유틸리티
export const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // 기존 토스트 제거
  const existingToast = document.querySelector('.toast-notification')
  if (existingToast) {
    existingToast.remove()
  }

  // 새 토스트 생성
  const toast = document.createElement('div')
  toast.className = `toast-notification toast-${type}`
  
  // 아이콘 추가
  const icon = type === 'success' ? '✓' : '✕'
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px; font-weight: 600;">${icon}</span>
      <span>${message}</span>
    </div>
  `
  
  // 다크모드 감지
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isDark ? 'rgba(38, 38, 38, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
    color: ${isDark ? '#fafafa' : '#262626'};
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    z-index: 9999;
    font-size: 14px;
    font-weight: 400;
    border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
    animation: toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 90%;
    text-align: center;
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

  // 2.5초 후 제거 (인스타그램처럼 짧게)
  setTimeout(() => {
    toast.style.animation = 'toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    setTimeout(() => toast.remove(), 300)
  }, 2500)
}
