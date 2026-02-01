// 로딩 스피너 컴포넌트
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
}

const LoadingSpinner = ({ size = 'medium', message }: LoadingSpinnerProps) => {
  const sizeMap = {
    small: '24px',
    medium: '40px',
    large: '60px',
  }

  return (
    <div className="loading-container">
      <div 
        className="loading-spinner" 
        style={{ 
          width: sizeMap[size], 
          height: sizeMap[size] 
        }}
      />
      {message && <p className="loading-message">{message}</p>}
    </div>
  )
}

export default LoadingSpinner
