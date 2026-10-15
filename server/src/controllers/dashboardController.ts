import { PickupStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../utils/db.js';

export async function dashboard(req: Request, res: Response) {
  const [bins, activeBins, alerts, activeDrivers, activeVans, openComplaints, critical, compartments, recent, pickupGroups, wardLoads] = await Promise.all([
    prisma.bin.count(),
    prisma.bin.count({ where: { isOnline: true } }),
    prisma.pickupRequest.count({ where: { status: { in: [PickupStatus.ASSIGNED, PickupStatus.UNASSIGNED, PickupStatus.PENDING, PickupStatus.IN_PROGRESS] } } }),
    prisma.driver.count({ where: { status: { in: ['AVAILABLE', 'ON_ROUTE'] } } }),
    prisma.van.count({ where: { status: { in: ['ASSIGNED', 'ON_ROUTE'] } } }),
    prisma.complaint.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    prisma.pickupRequest.findMany({
      where: { status: { in: [PickupStatus.ASSIGNED, PickupStatus.UNASSIGNED, PickupStatus.PENDING, PickupStatus.IN_PROGRESS] } },
      include: { household: true, driver: true, van: true }, orderBy: [{ priority: 'desc' }, { fillPercentage: 'desc' }], take: 6,
    }),
    prisma.binCompartment.groupBy({ by: ['wasteType'], _avg: { fillPercent: true }, _count: true }),
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 7 }),
    prisma.pickupRequest.groupBy({ by: ['status'], _count: true }),
    prisma.pickupRequest.groupBy({ by: ['ward'], _count: true, _avg: { fillPercentage: true } }),
  ]);
  res.json({
    kpis: { bins, activeBins, alerts, activeDrivers, activeVans, openComplaints },
    critical,
    distribution: compartments.map((item) => ({ name: item.wasteType, value: item._count })),
    fillLevels: compartments.map((item) => ({ name: item.wasteType, value: Math.round(item._avg.fillPercent || 0) })),
    pickupStatus: pickupGroups.map((item) => ({ name: item.status, value: item._count })),
    recentActivity: recent,
    wardLoads: wardLoads.map((item) => ({ ward: item.ward, pickups: item._count, averageFill: Math.round(item._avg.fillPercentage || 0) })),
  });
}

export async function analytics(req: Request, res: Response) {
  const [collections, pickupStatus, wards, feedback] = await Promise.all([
    prisma.wasteCollection.groupBy({ by: ['wasteType'], _sum: { weightKg: true }, _count: true }),
    prisma.pickupRequest.groupBy({ by: ['status'], _count: true }),
    prisma.household.groupBy({ by: ['ward'], _count: true }),
    prisma.feedback.aggregate({ _avg: { rating: true } }),
  ]);
  res.json({ collections, pickupStatus, wards, averageRating: Number((feedback._avg.rating || 0).toFixed(1)) });
}
