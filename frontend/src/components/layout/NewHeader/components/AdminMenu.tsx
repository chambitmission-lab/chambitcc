import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

const ADMIN_MENU_ITEMS = [
  { path: '/admin/notifications', key: 'notificationManagement' },
  { path: '/admin/daily-verse', key: 'dailyVerseManagement' },
  { path: '/admin/bulletins', key: 'bulletinManagement' },
  { path: '/admin/events', key: 'eventManagement' },
  { path: '/admin/push', label: '📢 푸시 알림 관리' }
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
          {item.label || t(item.key!)}
        </Link>
      ))}
      <div className="border-t border-border-light dark:border-border-dark my-2"></div>
    </>
  )
}

export default AdminMenu
