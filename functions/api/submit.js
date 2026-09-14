// POST /api/submit
// Public endpoint. Anyone can call this from the suggestion form.
// Writes the submission into the SUBMISSIONS KV namespace with a
// pending: prefix. Does not touch the live site or GitHub at all.

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid submission" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const title = (body.title || "").trim();
  const format = (body.format || "").trim();

  if (!title || !format) {
    return new Response(JSON.stringify({ error: "Title and format are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const submission = {
    id,
    title,
    format,
    link: (body.link || "").trim(),
    poster: (body.poster || "").trim(),
    notes: (body.notes || "").trim(),
    submittedBy: (body.submittedBy || "").trim(),
    submittedAt: new Date().toISOString(),
  };

  await env.SUBMISSIONS.put(`pending:${id}`, JSON.stringify(submission));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
