# Hack the Toon

Landing and registration site for **Hack the Toon**, a 24-hour student hackathon in Newcastle upon Tyne.

This is a first draft of the front end. It's plain HTML, CSS and JavaScript with no build step.

## Run it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly also works.

## Structure

```
index.html        All page content and sections
css/styles.css    Design tokens, layout and components
js/scenes.js      SVG illustrations: the night skyline and the Millennium Bridge crossing
js/main.js        Metro progress bar, departures board, scroll effects, registration form
assets/           Favicon
```

## The Newcastle touches

- **Metro line nav.** The bar fixed to the bottom of the page is a Tyne and Wear Metro-style line diagram. A two-car train moves along it as you scroll and stops at a station for each section: Jesmond, Haymarket, Monument, Central, Gateshead, Gateshead Stadium (the real order of the stops, crossing the river). The dot-matrix display shows the next stop. Click a station to jump to that section.
- **Hero skyline** at dusk: the Tyne Bridge, St James' Park, the lantern tower of St Nicholas Cathedral, Grey's Monument and the Castle Keep, with lit windows and reflections on the river.
- **Crossing the Tyne** (between Central and Gateshead, where the Metro crosses the river). It's dawn, around hour 20 of the hack. The Gateshead Millennium Bridge tilts open as you scroll, the sun rises, and a yacht passes under. BALTIC and the Sage/Glasshouse are on the Gateshead bank, the Tyne Bridge is upstream, and there are kittiwakes.
- **Timetable** as a dot-matrix departures board with a live clock.
- **Tracks** shown as coloured Metro lines.
- **Angel of the North** behind the registration form, which is at the Gateshead end of the line.
- **Tickets.** Registering prints a ticket.
- **Geordie words** (bait, champion, divvent, gan canny) have a dotted underline. Hover over or tab to one to see its translation.
- Headings use Zilla Slab, a nod to Margaret Calvert's slab-serif lettering for the Metro.

## Placeholders to replace

- Dates (27–28 Feb 2027), venue, capacity (300) and the schedule
- Track names and prize categories
- Sponsor logos and the contact email (`hello@example.com`)
- Code of conduct link
- **Form submission.** `js/main.js` validates the form, then shows the ticket without sending any data. Look for the `TODO` in the submit handler to connect it to a backend.
