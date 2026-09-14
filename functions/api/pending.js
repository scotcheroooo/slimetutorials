// GET /api/pending
// Admin only. Returns all pending submissions from KV, newest first.

import { isAuthorized, unauthorizedResponse } from "./_auth.js";

export async function onRequestGet({ request, env }) {
  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  const list = await env.SUBMISSIONS.list({ prefix: "pending:" });
  const submissions = await Promise.all(
    list.keys.map(async (key) => {
      const value = await env.SUBMISSIONS.get(key.name);
      return value ? JSON.parse(value) : null;
    })
  );

  const cleaned = submissions
    .filter(Boolean)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return new Response(JSON.stringify(cleaned), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
