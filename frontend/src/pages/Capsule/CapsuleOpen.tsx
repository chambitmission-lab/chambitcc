// 타임캡슐 상세/개봉 (/capsule/:id)
// - 개봉 전: 봉인된 봉투 + D-day (내용은 서버가 내려주지 않는다)
// - 개봉 가능: 봉투 뜯는 연출 → 편지(글·음성·봉인한 날의 스냅샷)
// - 읽은 뒤: 답장 캡슐 이어쓰기 CTA (개봉이 다음 봉인의 입구)
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCapsule, useDeleteCapsule, useOpenCapsule } from '../../hooks/useTimeCapsule'
import type { CapsuleDetail } from '../../types/timeCapsule'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { daysUntil, formatKoreanDate } from './capsuleDates'
import './capsule.css'

type Phase = 'sealed' | 'opening' | 'letter'

const capsuleInviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/capsule/invite/${code}`

const senderLine = (capsule: CapsuleDetail): string => {
  if (capsule.role === 'self') return '과거의 나로부터'
  if (capsule.role === 'recipient') return `${capsule.sender_name}님으로부터`
  return `${capsule.recipient_name || '소중한 분'}에게 보낸 캡슐`
}

const CapsuleOpen = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const capsuleId = Number(id)

  const { data: capsule, isLoading, error } = useCapsule(capsuleId, isAuthenticated())
  const openCapsule = useOpenCapsule(capsuleId)
  const deleteCapsule = useDeleteCapsule()
  const [phase, setPhase] = useState<Phase>('sealed')

  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/capsule/${id}`)
      navigate('/login')
    }
  }, [id, navigate])

  // 이미 개봉한 캡슐(재열람)은 연출 없이 바로 편지를 보여준다
  useEffect(() => {
    if (capsule?.openable && capsule.opened_at && phase === 'sealed') {
      setPhase('letter')
    }
  }, [capsule, phase])

  const handleOpen = async () => {
    try {
      await openCapsule.mutateAsync()
      setPhase('opening')
      // 봉투 연출이 끝나면 편지로 전환
      window.setTimeout(() => setPhase('letter'), 1700)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '아직 캡슐을 열 수 없습니다', 'error')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('이 캡슐을 삭제할까요? 되돌릴 수 없어요.')) return
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
    )}${capsule.open_label ? ` (${capsule.open_label})` : ''}에 열려요.\n\n${url}`
    if (navigator.share) {
      try {
        await navigator.share({ title: '타임캡슐 초대장', text, url })
        return
      } catch {
        return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast('초대 링크를 복사했어요', 'success')
    } catch {
      showToast('링크 복사에 실패했어요', 'error')
    }
  }

  const content = capsule?.content ?? null
  const snapshot = content?.snapshot ?? null
  const stats = snapshot?.stats ?? null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-12">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/capsule')}
            className="p-1 -ml-1 text-gray-700 dark:text-white/80"
            aria-label="캡슐함으로"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-[16px] font-extrabold flex-1">타임캡슐</h1>
          {capsule && capsule.role !== 'recipient' && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-[12.5px] font-bold text-gray-400 dark:text-white/40"
            >
              삭제
            </button>
          )}
        </div>

        {isLoading && (
          <div className="mx-4 mt-6 h-72 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        )}

        {(error || (!isLoading && !capsule)) && (
          <div className="text-center pt-24 px-6">
            <span className="text-5xl block mb-4">😢</span>
            <p className="text-[15px] font-bold">캡슐을 찾을 수 없어요</p>
            <button
              type="button"
              onClick={() => navigate('/capsule')}
              className="mt-6 px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold"
            >
              캡슐함으로
            </button>
          </div>
        )}

        {capsule && phase !== 'letter' && (
          <div className="px-6 pt-12 text-center">
            {/* 봉투 */}
            <div
              className={`capsule-envelope ${
                phase === 'opening' ? 'capsule-envelope--opening' : 'capsule-envelope--sealed'
              }`}
            >
              <div className="capsule-envelope__letter">💌</div>
              <div className="capsule-envelope__body" />
              <div className="capsule-envelope__flap" />
              <span className="capsule-envelope__seal">{capsule.openable ? '🔓' : '🔒'}</span>
            </div>

            <p className="mt-10 text-[12.5px] font-bold text-[var(--text-muted)]">
              {senderLine(capsule)}
            </p>
            <h2 className="text-[20px] font-extrabold mt-1.5 break-keep">
              {capsule.title ||
                (capsule.openable ? '캡슐이 도착했어요' : '봉인된 타임캡슐')}
            </h2>
            <p className="text-[13px] text-gray-500 dark:text-white/55 mt-2 leading-[1.7]">
              {formatKoreanDate(capsule.sealed_at)}에 봉인
              {capsule.has_audio && ' · 🎙️ 음성 편지 포함'}
            </p>

            {capsule.openable ? (
              <button
                type="button"
                onClick={handleOpen}
                disabled={openCapsule.isPending || phase === 'opening'}
                className="mt-8 w-full py-4 rounded-2xl bg-brand text-white text-[15.5px] font-extrabold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-60"
              >
                {phase === 'opening' ? '봉투를 여는 중...' : '💌 봉투 열기'}
              </button>
            ) : (
              <>
                <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-100 dark:bg-white/[0.07]">
                  <span className="text-[13px] font-bold text-gray-600 dark:text-white/65">
                    개봉까지
                  </span>
                  <span className="text-[17px] font-extrabold text-brand tabular-nums">
                    D-{daysUntil(capsule.open_at)}
                  </span>
                </div>
                <p className="text-[12.5px] text-gray-400 dark:text-white/40 mt-3 leading-[1.7]">
                  {formatKoreanDate(capsule.open_at)}
                  {capsule.open_label ? ` (${capsule.open_label})` : ''} 아침에 열려요.
                  <br />
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
              </>
            )}
          </div>
        )}

        {/* 편지 */}
        {capsule && phase === 'letter' && content && (
          <div className="px-4 pt-6">
            <div className="capsule-letter-enter rounded-[24px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm overflow-hidden">
              {/* 편지 머리 */}
              <div className="px-6 pt-6 pb-4 border-b border-dashed border-gray-200 dark:border-white/[0.08]">
                <p className="text-[12px] font-bold text-[var(--text-muted)]">
                  {senderLine(capsule)}
                </p>
                <h2 className="text-[19px] font-extrabold mt-1 break-keep leading-[1.4]">
                  {content.title || capsule.title || '봉인됐던 편지'}
                </h2>
                <p className="text-[11.5px] text-gray-400 dark:text-white/40 mt-1.5">
                  {formatKoreanDate(capsule.sealed_at)} 봉인 →{' '}
                  {formatKoreanDate(capsule.open_at)} 개봉
                </p>
              </div>

              {/* 본문 */}
              {content.message && (
                <p className="px-6 py-5 text-[14.5px] leading-[1.9] whitespace-pre-wrap break-keep text-gray-800 dark:text-white/85">
                  {content.message}
                </p>
              )}

              {/* 음성 */}
              {content.audio_url && (
                <div className="px-6 pb-5 pt-1">
                  <p className="text-[12px] font-bold text-[var(--text-muted)] mb-2">
                    🎙️ 그날의 목소리
                    {content.audio_duration ? ` · ${content.audio_duration}초` : ''}
                  </p>
                  <audio controls src={content.audio_url} className="w-full" preload="metadata" />
                </div>
              )}
            </div>

            {/* 봉인하던 그날 스냅샷 */}
            {snapshot && (
              <div className="capsule-letter-enter capsule-letter-enter--delayed mt-4 rounded-[24px] bg-[var(--brand-soft)] px-6 py-5">
                <p className="text-[12px] font-bold text-brand">
                  🗓️ 봉인하던 그날 — {snapshot.sealed_date ? formatKoreanDate(snapshot.sealed_date) : ''}
                  {snapshot.season_label ? ` · ${snapshot.season_label}` : ''}
                </p>
                {snapshot.verse_text && (
                  <p className="mt-2.5 text-[13.5px] leading-[1.8] text-gray-800 dark:text-white/85 break-keep">
                    “{snapshot.verse_text}”
                    {snapshot.verse_reference && (
                      <span className="block mt-1 text-[12px] text-gray-500 dark:text-white/50">
                        — {snapshot.verse_reference}
                      </span>
                    )}
                  </p>
                )}
                {stats && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {stats.meditation_streak != null && stats.meditation_streak > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/[0.08] text-[11.5px] font-bold text-gray-700 dark:text-white/70">
                        🔥 묵상 {stats.meditation_streak}일 연속 중
                      </span>
                    )}
                    {stats.verses_read != null && stats.verses_read > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/[0.08] text-[11.5px] font-bold text-gray-700 dark:text-white/70">
                        📖 말씀 {stats.verses_read.toLocaleString()}절
                      </span>
                    )}
                    {stats.prayers != null && stats.prayers > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/[0.08] text-[11.5px] font-bold text-gray-700 dark:text-white/70">
                        🙏 기도 {stats.prayers}개
                      </span>
                    )}
                    {stats.thanks != null && stats.thanks > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/[0.08] text-[11.5px] font-bold text-gray-700 dark:text-white/70">
                        💛 감사 {stats.thanks}개
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 답장 체인 — 개봉이 다음 봉인의 입구 */}
            <div className="capsule-letter-enter capsule-letter-enter--delayed mt-5 text-center">
              <p className="text-[12.5px] text-gray-500 dark:text-white/50 leading-[1.7]">
                편지를 읽은 지금의 마음, 그대로 흘려보내긴 아깝지 않나요?
              </p>
              <button
                type="button"
                onClick={() => navigate('/capsule/new')}
                className="mt-3 w-full py-3.5 rounded-2xl bg-brand text-white text-[14.5px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)]"
              >
                ✍️ 다음 캡슐 이어서 봉인하기
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
    </div>
  )
}

export default CapsuleOpen
