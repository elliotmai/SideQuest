const TONES = ['coral', 'mustard', 'pine']

// Deterministic per-uid color so the same player always gets the same
// avatar tone across the app, without needing to store one.
function toneFor(seed) {
  if (!seed) return TONES[0]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return TONES[hash % TONES.length]
}

export default function Avatar({ uid, name, size = 'md' }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span className={`avatar avatar-${size} avatar-${toneFor(uid || name)}`} aria-hidden="true">
      {initial}
    </span>
  )
}
