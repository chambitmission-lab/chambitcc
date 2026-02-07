interface PrivacyNoticeProps {
  isAnonymous: boolean
}

const PrivacyNotice = ({ isAnonymous }: PrivacyNoticeProps) => {
  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-3 border border-border-light dark:border-border-dark">
      <div className="flex items-start gap-2">
        <span className="material-icons-outlined text-gray-500 text-lg">
          {isAnonymous ? 'lock' : 'visibility'}
        </span>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {isAnonymous 
              ? '기도 요청은 익명으로 게시됩니다. 표시 이름만 다른 사람에게 보입니다.'
              : '기도 요청이 실명으로 게시됩니다. 다른 사람들이 작성자를 확인할 수 있습니다.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyNotice
