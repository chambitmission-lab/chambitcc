// 문화교실 관리 (admin, /admin/culture)
// Single Responsibility: 강좌·신청·공지 데이터 조회와 저장/삭제/상태 전환 액션.
// 화면은 CultureDesk(관리 데스크 — 강좌·신청자·공지 목록 + 상세, 2026-11-27),
// 작성·수정은 기존 ClassFormPanel / NoticeFormPanel 이 그린다.
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import {
  getAllCultureClasses,
  createCultureClass,
  updateCultureClass,
  deleteCultureClass,
  getCultureApplications,
  updateCultureApplicationStatus,
  getAllCultureNotices,
  createCultureNotice,
  updateCultureNotice,
  deleteCultureNotice,
} from '../../api/culture'
import type { CultureClassAdmin, CultureApplication, CultureApplicationStatus, CultureNotice } from '../../types/culture'
import { cultureKeys } from '../../hooks/queryKeys'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'
import { STATUS_LABEL, EMPTY_CLASS_FORM, classToForm, formToPayload, EMPTY_NOTICE_FORM, type ClassForm, type NoticeForm } from './culture/constants'
import ClassFormPanel from './culture/ClassFormPanel'
import NoticeFormPanel from './culture/NoticeFormPanel'
import CultureDesk from './components/CultureDesk'

/** 서버 한 번 최대 200건(기본값) — 예전 화면은 200건에서 끊겼다. 이어 받아 전부 모은다(안전하게 20쪽까지) */
const APP_PAGE = 200
const fetchAllApplications = async (): Promise<CultureApplication[]> => {
  const all: CultureApplication[] = []
  for (let page = 0; page < 20; page++) {
    const chunk = await getCultureApplications({ skip: page * APP_PAGE, limit: APP_PAGE })
    all.push(...chunk)
    if (chunk.length < APP_PAGE) break
  }
  return all
}

const CultureManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [classes, setClasses] = useState<CultureClassAdmin[]>([])
  const [applications, setApplications] = useState<CultureApplication[]>([])
  const [notices, setNotices] = useState<CultureNotice[]>([])

  // undefined = 닫힘, null = 새로 만들기
  const [classTarget, setClassTarget] = useState<CultureClassAdmin | null | undefined>(undefined)
  const [noticeTarget, setNoticeTarget] = useState<CultureNotice | null | undefined>(undefined)

  // 성도 화면(/culture)은 React Query 캐시를 쓴다 — 관리에서 바꾸면 다음 진입 때 새로 받게
  const refreshPublic = useCallback(() => void queryClient.invalidateQueries({ queryKey: cultureKeys.all }), [queryClient])

  const loadClasses = useCallback(async () => setClasses(await getAllCultureClasses()), [])
  const loadNotices = useCallback(async () => setNotices(await getAllCultureNotices()), [])

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    // 세 탭을 한 번에 — 강좌 줄의 '대기 n'·숫자 띠가 신청 목록을 쓴다
    Promise.all([loadClasses(), fetchAllApplications().then(setApplications), loadNotices()])
      .catch((error) => showToast(error instanceof Error ? error.message : '데이터를 불러오지 못했습니다', 'error'))
      .finally(() => setLoading(false))
  }, [navigate, loadClasses, loadNotices])

  // ── 강좌 ──

  const handleSaveClass = async (form: ClassForm) => {
    if (!form.title.trim()) return showToast('강좌명을 입력하세요', 'error')
    const payload = formToPayload(form)
    try {
      setSaving(true)
      if (classTarget) {
        await updateCultureClass(classTarget.id, payload)
        showToast('강좌를 고쳤어요', 'success')
      } else {
        await createCultureClass(payload)
        showToast('강좌를 만들었어요', 'success')
      }
      setClassTarget(undefined)
      await loadClasses()
      refreshPublic()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  /** 모집·보이기 스위치 — 바로 넘어가게(낙관적), 실패하면 되돌린다. 서버는 보낸 칸만 고친다 */
  const patchClass = async (c: CultureClassAdmin, patch: Pick<Partial<CultureClassAdmin>, 'is_open' | 'is_active'>, ok: string) => {
    setClasses((l) => l.map((x) => (x.id === c.id ? { ...x, ...patch } : x)))
    try {
      await updateCultureClass(c.id, patch)
      refreshPublic()
      showToast(ok, 'success')
    } catch (error) {
      setClasses((l) => l.map((x) => (x.id === c.id ? { ...x, is_open: c.is_open, is_active: c.is_active } : x)))
      showToast(error instanceof Error ? error.message : '바꾸지 못했어요', 'error')
    }
  }

  const handleDeleteClass = async (c: CultureClassAdmin) => {
    if (
      !(await confirmDialog({
        title: '강좌 삭제',
        message: `"${c.title}" 강좌를 지울까요?`,
        description: `${c.application_count > 0 ? `신청 ${c.application_count}건도 함께 사라져요. ` : ''}잠시 내리려면 모집 마감이나 숨기기를 쓰세요.`,
        confirmText: '네, 지울게요',
        icon: 'delete_forever',
      }))
    )
      return
    try {
      await deleteCultureClass(c.id)
      setClasses((l) => l.filter((x) => x.id !== c.id))
      setApplications((l) => l.filter((x) => x.class_id !== c.id))
      refreshPublic()
      showToast('삭제했어요', 'success')
    } catch {
      showToast('삭제 실패', 'error')
    }
  }

  // ── 신청 상태 ──

  const handleStatusChange = async (a: CultureApplication, status: CultureApplicationStatus) => {
    try {
      const updated = await updateCultureApplicationStatus(a.id, status)
      setApplications((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      // 취소 ↔ 살아 있음이 바뀌면 강좌 신청 수(취소 제외)도 달라진다
      const delta = (status === 'cancelled' ? -1 : 0) + (a.status === 'cancelled' ? 1 : 0)
      if (delta) setClasses((l) => l.map((c) => (c.id === a.class_id ? { ...c, application_count: Math.max(0, c.application_count + delta) } : c)))
      if (delta) refreshPublic()
      showToast(`'${STATUS_LABEL[status]}'(으)로 바꿨어요`, 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '상태 변경 실패', 'error')
    }
  }

  // ── 공지 ──

  const handleSaveNotice = async (form: NoticeForm) => {
    if (!form.title.trim() || !form.content.trim()) return showToast('제목과 내용을 입력하세요', 'error')
    try {
      setSaving(true)
      if (noticeTarget) {
        await updateCultureNotice(noticeTarget.id, form)
        showToast('공지를 고쳤어요', 'success')
      } else {
        await createCultureNotice(form)
        showToast('공지를 올렸어요', 'success')
      }
      setNoticeTarget(undefined)
      await loadNotices()
      refreshPublic()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleNotice = async (n: CultureNotice) => {
    const next = !n.is_active
    setNotices((l) => l.map((x) => (x.id === n.id ? { ...x, is_active: next } : x)))
    try {
      await updateCultureNotice(n.id, { is_active: next })
      refreshPublic()
      showToast(next ? '공지를 공개했어요' : '비공개로 내렸어요', 'success')
    } catch (error) {
      setNotices((l) => l.map((x) => (x.id === n.id ? { ...x, is_active: n.is_active } : x)))
      showToast(error instanceof Error ? error.message : '바꾸지 못했어요', 'error')
    }
  }

  const handleDeleteNotice = async (n: CultureNotice) => {
    if (
      !(await confirmDialog({
        title: '공지 삭제',
        message: `"${n.title}" 공지를 지울까요?`,
        description: '되돌릴 수 없어요. 잠시 감추려면 공개 스위치를 끄세요.',
        confirmText: '네, 지울게요',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteCultureNotice(n.id)
      setNotices((l) => l.filter((x) => x.id !== n.id))
      refreshPublic()
      showToast('삭제했어요', 'success')
    } catch {
      showToast('삭제 실패', 'error')
    }
  }

  return (
    <>
      <CultureDesk
        classes={classes}
        applications={applications}
        notices={notices}
        loading={loading}
        onBack={() => navigate(-1)}
        onCreateClass={() => setClassTarget(null)}
        onEditClass={setClassTarget}
        onDeleteClass={(c) => void handleDeleteClass(c)}
        onToggleOpen={(c) => void patchClass(c, { is_open: !c.is_open }, c.is_open ? '모집을 마감했어요' : '모집을 열었어요')}
        onToggleActive={(c) => void patchClass(c, { is_active: !c.is_active }, c.is_active ? '성도 화면에서 숨겼어요' : '다시 보이게 했어요')}
        onSetAppStatus={(a, s) => void handleStatusChange(a, s)}
        onCreateNotice={() => setNoticeTarget(null)}
        onEditNotice={setNoticeTarget}
        onDeleteNotice={(n) => void handleDeleteNotice(n)}
        onToggleNotice={(n) => void handleToggleNotice(n)}
        onViewPublic={() => navigate('/culture')}
      />

      {classTarget !== undefined && (
        <ClassFormPanel
          initial={classTarget ? classToForm(classTarget) : EMPTY_CLASS_FORM}
          onSave={handleSaveClass}
          onCancel={() => setClassTarget(undefined)}
          isPending={saving}
        />
      )}

      {noticeTarget !== undefined && (
        <NoticeFormPanel
          initial={noticeTarget ? { title: noticeTarget.title, content: noticeTarget.content, is_active: noticeTarget.is_active } : EMPTY_NOTICE_FORM}
          onSave={handleSaveNotice}
          onCancel={() => setNoticeTarget(undefined)}
          isPending={saving}
        />
      )}
    </>
  )
}

export default CultureManagement
