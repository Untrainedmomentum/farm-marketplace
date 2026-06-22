'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_id: string
}

export default function ReviewsSection({ farmId, accentColor }: { farmId: string; accentColor: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReviews()
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
  }, [])

  async function loadReviews() {
    const { data } = await supabase.from('reviews').select('*').eq('farm_id', farmId).order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!userId) { setError('Please log in to leave a review.'); return }
    setSubmitting(true)
    const { error } = await supabase.from('reviews').upsert(
      { farm_id: farmId, reviewer_id: userId, rating, comment: comment || null },
      { onConflict: 'farm_id,reviewer_id' }
    )
    setSubmitting(false)
    if (error) { setError(error.message); return }
    setComment('')
    loadReviews()
  }

  const myReview = reviews.find(r => r.reviewer_id === userId)
  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <h2 style={{ color: '#2C1810', marginBottom: '0.5rem', borderBottom: `2px solid ${accentColor}`, paddingBottom: '0.5rem' }}>
        Reviews {reviews.length > 0 && `(${reviews.length})`}
      </h2>
      {reviews.length > 0 && (
        <p style={{ margin: '0.5rem 0 1rem', fontSize: '1rem' }}>
          {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))} {avgRating.toFixed(1)} average
        </p>
      )}
      <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
        All reviews are shown as submitted — they can't be hidden or removed by the farm.
      </p>

      {userId && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', maxWidth: 500 }}>
          <div style={{ marginBottom: '0.75rem' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} onClick={() => setRating(n)} style={{ cursor: 'pointer', fontSize: '1.5rem', color: n <= rating ? '#F0C040' : '#ddd' }}>★</span>
            ))}
          </div>
          <textarea placeholder="Share your experience (optional)" value={comment} onChange={e => setComment(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}
          <button type="submit" disabled={submitting}
            style={{ backgroundColor: accentColor, color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            {submitting ? 'Saving...' : myReview ? 'Update My Review' : 'Submit Review'}
          </button>
        </form>
      )}

      {loading && <p>Loading reviews...</p>}
      {!loading && reviews.length === 0 && <p style={{ color: '#888' }}>No reviews yet. Be the first to leave one.</p>}
      {reviews.map(r => (
        <div key={r.id} style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0' }}>
          <div style={{ color: '#F0C040', fontSize: '0.95rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
          {r.comment && <p style={{ margin: '0.25rem 0', color: '#444', fontSize: '0.9rem' }}>{r.comment}</p>}
          <p style={{ margin: 0, color: '#999', fontSize: '0.75rem' }}>{new Date(r.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  )
}
