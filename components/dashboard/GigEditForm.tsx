'use client'
import { useState }   from 'react'
import { useRouter }  from 'next/navigation'
import { categories } from '@/lib/data/categories'
import { Check, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Gig {
  id: string
  title: string
  description: string
  category: string
  price: number
  deliveryDays: number
  tags: string[]
  featured: boolean
}

export function GigEditForm({ gig }: { gig: Gig }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title:       gig.title,
    description: gig.description,
    category:    gig.category,
    price:       String(gig.price),
    deliveryDays: String(gig.deliveryDays),
    tags:        (gig.tags ?? []).join(', '),
  })
  const [loading,   setLoading]   = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')
  const [showDel,   setShowDel]   = useState(false)

  const handle = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/gigs/${gig.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteGig = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/gigs/${gig.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/dashboard/gigs')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={save} className="bg-white rounded-3xl border border-black/8 p-8 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-black mb-2">Gig Title</label>
        <input value={form.title} onChange={handle('title')} required maxLength={80}
          className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20" />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Category</label>
        <select value={form.category} onChange={handle('category')} required
          className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary bg-white">
          {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Description</label>
        <textarea value={form.description} onChange={handle('description')} required rows={5} maxLength={2000}
          className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">Starting Price ($)</label>
          <input type="number" min={5} max={5000} value={form.price} onChange={handle('price')} required
            className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-2">Delivery (days)</label>
          <input type="number" min={1} max={90} value={form.deliveryDays} onChange={handle('deliveryDays')} required
            className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Tags</label>
        <input value={form.tags} onChange={handle('tags')}
          placeholder="React, TypeScript, Next.js (comma-separated)"
          className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-black/5">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-ast-primary text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-ast-dark transition-colors disabled:opacity-60">
            {loading ? 'Saving…' : <><Check size={14} /> Save Changes</>}
          </button>
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="text-sm text-green-600 font-medium">✓ Saved</motion.span>
            )}
          </AnimatePresence>
        </div>

        <button type="button" onClick={() => setShowDel(true)}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl px-3 py-2 transition-colors">
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {showDel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-black mb-2">Delete this gig?</h3>
            <p className="text-ast-gray text-sm mb-5">This action cannot be undone. All orders linked to this gig will remain.</p>
            <div className="flex gap-3">
              <button onClick={deleteGig} disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button onClick={() => setShowDel(false)} className="flex-1 border border-black/15 text-black rounded-xl py-2.5 text-sm font-medium hover:bg-ast-surface transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
