(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------------------------------------------------------------------
     Scenes
     --------------------------------------------------------------------- */
  const skyline = $("[data-skyline]");
  const stars = $("[data-stars]");
  const crossingScene = $("[data-crossing-scene]");
  if (skyline) window.HTT.buildSkyline(skyline);
  if (stars) window.HTT.buildStars(stars);
  const updateCrossing = crossingScene ? window.HTT.buildCrossing(crossingScene) : null;
  const farLayer = skyline && $(".layer-far", skyline);

  /* ---------------------------------------------------------------------
     Metro line: one stop per section, train follows the scroll position
     --------------------------------------------------------------------- */
  const header = $("[data-header]");
  const hero = $(".hero");
  const crossing = $("[data-crossing]");
  const track = $("[data-metro-track]");
  const train = $("[data-metro-train]");
  const status = $("[data-metro-status]");
  const stationList = $("[data-metro-stations]");
  const sections = $$("[data-station]");

  const stops = sections.map((section, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "metro__stop";
    btn.setAttribute("aria-label", `${section.dataset.label} (${section.dataset.station})`);
    btn.innerHTML = `<span class="metro__stop-label">${section.dataset.station}</span>`;
    btn.addEventListener("click", () => {
      const top = i === 0 ? 0 : sectionTop(section);
      window.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
    li.appendChild(btn);
    stationList.appendChild(li);
    return { section, li, btn, name: section.dataset.station, label: section.dataset.label };
  });

  // Each stop has an arrival and a departure scroll position, so the train
  // dwells at a station while you read the top of that section.
  let arrive = [];
  let depart = [];
  let trackW = 0;
  let pad = 0;
  let lastStatus = "";

  const sectionTop = (el) => el.getBoundingClientRect().top + window.scrollY;

  function layout() {
    const vh = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - vh;
    const tops = stops.map(({ section }, i) => (i === 0 ? 0 : clamp(sectionTop(section), 0, maxScroll)));

    arrive = tops.map((t, i) => (i === 0 ? 0 : Math.max(0, t - vh * 0.3)));
    depart = tops.map((t, i) => (i === 0 ? vh * 0.2 : t + vh * 0.3));
    for (let i = 0; i < stops.length - 1; i++) {
      const mid = (depart[i] + arrive[i + 1]) / 2;
      if (depart[i] > arrive[i + 1]) depart[i] = arrive[i + 1] = mid;
    }
    // The last stop is reached by the bottom of the page at the latest.
    arrive[stops.length - 1] = Math.min(arrive[stops.length - 1], maxScroll);

    trackW = track.clientWidth;
    pad = train.getBoundingClientRect().width / 2;
    stops.forEach((stop, i) => {
      stop.li.style.left = `${pad + (i / (stops.length - 1)) * (trackW - 2 * pad)}px`;
    });
    update();
  }

  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

  // Position along the line, in stops (0 = first stop, n-1 = terminus).
  function progressAlongLine(y) {
    const n = stops.length;
    for (let i = 0; i < n - 1; i++) {
      if (y <= depart[i]) return i;
      if (y < arrive[i + 1]) return i + ease((y - depart[i]) / (arrive[i + 1] - depart[i]));
    }
    return n - 1;
  }

  function updateMetro(y) {
    const n = stops.length;
    const f = progressAlongLine(y);
    const x = pad + (f / (n - 1)) * (trackW - 2 * pad);
    train.style.transform = `translateX(${x - pad}px)`;

    const atStop = Number.isInteger(f);
    stops.forEach((stop, i) => {
      stop.btn.classList.toggle("is-passed", i <= f);
      stop.btn.classList.toggle("is-current", atStop && i === f);
    });

    const compact = window.innerWidth < 720;
    let text;
    if (atStop && compact) text = stops[f].name;
    else if (atStop && f === n - 1) text = `${stops[f].name} · Terminus`;
    else if (atStop) text = `${stops[f].name} · ${stops[f].label}`;
    else text = `${compact ? "Next" : "Next stop"}: ${stops[Math.ceil(f)].name}`;
    if (text !== lastStatus) {
      status.textContent = text;
      lastStatus = text;
    }
  }

  /* ---------------------------------------------------------------------
     Scroll-driven bits
     --------------------------------------------------------------------- */
  let ticking = false;
  function update() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    header.classList.toggle("is-solid", y > hero.offsetHeight - 80);
    updateMetro(y);

    if (farLayer && y < hero.offsetHeight) {
      farLayer.style.transform = `translateY(${y * 0.12}px)`;
    }

    if (updateCrossing) {
      const rect = crossing.getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) {
        updateCrossing(clamp(-rect.top / (rect.height - vh), 0, 1));
      }
    }
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener("resize", layout);
  window.addEventListener("load", layout);
  if (updateCrossing) updateCrossing(0);
  if (document.fonts) document.fonts.ready.then(layout);
  layout();

  /* ---------------------------------------------------------------------
     Departures board: day tabs + live clock
     --------------------------------------------------------------------- */
  const board = $("[data-board]");
  if (board) {
    const tabs = $$('[role="tab"]', board);
    $$(".board__rows", board).forEach((list) => {
      $$("li", list).forEach((li, i) => li.style.setProperty("--i", i));
    });

    function select(tab) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      layout();
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        select(next);
      });
    });

    const clock = $("[data-clock]", board);
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------------------------------------------------------------------
     Registration form
     --------------------------------------------------------------------- */
  const form = $("[data-form]");
  if (!form) return;

  const messages = {
    firstName: "Tell us your first name.",
    lastName: "Tell us your last name.",
    email: "That email doesn’t look quite right.",
    university: "Which university are you at?",
    level: "Pick your level of study.",
    experience: "Pick one, even if it’s zero.",
    tshirt: "Pick a size so we can sort your hoodie.",
  };

  function fieldOf(el) { return el.closest(".field"); }

  function setError(name, msg) {
    const el = form.elements[name];
    const field = fieldOf(el.length && !el.tagName ? el[0] : el);
    field.classList.toggle("is-invalid", Boolean(msg));
    $(".field__error", field).textContent = msg || "";
  }

  function validate() {
    const data = new FormData(form);
    const errors = {};
    ["firstName", "lastName", "university"].forEach((n) => {
      if (!String(data.get(n) || "").trim()) errors[n] = messages[n];
    });
    const email = String(data.get("email") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = messages.email;
    if (!data.get("level")) errors.level = messages.level;
    if (!data.get("experience")) errors.experience = messages.experience;
    if (!data.get("tshirt")) errors.tshirt = messages.tshirt;

    Object.keys(messages).forEach((n) => setError(n, errors[n]));

    const checksError = $("[data-checks-error]", form);
    const missing = ["conduct", "age"].filter((n) => !form.elements[n].checked);
    checksError.textContent = missing.length ? "Please tick the code of conduct and age boxes." : "";

    return { ok: !Object.keys(errors).length && !missing.length, errors, missing };
  }

  // Clear an error as soon as the field is fixed.
  form.addEventListener("input", (e) => {
    const field = fieldOf(e.target);
    if (field && field.classList.contains("is-invalid")) {
      field.classList.remove("is-invalid");
      $(".field__error", field).textContent = "";
    }
    if (e.target.name === "conduct" || e.target.name === "age") $("[data-checks-error]", form).textContent = "";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const result = validate();
    if (!result.ok) {
      const first = Object.keys(result.errors)[0] || result.missing[0];
      const el = form.elements[first];
      (el.length && !el.tagName ? el[0] : el).focus();
      return;
    }

    const submit = $("[data-submit]", form);
    submit.disabled = true;
    $("[data-submit-label]", form).textContent = "Printing your ticket…";

    // TODO: POST the registration to the backend once it exists, e.g.
    //   await fetch("/api/register", { method: "POST", body: new FormData(form) });
    setTimeout(() => showTicket(new FormData(form)), 900);
  });

  function showTicket(data) {
    const slot = $("[data-ticket]");
    const first = String(data.get("firstName")).trim();
    const last = String(data.get("lastName")).trim();
    const n = crypto.getRandomValues(new Uint16Array(1))[0] % 10000;

    $("[data-ticket-no]", slot).textContent = `HTT-${String(n).padStart(4, "0")}`;
    $("[data-ticket-name]", slot).textContent = `${first} ${last}`;
    $("[data-ticket-first]", slot).textContent = first;

    // A unique-looking barcode for each ticket.
    const bars = [];
    let x = 0;
    while (x < 100) {
      const w = 0.6 + Math.random() * 1.6;
      const gap = 0.5 + Math.random() * 1.4;
      bars.push(`var(--ink) ${x.toFixed(1)}% ${(x + w).toFixed(1)}%`, `transparent ${(x + w).toFixed(1)}% ${(x + w + gap).toFixed(1)}%`);
      x += w + gap;
    }
    $("[data-barcode]", slot).style.background = `linear-gradient(90deg, ${bars.join(",")})`;

    form.hidden = true;
    slot.hidden = false;
    $(".ticket", slot).focus({ preventScroll: true });
    slot.scrollIntoView({ block: "center", behavior: "smooth" });
    layout();
  }
})();
