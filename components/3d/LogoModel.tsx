'use client'

export default function LogoModel() {
  return (
    <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
      <div className="relative w-56 h-56">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ animation: 'heroFloat 4s ease-in-out infinite' }}
        >
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#60c8d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#11606e" stopOpacity="0"    />
            </radialGradient>
            <filter id="blur4">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          <circle cx="100" cy="100" r="80" fill="url(#glow)" />

          <polygon
            points="100,18 174,152 26,152"
            stroke="#60c8d4" strokeWidth="2" fill="none" strokeLinejoin="round"
            style={{ animation: 'heroSpin 18s linear infinite', transformOrigin: '100px 100px' }}
          />
          <polygon
            points="100,46 154,144 46,144"
            stroke="#4CB4E7" strokeWidth="1.2" fill="rgba(76,180,231,0.05)" strokeLinejoin="round"
            style={{ animation: 'heroSpin 12s linear infinite reverse', transformOrigin: '100px 100px' }}
          />

          <circle cx="100" cy="108" r="10" fill="#60c8d4" opacity="0.9"
            style={{ animation: 'heroPulse 2.5s ease-in-out infinite' }}
          />
          <circle cx="100" cy="108" r="10" fill="#60c8d4" opacity="0.3" filter="url(#blur4)"
            style={{ animation: 'heroPulse 2.5s ease-in-out infinite' }}
          />

          <circle cx="62"  cy="72"  r="3.5" fill="#4CB4E7" opacity="0.7" />
          <circle cx="138" cy="72"  r="2.5" fill="#60c8d4" opacity="0.5" />
          <circle cx="78"  cy="145" r="2"   fill="#4CB4E7" opacity="0.6" />
          <circle cx="126" cy="148" r="3"   fill="#60c8d4" opacity="0.4" />
        </svg>
      </div>

      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0);    }
          50%       { transform: translateY(-14px); }
        }
        @keyframes heroSpin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes heroPulse {
          0%, 100% { opacity: 0.9; transform: scale(1);    }
          50%       { opacity: 0.5; transform: scale(1.25); }
        }
      `}</style>
    </div>
  )
}
