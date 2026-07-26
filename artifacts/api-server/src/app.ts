import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { optionalAdmin } from "./middlewares/admin-auth";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";

const app: Express = express();

// Security headers. The API serves JSON only, so we disable the default
// Content-Security-Policy (it's unused by JSON consumers and would block the
// occasional debug browser hit on /api/healthz). HSTS, X-Content-Type-Options,
// Referrer-Policy, X-DNS-Prefetch-Control etc. all stay on by default.
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Stamp req.isAdmin on every request so individual routes can decide how
// much data to return.
app.use("/api", optionalAdmin);
app.use("/api", router);

// JSON 404 + global error handler — never leak stack traces or HTML.
app.use("/api", notFoundHandler);
app.use(errorHandler);

export default app;
