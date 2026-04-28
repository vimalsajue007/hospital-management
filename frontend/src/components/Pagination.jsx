import './Pagination.css'
 
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
 
  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
 
  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page <= 1}>‹</button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={i} className="page-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`page-btn ${p === page ? 'page-active' : ''}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>›</button>
    </div>
  )
}