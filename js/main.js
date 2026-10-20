(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  const skyline = $("[data-skyline]");
  const stars = $("[data-stars]");
  if (skyline) window.HTT.buildSkyline(skyline);
  if (stars) window.HTT.buildStars(stars);
  window.HTT.fitAboveSkyline($(".interest"), $(".scene"));

  /* ---------------------------------------------------------------------
     Register your interest
     --------------------------------------------------------------------- */
  const form = $("[data-form]");
  if (!form) return;

  const rules = {
    name: (v) => (v ? "" : "Tell us your name."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "That email doesn’t look quite right."),
  };

  function setError(input, msg) {
    const field = input.closest(".field");
    field.classList.toggle("is-invalid", Boolean(msg));
    $(".field__error", field).textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  // Clear an error as soon as the field is edited.
  form.addEventListener("input", (e) => {
    if (e.target.closest(".field.is-invalid")) setError(e.target, "");
  });

  const submitLabel = $("[data-submit-label]", form);
  const submitText = submitLabel.textContent;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let firstInvalid = null;
    Object.entries(rules).forEach(([name, check]) => {
      const input = form.elements[name];
      const msg = check(input.value.trim());
      setError(input, msg);
      if (msg && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const submit = $("[data-submit]", form);
    submit.disabled = true;
    submitLabel.textContent = "Sending…";

    // Remember the first name so the thank-you page can greet them.
    try {
      sessionStorage.setItem("htt:name", form.elements.name.value.trim().split(/\s+/)[0]);
    } catch (_) { /* storage unavailable: the thank-you page falls back to a generic greeting */ }

    // TODO: send the name and email to the backend once it exists, e.g.
    //   await fetch("/api/interest", { method: "POST", body: new FormData(form) });
    setTimeout(() => { window.location.href = "thanks.html"; }, 450);
  });

  // Coming back via the browser's back button restores the page from cache;
  // make sure the button is usable again.
  window.addEventListener("pageshow", () => {
    $("[data-submit]", form).disabled = false;
    submitLabel.textContent = submitText;
  });
})();
