'use client'

type Variant = 'post' | 'match' | 'deliver'

const ICONS: Record<Variant, React.ReactNode> = {
  post: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="18" y="12" width="44" height="56" rx="5" stroke="#11606e" strokeWidth="2" fill="rgba(17,96,110,0.12)" />
      <line x1="28" y1="28" x2="52" y2="28" stroke="#60c8d4" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="28" y1="38" x2="52" y2="38" stroke="#60c8d4" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="28" y1="48" x2="42" y2="48" stroke="#4CB4E7" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="58" cy="58" r="10" fill="#11606e" />
      <path d="M54 58 L57 61 L62 55" stroke="#60c8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  match: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="18" r="9"  fill="rgba(96,200,212,0.15)" stroke="#60c8d4" strokeWidth="2" />
      <circle cx="16" cy="60" r="9"  fill="rgba(17,96,110,0.15)"  stroke="#11606e" strokeWidth="2" />
      <circle cx="64" cy="60" r="9"  fill="rgba(17,96,110,0.15)"  stroke="#11606e" strokeWidth="2" />
      <line x1="40" y1="27" x2="20" y2="51" stroke="#60c8d4" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="40" y1="27" x2="60" y2="51" stroke="#60c8d4" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="40" cy="18" r="4" fill="#60c8d4" />
      <circle cx="16" cy="60" r="4" fill="#11606e" />
      <circle cx="64" cy="60" r="4" fill="#11606e" />
    </svg>
  ),
  deliver: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <polygon points="40,8 68,42 56,42 56,72 24,72 24,42 12,42" stroke="#4CB4E7" strokeWidth="2" fill="rgba(76,180,231,0.08)" strokeLinejoin="round" />
      <polyline points="30,52 38,60 54,44" stroke="#60c8d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

export default function StepModel({ variant }: { variant: Variant }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      aria-hidden="true"
      style={{ animation: 'stepFloat 3.5s ease-in-out infinite' }}
    >
      {ICONS[variant]}
      <style>{`
        @keyframes stepFloat {
          0%, 100% { transform: translateY(0) rotate(0deg);     }
          50%       { transform: translateY(-8px) rotate(1.5deg); }
        }
      `}</style>
    </div>
  )
}
