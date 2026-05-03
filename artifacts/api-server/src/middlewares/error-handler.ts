import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";

interface HttpishError {
  name?: string;
  status?: number;
  statusCode?: number;
  type?: string;
  expose?: boolean;
  message?: string;
  issues?: unknown;
}

function isZodError(err: unknown): err is HttpishError {
  return (
    !!err &&
    typeof err === "object" &&
    (err as HttpishError).name === "ZodError" &&
    Array.isArray((err as HttpishError).issues)
  );
}

function pickStatus(err: unknown): number {
  if (isZodError(err)) return 400;
  if (err && typeof err === "object") {
    const e = err as HttpishError;
    if (typeof e.status === "number") return e.status;
    if (typeof e.statusCode === "number") return e.statusCode;
  }
  return 500;
}

function pickMessage(status: number, err: unknown): string {
  if (isZodError(err)) return "Invalid request body";
  if (err && typeof err === "object") {
    const e = err as HttpishError;
    if (e.expose && typeof e.message === "string") return e.message;
    if (status === 413) return "Request entity too large";
    if (status === 400 && typeof e.message === "string") return e.message;
  }
  if (status >= 500) return "Internal server error";
  return "Request failed";
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const status = pickStatus(err);
  const message = pickMessage(status, err);

  if (status >= 500) {
    req.log.error({ err }, "Unhandled error");
  } else {
    req.log.warn(
      { err: err instanceof Error ? err.message : err, status },
      "Request error",
    );
  }

  if (res.headersSent) return;

  if (isZodError(err)) {
    res.status(400).json({ error: { message, issues: (err as HttpishError).issues } });
    return;
  }
  res.status(status).json({ error: { message } });
};

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { message: `Not Found: ${req.method} ${req.path}` } });
}
