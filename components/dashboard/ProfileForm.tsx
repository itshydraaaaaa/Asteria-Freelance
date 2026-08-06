'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion }    from 'framer-motion'
import { User, Mail, DollarSign, FileText, Tag, Wallet, MapPin, Globe, Check, Camera, Edit2, X, Loader2 } from 'lucide-react'
import { ImageCropper } from './ImageCropper'

interface Profile {
  name:         string
  email:        string
  bio:          string
  skills:       string[]
  hourlyRate:   number | null
  role:         string
  walletBalance: number
  location?:    string
  website?:     string
  languages?:   string[]
  image?:       string // 👉 Added image to interface
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const router  = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 👉 New States for Preview Mode and Image Upload
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [saved,  setSaved]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,  setError]  = useState('')
  const [form,   setForm]   = useState({
    name:       profile.name       ?? '',
    bio:        profile.bio        ?? '',
    skills:     (profile.skills    ?? []).join(', '),
    hourlyRate: String(profile.hourlyRate ?? ''),
    location:   profile.location   ?? '',
    website:    profile.website    ?? '',
    languages:  (profile.languages ?? []).join(', '),
    image:      profile.image      ?? '',
  })
  const [pendingImage, setPendingImage] = useState<string | null>(null)

  const handle = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  // 👉 Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => setPendingImage(reader.result as string)
  reader.readAsDataURL(file)
}

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSaved(true)
      setIsEditing(false) // 👉 Switch back to preview mode on save
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT SIDEBAR: PROFILE CARD */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl border border-black/8 p-6 relative overflow-hidden">
          <div className="flex flex-col items-center text-center">
            
            {/* 👉 Avatar Section with Upload Button */}
            <div className="relative mb-4 group">
              <div className="w-24 h-24 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-4xl overflow-hidden border-4 border-white shadow-sm">
                {form.image ? (
                  <img src={form.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.name?.[0]?.toUpperCase() ?? '?'
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full hover:bg-ast-primary transition-colors shadow-md border-2 border-white"
              >
                {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              {/* Hidden File Input */}
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
            </div>

            <p className="font-heading font-bold text-xl text-black">{form.name || profile.name || 'Your Name'}</p>
            <p className="text-ast-gray text-sm mt-1">{profile.email}</p>
            <span className="inline-block mt-3 text-xs font-semibold text-ast-primary bg-ast-muted rounded-full px-3 py-1">
              {profile.role}
            </span>
          </div>

          <div className="mt-6 pt-6 border-t border-black/8 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Wallet size={16} className="text-ast-primary shrink-0" />
              <div>
                <p className="text-ast-gray text-xs">Wallet Balance</p>
                <p className="font-semibold text-black">${profile.walletBalance?.toLocaleString() ?? '0'}</p>
              </div>
            </div>
            {profile.role === 'FREELANCER' && form.hourlyRate && (
              <div className="flex items-center gap-3 text-sm">
                <DollarSign size={16} className="text-ast-primary shrink-0" />
                <div>
                  <p className="text-ast-gray text-xs">Hourly Rate</p>
                  <p className="font-semibold text-black">${form.hourlyRate}/hr</p>
                </div>
              </div>
            )}
            {form.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-ast-primary shrink-0" />
                <div>
                  <p className="text-ast-gray text-xs">Location</p>
                  <p className="font-semibold text-black">{form.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: PREVIEW OR EDIT FORM */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          
          {/* 👉 Header with dynamic Edit/Cancel button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-black text-xl">
              {isEditing ? 'Edit Profile' : 'Profile Details'}
            </h2>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 text-sm font-medium text-ast-gray hover:text-black transition-colors"
            >
              {isEditing ? <><X size={16} /> Cancel</> : <><Edit2 size={16} /> Edit Profile</>}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
          )}
          {saved && !isEditing && (
             <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
               <Check size={16} /> Profile updated successfully!
             </div>
          )}

          {/* 👉 VIEW MODE */}
          {!isEditing ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-ast-gray uppercase tracking-wider mb-2">About Me</p>
                <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">
                  {form.bio || <span className="text-black/40 italic">No bio provided.</span>}
                </p>
              </div>

              {profile.role === 'FREELANCER' && (
                <div>
                  <p className="text-xs font-medium text-ast-gray uppercase tracking-wider mb-2">Skills</p>
                  {form.skills ? (
                    <div className="flex flex-wrap gap-2">
                      {form.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                        <span key={s} className="text-xs bg-ast-surface text-black font-medium rounded-lg px-3 py-1.5 border border-black/5">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-black/40 italic">No skills listed.</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <p className="text-xs font-medium text-ast-gray uppercase tracking-wider mb-1">Languages</p>
                  <p className="text-sm text-black">{form.languages || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ast-gray uppercase tracking-wider mb-1">Website</p>
                  {form.website ? (
                    <a href={form.website} target="_blank" rel="noreferrer" className="text-sm text-ast-primary hover:underline flex items-center gap-1.5">
                      <Globe size={14} /> {form.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <p className="text-sm text-black/40">—</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            
            /* 👉 EDIT MODE (The Form) */
            <form onSubmit={handleSave} className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-medium text-ast-gray uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
                  <input value={form.name} onChange={handle('name')} placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ast-gray uppercase tracking-wider mb-1.5">Bio</label>
                <div className="relative">
                  <FileText size={15} className="absolute left-3.5 top-3.5 text-ast-gray" />
                  <textarea value={form.bio} onChange={handle('bio')} placeholder="Tell clients about yourself…" rows={4}
                    className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all resize-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ast-gray uppercase tracking-wider mb-1.5">Location</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
                    <input value={form.location} onChange={handle('location')} placeholder="Dubai, UAE"
                      className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ast-gray uppercase tracking-wider mb-1.5">Website</label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
                    <input value={form.website} onChange={handle('website')} placeholder="https://yoursite.com"
                      className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all" />
                  </div>
                </div>
              </div>

              {profile.role === 'FREELANCER' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-ast-gray uppercase tracking-wider mb-1.5">Skills (comma separated)</label>
                    <div className="relative">
                      <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
                      <input value={form.skills} onChange={handle('skills')} placeholder="React, Node.js, Figma…"
                        className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-ast-gray uppercase tracking-wider mb-1.5">Hourly Rate (USD)</label>
                      <div className="relative">
                        <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
                        <input type="number" min="1" value={form.hourlyRate} onChange={handle('hourlyRate')} placeholder="e.g. 75"
                          className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ast-gray uppercase tracking-wider mb-1.5">Languages</label>
                      <input value={form.languages} onChange={handle('languages')} placeholder="English, Arabic, French"
                        className="w-full px-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-black/5">
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 bg-ast-primary text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-ast-dark transition-colors disabled:opacity-60">
                  {loading ? 'Saving…' : <><Check size={14} /> Save Profile</>}
                </button>
              </div>
            </form>
          )}
        </div>
        {pendingImage && (
        <ImageCropper 
          image={pendingImage} 
          onCancel={() => setPendingImage(null)} 
          onSave={async (blob: Blob) => {
            setUploadingImage(true)
            setPendingImage(null) // Close the modal immediately
            try {
              const formData = new FormData()
              // Turn the cropped canvas blob into a File
              formData.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
              formData.append('bucket', 'avatars')

              const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error ?? 'Upload failed')

              // Update the profile picture in the UI instantly
              setForm(f => ({ ...f, image: data.url }))
              
              // Auto-save the new image to the user's database row
              await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: data.url }),
              })
            } catch (err: any) {
              console.error(err)
            } finally {
              setUploadingImage(false)
            }
          }} 
        />
      )}
      </div>
    </div>
  )
}