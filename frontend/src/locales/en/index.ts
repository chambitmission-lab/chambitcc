// English translations integration
import { common } from './common'
import { navigation } from './navigation'
import { prayer } from './prayer'
import { reply } from './reply'
import { auth } from './auth'
import { profile } from './profile'
import { bible } from './bible'
import { about } from './about'
import { worship } from './worship'
import { event } from './event'

export const en = {
  ...common,
  ...navigation,
  ...prayer,
  ...reply,
  ...auth,
  ...profile,
  ...bible,
  ...about,
  ...worship,
  ...event,
} as const
