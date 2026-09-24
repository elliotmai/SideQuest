// A fixed, full-viewport ambient backdrop: a slow-drifting gradient field in
// the sunset palette (animated via CSS, not a static illustration) with a
// fine grain texture for depth, plus a single minimal road shape as the
// only literal motif — no sun, mountains, or other clip-art scenery.
export default function RoadBackdrop() {
  return (
    <div className="road-backdrop" aria-hidden="true">
      <div className="bg-sky" />
      <div className="bg-grain" />
      <svg viewBox="0 0 390 1400" preserveAspectRatio="xMidYMin slice" className="road-backdrop-svg">
        <polygon points="188,240 202,240 340,1400 50,1400" fill="#2c1710" />
        <line x1="195" y1="255" x2="195" y2="1400" stroke="#fdf8ec" strokeWidth="6" strokeDasharray="20 30" opacity="0.9" />
      </svg>
    </div>
  )
}
