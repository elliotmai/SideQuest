// A fixed, full-viewport road-and-sunset scene behind every page — the road
// keeps running the whole height of the app instead of just a header banner.
// Cards float over it (their own solid backgrounds), so it mostly shows through
// the gaps between sections and at the edges of the page.
export default function RoadBackdrop() {
  return (
    <div className="road-backdrop" aria-hidden="true">
      <svg viewBox="0 0 390 900" preserveAspectRatio="none" className="road-backdrop-svg">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8734a" />
            <stop offset="55%" stopColor="#f2a35c" />
            <stop offset="100%" stopColor="#fdd061" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="390" height="900" fill="#f3e4c8" />
        <rect x="0" y="0" width="390" height="150" fill="url(#sky)" />
        <polygon points="160,150 230,150 340,900 50,900" fill="#3a2418" />
        <polygon points="178,150 212,150 224,168 166,168" fill="#5c3c2b" />
        <line x1="195" y1="168" x2="195" y2="900" stroke="#fdf8ec" strokeWidth="7" strokeDasharray="22 28" />
      </svg>
    </div>
  )
}
