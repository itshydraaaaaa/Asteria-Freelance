'use client'

export default function BadgeModel() {
  return (
    <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
      <div style={{ animation: 'badgeSpin 8s linear infinite', transformOrigin: 'center' }}>
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <defs>
            <radialGradient id="badgeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#60c8d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#11606e" stopOpacity="0"   />
            </radialGradient>
          </defs>
          <circle cx="48" cy="48" r="44" fill="url(#badgeGlow)" />
          <polygon
            points="48,10 85,30 85,66 48,86 11,66 11,30"
            stroke="#11606e" strokeWidth="2.5" fill="rgba(17,96,110,0.3)"
          />
          <polygon
            points="48,20 75,35 75,61 48,76 21,61 21,35"
            stroke="#60c8d4" strokeWidth="1.5" fill="rgba(96,200,212,0.15)"
          />
          <circle cx="48" cy="48" r="8" fill="#60c8d4" opacity="0.9" />
          <circle cx="48" cy="48" r="4" fill="#fff" opacity="0.8" />
        </svg>
      </div>
      <style>{`
        @keyframes badgeSpin {
          from { transform: rotateY(0deg);   }
          to   { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  )
}
