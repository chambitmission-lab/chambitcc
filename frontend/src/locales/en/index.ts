// English translations integration
import { common } from './common'
import { navigation } from './navigation'
import { prayer } from './prayer'
import { reply } from './reply'
import { auth } from './auth'
import { profile } from './profile'
import { bible } from './bible'
import { about } from './about'
import { visit } from './visit'
import { worship } from './worship'
import { event } from './event'
import { garden } from './garden'
import { answered } from './answered'
import { mission } from './mission'
import { home } from './home'
import { landing } from './landing'

export const en = {
  ...common,
  ...navigation,
  ...prayer,
  ...reply,
  ...auth,
  ...profile,
  ...bible,
  ...about,
  ...visit,
  ...worship,
  ...event,
  ...garden,
  ...answered,
  ...mission,
  ...home,
  ...landing,
} as const
