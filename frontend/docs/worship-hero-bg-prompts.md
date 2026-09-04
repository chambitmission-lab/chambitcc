# 예배 안내 히어로 배경 이미지 프롬프트 (Gemini용)

`/worship` 상단 **히어로 카드**(`Worship.css` `.worship-hero` — WORSHIP 배지 + "예배 안내" +
안내 문구 + `주일예배 N`·`평일예배 N` 통계 버튼 + 오른쪽 카운트다운 배너) 뒤에 깔 배경.
라이트/다크 각 1장. 컨셉은 칭호·이어읽기·공지 배너·교육·헌금 배경과 같은
**코지-에픽 동화풍 + 같은 양 캐릭터**, 장면은 **"예배 시간을 알리는 양들"**.

유머는 **종 줄**에서 나온다 — 새끼양이 예배 시작 종을 치려고 줄을 당겼는데
**줄에 딸려 제 몸이 공중으로 떠올랐다**. 표정은 더없이 진지하다(원래 이러려던 것처럼).
그 아래로 양들이 예배당 문으로 줄지어 들어간다. 카드의 주인공이 "다음 예배까지 남은 시간"
카운트다운이라 **종 = 시간 알림**이 그림과 기능이 맞물린다.

---

## ⚠ 이 화면만의 제약 — 하늘을 그리면 안 된다

`.worship-hero` 는 **다음 예배 시간대에 따라 하늘 무드가 4가지로 바뀐다**
(`worship-hero--dawn / --day / --dusk / --night`, 색은 `theme.css` 의 `--worship-sky-*`).
이 그라데이션은 삽화 **위에** 반투명으로 덮인다. 즉 한 장의 그림이 새벽·낮·저녁·밤 washes
네 가지를 전부 뒤집어쓴다. 그래서 프롬프트에 **반드시** 넣어야 하는 문장:

- **해·달·별·노을색 하늘·긴 방향성 그림자 금지.** 그리면 CSS 밤하늘 위에 대낮 해가 겹친다.
- 조명은 **평평하고 균일하게**. 시간대는 CSS가 말한다, 그림은 "무대"만 맡는다.
- (다크만 예외) **작은 랜턴 불빛 한 점**은 허용 — 다크 테마는 네 무드 모두 어두운 톤이라
  앰버 한 점은 어느 무드에서도 어긋나지 않는다.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
2. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/worship/hero-light.webp`
   - 다크:   `frontend/public/images/worship/hero-dark.webp`
3. 규격: **2:1 가로 (1536×768 권장)**, `cwebp -q 78 원본.png -o hero-light.webp`,
   한 장 **60KB 이하**. 크게 뽑았으면
   `magick in.png -resize 1536x768^ -gravity south -extent 1536x768 out.png` 로 **아래쪽 기준** 크롭.

---

## 레이아웃 제약 (프롬프트의 핵심)

이 카드는 **모바일에선 세로 스택, PC에선 2단 그리드**라 비율이 크게 달라진다.
(모바일: 제목 → 통계 2칸 → 라이브/카운트다운 배너. PC: 왼쪽 제목+통계 / 오른쪽 카운트다운 패널.)

| | 지금 카드 크기 | 삽화 띠(`padding-bottom`)를 더한 뒤 | 비율 |
|---|---|---|---|
| 모바일(390px) | 약 358×272 | 약 358×**368** | **≈1 : 1** |
| PC(rail 있는 폭) | 약 770×215 | 약 770×**287** | **≈2.7 : 1** |

2:1 원본을 `cover; center bottom` 으로 깔면:

| | 보이는 영역 |
|---|---|
| 모바일 | 세로 **전체**, 가로는 **가운데 49%** |
| PC | 가로 **전체**, 세로는 **아래 75%** |

→ 교집합은 **"아래쪽 띠 × 가운데 절반"**. 교육 배경과 같은 규칙이다. 그래서:

- **핵심 장면(예배당 + 종탑 + 양들)은 화면 아래 38% 안, 가로는 가운데 50% 안에.**
- 왼쪽·오른쪽 바깥 1/4은 **PC에서만 보이는 보너스 소품** 자리.
- **위쪽 62%는 거의 비워 둔다** — 제목·통계 박스·카운트다운 패널이 통째로 그 위를 지나간다.
- **이 카드는 내용이 빽빽하다.** 지금 그대로면 배경이 보일 자리가 없다 →
  `.worship-hero` 에 **`padding-bottom`(모바일 ~104px / PC ~76px)** 을 줘서
  콘텐츠 아래에 삽화 띠를 만든 다음 깐다. (교육 히어로에서 쓴 수법과 같다.)
- 그래서 **양들의 머리는 바닥에서 20%를 넘지 않게**. 종탑·매달린 새끼양만 예외로 **36%**까지.
  더 높으면 통계 박스(반투명 유리) 뒤로 숨는다.
- 히어로 글씨는 라이트에서 **어두운 잉크**이고 통계 박스는 **반투명 흰 유리**다
  → 라이트는 아주 창백한 high-key. 다크는 흰 글씨 → 차콜 위에 저채도로.
- **오른쪽 아래 모서리는 반드시 빈 바닥**으로 비운다. 1456×720 산출물 기준 ✦ 는
  **중심 (1335, 599)·지름 48px** 에 떨어진다 — 즉 오른쪽 끝에서 약 8%, 아래에서 약 17% 지점.
  **나무 간판처럼 구조가 있는 소품을 오른쪽 1/4에 두지 말 것.** 두 번째 판이 그랬고,
  ✦ 가 간판 위에 얹혀서 평평한 바닥이면 1분이면 끝날 제거가 반나절짜리가 됐다
  (결국 간판을 통째로 지웠다). 간판·팻말은 **왼쪽 1/4**에, 오른쪽엔 클로버·작은 하트처럼
  납작한 것만.
- 글자·숫자·로고 금지. **종탑에 시계 문자판 금지**(제미나이가 자주 그리고, 숫자가 들어간다).
  찬송가 표지·간판도 **민무늬**로.
- **양이 안고 있는 소품은 양털과 다른 색·또렷한 기하 형태여야 한다.** 크림색 베개처럼
  양털과 같은 톤의 물렁한 덩어리를 안기면 제미나이가 그 위에 접힌 자국과 어두운 점을 찍어
  **몸통이 하나 더 붙은 것처럼(= 다리 6개) 보인다.** 실제로 다크 첫 판이 그랬다.
  나무 갈색·앰버·뜨개 색처럼 대비되는 색으로, **바닥 근처에 어두운 점이 생기지 않게** 못 박을 것.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리는 CSS가 처리한다.
- 다크 카드 바탕은 남색이 아니라 **따뜻한 차콜 `#201f1f`**.

---

## 라이트 테마 프롬프트

```
A wide 2:1 background illustration for the header card of a "worship service guide"
page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy text and
translucent white glass panels will be laid on top, so the whole image must stay
bright and low-contrast). Style: cozy-epic children's storybook illustration — soft
flat shapes with subtle grain texture, rounded friendly forms, gentle even light.
Use the SAME small chubby white sheep character as the attached reference image:
stubby legs, tiny round black hooves, serene slightly smug smile.

CRITICAL — the sky must stay TIME-NEUTRAL. The app paints its own dawn / midday /
dusk / night colour wash on top of this image, so do NOT draw a sun, a moon, stars,
sunset or sunrise colours, or long directional shadows. Light the whole scene evenly
and flatly, as if on a bright overcast morning.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey-wood, a little pastel mint and apricot.
Warm and reverent, gently funny, never flashy.

Composition is critical: ALL of the artwork sits in the BOTTOM 38% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 62% must be
almost completely empty — just a smooth pale blue-to-cream gradient with maybe two
very faint white clouds and a few tiny floating sparkle dots — because a title, two
stat boxes and a countdown panel will be overlaid there. Leave the BOTTOM-RIGHT
CORNER (about 8% of the frame) as plain flat empty ground with no detail at all.

Main scene (center, bottom band): a tiny honey-wood CHAPEL with a round-arched open
door and a small open BELL TOWER on its roof holding one simple brass bell. The
tower has NO clock face and NO numbers anywhere. A rope hangs from the bell down
toward the ground.

The joke is the bell rope: a tiny lamb has pulled it to call everyone to worship and
the rope has yanked the lamb clean off the ground — it dangles in mid-air halfway up
the rope, both front hooves clamped on, back legs straight out, ears flying upward,
wearing an utterly solemn and dignified expression as if this were entirely
intentional. Two small motion arcs and three little curved sound ripples beside the
swinging bell — curved lines only, absolutely no letters.

Below, a short line of sheep files happily in through the chapel door: one grown
sheep holds the door open with a warm, proud, slightly smug smile; one lamb waddles
in hugging an ENORMOUS closed hymn book almost as big as itself, held upside down
and completely blank on the cover; one last lamb gallops in late from the left with
all four legs off the ground and a little ribbon streaming loose behind it.

Every sheep must read as ONE clean silhouette with exactly FOUR legs (two visible
pairs from the side). Any object a sheep holds must be an obviously different colour
from the wool and must never have dark spots near the ground that could be mistaken
for extra hooves.

Keep them all SMALL and low — the sheep on the ground must have heads no higher than
20% up from the bottom edge, and the chapel with its bell tower and the dangling
lamb must not exceed 36%. Bonus props spread into the far LEFT and far RIGHT
quarters along the same bottom band, low and simple. Put the taller props — a tiny
blank wooden signboard, one small potted plant — in the LEFT quarter only. The RIGHT
quarter may hold nothing but a few flat clover leaves and one small heart lying on
the ground, and the right-hand 12% of the frame must stay completely empty.

No text, no letters, no numbers, no logos anywhere — the bell, the signboard and the
hymn book must all be completely blank. No clock faces. No sun, no moon, no stars,
no sunset colours. No frames, no borders, no vignette, no rounded corners. The top
must fade into a plain almost-white pale blue gradient.
```

## 다크 테마 프롬프트

```
A wide 2:1 background illustration for the header card of a "worship service guide"
page in a mobile church app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
warm rim lighting. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint in the
upper area — NOT navy blue, NOT black. The mood is "the dawn prayer meeting, and
nobody is fully awake yet". The ONLY bright accent is a small AMBER lantern glow
near the chapel door. Keep everything else muted and low-contrast so light text
stays readable, and let the wool read as soft warm grey, never bright white.

CRITICAL — the sky must stay TIME-NEUTRAL. The app paints its own dawn / midday /
dusk / night colour wash on top of this image, so do NOT draw a moon, stars, a sun,
sunrise colours, or long directional shadows. Apart from the one small lantern, keep
the lighting flat and even.

Composition is critical: ALL of the artwork sits in the BOTTOM 38% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 62% must be
almost completely empty — a smooth dark charcoal gradient with a few faint dust
motes catching the lantern light — because a title, two stat boxes and a countdown
panel will be overlaid there. Leave the BOTTOM-RIGHT CORNER (about 8% of the frame)
as plain flat empty ground with no detail at all.

Main scene (center, bottom band): the same tiny honey-wood CHAPEL with a
round-arched open door and a small open BELL TOWER on its roof holding one simple
brass bell, warm amber light spilling out of the doorway across the ground. The
tower has NO clock face and NO numbers anywhere. A rope hangs from the bell down
toward the ground.

The joke is the bell rope: the same tiny lamb has pulled it to ring in the dawn
service and the rope has yanked it clean off the ground — it dangles in mid-air
halfway up, both front hooves clamped on, back legs straight out, ears flying
upward, utterly solemn and dignified, wearing a little knitted nightcap that has
flopped over one eye.

Below, a short line of very sleepy sheep shuffles in through the door: one grown
sheep holds the door open with a small brass lantern raised to light the way,
smiling warmly and a little smugly; one lamb shuffles in wrapped in a tiny knitted
blanket like a cape, the blanket in a warm muted colour clearly different from its
own wool.

There are ONLY these two sheep on the ground. Do NOT add a third sheep, and do NOT
add any lamb lying down, curled up or sleeping on the ground anywhere in the scene.
The ground to the left of them stays empty apart from the small props.

IMPORTANT — every sheep must read as ONE clean silhouette with exactly FOUR legs (two
visible pairs from the side). No sheep may hug or carry a pale cream object that
could read as a second body, and never place dark spots near the ground beside a
sheep that could be mistaken for extra hooves.

Keep them all SMALL and low — the sheep on the ground must have heads no higher than
20% up from the bottom edge, and the chapel with its bell tower and the dangling
lamb must not exceed 36%. Bonus props spread into the far LEFT and far RIGHT
quarters along the same bottom band, low and mostly in shadow. Put the taller props —
a tiny blank wooden signboard, one small potted plant — in the LEFT quarter only. The
RIGHT quarter may hold nothing but a few flat clover leaves and one small heart
catching the lantern light, and the right-hand 12% of the frame must stay completely
empty.

No text, no letters, no numbers, no logos anywhere — the bell and the signboard must
be completely blank. No clock faces. No moon, no stars, no sun. No frames, no
borders, no vignette, no rounded corners. The only bright area is the lantern and
the warm light from the doorway; everything else stays deep charcoal.
```

---

## 적용 상태 (2026-09-04)

두 장 모두 적용 완료. 실제 그림은 **프롬프트보다 장면이 크고 높게** 나왔고
(종탑 꼭대기가 위에서 28% 지점, 양 머리가 바닥에서 38%), 그대로도 잘 붙어서 그림을 살리고
CSS 를 그림에 맞췄다. 다시 뽑을 일이 있으면 아래 값을 같이 다시 잰다.

- **에셋**: `public/images/worship/hero-{light,dark}.webp` (1440×720 RGBA, 26KB / 28KB).
  원본 1456×720 → 워터마크 제거 → 좌우 8px 만 잘라 **업스케일 없이 정확히 2:1** →
  알파 굽기 → `quality=82, alpha_quality=92, method=6`.
- **워터마크 제거**: ✦ 는 두 장 모두 같은 자리(1456×720 기준 x1303~1369 · y566~632)의
  **평평한 배경 위**에 떨어졌다. 라이트에선 크림색 위라 편차가 3 남짓이라 마스크가 안 잡히므로
  **대비가 확실한 다크에서 마스크를 뽑아 두 장에 그대로** 썼다. 채우기는 인페인트가 아니라
  **행별 수평 선형 보간**(마스크 좌우 바깥 9px 평균을 양 끝점으로) + 이음매만 깃털링.
- **에셋에 구운 알파**: 위쪽은 하늘을 카드로 녹이려고 y 0→28%(종탑 꼭대기) smoothstep 페이드.
  좌우는 **2%만** — 넓게 주지 않는 이유는 아래 그라데이션 레이어가 이미 폭을 책임지기 때문.
- **깔기(`Worship.css` `.worship-hero`)**: `cover` 가 아니라 **높이 고정**이다.
  카드 폭이 358(모바일)~800px(레일 PC)로 변하는데 `cover` 면 PC에서 양이 거대해져
  통계 박스를 뚫는다. `--worship-art-h: 180px` + `background-position: center bottom`.
- **`--worship-hero-ground` 그라데이션 레이어가 핵심.** 삽화의 왼쪽 배경 기둥 색을
  그대로 옮겨 **카드 전체 폭 × 같은 높이**로 깐다. 이게 없으면 180px 짜리 삽화가 800px 카드
  한가운데 **크림색 섬**처럼 떠 보인다(처음 붙였을 때 실제로 그랬다). 삽화를 다시 뽑으면
  이 정지점 색도 다시 샘플링할 것.
- **`padding-bottom` = 삽화 자리** (모바일 116px / PC 2단 120px). 기준은
  **`--worship-art-h` 의 약 65%** — 그게 종탑 꼭대기 높이라 이보다 작으면 **종이 잘린다**
  (처음엔 196px/96px 이라 종이 통계 박스 뒤로 숨었다). 양 머리는 39% 라 항상 안전하다.
- **다크는 두 번 다시 뽑았다.** 1판=베개 안은 양이 다리 6개로 읽힘 → 2판=웅크려 잠든 양으로
  교체했으나 사용자가 그 양을 뺐고, 대신 ✦ 가 **오른쪽 나무 간판 위**에 떨어졌다.
  **간판을 통째로 지워** 워터마크까지 함께 없앴다(사용자 판단). 그래서 지금 다크에는
  오른쪽 간판이 없고 라이트에는 있다 — 의도된 차이다.
- **워터마크 알파 프로파일은 출력 크기에 따라 통째로 배율만 다르다.**
  BibleTitle(1376×768)은 ✦ 24px·여백 60.5, worship(1456×720)은 ✦ 48px·여백 121 → **정확히 2배**.
  그래서 평평한 배경 위에 ✦ 가 남아 있는 **다른 산출물에서 알파 맵을 뽑아 배율만 맞추면**
  구조물 위에 얹힌 ✦ 도 `bg = (obs - 255a)/(1-a)` 로 벗길 수 있다.
  (이번엔 간판을 지우기로 해서 실제로는 안 썼지만, 다음에 같은 사고가 나면 이 경로가 가장 빠르다.)
- **소품을 통째로 지울 때는 다항식 근사 말고 조화 채우기(Laplace).** 상자 테두리 값을
  경계조건으로 안쪽을 풀면 이음매가 원리적으로 안 남는다. 다항식 근사는 상자 자국이 보였다.
  단, 매끈하게만 채우면 그 자리만 반들거리므로 **위쪽 깨끗한 띠에서 그레인을 떠다 얹을 것.**
- **삽화를 다시 뽑으면 `--worship-hero-ground` 정지점 색도 다시 샘플링해야 한다.**
  2판은 배경 기둥이 1판보다 밝아서(40% 지점 35→41) 그대로 두면 좌우 끝에 옅은 띠가 생긴다.
- **시간대 하늘(`::before`)은 손대지 않았다.** `z-index: -1` 이 카드 배경 **위**에 그려지는
  순서라 삽화가 새벽·낮·저녁·밤 빛을 그대로 입는다 — 그래서 삽화에 해·달이 없어야 했다.

---

## 뽑고 나서 (적용 절차)

1. 워터마크 ✦(우하단)는 **비워 둔 바닥 8%** 안에 떨어져야 한다. 캐릭터 위에 얹혔으면
   TELEA inpaint 하지 말고(실루엣을 빨아들여 얼룩이 남는다) 헌금 배경에서 쓴
   **알파 역산**으로 벗기거나 다시 뽑는다.
2. `public/images/worship/` 폴더를 만들고 두 장을 넣는다.
3. 테마 분기는 `Worship.css` 가 아니라 **`theme.css` 토큰**으로 한다
   (`Worship.css` 머리말에 "여기서 `[data-theme]` 분기 금지"라고 적혀 있다):

```css
/* theme.css — 라이트 :root */
--worship-hero-art: url('/images/worship/hero-light.webp');
/* theme.css — [data-theme="dark"] */
--worship-hero-art: url('/images/worship/hero-dark.webp');
```

```css
/* Worship.css — .worship-hero 에 추가 */
.worship-hero {
  padding-bottom: 104px;               /* 콘텐츠 아래 삽화 띠 자리 */
  background-image: var(--worship-hero-art);
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
}
@media (min-width: 1024px) {
  .worship-hero:has(.worship-live) { padding-bottom: 76px; }
}
```

- **`::before` 시간대 하늘은 그대로 둔다.** 지금 `z-index: -1` 이라 카드 배경 이미지 **위**에
  반투명으로 얹힌다 — 그게 의도다(새벽/낮/저녁/밤이 삽화에 빛을 입힌다).
  삽화가 너무 눌리면 하늘 토큰의 알파를 낮추지 말고 **삽화를 더 밝게 다시 뽑는다**.
- 통계 박스(`.worship-stat`)와 라이브 배너(`.worship-live`)는 반투명이라 삽화가 비쳐 보인다.
  그래서 양들의 머리 높이(20%)를 지키는 게 중요하다 — 넘으면 유리 뒤에서 뭉갠다.
- `padding-bottom` 값은 그림이 나온 뒤 **양 머리 높이에 맞춰 다시 잰다.**

---

## 자주 깨지는 곳 (재생성 말고 부분 수정)

**종탑에 시계 문자판·숫자가 들어갔을 때**

```
Keep this image exactly as it is — same composition, same lighting, same colors,
same characters. Change ONE thing only: remove the clock face from the bell tower
completely and leave that surface as plain smooth wood. No numbers, no dial, no
hands, nothing. Everything else must stay pixel-identical.
```

**왼쪽 양 한 마리를 통째로 빼고 싶을 때** (다크 첫 판의 베개 안은 양 = 다리 6개로 보였고,
대안으로 넣어 본 '웅크려 잠든 양'도 결국 뺐다. 이 자리는 비어 있는 편이 낫다)

```
Keep this image exactly as it is — same composition, same lighting, same colors,
same chapel, same bell tower, same dangling lamb, same door-holding sheep, same
blanket lamb. Change ONE thing only:

Remove the leftmost lamb completely, together with its snore bubble and its ground
shadow, and fill that area with the same plain empty ground and the same smooth
background gradient as the rest of that band. Nothing takes its place — no other
animal, no prop, no glow. Everything else must stay pixel-identical.
```

**해나 달이 그려졌을 때**

```
Keep this image exactly as it is — same composition, same characters, same colors.
Change ONE thing only: remove the sun / moon / stars from the sky entirely and
replace that area with the same smooth plain gradient as the rest of the sky.
Everything else must stay pixel-identical.
```

**장면이 너무 크거나 높게 그려졌을 때** — 고쳐 그리게 하지 말고 캔버스를 위로 늘리는 게 빠르다:
`magick in.png -gravity south -background "#f5f8ff" -extent 1536x1000` 후 다시 1536×768로 리사이즈.
