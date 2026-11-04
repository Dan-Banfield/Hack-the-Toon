const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function handleRegister(request, env, ctx) {
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

  const key = env.SUPABASE_SECRET_KEY;
  const headers = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;

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

  if (res.ok) {
    // A new sign-up: send the confirmation email and add them to the Brevo
    // list. waitUntil lets that finish after the visitor has their reply, so
    // the form never waits on Brevo (and a Brevo outage can't break it).
    // ctx.waitUntil(welcome(env, { name, email }));
    return json({ ok: true });
  }

  // A duplicate email breaks the table's unique index (Postgres code 23505).
  // Treat it as success, so the form never reveals who has already signed up.
  // No second email is sent, so the form can't be used to spam an address.
  const detail = await res.json().catch(() => ({}));
  if (res.status === 409 || detail.code === "23505") return json({ ok: true });

  console.error("register: Supabase insert failed", res.status);
  return json({ error: "server" }, 502);
}
