// Shared helper for the admin protected routes (pending, approve, reject).
// Checks the Authorization header against the ADMIN_PASSWORD secret set
// in the Cloudflare Pages project settings.

export function isAuthorized(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  return Boolean(env.ADMIN_PASSWORD) && token === env.ADMIN_PASSWORD;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
