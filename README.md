# Hack the Toon

Website for **Hack the Toon**, a 24-hour student hackathon in Newcastle upon Tyne.

Right now it's a single "register your interest" page and a thank-you page. It's plain HTML, CSS and JavaScript with no build step.

## Run it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Structure

```
index.html        Register your interest: name and email
thanks.html       Animated thank-you page shown after signing up
css/styles.css    Design tokens, layout and components for both pages
js/scenes.js      SVG skyline (Millennium Bridge, BALTIC, the Sage, St James' Park, cathedral, Grey's Monument, Castle Keep) and stars
js/main.js        Form validation and redirect to the thank-you page
js/thanks.js      Thank-you page: greeting, Metro display text, fireworks
assets/           Favicon
```

## How it behaves

- **Register your interest.** Name and email, validated in the browser. On submit, the first name is saved to `sessionStorage` and the browser goes to `thanks.html`. **Nothing is sent anywhere yet.** Look for the `TODO` in `js/main.js` to connect a backend.
- **Thank you.** A Metro train pulls into a "Hack the Toon" station and the doors open. The dot-matrix display switches to "You're on the list", the page greets the visitor by first name ("Whey aye, Alex!"), and fireworks go off over the Quayside. With reduced motion turned on, the page shows the final state straight away.

## Newcastle touches

- Night-time skyline with the Gateshead Millennium Bridge lit in its rainbow LEDs. The colours slowly cycle and reflect in the Tyne. On wide screens the skyline is mirrored so the bridge sits under the headline rather than behind the form.
- The buildings are a mix of Tyneside terraces with chimney pots, Grainger Town fronts with cornices and domes, mansard roofs with dormers, stepped Quayside gables, saw-tooth warehouses and towers, plus BALTIC at the end of the bridge and the Sage behind.
- Metro yellow, a dot-matrix display in the style of the Metro's passenger screens, and a platform-style station sign.
- Geordie words (bait, gan canny) have a dotted underline. Hover over or tab to one to see its translation.
- Set in Arvo, a geometric slab serif close to Margaret Calvert's lettering for the Metro. The dot-matrix displays use DotGothic16.

## History

The first draft was a full multi-section site: a Metro line navigation bar, departures-board timetable, tracks, FAQ, a Millennium Bridge that tilts on scroll, and a full registration form with a printed ticket. It's in the initial commit (`de34bb7`) if it's needed again.
