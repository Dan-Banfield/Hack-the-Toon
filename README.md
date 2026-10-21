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
js/geordie.js     Both pages: closes a Geordie translation when you tap elsewhere (phones don't by themselves)
assets/img/       Web-sized WebP copies of the commissioned paintings (what the site serves)
assets/Images/    Full-size original PNGs (kept for reference, not deployed; see .assetsignore)
assets/texture/   The watercolour the page is painted with: paper grain, clouds, sun, river, brush stroke
assets/texture/src/  SVG sources of the large textures, which the site serves as WebP (not deployed)
assets/favicon*   Favicons and Apple touch icon, made from the wax seal
assets/email/     PNG/JPG copies of the art for emails (email clients can't rely on WebP)
email/            Email templates for Brevo, and preview.py to view them locally (not deployed)
src/worker.js               The site's Cloudflare Worker: serves the static files and routes /api/register
src/register.js             Checks and stores sign-ups (runs on Cloudflare, not in the browser)
src/brevo.js                Sends the confirmation email and adds sign-ups to the Brevo list
wrangler.jsonc              Worker config (name, entry point, static files)
.assetsignore               Repo files that must not be served as part of the website
supabase/interest.sql       Database table and security settings
.dev.vars.example           Template for local secrets (copy to .dev.vars, which is git-ignored)
```

## How it behaves

- **Register your interest.** Name and email, validated in the browser, then sent to `/api/register`. Only once the server confirms does the browser go to `thanks.html`. Otherwise a message under the form explains what went wrong. A duplicate email is shown the normal thank-you page, so the form never reveals who has already signed up. New sign-ups are also sent a confirmation email through Brevo (see below).
- **Thank you.** Rails sketch themselves across the sky and the Metrocar pulls in, drawn in white pencil. The dot-matrix display switches to "You've registered your interest", and a page torn from a notebook rises with the visitor's first name ("Whey aye, Alex!"). Then the wax seal is stamped onto it. With reduced motion turned on, the page shows the final state straight away.

## Sign-ups: how they're stored securely

```
Browser ──POST /api/register──▶ Worker (Cloudflare) ──secret key──▶ Supabase table
         name, email,            honeypot · validation ·                    closed to the public
         Turnstile token         Turnstile check                            (RLS, no policies)
                                        │
                                        └── new sign-ups only ──API key──▶ Brevo: confirmation email,
                                                                           contact list
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

## Confirmation email (Brevo)

When someone registers, the Worker saves them in Supabase as before. For a **new** sign-up it then asks [Brevo](https://www.brevo.com) to:

- send the "We've received your interest" email (`email/interest-received.html`), and
- add them to a Brevo contact list, so you can email everyone in one go when tickets are out.

Both happen after the visitor has seen the thank-you page, so the form never waits on Brevo, and a Brevo problem never loses a sign-up: it's already in Supabase, and the error appears in the Worker's logs. A repeat sign-up with the same email sends nothing, so the form can't be used to flood someone's inbox.

Supabase stays the record of who signed up. The Worker passes Brevo the row's `name` and `email`, plus the first word of the name for the greeting.

### Setting up Brevo

1. **Account.** Sign up at brevo.com (the free plan sends up to 300 emails a day). Brevo may ask you to complete your profile, or review the account, before it will send.
2. **Authenticate the domain**, so the emails come from `@hackthetoon.com` and don't land in spam. In Brevo, go to Settings → Senders, domains & dedicated IPs → Domains → Add a domain, and enter `hackthetoon.com`.
   - If Brevo offers to set up the records with Cloudflare automatically, use that.
   - Otherwise add each record it shows (a `brevo-code` TXT record, the DKIM records and a DMARC record) in Cloudflare → `hackthetoon.com` → DNS → Records.
   - Set CNAME records to **DNS only** (grey cloud), not Proxied.
   - If the domain already has a `_dmarc` record, keep that one rather than adding a second.
   - Back in Brevo, press Authenticate. DNS changes can take a few minutes.
3. **A sender.** Under Senders, add a sender such as **Hack the Toon** `<hello@hackthetoon.com>`.
   - To read replies there, Cloudflare → `hackthetoon.com` → Email → Email Routing can forward that address to your own inbox for free.
   - Or use the template's *Reply-to* to send replies elsewhere.
4. **The template.** Go to Transactional (Brevo's product menu) → Templates → New template.
   - Name: *Interest received*.
   - Subject: `Whey aye! We've got your interest in Hack the Toon`.
   - From: the sender above. Reply-to: an inbox you read.
   - Under the design step, choose **Paste your code** and paste the whole of `email/interest-received.html`.
   - Save, then make sure the template is **Active**. An inactive template can't be sent.
   - Note its **ID**, the number shown as `#3` or similar in the template list.
5. **The list.** Under Contacts → Lists, create a list (e.g. *Hack the Toon: interest*) and note its **ID**.
6. **An API key.** Go to your account menu (top right) → SMTP & API → API keys → Generate a new API key. Name it e.g. `hack-the-toon worker`. Copy it now, because Brevo only shows it once.
7. **Allow calls from Cloudflare.** Brevo can block API calls from IP addresses it doesn't recognise, and Cloudflare Workers don't have fixed addresses. In Settings → Security → Authorised IPs, turn the blocking off. Otherwise every email fails, and the Worker logs say `unrecognised IP address`.

### Connecting it to the site

8. **Worker variables.** In Cloudflare → Workers & Pages → `hack-the-toon` → Settings → Variables and Secrets, add:
   - `BREVO_API_KEY`, type **Secret**: the key from step 6.
   - `BREVO_TEMPLATE_ID`, type Text: the template ID from step 4, just the number.
   - `BREVO_LIST_ID`, type Text: the list ID from step 5. Leave it out to send emails without building a list.

   With no `BREVO_API_KEY`, the site behaves exactly as before. `.dev.vars` leaves Brevo out by default, so local testing doesn't send real emails.
9. **Deploy** by pushing as usual. This also publishes `assets/email/`, which the email loads its images from. Check that https://hackthetoon.com/assets/email/seal.png opens.
10. **Test** by registering on the live site with an email address you haven't used before. A repeat address deliberately sends nothing; to reuse one, delete its row in Supabase first.
    - The email should arrive within a minute.
    - Brevo → Transactional → Logs shows it being sent and delivered.
    - The person appears in your Brevo list.
    - If nothing arrives, look in Cloudflare → the Worker → Logs for lines starting `brevo:`. They carry Brevo's own explanation, such as an inactive template, a wrong ID or a blocked IP.

### People who signed up before this

The Worker only emails new sign-ups. To bring earlier ones into Brevo:
- In Supabase's Table Editor, open `interest` and choose Export → CSV.
- In Brevo, go to Contacts → Import contacts, upload the CSV, and map `email` to EMAIL and `name` to FIRSTNAME. Add them to the same list.
- If you'd like them to get the welcome email too, send a one-off Brevo campaign to that list using the same HTML. In a campaign, the template greets them by `contact.FIRSTNAME`.

### Editing the email

The template uses Brevo's template language, with variables that match the Supabase `interest` table:

| Variable | Value |
| --- | --- |
| `params.name` | the `name` column, as typed on the form |
| `params.first_name` | the first word of the name, as the thank-you page uses it ("Whey aye, Dan!") |
| `params.email` | the `email` column (shown in the small print) |

With no name, the greeting is just "Whey aye!". In a campaign, the template uses the contact's `FIRSTNAME`. After editing `email/interest-received.html`, paste it into the Brevo template again.

Opened directly in a browser, the template shows raw `{% … %}` tags (Brevo fills those in when it sends) and broken images (until the site is deployed). To see it as it will arrive, build a local preview with sample values and the local images:

```sh
python3 email/preview.py                      # writes email/interest-received.preview.html
python3 email/preview.py --name "Alex Smith"  # another sample name; --name "" for no name
```

## Design: a bright day on the Tyne

The page is painted in the same medium as the commissions. Both pages are one watercolour of the Tyne on a clear summer's day: a deep cobalt sky with clouds drifting slowly across it, paling to haze at the horizon, with the river at the foot of the page glinting in the sun. The sun sits behind the magpie. The words sit on sheets of watercolour paper, and Metro yellow is kept for the things you press.

- **Palette** (the custom properties at the top of `css/styles.css`): cobalt and cerulean for the sky, sunlit amber, cream paper, ultramarine fountain-pen ink and Metro yellow. `--zenith` is the colour at the very top and bottom of the page. It matches `theme-color` in both HTML files, so phones colour their system bars to match the sky.
- **Texture** (`assets/texture/`): the wash is layered with blend modes. Drifts of pigment, blooms with hard dried edges, the grain of cold-pressed paper and ultramarine's granulation all sit over a CSS gradient for the sky. The clouds are one layer that slides sideways, so the wash is never repainted.
- **Small textures are SVG filters** (paper, granulation, sun, brush stroke, and the torn edge of the form, which is inline in the CSS because a mask file that fails to load hides the whole sheet), drawn by the browser at any size. The page-sized ones (blooms, drift, river, clouds) would be slow to draw that way on phones, so the site serves WebP renders of them. Their sources are in `assets/texture/src/`. After editing one, re-render it with headless Chrome and convert it with ImageMagick, for example:

  ```sh
  printf '<style>body{margin:0}img{width:1600px;height:1000px}</style><img src="blooms.svg">' > assets/texture/src/render.html
  chrome --headless=new --default-background-color=00000000 --window-size=1600,1000 \
    --screenshot=/tmp/blooms.png "file://$PWD/assets/texture/src/render.html"
  magick /tmp/blooms.png -quality 70 -define webp:alpha-quality=60 assets/texture/blooms.webp
  rm assets/texture/src/render.html
  ```

  Render `drift` at 640×400, `river` at 800×100 and `clouds` at 1600×600. They are stretched to fit the page.

## Artwork

All the illustrations are commissioned paintings:

- **Register your interest:** the Tyne Bridge (with the High Level and Swing bridges behind) under the headline, Grey's Monument in the bottom-right corner, and a magpie perched on the form, standing against the sun.
- **Thank you:** the Metrocar (the pencil drawing, inverted into white pencil against the deep blue sky), the university arches in the bottom-left corner, the Angel of the North bottom-right, and the wax seal stamped onto the note.
- The Monument and the arches are painted to run off their canvas, so they sit flush against the page corners, and the CSS fades their other cut edge into the sky. A haze of light sits behind the arches so the pencil sketch above them stays visible against the blue.

To add or update a painting, put the original in `assets/Images/` and export a web copy into `assets/img/`. For example, with ImageMagick:

```sh
magick assets/Images/tyne-bridge.png -trim +repage -resize 1600x -quality 80 assets/img/tyne-bridge.webp
```

## Newcastle touches

- The whole page is the Tyne on a summer's day, with the river along the bottom.
- Metro yellow buttons, and a dot-matrix display in the style of the Metro's passenger screens.
- Geordie words (bait, gan canny) have a dotted underline. Hover over or tab to one to see its translation.
- Set in Arvo, a geometric slab serif close to Margaret Calvert's lettering for the Metro. The dot-matrix displays use DotGothic16.

## History

The first draft was a full multi-section site: a Metro line navigation bar, departures-board timetable, tracks, FAQ, a Millennium Bridge that tilts on scroll, and a full registration form with a printed ticket. It's in the initial commit (`de34bb7`) if it's needed again.
