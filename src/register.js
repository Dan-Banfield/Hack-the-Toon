/*
 * The sign-up handler for POST /api/register (called from src/worker.js).
 *
 * It runs on Cloudflare's servers as part of the site's Worker, never in the
 * visitor's browser. It is the only thing allowed to write to the Supabase
 * table; the database itself is closed to the public.
 *
 * For each sign-up it:
 *   1. quietly drops anything that filled in the hidden honeypot field,
 *   2. validates the name and email,
 *   3. checks the Cloudflare Turnstile token (proves a real browser sent it),
 *   4. inserts the row into Supabase using the secret key.
 *
 * Settings (Cloudflare dashboard → Workers & Pages → the Worker → Settings →
 * Variables and Secrets; for local development, a .dev.vars file):
 *   SUPABASE_URL          e.g. https://abcd1234.supabase.co
 *   SUPABASE_SECRET_KEY   the project's secret key (sb_secret_…) or legacy
 *                         service_role key. Add it as a Secret.
 *   TURNSTILE_SECRET_KEY  from the Turnstile widget. A Secret too.
 *   SUPABASE_TABLE        optional, defaults to "interest"
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function handleRegister(request, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY || !env.TURNSTILE_SECRET_KEY) {
    console.error("register: missing SUPABASE_URL, SUPABASE_SECRET_KEY or TURNSTILE_SECRET_KEY");
    return json({ error: "not_configured" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const honeypot = String(body.website ?? "");
  const token = String(body.turnstileToken ?? "");

  // People never see the honeypot field, so anything in it came from a bot.
  // Pretend it worked so the bot has no reason to try again.
  if (honeypot) return json({ ok: true });

  if (!name || name.length > MAX_NAME || email.length > MAX_EMAIL || !EMAIL.test(email)) {
    return json({ error: "invalid" }, 400);
  }

  // Ask Turnstile whether the token is genuine and unused.
  if (!token) return json({ error: "captcha" }, 403);
  const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: request.headers.get("CF-Connecting-IP") ?? "",
    }),
  });
  const outcome = await check.json().catch(() => ({ success: false }));
  if (!outcome.success) return json({ error: "captcha" }, 403);

  // Insert via Supabase's REST API. Secret keys (sb_secret_…) go in the
  // apikey header; the legacy service_role key is a JWT and also goes in
  // Authorization. "return=minimal" means we don't ask for the row back.
  const key = env.SUPABASE_SECRET_KEY;
  const headers = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;

  const table = env.SUPABASE_TABLE || "interest";
  const res = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, email }),
  });

  if (res.ok) return json({ ok: true });

  // A duplicate email breaks the table's unique index (Postgres code 23505).
  // Treat it as success, so the form never reveals who has already signed up.
  const detail = await res.json().catch(() => ({}));
  if (res.status === 409 || detail.code === "23505") return json({ ok: true });

  console.error("register: Supabase insert failed", res.status, detail);
  return json({ error: "server" }, 502);
}
