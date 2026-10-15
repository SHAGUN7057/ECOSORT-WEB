import { Router } from 'express';
import { createAssignment, endAssignment, listFleet } from '../controllers/fleetController.js';
import { requireAdmin } from '../middleware/auth.js';

export const fleetRoutes = Router();
fleetRoutes.use(requireAdmin);
fleetRoutes.get('/', listFleet);
fleetRoutes.post('/assignments', createAssignment);
fleetRoutes.patch('/assignments/:id/end', endAssignment);
