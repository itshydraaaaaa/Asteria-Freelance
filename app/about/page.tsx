import { Target, Users, Globe, Zap, Shield, TrendingUp, Sparkles } from 'lucide-react'
import Link from 'next/link'

const VALUES = [
  {
    Icon: Target,
    title: 'Excellence First',
    desc: 'We believe every project deserves high quality execution. We verify every freelancer so clients never have to settle.',
  },
  {
    Icon: Globe,
    title: 'Tunisia-Native, MENA-Bound',
    desc: 'Built for how Tunisian freelancers and clients actually work today — with local payment methods and Arabic language support — and designed from day one to extend across the MENA region.',
  },
  {
    Icon: Zap,
    title: 'Smart Matching & Productivity',
    desc: 'Smart matching and AI-assisted proposal writing help every user move faster — one part of the platform, not the whole story.',
  },
  {
    Icon: Shield,
    title: 'Secure by Design',
    desc: 'Escrow payments, verified identities, and dispute resolution built in from day one — not bolted on.',
  },
  {
    Icon: Users,
    title: 'Community Driven',
    desc: 'A collaborative ecosystem where freelancers level up, clients find better talent, and everyone wins together.',
  },
  {
    Icon: TrendingUp,
    title: 'Growth Obsessed',
    desc: 'We measure our success by how many careers we launch and businesses we grow. Platform profit is the byproduct.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 2.1 Our Story & Mission */}
      <section className="bg-ast-dark pt-32 pb-20 px-6 lg:px-12 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-6">
            <Sparkles size={14} className="text-ast-light" />
            <span className="font-mono text-ast-light text-xs tracking-[0.25em] uppercase font-semibold">
              Our Story
            </span>
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
            Building the freelance economy<br />
            <span className="text-ast-light">Tunisia deserves</span>
          </h1>
          <p className="text-white/80 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-body">
            Asteria was founded on a simple belief: talent doesn&apos;t have a geography problem, it has a visibility problem.
            We started in Tunisia, where we know the market and the talent best — and we&apos;re building toward the rest of the region from here.
          </p>
        </div>
      </section>

      {/* 2.2 Launch Highlight Banner */}
      <section className="bg-ast-primary py-8 px-6 text-center text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-ast-light animate-pulse" />
          <p className="font-heading font-semibold text-lg tracking-wide text-white">
            Launching in Tunisia — expanding across the MENA region.
          </p>
        </div>
      </section>

      {/* 2.3 The Problem We Solve */}
      <section className="py-24 px-6 lg:px-12 bg-ast-surface">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-3 font-semibold">
              The Problem We Solve
            </p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-black mb-6">
              The MENA talent gap is real — and Tunisia is where we start
            </h2>
          </div>

          <div className="space-y-6 text-ast-gray text-base sm:text-lg leading-relaxed font-body">
            <p>
              The Middle East and North Africa has one of the youngest populations in the world — more than half of the region is under 30. Many are highly educated and digitally skilled, yet cut off from international markets by payment barriers, lack of visibility, and platforms built for other regions.
            </p>
            <p>
              On the client side, businesses across the region have struggled to find verified local talent they can trust, with contracts they understand, and payments they can actually process.
            </p>
            <p className="border-l-4 border-ast-primary pl-4 text-black font-medium bg-white p-4 rounded-r-2xl shadow-sm">
              Asteria starts in Tunisia — with local payment support and a platform built around how Tunisian freelancers and clients actually work — and is built to expand across the wider MENA region from there.
            </p>
          </div>
        </div>
      </section>

      {/* 2.4 Core Values */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-3 font-semibold">
              What We Stand For
            </p>
            <h2 className="font-heading font-bold text-4xl text-black">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-ast-surface rounded-2xl p-6 border border-black/5 hover:border-ast-primary/30 transition-all shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-ast-primary/10 flex items-center justify-center mb-4 text-ast-primary">
                  <Icon size={20} />
                </div>
                <h3 className="font-heading font-bold text-black text-lg mb-2">{title}</h3>
                <p className="text-ast-gray text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2.6 Call to Action */}
      <section className="py-24 px-6 bg-ast-dark text-white text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-heading font-bold text-4xl text-white">Ready to join the ecosystem?</h2>
          <p className="text-white/70 text-lg">Whether you&apos;re hiring or looking for work, Asteria is built for you.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/register"
              className="bg-ast-light text-ast-dark font-bold rounded-2xl px-8 py-3.5 hover:bg-white transition-all shadow-lg"
            >
              Join as Freelancer
            </Link>
            <Link
              href="/explore"
              className="border border-white/20 text-white font-semibold rounded-2xl px-8 py-3.5 hover:bg-white/10 transition-all"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
