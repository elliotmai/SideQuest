// A fixed, full-viewport sunset-highway scene behind every page. Cards float
// over it as frosted glass, so the scene stays visible through them — kept
// deliberately simple (a handful of large, soft shapes) so it reads as calm
// ambience once blurred behind glass, not as visual noise.
export default function RoadBackdrop() {
  return (
    <div className="road-backdrop" aria-hidden="true">
      <svg viewBox="0 0 390 1400" preserveAspectRatio="xMidYMin slice" className="road-backdrop-svg">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8734a" />
            <stop offset="55%" stopColor="#f2a35c" />
            <stop offset="100%" stopColor="#fdd061" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3d6" />
            <stop offset="60%" stopColor="#fdd061" />
            <stop offset="100%" stopColor="#fdd061" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mtnFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a4a5c" />
            <stop offset="100%" stopColor="#6b3648" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="390" height="1400" fill="#f3e4c8" />
        <rect x="0" y="0" width="390" height="300" fill="url(#sky)" />

        {/* Sun */}
        <circle cx="195" cy="150" r="130" fill="url(#sun)" />
        <circle cx="195" cy="150" r="58" fill="#fff3d6" />

        {/* Distant mountains, one soft silhouette */}
        <polygon points="0,300 100,210 200,300" fill="url(#mtnFar)" opacity="0.4" />
        <polygon points="140,300 280,225 390,300" fill="url(#mtnFar)" opacity="0.4" />

        {/* Ground */}
        <rect x="0" y="296" width="390" height="1104" fill="#f3e4c8" />

        {/* Road */}
        <polygon points="160,300 230,300 340,1400 50,1400" fill="#3a2418" />
        <polygon points="178,300 212,300 224,320 166,320" fill="#5c3c2b" />
        <line x1="195" y1="320" x2="195" y2="1400" stroke="#fdf8ec" strokeWidth="7" strokeDasharray="22 28" />
      </svg>
    </div>
  )
}
