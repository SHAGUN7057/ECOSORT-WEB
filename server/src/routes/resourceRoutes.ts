import { Router } from 'express';
import { complaints, drivers, feedback, households, markNotificationRead, notifications, vans } from '../controllers/resourceController.js';
import { requireAdmin } from '../middleware/auth.js';

export const resourceRoutes = Router();
export const customerRoutes = Router();
resourceRoutes.use(requireAdmin);
resourceRoutes.get('/households', households);
resourceRoutes.get('/drivers', drivers);
resourceRoutes.get('/vans', vans);
resourceRoutes.get('/complaints', complaints);
resourceRoutes.patch('/complaints/:id', async (req, res) => res.json(await (await import('../utils/db.js')).prisma.complaint.update({ where: { id: req.params.id }, data: req.body })));
resourceRoutes.get('/feedback', feedback);
resourceRoutes.get('/notifications', notifications);
resourceRoutes.patch('/notifications/:id/read', markNotificationRead);
customerRoutes.get('/:houseNumber/bin', async (req, res) => {
  const { prisma } = await import('../utils/db.js');
  const household = await prisma.household.findUnique({ where: { houseNumber: req.params.houseNumber }, include: { bin: { include: { compartments: true } } } });
  if (!household) return res.status(404).json({ message: 'Household not found.' });
  res.json(household.bin);
});
customerRoutes.get('/:houseNumber/fill-levels', async (req, res) => {
  const { prisma } = await import('../utils/db.js');
  const household = await prisma.household.findUnique({ where: { houseNumber: req.params.houseNumber }, include: { bin: { include: { compartments: true } } } });
  if (!household) return res.status(404).json({ message: 'Household not found.' });
  res.json(household.bin?.compartments || []);
});
customerRoutes.get('/:houseNumber/pickups', async (req, res) => {
  const { prisma } = await import('../utils/db.js');
  const household = await prisma.household.findUnique({ where: { houseNumber: req.params.houseNumber } });
  if (!household) return res.status(404).json({ message: 'Household not found.' });
  res.json(await prisma.pickupRequest.findMany({ where: { householdId: household.id }, orderBy: { createdAt: 'desc' } }));
});
customerRoutes.get('/:houseNumber/rewards', async (req, res) => {
  const { prisma } = await import('../utils/db.js');
  const household = await prisma.household.findUnique({ where: { houseNumber: req.params.houseNumber } });
  if (!household) return res.status(404).json({ message: 'Household not found.' });
  res.json(await prisma.ecoPointTransaction.findMany({ where: { householdId: household.id }, orderBy: { createdAt: 'desc' } }));
});
customerRoutes.post('/:houseNumber/complaints', async (req, res, next) => {
  req.body.houseNumber = String(req.params.houseNumber);
  try { await complaints(req, res); } catch (error) { next(error); }
});
customerRoutes.post('/:houseNumber/feedback', async (req, res, next) => {
  req.body.houseNumber = String(req.params.houseNumber);
  try { await feedback(req, res); } catch (error) { next(error); }
});
