import { Link } from 'react-router-dom'

interface Props {
  eyebrow?: string
  title: string
  description?: string | string[]
  note?: string
  action?: { to: string; label: string }
}

export default function DashboardHeroBanner({ eyebrow = 'TLMT', title, description, note, action }: Props) {
  const lines = Array.isArray(description) ? description.filter(Boolean) : [description].filter(Boolean) as string[]
  return (
    <section className="dashboard-hero">
      <span className="dashboard-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {lines.map((line) => <p key={line}>{line}</p>)}
      {note && <div className="dashboard-hero-note">{note}</div>}
      {action?.to && action?.label && (
        <div className="dashboard-hero-actions">
          <Link to={action.to} className="dashboard-hero-button">{action.label}</Link>
        </div>
      )}
    </section>
  )
}
