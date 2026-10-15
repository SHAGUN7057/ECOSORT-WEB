import { PickupPriority, PickupStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../utils/db.js';
import { completePickup, suggestedRoute } from '../services/pickupService.js';

export async function listPickups(req: Request, res: Response) {
  const { status, ward } = req.query as { status?: PickupStatus; ward?: string };
  const pickups = await prisma.pickupRequest.findMany({
    where: { ...(status ? { status } : {}), ...(ward ? { ward } : {}) },
    include: { household: true, driver: true, van: true },
    orderBy: [{ priority: 'desc' }, { fillPercentage: 'desc' }],
  });
  res.json(pickups);
}

export async function updatePickup(req: Request, res: Response) {
  const { status, priority, driverId, vanId } = req.body as { status?: PickupStatus; priority?: PickupPriority; driverId?: string | null; vanId?: string | null };
  const pickup = await prisma.pickupRequest.update({ where: { id: String(req.params.id) }, data: { ...(status ? { status } : {}), ...(priority ? { priority } : {}), ...(driverId !== undefined ? { driverId } : {}), ...(vanId !== undefined ? { vanId } : {}) }, include: { driver: true, van: true } });
  res.json({ message: 'Pickup request updated.', pickup });
}

export async function markComplete(req: Request, res: Response) {
  try {
    const pickup = await completePickup(String(req.params.id));
    req.app.get('io')?.emit('dashboard:update', { reason: 'pickup-completed' });
    res.json({ message: 'Pickup completed successfully.', pickup });
  } catch {
    res.status(404).json({ message: 'Pickup not found.' });
  }
}

export async function driverPickups(req: Request, res: Response) {
  const driver = await prisma.driver.findUnique({ where: { employeeId: String(req.params.employeeId) } });
  if (!driver) return res.status(404).json({ message: 'Driver not found.' });
  const pickups = await prisma.pickupRequest.findMany({ where: { driverId: driver.id }, include: { household: true, van: true }, orderBy: { createdAt: 'desc' } });
  res.json(pickups);
}

export async function driverRoute(req: Request, res: Response) {
  try { res.json(await suggestedRoute(String(req.params.employeeId))); }
  catch (error) { res.status(404).json({ message: error instanceof Error ? error.message : 'Driver not found.' }); }
}
