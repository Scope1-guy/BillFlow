// Donut chart of invoice counts per status, drawn with SVG circles.
// Each colored arc is a circle whose stroke is only partly visible (stroke-dasharray).
const COLORS = {
  Paid: '#16a34a',
  Sent: '#0c5adb',
  'Partially Paid': '#f59e0b',
  Overdue: '#ef4444',
  Draft: '#94a3b8',
}

export default function StatusDonut({ counts }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  // Running total of how far around the ring we already are
  let offset = 0
  const arcs = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => {
      const length = (count / total) * circumference
      const arc = { status, length, offset }
      offset += length
      return arc
    })

  return (
    <div className="donut-wrap">
      <svg className="donut" viewBox="0 0 200 200" role="img" aria-label="Invoice count by status">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#eef2f7" strokeWidth="26" />
        {arcs.map((arc) => (
          <circle
            key={arc.status}
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={COLORS[arc.status]}
            strokeWidth="26"
            strokeDasharray={`${arc.length} ${circumference - arc.length}`}
            strokeDashoffset={-arc.offset}
            transform="rotate(-90 100 100)"
          />
        ))}
        <text x="100" y="98" textAnchor="middle" className="donut-number">{total}</text>
        <text x="100" y="118" textAnchor="middle" className="donut-label">invoices</text>
      </svg>

      <ul className="legend">
        {Object.entries(counts).map(([status, count]) => (
          <li key={status}>
            <span className="legend-dot" style={{ background: COLORS[status] }} />
            {status}
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
