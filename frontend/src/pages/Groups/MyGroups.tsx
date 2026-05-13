// 내 그룹 리스트 페이지 — /groups
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useMyGroups } from '../../hooks/useGroups'
import { CreateGroupModal, JoinGroupModal } from '../../components/prayer/GroupModals'
import { isAuthenticated } from '../../utils/auth'

const MyGroups = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const { data, isLoading } = useMyGroups()
  const groups = data?.data.items ?? []

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  if (!loggedIn) {
    return (
      <div className="bg-gray-50 dark:bg-black min-h-screen pt-20 pb-20">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen px-4 py-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">{t('loginRequired')}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full"
          >
            {t('login')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen pt-20 pb-20">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            👥 {t('myGroups')}
          </h1>
        </div>

        {/* 만들기 / 가입 액션 */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow"
          >
            ＋ {t('createGroup')}
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="flex-1 px-3 py-2 bg-surface-light dark:bg-surface-dark text-gray-800 dark:text-gray-200 text-sm font-bold rounded-full border border-border-light dark:border-border-dark"
          >
            🎟️ {t('joinGroup')}
          </button>
        </div>

        {/* 그룹 리스트 */}
        <div className="px-4 pb-8 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">{t('loading')}</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              {t('noGroupsYet')}
            </div>
          ) : (
            groups.map((g) => (
              <Link
                key={g.id}
                to={`/groups/${g.id}`}
                className="block p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl shrink-0" aria-hidden="true">
                    {g.icon || '👥'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-gray-900 dark:text-white truncate">
                        {g.name}
                      </div>
                      {g.is_admin && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    {g.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {g.description}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      👤 {g.member_count}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <CreateGroupModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <JoinGroupModal isOpen={showJoin} onClose={() => setShowJoin(false)} />
    </div>
  )
}

export default MyGroups
