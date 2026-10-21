/*
 * Brevo: the "We've received your interest" email, and the contact list.
 *
 * Called by register.js once Supabase has stored a new sign-up. Both steps are
 * optional and independent: with no BREVO_API_KEY nothing happens, with no
 * BREVO_TEMPLATE_ID no email is sent, and with no BREVO_LIST_ID nobody is
 * added to a list. A failure here is logged but never fails the sign-up,
 * which is already safely in Supabase.
 */
const API = "https://api.brevo.com/v3";

async function call(env, path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // Brevo explains errors in a { code, message } body, e.g. an unauthorised
    // IP address or a template that hasn't been activated
    const detail = await res.json().catch(() => ({}));
    throw new Error(`Brevo ${path} failed: ${res.status} ${detail.code ?? ""} ${detail.message ?? ""}`.trim());
  }
}

export async function welcome(env, { name, email }) {
  if (!env.BREVO_API_KEY) return;

  const [firstName, ...rest] = name.split(/\s+/);
  const tasks = [];

  // The confirmation email, from the template in email/interest-received.html
  const templateId = Number(env.BREVO_TEMPLATE_ID);
  if (templateId) {
    tasks.push(call(env, "/smtp/email", {
      templateId,
      to: [{ email, name }],
      params: { name, first_name: firstName, email },
    }));
  }

  // The contact list, for emailing everyone closer to the time
  const listId = Number(env.BREVO_LIST_ID);
  if (listId) {
    tasks.push(call(env, "/contacts", {
      email,
      attributes: { FIRSTNAME: firstName, LASTNAME: rest.join(" ") },
      listIds: [listId],
      updateEnabled: true,
    }));
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") console.error("brevo:", r.reason.message);
  }
}
