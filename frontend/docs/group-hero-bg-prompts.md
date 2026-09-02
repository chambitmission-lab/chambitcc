# 기도방 히어로 배경 이미지 프롬프트 (Gemini용)

`/groups/:id` 오늘 탭 **하늘 히어로**(`GroupHomeHero.tsx`, `.gd-hero`) 뒤에 깔 배경.
라이트/다크 각 1장. 컨셉은 칭호·이어읽기 배경과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 "여러 마리 양이 언덕 위 십자가 아래 **함께 모여 기도하는** 모습" (기도방 = 공동체).
라이트는 새벽하늘(브랜드 블루→라벤더→살구), 다크는 **어둡지만 등불이 켜진** 밤.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
2. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/groups/hero-light.webp`
   - 다크:   `frontend/public/images/groups/hero-dark.webp`
3. 규격: **3:1 가로 (1536×512 권장)**, `cwebp -q 78 원본.png -o hero-light.webp`, 한 장 60KB 이하.
   더 크게 뽑았으면 `magick in.png -resize 1536x512^ -gravity east -extent 1536x512 out.png` 로 오른쪽 기준 크롭.
   Gemini 워터마크(우하단 ✦)는 OpenCV inpaint로 제거 (이어읽기 카드 때와 동일).

## 레이아웃 제약 (프롬프트의 핵심)

- 배너는 모바일 약 2:1, PC 4:1 이상으로 늘어난다 → `cover; right center`.
  **양들과 십자가 언덕은 오른쪽 1/4~1/3 안에**, 나머지는 하늘만 있는 단순 그라데이션.
- 왼쪽 위에 흰색 제목·부제, 왼쪽 아래에 흰 CTA 버튼이 올라간다 →
  **라이트도 밝은 흰 하늘 금지.** 흰 글씨가 읽히는 **중간 톤 새벽 하늘**이어야 한다.
  (현 CSS 그라데이션 `#3c5fc6 → #5b7bdc → #8e9ce8 → #c9b9e6` + 살구빛과 이어지는 색)
- 다크는 현 다크 그라데이션(`#1c2e6b → #2a4499 → #4b5fb8`)과 이어지는 남색 밤하늘 + 앰버 등불.
- 글자·숫자·로고 금지. 테두리·비네트 금지 (하단 비네트는 CSS `::after`가 이미 처리).
- 기존 SVG 언덕+십자가(`HillCross`)를 이미지가 대체하므로, 십자가는 이미지 안에 포함.

---

## 라이트 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for a prayer-room banner in a
mobile church community app, LIGHT MODE (but NOT white — white text will sit on
top). Style: cozy-epic children's storybook illustration — soft flat shapes with
subtle grain texture, rounded friendly forms, gentle airy lighting. Use the SAME
small chubby white sheep character as the attached reference image: stubby legs,
tiny round black hooves, serene slightly smug smile.

Palette: a serene DAWN sky — rich periwinkle blue (around #5b7bdc) at the top left,
melting through soft lavender (#8e9ce8, #c9b9e6) into a warm peach-apricot sunrise
glow low on the right horizon. Keep the whole sky in MID-TONES: never pale or
white, never dark — white text must stay clearly readable everywhere on the left.

Composition is critical: everything interesting sits in the RIGHT QUARTER to RIGHT
THIRD of the frame. The LEFT TWO-THIRDS must be nearly empty — just the smooth dawn
sky gradient, at most one or two tiny soft distant clouds and a few faint sparkle
dots, no detail at all, because a title and buttons will be overlaid there.

Scene (right third): a soft rounded hill in deep muted indigo, and on its crest a
simple slender white cross glowing gently against the peach sunrise. Gathered on
the hillside below the cross, a small flock of THREE to FOUR of the same chubby
white sheep sit together in a loose circle, eyes closed, front hooves pressed
together in prayer, peaceful contented expressions — a little community praying
together at dawn. Their wool catches the warm sunrise rim light. Maybe one tiny
bird flying near the cross.

No text, no letters, no numbers, no logos. No frames, no borders, no vignette.
The left edge must blend into a plain periwinkle-blue gradient.
```

## 다크 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for a prayer-room banner in a
mobile church community app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
gentle rim lighting. Use the SAME small chubby white sheep character as the
attached reference image: stubby legs, tiny round black hooves, serene slightly
smug smile.

Palette: a deep indigo night sky — near #1c2e6b at the top left, lifting through
#2a4499 toward a slightly lighter #4b5fb8 near the right horizon, with a thin
crescent moon and tiny sparkling blue-white stars. The mood is "dark outside, but
the lights are on and the flock is still praying together": the only warm accents
are AMBER LANTERN LIGHT among the sheep and a soft glow around the cross. Keep the
image muted and low-contrast so white text stays readable on the left.

Composition is critical: everything interesting sits in the RIGHT QUARTER to RIGHT
THIRD of the frame. The LEFT TWO-THIRDS must be nearly empty — just the smooth
night-sky gradient with a few faint stars, no detail at all, because a title and
buttons will be overlaid there.

Scene (right third): the same soft rounded hill as the light version, now a dark
silhouette, and on its crest the same simple slender white cross, softly haloed by
pale moonlight. Gathered on the hillside below the cross, a small flock of THREE to
FOUR of the same chubby white sheep sit together in a loose circle, eyes closed,
front hooves pressed together in prayer. In the middle of their circle sits one
small warm oil lantern, washing their faces and wool in gentle amber light — a
little community keeping watch in prayer through the night. Their outlines catch a
faint cool moonlit rim light.

No text, no letters, no numbers, no logos. No frames, no borders, no vignette. The
only bright areas are the lantern, the moon, the stars and the softly glowing
cross — everything else stays deep indigo.
```

## 적용 상태 (2026-09-02)

- 두 장 모두 `public/images/groups/` 적용 완료 (라이트 13KB·다크 15KB).
  다크의 Gemini 워터마크(우측 양털 위 ✦, 전역 x1649~1704·y446~504)는 OpenCV
  TELEA inpaint로 제거 — **마스크는 양털 안쪽으로만** (하늘까지 넓히면 흰색이 번진다).
  라이트는 워터마크 없음. 1792×592 원본 → 높이 512 축소 후 오른쪽 기준 1536 크롭.
- **결과물 라이트가 프롬프트보다 밝게 나옴**(텍스트 존 평균 201) → 흰 글씨 포기,
  `--gd-hero-ink*`·`--gd-hero-cta-*` 변수로 라이트=네이비 잉크+브랜드 CTA,
  다크=흰 잉크+흰 CTA 로 갈랐다 (변수 색이라 Tailwind `/60` 투명도 수식자 금지).
- `HillCross` SVG·하단 비네트(`::after`) 제거, 배너 패딩 소폭 증가(pt-7/pb-7).
- 이미지를 다시 뽑을 때는 `GroupHomeHero.tsx`의 잉크 변수 대비를 다시 확인할 것.
