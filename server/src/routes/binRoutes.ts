import { Router } from 'express';
import { addReading, getBin, listBins } from '../controllers/binsController.js';
import { requireAdmin } from '../middleware/auth.js';

export const binRoutes = Router();
binRoutes.post('/:binId/readings', addReading); // Raspberry Pi service-to-service endpoint; use an API key in production.
binRoutes.get('/', requireAdmin, listBins);
binRoutes.get('/:binId', requireAdmin, getBin);
