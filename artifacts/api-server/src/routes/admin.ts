import { Router } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import { getAdminPassword, mintAdminToken } from "../middlewares/admin-auth";

const router = Router();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}

function clearRateLimit(ip: string) {
  attempts.delete(ip);
}

router.post("/admin/login", (req, res) => {
  const ip = req.ip ?? "unknown";
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec));
    res.status(429).json({ error: "Too many login attempts. Please try again later." });
    return;
  }
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  if (parsed.data.password !== getAdminPassword()) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  clearRateLimit(ip);
  res.json({ token: mintAdminToken() });
});

export default router;
