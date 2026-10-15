import { z } from 'zod';

export const sensorReadingSchema = z.object({
  dry: z.number().int().min(0).max(100),
  wet: z.number().int().min(0).max(100),
  metal: z.number().int().min(0).max(100),
  ewaste: z.number().int().min(0).max(100),
  timestamp: z.string().datetime().optional(),
});
