export function StatusPill({ value }: { value?: string | null }) {
  const label = value?.replaceAll('_', ' ') || '—'
  const tone = /critical|overdue|unassigned/i.test(label) ? 'danger' : /high|monitor|pending/i.test(label) ? 'warning' : /completed|active|assigned|normal/i.test(label) ? 'success' : 'neutral'
  return <span className={`pill pill-${tone}`}>{label}</span>
}
