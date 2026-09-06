# 타임캡슐 히어로 배경 이미지 프롬프트 (Gemini용)

`/capsule` 상단 **히어로**(`src/pages/Capsule/CapsuleList.tsx`, `TIME CAPSULE` 라벨 +
"미래의 나에게, / 사랑하는 이에게" + 안내 2~3줄 + `새 캡슐 봉인하기` 버튼) 뒤에 깔 배경.
라이트/다크 각 1장. 지금은 **밤하늘 실사진 한 장**(`src/assets/capsule/hero.webp`, 98KB)에
좌측 스크림 두 겹을 얹어 라이트·다크 공용으로 쓰고 있다 — 이걸 **코지-에픽 동화풍 삽화 2장**으로 바꾼다.

컨셉은 칭호·이어읽기·플랜·공지 배너·교육·헌금·소식·묵상방 배경과 같은
**코지-에픽 동화풍 + 같은 양 캐릭터**, 장면은 **"미래로 부치는 우체통"**.

## 장면을 이렇게 잡은 이유 (프롬프트가 요구한 장면)

> ⚠️ **실제로 나온 그림은 이것과 다르다.** 제미나이가 이 우체통 장면을 홈 배너의 배달부 양과
> 한 컷으로 합쳐 냈고, 그 편이 나아서 그대로 채택했다 —
> [★ 실제로 나온 그림](#-실제로-나온-그림--그래서-배치를-바꿨다-2026-09-06) 절 참고.
> 아래는 다시 뽑을 때를 위한 원래 의도다.

홈 배너(`docs/capsule-banner-bg-prompts.md`)가 이미 **배달 중인 양**(편지 흘리며 질주)을 쓰고 있다.
같은 기능의 두 화면이 같은 그림을 반복하면 안 되고, 그렇다고 다른 세계로 가서도 안 된다.
그래서 **같은 이야기의 다른 장면**을 쓴다 — 편지가 출발하고 도착하는 **우체통**.

| | 홈 배너 (`/`) | 히어로 (`/capsule`) |
|---|---|---|
| 장면 | 편지 뭉치 안고 **질주하는 배달부 양** | **우체통 앞의 양** |
| 소품 | 가방·흘러나온 편지·모래시계 | **삐뚜름한 나무 우체통**·별 깃발·거대한 편지 한 통 |
| 순간 | 배달 **중** | 다크 = 부치는 **밤** / 라이트 = 도착한 **아침** |

> **★ 라이트와 다크가 "밝기만 다른 같은 장면"이 아닌 유일한 화면이다.**
> 묵상방 히어로(`rooms`)는 두 장의 차이가 시간대가 아니라 밝기라고 못 박아 뒀는데, 여기만 예외다.
> 이유는 **카피가 이미 두 시각을 말하고 있기 때문**이다 —
> "오늘의 마음을 **봉인**하면 정해진 날 **아침에 도착**해요."
> 밤에 부치는 그림(다크)과 아침에 도착한 그림(라이트)은 그 문장의 양 끝이다.
> 테마를 토글하면 **편지가 하늘로 올라갔다가 내려온다** — 이 화면에서는 그게 값이다.
> 소품(우체통·별 밀랍 인장·양·새끼양)과 구도는 두 장이 **완전히 같아야** 한다. 장면만 뒤집는다.

유머는 **크기 차이**에서 나온다 — 편지가 우체통보다 크다. 양은 그걸 조금도 이상하게 여기지 않는다.
- **다크**: 너무 큰 편지를 좁은 투입구에 온몸으로 밀어 넣는 양. 표정은 더없이 진지하다.
- **라이트**: 그 편지가 도착해 우체통 문이 안 닫힌 채 삐져나와 있고, 양이 두 팔로 끌어안고 있다.

설레임은 **편지의 궤적**이 만든다. 다크는 편지 두세 통이 우체통 위로 떠올라 별빛에 섞여 사라지고,
라이트는 그 별빛이 다시 **반투명한 편지로 내려앉는다**. 지금 사진의 은하수·별똥별이 좋았던 이유
(밤하늘·먼 거리·기다림)를 삽화로 옮기는 장치다.

---

## ★ 방향 — 라이트는 밝게, 다크는 더 깊게 (플랜·묵상방 히어로 2판과 동일)

지금 히어로는 `bg-brand` + **어두운 사진** + 스크림 두 겹이라 **라이트·다크가 같은 화면**이고,
라이트 캔버스(`#f1f3f6`) + 흰 카드들 한복판에 짙은 남색 덩어리 하나만 뜬다.
**2026-09-05 플랜 히어로 2판에서 뒤집힌 결정을 그대로 따른다.**

| | 카드 (실제 적용값) | 잉크 | 삽화 톤 | 장면 |
|---|---|---|---|---|
| **라이트** | 밝은 하늘빛 카드(`#dceefd → #d9ebfd`) | **남색 글씨** | 새벽~아침 high-key | **아침** |
| **다크** | 심야 남색 카드(`#09122c → #101a39`) | 흰 글씨 | 거의 검은 남색 + 등불 하나 | **밤** |

> ⚠️ **이미지 2장과 카드 CSS·잉크·버튼은 반드시 같이 바뀐다.** 새 라이트 삽화를 지금 브랜드
> 남색 카드에 얹으면 밝은 그림 위 흰 글씨가 죽고, 흰 CTA 버튼도 배경에 묻힌다.
> 카드 색은 삽화 하늘색에서 역산한 값이라 **삽화를 바꾸면 이 값도 다시 잰다**(스크립트가 찍어 준다).
> 아래 [적용한 코드 변경](#적용한-코드-변경-2026-09-06-완료) 참고.

## 사용법

1. Gemini에 **두 장**을 첨부한다.
   - 캐릭터 참조: `public/images/title-bg/` 중 아무 이미지나 → "이 양 캐릭터와 완전히 같은 캐릭터로"
   - **톤 참조**: 라이트는 `public/images/plans/hero-light.webp`,
     다크는 `public/images/plans/hero-dark.webp` → "이 그림의 밝기·하늘색을 그대로 맞춰서"
   그 뒤 아래 프롬프트를 통째로 붙여넣는다. **한 세션에서 다크 → 라이트 순으로 이어서 뽑는다**
   (밤 장면을 먼저 확정해야 아침 장면이 "같은 우체통"으로 나온다. 라이트를 뽑을 때 다크 결과물도
   같이 첨부하고 "same mailbox, same characters, morning instead of night" 라고 덧붙일 것).
2. 결과물 저장 위치 (파일명 고정 — 코드가 이 경로를 참조한다):
   - 라이트: `frontend/public/images/capsule/hero-light.webp`
   - 다크:   `frontend/public/images/capsule/hero-dark.webp`
   (`public/images/capsule/` 에 홈 배너 2장이 이미 있다. 이름이 겹치지 않게 `hero-` 접두사를 지킬 것.)
3. 제미나이 출력(**1792×592, 3:1**)을 `~/Downloads/1.png`(라이트) `2.png`(다크)로 두고
   **`python docs/capsule-hero-process.py ~/Downloads`** 로 돌린다.
   ★ 플랜·묵상방과 **다른 스크립트**다(`plan-hero-process.py` 아님) — 배치 방식이 달라서다. 아래 참고.
4. 최종 규격: **1200×396 (3.03:1, 원본 비율 그대로) RGBA WebP**, `quality=82, alpha_quality=92, method=6`,
   한 장 **35KB 이하**(실측 27.7 / 32.2KB). 원본 사진 한 장이 98KB 였으니 두 장을 합쳐도 가벼워졌다.

---

## ★ 실제로 나온 그림 — 그래서 배치를 바꿨다 (2026-09-06)

프롬프트는 "**우체통에 편지를 밀어 넣는 양**"(주인공 오른쪽 25%)을 요구했지만,
제미나이는 두 장 다 **홈 배너의 배달부 양 + 우체통**을 한 장면에 합쳐 내놨다:
언덕 위를 달리는 배달부 양(가방에서 편지가 새어 나가고) → 오른쪽 위로 날아오르는 편지 줄 →
우체통 아래에서 뛰는 새끼양. 라이트는 아침, 다크는 등불 켜진 밤. **그림 자체는 이 편이 낫다** —
홈 배너와 한 이야기로 이어지고, "시간을 건너 도착하는 편지"가 한 컷에 다 들어 있다.

대신 **주인공 덩어리 폭이 44%**(양 x56.6% ~ 우체통 x96%, 실측)라 문서가 요구한 25% 를 못 지켰다.
이 그림을 `cover`(높이맞춤)로 깔면 모바일에서 **양의 왼쪽 끝이 카드 x 99px** 에 떨어져
안내 문구(202px까지) 위로 올라온다. 그래서 **배치 방식을 바꿨다.**

| | 플랜·묵상방 히어로 | **캡슐 히어로** |
|---|---|---|
| `background-size` | `cover` | **`100% auto`** (삽화 폭 = 카드 폭) |
| 위치 | `right bottom` | `bottom center` |
| 에셋 비율 | 2.2:1 (위에 빈 하늘을 덧대) | **3.03:1 원본 그대로** |
| 위쪽 처리 | 불투명 — 삽화 하늘이 곧 카드 바탕 | **알파 페이드** — 위는 카드 그라데이션 |
| 주인공 크기 | 카드 높이로 정해짐(폭 따라 잘림) | 카드 **폭**에 비례 |

이 배치의 값:

- 양의 왼쪽 끝이 **어느 폭에서나 `0.566 × 카드폭`** 에 떨어진다 → 모바일 203px · PC 308px.
  글씨는 202px 에서 끝나므로 **어떤 화면에서도 안 겹친다**(폭이 변해도 비율이 그대로라 안전하다).
- 글씨는 항상 **평평한 카드 그라데이션 위**에 앉는다 → 삽화 밝기와 무관하게 대비가 보장된다
  (실측: 라이트 글자 자리 평균 235, 다크 25~35. 합격선 라이트 ≥205 / 다크 ≤60 을 여유 있게 통과).
- 삽화 x 좌표가 카드 x 좌표와 **1:1** 이라, 카드 가로 그라데이션이 어느 폭에서나 이음매 없이 맞는다.

---

## 레이아웃 실측

### 카드

셸은 `max-w-md`(448) / `lg:max-w-xl`(576), 히어로는 `mx-4` + `px-6 py-7` + `rounded-[26px]`.
본문은 라벨 11px · 제목 21px 2줄 · 안내 12.5px **3줄** · 버튼 42px 이라 **높이가 어디서나 약 262px**:

| | 히어로 크기 | 삽화 띠 높이(`카드폭 ÷ 3.027`) |
|---|---|---|
| 모바일(360px) | 328×262 | 108 |
| 모바일(390px) | 358×262 | **118** |
| 모바일(448px 상한) | 416×262 | 137 |
| PC(lg, `max-w-xl`) | 544×262 | **180** |

삽화는 카드 **아래**에 붙고 그 위는 카드 그라데이션이다. 세로로는 아무것도 잘리지 않는다.

### 글자가 지나가는 자리

텍스트·버튼은 전부 왼쪽 정렬, `padding-left: 24px`.
**제목 1줄 + 안내 2줄**로 어느 폭에서나 같다 — 카드 높이 **214px** 고정
(≤360px 폰에서만 낱말 단위로 자연스럽게 접힌다).

| | 카드 x | y |
|---|---|---|
| `TIME CAPSULE` | 24~194 | 28~46 |
| 제목 `미래의 나에게, 사랑하는 이에게` | 24~**334** | 52~80 |
| 안내 1행 `오늘의 마음을 봉인하면 정해진 날 아침에 도착해요.` | 24~**313** | 88~108 |
| 안내 2행 `개봉 전엔 나도 열어볼 수 없어요.` | 24~202 | 108~128 |
| 버튼 | 24~200 | 144~186 |

**삽화 띠 높이는 카드 폭으로만 정해진다**(카드 높이와 무관). 카드가 214px 로 낮으니
**글씨가 삽화 위로 가장 많이 올라온 상태**다 — 모바일 카드(382)에서 삽화 띠가 y 88 부터 시작해
안내 1행이 그 위를 지난다. 실측 밝기:

| | 라이트(하한 평균 205 / p5 170) | 다크(상한 평균 60 / p95 110) |
|---|---|---|
| 모바일(382) | 평균 235 · p5 234 | 라벨·제목 25 / **안내 평균 37 · p95 118** |
| PC(544) | 평균 235 · p5 234 | 라벨·제목 26~28 / 안내 평균 44 · p95 57 |

★ **모바일 안내문 p95 118 은 상한(110)을 살짝 넘는다** — 한 줄로 합친 끝자락("도착해요.")이
삽화의 **날아오르는 편지 줄**을 지나기 때문이다. 페이드 구간이라 편지가 반투명하게 비치는
정도이고, 한 줄 배치를 택한 결과로 **의도적으로 받아들인 값**이다(2026-09-06 사용자 확인).
**여기서 문구를 더 늘리면 양 머리에 올라탄다** — 늘릴 거면 밝기 검사를 반드시 다시 돌릴 것.

주인공 좌표(에셋 x 비율 = 카드 x 비율):

| 에셋 x | 무엇 | 모바일(390) | PC |
|---|---|---|---|
| 0.566 | **양의 왼쪽 끝**(안고 있는 편지) | 203 | 308 |
| 0.70~0.85 | 날아오르는 편지 줄 | 251~304 | 381~462 |
| 0.82~0.96 | 우체통 | 294~344 | 446~522 |
| 0.93 | 워터마크 ✦ 자리(제거됨) | 333 | 506 |

제목이 x 334 까지 뻗어 양(308)보다 오른쪽으로 나가지만, 그 y 대역(52~80)은 삽화의 **빈 하늘**이라
부딪히지 않는다(위 밝기표의 제목 p95 26~33 이 그 증거다).

### 다음에 다시 뽑을 때 (프롬프트 수정 지침)

이 배치는 주인공 폭 44% 를 **받아들인** 결과다. 다시 뽑아 교체할 거라면 둘 중 하나만 지키면 된다.

- **지금 배치를 유지**할 거면: 주인공은 **에셋 오른쪽 44% 안**(x 0.56~0.97), 왼쪽 56%는 빈 하늘,
  **윗변에 물체가 걸리지 않게**(아래 알파 페이드 참고), 아래 8%는 평평한 바닥.
- 프롬프트대로 **오른쪽 25%** 안에 들어온 그림이 나왔다면, `cover` + 2.2:1(플랜과 같은 문법)로
  되돌리는 편이 낫다 — 그쪽이 모바일에서 그림이 더 크게 보인다. 그때는 CSS·스크립트를 같이 되돌린다.

---

## 뽑고 나서

```
python docs/capsule-hero-process.py ~/Downloads   # 1.png(라이트) 2.png(다크)
```

한 번에 **워터마크 제거 → 위쪽 알파 페이드 → 1200 폭 webp 저장**까지 하고,
카드 그라데이션에 쓸 색과 글자 자리 밝기를 같이 찍어 준다.

**1) 워터마크 ✦ 제거 — 인페인트가 아니라 알파 역산.**
`I = bg(1-a) + 255a` 가 정확히 성립하는 하드 글리프라, 모양과 알파만 알면
`bg = (I - 255a)/(1-a)` 로 **아래 그림의 결이 그대로 살아난다**.

- 중심 **(1671.5, 471.5)**, 하드 경계는 astroid `(|x|/36)^0.62 + (|y|/36)^0.62 = 0.83`.
- 알파는 **경계로부터의 부호 있는 거리(px)의 함수**다 — 안쪽 **0.432** 로 평평하고,
  바깥으로 **13px 에 걸쳐 옅은 글로우**(0.19 → 0)가 깔린다. 이 글로우를 안 빼면 별 자국이 남는다.
  측정은 별 자리를 하모닉 인페인트로 복원해 `(I-bg)/(255-bg)` 를 1px 빈 중앙값으로.
- ★ **반지름(d) 기준으로 재면 안 된다.** astroid 는 팔과 끝점의 `|∇d|` 가 달라 같은 d 라도
  물리적 폭이 다르다 — d 기준으로 맞췄더니 경계 안쪽에 **검은 링**(잔차 −34)이 남았다.
- ★ 경계 1px(sd = −1)만 **0.31** 로 낮춰 잡는다(측정 중앙값은 0.381). 서브픽셀 위치가 곳마다
  달라 측정값을 그대로 쓰면 다크에서 잔차 −10 의 **어두운 테두리**가 생긴다.
- ★ 마지막으로 경계 링(−3.5 < sd < 2.5)에 **3×3 중앙값** 한 번. 남은 **1px 하이라이트 실선**만
  지운다 — 중앙값은 계단(진짜 엣지)을 보존하므로 새끼양 실루엣·다리·언덕 경계는 그대로다.
  (2026-09-06 1차 배포본에서 다크 새끼양 배에 별 윤곽이 보인다는 지적을 받고 여기까지 왔다.)
- ★ **`plan-hero-process.py` 의 자동 추정을 쓰면 안 된다.** 이 그림은 별이 **새끼양의 밝은 배 위**에
  앉아 배경 추정이 무너진다 — 알파 0.274, 모양은 실제 glyph보다 뚱뚱한 십자로 잡혀
  **양 몸통에 검은 얼룩**을 남겼다.
- 라이트에도 **같은 자리에 같은 알파로** 찍혀 있다(파란 언덕 위 옅은 마름모). 두 장 다 지운다.

**2) 위쪽 알파 페이드 — 하늘은 길게, 그려진 것은 짧게.**

```python
FADE_SKY = 0.42   # 하늘: y=0 투명 → 0.42H 불투명
FADE_OBJ = 0.14   # 그려진 것(salience): 훨씬 빨리 불투명
```

★ **물체도 페이드에 태우는 게 핵심이다.** 원본 윗변에 편지 한 통이 **잘린 채** 걸려 있어
(두 장 다 x 1444~1520, row 0~90) salience 로 통째로 지켜 주면 **카드 위에 직각으로 잘린 봉투**가 뜬다.
0.14H 램프면 그 편지만 스르르 사라지고 나머지 편지·구름·별은 그대로 남는다.

**3) 카드 그라데이션은 삽화 윗변 하늘색을 그대로 읽어 온다.** 스크립트가 찍어 주는 값이다.

| | 실측 하늘(에셋 윗변 좌·중·우) | 카드 CSS |
|---|---|---|
| 라이트 | `#d9ebfd` `#d9ebfd` `#daecfd` (거의 평평) | `linear-gradient(180deg,#dceefd,#d9ebfd)` |
| 다크 | `#0a132f` `#0a1434` `#131d3c` (오른쪽이 살짝 밝다) | `linear-gradient(100deg,#09122c,#0a1434 55%,#101a39)` |

다크를 **가로에 가까운 100deg** 로 둔 게 핵심이다. 삽화 폭 = 카드 폭이라 x 매핑이 어느 화면에서나
같으므로, 가로 그라데이션이면 이음매가 어디서도 안 보인다. 세로 성분을 키우면 카드 폭마다
페이드 지점의 색이 달라져 띠가 생긴다.

---

## 적용한 코드 변경 (2026-09-06 완료)

파일: `src/pages/Capsule/CapsuleList.tsx` · `capsule.css` · 새 `Capsule/heroPrefetch.ts` ·
`Home/components/TimeCapsuleCard.tsx`.

1) **밤하늘 사진과 스크림 두 겹을 삭제했다.** `bg-brand` + `<img src={capsuleHero}>` +
   좌측/하단 그라데이션 스크림 → `.capsule-hero`(카드 그라데이션) + `.capsule-hero-art`(삽화 레이어).
   `src/assets/capsule/hero.webp`(98KB)도 지웠다.
2) **잉크를 라이트/다크로 갈랐다** — 카드가 밝아졌으므로 흰 글씨는 라이트에서 못 쓴다.

| | 라이트 | 다크 |
|---|---|---|
| 라벨 `Time Capsule` | `text-[#2f6bd8]` | `dark:text-white/70` |
| 제목 | `text-[#152648]` | `dark:text-white` |
| 안내 문구 | `text-[#41527a]` | `dark:text-white/80` |
| CTA 버튼 | `bg-brand text-white` + 브랜드 글로우 | `dark:bg-white dark:text-brand` |

   **CTA 반전이 특히 중요하다** — 흰 알약을 밝은 하늘색 카드에 얹으면 버튼이 사라진다.
3) **제목·안내 첫 문장은 어느 폭에서나 한 줄** (위 "글자가 지나가는 자리" 참고).
4) **선요청**(`Capsule/heroPrefetch.ts`, `Rooms/heroPrefetch.ts` 와 같은 구조):
   CSS 배경은 preload 스캐너 사각지대라 "청크 → CSS → 렌더 → 요청"으로 한 왕복을 더 기다린다.
   `<img>` 였을 땐 없던 함정이라 **바꾸는 순간 새로 생겼다**.
   홈 타임캡슐 배너(`TimeCapsuleCard`)의 유휴 콜백에서 미리 데우고, `CapsuleList` 는 도착에 맞춰
   `.is-ready` 로 페이드인한다. **반대 테마도 유휴에 데운다**(토글 순간 그라데이션만 남는다).


## 다크 테마 프롬프트 (부치는 밤 — 먼저 뽑는다)

```
A very wide 3:1 panoramic background illustration for the header banner of a "time
capsule" page in a mobile church app, DARK MODE. IMPORTANT: this banner sits on a VERY
DEEP MIDNIGHT-NAVY card with white text laid on top, and the picture must be just as
dark as the attached night reference image — an almost-black navy night where only a
few tiny stars, one thin shooting star and one small warm lantern are bright. Do not
lighten the sky. Do not add a big blue glow.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, warm rim lighting only where the lantern reaches, no
black outlines. Use the SAME small chubby white sheep character as the attached
character reference: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep midnight navy. #0A1428 in the upper left, lifting only very slightly to
about #16224a toward the lower right — the sky must stay inside that narrow dark band
across the ENTIRE frame. A scatter of tiny blue-white stars, and in the UPPER RIGHT
QUARTER ONLY a faint, soft milky-way haze and ONE thin shooting star with a short tail.
The mood is "it is very late, and someone is quietly posting a letter to the future".
The ONLY bright things are one small AMBER lantern and the compact pool of warm light it
drops at the foot of the mailbox; that pool must not spread wider than a fifth of the
frame. Everything outside it falls back into near-black navy within a short distance.

The sheep's wool must read as DIM WARM GREY (around #b3bdd2), clearly darker than white —
never a glowing white blob. Ground and distant hills are near-black navy silhouettes.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight UPRIGHT cluster no wider than 25% of the width — taller than it is
wide, never spread out sideways. The LEFT THREE QUARTERS must be completely empty: a
smooth near-black navy gradient with a few faint tiny stars and nothing else, because a
title, three lines of white text and a button will be overlaid across it. Keep the TOP 8%
and the BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the
width and 18% of the height) as plain flat empty ground with no detail at all, and do not
push the cluster against the right edge.

Scene (right quarter): a TALL, slightly crooked wooden MAILBOX standing on a small dark
knoll — an old rounded post box on a single post, its little door hanging open, with a
small flag shaped like a four-pointed STAR raised on its side. It is much taller than the
sheep.

The joke is the size: the chubby sheep is posting ONE ENORMOUS cream ENVELOPE that is far
too big for the slot — bigger than the sheep itself. The sheep stands on its hind legs on
tiptoe, both front hooves flat against the envelope, shoulder braced, pushing it in with
its whole body weight, eyes squeezed shut in two matching curved lines, utterly solemn and
deeply determined — as if this is a perfectly reasonable way to post a letter. The
envelope is folded and buckling slightly at the corner where it meets the slot. It is
sealed with a round AMBER WAX SEAL stamped with a simple four-pointed star, and a thin
seam of warm light leaks from under its flap.

A tiny lamb stands beside the post holding up a small amber LANTERN with both front
hooves so the sheep can see, wearing a tiny knitted nightcap pushed back high on its head
so it does NOT cover the face. Both of the lamb's eyes must be clearly visible — two
simple round black dots, the same size, evenly spaced side by side on the near side of the
muzzle, in a gentle three-quarter-FRONT angle, never a flat side profile. Its muzzle is a
small closed contented smile. A small hourglass hangs from the mailbox post.

Above the mailbox, TWO OR THREE more envelopes are already drifting UP toward the upper
right corner, growing fainter and more translucent as they rise, and the last one
dissolves into a few small points of starlight — the letters leaving for the future. This
trail must stay inside the right 28% of the frame and must never drift toward the left.

Every envelope is completely blank: no addresses, no stamps, no postmarks, no letters, no
numbers, no symbols of any kind. The only marking allowed in the whole image is the wax
seal's four-pointed star.

Do NOT draw a clock face. Do NOT draw a speech bubble. Do NOT draw a moon. Do NOT draw any
user-interface elements, buttons, pills, panels or rounded rectangles anywhere. The
background must be ONE continuous soft gradient — never a rectangular block, window or box
of a different colour, and no straight background edges anywhere. No text, no letters, no
numbers, no logos. No frames, no borders, no vignette, no rounded corners. The only bright
areas in the entire image are the lantern flame, the small amber pool at the foot of the
post, the wax seal, the tiny stars and the single shooting star; everything else stays
near-black midnight navy, and the left three quarters must stay flat and empty.
```

## 라이트 테마 프롬프트 (도착한 아침)

> 다크를 먼저 확정한 뒤, **다크 결과물도 같이 첨부**하고 이 프롬프트를 붙여넣는다.
> 첫 줄에 "same mailbox, same characters, same layout as the attached night picture —
> but morning instead of night" 를 덧붙이면 두 장이 형제로 나온다.

```
A very wide 3:1 panoramic background illustration for the header banner of a "time
capsule" page in a mobile church app, LIGHT MODE. IMPORTANT: this banner is a PALE
SKY-BLUE card and DARK NAVY text is laid on top of it, so the whole image must be bright,
airy and HIGH-KEY. There must be no dark navy area, no deep blue block and no heavy shadow
anywhere in the picture. Match the brightness and the sky colour of the attached daylight
reference image exactly.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, gentle airy morning light, no black outlines. Use the
SAME small chubby white sheep character as the attached character reference: stubby legs,
tiny round black hooves, serene slightly smug smile.

Palette: pale high-key dawn. Soft white and very light sky blue (#f4f9ff through #dbeafe
to #cfe3ff) melting into warm cream (#fff5e4) low on the right, where ONE gentle
cream-gold sunbeam comes in. The deepest tone anywhere is a gentle #93bdf5 used only for
soft shadows and a distant hill. Two or three small fluffy white clouds high on the right,
light morning haze at the bottom. The ONLY saturated accent in the whole image is the
golden wax seal — and even that stays light and sun-washed. Every shadow is a soft
blue-grey, never brown, never black.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame, drawn
as ONE tight UPRIGHT cluster no wider than 25% of the width — taller than it is wide,
never spread out sideways. The LEFT THREE QUARTERS must be completely empty: just the
smooth pale sky gradient with maybe one faint distant cloud, no detail at all, because a
title, three lines of dark text and a button will be overlaid across it. Keep the TOP 8%
and the BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the
width and 18% of the height) as plain flat empty ground with no detail at all, and do not
push the cluster against the right edge.

Scene (right quarter): the SAME TALL, slightly crooked wooden MAILBOX as in the night
picture, standing on a small grassy knoll in the first light of morning — an old rounded
post box on a single post, with a small flag shaped like a four-pointed STAR raised on its
side. It is much taller than the sheep.

The joke is the size: ONE ENORMOUS cream ENVELOPE has arrived and is wedged in the mailbox
— so much bigger than the box that the little door cannot close and the envelope sticks
right out of it, corners bulging. The chubby white sheep stands on its hind legs on tiptoe
hugging the envelope with both front hooves, cheeks blushing, ears up, eyes squeezed shut
into two matching happy curved lines — overjoyed and still utterly solemn about it, as if
receiving a house-sized letter were an ordinary morning. The envelope is closed with a
round GOLDEN WAX SEAL stamped with a simple four-pointed star.

A tiny lamb stands beside the post on tiptoe, tugging at the bottom corner of the envelope
with both front hooves, cheeks puffed, thoroughly overwhelmed. Both of the lamb's eyes must
be clearly visible — two simple round black dots, the same size, evenly spaced side by side
on the near side of the muzzle, in a gentle three-quarter-FRONT angle, never a flat side
profile. Its muzzle is a small closed contented smile with two soft cheek blushes. A small
hourglass hangs from the mailbox post.

Above the mailbox, TWO OR THREE more envelopes are drifting DOWN out of the upper right
corner toward the box — the highest one is only a faint translucent outline made of a few
soft sparkles of light, the next is clearer, the nearest is solid paper — as if the letters
were coming back down from the sky. This trail must stay inside the right 28% of the frame
and must never drift toward the left.

Every envelope is completely blank: no addresses, no stamps, no postmarks, no letters, no
numbers, no symbols of any kind. The only marking allowed in the whole image is the wax
seal's four-pointed star.

Do NOT draw a clock face. Do NOT draw a speech bubble. Do NOT draw any user-interface
elements, buttons, pills, panels or rounded rectangles anywhere. The background must be ONE
continuous soft gradient — never a rectangular block, window or box of a different colour,
and no straight background edges anywhere. No text, no letters, no numbers, no logos. No
frames, no borders, no vignette, no rounded corners. The left three quarters must dissolve
into a plain pale sky-blue gradient, and nothing in the picture may be darker than a soft
mid-blue.
```

## 자주 깨지는 곳 (재생성 말고 부분 수정)

이미 잘 나온 장면을 통째로 다시 뽑으면 구도가 바뀐다. Gemini에 **그 이미지를 첨부**하고
"한 군데만 고쳐라"로 가는 편이 빠르다.

**편지·우체통에 주소·우표·글씨가 들어갔을 때** (거의 항상 그린다)

```
Keep this image exactly as it is — same composition, same lighting, same colors, same
characters, same mailbox. Change ONE thing only:

Redraw every envelope as completely blank — no addresses, no stamps, no postmarks, no
letters, no numbers, no symbols of any kind. Just plain paper rectangles with a simple flap
line, and no writing anywhere on the mailbox either. The only marking allowed in the whole
image is the round wax seal with a four-pointed star. Everything else must stay
pixel-identical.
```

**장면이 가로로 넓게 퍼졌을 때** (우체통 + 큰 편지라 특히 자주 그런다)

```
Keep the same characters, the same style and the same palette, but redraw the layout: push
the entire scene into the RIGHT QUARTER of the frame and draw it as ONE tight upright
cluster that fits inside a box no wider than 25% of the width — taller than it is wide.
Stand the mailbox up straight and turn the giant envelope upright against it instead of
laying it flat. The left three quarters must be nothing but the empty sky gradient.
```

**편지 궤적이 왼쪽으로 뻗었을 때** — 라벨·제목 위를 지나가 글씨가 지저분해진다.

```
Keep this image exactly as it is — same composition, same characters, same lighting.
Change ONE thing only: move the trail of drifting envelopes so that it stays inside the
right 28% of the frame, rising (or falling) close to the mailbox instead of spreading
across the sky. The left three quarters must be a completely smooth empty gradient with
nothing in it but the faint tiny stars.
```

**새끼양 얼굴에 눈이 한쪽만 보일 때** (3/4 측면으로 그리면 먼 쪽 눈이 주둥이에 가려진다)

```
Keep this image exactly as it is — same composition, same pose, same lighting, same colors,
same wool texture. Change ONE thing only:

Redraw the little lamb's FACE so that BOTH EYES are clearly visible. Turn its head slightly
more toward the viewer (a gentle three-quarter-front angle, not a side profile) and give it
two simple round black dot eyes, evenly spaced side by side on the near side of the muzzle,
both fully visible and the same size — exactly like the sheep character in the reference
image. Do not hide either eye behind the snout, the wool, the ear or the cap. Keep the
muzzle as a small closed contented smile with two soft cheek blushes. The head must stay
the SAME size and in the SAME place; everything else must stay pixel-identical.
```

**라이트가 너무 어둡게/파랗게 나왔을 때** — 남색 글씨가 죽는다.

```
Keep everything identical — same composition, same characters, same props. Only change the
lighting: raise the whole image to a bright high-key morning palette. The sky must be pale
(#f4f9ff to #cfe3ff) with warm cream low on the right, every shadow must be a soft light
blue-grey, and no area of the picture may be darker than a soft mid-blue.
```

**다크가 너무 밝게 나왔을 때**

```
Keep everything identical — same composition, same characters, same props. Only change the
lighting: make the night much darker. The sky must stay between #0A1428 and #16224a
everywhere, the sheep's wool must be dim warm grey rather than white, the milky-way haze
must be much fainter and confined to the upper right quarter, and the lantern's pool of
light must shrink so it only touches the mailbox and the sheep. Everything else falls into
near-black midnight navy.
```

**두 장의 우체통이 서로 다른 물건일 때** (라이트를 따로 뽑으면 자주 그렇다)

```
Keep the layout, the palette and the lighting of this morning picture exactly as they are.
Change ONE thing only: redraw the mailbox so it is the SAME object as in the attached night
picture — the same shape, the same proportions, the same crooked post, the same
four-pointed star flag, the same little open door. Only its colours change to match the
morning light.
```

---

## 적용 상태

- **2026-09-06**: 에셋 2장 생성·적용 완료.
  `public/images/capsule/hero-{light,dark}.webp` (1200×396 RGBA, 27.7KB / 32.2KB).
  제미나이 원본(1792×592) → `python docs/capsule-hero-process.py ~/Downloads` 한 방이면 끝난다.
  코드는 위 "적용한 코드 변경" 그대로 반영됐고, 타입체크·프로덕션 빌드 통과.
- **2026-09-06 (2차)**: 사용자 피드백 2건 반영.
  ① 다크 새끼양 배에 남은 별 윤곽 → 워터마크 알파 모델을 반지름 기준에서
  **부호 있는 거리 프로파일 + 경계 링 3×3 중앙값**으로 교체(위 "뽑고 나서" 1번).
  ② PC 에서 제목·안내를 각각 한 줄로 → `lg:hidden <br>` 로 폭에 따라 줄바꿈을 갈랐다.
- **2026-09-06 (3차)**: 모바일도 **제목·안내 첫 문장을 한 줄로**(`lg:hidden <br>` 전부 제거).
  모바일 안내문 끝자락이 편지 줄과 겹쳐 다크 p95 118(상한 110)이 되지만, 한 줄 배치를 택한
  결과로 받아들였다. 에셋은 그대로.
