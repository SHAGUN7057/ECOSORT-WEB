import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/db.js';
import { startOfToday } from '../utils/dates.js';

export async function listFleet(_req: Request, res: Response) {
  const today = startOfToday();
  const [assignments, drivers, vans] = await Promise.all([
    prisma.dailyFleetAssignment.findMany({ where: { date: today }, include: { driver: true, van: true }, orderBy: { createdAt: 'desc' } }),
    prisma.driver.findMany({ where: { status: 'AVAILABLE' }, orderBy: { employeeId: 'asc' } }),
    prisma.van.findMany({ where: { status: 'AVAILABLE' }, orderBy: { vanId: 'asc' } }),
  ]);
  res.json({ date: today, assignments, drivers, vans });
}

export async function createAssignment(req: Request, res: Response) {
  const { driverId, vanId, ward } = req.body as { driverId?: string; vanId?: string; ward?: string };
  if (!driverId || !vanId || !ward) return res.status(400).json({ message: 'Driver, van and ward are required.' });
  try {
    const assignment = await prisma.$transaction(async (tx) => {
      const [driver, van] = await Promise.all([tx.driver.findUnique({ where: { id: driverId } }), tx.van.findUnique({ where: { id: vanId } })]);
      if (!driver || !van) throw new Error('Selected driver or van no longer exists.');
      if (driver.status !== 'AVAILABLE') throw new Error('Driver is not available for an active assignment.');
      if (van.status !== 'AVAILABLE') throw new Error('Van is not available for an active assignment.');
      const assignment = await tx.dailyFleetAssignment.create({
        data: { date: startOfToday(), driverId, vanId, ward, startTime: new Date(), status: 'ACTIVE' }, include: { driver: true, van: true },
      });
      await Promise.all([
        tx.driver.update({ where: { id: driverId }, data: { status: 'ON_ROUTE', ward } }),
        tx.van.update({ where: { id: vanId }, data: { status: 'ASSIGNED', currentRoute: ward, lastActive: new Date() } }),
      ]);
      return assignment;
    });
    res.status(201).json({ message: `Driver successfully assigned to ${assignment.van.vanId}.`, assignment });
  } catch (error) {
    const message = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
      ? 'Driver or van is already assigned to an active van today.'
      : error instanceof Error ? error.message : 'Unable to create assignment.';
    res.status(409).json({ message });
  }
}

export async function endAssignment(req: Request, res: Response) {
  const assignment = await prisma.dailyFleetAssignment.findUnique({ where: { id: String(req.params.id) } });
  if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
  await prisma.$transaction([
    prisma.dailyFleetAssignment.update({ where: { id: assignment.id }, data: { status: 'ENDED', endTime: new Date() } }),
    prisma.driver.update({ where: { id: assignment.driverId }, data: { status: 'AVAILABLE', ward: null } }),
    prisma.van.update({ where: { id: assignment.vanId }, data: { status: 'AVAILABLE', currentRoute: null } }),
  ]);
  res.json({ message: 'Fleet assignment ended.' });
}
