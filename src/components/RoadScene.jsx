// A little perspective-road hero band with a highway sign, used to anchor the
// Route 66 theme wherever a page needs a strong top banner.
export default function RoadScene({ signText, subText, bare = false }) {
  return (
    <div className={`road-scene ${bare ? 'bare' : ''}`}>
      <svg viewBox="0 0 390 120" preserveAspectRatio="none" className="road-scene-svg">
        <polygon points="0,120 0,102 390,102 390,120" fill="#6e8a52" />
        <polygon points="150,0 240,0 390,120 0,120" fill="#3a2418" />
        <polygon points="150,0 240,0 236,10 154,10" fill="#5c3c2b" />
        <line x1="195" y1="14" x2="195" y2="120" stroke="#fdf8ec" strokeWidth="5" strokeDasharray="16 20" />
      </svg>
      {signText && (
        <div className="hwy-sign">
          <div className="hwy-sign-top">{signText}</div>
          {subText && <div className="hwy-sign-sub">{subText}</div>}
        </div>
      )}
    </div>
  )
}
