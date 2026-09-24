const COPY = {
  checking: { text: 'Checking availability…', color: 'var(--ink-soft)' },
  available: { text: '✓ Available', color: '#2f6f3d' },
  taken: { text: '✗ Already taken — try another', color: 'var(--coral)' },
  mine: { text: 'This is your current username', color: 'var(--ink-soft)' },
}

export default function UsernameStatus({ status }) {
  const copy = COPY[status]
  if (!copy) return null
  return (
    <p className="hint" style={{ color: copy.color }}>
      {copy.text}
    </p>
  )
}
