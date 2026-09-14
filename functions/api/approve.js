// POST /api/approve
// Admin only. Takes the edited entry from the admin panel, writes it as
// its own file under entries/ for a readable history, and appends it to
// data/entries.json so the homepage picks it up. Cloudflare Pages then
// rebuilds the site automatically once the commit lands.
//
// Requires these Cloudflare Pages environment variables:
//   ADMIN_PASSWORD  the password checked in _auth.js
//   GITHUB_TOKEN     a fine grained personal access token with contents
//                     read and write access on the repo below
//   GITHUB_REPO      "yourusername/slime-tutorials"
//   GITHUB_BRANCH    optional, defaults to "main"

import { isAuthorized, unauthorizedResponse } from "./_auth.js";

const GITHUB_API = "https://api.github.com";

function githubHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "slime-tutorials-admin",
  };
}

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(str) {
  return decodeURIComponent(escape(atob(str)));
}

async function getFile(env, path) {
  const branch = env.GITHUB_BRANCH || "main";
  const res = await fetch(
    `${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${path}?ref=${branch}`,
    { headers: githubHeaders(env) }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to read ${path} from GitHub`);

  return res.json();
}

async function putFile(env, path, content, sha, message) {
  const branch = env.GITHUB_BRANCH || "main";
  const res = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to write ${path}: ${text}`);
  }

  return res.json();
}

export async function onRequestPost({ request, env }) {
  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  const { submissionId, entry } = await request.json();

  if (!entry || !entry.id || !entry.title) {
    return new Response(JSON.stringify({ error: "A complete entry is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Write the individual show file, for a readable history.
    await putFile(
      env,
      `entries/${entry.id}.json`,
      JSON.stringify(entry, null, 2),
      undefined,
      `Add show: ${entry.title}`
    );

    // Append to the aggregate file the homepage actually reads.
    const existing = await getFile(env, "data/entries.json");
    const currentEntries = existing ? JSON.parse(fromBase64(existing.content)) : [];
    const withoutDuplicate = currentEntries.filter((e) => e.id !== entry.id);
    const updatedEntries = [...withoutDuplicate, entry];

    await putFile(
      env,
      "data/entries.json",
      JSON.stringify(updatedEntries, null, 2),
      existing ? existing.sha : undefined,
      `Publish show: ${entry.title}`
    );

    if (submissionId) {
      await env.SUBMISSIONS.delete(`pending:${submissionId}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
