(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let name = "";
  try { name = sessionStorage.getItem("htt:name") || ""; } catch (_) { }
  if (name) $("[data-greeting]").textContent = `Whey aye, ${name}!`;

  const display = $("[data-display]");
  setTimeout(() => { display.textContent = "You’ve registered your interest"; }, reduceMotion ? 0 : 2900);
})();
