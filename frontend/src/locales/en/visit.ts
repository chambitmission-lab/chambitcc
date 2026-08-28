// Directions page (/visit) translations — every key is admin-editable inline.
// Empty strings mean "not confirmed yet": the UI hides the row instead of inventing a value.
export const visit = {
  visitLabel: 'VISIT',
  visitTitle: 'How to Find Us',
  visitSubtitle: '5 min walk from Sangdong Stn. (Line 7)',

  // ── Hero route summary (station → alley → church). Empty title hides the step ──
  visitRouteStep1Title: 'Sangdong Stn.',
  visitRouteStep1Desc: 'Line 7',
  visitRouteStep2Title: 'Songnae-daero 265beon-gil',
  visitRouteStep2Desc: 'Convenience-store alley',
  visitRouteStep3Title: 'Chambit Church',
  visitRouteStep3Desc: 'About 5 min on foot',
  visitRouteDone: 'Done',
  visitRouteArrive: 'Arrive',

  // ── Basics ────────────────────────────
  visitAddress: '29, Songnae-daero 265beon-gil, Bucheon-si, Gyeonggi-do',
  visitPostcode: '14542',
  visitPhone: '032-323-1004',
  visitMapQuery: '부천 참빛교회',
  /** "lat,lng" — map centre and marker, verified with the Kakao geocoder.
   *  Empty falls back to a plain info card. */
  visitCoords: '37.50705,126.75687',
  /** Short name shown next to the map marker */
  visitMapPinLabel: 'Chambit Church',

  // ── Map ───────────────────────────────
  visitOpenBigMap: 'Open larger map',
  visitMapUnavailable: 'The map could not load. Please use the directions buttons below.',

  // ── How to get here (collapsible) ─────
  visitTransitTitle: 'Public transport',
  visitTransitDesc: 'Subway · Bus',
  visitDriveTitle: 'Driving · Parking',
  visitDriveDesc: 'Navigation and parking',

  visitSubwayTitle: 'Coming by subway',
  visitSubwayBody: 'Get off at Sangdong Station on Line 7 — the church is about a 5 minute walk.\nFollow the main road, turn into the alley at the convenience store, and the church comes into view.',
  visitSubwayExit: '',

  visitBusTitle: 'Coming by bus',
  visitBusBody: '',

  visitCarTitle: 'Coming by car',
  visitCarBody: 'Enter "참빛교회" or "송내대로265번길 29" into your navigation app.\nTapping a button above opens the map app you already use.',

  visitParkingTitle: 'Parking',
  visitParkingBody: '',
  visitParkingTip: '',

  // ── First visit ───────────────────────
  visitFirstTitle: 'If this is your first visit',
  visitFirstBody: 'Arriving about 15 minutes before the service is the most relaxed.\nJust say "It is my first time" at the entrance and someone will guide you.\nCome dressed however you are comfortable.',
  visitFirstCta: 'First time here?',

  // ── Shared UI ─────────────────────────
  visitOpenKakao: 'KakaoMap',
  visitOpenNaver: 'Naver Map',
  visitOpenTmap: 'TMAP',
  visitCopyAddress: 'Copy address',
  visitCopied: 'Address copied',
  visitCopyFailed: 'Could not copy',
  visitCall: 'Call',
  visitExitLabel: 'Exit',

  // ── Next service ──────────────────────
  visitNextService: 'Next service',
  visitNextServiceIn: 'in',
  visitMinuteUnit: 'min',
  visitHourUnit: 'h',

  // ── Invite ────────────────────────────
  visitInviteTitle: 'Bringing someone along',
  visitInviteDesc: 'You can send them this exact guide.',
  visitInviteCopy: 'Copy invite link',
  visitInviteCopied: 'Invite link copied',
  visitInviteQr: 'Show QR',

  visitAdminHint: '✏️ Tap the pencil to edit the address, exit and parking info. Empty fields stay hidden.',
} as const
