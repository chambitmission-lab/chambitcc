// Directions page (/visit) translations — every key is admin-editable inline.
// Empty strings mean "not confirmed yet": the UI hides the row instead of inventing a value.
export const visit = {
  visitLabel: 'VISIT',
  visitTitle: 'How to Find Us',
  visitSubtitle: '5 min walk from Sangdong Stn. (Line 7)',

  // ── Basics ────────────────────────────
  visitAddress: '29, Songnae-daero 265beon-gil, Bucheon-si, Gyeonggi-do',
  visitPostcode: '14542',
  visitPhone: '032-323-1004',
  visitMapQuery: '부천 참빛교회',
  /** "lat,lng" — used only for the distance card. Empty hides that card. */
  visitCoords: '37.4886,126.7565',

  // ── Route diagram ─────────────────────
  visitRouteFromName: 'Sangdong Stn.',
  visitRouteFromSub: 'Line 7',
  visitRouteViaName: 'Songnae-daero 265beon-gil',
  visitRouteViaSub: 'Convenience store alley',
  visitRouteToName: 'Chambit Church',
  visitRouteToSub: 'about 5 min on foot',

  // ── By transport ──────────────────────
  visitModeSubway: 'Subway',
  visitModeBus: 'Bus',
  visitModeCar: 'Driving',
  visitModeFirst: 'First time',

  visitSubwayTitle: 'Coming by subway',
  visitSubwayBody: 'Get off at Sangdong Station on Line 7 — the church is about a 5 minute walk.\nOnce you leave the station, follow the "Last 100m" photo guide below and you will not get lost.',
  visitSubwayExit: '',

  visitBusTitle: 'Coming by bus',
  visitBusBody: '',

  visitCarTitle: 'Coming by car',
  visitCarBody: 'Enter "참빛교회" or "송내대로265번길 29" into your navigation app.\nTapping a button below opens the map app you already use.',

  visitParkingTitle: 'Parking',
  visitParkingBody: '',
  visitParkingTip: '',

  visitFirstTitle: 'If this is your first visit',
  visitFirstBody: 'Arriving about 15 minutes before the service is the most relaxed.\nJust say "It is my first time" at the entrance and someone will guide you.\nCome dressed however you are comfortable.',

  // ── Last 100m ─────────────────────────
  visitLastMileTitle: 'The last 100m',
  visitLastMileDesc: 'The part no map explains. Swipe through the photos.',
  visitLastMileEmpty: 'Add photos and the walking guide will appear here.',
  visitStep1Photo: '',
  visitStep1Text: 'Come out of Sangdong Station',
  visitStep2Photo: '',
  visitStep2Text: 'Walk straight along the main road',
  visitStep3Photo: '',
  visitStep3Text: 'Turn into the alley at the convenience store',
  visitStep4Photo: '',
  visitStep4Text: 'The church building comes into view',
  visitStep5Photo: '',
  visitStep5Text: 'Come in through this door',

  // ── Shared UI ─────────────────────────
  visitSectionHow: 'How are you coming?',
  visitOpenKakao: 'KakaoMap',
  visitOpenNaver: 'Naver Map',
  visitOpenTmap: 'TMAP',
  visitCopyAddress: 'Copy address',
  visitCopied: 'Address copied',
  visitCopyFailed: 'Could not copy',
  visitCall: 'Call',
  visitExitLabel: 'Exit',
  visitStepLabel: 'Step',

  // ── If you leave now ──────────────────
  visitNowTitle: 'If you leave now',
  visitLocateCta: 'How far am I right now?',
  visitLocating: 'Checking your location…',
  visitLocateDenied: 'Location permission is off, so we cannot measure the distance. Please use the directions buttons below.',
  visitDistanceLabel: 'Straight-line',
  visitEtaCar: 'about',
  visitEtaWalk: 'about',
  visitEtaNote: 'A rough estimate from straight-line distance. Check a map app for the real travel time.',
  visitNextService: 'Next service',
  visitLeaveOk: 'Leave now and you will arrive with time to spare',
  visitLeaveTight: 'You should head out right away',
  visitLeaveLate: 'The service has already begun — you are welcome to slip in quietly',
  visitMinuteUnit: 'min',
  visitHourUnit: 'h',

  // ── Invite ────────────────────────────
  visitInviteTitle: 'Bringing someone along',
  visitInviteDesc: 'You can send them this exact guide.',
  visitInviteCopy: 'Copy invite link',
  visitInviteCopied: 'Invite link copied',
  visitInviteQr: 'Show QR',
  visitFirstCta: 'First time here?',

  visitAdminHint: '✏️ Tap the pencil to edit the address, exit, parking and photos. Empty fields stay hidden.',
} as const
