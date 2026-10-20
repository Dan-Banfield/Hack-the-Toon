(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.HTT.buildSkyline($("[data-skyline]"));
  window.HTT.buildStars($("[data-stars]"));
  window.HTT.fitAboveSkyline($(".thanks"), $(".scene"));

  // Greet them by name if we have it.
  let name = "";
  try { name = sessionStorage.getItem("htt:name") || ""; } catch (_) { /* no storage, no name */ }
  if (name) $("[data-greeting]").textContent = `Whey aye, ${name}!`;

  // The display switches over once the train has stopped (matches the CSS timings).
  const display = $("[data-display]");
  setTimeout(() => { display.textContent = "Hack the Toon · You’ve registered your interest"; }, reduceMotion ? 0 : 2900);

  // Fireworks over the Quayside.
  const sky = $("[data-fireworks]");
  if (!sky || reduceMotion) return;
  const colours = ["#ffc72c", "#5fae8c", "#f3ece0", "#f29b6b"];
  const bursts = [
    [640, 150, 0], [960, 100, 0.5], [800, 60, 1.0], [1220, 200, 1.5], [380, 210, 1.9],
  ];
  sky.innerHTML = bursts.map(([cx, cy, delay], i) => {
    const colour = colours[i % colours.length];
    const sparks = Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * 14, y1 = cy + Math.sin(a) * 14;
      const x2 = cx + Math.cos(a) * 62, y2 = cy + Math.sin(a) * 62;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }).join("");
    return `<g class="burst" stroke="${colour}" stroke-width="3" stroke-linecap="round" style="animation-delay:${3.2 + delay}s">${sparks}</g>`;
  }).join("");
})();
