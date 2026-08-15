'use client'

import { useState } from 'react'
import { Sparkles, X, ArrowRight, Zap } from 'lucide-react'

interface Props {
  mode: 'GIG_GENERATOR' | 'JOB_DESCRIPTION' | 'PROPOSAL_LETTER' | 'OFFER_ASSISTANT'
  titleContext?: string
  isOpen: boolean
  onClose: () => void
  onInsertText: (generatedText: string, extraData?: any) => void
}

export function AIAssistantModal({ mode, titleContext = '', isOpen, onClose, onInsertText }: Props) {
  const [prompt, setPrompt] = useState(titleContext)
  const [generating, setGenerating] = useState(false)
  const [generatedText, setGeneratedText] = useState('')
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null)

  if (!isOpen) return null

  const handleGenerate = async () => {
    setGenerating(true)
    setGeneratedText('')
    setSuggestedPrice(null)

    setTimeout(() => {
      if (mode === 'GIG_GENERATOR') {
        const text = `Professional Service Package:
I will deliver high-quality, production-ready work for: "${prompt || 'Custom Digital Solution'}".

What You Get:
• Complete end-to-end design & implementation tailored to your exact brand.
• Includes source files, assets, and comprehensive documentation.
• Tested across mobile & desktop viewports for speed and usability.

Why Work With Me:
• Verified expert with 5+ years MENA marketplace experience.
• On-time delivery guarantee with fast communication.`
        setGeneratedText(text)
        setSuggestedPrice(250)
      } else if (mode === 'JOB_DESCRIPTION') {
        const text = `Project Scope & Requirements:
We are seeking a top-tier freelancer for: "${prompt || 'Web Application Development'}".

Key Deliverables:
• Clean, modern, responsive interface optimized for performance.
• Production-ready code architecture with full documentation.
• Thorough testing across mobile & desktop viewports.

Required Qualifications:
• 3+ years experience with modern tech stacks.
• Strong communication skills and adherence to milestone deadlines.`
        setGeneratedText(text)
        setSuggestedPrice(500)
      } else if (mode === 'PROPOSAL_LETTER') {
        const text = `Dear Client,

I reviewed your project specifications for "${prompt || 'this job'}" and am confident I can exceed your expectations.

Why I am a strong fit:
• Deep technical expertise in modern web & mobile architecture.
• Fast turnaround time with clean, maintainable code quality.
• Proven track record delivering 5-star marketplace solutions.

I am ready to start immediately and can deliver the initial draft within your required timeline.`
        setGeneratedText(text)
      } else {
        const text = `Custom Agreement:
Complete technical deliverable for "${prompt || 'negotiated scope'}".
Includes 3 revision rounds, full source assets, and 14 days of post-delivery support.`
        setGeneratedText(text)
        setSuggestedPrice(300)
      }
      setGenerating(false)
    }, 1100)
  }

  const handleInsert = () => {
    onInsertText(generatedText, { price: suggestedPrice })
    onClose()
  }

  const getTitle = () => {
    switch (mode) {
      case 'GIG_GENERATOR':     return 'AI Freelancer Gig Generator'
      case 'JOB_DESCRIPTION':   return 'AI Client Job Description Generator'
      case 'PROPOSAL_LETTER':   return 'AI Proposal Assistant'
      case 'OFFER_ASSISTANT':   return 'AI Custom Offer Creator'
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case 'GIG_GENERATOR':     return 'Generate a high-converting service listing title, scope & pricing guidance'
      case 'JOB_DESCRIPTION':   return 'Generate detailed project briefs, deliverables & budget guidelines'
      case 'PROPOSAL_LETTER':   return 'Draft tailored cover letters to land client projects'
      case 'OFFER_ASSISTANT':   return 'Draft custom agreement terms for direct messaging'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/10 relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-ast-gray hover:text-black p-1 rounded-full hover:bg-ast-surface transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ast-primary/10 border border-ast-primary/20 text-ast-primary flex items-center justify-center">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-black">{getTitle()}</h3>
            <p className="text-ast-gray text-xs">{getSubtitle()}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ast-dark mb-1.5">Project Keywords or Title</label>
          <input
            type="text"
            placeholder="e.g. Next.js SaaS app development, Mobile UI design..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-ast-primary"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-ast-dark text-white rounded-xl py-3 text-xs font-semibold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {generating ? 'AI Generating Draft...' : <><Sparkles size={14} className="text-ast-light" /> Generate AI Content</>}
        </button>

        {generatedText && (
          <div className="space-y-3 pt-2">
            <div className="bg-ast-surface rounded-2xl p-4 border border-black/8 relative">
              <pre className="text-xs text-black whitespace-pre-wrap font-sans leading-relaxed">
                {generatedText}
              </pre>
            </div>

            {suggestedPrice && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium"><Zap size={14} /> Recommended Market Price:</span>
                <span className="font-bold text-sm">${suggestedPrice}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleInsert}
                className="px-5 py-2.5 bg-ast-primary text-white rounded-xl text-xs font-semibold hover:bg-ast-dark transition-colors flex items-center gap-1.5 shadow-sm"
              >
                Insert Content <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
