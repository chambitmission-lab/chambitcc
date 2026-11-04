// 디지털 주보 알림 — 푸시 권한·로그인·내 설정·챙길 일 예약을 한 곳에서.
// 화면은 "켜고 싶다"만 말하고, 로그인 안내·푸시 권한 요청·서버 저장 순서는 여기서 맞춘다.
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import {
  DEFAULT_NOTIFY,
  useBulletinNotify,
  useBulletinReminders,
  useReplaceBulletinReminders,
  useUpdateBulletinNotify,
} from '../../../../hooks/useDigitalBulletin'
import { usePushNotification } from '../../../../hooks/usePushNotification'
import type { BulletinNotifySettings, BulletinReminder } from '../../../../types/digitalBulletin'
import { isAuthenticated } from '../../../../utils/auth'
import { isIOS, isStandalonePWA } from '../../../../utils/pwa'
import { showToast } from '../../../../utils/toast'

export const useBulletinAlarms = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const push = usePushNotification()
  const notifyQ = useBulletinNotify(loggedIn)
  const remindersQ = useBulletinReminders(loggedIn)
  const updateNotify = useUpdateBulletinNotify()
  const replaceReminders = useReplaceBulletinReminders()

  const settings: BulletinNotifySettings = notifyQ.data ?? DEFAULT_NOTIFY
  const reminders: BulletinReminder[] = useMemo(() => remindersQ.data ?? [], [remindersQ.data])

  /** 알림을 켜기 전 관문 — 로그인 · 푸시 구독. 통과하면 true */
  const ensureReady = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated()) {
      showToast(t('bwNeedLogin'), 'info')
      navigate('/login')
      return false
    }
    if (push.isSubscribed) return true
    if (isIOS() && !isStandalonePWA()) {
      showToast(t('bwIosHomeScreen'), 'info')
      return false
    }
    const res = await push.subscribeDetailed()
    if (res.ok) return true
    const msg =
      res.reason === 'denied'
        ? t('bwPushDenied')
        : res.reason === 'dismissed'
          ? t('pushPromptDismissed')
          : res.reason === 'unsupported'
            ? t('pushUnsupported')
            : res.reason === 'insecure'
              ? t('pushInsecure')
              : t('pushErrorGeneric')
    showToast(msg, res.reason === 'dismissed' ? 'info' : 'error')
    return false
  }, [navigate, push, t])

  /** 설정 바꾸기 — 켜는 쪽이면 먼저 관문을 통과해야 한다 */
  const setSettings = useCallback(
    async (patch: Partial<BulletinNotifySettings>, turningOn: boolean): Promise<boolean> => {
      if (turningOn && !(await ensureReady())) return false
      if (!turningOn && !isAuthenticated()) return false
      try {
        await updateNotify.mutateAsync(patch)
        return true
      } catch (e) {
        showToast(e instanceof Error ? e.message : t('bwSaveFailed'), 'error')
        return false
      }
    },
    [ensureReady, t, updateNotify],
  )

  /**
   * 이 주보(keyPrefix)의 챙길 일 알림을 items 로 바꾼다. 다른 주보 것은 그대로 둔다.
   * 서버는 '아직 안 보낸 내 알림 전체'를 통째로 바꾸므로 나머지를 함께 보낸다.
   */
  const setReminders = useCallback(
    async (keyPrefix: string, items: BulletinReminder[]): Promise<boolean> => {
      if (items.length && !(await ensureReady())) return false
      const others = reminders.filter(r => !r.item_key.startsWith(keyPrefix))
      try {
        await replaceReminders.mutateAsync([...others, ...items].slice(0, 30))
        // 챙길 일 스위치를 꺼 둔 채 새로 골랐다면 같이 켠다
        if (items.length && !settings.item_reminders) await updateNotify.mutateAsync({ item_reminders: true })
        return true
      } catch (e) {
        showToast(e instanceof Error ? e.message : t('bwSaveFailed'), 'error')
        return false
      }
    },
    [ensureReady, reminders, replaceReminders, settings.item_reminders, t, updateNotify],
  )

  return {
    loggedIn,
    ready: !loggedIn || (!notifyQ.isLoading && !push.isChecking),
    pushOn: push.isSubscribed,
    settings,
    reminders,
    busy: push.isLoading || updateNotify.isPending || replaceReminders.isPending,
    setSettings,
    setReminders,
  }
}

export type BulletinAlarms = ReturnType<typeof useBulletinAlarms>
