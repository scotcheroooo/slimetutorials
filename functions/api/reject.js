// POST /api/reject
// Admin only. Deletes a pending submission from KV without publishing it.

import { isAuthorized, unauthorizedResponse } from "./_auth.js";

export async function onRequestPost({ request, env }) {
  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  const { submissionId } = await request.json();

  if (!submissionId) {
    return new Response(JSON.stringify({ error: "submissionId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await env.SUBMISSIONS.delete(`pending:${submissionId}`);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
