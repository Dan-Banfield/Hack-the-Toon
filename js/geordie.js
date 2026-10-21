(function () {
  "use strict";

  // The Geordie glosses open on focus. Phones don't move focus away when you
  // tap somewhere that isn't a link or a field, so close an open gloss on any
  // tap outside it, on a second tap on the word itself, or on Escape.
  const isGloss = (el) => el && el.classList && el.classList.contains("geordie");
  let tappedOpen = null;

  document.addEventListener("pointerdown", (e) => {
    const word = e.target.closest(".geordie");
    const open = document.activeElement;
    tappedOpen = word && word === open ? word : null;
    if (isGloss(open) && open !== word) open.blur();
  });

  document.addEventListener("click", (e) => {
    if (tappedOpen && e.target.closest(".geordie") === tappedOpen) tappedOpen.blur();
    tappedOpen = null;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isGloss(document.activeElement)) document.activeElement.blur();
  });
})();
