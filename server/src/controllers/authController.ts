import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  let admin;
  try {
    admin = await prisma.admin.findUnique({ where: { email } });
  } catch {
    return res.status(503).json({ message: 'Database unavailable. Check DATABASE_URL and PostgreSQL credentials, then run the seed command.' });
  }
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  const token = jwt.sign({ id: admin.id, role: admin.role, ward: admin.ward }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '12h' });
  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, ward: admin.ward } });
}

export async function me(req: AuthRequest, res: Response) {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin!.id }, select: { id: true, name: true, email: true, role: true, ward: true } });
  res.json(admin);
}
