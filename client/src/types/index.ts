export type WasteType = 'DRY' | 'WET' | 'METAL' | 'EWASTE'
export type PickupStatus = 'UNASSIGNED' | 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE'
export interface DashboardData {
  kpis: { bins: number; activeBins: number; alerts: number; activeDrivers: number; activeVans: number; openComplaints: number }
  critical: Pickup[]; distribution: ChartItem[]; fillLevels: ChartItem[]; pickupStatus: ChartItem[]; recentActivity: Notification[]; wardLoads: WardLoad[]
}
export interface ChartItem { name: string; value: number }
export interface WardLoad { ward: string; pickups: number; averageFill: number }
export interface Pickup { id: string; wasteType: WasteType; fillPercentage: number; ward: string; priority: 'NORMAL' | 'HIGH' | 'CRITICAL'; status: PickupStatus; createdAt: string; household: { houseNumber: string }; driver?: { employeeId: string; name: string } | null; van?: { vanId: string } | null }
export interface Notification { id: string; title: string; body: string; kind?: string; createdAt: string; readAt?: string | null }
