interface Env {
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
}

function adminConfigPresent(env: Env): boolean {
  return Boolean(env.ADMIN_PASSWORD?.trim() && env.SESSION_SECRET?.trim());
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
    return new Response(JSON.stringify({ error: "Admin authentication unavailable" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  return context.next();
};
