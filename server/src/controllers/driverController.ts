import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db.js';
import { startOfToday } from '../utils/dates.js';
import { suggestedRoute } from '../services/pickupService.js';

export async function driverLogin(req: Request, res: Response) {
  const { employeeId, password } = req.body as { employeeId?: string; password?: string };
  if (!employeeId) return res.status(400).json({ message: 'Employee ID is required.' });
  const driver = await prisma.driver.findUnique({ where: { employeeId } });
  if (!driver) return res.status(401).json({ message: 'Invalid driver credentials.' });
  if (driver.passwordHash && (!password || !(await bcrypt.compare(password, driver.passwordHash)))) {
    return res.status(401).json({ message: 'Invalid driver credentials.' });
  }
  const token = jwt.sign({ id: driver.id, employeeId: driver.employeeId, role: 'DRIVER' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '12h' });
  res.json({ token, driver: { id: driver.id, employeeId: driver.employeeId, name: driver.name, status: driver.status } });
}

export async function driverToday(req: Request, res: Response) {
  const employeeId = String(req.params.employeeId);
  const driver = await prisma.driver.findUnique({ where: { employeeId } });
  if (!driver) return res.status(404).json({ message: 'Driver not found.' });
  const [assignment, pickups] = await Promise.all([
    prisma.dailyFleetAssignment.findFirst({ where: { driverId: driver.id, date: startOfToday(), status: 'ACTIVE' }, include: { van: true } }),
    prisma.pickupRequest.findMany({ where: { driverId: driver.id, status: { in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING'] } }, include: { household: true, van: true }, orderBy: [{ priority: 'desc' }, { fillPercentage: 'desc' }] }),
  ]);
  res.json({ driver: { employeeId: driver.employeeId, name: driver.name }, assignment, pickups });
}

export async function driverAssignments(req: Request, res: Response) {
  const driver = await prisma.driver.findUnique({ where: { employeeId: String(req.params.employeeId) } });
  if (!driver) return res.status(404).json({ message: 'Driver not found.' });
  res.json(await prisma.dailyFleetAssignment.findMany({ where: { driverId: driver.id }, include: { van: true }, orderBy: { date: 'desc' } }));
}

export async function driverPickupsForApp(req: Request, res: Response) {
  const driver = await prisma.driver.findUnique({ where: { employeeId: String(req.params.employeeId) } });
  if (!driver) return res.status(404).json({ message: 'Driver not found.' });
  res.json(await prisma.pickupRequest.findMany({ where: { driverId: driver.id }, include: { household: true, van: true }, orderBy: { createdAt: 'desc' } }));
}

export async function driverRouteForApp(req: Request, res: Response) {
  try { res.json(await suggestedRoute(String(req.params.employeeId))); }
  catch (error) { res.status(404).json({ message: error instanceof Error ? error.message : 'Driver not found.' }); }
}
