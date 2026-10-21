/*
 * The site's Cloudflare Worker.
 *
 * Cloudflare serves the static files (index.html, css/, js/, …) directly.
 * Requests that don't match a file come here: the sign-up endpoint is
 * handled in code, and anything else falls back to the static files (which
 * return the usual 404).
 */
import { handleRegister } from "./register.js";

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/register") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
      }
      return handleRegister(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};
