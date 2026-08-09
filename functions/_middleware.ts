interface Env {
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  COMMERCE_ENABLED?: string;
}

function adminConfigPresent(env: Env): boolean {
  return Boolean(env.ADMIN_PASSWORD?.trim() && env.SESSION_SECRET?.trim());
}

function commerceApproved(env: Env): boolean {
  return env.COMMERCE_ENABLED?.trim().toLowerCase() === "true";
}

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const isApi = url.pathname === "/api" || url.pathname.startsWith("/api/");
  if (!isApi) return context.next();

  const configPresent = adminConfigPresent(context.env);
  const hasAuthorization = context.request.headers.has("authorization");
  const isAdminLogin = url.pathname === "/api/admin/login";

  // Emergency fail-closed guard. The underlying legacy API currently contains
  // development fallbacks; until that implementation is fully refactored,
  // never allow an Authorization-bearing request or admin login to reach it
  // without both production auth bindings configured.
  if (!configPresent && (hasAuthorization || isAdminLogin)) {
    return jsonError("Admin authentication unavailable", 503);
  }

  // Canonical AIPT records currently contain no LIVE commerce offer and the
  // production catalog includes unverified credential/shared-access models.
  // Default all checkout writes to HOLD until an authorized deployment sets
  // COMMERCE_ENABLED=true after per-SKU eligibility and pricing gates exist.
  const commerceWrite =
    context.request.method === "POST" &&
    (url.pathname === "/api/customers" || url.pathname === "/api/orders");
  if (commerceWrite && !commerceApproved(context.env)) {
    return jsonError("Purchasing temporarily unavailable while offer eligibility is verified", 503);
  }

  return context.next();
};
