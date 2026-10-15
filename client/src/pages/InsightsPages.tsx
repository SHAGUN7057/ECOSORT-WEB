import { useEffect, useState } from 'react'
import { CheckCheck, Download, FileSpreadsheet, Leaf, Send, SlidersHorizontal } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { api } from '../services/api'
import type { Notification } from '../types'

export function AnalyticsPage({ kind }: { kind: 'waste' | 'collection' | 'wards' }) {
  const title = kind === 'waste' ? 'Waste Analytics' : kind === 'collection' ? 'Collection Analytics' : 'Ward Analytics'
  return <><PageHeader eyebrow={`ANALYTICS / ${kind.toUpperCase()}`} title={title} description="Operational metrics are populated from recorded backend activity." action={<button className="secondary-button"><SlidersHorizontal size={16} />Filter</button>} /><section className="panel table-panel"><div className="empty-state">No analytics data is available yet.</div></section></>
}

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  useEffect(() => { api.get<Notification[]>('/notifications').then(({ data }) => setItems(data)).catch(() => {}) }, [])
  return <><PageHeader eyebrow="SYSTEM / EVENT STREAM" title="Notifications" description="Live operational events from bins, field collection, fleet coverage, and residents." action={<button className="secondary-button"><CheckCheck size={16} />Mark all read</button>} /><section className="notification-panel">{items.length === 0 ? <div className="empty-state">No notifications yet.</div> : items.map((item, i) => <article className={`notification-card ${!item.readAt ? 'unread' : ''}`} key={item.id}><div className={`notification-icon ni-${i % 4}`}><span>{item.kind?.slice(0, 1) || '·'}</span></div><div><div><b>{item.title}</b>{!item.readAt && <span className="new-tag">NEW</span>}</div><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div><button className="row-action">{item.readAt ? 'Archived' : 'Mark read'}</button></article>)}</section></>
}

export function ReportsPage() {
  const reports = ['Waste Collection Report', 'Pickup Performance Report', 'Driver Performance Report', 'Ward Performance Report', 'Complaints Report']
  return <><PageHeader eyebrow="ANALYTICS / EXPORTS" title="Reports" description="Generate exports from recorded municipal operations." action={<button className="primary-button"><Send size={16} />Schedule report</button>} /><section className="report-grid">{reports.map((title, i) => <article className="report-card" key={title}><div className={`report-icon ri-${i % 3}`}><FileSpreadsheet size={22}/></div><h2>{title}</h2><p>Report data will appear after records are created.</p><div><select defaultValue="Today"><option>Today</option><option>Last 7 days</option><option>Last 30 days</option></select><button className="secondary-button"><Download size={15}/>CSV</button></div></article>)}</section><section className="impact-banner"><Leaf size={29}/><div><p className="eyebrow">ECOLOGICAL IMPACT</p><b>No collection impact recorded yet.</b><span>Record completed collections to calculate this metric.</span></div></section></>
}

export function SettingsPage() { return <><PageHeader eyebrow="SYSTEM / CONFIGURATION" title="Settings" description="Manage operational thresholds and integration defaults. The three thresholds below are intentionally separate." /><section className="settings-grid"><article className="panel setting-card"><b>AI Classification confidence</b><span>80% · Edge AI acceptance threshold</span><input type="range" defaultValue="80" /><small>Below this, the Raspberry Pi should use its fallback classification flow. This does not create pickups.</small></article><article className="panel setting-card"><b>Household pickup alert</b><span>90% · Automatic pickup creation</span><input type="range" defaultValue="90" /><small>At or above 90%, the backend checks for one active household + waste-type request and routes it to the active ward fleet.</small></article><article className="panel setting-card"><b>Municipal route planning</b><span>85% · Suggested collection queue</span><input type="range" defaultValue="85" /><small>Used to prepare routes before pickups are critical; it does not replace the 90% pickup trigger.</small></article></section></> }
