(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Greet them by name if we have it.
  let name = "";
  try { name = sessionStorage.getItem("htt:name") || ""; } catch (_) { /* no storage, no name */ }
  if (name) $("[data-greeting]").textContent = `Whey aye, ${name}!`;

  // The display switches over once the train has stopped (matches the CSS timings).
  const display = $("[data-display]");
  setTimeout(() => { display.textContent = "You’ve registered your interest"; }, reduceMotion ? 0 : 2900);
})();
