import type { LucideIcon } from 'lucide-react'
export function KpiCard({ label, value, detail, icon: Icon, alert }: { label: string; value: number | string; detail: string; icon: LucideIcon; alert?: boolean }) {
  return <article className={`kpi-card ${alert ? 'kpi-alert' : ''}`}><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div><div className="kpi-icon"><Icon size={21} /></div></article>
}
