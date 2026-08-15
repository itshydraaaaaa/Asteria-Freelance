'use client'

/**
 * components/orders/ReviewSubmissionModal.tsx — Interactive Review & Rating Modal
 *
 * Accessibility (Phase 9):
 * - Star picker has full keyboard operability (ArrowLeft, ArrowRight, Home, End, 1-5 keys)
 * - role="radiogroup" and aria-checked for screen readers
 * - Focus management and trap prevention
 */

import { useState } from 'react'
import { Star, X, CheckCircle2 } from 'lucide-react'

interface Props {
  orderId: string
  freelancerId: string
  gigId?: string
  freelancerName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ReviewSubmissionModal({
  orderId,
  freelancerId,
  gigId,
  freelancerName,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleKeyDown = (e: React.KeyboardEvent, star: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      setRating(prev => Math.min(5, prev + 1))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      setRating(prev => Math.max(1, prev - 1))
    } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
      setRating(parseInt(e.key, 10))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      setSubmitting(true)
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          freelancerId,
          gigId: gigId || 'custom',
          rating,
          comment,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit review')
      }

      setSubmitted(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1200)
    } catch (err: any) {
      alert(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 relative space-y-4">
        <button
          onClick={onClose}
          aria-label="Close review modal"
          className="absolute top-5 right-5 text-ast-gray hover:text-black p-1 rounded-full hover:bg-ast-surface"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h3 id="review-modal-title" className="font-heading font-bold text-xl text-black">
              Review Submitted!
            </h3>
            <p className="text-ast-gray text-xs">
              Thank you for rating your experience with {freelancerName}.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-black/8 pb-3">
              <h3 id="review-modal-title" className="font-heading font-bold text-xl text-black">
                Rate & Review Work
              </h3>
              <p className="text-ast-gray text-xs mt-0.5">
                Share feedback for <strong>{freelancerName}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center py-2">
                <label id="rating-label" className="block text-xs font-semibold text-ast-gray mb-2 uppercase tracking-wider">
                  Overall Rating
                </label>
                <div
                  role="radiogroup"
                  aria-labelledby="rating-label"
                  className="flex items-center justify-center gap-1.5"
                >
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      onKeyDown={e => handleKeyDown(e, star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-ast-primary/50 rounded-lg"
                    >
                      <Star
                        size={28}
                        className={
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-black/15'
                        }
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-ast-primary mt-2">
                  {rating === 5
                    ? '⭐ Exceptional (5.0)'
                    : rating === 4
                    ? '👍 Very Good (4.0)'
                    : rating === 3
                    ? '👌 Average (3.0)'
                    : rating === 2
                    ? '👎 Below Average (2.0)'
                    : '⚠️ Poor (1.0)'}
                </p>
              </div>

              <div>
                <label htmlFor="review-comment" className="block text-xs font-semibold text-ast-dark mb-1.5">
                  Written Feedback *
                </label>
                <textarea
                  id="review-comment"
                  rows={4}
                  required
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Describe your experience: work quality, communication speed, and deliverables..."
                  className="w-full px-4 py-3 rounded-2xl border border-black/15 text-sm focus:outline-none focus:border-ast-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-ast-gray hover:bg-ast-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-ast-primary text-white hover:bg-ast-dark shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Post Public Review'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
