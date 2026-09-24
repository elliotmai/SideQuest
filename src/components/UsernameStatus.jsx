import { Check, X } from 'lucide-react'

const COPY = {
  checking: { text: 'Checking availability…', color: 'var(--ink-soft)', icon: null },
  available: { text: 'Available', color: '#2f6f3d', icon: Check },
  taken: { text: 'Already taken — try another', color: 'var(--coral)', icon: X },
  mine: { text: 'This is your current username', color: 'var(--ink-soft)', icon: null },
}

export default function UsernameStatus({ status }) {
  const copy = COPY[status]
  if (!copy) return null
  return (
    <p className="hint" style={{ color: copy.color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      {copy.icon && <copy.icon size={14} strokeWidth={2.5} />}
      {copy.text}
    </p>
  )
}
