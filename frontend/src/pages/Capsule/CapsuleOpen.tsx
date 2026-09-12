// 타임캡슐 상세/개봉 (/capsule/:id)
// - 개봉 전: 봉인된 봉투 + D-day (내용은 서버가 내려주지 않는다)
// - 개봉 가능: 밤하늘에 내려앉은 우편물 → 인장 뜯기 → 편지(글·음성·스냅샷)
// - 읽은 뒤: 답장 캡슐 이어쓰기 CTA (개봉이 다음 봉인의 입구)
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCapsule, useDeleteCapsule, useOpenCapsule } from '../../hooks/useTimeCapsule'
import type { CapsuleDetail } from '../../types/timeCapsule'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import CapsuleSlideshow from './CapsuleSlideshow'
import CapsuleOpenRail from './CapsuleOpenRail'
import { useThemeArt } from '../../hooks/useThemeArt'
import { CAPSULE_LETTER, CAPSULE_SEALED } from '../../utils/themeAssets'
import { formatKoreanDate } from './capsuleDates'
import { CalendarGlyph, Icon, MicGlyph, PhotoGlyph } from './capsuleIcons'
import './capsule.css'
import { confirmDialog } from '../../utils/confirmDialog'
import { ArrivalEnvelope } from './open/ArrivalEnvelope'
import { DawnSky, LetterStamp } from './open/LetterDecor'
import { DevelopingPolaroid } from './open/DevelopingPolaroid'
import { POLAROID_TILTS, filmStamp } from './open/polaroidBits'
import { MetaChip, SealDial, SealedLetterPreview } from './open/SealedScreen'
import { VoiceTape } from './open/VoiceTape'
import { addressTo, arrivalNarration, journeyLine, senderLine, signatureFrom } from './open/letterText'

type Phase = 'sealed' | 'opening' | 'letter'


const capsuleInviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/capsule/invite/${code}`


/** preview: /dev/capsule-letter 미리보기 전용 — 넣으면 네트워크·로그인 없이 이 캡슐을 그린다 */
const CapsuleOpen = ({ preview }: { preview?: CapsuleDetail } = {}) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const capsuleId = Number(id)

  const { data: fetched, isLoading: fetching, error: fetchError } = useCapsule(
    capsuleId,
    isAuthenticated() && !preview,
  )
  const capsule = preview ?? fetched
  const isLoading = preview ? false : fetching
  const error = preview ? null : fetchError
  const openCapsule = useOpenCapsule(capsuleId)
  const deleteCapsule = useDeleteCapsule()
  const [phase, setPhase] = useState<Phase>('sealed')
  const [showSlideshow, setShowSlideshow] = useState(false)
  // 편지를 읽는 동안 헤더는 아침 하늘 위에 떠 있다 — 종이 위로 넘어가면 크림 유리로 바꾼다
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (preview) return
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/capsule/${id}`)
      navigate('/login')
    }
  }, [id, navigate, preview])

  // 이미 개봉한 캡슐(재열람)은 연출 없이 바로 편지를 보여준다
  useEffect(() => {
    if (capsule?.openable && capsule.opened_at && phase === 'sealed') {
      setPhase('letter')
    }
  }, [capsule, phase])

  // 봉투를 뜯기 전에 편지 하늘 삽화를 데워 둔다 — 개봉 연출이 끝나는 순간 이미 자리에 있게.
  // 봉인 대기 화면의 금고 삽화도 CSS 배경이라 현재 테마만 받는다 — 반대 테마까지 미리 데워
  // 첫 테마 토글에서 배경이 늦게 바뀌지 않게 한다(themeAssets.ts).
  useThemeArt(CAPSULE_LETTER, !!capsule?.openable)
  useThemeArt(CAPSULE_SEALED, !!capsule && !capsule.openable)

  // 하늘 위 헤더 ↔ 크림 유리 헤더 전환 (편지를 읽는 동안에만)
  useEffect(() => {
    // 편지 단계는 되돌아오지 않으므로 벗어날 때 상태를 되돌릴 일이 없다
    if (phase !== 'letter') return
    // 실제 스크롤 컨테이너는 body다(#root·body에 overflow-y가 걸려 있어 window.scrollY는 늘 0).
    // 어느 쪽이 움직이든 잡히도록 둘 다 읽고, 둘 다 듣는다.
    const onScroll = () =>
      setScrolled(
        (document.body.scrollTop || document.documentElement.scrollTop || window.scrollY) > 130,
      )
    onScroll()
    document.body.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.body.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onScroll)
    }
  }, [phase])

  const handleOpen = async () => {
    try {
      await openCapsule.mutateAsync()
      // 봉투가 뜯기는 순간의 촉감 — 미지원 브라우저(iOS Safari)는 조용히 무시
      navigator.vibrate?.([28, 45, 34])
      setPhase('opening')
      // 봉투 연출이 끝나면 편지로 전환
      window.setTimeout(() => setPhase('letter'), 1700)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '아직 캡슐을 열 수 없습니다', 'error')
    }
  }

  const handleDelete = async () => {
    if (
      !(await confirmDialog({
        title: '타임캡슐 삭제',
        message: '이 캡슐을 삭제할까요?',
        description: '한 번 삭제하면 되돌릴 수 없어요.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteCapsule.mutateAsync(capsuleId)
      showToast('캡슐을 삭제했어요', 'success')
      navigate('/capsule', { replace: true })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleShare = async () => {
    if (!capsule?.invite_code) return
    const url = capsuleInviteUrl(capsule.invite_code)
    const text = `🕰️ ${capsule.recipient_name || '당신'}에게 보내는 타임캡슐이에요.\n${formatKoreanDate(
      capsule.open_at,
    )}${capsule.open_label ? ` (${capsule.open_label})` : ''}에 열려요.`
    if (navigator.share) {
      try {
        // text에 URL을 넣고 url도 함께 넘기면 공유 대상 앱이 링크를 두 번 붙임
        await navigator.share({ title: '타임캡슐 초대장', text, url })
        return
      } catch {
        return
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`)
      showToast('초대 링크를 복사했어요', 'success')
    } catch {
      showToast('링크 복사에 실패했어요', 'error')
    }
  }

  const content = capsule?.content ?? null
  const snapshot = content?.snapshot ?? null
  const stats = snapshot?.stats ?? null
  // 배포 전 캐시 응답에는 photos가 없을 수 있다
  const photos = content?.photos ?? []

  // 편지를 읽는 화면에서만 헤더가 아침 하늘 위로 올라간다
  const onSky = phase === 'letter' && !!content

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 셸을 풀고 본문(편지) + 우측 레일(편지 정보·이어서) 2단 표준 규격.
          편지지 자체는 capsule.css 가 읽기 폭으로 묶는다 — 카드는 넓혀야 하늘 삽화가 산다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div
        className={`relative max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-12 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0 ${
          onSky ? 'capsule-stage' : ''
        }`}
      >
        {/* 편지가 도착한 아침 하늘 — 헤더 뒤까지 올라와 화면 전체의 조명이 된다 */}
        {onSky && <DawnSky />}

        {/* 헤더 */}
        <div
          className={
            onSky
              ? `capsule-topbar ${scrolled ? 'is-scrolled' : ''}`
              : 'sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2'
          }
        >
          <button
            type="button"
            onClick={() => navigate('/capsule')}
            className={onSky ? 'capsule-topbar__back' : 'p-1 -ml-1 text-gray-700 dark:text-white/80'}
            aria-label="캡슐함으로"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {onSky ? (
            <div className="capsule-topbar__title">
              <h1>타임캡슐</h1>
              <p className="capsule-topbar__sub">그날의 마음이 오늘 도착했어요</p>
            </div>
          ) : (
            <h1 className="text-[16px] font-extrabold flex-1">타임캡슐</h1>
          )}
          {capsule && capsule.role !== 'recipient' && (
            <button
              type="button"
              onClick={handleDelete}
              className={
                onSky
                  ? 'capsule-topbar__del'
                  : 'text-[12.5px] font-bold text-gray-400 dark:text-white/40'
              }
            >
              {onSky && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 7h16M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7M6.5 7l.9 12.1A1.9 1.9 0 0 0 9.3 21h5.4a1.9 1.9 0 0 0 1.9-1.9L17.5 7" />
                </svg>
              )}
              삭제
            </button>
          )}
        </div>

        {/* 다크 모드에서 4%짜리 블록 하나만 두면 그냥 검은 화면으로 읽힌다 —
            불러오는 중이라는 게 보이도록 대비를 올리고 형태를 잡아둔다 */}
        {isLoading && (
          <div className="mx-4 mt-6 space-y-3">
            <div className="h-64 rounded-3xl bg-gray-100/70 dark:bg-white/[0.07] animate-pulse" />
            <div className="h-4 w-1/2 mx-auto rounded-full bg-gray-100/70 dark:bg-white/[0.07] animate-pulse" />
            <div className="h-4 w-2/3 mx-auto rounded-full bg-gray-100/70 dark:bg-white/[0.05] animate-pulse" />
          </div>
        )}

        {(error || (!isLoading && !capsule)) && (
          <div className="text-center pt-24 px-6">
            <span className="text-5xl block mb-4">😢</span>
            <p className="text-[15px] font-bold">삭제되었거나 볼 수 없는 캡슐이에요</p>
            <p className="mt-2 text-[13px] text-gray-500 dark:text-white/45 leading-[1.7]">
              보낸 사람이 캡슐을 지웠을 수 있어요. 알림은 남아 있어도 내용은 열 수 없습니다.
            </p>
            <button
              type="button"
              onClick={() => navigate('/capsule')}
              className="mt-6 px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold"
            >
              캡슐함으로
            </button>
          </div>
        )}

        {/* 개봉 가능 — 밤하늘에서 내려앉은 우편물 한 통.
            "열어보고 싶은 마음"은 파란 버튼이 아니라 봉투의 재질과 뜯는 동작에서 온다. */}
        {capsule && phase !== 'letter' && capsule.openable && (
          <div className={`capsule-arrival ${phase === 'opening' ? 'capsule-arrival--opening' : ''}`}>
            <span className="capsule-arrival__bloom" aria-hidden />
            <div className="capsule-arrival__inner px-6 pt-6 pb-10 text-center">
              <p className="capsule-invite__eyebrow pb-7 text-[11px] font-bold tracking-[0.3em]">
                {capsule.role === 'recipient' ? '편지가 도착했어요' : '오늘 열 수 있어요'}
              </p>

              <ArrivalEnvelope
                capsule={capsule}
                opening={phase === 'opening' || openCapsule.isPending}
                onOpen={handleOpen}
              />

              <p className="mt-9 text-[12.5px] font-bold text-[var(--text-muted)]">
                {senderLine(capsule)}
              </p>
              <h2 className="text-[21px] font-extrabold mt-1.5 break-keep">
                {capsule.title || '캡슐이 도착했어요'}
              </h2>
              <p className="mt-2 text-[13px] font-bold text-brand">
                {journeyLine(capsule.sealed_at, capsule.open_at)}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                <MetaChip icon={<CalendarGlyph />}>
                  {formatKoreanDate(capsule.sealed_at)} 봉인
                </MetaChip>
                {(capsule.photo_count ?? 0) > 0 && (
                  <MetaChip icon={<PhotoGlyph />}>사진 {capsule.photo_count}장</MetaChip>
                )}
                {capsule.has_audio && <MetaChip icon={<MicGlyph />}>음성 편지</MetaChip>}
              </div>
            </div>
          </div>
        )}

        {/* 아직 못 여는 캡슐 — 봉투는 "열 수 있다"는 신호라서 다이얼만 보여준다.
            위·아래 여백은 capsule.css 가 잡는다: 뒤에 깔린 금고 삽화(양·텐트·새끼양)가
            다이얼과 제목 사이에 들어앉을 자리라서 pt-10/mt-9 로는 모자란다 */}
        {capsule && phase !== 'letter' && !capsule.openable && (
          <div className="capsule-waiting px-6 text-center">
            <SealDial sealedAt={capsule.sealed_at} openAt={capsule.open_at} />

            <p className="capsule-waiting__sender text-[12.5px] font-bold text-[var(--text-muted)]">
              {senderLine(capsule)}
            </p>
            <h2 className="text-[20px] font-extrabold mt-1.5 break-keep">
              {capsule.title || '봉인된 타임캡슐'}
            </h2>

            <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
              <MetaChip icon={<CalendarGlyph />}>
                {formatKoreanDate(capsule.sealed_at)} 봉인
              </MetaChip>
              {(capsule.photo_count ?? 0) > 0 && (
                <MetaChip icon={<PhotoGlyph />}>사진 {capsule.photo_count}장</MetaChip>
              )}
              {capsule.has_audio && <MetaChip icon={<MicGlyph />}>음성 편지</MetaChip>}
            </div>

            <div className="mt-7">
              <SealedLetterPreview capsule={capsule} />
            </div>
            <p className="text-[12.5px] text-gray-400 dark:text-white/40 mt-4 leading-[1.7]">
              그날까지는 누구도 — 쓴 사람도 — 열어볼 수 없어요.
            </p>
            {capsule.role === 'sender' &&
              capsule.capsule_type === 'invite' &&
              capsule.invite_code && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="mt-6 w-full py-3.5 rounded-2xl bg-[var(--brand-soft)] text-brand text-[14px] font-bold"
                >
                  {capsule.claimed ? '받는 분이 등록을 마쳤어요 · 링크 다시 보내기' : '초대 링크 전달하기'}
                </button>
              )}
          </div>
        )}

        {/* 편지 — 봉투에서 방금 꺼낸 크림 편지지.
            봉투·초대장·폴라로이드가 쌓아온 재질 언어(크림 종이·소인·손글씨·밀랍)를
            여기서 끊지 않는다. 앱 카드가 아니라 세 겹으로 접혀 있던 종이 한 장이다. */}
        {capsule && phase === 'letter' && content && (
          <div className="capsule-reading px-4">
            {/* 하늘의 내레이션 — 편지를 펼치기 전에 집배원이 건네는 한마디 */}
            <div className="capsule-reading__journey capsule-letter-enter">
              <span className="capsule-reading__journey-chip">
                <Icon size={13}>
                  <CalendarGlyph />
                </Icon>
                {arrivalNarration(capsule.sealed_at, capsule.open_at)}
              </span>
            </div>

            <article className="capsule-paper capsule-letter-enter">
              {/* 앨범에 붙이듯 종이테이프 두 조각으로 눌러 둔 편지 */}
              <i className="capsule-washi capsule-washi--tl" aria-hidden />
              <i className="capsule-washi capsule-washi--br" aria-hidden />
              {/* 편지 곁에 놓인 들꽃 — 초점 밖으로 흐려 전경에만 걸친다(글줄은 비켜 간다) */}
              <i className="capsule-paper__petals" aria-hidden />

              {/* 편지 머리 — 수취인과 우표·소인 */}
              <header className="capsule-paper__head">
                <LetterStamp sealedAt={capsule.sealed_at} />

                <p className="capsule-paper__to">
                  To. <b>{addressTo(capsule)}</b>
                  <svg className="capsule-paper__heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 20s-7.2-4.4-7.2-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.2 2.4C19.2 15.6 12 20 12 20Z" />
                  </svg>
                </p>
                <h2 className="capsule-paper__title">
                  {content.title || capsule.title || '봉인됐던 편지'}
                </h2>
              </header>

              <div className="capsule-paper__rule" aria-hidden />

              {/* 본문 — 괘선 위에 명조 잉크로. 잉크가 스미듯 반 박자 늦게 떠오른다 */}
              {content.message && <p className="capsule-paper__message">{content.message}</p>}

              {/* 음성 — 릴이 돌아가는 카세트 */}
              {content.audio_url && (
                <div className="mt-7">
                  <VoiceTape src={content.audio_url} duration={content.audio_duration ?? null} />
                </div>
              )}

              {/* 사진 — 봉인됐던 인화지가 이제야 현상된다 */}
              {photos.length > 0 && (
                <div className="mt-8">
                  <p className="capsule-paper__label">
                    <Icon size={13}>
                      <PhotoGlyph />
                    </Icon>
                    동봉된 사진
                    <i>지금 막 인화되는 중</i>
                  </p>
                  <div className="mt-5 flex flex-col items-center gap-7">
                    {photos.map((photo, i) => (
                      <DevelopingPolaroid
                        key={photo.url}
                        photo={photo}
                        tilt={POLAROID_TILTS[i % POLAROID_TILTS.length]}
                        stamp={filmStamp(capsule.sealed_at)}
                      />
                    ))}
                  </div>

                  {/* 피날레 — 그 사람 목소리를 들으며 그날 사진을 본다 */}
                  {content.audio_url && (
                    <button
                      type="button"
                      onClick={() => setShowSlideshow(true)}
                      className="capsule-paper__show"
                    >
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        aria-hidden
                      >
                        <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
                        <path d="M7 5v14M17 5v14M2.5 9.5H7M2.5 14.5H7M17 9.5h4.5M17 14.5h4.5" />
                      </svg>
                      목소리 들으며 사진 보기
                    </button>
                  )}
                </div>
              )}

              {/* 서명 — 편지는 손글씨 이름으로 끝난다 */}
              <footer className="capsule-paper__sign">
                <p className="capsule-paper__sign-close">그날의 마음을 담아,</p>
                <p className="capsule-paper__sign-from">
                  From. <b>{signatureFrom(capsule)}</b>
                </p>
                <p className="capsule-paper__sign-date">
                  {formatKoreanDate(capsule.sealed_at)}에 씀
                </p>
              </footer>
            </article>

            {showSlideshow && content.audio_url && (
              <CapsuleSlideshow
                photos={photos}
                audioUrl={content.audio_url}
                audioDuration={content.audio_duration}
                senderLine={senderLine(capsule)}
                onClose={() => setShowSlideshow(false)}
              />
            )}

            {/* 함께 봉인한 그날의 기도 — 기도→묵상→캡슐 흐름으로 봉인된 캡슐에만 있다.
                편지를 읽은 뒤 "그때 이렇게 기도했었지"를 만나는 순간이 이 카드의 존재 이유 */}
            {snapshot?.prayer && (snapshot.prayer.content || snapshot.prayer.verses?.length) && (
              <aside className="capsule-ps capsule-letter-enter capsule-letter-enter--delayed">
                <span className="capsule-ps__clip" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
                    <path d="M8 8.5v7.8a4 4 0 0 0 8 0V7.2a2.7 2.7 0 1 0-5.4 0v8.6a1.35 1.35 0 0 0 2.7 0V8.5" />
                  </svg>
                </span>
                <p className="capsule-ps__label">
                  🙏 함께 봉인한 그날의 기도
                  {snapshot.prayer.title ? ` · ${snapshot.prayer.title}` : ''}
                </p>
                {snapshot.prayer.content && (
                  <p className="capsule-ps__verse">{snapshot.prayer.content}</p>
                )}
                {snapshot.prayer.verses && snapshot.prayer.verses.length > 0 && (
                  <>
                    <p className="capsule-ps__label" style={{ marginTop: 14 }}>
                      그날 붙들었던 말씀
                    </p>
                    <p className="capsule-ps__verse">
                      “{snapshot.prayer.verses[0].text}”
                      <span className="capsule-ps__ref">
                        — {snapshot.prayer.verses[0].reference}
                      </span>
                    </p>
                  </>
                )}
              </aside>
            )}

            {/* P.S. — 편지에 클립으로 끼워둔 그날의 기록 카드 */}
            {snapshot && (
              <aside className="capsule-ps capsule-letter-enter capsule-letter-enter--delayed">
                <span className="capsule-ps__clip" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
                    <path d="M8 8.5v7.8a4 4 0 0 0 8 0V7.2a2.7 2.7 0 1 0-5.4 0v8.6a1.35 1.35 0 0 0 2.7 0V8.5" />
                  </svg>
                </span>
                <p className="capsule-ps__label">
                  P.S. 봉인하던 그날
                  {snapshot.season_label ? ` · ${snapshot.season_label}` : ''}
                </p>
                {snapshot.verse_text && (
                  <p className="capsule-ps__verse">
                    “{snapshot.verse_text}”
                    {snapshot.verse_reference && (
                      <span className="capsule-ps__ref">— {snapshot.verse_reference}</span>
                    )}
                  </p>
                )}
                {stats &&
                  (() => {
                    const bits = [
                      stats.meditation_streak != null &&
                        stats.meditation_streak > 0 &&
                        `묵상 ${stats.meditation_streak}일 연속`,
                      stats.verses_read != null &&
                        stats.verses_read > 0 &&
                        `말씀 ${stats.verses_read.toLocaleString()}절`,
                      stats.prayers != null && stats.prayers > 0 && `기도 ${stats.prayers}개`,
                      stats.thanks != null && stats.thanks > 0 && `감사 ${stats.thanks}개`,
                    ].filter(Boolean)
                    return bits.length > 0 ? (
                      <p className="capsule-ps__stats">그날의 나 — {bits.join(', ')}</p>
                    ) : null
                  })()}
              </aside>
            )}

            {/* 답장 체인 — 개봉이 다음 봉인의 입구.
                여기부터는 편지가 아니라 앱이다 — 간격을 넉넉히 둬서 세계를 구분한다 */}
            <div className="capsule-reading__outro capsule-letter-enter capsule-letter-enter--delayed mt-9 text-center">
              <p className="text-[12.5px] text-gray-500 dark:text-white/50 leading-[1.7]">
                편지를 읽은 지금의 마음, 그대로 흘려보내긴 아깝지 않나요?
              </p>
              <button
                type="button"
                onClick={() => navigate('/capsule/new')}
                className="mt-3 w-full py-3.5 rounded-2xl bg-brand text-white text-[14.5px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] inline-flex items-center justify-center gap-1.5"
              >
                {/* 봉인된 편지 — CapsuleList 히어로 버튼과 동일한 아이콘으로 통일 */}
                <svg
                  className="w-[18px] h-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="m3.5 6.5 8.5 6 8.5-6" />
                </svg>
                다음 캡슐 이어서 봉인하기
              </button>
              <button
                type="button"
                onClick={() => navigate('/capsule')}
                className="mt-2 w-full py-3 rounded-2xl text-[13.5px] font-bold text-gray-500 dark:text-white/55"
              >
                캡슐함으로
              </button>
            </div>
          </div>
        )}
      </div>

      {capsule && (
        <CapsuleOpenRail
          capsule={capsule}
          reading={phase === 'letter' && !!content}
          senderLine={senderLine(capsule)}
          onSlideshow={
            photos.length > 0 && content?.audio_url ? () => setShowSlideshow(true) : undefined
          }
          onShare={
            !capsule.openable &&
            capsule.role === 'sender' &&
            capsule.capsule_type === 'invite' &&
            capsule.invite_code
              ? handleShare
              : undefined
          }
        />
      )}
      </div>
    </div>
  )
}

export default CapsuleOpen
