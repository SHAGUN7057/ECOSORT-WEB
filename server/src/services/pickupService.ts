import { PickupPriority, PickupStatus, WasteType } from '@prisma/client';
import { prisma } from '../utils/db.js';
import { startOfToday } from '../utils/dates.js';

const activeStatuses: PickupStatus[] = [
  PickupStatus.UNASSIGNED,
  PickupStatus.PENDING,
  PickupStatus.ASSIGNED,
  PickupStatus.IN_PROGRESS,
  PickupStatus.OVERDUE,
];

export function priorityFor(fill: number): PickupPriority {
  if (fill >= 100) return PickupPriority.CRITICAL;
  if (fill >= 95) return PickupPriority.HIGH;
  return PickupPriority.NORMAL;
}

export function binStatus(levels: number[], online = true) {
  if (!online) return 'OFFLINE';
  const highest = Math.max(...levels);
  if (highest >= 100) return 'CRITICAL';
  if (highest >= 95) return 'HIGH_PRIORITY';
  if (highest >= 90) return 'PICKUP_REQUIRED';
  if (highest >= 70) return 'MONITOR';
  return 'NORMAL';
}

type Reading = { dry: number; wet: number; metal: number; ewaste: number; timestamp?: string };

export async function processSensorReading(binId: string, reading: Reading) {
  const bin = await prisma.bin.findUnique({
    where: { binId },
    include: { household: true, compartments: true },
  });
  if (!bin) throw new Error(`Bin ${binId} was not found.`);

  const recordedAt = reading.timestamp ? new Date(reading.timestamp) : new Date();
  const levels: [WasteType, number][] = [
    [WasteType.DRY, reading.dry],
    [WasteType.WET, reading.wet],
    [WasteType.METAL, reading.metal],
    [WasteType.EWASTE, reading.ewaste],
  ];

  await prisma.$transaction([
    prisma.sensorReading.create({ data: { binId: bin.id, dry: reading.dry, wet: reading.wet, metal: reading.metal, ewaste: reading.ewaste, recordedAt } }),
    prisma.bin.update({ where: { id: bin.id }, data: { lastUpdated: recordedAt, isOnline: true } }),
    ...levels.map(([wasteType, fillPercent]) => prisma.binCompartment.upsert({
      where: { binId_wasteType: { binId: bin.id, wasteType } },
      create: { binId: bin.id, wasteType, fillPercent },
      update: { fillPercent },
    })),
  ]);

  const pickups = [];
  for (const [wasteType, fillPercentage] of levels.filter(([, level]) => level >= 90)) {
    const priority = priorityFor(fillPercentage);
    const existing = await prisma.pickupRequest.findFirst({
      where: { householdId: bin.householdId, wasteType, status: { in: activeStatuses } },
    });
    if (existing) {
      pickups.push(await prisma.pickupRequest.update({
        where: { id: existing.id },
        data: { fillPercentage, priority },
        include: { driver: true, van: true },
      }));
      continue;
    }

    const assignment = await prisma.dailyFleetAssignment.findFirst({
      where: { date: startOfToday(), ward: bin.household.ward, status: 'ACTIVE' },
      include: { driver: true, van: true },
    });
    const pickup = await prisma.pickupRequest.create({
      data: {
        householdId: bin.householdId,
        binId: bin.id,
        wasteType,
        fillPercentage,
        ward: bin.household.ward,
        priority,
        status: assignment ? PickupStatus.ASSIGNED : PickupStatus.UNASSIGNED,
        driverId: assignment?.driverId,
        vanId: assignment?.vanId,
      },
      include: { driver: true, van: true },
    });
    pickups.push(pickup);
    if (assignment) {
      await prisma.pickupNotification.create({
        data: {
          pickupRequestId: pickup.id,
          driverId: assignment.driverId,
          title: priority === PickupPriority.CRITICAL ? 'CRITICAL PICKUP REQUIRED' : 'PICKUP REQUIRED',
          body: `${bin.household.houseNumber} · ${wasteType} at ${fillPercentage}% · ${bin.household.ward}`,
        },
      });
    }
    await prisma.notification.create({
      data: {
        kind: assignment ? 'PICKUP_ALERT' : 'FLEET_ATTENTION',
        ward: bin.household.ward,
        title: assignment ? `${priority} pickup created` : 'Fleet Attention Required',
        body: assignment
          ? `${bin.household.houseNumber} ${wasteType} is ${fillPercentage}% and routed to ${assignment.driver.employeeId}.`
          : `No active fleet assignment for ${bin.household.ward}. ${bin.household.houseNumber} needs ${wasteType} collection.`,
      },
    });
  }
  return { binId, status: binStatus(levels.map(([, level]) => level)), pickups };
}

export async function completePickup(id: string) {
  const pickup = await prisma.pickupRequest.update({
    where: { id },
    data: { status: PickupStatus.COMPLETED, completedAt: new Date() },
    include: { household: true, driver: true },
  });
  await prisma.$transaction([
    prisma.wasteCollection.upsert({
      where: { pickupRequestId: id },
      create: { pickupRequestId: id, wasteType: pickup.wasteType, weightKg: Number((pickup.fillPercentage * 0.18).toFixed(1)) },
      update: {},
    }),
    prisma.notification.create({ data: { kind: 'PICKUP_COMPLETED', ward: pickup.ward, title: 'Pickup completed', body: `${pickup.household.houseNumber} ${pickup.wasteType} collection was completed${pickup.driver ? ` by ${pickup.driver.employeeId}` : ''}.` } }),
  ]);
  return pickup;
}

export async function suggestedRoute(employeeId: string) {
  const driver = await prisma.driver.findUnique({ where: { employeeId } });
  if (!driver) throw new Error('Driver not found.');
  const requests = await prisma.pickupRequest.findMany({
    where: { driverId: driver.id, status: { in: [PickupStatus.ASSIGNED, PickupStatus.IN_PROGRESS, PickupStatus.PENDING] } },
    include: { household: true },
  });
  const weight = { CRITICAL: 300, HIGH: 200, NORMAL: 100 } as Record<string, number>;
  return requests.sort((a, b) => weight[b.priority] + b.fillPercentage - (weight[a.priority] + a.fillPercentage));
}
