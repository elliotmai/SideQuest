export default function CardIcon({ icon: Icon, tone = 'coral', size = 16 }) {
  return (
    <span className={`card-icon ${tone}`}>
      <Icon size={size} strokeWidth={2.25} />
    </span>
  )
}
