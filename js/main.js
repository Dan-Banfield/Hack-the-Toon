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

  const formError = $("[data-form-error]", form);
  const submit = $("[data-submit]", form);

  // Messages for the errors /api/register can return.
  const failures = {
    invalid: "Please check your name and email.",
    captcha: "We couldn’t confirm you’re not a robot. Please try again.",
    default: "Something went wrong on our side. Please try again in a moment.",
    offline: "We couldn’t reach the server. Check your connection and try again.",
  };

  form.addEventListener("input", () => { formError.textContent = ""; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.textContent = "";

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

    // Turnstile puts its token in a hidden field once it has checked the
    // visitor, usually within a second or two of the page loading.
    const token = form.elements["cf-turnstile-response"]?.value || "";
    if (!token) {
      formError.textContent = "Just a moment, we’re checking you’re not a robot. Please try again in a second.";
      return;
    }

    submit.disabled = true;
    submitLabel.textContent = "Sending…";

    const name = form.elements.name.value.trim();
    let error = null;
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: form.elements.email.value.trim(),
          website: form.elements.website.value,
          turnstileToken: token,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error = failures[data.error] || failures.default;
      }
    } catch (_) {
      error = failures.offline;
    }

    if (error) {
      formError.textContent = error;
      submit.disabled = false;
      submitLabel.textContent = submitText;
      // Each Turnstile token can only be used once, so get a fresh one.
      if (window.turnstile) window.turnstile.reset();
      return;
    }

    // Remember the first name so the thank-you page can greet them.
    try {
      sessionStorage.setItem("htt:name", name.split(/\s+/)[0]);
    } catch (_) { /* storage unavailable: the thank-you page falls back to a generic greeting */ }

    window.location.href = "thanks.html";
  });

  // Coming back via the browser's back button restores the page from cache;
  // make sure the button is usable again.
  window.addEventListener("pageshow", () => {
    submit.disabled = false;
    submitLabel.textContent = submitText;
  });
})();
