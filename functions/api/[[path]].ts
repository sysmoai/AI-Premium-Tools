// Cloudflare Pages Function — intercepts every /api/* request before the
// SPA's static-asset fallback can serve index.html for it (which would
// otherwise look like a fake 200 "success" response full of HTML to any
// fetch() call expecting JSON). No backend is hosted on Pages itself yet,
// so every /api/* request here is a real, honest 404 until one is wired up.
export const onRequest = async () => {
  return new Response(JSON.stringify({ error: "API not available on this deployment" }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
};
