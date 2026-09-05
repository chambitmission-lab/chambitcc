# 홈 타임캡슐 배너 배경 이미지 프롬프트 (Gemini용)

홈(기도 목록) 중간의 **타임캡슐 배너**(`Home/components/TimeCapsuleCard.tsx`, `.tc-card` —
`타임캡슐` 라벨 + "시간을 건너, / 그날 도착하는 편지" + `다음 개봉까지 D-111 · 성탄절`) 뒤에 깔 배경.
라이트/다크 각 1장. 컨셉은 칭호·이어읽기·공지 배너·교육·헌금·소식·플랜 히어로와 같은
**코지-에픽 동화풍 + 같은 양 캐릭터**, 장면은 **"시간을 건너 편지를 배달하는 양"**.

유머는 **정성 > 결과**에서 나온다 — 큰 양이 편지 뭉치를 잔뜩 안고 전력 질주하는데
**정작 봉투가 뒤로 줄줄 새어 나가고 있다**. 본인 표정은 더없이 진지하다.
새끼양이 뒤에서 떨어진 편지를 주워 담으며 따라 뛴다. 새어 나간 편지들은 오른쪽 위로 떠올라
**별빛에 섞여 사라진다** — "그날 도착하는 편지"의 서사 그대로다.

카드가 이미 갖고 있는 문법을 그대로 이어받는다:

| 카드가 이미 쓰는 것 | 그림에서 이어받는 것 |
|---|---|
| 은하수·별·별똥별 레이어 (CSS) | 편지가 **별빛으로 흩어지는 궤적** (별밭 자체는 그리지 않는다) |
| 우측 봉투 SVG의 **별 밀랍 인장** | 가장 큰 봉투 한 장에만 **별 도장 밀랍 인장** |
| 하단 앰버 글로우 (`rgba(251,191,36)`) | 봉투 틈에서 새어 나오는 **따뜻한 앰버 빛** |

> **개봉 화면 우편물 연출(`time-capsule-feature.md`의 밀랍 인장 꾹 누르기)과는 다른 물건이다.**
> 저건 인터랙션, 이건 홈 배너 뒤에 까는 삽화 한 장.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장(예: `dawn_riser.webp`) 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
   **한 세션에서 라이트 → 다크 순으로 이어서 뽑는 게 톤이 가장 잘 맞는다.**
2. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/capsule/home-banner-light.webp`
   - 다크:   `frontend/public/images/capsule/home-banner-dark.webp`
   (`public/images/capsule/` 는 아직 없다. 새로 만든다.)
3. 규격: 원본 **2:1 가로**로 뽑고, 최종은 **1024×512 RGBA WebP**,
   `cwebp -q 80 -alpha_q 92 in.png -o home-banner-light.webp`, 한 장 **35KB 이하**.
   이 배너는 홈 스크롤 중간이라 LCP는 아니지만, 홈 첫 화면 안에 들어오는 카드다. 가볍게 간다.

## 레이아웃 제약 (프롬프트의 핵심)

### 카드 실측

`.tc-card` 는 `min-height: 116px` 지만 실제 높이는 **문구 줄 수로 정해진다**
(라벨 13 + 7 + 제목 2줄 47 + 9 + 상태 18~36 + 패딩 39):

| | 카드 크기 | 비율 |
|---|---|---|
| 모바일(390px) | 약 358×134 | **≈2.7 : 1** |
| 모바일(폰 폭 상한 448px) | 약 416×134 | **≈3.1 : 1** |
| PC(lg, 피드 열 `max-w-[480px]`) | 약 448×134 | **≈3.3 : 1** |
| 상태 문구가 2줄일 때(캡슐 0개 기본 카피) | 높이 **≈152** | — |

**높이는 거의 고정, 가로만 358~448 사이에서 변한다.** 공지 배너와 같은 상황이다.

→ **`cover` 금지.** 카드 자신의 그라데이션은 그대로 두고,
`background-size: auto 100%; background-position: right center` 로 **오른쪽 끝에 높이맞춤**해서 얹는다.
그래야 이미지의 오른쪽 끝 = 카드의 오른쪽 끝이 항상 일치하고, 아래 좌표가 어디서나 성립한다.

### 화면에서 그림이 차지하는 크기

2:1 원본을 높이 134px 로 맞추면 **폭 268px**. 모바일 카드(358)의 **75%** 다. 너무 넓다.
그래서 **원본의 오른쪽 절반 안에서만 그린다** — 실제 그림 덩어리는 화면에서 약 **134px 폭**,
카드의 오른쪽 **37%** 만 차지한다. 나머지 왼쪽 절반은 알파로 지워져 카드 그라데이션이 그대로 비친다.

### 글자가 지나가는 자리

텍스트는 전부 **왼쪽 정렬**이고 `padding-left: 18px`. 실측 문자열 폭(모바일):

| 줄 | 대략 폭 | 끝나는 x |
|---|---|---|
| `타임캡슐` (11px/700) | 46 | 64 |
| `그날 도착하는 편지` (17.5px/800) | 145 | 163 |
| `다음 개봉까지 D-111 · 성탄절` (11.5px) | 152 | 170 |
| `미래의 나에게, 사랑하는 이에게 — …` (기본 카피, 2줄) | 각 ≈250 | **268** |

**최악의 케이스(기본 카피)가 268px** 다. 그림 덩어리가 시작되는 x = 358 − 134 = **224**.
→ 기본 카피일 때만 글자 끝과 그림 왼쪽이 **44px 겹친다.**
그래서 그림의 **왼쪽 1/3은 반드시 옅고 어두운 저대비 구간**(달리는 양의 뒤쪽 먼지·긴 그림자)이어야 하고,
밝은 하이라이트는 **원본 x 78% 오른쪽**에만 둔다.

### 그래서 규칙

- **주인공은 원본 오른쪽 절반(x 50%~100%) 안에, 한 덩어리로.** 가로로 펴면 모바일에서 글씨에 먹힌다.
- **왼쪽 절반(x 0~50%)은 완전히 빈 배경.** 잔디·잔가지·작은 점·별밭 전부 금지.
  (별은 카드 CSS가 이미 3겹으로 깜빡이고 있다. 그림에 또 뿌리면 **두 겹이 어긋나 지저분해진다.**)
- **오른쪽 끝 6%는 비워 둔다** — 카드 우측 패딩(16px)이라 그림이 벽에 붙어 보이면 안 된다.
- **오른쪽 아래 모서리(폭 12% × 높이 20%)는 평평한 빈 바닥.**
  Gemini 워터마크 ✦ 가 떨어지는 자리다. 양을 오른쪽 끝에 딱 붙이면 워터마크가 얼굴에 얹힌다.
- **위 8% · 아래 8%는 빈 여백.** 카드가 `overflow: hidden` 이라 끝이 잘린다.
- 캐릭터 머리는 바닥에서 **68%** 를 넘지 않는다(카드가 134px 로 낮다 — 크게 그리면 답답하다).
- **얼굴은 정면에 가까운 3/4 각도, 두 눈이 다 보이게.** 옆모습으로 그리면 먼 쪽 눈이 주둥이에
  가려져 어색하다(한 번 겪었다). 다크 새끼양의 나이트캡도 **눈을 덮지 않게 뒤로 젖혀 쓴다.**
- **말풍선 금지.** 참고 시안의 "과거의 내 센스 믿고 있다구!" 같은 대사는 **CSS/JSX 로 얹는다.**
  Gemini는 한글을 못 쓴다(거의 항상 깨진 글자를 그린다). 그림엔 아예 넣지 않는다.
- 글자·숫자·로고 금지. **봉투에도 주소·우표 숫자 금지** — 민무늬 봉투 + 별 밀랍 인장만.
- 시계 문자판 금지(숫자가 딸려 온다). 시간을 나타내는 소품은 **작은 모래시계 하나**만 허용.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리(`border-radius: 20px`)는 CSS가 처리한다.
- **왼쪽 알파 페이드를 에셋에 굽는다**(x 0~46% 완전 투명 → 78% 완전 불투명).
  CSS 가로 워시로 덮는 방식은 쓰지 말 것 — 카드 그라데이션이 `168deg` 라 각도가 어긋나 띠가 보인다.

### ★ 라이트와 다크의 차이는 밝기다 (플랜 히어로와 반대)

`.tc-card` 는 라이트/다크 카드 색이 **완전히 다르다.** 글씨 색도 갈린다.

| | 카드 바탕 | 글씨 | 그림 톤 | 유일한 따뜻한 광원 |
|---|---|---|---|---|
| 라이트 | `#e6f1ff → #f3f8ff → #fff5e4` (연한 아침 하늘→크림) | 남색 `#1a2a4a` | **하이키 파스텔** | 우하단 크림-골드 햇살 |
| 다크 | `#101a36 → #182347 → #2b2a52` (인디고 밤) | 흰색 | **저채도 어두운 남보라** | 앰버 등불빛 |

라이트를 어둡게 뽑으면 카드에서 시커먼 덩어리로 뜬다. 다크를 밝게 뽑으면 흰 글씨가 죽는다.
**두 장 다 "카드색에 녹아드는 톤"이 정답이고, 대비는 실루엣이 아니라 선으로 만든다.**

---

## 라이트 테마 프롬프트

```
A wide 2:1 side illustration that will sit at the RIGHT END of a short, wide banner
card in a mobile church app, LIGHT MODE. The banner is about 358x134 pixels on
screen, so the artwork will be displayed only about 134 pixels tall — keep it
extremely simple and readable at thumbnail size: three or four clear silhouettes and
nothing else. Style: cozy-epic children's storybook illustration — soft flat shapes
with subtle grain texture, rounded friendly forms, gentle airy morning light. Use the
SAME small chubby white sheep character as the attached reference image: stubby legs,
tiny round black hooves, serene slightly smug smile.

Palette: pale morning sky. The background is a soft wash of very light sky blue
(#e6f1ff) melting into warm cream (#fff5e4) toward the lower right, with ONE gentle
cream-gold sunbeam low on the right. Keep everything HIGH-KEY and low-contrast —
pastel, airy, almost washed out — because this sits on a very pale card and dark navy
text is laid across the left side. The deepest tone anywhere is a soft slate blue used
only for thin outlines and a long soft shadow. No dark masses, no saturated colours,
no black outlines.

Composition is critical:
- The whole scene sits inside the RIGHT HALF of the frame, drawn as ONE tight cluster.
  Do not spread the characters horizontally.
- The LEFT HALF must be completely empty — nothing but the smooth pale gradient,
  dissolving away, because a title and body text will be overlaid across it.
- Keep the TOP 8% and the BOTTOM 8% as calm empty margin.
- Keep the RIGHT 6% empty and calm.
- Leave the BOTTOM-RIGHT CORNER (about 12% of the width and 20% of the height) as
  plain flat empty ground with no detail at all.
- The left third of the scene must stay LOW-CONTRAST and soft (running dust puffs and
  a long pale shadow); put every bright highlight in the right quarter only.

Scene: a sheep POSTMAN of time, caught mid-run. The chubby white sheep dashes toward
the RIGHT on its hind legs, a honey-brown leather satchel bouncing on its side,
hugging a great armload of plain cream ENVELOPES against its chest, tiny motion lines
and two soft dust puffs at its hooves. Its head is turned toward the viewer in a gentle
three-quarter-FRONT angle — never a flat side profile — so that BOTH eyes are visible,
drawn as two matching closed curved lines squeezed shut with utterly solemn
determination.

The joke: the satchel's flap is wide open and the envelopes are quietly LEAKING OUT
BEHIND IT in a trailing arc — five or six letters tumbling away, and the sheep has no
idea. The escaping envelopes drift up toward the upper right, growing fainter and more
translucent, and the last two dissolve into small soft sparkles of light, as if
carried off into the sky.

Behind the sheep a tiny lamb chases after it, scooping up one fallen envelope with
both front hooves, cheeks puffed, thoroughly overwhelmed. The lamb's head is ALSO
turned toward the viewer at a three-quarter-front angle so that BOTH of its eyes are
clearly visible — two simple round black dots, the same size, evenly spaced side by
side on the near side of the muzzle. Never a flat side profile, and never one eye
hidden behind the snout, the ear or the wool. Its muzzle is a small closed contented
smile with two soft cheek blushes. A small hourglass with pale sand swings from the
satchel strap.

ONE envelope is special: the largest one in the sheep's arms is closed with a round
GOLDEN WAX SEAL stamped with a simple four-pointed star. All the other envelopes are
completely plain — no addresses, no stamps, no writing, no numbers, no symbols of any
kind.

Do NOT draw a starfield or scattered stars in the background — only the few sparkles
where the letters dissolve. Do NOT draw a speech bubble. Do NOT draw a clock face. Do
NOT draw any user-interface elements, buttons, pills, panels or rounded rectangles.
The background must be ONE continuous soft gradient — never a rectangular block,
window or box of a different colour, and no straight background edges anywhere. No
text, no letters, no numbers, no logos. No frames, no borders, no vignette, no rounded
corners. The left half must dissolve into a plain pale sky-blue gradient.
```

## 다크 테마 프롬프트

```
A wide 2:1 side illustration that will sit at the RIGHT END of a short, wide banner
card in a mobile church app, DARK MODE. The banner is about 358x134 pixels on screen,
so the artwork will be displayed only about 134 pixels tall — keep it extremely simple
and readable at thumbnail size: three or four clear silhouettes and nothing else.
Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, warm rim lighting. Use the SAME small chubby
white sheep character as the attached reference image: stubby legs, tiny round black
hooves, serene slightly smug smile.

Palette: deep INDIGO NIGHT — #101a36 at the left, lifting through #182347 into a
faintly violet #2b2a52 toward the right. NOT black, NOT teal. The ONLY bright accent
is a warm AMBER glow low on the right, leaking from the envelopes themselves, plus a
thin cool blue-white rim light along the top of the sheep. Keep everything muted and
low-contrast, because white text is laid across the left side; the sheep's wool must
read as soft warm grey, never bright white.

Composition is critical:
- The whole scene sits inside the RIGHT HALF of the frame, drawn as ONE tight cluster.
  Do not spread the characters horizontally.
- The LEFT HALF must be completely empty — nothing but the smooth dark indigo
  gradient, dissolving away, because a title and body text will be overlaid across it.
- Keep the TOP 8% and the BOTTOM 8% as calm empty margin.
- Keep the RIGHT 6% empty and calm.
- Leave the BOTTOM-RIGHT CORNER (about 12% of the width and 20% of the height) as
  plain flat empty ground with no detail at all.
- The left third of the scene must stay dark and low-contrast (running dust puffs
  swallowed by shadow); put every bright highlight in the right quarter only.

Scene: a sheep POSTMAN of time, caught mid-run at night. The chubby sheep dashes
toward the RIGHT on its hind legs, a dark leather satchel bouncing on its side,
hugging a great armload of ENVELOPES that glow faint cream in the dark, tiny motion
lines and two soft dust puffs at its hooves. Its head is turned toward the viewer in a
gentle three-quarter-FRONT angle — never a flat side profile — so that BOTH eyes are
visible, drawn as two matching closed curved lines squeezed shut with utterly solemn
determination.

The joke: the satchel's flap is wide open and the envelopes are quietly LEAKING OUT
BEHIND IT in a trailing arc — five or six letters tumbling away, and the sheep has no
idea. The escaping envelopes drift up toward the upper right, growing fainter and more
translucent, and the last two dissolve into small soft points of starlight, as if
carried off into the night sky.

Behind the sheep a tiny lamb chases after it, scooping up one fallen envelope with
both front hooves, cheeks puffed, thoroughly overwhelmed, wearing a tiny knitted
nightcap pushed back high on its head so that it does NOT cover the face. The lamb's
head is ALSO turned toward the viewer at a three-quarter-front angle so that BOTH of
its eyes are clearly visible — two simple round black dots, the same size, evenly
spaced side by side on the near side of the muzzle. Never a flat side profile, and
never one eye hidden behind the snout, the ear, the wool or the cap. Its muzzle is a
simple closed contented smile with two soft cheek blushes — nothing in its mouth, no
tongue, no object touching the face. A small hourglass swings from the satchel strap,
its sand catching one amber highlight.

ONE envelope is special: the largest one in the sheep's arms is closed with a round
AMBER WAX SEAL stamped with a simple four-pointed star, and a thin seam of warm light
leaks from under its flap — the only truly bright thing in the picture.

Do NOT draw a starfield or scattered stars in the background — only the few points of
light where the letters dissolve. Do NOT draw a moon. Do NOT draw a speech bubble. Do
NOT draw a clock face. Do NOT draw any user-interface elements, buttons, pills, panels
or rounded rectangles. The background must be ONE continuous soft gradient — never a
rectangular block, window or box of a different colour, and no straight background
edges anywhere. No text, no letters, no numbers, no logos. No frames, no borders, no
vignette, no rounded corners. The only bright areas are the glowing envelopes, the wax
seal and the dissolving points of light; the left half must stay flat deep indigo.
```

---

## 뽑고 나서 (후처리)

```
python docs/capsule-banner-process.py      # ~/Downloads/1.png(라이트) 2.png(다크)
```

워터마크 제거 → 라이트 배경 색 보정 → 오른쪽 확장 → 알파 페이드 → webp 저장까지 한 번에 한다.
좌표는 전부 **1456×720 원본 기준 실측값**이라, 삽화를 다시 뽑으면
`WM_C`(워터마크 중심)와 `FADE`(페이드 구간)를 다시 재야 한다. 자세한 건 아래 "적용 상태".

## 적용 상태 (2026-09-05) — 적용 완료

- **에셋**: `public/images/capsule/home-banner-{light,dark}.webp` (888×540 RGBA, 31KB / 35KB).
  제미나이 원본(1456×720) → `python docs/capsule-banner-process.py` 한 방이면 끝난다.
  - **워터마크 ✦ 제거는 인페인트가 아니라 알파 역산.** 중심 **(1335, 604.5)**, 다이아몬드
    반폭·반높이 **27×21**, 실측 **피크 알파 0.324**(플랜 히어로의 0.310과 같은 계열).
    다크에서 잰 알파 맵을 라이트에도 그대로 쓴다 — 두 장의 워터마크가 같은 좌표·같은 알파다.
    - 별 바로 위가 **새끼양 뒷발굽**이다. 회귀에서 뺄 밝기 임계(110)와 복원에서 뺄 임계(170)를
      **따로 둬야 한다** — 하나로 묶으면 별의 아래 꼭짓점(밝기 100~115)이 임계에 걸려
      **세로로 긴 잔상이 남는다**(한 번 겪었다). 복원은 `y ≥ 586`(발굽 바닥) 아래로 제한한다.
    - TELEA 인페인트 금지. 발굽 실루엣을 빨아들여 얼룩이 남는다.
  - **라이트 배경만 브랜드 쪽으로 14° 회전**(시안 h≈197° → 211°). 배경으로 판정된 픽셀에만
    적용해 크림색 양·회색 외곽선은 건드리지 않는다.
  - **오른쪽으로 168px 확장** — 화살표 버튼이 앉을 빈 하늘을 만든다. 가장자리 열을 그냥
    늘리면 **새끼양 그림자가 세로 줄무늬로 번지므로**, 배경 모델(좌측 절반 + 상단 띠로 맞춘
    bilinear)로 서서히 녹인다.
  - **알파 페이드**: 가로는 원본 x 500→745, **세로는 위 240px(에셋 높이의 33%)**.
    ★ 위 페이드는 **하늘에만** 건다 — 배경 모델과 다른 픽셀(양·편지·그림자·반짝임)은
    salience 로 불투명하게 남긴다. 균일하게 걸면 양 머리까지 반투명해진다.
    - 위 페이드를 짧게(58px) 잡았더니 **홈 PC 사이드바에서 가로줄이 보였다**: 사이드바는
      `lg:w-[368px]` 고정이라 카드가 336px, 삽화는 폭 기준으로 189×115 → 카드(134px)보다
      **19px 낮게** 앉는다. 그 윗변에서 에셋의 오른쪽 위 하늘(`#1b2143`)이 카드
      그라데이션(`#101932`)보다 밝아 경계가 드러난 것. 하늘을 길게 녹여 없앴다
      (윗변 밝기 차 실측 **0.00**).
    - 하늘을 지워도 보이는 색은 그대로다 — 카드 그라데이션을 에셋 배경색에 맞춰 뒀기 때문.

- **카드 그라데이션은 삽화 배경색에서 역산했다.** 여기가 어긋나면 알파 페이드 구간에 세로 띠가 보인다.

  | | 카드 `linear-gradient(165deg, …)` | 삽화 페이드 구간 실측 |
  |---|---|---|
  | 다크 | `#101932 → #171e40 55% → #1f2248` | 위 `#121b38` · 가운데 `#171d40~#1d2348` · 아래 `#1f2248` |
  | 라이트 | `#cfe2f5 → #d9e6f4 55% → #e3ebf4` | 위 `#cce0f2` · 가운데 `#d7e4f6~#dde7f1` · 아래 `#e1e9f2` |

  각도를 **세로에 가깝게(165deg)** 둔 게 핵심이다. 삽화는 카드 폭이 358~448 로 변해도 항상
  오른쪽 220px 를 차지하므로, 가로 그라데이션을 쓰면 폭마다 이음매 색이 달라진다.

- **배치**: `cover` 금지. `background-position: right bottom` + **폭 기준 배율**.

  ```css
  .tc-card__art  { background-size: clamp(0px, calc(135% - 265px), 220px) auto; }
  .tc-card__body { padding-right: clamp(0px, calc(100% - 162px), 163px); }
  ```

  **★ 배율을 카드 높이로 잡으면(`auto 100%`) PC 에서 터진다.** 피드 칼럼
  (`NewHome.tsx` 의 `lg:max-w-[480px]`)은 flex 아이템이라 **좌측 레일이 펼쳐지면 480px 아래로
  줄어든다**(1024~1200px 구간). 그런데 삽화는 높이로만 정해져 그대로 220px 를 차지하니
  글자 자리가 120px 로 쪼그라들고 → 문구가 두 줄로 접히고 → 카드가 자라고 → **삽화가 더 커지는
  되먹임**이 돈다. 실제로 "다음 / 개봉까지", "D- / 111" 로 낱글자가 끊기고 제목이 양과 겹쳤다.
  폭 기준으로 바꾸면 삽화와 여백이 같이 줄어 **글자 폭이 어느 칼럼에서나 178px 아래로 안 내려간다**.

  | 카드 폭 | 삽화 | `padding-right` | 글자 폭 |
  |---|---|---|---|
  | 448 (PC 넓음) | 220×134 | 163 | 267 |
  | 358 (모바일 390) | 218×133 | 162 | 178 |
  | 328 (모바일 360) | 178×108 | 132 | 178 |
  | 304 (PC 좁은 칼럼) | 145×88 | 108 | 178 |
  | 280 | 113×69 | 84 | 178 |

  - **두 식은 짝이다.** 진한 그림은 삽화 폭의 오른쪽 74% 지점에서 시작하고
    (에셋 좌표 x 748, 전체 1184), 220px = 카드 높이 134px 를 꽉 채우는 폭이다.
    하나만 바꾸면 글자가 양 위로 올라탄다.
  - `background-size` 의 `%` 는 카드 폭 기준, `padding-right` 의 `%` 는 **카드 콘텐츠 박스**
    (폭 − 좌우 패딩 34px) 기준이다. 상수 265 와 162 가 다른 이유가 이것뿐이다.
  - **`clamp()` 폴백 한 줄을 앞에 둔다**(`background-size: auto 100%` / `padding-right: 162px`).
    빼면 clamp 를 못 읽는 브라우저에서 `auto auto` 로 떨어져 삽화가 원본 크기로 뜬다.
  - 상태 줄은 `white-space: nowrap` + `flex-wrap: wrap` — 폭이 모자라도 항목 **안에서는**
    안 쪼개지고(D- / 111 방지), 정 안 되면 항목 단위로 줄바꿈한다.
  - 화살표 버튼은 30px 고정이라 카드가 330px 아래로 좁아지면 새끼양 뒤쪽에 조금 걸친다.
    (삽화의 오른쪽 빈 여백은 삽화 폭의 19%라 같이 줄어들기 때문.) 거슬리면 버튼도
    `min(30px, calc(26% - 55px))` 로 같이 줄일 것.

- **JSX**: 기존 봉투 SVG(`.tc-card__visual`, `.tc-env*`)는 **삭제**했다. 봉투가 두 개
  (그림 속 봉투 + SVG 봉투)가 되면 오른쪽이 뭉갠다.
- **참고 시안에서 가져온 것**(다크 배너 시안, 토스 블루로 갈아입힘):
  - 제목 둘째 줄 액센트 — `그날 <em>도착하는 편지</em>` (다크 `#93b8ff` / 라이트 `#2563eb`)
  - **D-day 칩** `.tc-card__dday` — 숫자가 문장에 묻히지 않게 알약으로 떼어 냈다
  - **원형 화살표 버튼** `.tc-card__go` — 브랜드색 `#3182f6`, 삽화 오른쪽 빈 하늘 위
  - 라벨은 시안의 `TIME CAPSULE ✦` 대신 **한글 `타임캡슐`** 유지(영문 대문자 자간 라벨은 광고 문법).
    금색이던 라벨을 차가운 회색으로 내려 강조를 제목·칩에 몰아줬다.
- **문구를 한 줄에 맞게 줄였다** — 두 줄이 되면 위의 되먹임이 터진다.
  `도착한 캡슐 N개가 기다리고 있어요` → `…기다려요`,
  `미래의 나에게, 사랑하는 이에게 — 지금의 마음을 봉인해보세요` → `지금 이 마음을 봉인해보세요`.
- **별·은하수 좌표를 카드 왼쪽으로 옮겼다.** 오른쪽은 삽화가 덮어 안 보인다.
  별똥별 출발점도 `left: 72%` → `44%`.
- **반대 테마 데우기**(`css-background-image-late-discovery`): CSS 배경은 지금 매칭되는 한 장만
  받으므로, 테마를 토글하면 반대 테마를 맨땅에서 받는다 → `TimeCapsuleCard.tsx` 의 유휴
  콜백에서 반대 테마 한 장을 미리 데운다. 홈은 첫 화면이라 `<link rel="preload">` 는 걸지 않았다
  (카드가 스크롤 중간이라 LCP 리소스와 우선순위를 다툰다).
- 말풍선("과거의 내 센스 믿고 있다구!")은 넣지 않았다. 넣으려면 `.tc-card__art` 위에 `<span>`
  으로 얹는다 — 그림에 그려 넣게 하면 한글이 깨진다.

---

## 자주 깨지는 곳 (재생성 말고 부분 수정)

이미 잘 나온 장면을 통째로 다시 뽑으면 구도가 바뀐다. Gemini에 **그 이미지를 첨부**하고
"한 군데만 고쳐라"로 가는 편이 빠르다.

**봉투에 주소·우표·글씨가 들어갔을 때** (거의 항상 그린다)

```
Keep this image exactly as it is — same composition, same lighting, same colors, same
characters, same envelopes. Change ONE thing only:

Redraw every envelope as completely blank — no addresses, no stamps, no postmarks, no
letters, no numbers, no symbols of any kind. Just plain paper rectangles with a simple
flap line. The only marking allowed in the whole image is the round wax seal with a
four-pointed star on the single largest envelope. Everything else must stay
pixel-identical.
```

**장면이 가로로 넓게 퍼졌을 때**

```
Keep the same characters, the same style and the same palette, but redraw the layout:
push the entire scene into the RIGHT HALF of the frame and draw the characters as ONE
tight cluster. The left half must be nothing but the empty gradient. Keep the
characters small — their heads must not reach higher than 68% up from the bottom edge.
```

**새끼양 얼굴에 눈이 한쪽만 보일 때** (3/4 측면으로 그리면 먼 쪽 눈이 주둥이에 가려진다)

```
Keep this image exactly as it is — same composition, same pose, same lighting, same
colors, same wool texture, same envelope. Change ONE thing only:

Redraw the little lamb's FACE so that BOTH EYES are clearly visible. Turn its head
slightly more toward the viewer (a gentle three-quarter-front angle, not a side
profile) and give it two simple round black dot eyes, evenly spaced side by side on
the near side of the muzzle, both fully visible and the same size — exactly like the
sheep character in the reference image. Do not hide either eye behind the snout, the
wool or the ear. Keep the muzzle as a small closed contented smile with two soft cheek
blushes. The head must stay the SAME size and in the SAME place; the body, legs, hooves
and everything else in the picture must stay pixel-identical.
```

**배경에 별을 잔뜩 뿌렸을 때** (카드 CSS 별과 두 겹이 되어 지저분해진다)

```
Keep this image exactly as it is — same composition, same characters, same lighting.
Change ONE thing only: remove ALL the background stars and sparkles. The sky must be a
completely smooth, empty gradient. Keep only the two or three tiny points of light
where the escaping envelopes dissolve, right next to the letters themselves.
```

**라이트가 너무 어둡게 나왔을 때** — 카드가 창백해서 그림만 시커먼 덩어리로 뜬다.
고쳐 그리게 하지 말고, 그림 영역 밝기를 재서 **평균이 200 위**로 올라가게 곱연산으로 띄운다.
그래도 뜨면 알파 상한을 0.85 로 낮춰 카드색에 섞는다.
