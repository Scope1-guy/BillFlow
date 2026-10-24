import Icon from './Icon'

// One summary card. Props: title, value, note, icon, tone (color) and danger (red value).
export default function StatCard({ title, value, note, icon, tone = 'green', danger = false }) {
  return (
    <div className="card stat-card">
      <div className="stat-top">
        <h2 className="stat-title">{title}</h2>
        <span className={`stat-icon tone-${tone}`}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <p className={`stat-value ${danger ? 'danger' : ''}`}>{value}</p>
      <p className="stat-note">{note}</p>
    </div>
  )
}
