import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import prisma from "../db";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as jwt.JwtPayload;
    req.user = {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: String(payload.role || "USER"),
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  requireAuth(req, res, () => {
    if (!req.user) return;
    if (req.user.role !== "ADMIN") {
      res.status(403).json({ error: "Admin access required." });
      return;
    }
    void prisma; // keep import used
    next();
  });
}