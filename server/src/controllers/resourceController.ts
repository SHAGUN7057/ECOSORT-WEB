import { Request, Response } from 'express';
import { prisma } from '../utils/db.js';

export async function households(req: Request, res: Response) {
  const search = String(req.query.search || '');
  res.json(await prisma.household.findMany({
    where: { OR: [{ houseNumber: { contains: search, mode: 'insensitive' } }, { customerName: { contains: search, mode: 'insensitive' } }] },
    include: { bin: true, pickups: true }, orderBy: { houseNumber: 'asc' },
  }));
}

export async function drivers(_req: Request, res: Response) {
  res.json(await prisma.driver.findMany({ include: { assignments: { where: { status: 'ACTIVE' }, include: { van: true } }, pickups: true }, orderBy: { employeeId: 'asc' } }));
}

export async function vans(_req: Request, res: Response) {
  res.json(await prisma.van.findMany({ include: { assignments: { where: { status: 'ACTIVE' }, include: { driver: true } } }, orderBy: { vanId: 'asc' } }));
}

export async function complaints(req: Request, res: Response) {
  if (req.method === 'POST') {
    const { houseNumber, category, description, priority = 'NORMAL' } = req.body;
    const household = await prisma.household.findUnique({ where: { houseNumber } });
    if (!household) return res.status(404).json({ message: 'Household not found.' });
    const complaint = await prisma.complaint.create({ data: { householdId: household.id, category, description, priority } });
    await prisma.notification.create({ data: { kind: 'COMPLAINT', ward: household.ward, title: 'New complaint received', body: `${houseNumber}: ${category}` } });
    return res.status(201).json(complaint);
  }
  res.json(await prisma.complaint.findMany({ include: { household: true }, orderBy: { createdAt: 'desc' } }));
}

export async function feedback(req: Request, res: Response) {
  if (req.method === 'POST') {
    const { houseNumber, rating, comment, driverId } = req.body;
    const household = await prisma.household.findUnique({ where: { houseNumber } });
    if (!household) return res.status(404).json({ message: 'Household not found.' });
    return res.status(201).json(await prisma.feedback.create({ data: { householdId: household.id, rating: Number(rating), comment, driverId } }));
  }
  res.json(await prisma.feedback.findMany({ include: { household: true, driver: true }, orderBy: { createdAt: 'desc' } }));
}

export async function notifications(_req: Request, res: Response) {
  res.json(await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }));
}

export async function markNotificationRead(req: Request, res: Response) {
  res.json(await prisma.notification.update({ where: { id: String(req.params.id) }, data: { readAt: new Date() } }));
}
