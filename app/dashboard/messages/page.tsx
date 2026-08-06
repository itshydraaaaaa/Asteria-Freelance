'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Search } from 'lucide-react'

const MOCK_CONVERSATIONS = [
  {
    id: 'c1', name: 'Sara Al-Mansouri', role: 'UI/UX Designer', avatar: 'S',
    last: 'The wireframes are ready for review 🎨', time: '2m ago', unread: 2,
  },
  {
    id: 'c2', name: 'Karim Benali', role: 'Full-stack Dev', avatar: 'K',
    last: 'I can start next Monday, does that work?', time: '1h ago', unread: 0,
  },
  {
    id: 'c3', name: 'Lina Hadad', role: 'Data Scientist', avatar: 'L',
    last: 'The model accuracy is now at 94.2%', time: '3h ago', unread: 1,
  },
  {
    id: 'c4', name: 'Omar Khalil', role: 'Mobile Dev', avatar: 'O',
    last: 'Flutter build is done, please review.', time: 'Yesterday', unread: 0,
  },
  {
    id: 'c5', name: 'Nadia Osman', role: 'Marketing', avatar: 'N',
    last: 'Attached the campaign performance report.', time: '2d ago', unread: 0,
  },
]

const MOCK_MESSAGES: Record<string, { from: 'me' | 'them'; text: string; time: string }[]> = {
  c1: [
    { from: 'them', text: 'Hi! I have completed the initial wireframes for the dashboard.', time: '10:00' },
    { from: 'me',   text: 'Great, looking forward to seeing them!', time: '10:05' },
    { from: 'them', text: 'I focused on mobile-first design with accessibility in mind.', time: '10:06' },
    { from: 'me',   text: 'Perfect approach. When can you share the Figma link?', time: '10:12' },
    { from: 'them', text: 'The wireframes are ready for review 🎨', time: '10:15' },
  ],
  c2: [
    { from: 'me',   text: 'Hi Karim, saw your profile — very impressive portfolio!', time: '09:00' },
    { from: 'them', text: 'Thank you! I specialise in Next.js and Prisma projects.', time: '09:15' },
    { from: 'me',   text: 'We need a full-stack dev for a marketplace app. Interested?', time: '09:20' },
    { from: 'them', text: 'Absolutely. Let me know the scope and timeline.', time: '09:30' },
    { from: 'me',   text: 'Can you start next week?', time: '09:35' },
    { from: 'them', text: 'I can start next Monday, does that work?', time: '09:40' },
  ],
  c3: [
    { from: 'them', text: 'Just ran the latest training cycle on the updated dataset.', time: '14:00' },
    { from: 'me',   text: 'What accuracy are we getting?', time: '14:05' },
    { from: 'them', text: 'The model accuracy is now at 94.2%', time: '14:08' },
    { from: 'me',   text: 'Excellent! That exceeds our target. Well done!', time: '14:10' },
  ],
  c4: [
    { from: 'them', text: 'Flutter build is done, please review.', time: 'Yesterday 16:00' },
    { from: 'me',   text: 'Will check tonight and get back to you.', time: 'Yesterday 17:30' },
  ],
  c5: [
    { from: 'them', text: 'Attached the campaign performance report.', time: '2d ago' },
    { from: 'me',   text: 'Thanks Nadia, I will go through it this week.', time: '2d ago' },
  ],
}

export default function MessagesPage() {
  const [activeId, setActiveId] = useState('c1')
  const [input,    setInput]    = useState('')
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [search,   setSearch]   = useState('')

  const active = MOCK_CONVERSATIONS.find(c => c.id === activeId)!
  const filtered = MOCK_CONVERSATIONS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const send = () => {
    if (!input.trim()) return
    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), { from: 'me', text: input.trim(), time: 'now' }],
    }))
    setInput('')
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-3xl text-black mb-6">Messages</h1>

      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden flex" style={{ height: '600px' }}>
        <div className="w-72 border-r border-black/8 flex flex-col shrink-0">
          <div className="p-3 border-b border-black/8">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ast-gray" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-8 pr-3 py-2 bg-ast-surface rounded-xl text-sm outline-none text-black placeholder:text-ast-gray"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-ast-surface/70 transition-colors ${activeId === c.id ? 'bg-ast-surface' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-black truncate">{c.name}</p>
                    <span className="text-[10px] text-ast-gray shrink-0 ml-1">{c.time}</span>
                  </div>
                  <p className="text-xs text-ast-gray truncate mt-0.5">{c.last}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 bg-ast-primary rounded-full text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="px-5 py-3.5 border-b border-black/8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-sm">
              {active.avatar}
            </div>
            <div>
              <p className="font-semibold text-sm text-black">{active.name}</p>
              <p className="text-xs text-ast-gray">{active.role}</p>
            </div>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400" title="Online" />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {(messages[activeId] ?? []).map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.from === 'me'
                    ? 'bg-ast-primary text-white rounded-br-sm'
                    : 'bg-ast-surface text-black rounded-bl-sm'
                }`}>
                  <p>{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.from === 'me' ? 'text-white/60' : 'text-ast-gray'}`}>{m.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-black/8 flex items-center gap-3">
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Write a message…"
              className="flex-1 bg-ast-surface rounded-xl px-4 py-2.5 text-sm outline-none text-black placeholder:text-ast-gray"
            />
            <button
              onClick={send}
              className="w-10 h-10 rounded-xl bg-ast-primary flex items-center justify-center text-white hover:bg-ast-dark transition-colors shrink-0"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
