import type { CSSProperties } from "react";
import type { NaturalSeason } from "../../utils/naturalSeason";
import "./heroFalling.css";

/**
 * 오시는 길(/visit) 히어로와 소개(/about) 초대장이 같이 쓴다 — 스타일은 이 부품이 직접 가져온다.
 * 히어로에 내려앉는 것들(라이트 전용, 2026-11-15, heroFalling.css .visit-hero-fall)
 *   봄 = 벚꽃잎(오른쪽 위 벚나무에서) · 가을 = 낙엽(오른쪽 위 단풍나무에서) · 겨울 = 눈송이(하늘 전체에서)
 *   여름은 없다. 다크는 별똥별(HeroWalk)만.
 * 바닥(무대 아래 끝)에 닿으면 잠깐 머물렀다 스러진다. 잎·꽃잎은 납작하게 눕고, 눈은 그대로 녹는다.
 * 낙엽·꽃잎은 글자(왼쪽)를 가리지 않게 무대 오른쪽에서 출발, 바람은 왼쪽으로(drift 음수).
 * 하나 = 세 겹: 낙하(세로·바람) / 흔들림(좌우 진자) / 팔랑임(3D 뒤집힘, 눈은 없음) — 같은 주기 안에서 착지 뒤엔 멈춘다.
 *   x: 출발 무대 %, drift: 바람에 밀리는 px, sway: 진자 폭 px, dur: 한 주기 s, delay: 첫 등장 s,
 *   size: px, land: 착지 높이 무대 %(바닥 원근 — 조금씩 다르게), pc: PC 에서만(모바일 작은 카드는 덜어 낸다)
 */
type Kind = "ginkgo" | "oval" | "petal" | "snow";
type Bit = {
  x: number;
  drift: number;
  sway: number;
  dur: number;
  delay: number;
  size: number;
  kind: Kind;
  color: string;
  land: number;
  pc?: true;
};
type FallSeason = Extract<NaturalSeason, "spring" | "autumn" | "winter">;

const AUTUMN: readonly Bit[] = [
  {
    x: 88,
    drift: -70,
    sway: 22,
    dur: 9.5,
    delay: 0.1,
    size: 15,
    kind: "oval",
    color: "#d9542a",
    land: 95,
  },
  {
    x: 95,
    drift: -110,
    sway: 28,
    dur: 11,
    delay: 1.4,
    size: 13,
    kind: "ginkgo",
    color: "#f0bd26",
    land: 97,
  },
  {
    x: 79,
    drift: -60,
    sway: 18,
    dur: 10,
    delay: 3.2,
    size: 12,
    kind: "oval",
    color: "#ec8a2a",
    land: 93,
  },
  {
    x: 98,
    drift: -150,
    sway: 30,
    dur: 12,
    delay: 4.6,
    size: 14,
    kind: "oval",
    color: "#b8402a",
    land: 96,
    pc: true,
  },
  {
    x: 70,
    drift: -50,
    sway: 20,
    dur: 10.5,
    delay: 6.1,
    size: 12,
    kind: "ginkgo",
    color: "#e8b01c",
    land: 94,
  },
  {
    x: 91,
    drift: -90,
    sway: 24,
    dur: 9,
    delay: 7.8,
    size: 11,
    kind: "oval",
    color: "#e0702c",
    land: 98,
    pc: true,
  },
  {
    x: 58,
    drift: -40,
    sway: 16,
    dur: 11.5,
    delay: 9.3,
    size: 12,
    kind: "oval",
    color: "#c94a28",
    land: 95,
    pc: true,
  },
];

/* 벚꽃잎 — 잎보다 작고 가벼워 더 오래 떠 있고, 바람에 더 멀리 밀린다 */
const SPRING: readonly Bit[] = [
  {
    x: 86,
    drift: -120,
    sway: 26,
    dur: 11,
    delay: 0.1,
    size: 10,
    kind: "petal",
    color: "#f9c3d3",
    land: 94,
  },
  {
    x: 95,
    drift: -170,
    sway: 32,
    dur: 13,
    delay: 1.1,
    size: 9,
    kind: "petal",
    color: "#f4adc2",
    land: 97,
  },
  {
    x: 74,
    drift: -90,
    sway: 22,
    dur: 12,
    delay: 2.4,
    size: 8,
    kind: "petal",
    color: "#fde0e8",
    land: 92,
  },
  {
    x: 99,
    drift: -200,
    sway: 34,
    dur: 14,
    delay: 3.6,
    size: 10,
    kind: "petal",
    color: "#f7b8ca",
    land: 96,
    pc: true,
  },
  {
    x: 81,
    drift: -110,
    sway: 24,
    dur: 11.5,
    delay: 5,
    size: 8,
    kind: "petal",
    color: "#fbd2de",
    land: 95,
  },
  {
    x: 92,
    drift: -140,
    sway: 28,
    dur: 12.5,
    delay: 6.3,
    size: 9,
    kind: "petal",
    color: "#f4adc2",
    land: 98,
    pc: true,
  },
  {
    x: 66,
    drift: -80,
    sway: 20,
    dur: 13,
    delay: 7.7,
    size: 8,
    kind: "petal",
    color: "#f9c3d3",
    land: 93,
    pc: true,
  },
  {
    x: 97,
    drift: -160,
    sway: 30,
    dur: 12,
    delay: 9,
    size: 9,
    kind: "petal",
    color: "#fde0e8",
    land: 96,
  },
  {
    x: 84,
    drift: -130,
    sway: 26,
    dur: 14,
    delay: 10.4,
    size: 10,
    kind: "petal",
    color: "#f7b8ca",
    land: 95,
    pc: true,
  },
];

/* 눈송이 — 하늘 전체에서 천천히, 흔들림은 잔잔하게. 크기·속도를 섞어 원근을 낸다(작을수록 느리게 = 멀리) */
const WINTER: readonly Bit[] = [
  {
    x: 8,
    drift: -14,
    sway: 10,
    dur: 14,
    delay: 0.1,
    size: 5,
    kind: "snow",
    color: "#fff",
    land: 96,
  },
  {
    x: 22,
    drift: -20,
    sway: 12,
    dur: 12,
    delay: 1.6,
    size: 6,
    kind: "snow",
    color: "#fff",
    land: 97,
    pc: true,
  },
  {
    x: 36,
    drift: -10,
    sway: 8,
    dur: 16,
    delay: 0.8,
    size: 4,
    kind: "snow",
    color: "#fff",
    land: 95,
  },
  {
    x: 47,
    drift: -18,
    sway: 12,
    dur: 13,
    delay: 3.4,
    size: 6,
    kind: "snow",
    color: "#fff",
    land: 98,
    pc: true,
  },
  {
    x: 55,
    drift: -12,
    sway: 10,
    dur: 15,
    delay: 2.2,
    size: 5,
    kind: "snow",
    color: "#fff",
    land: 96,
  },
  {
    x: 63,
    drift: -22,
    sway: 14,
    dur: 11,
    delay: 5,
    size: 7,
    kind: "snow",
    color: "#fff",
    land: 97,
    pc: true,
  },
  {
    x: 71,
    drift: -14,
    sway: 10,
    dur: 14.5,
    delay: 0.4,
    size: 5,
    kind: "snow",
    color: "#fff",
    land: 95,
  },
  {
    x: 79,
    drift: -20,
    sway: 12,
    dur: 12.5,
    delay: 4.1,
    size: 6,
    kind: "snow",
    color: "#fff",
    land: 98,
  },
  {
    x: 86,
    drift: -10,
    sway: 8,
    dur: 17,
    delay: 6.4,
    size: 4,
    kind: "snow",
    color: "#fff",
    land: 94,
    pc: true,
  },
  {
    x: 93,
    drift: -18,
    sway: 12,
    dur: 13.5,
    delay: 1.2,
    size: 6,
    kind: "snow",
    color: "#fff",
    land: 97,
  },
  {
    x: 15,
    drift: -16,
    sway: 10,
    dur: 15.5,
    delay: 7.2,
    size: 5,
    kind: "snow",
    color: "#fff",
    land: 96,
    pc: true,
  },
  {
    x: 41,
    drift: -20,
    sway: 14,
    dur: 12,
    delay: 8.5,
    size: 7,
    kind: "snow",
    color: "#fff",
    land: 98,
    pc: true,
  },
  {
    x: 98,
    drift: -14,
    sway: 10,
    dur: 14,
    delay: 9.6,
    size: 5,
    kind: "snow",
    color: "#fff",
    land: 95,
  },
  {
    x: 59,
    drift: -12,
    sway: 8,
    dur: 16.5,
    delay: 10.8,
    size: 4,
    kind: "snow",
    color: "#fff",
    land: 96,
    pc: true,
  },
];

const BITS: Record<FallSeason, readonly Bit[]> = {
  spring: SPRING,
  autumn: AUTUMN,
  winter: WINTER,
};

const Shape = ({ kind, color }: Pick<Bit, "kind" | "color">) => {
  if (kind === "snow") return null; // 눈은 CSS 동그라미(.visit-fall-flutter 배경)
  if (kind === "ginkgo")
    return (
      <svg viewBox="0 0 20 20" width="100%" height="100%">
        <path
          d="M10 13C6 12.4 1.2 8.6 1.4 4.2 4.4 2.2 7.4 3 9.6 4.8L10 6.4 10.4 4.8C12.6 3 15.6 2.2 18.6 4.2 18.8 8.6 14 12.4 10 13Z"
          fill={color}
        />
        <path
          d="M10 12.6V19.4"
          stroke={color}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    );
  if (kind === "petal")
    // 벚꽃잎 — 끝이 살짝 갈라진 하트꼴, 밑동 쪽이 조금 진하다
    return (
      <svg viewBox="0 0 20 20" width="100%" height="100%">
        <path
          d="M10 4.4 8.4 1.6C4.6 3.2 3.4 10 7 16.2 8.6 18.6 11.4 18.6 13 16.2 16.6 10 15.4 3.2 11.6 1.6Z"
          fill={color}
        />
        <path
          d="M10 18C8.6 16.6 8.8 13.8 10 12.6 11.2 13.8 11.4 16.6 10 18Z"
          fill="rgba(226, 110, 150, 0.35)"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 20 20" width="100%" height="100%">
      <path d="M10 1C15.4 5 16.2 12 10 17.6 3.8 12 4.6 5 10 1Z" fill={color} />
      <path
        d="M10 3.2V19.4"
        stroke="rgba(90, 30, 10, 0.35)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

/** season 이 여름·없음이면 아무것도 안 그린다 */
const HeroFalling = ({ season }: { season?: NaturalSeason }) =>
  !season || season === "summer" ? null : (
    <div
      className={`visit-hero-fall visit-hero-fall--${season}`}
      aria-hidden="true"
    >
      {BITS[season].map((b, i) => (
        <span
          key={i}
          className={`visit-fall${b.pc ? " is-pc-only" : ""}`}
          style={
            {
              left: `${b.x}%`,
              height: `${b.land}%`,
              "--fall-drift": `${b.drift}px`,
              "--fall-sway": `${b.sway}px`,
              "--fall-dur": `${b.dur}s`,
              "--fall-delay": `${b.delay}s`,
              "--fall-size": `${b.size}px`,
            } as CSSProperties
          }
        >
          <span className="visit-fall-sway">
            <span className="visit-fall-flutter">
              <Shape kind={b.kind} color={b.color} />
            </span>
          </span>
        </span>
      ))}
    </div>
  );

export default HeroFalling;
