import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppShell } from './layouts/AppShell'
import { Dashboard } from './pages/Dashboard'
import { BinsPage, PickupsPage } from './pages/OperationsPages'
import { FleetPage } from './pages/FleetPage'
import { ManagementPage } from './pages/ManagementPages'
import { AnalyticsPage, NotificationsPage, ReportsPage, SettingsPage } from './pages/InsightsPages'
import { Login } from './pages/Login'

function Protected({ children }: { children: ReactNode }) { const location = useLocation(); return localStorage.getItem('ecosort_token') ? <>{children}</> : <Navigate to="/login" replace state={{ from: location }} /> }

export default function App() { return <Routes><Route path="/login" element={<Login/>}/><Route element={<Protected><AppShell/></Protected>}><Route path="/" element={<Dashboard/>}/><Route path="/bins" element={<BinsPage/>}/><Route path="/pickup-requests" element={<PickupsPage/>}/><Route path="/pickup-history" element={<PickupsPage history/>}/><Route path="/fleet-assignment" element={<FleetPage/>}/><Route path="/drivers" element={<ManagementPage kind="drivers"/>}/><Route path="/vans" element={<ManagementPage kind="vans"/>}/><Route path="/households" element={<ManagementPage kind="households"/>}/><Route path="/complaints" element={<ManagementPage kind="complaints"/>}/><Route path="/feedback" element={<ManagementPage kind="feedback"/>}/><Route path="/analytics/waste" element={<AnalyticsPage kind="waste"/>}/><Route path="/analytics/collection" element={<AnalyticsPage kind="collection"/>}/><Route path="/analytics/wards" element={<AnalyticsPage kind="wards"/>}/><Route path="/reports" element={<ReportsPage/>}/><Route path="/notifications" element={<NotificationsPage/>}/><Route path="/settings" element={<SettingsPage/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes> }
