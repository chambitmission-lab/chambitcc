import { useState, useCallback, useEffect, useRef } from 'react'
import { useCreatePrayer } from '../../../../hooks/usePrayersQuery'
import { useMyIdentity } from '../../../../hooks/useProfile'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { validation, PRAYER_CONTENT_MIN } from '../../../../utils/validation'
import { safeStorage } from '../../../../utils/safeStorage'
import type { Prayer, PrayerEmotion, PrayerFilterType, RecommendedVerses, SortType } from '../../../../types/prayer'
import { tokenStore } from '../../../../utils/tokenStore'
import { prayerToastFeedback } from '../../../../components/prayer/prayerFeedback'

interface UsePrayerComposerProps {
  onClose: () => void
  onSuccess?: (prayer: Prayer) => void
  sort: SortType
  groupId?: number | null  // ✅ 초기 groupId 추가
  filter?: PrayerFilterType | null
  isAnswered?: boolean
  initialContent?: string
}

/**
 * 쓰다 만 기도 — 뒤로가기·앱 전환·실수로 닫아도 사라지지 않게 기기에 잠시 둔다.
 * 등록이 끝나면 지운다. 다시 열면 "이어 쓸까요?" 칩으로 묻고, 바로 새로 쓰기 시작하면 덮어쓴다.
 */
export interface PrayerDraft {
  title: string
  content: string
  emotion: PrayerEmotion | null
  isAnonymous: boolean
  isPrivate: boolean
  sharedWithPastor: boolean
  groupId: number | null
  savedAt: number
}
const DRAFT_KEY = 'prayer:composer:draft'
const DRAFT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7 // 일주일 지난 초안은 버린다
const DRAFT_SAVE_DELAY_MS = 400

const readDraft = (): PrayerDraft | null => {
  const raw = safeStorage.getJson(DRAFT_KEY)
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Partial<PrayerDraft>
  if (typeof d.content !== 'string' || !d.content.trim()) return null
  if (typeof d.savedAt !== 'number' || Date.now() - d.savedAt > DRAFT_MAX_AGE_MS) {
    safeStorage.remove(DRAFT_KEY)
    return null
  }
  return {
    title: typeof d.title === 'string' ? d.title : '',
    content: d.content,
    emotion: (d.emotion as PrayerEmotion | null) ?? null,
    isAnonymous: d.isAnonymous !== false,
    isPrivate: d.isPrivate === true,
    sharedWithPastor: d.sharedWithPastor === true,
    groupId: typeof d.groupId === 'number' ? d.groupId : null,
    savedAt: d.savedAt,
  }
}

export const usePrayerComposer = ({ onClose, onSuccess, sort, groupId, filter, isAnswered, initialContent }: UsePrayerComposerProps) => {
  // 목록을 구독하지 않는 "쓰기 전용" 훅 — 호출 화면이 보고 있는 키 그대로 넘겨 임시 카드가 그 목록에 꽂힌다
  const { createPrayer, isCreating } = useCreatePrayer(sort, groupId, filter, isAnswered, prayerToastFeedback)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(initialContent ?? '')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [selectedGroupId, setSelectedGroupIdRaw] = useState<number | null>(groupId || null)  // ✅ 초기값 설정
  // 나만 보기(비밀기도) — 그룹과 배타적. 하나를 고르면 다른 쪽은 풀린다
  const [isPrivate, setIsPrivateRaw] = useState(false)
  // 목사님과 함께 — 나만 보기의 한 종류(성도에게는 없는 글)라 isPrivate 도 함께 켜진다.
  // 목사님이 누구의 기도인지 알아야 돌볼 수 있으므로 고르는 순간 실명이 기본이고(익명 전환 가능),
  // 빠져나올 땐 익명 기본값으로 되돌린다 — 실명이 켜진 채 전체 공개로 넘어가는 사고 방지
  const [sharedWithPastor, setSharedWithPastorRaw] = useState(false)
  const leavePastor = useCallback(() => {
    setSharedWithPastorRaw((was) => {
      if (was) setIsAnonymous(true)
      return false
    })
  }, [])
  const setIsPrivate = useCallback((next: boolean) => {
    leavePastor()
    setIsPrivateRaw(next)
    if (next) setSelectedGroupIdRaw(null)
  }, [leavePastor])
  const setSharedWithPastor = useCallback(() => {
    setSharedWithPastorRaw(true)
    setIsPrivateRaw(true)
    setSelectedGroupIdRaw(null)
    setIsAnonymous(false)
  }, [])
  const setSelectedGroupId = useCallback((next: number | null) => {
    setSelectedGroupIdRaw(next)
    if (next !== null) {
      leavePastor()
      setIsPrivateRaw(false)
    }
  }, [leavePastor])
  const [emotion, setEmotion] = useState<PrayerEmotion | null>(null)
  const [error, setError] = useState('')
  const [recommendedVerses, setRecommendedVerses] = useState<RecommendedVerses | null>(null)
  const [showVersesModal, setShowVersesModal] = useState(false)
  // 등록 성공 → 이모지 폭죽을 잠깐 보여주고 닫는다 (추천 구절 모달이 뜨는 경우는 모달이 보상)
  const [celebrating, setCelebrating] = useState(false)
  // 방금 올린 기도 id — 묵상 모달의 타임캡슐 초대(그날의 기도 봉인)에 넘긴다
  const [createdPrayerId, setCreatedPrayerId] = useState<number | null>(null)

  // ── 초안 ──
  // 열 때 한 번 읽는다. 다른 화면에서 문장을 들고 들어온 경우(initialContent)는 그쪽이 우선
  const [pendingDraft, setPendingDraft] = useState<PrayerDraft | null>(() =>
    initialContent ? null : readDraft(),
  )
  const savedRef = useRef(false) // 등록이 끝난 뒤에는 저장하지 않는다
  const restoreDraft = useCallback(() => {
    const d = pendingDraft
    if (!d) return
    setTitle(d.title)
    setContent(d.content)
    setEmotion(d.emotion)
    // 공개 범위는 불변식을 지키는 setter 대신 저장된 조합을 그대로 되살린다(저장 시점에 이미 정합)
    setSharedWithPastorRaw(d.sharedWithPastor)
    setIsPrivateRaw(d.isPrivate)
    setIsAnonymous(d.isAnonymous)
    // 기도방 탭에서 연 시트는 그 방이 우선 — 홈에서 연 경우에만 초안의 방을 되살린다
    if (!groupId) setSelectedGroupIdRaw(d.isPrivate ? null : d.groupId)
    setPendingDraft(null)
  }, [pendingDraft, groupId])
  const discardDraft = useCallback(() => {
    safeStorage.remove(DRAFT_KEY)
    setPendingDraft(null)
  }, [])
  // 디바운스 저장 — 본문이 비면 초안도 지운다(일부러 지운 글이 다시 살아나지 않게)
  useEffect(() => {
    if (savedRef.current) return
    const timer = window.setTimeout(() => {
      if (!content.trim()) {
        if (!pendingDraft) safeStorage.remove(DRAFT_KEY)
        return
      }
      const draft: PrayerDraft = {
        title, content, emotion, isAnonymous, isPrivate, sharedWithPastor,
        groupId: selectedGroupId, savedAt: Date.now(),
      }
      safeStorage.setJson(DRAFT_KEY, draft)
    }, DRAFT_SAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [title, content, emotion, isAnonymous, isPrivate, sharedWithPastor, selectedGroupId, pendingDraft])

  // 브라우저 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  const isLoggedIn = !!tokenStore.getAccess()

  // 내 사진·이름 — 헤더가 캐시한 가벼운 /profile/stats(useMyIdentity). 작성 모달을 열 때마다
  // 무거운 프로필 상세(통계+목록 집계)를 다시 부르지 않는다. 이름은 full_name 우선(실제 노출 기준)
  const { avatarUrl, displayName: myName } = useMyIdentity()

  const getUserName = (): string => {
    if (!isLoggedIn || isAnonymous) return '익명'
    return myName || '익명'
  }

  const displayName = getUserName()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 검증
    const titleValidation = validation.validateTitle(title)
    if (!titleValidation.valid) {
      setError(titleValidation.error!)
      return
    }

    const contentValidation = validation.validateContent(content)
    if (!contentValidation.valid) {
      setError(contentValidation.error!)
      return
    }

    const nameValidation = validation.validateDisplayName(displayName)
    if (!nameValidation.valid) {
      setError(nameValidation.error!)
      return
    }

    setError('')

    try {
      const response = await createPrayer({
        title: title.trim() || undefined,  // 제목은 선택 — 비면 보내지 않음
        content: content.trim(),
        display_name: displayName,
        is_fully_anonymous: isAnonymous,
        group_id: isPrivate ? undefined : selectedGroupId || undefined,
        is_private: isPrivate || undefined,
        shared_with_pastor: sharedWithPastor || undefined,
        emotion: emotion || undefined,
      })

      const prayer = response.data

      // 올라갔으니 초안은 지운다 — 디바운스 저장이 뒤늦게 되살리지 않도록 플래그도 함께
      savedRef.current = true
      safeStorage.remove(DRAFT_KEY)

      onSuccess?.(prayer)
      setCreatedPrayerId(prayer.id)

      if (prayer.recommended_verses && prayer.recommended_verses.verses.length > 0) {
        setRecommendedVerses(prayer.recommended_verses)
        setShowVersesModal(true)
      } else {
        // 구절 추천은 백그라운드 처리 — 기다리지 않고 바로 닫는다.
        // 묵상 스토리(와 타임캡슐 초대)는 피드 카드의 말씀 아이콘에서 열린다.
        if (response.processing) {
          console.log('성경 구절이 백그라운드에서 처리 중입니다')
        }
        setCelebrating(true)
        window.setTimeout(onClose, 780)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다')
    }
  }

  const handleVersesModalClose = () => {
    setShowVersesModal(false)
    onClose()
  }

  // 음성 인식을 위한 안정적인 setter (중복 방지)
  // 고치기 시작하면 지난 제출의 에러는 지운다 — 고친 뒤에도 빨간 상자가 남아 있으면 "아직도 틀렸나" 싶다
  const handleTitleChange = useCallback((newTitle: string) => {
    setError('')
    setTitle(prev => {
      if (prev === newTitle) {
        console.log('usePrayerComposer: Ignoring duplicate title update:', newTitle)
        return prev
      }
      return newTitle
    })
  }, [])

  const handleContentChange = useCallback((newContent: string) => {
    setError('')
    // 초안을 두고 새로 쓰기 시작하면 칩은 내리고(디바운스 저장이 새 글로 덮는다)
    setPendingDraft(null)
    setContent(prev => {
      if (prev === newContent) {
        console.log('usePrayerComposer: Ignoring duplicate content update:', newContent)
        return prev
      }
      return newContent
    })
  }, [])

  // "N자만 더" — 등록 버튼이 1자부터 켜지면서 누르면 10자 에러가 뜨는 어긋남을 막는다
  const contentLength = content.trim().length
  const charsToGo = contentLength === 0 ? 0 : Math.max(0, PRAYER_CONTENT_MIN - contentLength)

  return {
    // State
    title,
    content,
    isAnonymous,
    isPrivate,
    sharedWithPastor,
    selectedGroupId,
    emotion,
    error,
    recommendedVerses,
    showVersesModal,
    celebrating,
    createdPrayerId,
    isCreating,
    isLoggedIn,
    displayName,
    avatarUrl,
    charsToGo,
    pendingDraft,

    // Handlers
    restoreDraft,
    discardDraft,
    setTitle: handleTitleChange,
    setContent: handleContentChange,
    setIsAnonymous,
    setIsPrivate,
    setSharedWithPastor,
    setSelectedGroupId,
    setEmotion,
    handleSubmit,
    handleVersesModalClose,
  }
}
