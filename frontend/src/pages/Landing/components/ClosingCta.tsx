import { useNavigate } from 'react-router-dom'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { ChevronRightIcon, MapPinIcon, SproutIcon } from '../../About/icons'
import { Reveal } from './shared'

// 마무리 — 두 갈래. 여기서만 가입 버튼이 주연이 된다.
const ClosingCta = ({ ko }: { ko: boolean }) => {
  const navigate = useNavigate()
  const { tx } = useAboutContent()
  return (
    <section className="mt-16">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal className="h-full">
          <div className="feed-card rounded-3xl p-6 lg:p-8 h-full flex flex-col">
            <span className="w-11 h-11 rounded-2xl bg-[var(--brand-soft)] text-brand flex items-center justify-center"><MapPinIcon size={20} /></span>
            <h2 className="mt-4 text-[22px] font-extrabold tracking-tight text-ink-strong leading-tight">
              {ko ? '일단 한 번 와보세요' : 'Just come once'}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              {ko
                ? '설명이 길었죠. 직접 오시면 10분이면 압니다.\n새가족실에서 커피 한 잔 드리고, 원하시면 교회 안내도 해드려요. 주차 됩니다.'
                : "That was a lot of words. Come once and you'll know in ten minutes.\nCoffee in the newcomers' room, a tour if you'd like. Parking available."}
            </p>
            <dl className="mt-4 grid gap-1.5 text-[13.5px]">
              <div className="flex gap-2"><dt className="w-16 shrink-0 font-bold text-ink-muted">{ko ? '주일' : 'Sunday'}</dt><dd className="font-semibold text-ink-strong">{tx('aboutInfoWorship')}</dd></div>
              <div className="flex gap-2"><dt className="w-16 shrink-0 font-bold text-ink-muted">{ko ? '위치' : 'Where'}</dt><dd className="font-semibold text-ink-strong">{tx('aboutAddress')}</dd></div>
            </dl>
            <div className="mt-auto pt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate('/visit')} className="brand-gradient inline-flex items-center gap-1 px-5 py-3 rounded-full text-[14px] font-bold text-white shadow-[0_6px_16px_-4px_var(--brand-glow)]">
                {ko ? '오시는 길' : 'Directions'}<ChevronRightIcon size={15} />
              </button>
              <button type="button" onClick={() => navigate('/about')} className="px-5 py-3 rounded-full text-[14px] font-bold text-ink-strong ring-1 ring-inset ring-black/[0.08] dark:ring-white/[0.12] hover:bg-[var(--brand-soft)] hover:text-brand">
                {ko ? '교회 소개' : 'About us'}
              </button>
            </div>
          </div>
        </Reveal>
        <Reveal className="h-full" delay={80}>
          <div className="rounded-3xl p-6 lg:p-8 h-full flex flex-col brand-gradient text-white">
            <span className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center"><SproutIcon size={20} /></span>
            <h2 className="mt-4 text-[22px] font-extrabold tracking-tight leading-tight">
              {ko ? '앱으로 먼저 만날게요' : "I'll start with the app"}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-white/85">
              {ko
                ? '가입하면 통독표·기도 커뮤니티·설교 아멘·칭호가 전부 내 것이 됩니다.\n1분이면 끝나요. 성경 일독은 1년 걸리지만요.'
                : 'Sign up and the stamp chart, prayer community, sermon amens and titles are all yours.\nTakes a minute. (The Bible takes a year.)'}
            </p>
            <div className="mt-auto pt-5 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => navigate('/register')} className="inline-flex items-center gap-1 px-5 py-3 rounded-full text-[14px] font-bold bg-white text-brand shadow-lg active:scale-[0.97] transition-transform">
                {ko ? '함께 시작하기' : 'Get started'}<ChevronRightIcon size={15} />
              </button>
              <button type="button" onClick={() => navigate('/login')} className="px-4 py-3 rounded-full text-[14px] font-bold text-white ring-1 ring-inset ring-white/40 hover:bg-white/10">
                {ko ? '로그인' : 'Log in'}
              </button>
              <button type="button" onClick={() => navigate('/feed')} className="px-2 py-3 text-[13.5px] font-semibold text-white/80 hover:text-white">
                {ko ? '먼저 둘러볼게요' : 'Just browsing'}
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default ClosingCta
