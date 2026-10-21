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
src/worker.js               The site's Cloudflare Worker: serves the static files and routes /api/register
src/register.js             Checks and stores sign-ups (runs on Cloudflare, not in the browser)
wrangler.jsonc              Worker config (name, entry point, static files)
.assetsignore               Repo files that must not be served as part of the website
supabase/interest.sql       Database table and security settings
.dev.vars.example           Template for local secrets (copy to .dev.vars, which is git-ignored)
```

## How it behaves

- **Register your interest.** Name and email, validated in the browser, then sent to `/api/register`. Only once the server confirms does the browser go to `thanks.html`. Otherwise a message under the form explains what went wrong. A duplicate email is shown the normal thank-you page, so the form never reveals who has already signed up.
- **Thank you.** Rails sketch themselves across the sky and the Metrocar pulls in, drawn in white pencil. The dot-matrix display switches to "You've registered your interest", and a page torn from a notebook rises with the visitor's first name ("Whey aye, Alex!"). Then the wax seal is stamped onto it. With reduced motion turned on, the page shows the final state straight away.

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
