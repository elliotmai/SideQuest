// A fixed, full-viewport illustrated sunset-highway scene behind every page.
// Cards float over it as frosted glass, so the scene stays visible through
// them and in the gaps between sections — the app always feels like it's
// sitting on the road, not just referencing it in a header banner.
export default function RoadBackdrop() {
  return (
    <div className="road-backdrop" aria-hidden="true">
      <svg viewBox="0 0 390 1400" preserveAspectRatio="xMidYMin slice" className="road-backdrop-svg">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c65a8a" />
            <stop offset="30%" stopColor="#e8734a" />
            <stop offset="62%" stopColor="#f2a35c" />
            <stop offset="100%" stopColor="#fdd061" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3d6" />
            <stop offset="55%" stopColor="#fdd061" />
            <stop offset="100%" stopColor="#fdd061" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mtnFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a4a5c" />
            <stop offset="100%" stopColor="#6b3648" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="390" height="1400" fill="#f3e4c8" />
        <rect x="0" y="0" width="390" height="300" fill="url(#sky)" />

        {/* Stars, faint, only visible against the deeper top of the sky */}
        <g fill="#fdf8ec" opacity="0.55">
          <circle cx="35" cy="30" r="1.4" />
          <circle cx="80" cy="55" r="1" />
          <circle cx="140" cy="20" r="1.2" />
          <circle cx="230" cy="40" r="1" />
          <circle cx="300" cy="25" r="1.4" />
          <circle cx="350" cy="60" r="1" />
          <circle cx="20" cy="80" r="1" />
        </g>

        {/* Sun */}
        <circle cx="195" cy="150" r="140" fill="url(#sun)" />
        <circle cx="195" cy="150" r="64" fill="#fff3d6" />
        <circle cx="195" cy="150" r="64" fill="none" stroke="#fdf8ec" strokeWidth="2" opacity="0.6" />
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={i}
            x1="195"
            y1={150 - 100 + i * 6}
            x2="390"
            y2={150 - 100 + i * 6}
            stroke="#fdf8ec"
            strokeWidth="2"
            opacity="0.25"
          />
        ))}

        {/* Distant mountains */}
        <polygon points="0,300 60,230 130,300" fill="url(#mtnFar)" opacity="0.55" />
        <polygon points="90,300 180,210 260,300" fill="url(#mtnFar)" opacity="0.55" />
        <polygon points="230,300 320,240 390,300" fill="url(#mtnFar)" opacity="0.55" />

        {/* Ground */}
        <rect x="0" y="296" width="390" height="1104" fill="#f3e4c8" />

        {/* Cacti silhouettes */}
        <g fill="#5c4436" opacity="0.85">
          <path d="M40 300 v-46 a8 8 0 0 1 16 0 v46 z" />
          <path d="M40 268 h-16 a8 8 0 0 0 0 16 h16" />
          <path d="M330 300 v-60 a9 9 0 0 1 18 0 v60 z" />
          <path d="M348 254 h16 a9 9 0 0 1 0 18 h-16" />
        </g>

        {/* Road */}
        <polygon points="160,300 230,300 340,1400 50,1400" fill="#3a2418" />
        <polygon points="178,300 212,300 224,320 166,320" fill="#5c3c2b" />
        <line x1="195" y1="320" x2="195" y2="1400" stroke="#fdf8ec" strokeWidth="7" strokeDasharray="22 28" />

        {/* Roadside scrub */}
        <g fill="#4a7a4f" opacity="0.7">
          <ellipse cx="60" cy="360" rx="10" ry="6" />
          <ellipse cx="330" cy="420" rx="12" ry="7" />
          <ellipse cx="45" cy="520" rx="9" ry="5" />
          <ellipse cx="345" cy="600" rx="11" ry="6" />
        </g>
      </svg>
    </div>
  )
}
