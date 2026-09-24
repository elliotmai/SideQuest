import { Waves, Trophy, Plane, MapPin, Flame, PartyPopper, Sparkles } from 'lucide-react'

// Packs/expansions are admin-authored content and still carry a legacy
// `emoji` field, but the UI never renders that character directly — it's
// resolved to a real icon instead, by keyword (falling back to the emoji
// itself as a last-resort hint) so existing content keeps working.
const KEYWORD_ICONS = [
  [/beach|pool|lake|sun/, Waves],
  [/football|sport|game day|touchdown/, Trophy],
  [/travel|flight|airport|road trip|plane/, Plane],
  [/outing|hangout|general/, MapPin],
  [/bad|mischief|dirty|adult|chaos/, Flame],
  [/party|celebrat/, PartyPopper],
]

const EMOJI_ICONS = {
  '🏖️': Waves,
  '🏈': Trophy,
  '✈️': Plane,
  '🎉': PartyPopper,
  '😈': Flame,
  '👹': Flame,
}

export function resolvePackIcon(item) {
  const name = (item?.name || '').toLowerCase()
  for (const [pattern, Icon] of KEYWORD_ICONS) {
    if (pattern.test(name)) return Icon
  }
  if (item?.emoji && EMOJI_ICONS[item.emoji]) return EMOJI_ICONS[item.emoji]
  return Sparkles
}
