import { useEffect, useState } from 'react'
import { Download, MessageSquareText, Plus, Search, Star, Wrench } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusPill } from '../components/StatusPill'
import { api } from '../services/api'

type Kind = 'drivers' | 'vans' | 'households' | 'complaints' | 'feedback'
const config: Record<Kind, { title: string; eyebrow: string; description: string; endpoint: string; headings: string[] }> = {
  drivers: { title: 'Drivers', eyebrow: 'FLEET MANAGEMENT / PEOPLE', description: 'Monitor driver availability, active coverage, and pickup performance.', endpoint: '/drivers', headings: ['Employee', 'Contact', 'Ward / current van', 'Status', 'Performance'] },
  vans: { title: 'Garbage Vans', eyebrow: 'FLEET MANAGEMENT / ASSETS', description: 'Track operational availability, capacity, ward coverage, and maintenance state.', endpoint: '/vans', headings: ['Van', 'Registration', 'Capacity', 'Coverage', 'Status'] },
  households: { title: 'Households', eyebrow: 'CUSTOMERS / DIRECTORY', description: 'Browse EcoSort households, their bins, current rewards, and collection history.', endpoint: '/households', headings: ['Household', 'Contact', 'Ward', 'EcoSort bin', 'Eco Points'] },
  complaints: { title: 'Complaints', eyebrow: 'CUSTOMERS / SERVICE DESK', description: 'Prioritize municipal issues and keep each resident updated through resolution.', endpoint: '/complaints', headings: ['Complaint', 'Household', 'Category', 'Priority', 'Status'] },
  feedback: { title: 'Customer Feedback', eyebrow: 'CUSTOMERS / QUALITY SIGNALS', description: 'Measure household sentiment, pickup satisfaction, and driver experience.', endpoint: '/feedback', headings: ['Household', 'Rating', 'Feedback', 'Driver', 'Submitted'] },
}

function cells(kind: Kind, item: any) {
  if (kind === 'drivers') return [<><b>{item.employeeId}</b><span>{item.name}</span></>, item.phone, item.ward || 'Unassigned', <StatusPill value={item.status} />, `${item.pickups?.filter((p: any) => p.status === 'COMPLETED').length || 0}/${item.pickups?.length || 0} completed`]
  if (kind === 'vans') return [<b>{item.vanId}</b>, item.registrationNo, `${item.capacityKg} kg`, item.currentRoute || 'No active route', <StatusPill value={item.status} />]
  if (kind === 'households') return [<><b>{item.houseNumber}</b><span>{item.customerName}</span></>, item.contact, item.ward, item.bin?.binId || 'Not linked', <b className="point-text">{item.ecoPoints}</b>]
  if (kind === 'complaints') return [<b>{item.id.slice(-8).toUpperCase()}</b>, item.household?.houseNumber, item.category.replace('_', ' '), <StatusPill value={item.priority} />, <StatusPill value={item.status} />]
  return [<b>{item.household?.houseNumber}</b>, <span className="stars">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>, item.comment, item.driver?.employeeId || '—', new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })]
}

export function ManagementPage({ kind }: { kind: Kind }) {
  const c = config[kind]; const [items, setItems] = useState<any[]>([]); const [query, setQuery] = useState('')
  useEffect(() => { api.get(c.endpoint).then(({ data }) => setItems(data)).catch(() => {}) }, [c.endpoint])
  const filtered = items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()))
  const icon = kind === 'complaints' ? <Wrench size={16} /> : kind === 'feedback' ? <MessageSquareText size={16} /> : <Plus size={16} />
  const action = kind === 'feedback' ? <button className="secondary-button"><Download size={16} />Export data</button> : <button className="primary-button">{icon}Add {kind === 'vans' ? 'van' : kind.slice(0, -1)}</button>
  return <><PageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} action={action} />{kind === 'complaints' && <section className="complaint-kpis"><div><b>14</b><span>Open</span></div><div><b>7</b><span>Under review</span></div><div><b>92</b><span>Resolved this month</span></div><div><b>3</b><span>Critical</span></div></section>}{kind === 'feedback' && <div className="rating-banner"><Star size={24} fill="#9DF34A" /> <div><b>4.6 / 5</b><span>Average customer rating · +0.2 from last month</span></div></div>}<section className="panel table-panel"><div className="filter-bar"><label className="search-field"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${kind}`} /></label><button className="filter-button">Ward</button><button className="filter-button">Status</button></div><div className="table-wrap"><table><thead><tr>{c.headings.map((heading) => <th key={heading}>{heading}</th>)}<th></th></tr></thead><tbody>{filtered.map((item, i) => <tr key={item.id || item.employeeId || item.vanId || item.houseNumber || i}>{cells(kind, item).map((cell, n) => <td key={n}>{cell}</td>)}<td><button className="row-action">Open</button></td></tr>)}</tbody></table></div></section></>
}
