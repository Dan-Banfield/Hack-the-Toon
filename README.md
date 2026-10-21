# Hack the Toon

Website for **Hack the Toon**, a 24-hour student hackathon in Newcastle upon Tyne.

Right now it's a single "register your interest" page and a thank-you page. It's plain HTML, CSS and JavaScript with no build step.

## Run it locally

The pages work from any static server, but the sign-up endpoint (`/api/register`) only runs under Cloudflare's tooling:

```sh
# Static pages only (submitting the form shows an error, as there is no /api/register)
python3 -m http.server 8000

# The whole site including the sign-up endpoint, as Cloudflare runs it (needs Node.js/npm)
cp .dev.vars.example .dev.vars   # then fill in the values
npx wrangler dev
```

## Structure

```
index.html        Register your interest: name and email
thanks.html       Animated thank-you page shown after signing up
css/styles.css    Design tokens, layout and components for both pages
js/main.js        Form validation, sending the sign-up to /api/register, redirect to the thank-you page
js/thanks.js      Thank-you page: greeting and Metro display text
assets/img/       Web-sized WebP copies of the commissioned paintings (what the site serves)
assets/Images/    Full-size original PNGs (kept for reference, not deployed; see .assetsignore)
assets/favicon*   Favicons and Apple touch icon, made from the wax seal
src/worker.js               The site's Cloudflare Worker: serves the static files and routes /api/register
src/register.js             Checks and stores sign-ups (runs on Cloudflare, not in the browser)
wrangler.jsonc              Worker config (name, entry point, static files)
.assetsignore               Repo files that must not be served as part of the website
supabase/interest.sql       Database table and security settings
.dev.vars.example           Template for local secrets (copy to .dev.vars, which is git-ignored)
```

## How it behaves

- **Register your interest.** Name and email, validated in the browser, then sent to `/api/register`. Only once the server confirms does the browser go to `thanks.html`. Otherwise a message under the form explains what went wrong. A duplicate email is shown the normal thank-you page, so the form never reveals who has already signed up.
- **Thank you.** Pencil rails sketch themselves across the page and the pencil Metrocar pulls in. The dot-matrix display switches to "You've registered your interest", and a note card rises with the visitor's first name ("Whey aye, Alex!"). Then the wax seal is stamped onto the card. With reduced motion turned on, the page shows the final state straight away.

## Sign-ups: how they're stored securely

```
Browser ──POST /api/register──▶ Worker (Cloudflare) ──secret key──▶ Supabase table
         name, email,            honeypot · validation ·                    closed to the public
         Turnstile token         Turnstile check                            (RLS, no policies)
```

- The Supabase table accepts nothing from the public. Only the Worker can write to it, using the project's secret key, which is stored as an encrypted Cloudflare secret and never sent to browsers.
- **Cloudflare Turnstile** (an invisible CAPTCHA) proves each sign-up came from a real browser, and a hidden **honeypot** field catches simple bots.
- The database also enforces lengths, email format and one sign-up per email.

### Setup checklist

1. **Supabase** (your friend): run `supabase/interest.sql` in the SQL Editor, or adapt it to the existing table. Note the project URL and the **secret** key (Project Settings → API Keys).
2. **Turnstile**: in the Cloudflare dashboard → Turnstile, add a widget for `hackthetoon.com` (Managed mode). Put its **site key** in `index.html`, replacing the test key `1x00000000000000000000AA`. Keep its **secret key** for the next step.
3. **Worker settings**: check `name` in `wrangler.jsonc` matches the Worker's name in the dashboard, then deploy. Once the Worker has code, Workers & Pages → the Worker → Settings → Variables and Secrets lets you add `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `TURNSTILE_SECRET_KEY`, each as type **Secret**. If the table isn't called `interest`, add `SUPABASE_TABLE` too.
4. **Rate limit** (recommended): Cloudflare dashboard → your domain → Security → WAF → Rate limiting rules. Add a rule for requests where the URI path equals `/api/register`, e.g. 5 requests per 10 seconds per IP, action Block.
5. **Deploy**: pushing to Git deploys as before. In the Worker's Settings → Build, the deploy command should be `npx wrangler deploy`, which reads `wrangler.jsonc`.
6. **Test on the live site**: a sign-up appears in the Supabase table, the same email again still says thanks without adding a second row, and the dashboard's function logs show no errors.

## Artwork

All the illustrations are commissioned paintings, on a warm sketchbook-paper background:

- **Register your interest:** the Tyne Bridge (with the High Level and Swing bridges behind) under the headline, Grey's Monument in the bottom-right corner, and a magpie perched on the form.
- **Thank you:** the pencil Metrocar, the university arches in the bottom-left corner, the Angel of the North bottom-right, and the wax seal stamped onto the note.
- The Monument and the arches are painted to run off their canvas, so they sit flush against the page corners, and the CSS fades their other cut edge into the paper.

To add or update a painting, put the original in `assets/Images/` and export a web copy into `assets/img/`. For example, with ImageMagick:

```sh
magick assets/Images/tyne-bridge.png -trim +repage -resize 1600x -quality 80 assets/img/tyne-bridge.webp
```

## Newcastle touches

- Metro yellow buttons, and a dot-matrix display in the style of the Metro's passenger screens.
- Geordie words (bait, gan canny) have a dotted underline. Hover over or tab to one to see its translation.
- Set in Arvo, a geometric slab serif close to Margaret Calvert's lettering for the Metro. The dot-matrix displays use DotGothic16.

## History

The first draft was a full multi-section site: a Metro line navigation bar, departures-board timetable, tracks, FAQ, a Millennium Bridge that tilts on scroll, and a full registration form with a printed ticket. It's in the initial commit (`de34bb7`) if it's needed again.
