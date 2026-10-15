import { Bell, Bot, Building2, CircleHelp, ClipboardCheck, FileBarChart, Gauge, LayoutDashboard, LogOut, Menu, MessageSquareText, PanelTop, Route, Settings, Truck, Users, X } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const sections = [
  { label: 'DASHBOARD', items: [{ to: '/', icon: LayoutDashboard, text: 'Control Center' }] },
  { label: 'OPERATIONS', items: [{ to: '/bins', icon: Gauge, text: 'Live Bin Monitoring' }, { to: '/pickup-requests', icon: ClipboardCheck, text: 'Pickup Requests' }, { to: '/pickup-history', icon: Route, text: 'Pickup History' }] },
  { label: 'FLEET MANAGEMENT', items: [{ to: '/fleet-assignment', icon: PanelTop, text: 'Daily Fleet Assignment' }, { to: '/drivers', icon: Users, text: 'Drivers' }, { to: '/vans', icon: Truck, text: 'Garbage Vans' }] },
  { label: 'ANALYTICS', items: [{ to: '/analytics/waste', icon: FileBarChart, text: 'Waste Analytics' }, { to: '/analytics/collection', icon: Route, text: 'Collection Analytics' }, { to: '/analytics/wards', icon: Building2, text: 'Ward Analytics' }, { to: '/reports', icon: FileBarChart, text: 'Reports' }] },
  { label: 'CUSTOMERS', items: [{ to: '/households', icon: Building2, text: 'Households' }, { to: '/complaints', icon: CircleHelp, text: 'Complaints' }, { to: '/feedback', icon: MessageSquareText, text: 'Feedback' }] },
  { label: 'SYSTEM', items: [{ to: '/notifications', icon: Bell, text: 'Notifications' }, { to: '/settings', icon: Settings, text: 'Settings' }] },
]

export function AppShell() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const current = sections.flatMap((s) => s.items).find((item) => item.to === location.pathname)?.text || 'Control Center'
  function logout() { localStorage.removeItem('ecosort_token'); localStorage.removeItem('ecosort_demo'); navigate('/login') }
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Bot size={20} /></div><div><b>EcoSort</b><span>Municipal console</span></div><button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <nav>{sections.map((section) => <div className="nav-section" key={section.label}><p>{section.label}</p>{section.items.map(({ to, icon: Icon, text }) => <NavLink key={to} onClick={() => setOpen(false)} to={to} end={to === '/'}><Icon size={17} /><span>{text}</span></NavLink>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="system-health"><span></span><div><b>System status</b><small>API-backed telemetry</small></div></div><button className="logout" onClick={logout}><LogOut size={17} />Log out</button></div>
    </aside>
    {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <main className="main-content"><header className="topbar"><button className="icon-button menu-button" onClick={() => setOpen(true)}><Menu size={20} /></button><div><p className="eyebrow">ECOSORT ADMIN</p><b>{current}</b></div><div className="topbar-right"><span className="live-dot">Live network</span><button className="icon-button" onClick={() => navigate('/notifications')} aria-label="Open notifications"><Bell size={19} /></button><div className="admin-avatar">AS</div></div></header><div className="page-content"><Outlet /></div></main>
  </div>
}
