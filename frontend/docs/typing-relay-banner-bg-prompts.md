# 릴레이 방 배너 배경 이미지 프롬프트 (Gemini용)

필사 릴레이 방 PC 화면(`/bible/typing/:book/:chapter?mode=copy&relay=…`) 맨 위
**방 배너**(`Typing/RelayStudyRoom.tsx`의 `RoomBanner`, `.bt-studyroom` —
📖 아이콘 + "시편 84장 릴레이" + `시편 84편 · 2명 참여 · 함께 채운 칸 3/12` + 바통 넘기기·초대·`>`)
뒤에 깔 배경. 라이트/다크 각 1장.

컨셉은 칭호·공지 배너·타임캡슐 배너와 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 **"원고지 위에서 벌어지는 양들의 말씀 이어달리기"**.

유머는 **"진지한 육상 대회인데 바통이 자기 키만 한 연필"** 에서 나온다.

- 앞 양은 **몸보다 큰 노란 연필 바통**을 들고 혼신의 전력 질주 중이다. 표정은 더없이 진지하다.
- 다음 양은 이어받을 자세로 앞발을 뒤로 내밀고 있다. 고개는 앞만 보고 있다(진짜 계주 폼).
- 둘이 지나온 바닥은 **길게 펼쳐진 원고지 두루마리**다. 칸 몇 개가 잉크로 채워져 있는데,
  하나는 글씨 대신 **발굽 도장**이 꾹 찍혀 있다. ("함께 채운 칸"이 그림 안에서도 채워지고 있다.)
- 새끼양은 길가에서 **잉크병 급수대**(마라톤 물 컵처럼)를 들고 응원한다.

화면의 문구 "바통 넘기기 / 함께 채운 칸"을 **그대로 그림으로 옮긴 것**이라, 처음 보는 사람도
"아, 이어 쓰는 방이구나" 하고 웃으면서 알아본다.

| 화면에 이미 있는 것 | 그림에서 이어받는 것 |
|---|---|
| `바통 넘기기` 버튼 (send 아이콘) | **연필 바통을 넘기는 순간** |
| `함께 채운 칸 3/12` | 원고지 칸 — **일부만 채워진** 상태 |
| `menu_book` 아이콘 | 원고지 두루마리 끝이 **책 페이지처럼 말려 있음** |
| 알아두면 좋은 말의 금빛(`--bt-gold`) | 연필의 노란색 — 이 페이지의 유일한 따뜻한 색 |

---

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장(예: `dawn_riser.webp`) 첨부하고
   **"이 양 캐릭터와 완전히 같은 캐릭터로"** 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
   **한 대화에서 라이트 → 다크 순으로 이어서 뽑는다.** 다크를 뽑을 때 라이트 결과를 같이 첨부하고
   "같은 구도, 같은 캐릭터 배치로 밤 버전" 이라고 하면 구도가 거의 그대로 나온다.
2. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/src/assets/typing-relay/banner-light.webp`
   - 다크:   `frontend/src/assets/typing-relay/banner-dark.webp`
   - `public/` 이 아니라 **`src/assets/`** — public 이미지는 SW 캐시 때문에 다시 구워도 안 바뀐다.
3. 규격: 원본은 **가로로 긴 3:1(또는 21:9로 뽑아 3:1로 크롭)**. 최종 **960×320 RGBA WebP**,
   `cwebp -q 80 -alpha_q 92 in.png -o banner-light.webp`, 한 장 **35KB 이하**.
4. Gemini 워터마크 ✦ 는 **오른쪽 아래 모서리**에 떨어진다 — 프롬프트가 그 자리를 빈 하늘로
   비워 두게 했으니, 인페인트 말고 **좌우 깨끗한 열의 중앙값 보간으로 되메운다**(공지 배너 때와 같은 방식).

## 레이아웃 제약 (프롬프트의 핵심)

### 배너 실측 (PC)

`.bt-studyroom` = `padding: 16px 18px` + 아이콘 46px → **높이 ≈ 78px 고정**, 가로는 책상 폭을 따라
대략 **900 ~ 1200px**. 비율 **12:1 ~ 15:1** — 공지 배너처럼 극단적으로 납작하다.

| 구역 | 대략 위치 | 비고 |
|---|---|---|
| 아이콘 + 제목/정보 | 왼쪽 0 ~ 380px | 흰 글씨. 그림이 여기를 덮으면 안 된다 |
| **비어 있는 가운데** | 380px ~ (오른쪽 버튼 시작) | **그림이 서는 무대** |
| 버튼 | 오른쪽 130px(초대·`>`) ~ 250px(바통 넘기기 포함) | 반투명 흰 pill |

→ **`cover` 금지**(PC에서 그림이 미친 듯이 확대된다). 배너 그라데이션은 그대로 두고,
**높이맞춤(`auto 100%`) 삽화를 버튼 바로 왼쪽에 얹는다.** 오른쪽 오프셋은 바통 버튼 유무로 달라지니
`--relay-art-right` 변수로 뺀다(아래 적용 메모 참고).

### 그래서 규칙

- 그림은 화면에서 **높이 78px, 폭 약 234px**로 줄어든다 →
  **실루엣 4개(달리는 양·연필 바통·받는 양·새끼양) + 원고지 띠** 안에서 승부한다. 잔풀·잔별 금지.
- **왼쪽 15%, 오른쪽 15%는 배경색 단색으로 비운다** — 양쪽 다 알파 페이드로 녹여 배너에 붙인다.
  장면은 가운데 70% 안에 **한 덩어리**로.
- **위 10% · 아래 10%는 빈 여백** — 배너가 `overflow: hidden` 이라 잘린다.
- 원고지 띠는 **가로로 길게, 아래쪽 1/3**에 깔고 양쪽 끝이 페이드에 자연스럽게 사라지게.
- **배경색은 배너 그라데이션 가운데 색**으로 평평하게(라이트 `#3182f6`, 다크 아래 표 참고).
  하늘에 구름을 넣더라도 **흰색 15% 이하 투명도 느낌**으로만 — 흰 버튼·흰 글씨와 겨루면 안 된다.
- 양의 털은 **흰색이 맞다**(파란 배너 위라 흰 양이 제일 또렷하다). 대신 그림자는 파랑 계열로.
- **진행 방향은 오른쪽 → 버튼 쪽**. 바통이 `바통 넘기기` 버튼으로 날아가는 시선 흐름.
- 글자·숫자·로고 금지. **원고지 칸 안에도 글자 금지** — 잉크 얼룩·물결 낙서·발굽 도장만.
  (Gemini는 한글을 거의 항상 깨진 글자로 그린다.)
- 얼굴은 **3/4 정면에 가깝게, 두 눈이 다 보이게.** 옆모습은 먼 쪽 눈이 주둥이에 가려 어색하다.
- **입에 무는 소품 금지** — 다크에서 혀처럼 보인다(공지 배너 때 겪음). 연필은 앞발로 끌어안는다.
- 테두리·비네트·모서리 라운드 금지 — 배너 모서리(`border-radius: 22px`)는 CSS가 처리한다.

### ★ 라이트 / 다크

지금 `.bt-studyroom` 은 다크에서도 **브랜드 블루 그라데이션 그대로**(`--brand` 만 `#4593fc` 로 밝아짐)다.
다크 앱 화면 위에 밝은 파란 띠가 떠 있는 셈이라, 그림을 넣는 김에 **다크는 밤 독서실 남색으로
배너 바탕도 같이 내린다**(PC 레이아웃 이름이 원래 '말씀 독서실'이다).

| | 배너 바탕 | 그림 톤 | 유일한 따뜻한 빛 |
|---|---|---|---|
| 라이트 | 지금 그대로 `#1b64da → #3182f6 → #5aa2ff` | 맑은 낮, 흰 양 + 연한 하늘색 구름 | 노란 연필 |
| 다크 | **변경 제안** `#0f1f45 → #18336f 60% → #24509e` | 밤, 별 몇 개 + 양 머리의 헤드랜턴 | 헤드랜턴 앰버 + 노란 연필 |

---

## 라이트 테마 프롬프트

```
A wide 3:1 illustration that will sit in the MIDDLE-RIGHT of a very wide, very short
blue banner at the top of a church Bible-copying web app, LIGHT MODE. On screen it
will be displayed only about 234 pixels wide and 78 pixels tall, so keep it extremely
simple and readable at thumbnail size — four clear silhouettes on one long strip of
paper, nothing else. Style: cozy-epic children's storybook illustration — soft flat
shapes with subtle grain texture, rounded friendly forms, bright cheerful daylight.
Use the SAME small chubby white sheep character as the attached reference image:
stubby legs, tiny round black hooves, serene slightly smug smile.

Background: a FLAT, even brand blue (#3182f6) sky over the whole frame — no gradient
to white, no sunset. At most two or three very faint soft clouds at about 15%
opacity. White text and white buttons will sit right next to this artwork, so the
sky must stay calm and the only truly white shapes are the sheep themselves.
Shadows are deeper blue (#1b64da), never grey or black.

Composition is critical:
- The LEFT 15% and the RIGHT 15% of the frame must be plain flat #3182f6 sky with
  absolutely nothing in them — they will be faded away into the banner.
- The whole scene lives inside the CENTER 70%, as ONE tight cluster.
- Keep the TOP 10% and BOTTOM 10% as calm empty margin.
- Leave the BOTTOM-RIGHT CORNER (about 12% width x 20% height) as plain empty sky.

Scene: a very serious RELAY RACE held on top of paper. Across the lower third runs a
long unrolled strip of Korean manuscript paper — cream paper with a neat grid of
square boxes, its left end curling up like the page of an open book. A few boxes are
already filled with small blue ink blots and wavy scribbles, and ONE box has a big
proud HOOF PRINT stamped in it instead of writing. Most boxes are still empty.
Absolutely no letters, characters or numbers in any box.

On the paper, the chubby white sheep sprints to the RIGHT on its hind legs with
total Olympic seriousness — ears flying back, cheeks puffed, tiny sweat drop — hugging
a giant yellow PENCIL that is longer than its own body as the relay baton, the pencil
point aimed forward. Its face is turned toward the viewer in a three-quarter-FRONT
angle so BOTH eyes are visible, eyes squeezed shut in determination. Nothing in its
mouth.

Just ahead on the right, a second sheep is already in the classic relay hand-off
stance — leaning forward, one front hoof stretched back behind it, palm open, staring
straight ahead and NOT looking back, a little blue headband on its forehead. The
hand-off is one second away.

On the side of the paper track, a tiny lamb holds up a little ink bottle like a
marathon water-station cup, cheering with its mouth open in a big round "O", a few
tiny ink droplets splashing out of the bottle.

Tiny motion lines and two soft paper-dust puffs behind the runner. The whole scene
leans and flows to the RIGHT.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. Left 15% and right 15% must be flat #3182f6.
```

## 다크 테마 프롬프트

```
A wide 3:1 illustration that will sit in the MIDDLE-RIGHT of a very wide, very short
banner at the top of a church Bible-copying web app, DARK MODE — a late-night study
room mood. On screen it will be displayed only about 234 pixels wide and 78 pixels
tall, so keep it extremely simple and readable at thumbnail size — four clear
silhouettes on one long strip of paper, nothing else. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain texture, rounded friendly
forms, warm rim lighting. Use the SAME small chubby white sheep character as the
attached reference image (and the SAME composition as the attached light version):
stubby legs, tiny round black hooves, serene slightly smug smile.

Background: a FLAT, even deep night navy (#18336f) over the whole frame — NOT black,
NOT purple. Only five or six tiny soft stars, kept small and dim. White text and
white buttons sit next to this artwork, so keep it muted: the sheep's wool reads as
soft moonlit pale grey-blue, never pure white. The ONLY warm lights in the whole
image are a small amber headlamp glow and the yellow pencil.

Composition is critical:
- The LEFT 15% and the RIGHT 15% of the frame must be plain flat #18336f with
  absolutely nothing in them — they will be faded away into the banner.
- The whole scene lives inside the CENTER 70%, as ONE tight cluster.
- Keep the TOP 10% and BOTTOM 10% as calm empty margin.
- Leave the BOTTOM-RIGHT CORNER (about 12% width x 20% height) as plain empty sky.

Scene: the same paper relay race, but it is the middle of the night and they are
STILL racing. Across the lower third runs the same long strip of Korean manuscript
paper with a grid of square boxes, its left end curling like a book page, glowing
faint cream in the lamplight. A few boxes hold blue ink blots and wavy scribbles, ONE
box holds a proud HOOF PRINT, most are still empty. Absolutely no letters,
characters or numbers.

The chubby sheep sprints to the RIGHT hugging the giant yellow PENCIL baton, now
wearing a tiny miner's HEADLAMP whose small amber beam lights the boxes ahead. Face
three-quarter-FRONT, both eyes visible, squeezed shut in determination. Nothing in
its mouth, no tongue, no object touching the face.

Ahead on the right, the second sheep waits in the hand-off stance, one hoof stretched
back — but it is wearing a knitted nightcap pushed back off its eyes and is clearly
half asleep standing up, with one small round snore bubble, still holding the
stance out of pure duty.

On the side of the track, the tiny lamb has fallen asleep curled around its little
ink bottle like a pillow.

Tiny motion lines behind the runner; the whole scene leans and flows to the RIGHT.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. The only bright areas are the headlamp glow, the
pencil and the lamplit paper; left 15% and right 15% must be flat #18336f.
```

---

## 자주 깨지는 곳 (재생성 말고 부분 수정)

잘 나온 장면을 통째로 다시 뽑으면 구도가 바뀐다. **그 이미지를 첨부**하고 한 군데만 고치게 한다.

**원고지 칸에 글자·숫자가 생겼을 때** (가장 흔함)

```
Keep this image exactly as it is — same composition, same characters, same colors,
same lighting. Change ONE thing only: every grid box on the paper strip must contain
either nothing, a small blue ink blot, a wavy scribble line, or the single hoof print.
Remove every letter, character, number or symbol from the boxes. Everything else must
stay pixel-identical.
```

**연필이 입에 물려 있거나 바통이 작을 때**

```
Keep this image exactly as it is. Change ONE thing only: the running sheep must hug
the yellow pencil against its chest with both front hooves, and the pencil must be
longer than the sheep's whole body. Nothing in its mouth — a simple closed determined
expression. Everything else must stay pixel-identical.
```

**받는 양이 뒤돌아보고 있을 때** — 계주 폼의 웃음 포인트가 "앞만 보고 손만 뒤로"라서 꼭 고친다.

```
Keep this image exactly as it is. Change ONE thing only: the second sheep on the right
must face forward (to the right), NOT look back, with one front hoof stretched back
behind it, open and ready to receive the baton. Everything else must stay pixel-identical.
```

**양쪽 가장자리 색이 배너와 안 맞을 때** — 다시 그리게 하지 말고, 이미지 편집으로
좌우 15%를 단색으로 덮은 뒤 알파 페이드를 구우면 끝난다(어차피 알파로 지워지는 자리).

---

## 적용 메모 (그림 받은 뒤)

- **알파 페이드를 에셋에 굽는다**: 좌 0~15% 투명 → 28% 불투명, 우 85~100% 투명 → 72% 불투명.
  배너 그라데이션이 `135deg` 라 CSS 가로 워시로 덮으면 각도가 어긋나 띠가 보인다.
- 배치 스케치 (`together.css` `.bt-studyroom`):
  ```css
  .bt-studyroom {
    --relay-art-right: 150px;                 /* 초대 + > */
    background:
      url(banner-light.webp) right var(--relay-art-right) center / auto 100% no-repeat,
      linear-gradient(135deg, #1b64da, var(--brand) 60%, #5aa2ff);
  }
  .bt-studyroom.has-pass { --relay-art-right: 270px; }   /* 바통 넘기기 버튼이 있을 때 */
  .dark .bt-studyroom {
    background:
      url(banner-dark.webp) right var(--relay-art-right) center / auto 100% no-repeat,
      linear-gradient(135deg, #0f1f45, #18336f 60%, #24509e);
  }
  ```
  - 이미지는 `import` 해서 인라인 style 의 CSS 변수(`--relay-art-light`)로 넘기는 편이 해시 URL을 쓰기 쉽다.
  - 기존 `::after` 반투명 원은 그림과 겹치니 **제거**.
  - 배너 폭이 좁아져 제목 끝과 그림이 닿으면(≈ 900px 미만) 그림을 숨기거나 `opacity: .5`.
- **덤(선택)**: 누가 칸을 채우거나 바통을 넘기는 SSE 소식이 오면 배너에 `is-cheer` 를 0.6초 붙여
  그림을 `translateX(4px)` 로 한 번 툭 밀어 준다 — "누가 방금 달렸다"는 신호.
  `prefers-reduced-motion` 에서는 끈다.

---

## 적용 상태 (2026-10-15)

두 장 모두 적용. 원본 1792×592(라이트=`2.png`, 다크=`1.png`).

- **워터마크 ✦ 는 크롭으로 제거** — Gemini가 3:1 장면을 1192px 폭 가운데에 그리고 좌우를 단색 띠로
  채웠는데, 워터마크가 오른쪽 띠(≈1672,472)에 떨어졌다. `(300,100)-(1492,530)` 크롭이면 띠째 사라진다.
- **하늘을 투명으로 뺐다** — 위쪽 30px 중앙값을 하늘색으로 잡고 색 거리 22~70 을 알파 램프로,
  반투명 픽셀은 하늘색을 언믹스. 하늘 네모를 그대로 두면 배너 그라데이션과 색이 달라 상자가 보였다.
  가장자리 페이드도 함께 구움(좌 30 · 우 120 · 위 20 · 아래 24px, 원본 기준).
- 최종 `src/assets/typing-relay/banner-{light,dark}.webp` 665×240, 각 ≈30KB.
- **배치**: `.bt-studyroom::before` 에 `auto 100%` 높이맞춤, `right var(--relay-art-right)` —
  버튼 폭만큼 비켜 선다(기본 146px, 바통 버튼 있으면 `.has-pass` 266px).
  배너 자신이 `container-type: inline-size` 라 폭 760px(바통 있으면 880px) 아래에선 삽화를 숨긴다.
- 다크 배너 바탕은 밤 독서실 남색 `#0f2150 → #142a5b → #1f3f80` 으로 내렸다(삽화 하늘색 기준).
