import { useMemo, useState } from 'react'

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

export default function TicketComments({
  comments = [],
  onAddComment,
  disabled = false,
  loading = false,
  title = 'Comments',
  placeholder = 'Write a comment...',
}) {
  const [commentInput, setCommentInput] = useState('')
  const [localError, setLocalError] = useState('')

  const normalizedComments = useMemo(
    () =>
      (Array.isArray(comments) ? comments : []).map((item) => ({
        id: item?.id || item?._id || `${item?.createdAt || ''}-${item?.message || ''}`,
        author: item?.authorName || item?.author || item?.user || 'Unknown user',
        message: item?.message || item?.comment || '',
        createdAt: item?.createdAt || item?.created_at || null,
      })),
    [comments],
  )

  async function handleSubmit(event) {
    event.preventDefault()
    const value = commentInput.trim()
    if (!value) {
      setLocalError('Comment cannot be empty')
      return
    }
    if (typeof onAddComment !== 'function') return

    try {
      setLocalError('')
      await onAddComment(value)
      setCommentInput('')
    } catch (error) {
      setLocalError(error?.message || 'Could not add comment')
    }
  }

  return (
    <section className="dash-card">
      <h3>{title}</h3>
      {normalizedComments.length === 0 ? (
        <p className="tickets-muted">No comments yet.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Comment</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {normalizedComments.map((comment) => (
                <tr key={comment.id}>
                  <td>{comment.author}</td>
                  <td>{comment.message || '-'}</td>
                  <td>{formatDateTime(comment.createdAt) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleSubmit} className="incident-form-grid" style={{ marginTop: 12 }}>
        <div className="incident-field">
          <label htmlFor="ticket-comment-input">Add Comment</label>
          <textarea
            id="ticket-comment-input"
            rows={3}
            placeholder={placeholder}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            disabled={disabled || loading}
          />
          {localError ? <small className="incident-field-error">{localError}</small> : null}
        </div>
        <button type="submit" className="incident-submit-btn" disabled={disabled || loading}>
          {loading ? 'Saving...' : 'Add Comment'}
        </button>
      </form>
    </section>
  )
}
