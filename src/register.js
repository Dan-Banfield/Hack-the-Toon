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
    console.error("register: missing secrets");
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

  if (honeypot) return json({ ok: true });

  if (!name || name.length > MAX_NAME || email.length > MAX_EMAIL || !EMAIL.test(email)) {
    return json({ error: "invalid" }, 400);
  }

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

  // Accept SUPABASE_URL with or without a path (Supabase's settings show it
  // as ".../rest/v1/"): only the https://<project>.supabase.co part is used.
  let origin;
  try {
    origin = new URL(env.SUPABASE_URL.trim()).origin;
  } catch {
    console.error("register: SUPABASE_URL is not a valid URL");
    return json({ error: "not_configured" }, 500);
  }
  // Tables live in the public schema, so a "public." prefix isn't needed.
  const table = (env.SUPABASE_TABLE).trim().replace(/^public\./, "");
  const res = await fetch(`${origin}/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, email }),
  });

  if (res.ok) return json({ ok: true });

  // A duplicate email breaks the table's unique index (Postgres code 23505).
  // Treat it as success, so the form never reveals who has already signed up.
  const detail = await res.json().catch(() => ({}));
  if (res.status === 409 || detail.code === "23505") return json({ ok: true });

  console.error("register: Supabase insert failed", res.status);
  return json({ error: "server" }, 502);
}
