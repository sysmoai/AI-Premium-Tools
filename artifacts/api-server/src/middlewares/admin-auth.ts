import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";

function requireAdminConfig(name: "SESSION_SECRET" | "ADMIN_PASSWORD"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be configured before admin authentication can initialize`);
  }
  return value;
}

const SESSION_SECRET = requireAdminConfig("SESSION_SECRET");
const ADMIN_PASSWORD = requireAdminConfig("ADMIN_PASSWORD");

export function getAdminPassword(): string {
  return ADMIN_PASSWORD;
}

export function mintAdminToken(): string {
  return createHmac("sha256", SESSION_SECRET)
    .update("aipt:admin:v1")
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers["authorization"];
  if (typeof header !== "string") return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
    }
  }
}

export function optionalAdmin(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  req.isAdmin = !!token && safeEqual(token, mintAdminToken());
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token || !safeEqual(token, mintAdminToken())) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.isAdmin = true;
  next();
}
