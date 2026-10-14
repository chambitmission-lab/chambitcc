/* 장 로딩 장면 카드(ChapterQuipLoader)의 장면 7장 — 사람·소품 없이 풍경과 빛만.
 * 정적 SVG 문자열이라 dangerouslySetInnerHTML 로 넣는다(사용자 입력 없음).
 * 클래스·색 변수는 cqs- 접두사(애니메이션은 styles/chapter-quip-loader.css).
 * 문구는 refKo 로 utils/waitingQuips 에서 찾아 홈 묵상 카드와 같은 문장을 쓴다.
 * 그라데이션·필터 id 는 인스턴스마다 u 접미사로 충돌을 피한다. */

export interface ChapterScene {
  key: string
  chipKo: string
  chipEn: string
  /** 우상단 큰 숫자(0부터 올라간다) — 없으면 숫자 없이 */
  big?: number
  unitKo?: string
  unitEn?: string
  /** WAITING_QUIPS 의 refKo — 문구 조회 키 */
  refKo: string
  svg: (u: string) => string
}

const V = 'viewBox="0 0 300 170" preserveAspectRatio="xMidYMid slice"';
const cloud = (x: number, y: number, s: number, o = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="var(--cqs-cloud)" opacity="${o}"><ellipse cx="0" cy="0" rx="20" ry="8"/><ellipse cx="15" cy="-6" rx="14" ry="9"/><ellipse cx="31" cy="0" rx="17" ry="7"/></g>`;
const clouds = (y = 0) => `<g class="cqs-drift cqs-slow">${cloud(40, 34 + y, .7, .7)}${cloud(210, 24 + y, .6, .7)}${cloud(340, 34 + y, .7, .7)}${cloud(510, 24 + y, .6, .7)}</g>
  <g class="cqs-drift">${cloud(100, 52 + y, 1)}${cloud(250, 44 + y, .8)}${cloud(400, 52 + y, 1)}${cloud(550, 44 + y, .8)}</g>`;
const wave = (y: number, a: number) => { let d = `M-60 ${y}`; for (let x = -60; x < 420; x += 60) d += ` q15 ${-a} 30 0 t30 0`; return d + ` V200 H-60z`; };
const bird = (fill: string, s = 1) => `<g transform="scale(${s})"><ellipse cx="0" cy="0" rx="13" ry="6" fill="${fill}"/><circle cx="11" cy="-3" r="4.6" fill="${fill}"/><path d="M15 -3 l7 1.6 l-7 1.6z" fill="var(--cqs-sun)"/><path class="cqs-flap" d="M-3 -1 q-8 -18 -20 -13 q10 6 13 13z" fill="${fill}"/></g>`;

export const CHAPTER_SCENES: ChapterScene[] = [
  { key: 'ark', chipKo: '노아의 방주', chipEn: "Noah's Ark", big: 1, unitKo: '년+', unitEn: 'yr+', refKo: '창세기 8:13-14',
    svg: (u: string) => `<svg ${V}><defs><radialGradient id="sun${u}"><stop offset="0" stop-color="var(--cqs-sun)" stop-opacity=".9"/><stop offset="1" stop-color="var(--cqs-sun)" stop-opacity="0"/></radialGradient></defs>
      <circle class="cqs-glow" cx="236" cy="46" r="44" fill="url(#sun${u})"/>${clouds()}
      <path class="cqs-s3" d="${wave(118, 5)}" fill="var(--cqs-sea-3)"/>
      <g class="cqs-bob"><g class="cqs-giraffe"><rect x="166" y="48" width="7" height="34" rx="3" fill="var(--cqs-sun)"/><ellipse cx="174" cy="48" rx="9" ry="6" fill="var(--cqs-sun)"/><circle cx="177" cy="46" r="1.6" fill="#2b2f36"/><rect x="166" y="38" width="2" height="7" fill="var(--cqs-wood-2)"/><rect x="171" y="38" width="2" height="7" fill="var(--cqs-wood-2)"/><circle cx="168" cy="60" r="1.6" fill="var(--cqs-wood)"/><circle cx="171" cy="70" r="1.4" fill="var(--cqs-wood)"/></g><rect x="114" y="80" width="72" height="28" rx="4" fill="var(--cqs-wood-2)"/><path d="M106 82 L150 60 L194 82 z" fill="var(--cqs-wood)"/>
        <rect x="126" y="88" width="10" height="10" rx="2" fill="var(--cqs-sun)"/><rect x="144" y="88" width="10" height="10" rx="2" fill="var(--cqs-sun)"/><rect x="162" y="88" width="10" height="10" rx="2" fill="var(--cqs-sun)"/>
        <path d="M88 106 h124 l-16 26 h-92 z" fill="var(--cqs-wood)"/><path d="M96 116 h108" stroke="var(--cqs-wood-2)" stroke-width="2" opacity=".6"/></g>
      <g class="cqs-glide cqs-early"><g>${bird('#fff', .85)}<path d="M18 0 q6 2 9 -2" stroke="var(--cqs-leaf)" stroke-width="2" fill="none"/><ellipse cx="27" cy="-3" rx="3.4" ry="1.7" fill="var(--cqs-leaf)"/></g></g>
      <path class="cqs-s2" d="${wave(132, 7)}" fill="var(--cqs-sea-2)" opacity=".9"/><path class="cqs-s1" d="${wave(146, 6)}" fill="var(--cqs-sea)"/></svg>` },

  { key: 'stars', chipKo: '아브라함의 별', chipEn: "Abraham's Stars", big: 25, unitKo: '년', unitEn: 'yrs', refKo: '창세기 12:4 · 21:5',
    svg: (u: string) => {
      const pts = [[30,22],[58,48],[84,18],[110,40],[134,14],[160,34],[186,20],[212,44],[238,16],[266,34],[290,18],[46,70],[96,64],[150,58],[200,70],[252,62],[20,48],[124,80],[178,86],[226,90],[276,78],[70,92]];
      return `<svg ${V}><defs><linearGradient id="n${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1730"/><stop offset=".7" stop-color="#22385f"/><stop offset="1" stop-color="#3b4f78"/></linearGradient>
        <radialGradient id="tg${u}"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
      <rect width="300" height="170" fill="url(#n${u})"/>
      ${pts.map(([x, y], k) => `<g class="cqs-pop-star" style="animation-delay:${(0.08 + k * 0.035).toFixed(2)}s"><circle class="cqs-tw" cx="${x}" cy="${y}" r="${k % 5 === 0 ? 1.9 : 1.2}" fill="#fff" style="animation-delay:${(-k * .3).toFixed(1)}s"/></g>`).join('')}
      <g class="cqs-shoot"><path d="M250 20 l18 -9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>
      <path d="M0 132 q60 -26 130 -10 t170 -14 v62 h-300z" fill="#1a2945"/><path d="M0 146 q90 -16 180 -4 t120 -4 v40 h-300z" fill="#131f36"/>
      <circle class="cqs-glow" cx="92" cy="132" r="22" fill="url(#tg${u})"/><path d="M78 140 L92 118 L106 140 z" fill="#2a3a5c"/><path d="M89 140 L92 130 L95 140 z" fill="#ffd27a"/></svg>`; } },

  { key: 'jonah', chipKo: '요나', chipEn: "Jonah", big: 3, unitKo: '일', unitEn: 'days', refKo: '요나 1:17',
    svg: () => `<svg ${V}>${clouds(4)}
      <path class="cqs-s3" d="${wave(110, 5)}" fill="var(--cqs-sea-3)"/>
      <g transform="translate(0 -10)">
      ${[0,1,2,3].map(() => `<circle class="cqs-drop" cx="170" cy="78" r="3.2" fill="var(--cqs-sea-2)"/>`).join('')}
      <g class="cqs-bob"><path d="M86 130 q8 -50 84 -50 q56 0 62 40 q4 22 -28 26 h-104 q-18 0 -14 -16z" fill="var(--cqs-sea)"/>
      <path d="M228 118 l34 -22 q5 16 -6 25 q14 5 11 21 l-39 -12z" fill="var(--cqs-sea)"/><circle cx="116" cy="110" r="5" fill="#fff"/><circle cx="117.5" cy="110" r="2.4" fill="#2b2f36"/>
      <path d="M100 130 q34 12 72 4" stroke="#fff" stroke-width="2.4" fill="none" opacity=".55"/><path d="M104 120 q6 4 12 0" stroke="#2b2f36" stroke-width="2" fill="none" stroke-linecap="round"/></g>
      ${[0,1,2].map(k => `<circle class="cqs-bubble" cx="${120 + k * 40}" cy="164" r="${2 + k}" fill="none" stroke="#fff" stroke-width="1.4"/>`).join('')}</g>
      <path class="cqs-s2" d="${wave(136, 6)}" fill="var(--cqs-sea-2)" opacity=".88"/><path class="cqs-s1" d="${wave(150, 5)}" fill="var(--cqs-sea)"/></svg>` },

  { key: 'wild', chipKo: '광야', chipEn: "Wilderness", big: 40, unitKo: '년', unitEn: 'yrs', refKo: '민수기 14:33',
    svg: (u: string) => `<svg ${V}><defs><linearGradient id="pc${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity=".15"/></linearGradient>
      <filter id="bl${u}" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="3"/></filter></defs>
      <circle class="cqs-glow" cx="54" cy="40" r="16" fill="var(--cqs-sun)"/>
      <path d="M0 108 q80 -30 160 -8 t140 -10 v80 h-300z" fill="var(--cqs-sand-3)"/>
      <g class="cqs-rise"><g class="cqs-pillar" filter="url(#bl${u})"><ellipse cx="214" cy="40" rx="20" ry="13" fill="url(#pc${u})"/><rect x="200" y="40" width="28" height="78" rx="14" fill="url(#pc${u})"/></g></g>
      <path d="M0 124 q90 -26 180 -6 t120 -6 v60 h-300z" fill="var(--cqs-sand-2)"/>
      <g fill="var(--cqs-sand-3)" opacity=".9"><path d="M96 124 l10 -14 l10 14z"/><path d="M118 126 l8 -11 l8 11z"/><path d="M140 125 l9 -12 l9 12z"/><path d="M162 127 l7 -9 l7 9z"/></g>
      <path d="M0 142 q100 -18 200 -4 t100 -2 v40 h-300z" fill="var(--cqs-sand)"/>
      <g class="cqs-haze"><path d="M24 116 q10 -4 20 0 t20 0 M150 106 q10 -4 20 0 t20 0 M232 120 q10 -4 20 0 t20 0" stroke="#fff" stroke-width="1.5" fill="none"/></g></svg>` },

  { key: 'dawn', chipKo: '파수꾼의 새벽', chipEn: "Watchman at Dawn", refKo: '시편 130:6',
    svg: (u: string) => `<svg ${V}><defs><linearGradient id="d0${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2b4f"/><stop offset="1" stop-color="#3a4d78"/></linearGradient>
      <linearGradient id="d1${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e8fd0"/><stop offset=".6" stop-color="#f5b38a"/><stop offset="1" stop-color="#ffd9a0"/></linearGradient>
      <radialGradient id="ds${u}"><stop offset="0" stop-color="#fff2c4"/><stop offset=".35" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffb061" stop-opacity="0"/></radialGradient></defs>
      <rect width="300" height="170" fill="url(#d0${u})"/><rect class="cqs-dawn" width="300" height="170" fill="url(#d1${u})"/>
      <g class="cqs-sunup"><circle cx="196" cy="118" r="54" fill="url(#ds${u})"/><circle cx="196" cy="118" r="14" fill="#fff6d6"/></g>
      <path d="M0 116 h300 v60 h-300z" fill="#2b3556"/>
      <g fill="#222b48"><rect x="0" y="104" width="300" height="20"/>${Array.from({ length: 16 }, (_, k) => `<rect x="${k * 20 + 4}" y="98" width="10" height="8"/>`).join('')}
        <rect x="64" y="66" width="30" height="58"/><rect x="60" y="60" width="38" height="10"/>${[0, 1, 2].map(k => `<rect x="${60 + k * 14}" y="54" width="8" height="8"/>`).join('')}</g>
      <rect x="74" y="78" width="10" height="12" rx="5" fill="#ffd27a" class="cqs-flicker"/>
      <path d="M0 140 q150 -10 300 0 v40 h-300z" fill="#1b2340"/></svg>` },

  { key: 'eagle', chipKo: '독수리 날개', chipEn: "Eagles' Wings", refKo: '이사야 40:31',
    svg: (u: string) => `<svg ${V}><defs><linearGradient id="m${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/></linearGradient></defs>
      <circle class="cqs-glow" cx="70" cy="44" r="18" fill="var(--cqs-sun)" opacity=".9"/>${clouds(-6)}
      <path d="M0 120 L50 70 L84 98 L130 48 L176 100 L214 66 L262 108 L300 84 V170 H0z" fill="var(--cqs-hill)"/>
      <path d="M130 48 L118 62 L126 60 L130 66 L136 58 L142 62z M50 70 L42 80 L52 78 L58 82z" fill="#fff" opacity=".85"/>
      <g class="cqs-mist"><rect x="-20" y="100" width="340" height="40" fill="url(#m${u})"/></g>
      <path d="M0 142 L60 110 L110 132 L170 104 L230 134 L300 112 V170 H0z" fill="var(--cqs-hill-2)"/>
      <g class="cqs-soar"><g transform="scale(1.15)">
        <g class="cqs-wingL"><path d="M-3 -1 C-10 -9 -22 -11 -36 -7 L-32 -4.5 L-37 -2.5 L-32.5 -1 L-36 1.8 L-31 1.6 L-33 4.6 L-26 3 C-18 4 -9 4 -3 4 Z" fill="#4a3627"/></g>
        <g class="cqs-wingR"><path d="M3 -1 C10 -9 22 -11 36 -7 L32 -4.5 L37 -2.5 L32.5 -1 L36 1.8 L31 1.6 L33 4.6 L26 3 C18 4 9 4 3 4 Z" fill="#4a3627"/></g>
        <path d="M-3.6 7 L-6 15 Q0 17 6 15 L3.6 7 Z" fill="#f4f1ea"/>
        <ellipse cx="0" cy="2" rx="4.2" ry="7" fill="#4a3627"/>
        <circle cx="0" cy="-6" r="3.6" fill="#f4f1ea"/><path d="M-1.3 -4.2 L0 -1.6 L1.3 -4.2 Z" fill="var(--cqs-sun)"/></g></g></svg>` },

  { key: 'raven', chipKo: '그릿 시냇가', chipEn: "Brook Cherith", refKo: '열왕기상 17:6',
    svg: () => `<svg ${V}>${clouds()}
      <path d="M0 104 q70 -24 150 -6 t150 -10 v80 h-300z" fill="var(--cqs-sand-2)"/>
      <path d="M0 118 q60 -6 110 4 q40 8 80 0 q60 -12 110 -4 v60 h-300z" fill="var(--cqs-sand)"/>
      <path d="M-10 140 q80 -14 160 -2 t170 -6 v18 q-80 -6 -170 8 t-160 0z" fill="var(--cqs-sea-2)"/>
      <ellipse class="cqs-ripple" cx="110" cy="141" rx="14" ry="3" fill="none" stroke="#fff" stroke-width="1.2"/><ellipse class="cqs-ripple cqs-r2" cx="206" cy="137" rx="12" ry="2.6" fill="none" stroke="#fff" stroke-width="1.2"/>
      <g fill="var(--cqs-rock)"><ellipse cx="40" cy="132" rx="24" ry="12"/><ellipse cx="262" cy="128" rx="30" ry="14"/></g><g fill="var(--cqs-rock-2)"><ellipse cx="56" cy="136" rx="12" ry="7"/><ellipse cx="240" cy="134" rx="14" ry="7"/></g>
      <g class="cqs-glide"><g>${bird('#2b2f36', 1)}<ellipse cx="25" cy="3" rx="7.5" ry="4.6" fill="var(--cqs-wood)"/><path d="M20 2 h10" stroke="var(--cqs-wood-2)" stroke-width="1.2"/></g></g></svg>` },
];
