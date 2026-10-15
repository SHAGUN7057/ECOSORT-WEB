import { Request, Response } from 'express';
import { sensorReadingSchema } from '../validators/sensor.js';
import { prisma } from '../utils/db.js';
import { binStatus, processSensorReading } from '../services/pickupService.js';

export async function listBins(req: Request, res: Response) {
  const { search = '', ward, status } = req.query as { search?: string; ward?: string; status?: string };
  const bins = await prisma.bin.findMany({
    where: {
      OR: [{ binId: { contains: search, mode: 'insensitive' } }, { household: { houseNumber: { contains: search, mode: 'insensitive' } } }],
      ...(ward ? { household: { ward } } : {}),
    },
    include: { household: true, compartments: true, pickups: { where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } }, take: 1 } },
    orderBy: { lastUpdated: 'desc' },
  });
  const data = bins.map((bin) => {
    const levels = bin.compartments.map((c) => c.fillPercent);
    const computedStatus = binStatus(levels, bin.isOnline);
    return { ...bin, computedStatus, pickupStatus: bin.pickups[0]?.status || 'CLEAR' };
  }).filter((bin) => !status || bin.computedStatus === status);
  res.json(data);
}

export async function getBin(req: Request, res: Response) {
  const bin = await prisma.bin.findUnique({
    where: { binId: String(req.params.binId) },
    include: { household: true, compartments: true, readings: { take: 30, orderBy: { recordedAt: 'desc' } }, pickups: { include: { driver: true, van: true }, orderBy: { createdAt: 'desc' } } },
  });
  if (!bin) return res.status(404).json({ message: 'Bin not found.' });
  res.json(bin);
}

export async function addReading(req: Request, res: Response) {
  const parsed = sensorReadingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid sensor reading.', errors: parsed.error.flatten() });
  try {
    const result = await processSensorReading(String(req.params.binId), parsed.data);
    req.app.get('io')?.emit('bin:reading', result);
    req.app.get('io')?.emit('dashboard:update', { reason: 'sensor-reading' });
    res.status(201).json(result);
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Unable to process reading.' });
  }
}
