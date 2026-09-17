# 신앙 여정 히어로 배경 이미지 프롬프트 (Gemini용)

`/growth` 맨 위 **「나의 신앙 여정」 히어로**(`src/pages/Growth/components/GrowthHero.tsx` —
새싹 엠블럼 + `나의 신앙 여정` 라벨 + 큰 숫자 `223 일째` + 헤드라인 + 보조 문구) 뒤에 깔 배경.

> **★ 2026-09-17 적용 완료 — 세 장면을 시간대로 돌린다.** A·B·C 세 안을 다 뽑아 보고 모두 채택해서,
> **같은 능선을 시간대별로 갈아 끼우는 6장**(시간대 3 × 테마 2)으로 붙였다.
> 오전=A안 발자국 · 오후=C안 능선(미니멀) · 저녁=B안 등불.
> 시간대 판정은 홈 묵상 카드와 같은 `deriveTimeOfDay`(오전 4~11 · 오후 11~17 · 저녁 17~4).
> 자세한 것은 [적용 상태](#적용-상태-2026-09-17) 참고. 아래 프롬프트·제약은 다시 뽑을 때 그대로 유효하다.

컨셉은 칭호·이어읽기·플랜·감사·묵상방·타임캡슐 배경과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 **"능선 위에서 지나온 발자국을 돌아보는 양"**(메인).

유머는 **보폭 차이**에서 나온다 — 큰 양의 발자국을 정확히 하나씩 밟아 보려는 새끼양이
다리를 한껏 벌린 채 한 발을 공중에 띄우고 있다. 표정은 더없이 진지하다.
이 화면이 파는 값(**함께한 일수 · 연속 기록 · 지난 발자취**)이 그대로 그림이 된다 —
줄줄이 남은 발굽 자국이 일수, 한 번 빙 돌아버린 자국이 흔들렸던 날, 그 자리에 핀 꽃이 그날의 은혜다.

## 왜 바꾸나 (2026-09-17)

지금 히어로는 `src/assets/hero/morning.webp` **실사 일출 사진 한 장**(스카이섬 능선)을
라이트·다크가 공용으로 쓴다. 세 가지가 어긋난다.

- **문법이 다르다.** 앱의 히어로·카드 배경은 전부 같은 양 캐릭터의 동화풍 삽화인데 이 화면만 사진이다.
- **자기 그림이 아니다.** 같은 파일을 **홈 묵상 카드**(`DailyMeditationCard.tsx` 의 여름 아침 히어로)가
  이미 쓰고 있다. 홈에서 보던 사진이 여정 화면에도 떠서, 이 화면만의 장면이 없다.
- 라이트·다크가 **같은 그림**이라 테마를 토글해도 아무 일도 일어나지 않는다.

> ★ **`src/assets/hero/morning.webp` 는 지우지 말 것.** 홈 묵상 카드가 계속 쓴다.
> `/growth` 만 새 삽화 2장으로 갈아탄다. (감사 히어로 때 `hero/gratitude.webp` 를 삭제한 것과 다르다 —
> 그건 쓰는 화면이 하나였다.)

---

## ★ 이 화면만의 제약 — 카드색에 녹이지 않는다, 풀블리드다

다른 히어로들(감사·소식·플랜·교육)은 **삽화가 카드색에 녹아들고 글씨는 테마 잉크**(라이트=남색,
다크=흰색)를 쓴다. **이 화면은 예외다.** 삽화가 카드를 가장자리까지 덮고, 글씨는 **두 테마 모두 흰색**,
그 사이에 대각선 스크림이 한 겹 들어간다. 지금 구조를 그대로 유지한다.

이유는 계산이다. 이 카드는 **글자가 가로를 거의 다 쓴다.**

| 요소 | 최장 실측 폭 | 모바일 카드(358) 기준 |
|---|---|---|
| 보조 문구 14px `53일 연속, 꾸준함이 신앙을 만들어가고 있어요` | **약 330px** | 카드 폭의 **92%** (≤390px 폰에서는 2줄로 감김) |
| 헤드라인 18px `걸음마다 은혜가 쌓이고 있어요` | 약 246px | 69% |

감사 히어로처럼 "오른쪽 20% 에 주인공, 왼쪽은 카드색"으로 가려면 **글자 오른쪽에 빈 20% 가 있어야** 하는데,
여기엔 그 자리가 없다. 그래서 주인공은 **오른쪽이 아니라 오른쪽 "위"** 에 세우고(글자는 아래 3/4 를 쓴다),
글씨는 스크림이 지킨다. 지금 사진이 우상단 해를 살려 둔 것과 같은 구조다
(`GrowthHero.tsx` 의 `// 텍스트가 좌측에 모이므로 우상단의 해는 그대로 살린다`).

**따라서 라이트 삽화도 하이키 파스텔이 아니다.** 흰 글씨가 올라가므로
**왼쪽·아래는 중간~어두운 톤**이고, 밝은 곳은 **우상단뿐**이다.
(감사·소식 문서의 "라이트는 거의 흰색" 규칙을 여기 가져오면 흰 글씨가 전멸한다.)

| | 카드 바탕 | 잉크 | 삽화 톤 | 유일한 광원 |
|---|---|---|---|---|
| **라이트** | 삽화 자체(풀블리드) | **흰 글씨** + 스크림 | 세이지-슬레이트 능선 + **우상단 크림-골드 동트는 빛** | 오른쪽 위 일출 |
| **다크** | 삽화 자체(풀블리드) | **흰 글씨** + 스크림 | 저채도 **웜 차콜** 밤 능선 | 오른쪽 위 **낮게 뜬 따뜻한 달** |

> ★ **다크는 남색이 아니다.** 칭호 도감(`public/images/title-bg/*.webp`)·`plans/hero-dark.webp` 의
> 남색 밤하늘(`#0A1428` 계열)을 그대로 가져오면 웜 차콜 캔버스(`#131313`/`#201f1f`) 위에서
> **파란 직사각형**으로 뜬다. 다크는 `home/live-reading-dark.webp` 와 같은 **따뜻한 회갈색 밤**이다.
>
> ★ **두 장은 "같은 능선의 다른 시각"이다.** 구도·발자국 줄·양의 자세·꽃 위치는 **완전히 같아야** 하고
> 빛만 바뀐다. 테마를 토글하면 **같은 길 위로 하루가 지나간다** — 이 화면에서는 그게 값이다.

> **다른 화면과 겹치지 말 것.**
> - 지팡이·배낭·케른(돌무더기)·예배당 창불은 **오디오북 고갯길**(`docs/audio-player-bg-prompts.md`)이다.
> - 산 정상·깃발·줄줄이 이어진 **빛의 길**은 칭호 도감 `hundred_days.webp` 다.
> - 펼친 큰 성경책은 `/rooms`·이어읽기, 유리 감사 항아리는 `/thanks`, 우체통은 `/capsule`.
>
> 이 화면의 소품은 **발굽 자국 + 들꽃 한 송이**(A안) 또는 **길가 말뚝의 작은 등불**(B안)뿐이다.
> 지팡이·배낭·깃발·표지판·울타리는 그리지 않는다.

---

## 사용법

1. Gemini에 **두 장**을 첨부한다.
   - **캐릭터 참조**: `public/images/title-bg/hundred_days.webp` (또는 `everest_climber.webp`)
     → "이 양 캐릭터와 완전히 같은 캐릭터로, 같은 화풍으로"
   - **명암 구조 참조**: `src/assets/hero/morning.webp` (지금 쓰는 일출 사진)
     → "이 사진의 명암 구조를 그대로 삽화로 옮겨서 — 왼쪽·아래는 어둡고 오른쪽 위만 밝게"
     (★ 색·질감이 아니라 **어디가 밝고 어디가 어두운지**만 가져오게 할 것)

   그 뒤 아래 프롬프트를 통째로 붙여넣는다.
   **한 세션에서 라이트 → 다크 순으로 이어서 뽑아야 톤이 맞는다.** 다크를 뽑을 때는
   라이트 결과물도 같이 첨부하고 `same ridge, same hoof prints, same poses, night instead of dawn`
   이라고 덧붙인다.
2. 비율은 **3.6:1** 로 요청하되, 3:1~4:1 사이로 나와도 그대로 받는다(후처리에서 폭만 맞춘다).
   받은 원본은 1968×544(3.618:1), 최종 규격은 **1536×425**.
3. 저장 위치 (파일명 고정 — CSS 가 이 경로를 참조한다). 시간대 3 × 테마 2 = 6장:
   `frontend/src/assets/growth/hero-{morning,afternoon,evening}-{light,dark}.webp`

   ★ `public/` 이 아니라 **`src/assets/`** 다. `public/` 은 URL 이 고정이라 `sw.js` 의
   stale-while-revalidate 가 옛 그림을 계속 내주고, 다시 구워 배포해도 화면이 안 바뀐다.
   `src/assets` 는 번들러가 콘텐츠 해시를 붙인다.
4. 후처리: 워터마크를 먼저 지우고 폭을 맞춘다. `~/Downloads/{1..6}.png` 로 두고

   ```
   export PYTHONIOENCODING=utf-8        # 콘솔이 cp949 면 ✦ 출력에서 죽는다
   for i in 1 2 3 4 5 6; do python docs/gemini-unwatermark.py ~/Downloads/$i.png ~/Downloads/$i-clean.png; done
   python docs/growth-hero-process.py   # -clean 이 있으면 그걸 집는다
   ```

   `growth-hero-process.py` 가 1536 폭 webp 저장 + **시간대별 재배치**(`PLAN`) +
   글자 자리·주인공 광원 밝기 실측까지 한 번에 한다. 한 장 6~9KB 로 떨어진다.
   ★ 받은 순서가 장면 순이 아니다 — 스크립트의 `PLAN` 이 다시 묶는다(아래 [적용 상태](#적용-상태-2026-09-17) 표).
   **밝기 합격선은 감사 히어로와 방향이 반대다** — 여기는 두 테마 모두 **상한**이다(흰 글씨).
   알파는 쓰지 않는다 — 카드를 통째로 덮는다.

---

## 레이아웃 제약 (프롬프트의 핵심)

### 카드 실측

셸은 `max-w-md`(448) / PC 는 `max-w-[1240px]` − `px-5` − 우측 레일 312 − gap 24,
히어로는 `px-4` 래퍼 + `px-5 py-6` + `rounded-2xl`.
높이는 **문구 1줄 기준 약 210px** 고정이고, ≤390px 폰에서 보조 문구가 2줄로 감기면 ~233px 가 된다.

| 위치 | 카드 폭 | 높이 | 비율 |
|---|---|---|---|
| 모바일 390 뷰포트 | **358** | 210~233 | 1.70 : 1 |
| 모바일 상한 (`max-w-md` 448 − `px-4`) | **416** | 210 | 1.98 : 1 |
| PC lg (1024 뷰포트) | **616** | 210 | 2.93 : 1 |
| PC (≥1280, 컨테이너 상한) | **832** | 210 | 3.96 : 1 |

**폭이 2.3배 변하는데 높이는 고정이다.** 그래서 삽화(3.6:1)를 `cover` 로 깔면
잘리는 방향이 화면마다 반대다.

| 카드 폭 | 배율 기준 | 잘리는 곳 |
|---|---|---|
| 358 | 높이 맞춤 | **왼쪽 52.6%** 가 통째로 날아간다 |
| 416 | 높이 맞춤 | **왼쪽 45%** |
| 616 | 높이 맞춤 | **왼쪽 18.5%** |
| 832 | 폭 맞춤 | **위아래 합 9%** (세로 40% 정렬이면 위 3.6% · 아래 5.5%) |

★ **`object-position` 을 `right 40%` 로 바꿔야 한다.** 지금은 기본값(center)이라
모바일에서 **양쪽이 26%씩** 잘린다 — 우상단 주인공이 그대로 날아간다.
아래 [코드 배선](#코드-배선-아직-미적용) 참고.

### 글자가 지나가는 자리 — ★ 오른쪽 "위"만 성역이다

카드 좌표(왼쪽 패딩 `px-5` = 20px). 세로는 위에서부터 고정 순서로 쌓인다.

| 요소 | 카드 x | 카드 y | 색 |
|---|---|---|---|
| 새싹 엠블럼 36×36 + `나의 신앙 여정` 라벨 (12px/600) | 20 ~ 150px | 24 ~ 60 | 흰색 / `white/90` |
| **`223` 숫자 (44px/800)** + `일째` (18px/700) | 20 ~ 115px | 72 ~ 116 | 흰색 |
| 헤드라인 (18px/700, 최장 246px) | 20 ~ 266px | 128 ~ 153 | 흰색 |
| 보조 문구 (14px, 최장 **330px**, 모바일 2줄) | 20 ~ 350px | 161 ~ 184 (2줄이면 ~207) | `white/90` |

이걸 삽화(3.6:1) 좌표로 옮기면 이렇게 된다. **프롬프트가 지켜야 하는 건 이 표다.**

| 삽화 영역 | 규칙 |
|---|---|
| x **0~50%** | 모바일에서 통째로 잘린다. 매끈한 어두운 그라데이션만. 디테일 금지 |
| x **50~78%** | 글자가 지나간다. 저대비 원경·안개만. 밝은 점·강한 대비·흰 덩어리 금지 |
| x **78~98% · y 6~58%** | ★ **주인공 구역.** 밝은 것과 디테일은 전부 여기에만 |
| y **60~100%** (아래 40%) | 평평하고 어두운 전경. 모바일에서 보조 문구 2줄이 여기 올라온다. 꽃·돌·하이라이트 금지 |
| x 92~100% · y 78~100% | Gemini 워터마크 ✦ 자리. 평평하게 비운다 |
| 위 5% · 아래 5% | PC 최대폭에서 잘린다. 하늘·풀밭 여유분으로만 |

- **주인공 구역과 글자 구역 사이에 딱딱한 세로 경계를 만들지 말 것.** 왼쪽으로 갈수록 안개에 녹아
  사라져야 한다. 스크림이 한 겹 덮지만, 그림 자체가 부드럽지 않으면 카드 한가운데에 세로줄이 생긴다.
- **브랜드 파랑(#3182f6) 덩어리 금지.** 파랑은 라이트 원경 안개의 옅은 회청색으로만.
- **글자·숫자·로고 금지.** 표지판·깃발에도 글자를 넣지 않는다(애초에 표지판·깃발을 그리지 않는다).
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리(`rounded-2xl`)와 그림자는 CSS 가 처리한다.

### 밝기 합격선 — 두 테마 모두 **상한**이다

두 테마 모두 흰 글씨이므로, 라이트도 "밝을수록 좋다"가 아니다.
글자 사각형 4개에서 **원본 삽화 값**(스크림 적용 전)을 잰다.

| | 합격선 |
|---|---|
| 라이트 | 평균 **≤ 175**, 상위5% **≤ 215** |
| 다크 | 평균 **≤ 95**, 상위5% **≤ 130** |

- 위 값은 **그림만의** 값이다. 스크림이 왼쪽·아래를 더 눌러 주므로 화면 대비는 이보다 낫다.
- 반대로 **주인공 구역은 하한**이 있다: 라이트는 일출 코어 상위2% **≥ 200**,
  다크는 달·등불 코어 **≥ 170**(주변은 어두운 채로). 우상단이 죽으면 두 테마가 똑같아진다.

★ **실제로 뽑아 보니 라이트는 이 상한을 못 지킨다** — 좌상단이 아침 안개라 라벨 자리가 209~219,
큰 숫자 자리가 195~198 로 나왔다(예전 사진은 162/76). 그림 쪽을 어둡게 다시 뽑는 대신
**라이트만 스크림을 한 겹 더 얹어서** 해결했다(`GrowthHero.css` 의 좌측 겹).
다시 뽑을 때도 선택지는 둘이다 — **그림을 어둡게 하거나, 좌측 스크림을 조절하거나.**

### ★ 스크림 세기는 "12px 라벨"이 정한다 (2026-09-17 사용자 결정)

처음엔 좌측 겹을 `.45 → .18` 로 세게 잡았는데 **라이트가 다크만큼 어두워 보인다**는 지적이 나왔다.
아침 안개·능선이 보이는 쪽이 낫고, 한계선은 **가장 작은 흰 글씨(12px 라벨)의 대비**다.
세 단계를 실측해 **B 를 채택**했다(모바일 416 · 오전 삽화 기준):

| 단계 | 좌측 겹 | 대각 겹 | 라벨 | 숫자 | 12px 라벨 대비 |
|---|---|---|---|---|---|
| A (처음) | `.45 → .18 45% → 0 72%` | `.65 / .35 / .10` | 95 | 72 | 6.4 : 1 |
| **B (채택)** | **`.38 → .15 45% → 0 70%`** | **`.55 / .30 / .08`** | **116** | **93** | **4.7 : 1** |
| C | `.22 → .07 45% → 0 62%` | `.45 / .24 / .06` | 138 | 115 | 3.5 : 1 ✗ |
| 참고: 예전 사진 | — | `.65 / .35 / .10` | 162 | 76 | 2.8 : 1 |

- **제일 빡빡한 조합은 "오후 삽화 × 358px 폰"이다** — 좁을수록 밝은 오른쪽이 카드로 더 많이 들어온다.
  B 에서 그 조합이 4.72:1 로 WCAG 4.5:1 을 겨우 넘는다. 좌측 겹을 `.32` 로 두면 4.3:1 로 떨어진다.
- 그래서 **여기서 더 밝히려면 스크림이 아니라 라벨을 손봐야 한다**(12px/600 → 13px/700 등).
- 예전 사진(2.8:1)이 기준을 한참 밑돌았다는 뜻이기도 하다 — B 는 그보다 나아진 값이다.

---

## A안 · 「지나온 발자국」 (메인)

능선 위, 양이 걸음을 멈추고 고개만 돌려 지나온 길을 돌아본다. 발굽 자국이 왼쪽 아래로 길게
이어지다 안개에 녹는다. 중간 한 군데는 빙 돌아버린 자국이고, 그 원 안에만 들꽃 한 송이가 피어 있다.
새끼양은 그 발자국을 정확히 밟으려 다리를 한껏 벌린 채 휘청한다.

백엔드 문구(`growth/summary.py`)가 `작은 발자국이 모여 여정이 되고 있어요` ·
`걸음마다 은혜가 쌓이고 있어요` 를 쓰고, 화면 아래 전환 문구가
`아래로 내려 지난 발자취를 이어보세요` 다 — 그림이 카피를 그대로 받는다.

### 1. A안 · 라이트 테마 프롬프트

```
A very wide 3.6:1 panoramic illustration used as the FULL-BLEED background of a small
"my faith journey" hero card in a Korean church app, LIGHT MODE. The card is short and
wide (about 416x210 px on a phone, 832x210 px on desktop) and this artwork fills it
edge to edge. Large WHITE text and one big white number are drawn on top of the left
side and the bottom, over a dark diagonal scrim, so the picture must stay MEDIUM-DARK
and low-contrast on the left half and along the bottom, and open into warm light ONLY
in the upper right. This is NOT a high-key pastel scene and NOT a white background.

Style: cozy-epic children's storybook illustration — soft flat shapes with a subtle
grain texture, rounded friendly forms, painterly soft edges, no hard black outlines.
Use the SAME small chubby sheep character as the attached character reference: cream
white wool, stubby legs, tiny round hooves, a small serene smile, soft blue-grey line
work.

Palette: the first light of dawn on a long grassy ridge. In the upper right, a warm
cream-gold sunrise glow (a #f7d9a0 core fading out into #f1e6d4) breaks through soft
low cloud. Everything else is deep cool sage-slate green (#2f3a33 through #46534a)
with pale blue-grey mist lying in the valleys (#5b6a74). Warm gold appears ONLY in the
upper right quarter, as a thin rim light along the ridge line, and on the sheep's face
and back. No saturated colours, no strong blue, no pure black masses, and no bright
patch of any kind on the left half or along the bottom edge.

Composition is critical:
- The subject lives in the UPPER RIGHT of the frame: x 78-98%, y 6-58%. Nothing
  elsewhere may be that bright or that detailed.
- The LEFT 50% of the frame must be nearly EMPTY — a smooth dark sage-to-mist gradient
  with at most one faint distant ridge. It is cropped away entirely on phones, and
  white text covers whatever survives.
- The middle band (x 50-78%) holds only faint hazy distance dissolving into mist. No
  hard edges, no highlights, no detail, and no vertical boundary — the scene must fade
  gradually into the empty left side, never stop at a line.
- The BOTTOM 40% of the frame (y 60-100%) is calm, dark, flat ground: plain grass with
  no objects, no flowers, no stones and no bright highlights. Two lines of white text
  sit there.
- Keep the TOP 5% and BOTTOM 5% as calm expendable margin, and leave the very
  bottom-right corner (x 92-100%, y 78-100%) flat and featureless.

Scene (upper right) — the joke is the lamb's stride:
- ONE small chubby sheep stands on the crest of the ridge, having just stopped
  walking. Its body faces the viewer in a gentle three-quarter-FRONT angle — never a
  flat side profile, both eyes visible, the same size and evenly spaced — while its
  head turns BACK over its shoulder to look at the trail behind it. Ears perked up,
  chest puffed out just a little with quiet pride, a small contented smile. The dawn
  light catches its face, one ear and its back.
- A long line of small hoof prints runs from its feet DOWN and to the LEFT along the
  ridge, the prints getting smaller and fainter with distance until they dissolve into
  the mist around x 55%. They are soft shallow dents very slightly darker than the
  grass — never bright, never glowing, never a crisp graphic pattern of identical
  shapes.
- Halfway along that line the prints loop once in a small wandering circle before
  rejoining the path, and a SINGLE tiny pale wildflower grows inside that loop.
- A LAMB follows a few steps behind, comically stretching to plant its little hoof
  exactly inside one of the big sheep's prints: legs splayed as far as they will go,
  one hoof still hovering in mid-air, tongue poking out in concentration, utterly
  serious about it. Its stride is far too short and it is clearly about to lose its
  balance.
- Nothing else: no staff, no backpack, no lantern, no flag, no stone cairn, no
  signpost, no fence, no chapel, no mountain peak.

No text, no letters, no numbers, no logos. No speech bubbles, no thought bubbles, no
hearts, no sparkle symbols, no arrows and no dotted route lines. Do NOT draw any
user-interface elements, buttons, pills, panels or rounded rectangles. The background
must be ONE continuous soft gradient — never a rectangular block, window or box of a
different colour, and no straight background edges anywhere. No frames, no borders, no
vignette, no rounded corners.
```

### 2. A안 · 다크 테마 프롬프트

```
A very wide 3.6:1 panoramic illustration used as the FULL-BLEED background of a small
"my faith journey" hero card in a Korean church app, DARK MODE. Same ridge, same hoof
prints, same wandering loop, same flower, same two characters and same poses as the
light version — only the light has changed from dawn to night. Large WHITE text and
one big white number are drawn on top of the left side and the bottom, over a dark
diagonal scrim, so the picture must stay DARK and low-contrast on the left half and
along the bottom, and lift only in the upper right.

Style: cozy-epic children's storybook illustration — soft flat shapes with a subtle
grain texture, rounded friendly forms, warm rim lighting, no hard outlines. Use the
SAME small chubby sheep character as the attached character reference: stubby legs,
tiny round hooves, a small serene smile — but here its wool reads as soft warm grey,
never bright white.

Palette: a WARM CHARCOAL night on the same grassy ridge. The sky goes from #1b1a1a at
the top through #262220 into a faintly mauve-brown #2d2724 near the horizon, over a
deep warm grey-green ridge (#232824 to #333b34). NO blue night sky, NO indigo, NO
teal, NO starfield — the usual navy night must be re-translated into this warm
brown-grey. The ONLY bright thing in the whole picture is a LOW, LARGE, WARM MOON
sitting in the upper right (a soft amber-cream disc, #e8c489, with a gentle haloed
glow that does NOT reach past x 70%), plus a thin warm rim light along the ridge line
and along the sheep's back. Everything else stays muted, dark and low-contrast.

Composition is critical:
- The subject lives in the UPPER RIGHT of the frame: x 78-98%, y 6-58%. The moon sits
  behind and just above the sheep, so the sheep reads as a warm-rimmed shape against
  it. Nothing elsewhere may be that bright.
- The LEFT 50% of the frame must be nearly EMPTY — a smooth dark warm-grey gradient
  with no stars and no detail. It is cropped away entirely on phones, and white text
  covers whatever survives.
- The middle band (x 50-78%) holds only faint hazy distance, kept extremely close in
  value to the sky so nothing reads as a hard silhouette. No hard edges, no vertical
  boundary — the scene must fade gradually into the empty left side.
- The BOTTOM 40% of the frame (y 60-100%) is calm, dark, flat ground with no objects,
  no highlights and no moon spill. Two lines of white text sit there.
- Keep the TOP 5% and BOTTOM 5% as calm expendable margin, and leave the very
  bottom-right corner (x 92-100%, y 78-100%) flat and featureless.

Scene (upper right) — the joke is the lamb's stride:
- ONE small chubby sheep stands on the crest of the ridge, body in a gentle
  three-quarter-FRONT angle toward the viewer, both eyes visible, head turned BACK
  over its shoulder to look at the trail behind it, ears perked, chest puffed out a
  little with quiet pride, a small contented smile. Only its face, one ear and its
  back catch the warm moonlight.
- A long line of small hoof prints runs from its feet DOWN and to the LEFT along the
  ridge, fading out into the murk around x 55%. They are soft shallow dents, barely a
  shade lighter than the grass — never bright, never glowing, never a crisp graphic
  pattern.
- Halfway along that line the prints loop once in a small wandering circle, and a
  SINGLE tiny wildflower stands inside that loop with ONE firefly resting on it — a
  single, very small, soft amber dot. No swarm of fireflies.
- A LAMB follows a few steps behind, comically stretching to plant its little hoof
  exactly inside one of the big sheep's prints: legs splayed as far as they will go,
  one hoof hovering in mid-air, tongue poking out in concentration, utterly serious
  about it, about to lose its balance. Only its nose and one shoulder catch the light.
- Nothing else: no staff, no backpack, no lantern, no flag, no stone cairn, no
  signpost, no fence, no chapel, no mountain peak.

No text, no letters, no numbers, no logos. No speech bubbles, no thought bubbles, no
hearts, no sparkle symbols, no arrows and no dotted route lines. Do NOT draw any
user-interface elements, buttons, pills, panels or rounded rectangles. The background
must be ONE continuous soft gradient — never a rectangular block, window or box of a
different colour, and no straight background edges anywhere. No frames, no borders, no
vignette, no rounded corners.
```

---

## B안 · 「하루에 하나, 등불」

헤드라인이 `매일의 불꽃이 빛나고 있어요` 일 때 그림이 문장 그대로가 된다.
길가 말뚝에 **오늘의 작은 등불 하나**를 발끝을 들고 거는 양, 그 뒤로 어제·그제의 등불들이
왼쪽 아래로 줄줄이 이어져 안개 속으로 사라진다.
유머는 **불 옮겨 붙이기** — 새끼양이 자기 등불을 켜려고 큰 양의 등불에 아슬아슬 기울어져 있다.

> **칭호 도감 `hundred_days.webp` 와 헷갈리지 말 것.** 저건 산 정상·깃발·오로라 밤하늘에
> 빛의 점선이 정상까지 올라가는 그림이다. 여기는 **능선 하나**, 깃발 없음, 오로라 없음,
> 등불이 **양의 발굽 안에** 있다(멀리 놓인 장식이 아니다). 등불은 **8개 이하**로 센다.

### 3. B안 · 라이트 테마 프롬프트

```
A very wide 3.6:1 panoramic illustration used as the FULL-BLEED background of a small
"my faith journey" hero card in a Korean church app, LIGHT MODE. The card is short and
wide (about 416x210 px on a phone, 832x210 px on desktop) and this artwork fills it
edge to edge. Large WHITE text and one big white number are drawn on top of the left
side and the bottom, over a dark diagonal scrim, so the picture must stay MEDIUM-DARK
and low-contrast on the left half and along the bottom, and open into warm light ONLY
in the upper right. This is NOT a high-key pastel scene.

Style: cozy-epic children's storybook illustration — soft flat shapes with a subtle
grain texture, rounded friendly forms, painterly soft edges, no hard black outlines.
Use the SAME small chubby sheep character as the attached character reference: cream
white wool, stubby legs, tiny round hooves, a small serene smile, soft blue-grey line
work.

Palette: the last blue minutes before sunrise on a long grassy ridge. In the upper
right the sky opens into a warm cream-gold band (#f4d7a4 fading into #eadfd0) just
above the horizon; everything else is deep cool sage-slate green and blue-grey mist
(#2f3a33 through #46534a, mist #5b6a74). Warm amber appears ONLY in the upper right
and in the small lantern flames. No saturated colours, no strong blue, no pure black,
and no bright patch anywhere on the left half or along the bottom.

Composition is critical:
- The subject lives in the UPPER RIGHT of the frame: x 78-98%, y 6-58%.
- The LEFT 50% must be nearly EMPTY — a smooth dark sage-to-mist gradient, no detail;
  it is cropped away on phones and white text covers whatever survives.
- The middle band (x 50-78%) holds only faint hazy distance dissolving into mist, with
  no hard edge and no vertical boundary.
- The BOTTOM 40% (y 60-100%) is calm, dark, flat grass: no objects, no flowers, no
  highlights, no lantern spill. Two lines of white text sit there.
- Keep the TOP 5% and BOTTOM 5% as expendable margin; the very bottom-right corner
  (x 92-100%, y 78-100%) stays flat and featureless.

Scene (upper right) — the joke is the borrowed flame:
- ONE small chubby sheep stands on the ridge beside a short wooden post, up on the
  very tips of its hooves, both front hooves raised, carefully hanging ONE small round
  glass lantern on the top of the post. Its body is in a gentle three-quarter-FRONT
  angle toward the viewer — both eyes visible, the same size and evenly spaced — eyes
  narrowed in concentration, a small serene smile. The lantern's warm flame lights its
  face from the front.
- Behind it, a line of shorter posts runs DOWN and to the LEFT along the ridge, each
  with its own small lantern already lit, getting smaller and dimmer with distance
  until they dissolve into the mist around x 55%. Count them: SIX to EIGHT lanterns
  total, no more, and they must read as separate little lamps, never as a string of
  fairy lights, a dotted line or a glowing path.
- A LAMB stands at the big sheep's hind legs holding its own tiny unlit lantern up as
  high as it can, leaning over at an impossible angle to touch its wick to the lit
  flame, tongue poking out in concentration, one hoof off the ground. It is far too
  short and completely undeterred.
- Nothing else: no staff, no backpack, no flag, no stone cairn, no signpost, no fence,
  no chapel, no mountain peak, no fairy-light wire strung between the posts.

No text, no letters, no numbers, no logos. No speech bubbles, no thought bubbles, no
hearts, no sparkle symbols, no arrows, no dotted route lines. Do NOT draw any
user-interface elements, buttons, pills, panels or rounded rectangles. The background
must be ONE continuous soft gradient — never a rectangular block, window or box of a
different colour, and no straight background edges anywhere. No frames, no borders, no
vignette, no rounded corners.
```

### 4. B안 · 다크 테마 프롬프트

```
A very wide 3.6:1 panoramic illustration used as the FULL-BLEED background of a small
"my faith journey" hero card in a Korean church app, DARK MODE. Same ridge, same row
of lantern posts, same two characters and same poses as the light version — only the
time has changed from before-dawn to deep night. Large WHITE text and one big white
number are drawn on top of the left side and the bottom, over a dark diagonal scrim,
so the picture must stay DARK and low-contrast on the left half and along the bottom.

Style: cozy-epic children's storybook illustration — soft flat shapes with a subtle
grain texture, rounded friendly forms, warm rim lighting, no hard outlines. Use the
SAME small chubby sheep character as the attached character reference, but here its
wool reads as soft warm grey, never bright white.

Palette: a WARM CHARCOAL night. The sky goes from #1b1a1a at the top through #262220
into a faintly mauve-brown #2d2724 near the horizon, over a deep warm grey-green ridge
(#232824 to #333b34). NO blue night sky, NO indigo, NO teal, NO starfield. The ONLY
bright things in the whole picture are the small AMBER lantern flames (#e8b06a) and
the compact pools of warm light they cast; the nearest lantern is the brightest and
each one further away is dimmer. The glow must NOT reach past x 70%. Add only a thin
warm rim light along the sheep's back. Everything else stays muted and dark.

Composition is critical:
- The subject lives in the UPPER RIGHT of the frame: x 78-98%, y 6-58%.
- The LEFT 50% must be nearly EMPTY — a smooth dark warm-grey gradient, no stars, no
  detail; it is cropped away on phones and white text covers whatever survives.
- The middle band (x 50-78%) holds only faint hazy distance kept extremely close in
  value to the sky, with no hard edge and no vertical boundary. The two or three
  furthest lanterns may sit here, but only as very faint dim dots.
- The BOTTOM 40% (y 60-100%) is calm, dark, flat grass: no objects, no highlights and
  no light spill at all. Two lines of white text sit there.
- Keep the TOP 5% and BOTTOM 5% as expendable margin; the very bottom-right corner
  (x 92-100%, y 78-100%) stays flat, dark and featureless.

Scene (upper right) — the joke is the borrowed flame:
- ONE small chubby sheep stands on the ridge beside a short wooden post, up on the
  very tips of its hooves, both front hooves raised, carefully hanging ONE small round
  glass lantern on the top of the post. Body in a gentle three-quarter-FRONT angle,
  both eyes visible, eyes narrowed in concentration, a small serene smile, face lit
  warmly from the front by the flame.
- Behind it, a line of shorter posts runs DOWN and to the LEFT along the ridge, each
  with its own small lit lantern, dimmer and smaller with distance until they fade
  into the murk around x 55%. SIX to EIGHT lanterns total, reading as separate little
  lamps — never a string of fairy lights, never a dotted glowing path up a mountain.
- A LAMB stands at the big sheep's hind legs holding its own tiny UNLIT lantern up as
  high as it can, leaning over at an impossible angle to touch its wick to the lit
  flame, tongue poking out in concentration, one hoof off the ground — far too short,
  completely undeterred, only its nose and one raised hoof catching the amber light.
- Nothing else: no staff, no backpack, no flag, no stone cairn, no signpost, no fence,
  no chapel, no mountain peak, no wire strung between the posts.

No text, no letters, no numbers, no logos. No speech bubbles, no thought bubbles, no
hearts, no sparkle symbols, no arrows, no dotted route lines. Do NOT draw any
user-interface elements, buttons, pills, panels or rounded rectangles. The background
must be ONE continuous soft gradient — never a rectangular block, window or box of a
different colour, and no straight background edges anywhere. No frames, no borders, no
vignette, no rounded corners.
```

---

## 5. C안 · 저강도 안전판 (라이트 기준 + 다크 팔레트 치환)

A·B 가 계속 왼쪽까지 그림을 채우거나, 좁은 카드(358px)에서 글자를 잡아먹을 때 쓰는 **보험**이다.
새끼양을 빼고 양 한 마리만, 훨씬 작게, 더 오른쪽 위 구석으로 몬다.

```
A very wide 3.6:1 panoramic illustration used as the FULL-BLEED background of a small
"my faith journey" hero card in a Korean church app, LIGHT MODE, extremely minimal.
The card is short and wide (about 416x210 px on a phone, 832x210 px on desktop) and
large WHITE text with one big white number is drawn over the left side and the bottom,
so the picture must stay MEDIUM-DARK and almost empty, opening into warm light ONLY in
the upper right. Style: cozy children's storybook illustration — soft flat shapes with
a subtle grain texture, no outlines on the large forms, painterly soft edges.

Subject: the crest of a long grassy ridge at the far upper right of the frame. ONE
small chubby white sheep stands there, small — it occupies no more than the upper
right eighth of the picture — body in a gentle three-quarter-FRONT angle toward the
viewer with both eyes visible, head turned back over its shoulder to look at the trail
behind it, ears perked, a small contented smile. Behind it, THREE or FOUR soft shallow
hoof prints trail down and to the left and then stop, dissolving into mist. Nothing
else at all — no lamb, no staff, no lantern, no flag, no cairn, no signpost, no fence,
no tree.

Palette: the first light of dawn. A warm cream-gold glow (#f7d9a0 fading into #f1e6d4)
in the upper right only, over deep cool sage-slate green (#2f3a33 to #46534a) and pale
blue-grey mist (#5b6a74). No saturated colours, no strong blue, no pure black, and no
bright patch anywhere on the left half or along the bottom.

Composition is critical:
- The LEFT 65% of the frame is EMPTY — nothing but a smooth dark sage-to-mist gradient
  and one faint distant ridge dissolving into haze. White text is drawn over it.
- The BOTTOM 45% of the frame is calm, dark, flat grass with no objects and no
  highlights whatsoever.
- The very bottom-right corner (x 92-100%, y 78-100%) stays completely flat and
  featureless, and the TOP 5% and BOTTOM 5% are expendable margin.
- No hard vertical boundary anywhere — the scene fades into the empty left side.

No text, no letters, no numbers, no logos. No speech bubbles, no sparkle symbols, no
arrows, no dotted route lines. Do NOT draw any user-interface elements, buttons,
pills, panels or rounded rectangles. The background must be ONE continuous soft
gradient, with no straight background edges anywhere. No frames, no borders, no
vignette, no rounded corners.
```

**다크로 바꿀 때는 위 프롬프트에서 팔레트 문단만 갈아 끼운다** (구도·장면 문단은 그대로 둔다):

```
DARK MODE instead, same ridge and same pose at night. Palette: a WARM CHARCOAL night —
#1b1a1a at the top through #262220 into a faintly mauve-brown #2d2724 near the horizon,
over a deep warm grey-green ridge (#232824 to #333b34). NO blue night sky, NO indigo,
NO teal, NO starfield. The ONLY bright thing is a LOW, LARGE, WARM MOON in the upper
right — a soft amber-cream disc (#e8c489) with a gentle halo that does not reach past
x 70% — with a thin warm rim light along the ridge line and the sheep's back. The wool
reads as soft warm grey, never bright white, and the hoof prints are barely a shade
lighter than the grass.
```

---

## 번외 아이디어 (프롬프트는 아직 안 씀)

- **「여기까지 도우셨다」 · 돌 하나** — 길가에 반듯하게 쌓아 올린 작은 돌탑 위에 오늘의 돌 한 개를
  얹는 양(삼상 7:12 에벤에셀). 유머는 높이 — 탑이 이미 양 키를 넘어 새끼양 등에 올라서려다 둘이 휘청.
  ⚠ 오디오북 고갯길의 **케른**과 소품이 겹친다. 쓰려면 저쪽 배경에서 케른을 빼는 것까지 같이 결정해야 한다.
- **「나이테」** — 지나온 날이 그루터기의 나이테로. ⚠ 나무는 `/garden` 신앙나무(`SHOW_FAITH_TREE` 휴면)의
  소재다. 되살릴 계획이 없다면 쓸 수 있지만, 여정의 "이동"이 사라진다.

---

## 부분 수정용 (번외)

잘 나온 장면을 통째로 다시 뽑으면 구도가 바뀐다. Gemini에 **그 이미지를 첨부**하고 한 군데만 고치게 한다.

**왼쪽이 밝거나 그림으로 꽉 찼을 때** (제일 자주 터진다)

```
Keep this image exactly as it is — same characters, same style, same palette, same
lighting directions. Change ONE thing only:

Empty out and DARKEN the LEFT 50% of the frame. Remove every ridge, tree, bush, cloud,
lantern, hoof print and object from the left side and replace it with nothing but a
smooth dark sage-to-mist gradient, and make whatever remains between 50% and 78% of
the width fade gradually into soft haze so there is no hard vertical edge anywhere. No
bright value may remain anywhere in the left half. Everything to the right of 78% must
stay pixel-identical.
```

**주인공이 가운데로 오거나 세로 가운데에 섰을 때**

```
Keep this image exactly as it is — same characters, same style, same palette, same
lighting. Change ONE thing only:

Move the whole group UP and to the RIGHT so that every character and prop sits inside
the rectangle from 78% to 98% of the width and from 6% to 58% of the height, and make
the lower 40% of the picture plain, dark, empty grass with no objects and no
highlights. Do not change the characters, their poses or their sizes relative to each
other.
```

**발자국이 밝은 점·그래픽 패턴으로 나왔을 때**

```
Keep this image exactly as it is — same characters, same style, same palette, same
lighting. Change ONE thing only:

Redraw the hoof prints as soft, shallow, irregular dents in the grass, only a hair
darker than the grass around them, each one slightly different in shape and spacing,
fading out completely into the mist by 55% of the width. They must not glow, must not
be bright, must not look like a dotted line, a trail of lights or a repeated stamp.
Nothing else may change.
```

**아래쪽(글자 자리)에 디테일이 들어갔을 때**

```
Keep this image exactly as it is — same characters, same style, same palette, same
lighting. Change ONE thing only:

Clear the bottom 40% of the picture so it contains nothing but plain, dark, smooth
grass — no flowers, no bushes, no rocks, no hoof prints, no highlights, no light
spill, no texture detail — and keep it clearly darker than the upper right. Everything
above that band must stay pixel-identical.
```

**다크가 파랗게(남색으로) 나왔을 때**

```
Keep this image exactly as it is — same composition, same characters, same lighting
directions, same shapes. Change ONE thing only:

Shift the entire colour palette from a blue/navy night to a WARM CHARCOAL night. The
sky must become a soft near-black brown-grey (#1b1a1a to #2d2724) and the ground a
deep warm grey-green, with no blue, no indigo and no teal anywhere, and no stars. Keep
the warm amber light (the moon / the lantern flames) exactly as it is. The wool stays
soft warm grey. Do not move or redraw anything.
```

**새끼양이 안 보이거나 자세가 심심할 때**

```
Keep this image exactly as it is — same style, same palette, same lighting, same big
sheep, same hoof prints. Change ONE thing only:

Exaggerate the lamb: keep it a few steps behind the big sheep but splay its legs as
far as they will go, lift one hoof high in mid-air right above a big hoof print, tilt
its whole body forward as if it is about to topple over, and let its tongue poke out
in concentration. Do not add a question mark, a speech bubble or any symbol, and do
not move anything else.
```

---

## 워터마크

제미나이 ✦ 는 **우하단 고정 오프셋**에 찍힌다. 인페인트로 뭉개지 말고
`docs/gemini-unwatermark.py` 의 **알파 역산**을 쓴다 — ★모양·알파는 매번 실측한다
(예전 값을 그대로 재사용하면 검은 얼룩이 남는다). 워터마크가 아예 안 찍혀 오는 경우도 있으니
먼저 그 자리를 확대해 확인할 것. 이 그림은 우하단이 평평한 어두운 풀밭이라 채우기가 잘 먹는 자리다
(TELEA 인페인트는 금지 — 양 발굽·발자국을 빨아들인다).

---

## 코드 배선 (적용 완료 — 다시 구울 때 그대로 둔다)

1. **`GrowthHero.css`** 가 새로 생겼다. `<img>` 를 지우고 배경 레이어 두 겹으로 바꿨다 —
   `.growth-hero-art`(삽화) + `.growth-hero-scrim`(스크림).
   - **테마는 CSS 셀렉터**(`html.dark .growth-hero-art--{시간대}`)가 고른다. 인라인 `src` 로 고르면
     테마 토글 크로스페이드에 이미지가 같이 실리지 않는다(`/thanks`·`/classes` 와 같은 문법).
   - **시간대는 클래스**(`.growth-hero-art--morning|afternoon|evening`)가 고른다.
   - `background-position: right 40%` **필수**. `<img object-cover>` 기본값(center)이던 시절엔
     모바일에서 양쪽이 26%씩 잘려 우상단 주인공이 통째로 날아갔다.
   - `useThemeArt` 가 돌려주는 `ready` 로 `.is-loaded` 를 붙여 320~450ms 페이드인.
2. **스크림은 테마별로 겹수가 다르다** (위 [밝기 합격선](#밝기-합격선--두-테마-모두-상한이다) 참고).
   - 라이트: 대각(`.55 → .30 → .08`) + **좌측 한 겹**(`.38 → .15 45% → 0 70%`).
     ★ 이 숫자를 올리면 라이트가 다크처럼 어두워지고, 내리면 12px 라벨이 기준 아래로 떨어진다.
   - 다크: 대각 한 겹만, 한 단계 눅여서(`.55 → .28 → .05`). 안 눅이면 달·등불이 죽는다.
3. **`themeAssets.ts`** — `GROWTH_HERO_BY_TIME`(시간대 3쌍) + `GROWTH_HERO`(getter 로 **지금 시간대만**
   노출, `/greeting` 과 같은 방식) + `ROUTE_ASSETS` 에 `{ match: /^\/growth$/, pairs: [GROWTH_HERO] }`.
   getter 라서 선요청·토글 선요청이 세 장을 다 받지 않는다(지금 시간대의 2장만).
4. **시간대 판정은 `deriveTimeOfDay`(`hooks/useDailyMeditation`)를 재사용한다** — 홈 묵상 카드·마중
   문구와 같은 경계(오전 4~11 · 오후 11~17 · 저녁 17~4). 여기서 따로 정의하지 않는다.
5. **`src/assets/hero/morning.webp` 는 남겨 뒀다** — 홈 묵상 카드(`DailyMeditationCard.tsx`)가 쓴다.
   `GrowthHero.tsx` 의 import 만 뗐다.
6. **PC 우측 레일 폭까지 확인할 것.** 이 카드는 모바일(358~416)보다 PC(616~832)에서 **2배 넓다**.
   좁은 폭에서 주인공이 잘리는지는 358px 에서, 위아래가 잘리는지는 1280 이상에서 본다.
7. 확인 경로는 `/#/growth` (HashRouter — path URL 로 열면 홈만 렌더된다).
   시간대를 강제로 보려면 `GrowthHero.tsx` 의 `timeOfDay` 를 잠시 고정한다.

---

## 적용 상태 (2026-09-17)

받은 6장이 전부 채택돼서 **시간대 로테이션**이 됐다. 원본 번호와 최종 파일:

| 시간대 | 테마 | 원본 | 장면 | 파일 | 크기 |
|---|---|---|---|---|---|
| 오전 4~11 | 라이트 | `3.png` | A안 발자국 · 일출 | `hero-morning-light.webp` | 7.8KB |
| 오전 | 다크 | `2.png` | A안 발자국 · 달 | `hero-morning-dark.webp` | 7.1KB |
| 오후 11~17 | 라이트 | `5.png` | C안 능선 · 밝은 안개 | `hero-afternoon-light.webp` | 5.5KB |
| 오후 | 다크 | `6.png` | C안 능선 · 달 | `hero-afternoon-dark.webp` | 6.7KB |
| 저녁 17~4 | 라이트 | `1.png` | B안 등불 · 박명 | `hero-evening-light.webp` | 8.9KB |
| 저녁 | 다크 | `4.png` | B안 등불 · 밤 | `hero-evening-dark.webp` | 7.0KB |

★ **받은 순서가 장면 순이 아니었다**(1=등불 라이트, 2=발자국 다크, 3=발자국 라이트, 4=등불 다크).
같은 시간대의 라이트·다크가 **같은 장면**이어야 테마 토글이 "같은 길의 다른 시각"이 되므로
번호가 아니라 장면으로 다시 묶었다. `growth-hero-process.py` 의 `PLAN` 이 그 표다.
장면을 시간대에 붙인 근거: 일출=아침, 밝은 안개·고요=한낮, 등불 켜기=저녁.

- 전부 **1536×425**, 6장 합쳐 **43KB**(사진 한 장 61KB 보다 가볍다).
- 워터마크는 `gemini-unwatermark.py` 알파 역산으로 제거(인페인트 아님).
  6장 모두 astroid S=28.0 P=0.62 · 코어 알파 0.299~0.301 · 글로우 없음,
  링 잔차 초과분 원본 +12.5~16.6 → 결과 **+0.18~+0.30**(자국 없음).
  콘솔이 cp949 면 ✦ 출력에서 죽으니 `PYTHONIOENCODING=utf-8` 를 켠다.
- **화면 실측**(채택한 B 스크림까지 얹은 값, 세 시간대의 최소~최대. 흰 글씨라 낮을수록 좋다):

  | | 라벨 | 숫자 | 헤드 | 보조 |
  |---|---|---|---|---|
  | 라이트 모바일 358 | 113~115 | 86~88 | 47~50 | 36~39 |
  | 라이트 PC 832 | 70~90 | 44~60 | 52~53 | 35~40 |
  | 다크 모바일 358 | 27~37 | 42~46 | 26~32 | 15~23 |
  | 다크 PC 832 | 23~26 | 21~28 | 26~33 | 15~22 |

  예전 사진의 같은 자리가 라벨 162 · 숫자 76 · 헤드 62 · 보조 73 이었다.
  라벨은 162 → 115 로 좋아졌고(대비 2.8 → 4.7:1), 큰 숫자만 76 → 87 로 살짝 밝아졌는데
  44px/800 이라 대비 5.2:1 로 여유가 크다.
- 주인공 광원(상위2% 평균): 라이트 237~242, 다크 174~195. 다크는 의도한 만큼만 밝다.
- 옛 `<img>` + Tailwind 스크림 클래스는 삭제. `tsc --noEmit` · `npm run build` 통과,
  청크 CSS(`Growth-*.css`)에 6장 해시 URL 이 다 실렸다.

---

## 체크리스트

- [ ] 라이트도 **흰 글씨가 읽히는가** (글자 사각형 평균 ≤175 / 상위5% ≤215)
- [ ] 다크에 파란 하늘·별이 섞이지 않았는가 (웜 차콜인가)
- [ ] 우상단 광원(일출 / 달·등불)이 **살아 있는가** (두 장이 서로 다른가)
- [ ] 삽화 x 50~78% 에 대비 강한 물체·밝은 점이 없는가 (글자 자리)
- [ ] 아래 40% 가 평평하고 어두운가 (모바일 보조 문구 2줄 자리)
- [ ] 카드 한가운데 세로 경계선이 보이지 않는가
- [ ] 우하단 코너가 평평한가 (워터마크 제거 자국이 안 보이는가)
- [ ] 발자국이 점선·전구줄처럼 보이지 않는가
- [ ] 라이트·다크의 **구도·발자국 줄·양 자세·꽃 위치가 같은가** (빛만 다른가)
- [ ] 모바일 358 / 416 · PC 616 / 832 네 폭에서 주인공이 잘리지 않는가
