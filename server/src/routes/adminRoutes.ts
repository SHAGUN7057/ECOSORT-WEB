import { Router } from 'express';
import { analytics, dashboard } from '../controllers/dashboardController.js';
import { requireAdmin } from '../middleware/auth.js';

export const adminRoutes = Router();
adminRoutes.use(requireAdmin);
adminRoutes.get('/dashboard', dashboard);
adminRoutes.get('/analytics', analytics);
