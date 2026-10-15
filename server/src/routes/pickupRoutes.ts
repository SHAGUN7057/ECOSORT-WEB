import { Router } from 'express';
import { driverPickups, driverRoute, listPickups, markComplete, updatePickup } from '../controllers/pickupController.js';
import { requireAdmin } from '../middleware/auth.js';

export const pickupRoutes = Router();
pickupRoutes.get('/', requireAdmin, listPickups);
pickupRoutes.patch('/:id', requireAdmin, updatePickup);
pickupRoutes.patch('/:id/complete', markComplete); // Driver App service endpoint; add driver JWT middleware for production.
pickupRoutes.get('/driver/:employeeId', driverPickups);
pickupRoutes.get('/driver/:employeeId/route', driverRoute);
