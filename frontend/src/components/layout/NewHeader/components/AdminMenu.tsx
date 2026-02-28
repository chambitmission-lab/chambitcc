import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

const ADMIN_MENU_ITEMS = [
  { path: '/admin/notifications', key: 'notificationManagement' as const },
  { path: '/admin/daily-verse', key: 'dailyVerseManagement' as const },
  { path: '/admin/bulletins', key: 'bulletinManagement' as const },
  { path: '/admin/events', key: 'eventManagement' as const },
  { path: '/admin/push', key: 'pushNotificationManagement' as const },
  { path: '/admin/users', key: 'userManagement' as const },
  { path: '/admin/groups', key: 'groupManagement' as const }
]

const AdminMenu = () => {
  const { t } = useLanguage()

  return (
    <>
      {ADMIN_MENU_ITEMS.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className="block px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 font-semibold hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
        >
          {t(item.key)}
        </Link>
      ))}
      <div className="border-t border-border-light dark:border-border-dark my-2"></div>
    </>
  )
}

export default AdminMenu
