import { Target, Users, Globe, Zap, Shield, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const STATS = [
  { value: '20+', label: 'Countries Served' },
  { value: '5K+', label: 'Registered Freelancers' },
  { value: '12K+', label: 'Projects Completed' },
  { value: '98%', label: 'Client Satisfaction' },
]

const VALUES = [
  { Icon: Target,     title: 'Excellence First',       desc: 'We believe every project deserves elite-level work. We vet every freelancer so clients never have to settle.' },
  { Icon: Globe,      title: 'MENA-Native',            desc: 'Built for the region, with local payment methods, Arabic language support, and deep understanding of MENA markets.' },
  { Icon: Zap,        title: 'AI-Powered',             desc: 'Smart matching, proposal generation, and market insights powered by AI to give every user an unfair advantage.' },
  { Icon: Shield,     title: 'Secure by Design',       desc: 'Escrow payments, verified identities, and dispute resolution built in from day one — not bolted on.' },
  { Icon: Users,      title: 'Community Driven',       desc: 'A collaborative ecosystem where freelancers level up, clients find better talent, and everyone wins together.' },
  { Icon: TrendingUp, title: 'Growth Obsessed',        desc: 'We measure our success by how many careers we launch and businesses we grow. Platform profit is the byproduct.' },
]

const TEAM = [
  { name: 'Karim Benali',   role: 'CEO & Co-founder',    initials: 'KB', bio: 'Ex-Google PM. Built 3 startups before Asteria. Passionate about democratising opportunity in MENA.',   location: 'Tunis, Tunisia' },
  { name: 'Nour Mansouri',  role: 'CTO & Co-founder',    initials: 'NM', bio: 'Full-stack engineer with 10+ years at top tech firms. Architect of Asteria\'s AI matching system.',       location: 'Dubai, UAE' },
  { name: 'Sara El-Amine',  role: 'Head of Product',     initials: 'SE', bio: 'Product leader who shipped at Careem and Vezeeta. Obsessed with user delight and zero-friction flows.',   location: 'Cairo, Egypt' },
  { name: 'Youssef Driss',  role: 'Head of Growth',      initials: 'YD', bio: 'Growth hacker who scaled two marketplaces past $10M ARR. Leads freelancer acquisition and activation.', location: 'Casablanca, Morocco' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-ast-dark pt-32 pb-24 px-6 lg:px-12 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-mono text-ast-light text-xs tracking-[0.3em] uppercase mb-4">Our Story</p>
          <h1 className="font-heading font-bold text-5xl lg:text-6xl leading-tight mb-6">
            Building the digital economy<br />
            <span className="text-ast-light">for the MENA generation</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto">
            Asteria was founded on a simple belief: talent doesn&apos;t have a geography problem, it has a visibility problem.
            We built the platform we wished existed when we were freelancers.
          </p>
        </div>
      </section>

      <section className="bg-ast-primary py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="font-heading font-bold text-4xl mb-1">{s.value}</p>
              <p className="text-white/70 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 lg:px-12 bg-ast-surface">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-4">The Problem We Solve</p>
              <h2 className="font-heading font-bold text-4xl text-black mb-6">The MENA talent gap is real — and massive</h2>
              <p className="text-ast-gray leading-relaxed mb-4">
                Over 60% of the MENA population is under 30. Millions are highly educated, digitally skilled, and globally competitive — yet cut off from international markets by payment barriers, lack of visibility, and platforms designed for other markets.
              </p>
              <p className="text-ast-gray leading-relaxed mb-4">
                On the client side, businesses in the region struggled to find verified local talent they could trust, with contracts they understood, and payments they could actually process.
              </p>
              <p className="text-ast-gray leading-relaxed">
                Asteria is the bridge. A platform that speaks Arabic and English, accepts local and international payments, and connects elite regional talent with the clients who need them most.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['60M+', 'Youth under 30 in MENA'],
                ['$50B+', 'Digital economy potential'],
                ['73%', 'Freelancers underserved by existing platforms'],
                ['3x', 'Faster hiring vs. traditional agencies'],
              ].map(([v, l]) => (
                <div key={l} className="bg-white rounded-2xl border border-black/8 p-6">
                  <p className="font-heading font-bold text-3xl text-ast-primary mb-2">{v}</p>
                  <p className="text-ast-gray text-sm leading-snug">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-4">What We Stand For</p>
            <h2 className="font-heading font-bold text-4xl text-black">Our values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-ast-surface rounded-2xl p-6 border border-black/5">
                <div className="w-10 h-10 rounded-xl bg-ast-primary/10 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-ast-primary" />
                </div>
                <h3 className="font-semibold text-black mb-2">{title}</h3>
                <p className="text-ast-gray text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-12 bg-ast-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-4">The Team</p>
            <h2 className="font-heading font-bold text-4xl text-black">The people behind Asteria</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(m => (
              <div key={m.name} className="bg-white rounded-2xl border border-black/8 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {m.initials}
                </div>
                <h3 className="font-semibold text-black mb-0.5">{m.name}</h3>
                <p className="text-ast-primary text-xs font-medium mb-3">{m.role}</p>
                <p className="text-ast-gray text-xs leading-relaxed mb-3">{m.bio}</p>
                <p className="text-xs text-ast-gray/70">{m.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-ast-dark text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading font-bold text-4xl mb-4">Ready to join the ecosystem?</h2>
          <p className="text-white/70 mb-8">Whether you&apos;re hiring or looking for work, Asteria is built for you.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-ast-light text-ast-dark font-semibold rounded-full px-8 py-3 hover:bg-ast-sky transition-colors">
              Join as Freelancer
            </Link>
            <Link href="/explore" className="border border-white/20 text-white rounded-full px-8 py-3 hover:bg-white/10 transition-colors">
              Browse Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
