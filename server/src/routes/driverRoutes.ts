import { Router } from 'express';
import { driverAssignments, driverLogin, driverPickupsForApp, driverRouteForApp, driverToday } from '../controllers/driverController.js';

export const driverRoutes = Router();
driverRoutes.post('/login', driverLogin);
driverRoutes.get('/:employeeId/today', driverToday);
driverRoutes.get('/:employeeId/assignments', driverAssignments);
driverRoutes.get('/:employeeId/pickups', driverPickupsForApp);
driverRoutes.get('/:employeeId/route', driverRouteForApp);
