/*
 * Illustrated scenes, drawn as SVG at runtime so they stay crisp and are
 * easy to tweak: Newcastle's skyline at night with the Millennium Bridge
 * lit up, and a starry sky.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  // Small seeded RNG so the skyline is the same on every visit.
  function rng(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const r1 = (n) => Math.round(n * 10) / 10;

  /* ---------------------------------------------------------------------
     Landmarks. Each returns SVG markup standing on baseline `b`.
     --------------------------------------------------------------------- */

  // Grey's Monument: a slender column with Earl Grey on top.
  function greysMonument(cx, b, s = 1) {
    const p = (n) => r1(n * s);
    return `
      <rect x="${r1(cx - p(16))}" y="${r1(b - p(34))}" width="${p(32)}" height="${p(34)}"/>
      <rect x="${r1(cx - p(6))}" y="${r1(b - p(196))}" width="${p(12)}" height="${p(164)}"/>
      <rect x="${r1(cx - p(11))}" y="${r1(b - p(202))}" width="${p(22)}" height="${p(7)}"/>
      <rect x="${r1(cx - p(4))}" y="${r1(b - p(218))}" width="${p(8)}" height="${p(17)}"/>
      <circle cx="${cx}" cy="${r1(b - p(222))}" r="${p(3.6)}"/>`;
  }

  // St Nicholas Cathedral: square tower crowned by its lantern of flying buttresses.
  function cathedral(cx, b, s = 1) {
    const p = (n) => r1(n * s);
    const top = b - p(150);
    const w = p(22);
    return `
      <rect x="${r1(cx - w)}" y="${r1(top)}" width="${r1(w * 2)}" height="${p(150)}"/>
      <path d="M${r1(cx - w)} ${r1(top)} Q${r1(cx - w * 0.6)} ${r1(top - p(34))} ${cx} ${r1(top - p(34))}
               Q${r1(cx + w * 0.6)} ${r1(top - p(34))} ${r1(cx + w)} ${r1(top)}"
            fill="none" stroke="currentColor" stroke-width="${p(4)}"/>
      <rect x="${r1(cx - p(6))}" y="${r1(top - p(52))}" width="${p(12)}" height="${p(22)}"/>
      <path d="M${r1(cx - p(5))} ${r1(top - p(52))} L${cx} ${r1(top - p(82))} L${r1(cx + p(5))} ${r1(top - p(52))}Z"/>
      ${[-1, -0.33, 0.33, 1].map((k) => {
        const x = cx + k * w;
        return `<path d="M${r1(x - p(3))} ${r1(top)} L${r1(x)} ${r1(top - p(22))} L${r1(x + p(3))} ${r1(top)}Z"/>`;
      }).join("")}`;
  }

  // Castle Keep: the castle that gave the "New Castle" its name.
  function castleKeep(x, b, s = 1) {
    const p = (n) => r1(n * s);
    const w = p(64), h = p(82);
    let crenels = "";
    for (let i = 0; i < 7; i++) crenels += `<rect x="${r1(x + p(4) + i * p(9))}" y="${r1(b - h - p(6))}" width="${p(5)}" height="${p(6)}"/>`;
    return `
      <rect x="${x}" y="${r1(b - h)}" width="${w}" height="${h}"/>
      <rect x="${r1(x - p(4))}" y="${r1(b - h - p(14))}" width="${p(12)}" height="${r1(h + p(14))}"/>
      <rect x="${r1(x + w - p(8))}" y="${r1(b - h - p(14))}" width="${p(12)}" height="${r1(h + p(14))}"/>
      ${crenels}`;
  }

  // St James' Park: famously lopsided, with one stand towering over the other.
  function stJamesPark(x, b, s = 1) {
    const p = (n) => r1(n * s);
    const body = `M${x} ${b} V${r1(b - p(124))} L${r1(x + p(14))} ${r1(b - p(148))} H${r1(x + p(182))}
      L${r1(x + p(190))} ${r1(b - p(126))} V${r1(b - p(92))} L${r1(x + p(200))} ${r1(b - p(98))} H${r1(x + p(268))} V${b} Z`;
    let trusses = "";
    for (let i = 0; i < 8; i++) {
      const tx = x + p(22) + i * p(21);
      trusses += `<path d="M${r1(tx)} ${r1(b - p(146))} L${r1(tx + p(10))} ${r1(b - p(128))}" />`;
    }
    return `<path d="${body}"/><g class="truss" fill="none" stroke-width="${p(1.6)}">${trusses}</g>`;
  }

  // BALTIC: the old flour mill turned art gallery, at the Gateshead end of
  // the Millennium Bridge. A tall brick box with corner towers and slim windows.
  function baltic(x, b, s = 1) {
    const p = (n) => r1(n * s);
    const w = p(96), h = p(150);
    let slits = "";
    for (let i = 0; i < 5; i++) {
      slits += `<rect class="win" x="${r1(x + p(20) + i * p(14))}" y="${r1(b - h + p(22))}" width="${p(3)}" height="${r1(h - p(40))}" opacity=".35"/>`;
    }
    return {
      shape: `
        <rect x="${x}" y="${r1(b - h)}" width="${w}" height="${h}"/>
        <rect x="${r1(x - p(4))}" y="${r1(b - h - p(10))}" width="${p(14)}" height="${r1(h + p(10))}"/>
        <rect x="${r1(x + w - p(10))}" y="${r1(b - h - p(10))}" width="${p(14)}" height="${r1(h + p(10))}"/>
        <rect x="${r1(x + p(10))}" y="${r1(b - h - p(4))}" width="${r1(w - p(20))}" height="${p(4)}"/>`,
      wins: slits,
    };
  }

  // The Sage (now the Glasshouse): three rolling shells of glass and steel.
  function sage(x, b, s = 1) {
    const p = (n) => r1(n * s);
    const shell = (a, z, h) => `<path d="M${r1(a)} ${b} C${r1(a)} ${r1(b - h * 1.3)} ${r1(z)} ${r1(b - h * 1.3)} ${r1(z)} ${b}Z"/>`;
    let ribs = "";
    for (let i = 1; i < 9; i++) {
      const rx = x + p(14) + i * p(17);
      ribs += `M${r1(rx)} ${b} V${r1(b - p(70) - Math.sin((i / 9) * Math.PI) * p(40))}`;
    }
    return `
      ${shell(x, x + p(80), p(70))}
      ${shell(x + p(40), x + p(150), p(100))}
      ${shell(x + p(120), x + p(190), p(64))}
      <path d="${ribs}" fill="none" stroke="#5d4b6d" stroke-width="${p(1.2)}" opacity=".7"/>`;
  }

  // The Gateshead Millennium Bridge, in profile: a tall arch and a low deck
  // meeting at the pivots, joined by cables. At night it's lit with LEDs that
  // cycle through the rainbow.
  function millenniumBridge({ x0, x1, y, archH, deckH }) {
    const xm = (x0 + x1) / 2;
    const curve = (h, dy = 0) => `M${x0} ${y + dy} Q${xm} ${r1(y + dy - 2 * h)} ${x1} ${y + dy}`;
    const point = (h, t) => {
      const u = 1 - t;
      return [u * u * x0 + 2 * u * t * xm + t * t * x1, y - 4 * u * t * h];
    };
    let cables = "";
    const C = 18;
    for (let i = 1; i < C; i++) {
      const t = i / C;
      const [ax, ay] = point(archH, t);
      const [dx, dy] = point(deckH, t);
      cables += `M${r1(ax)} ${r1(ay)} L${r1(dx)} ${r1(dy)}`;
    }
    const lit = `
      <path d="${cables}" stroke="url(#rainbow)" stroke-width="1.3" opacity=".7"/>
      <path d="${curve(archH)}" stroke="url(#rainbow)" stroke-width="6"/>
      <path d="${curve(deckH)}" stroke="url(#rainbow)" stroke-width="4"/>`;
    return `
      <g fill="none" stroke-linecap="round">
        <g filter="url(#ledGlow)" opacity=".8">${lit}</g>
        ${lit}
        <path d="${curve(deckH, 5)}" stroke="#151827" stroke-width="4"/>
      </g>
      <g fill="#151827">
        <path d="M${x0 - 26} ${y + 30} L${x0} ${y - 2} L${x0 + 14} ${y + 30}Z"/>
        <path d="M${x1 - 14} ${y + 30} L${x1} ${y - 2} L${x1 + 26} ${y + 30}Z"/>
      </g>`;
  }

  /* ---------------------------------------------------------------------
     Hero: Newcastle at night from across the river.
     --------------------------------------------------------------------- */
  function buildSkyline(svg) {
    const rand = rng(2001); // the year the Millennium Bridge was lifted into place
    const B = 452;
    const W = 1600;

    // One building of a random type, with its lit windows. The body is a
    // plain box; the character comes from what sits on top.
    const TYPES = ["terrace", "terrace", "grainger", "grainger", "mansard", "gable", "flat", "tower", "warehouse"];
    function building(x, w, top, withWindows) {
      const type = TYPES[Math.floor(rand() * TYPES.length)];
      const X = r1(x), R = r1(x + w), T = r1(top);
      let roof = "";
      let bodyTop = top;
      let winW = 4, winH = 6, rowGap = 13;

      switch (type) {
        case "terrace": {
          // Pitched roof with chimney stacks and pots.
          const pitch = w * 0.3;
          roof += `<path d="M${X} ${T} L${r1(x + w / 2)} ${r1(top - pitch)} L${R} ${T}Z"/>`;
          [0.25, 0.75].forEach((k) => {
            if (rand() < 0.85) {
              const cx = x + w * k;
              const ry = top - pitch * (1 - Math.abs(2 * k - 1));
              roof += `<rect x="${r1(cx - 4)}" y="${r1(ry - 14)}" width="8" height="16"/>
                       <rect x="${r1(cx - 3)}" y="${r1(ry - 18)}" width="2" height="4"/>
                       <rect x="${r1(cx + 1)}" y="${r1(ry - 18)}" width="2" height="4"/>`;
            }
          });
          break;
        }
        case "grainger": {
          // Classical stone front: cornice, then a dome or a balustrade.
          roof += `<rect x="${r1(x - 3)}" y="${r1(top - 4)}" width="${r1(w + 6)}" height="5"/>`;
          if (w > 44 && rand() < 0.6) {
            const cx = x + w / 2, r = w * 0.16;
            roof += `<rect x="${r1(cx - r * 1.1)}" y="${r1(top - 16)}" width="${r1(r * 2.2)}" height="12"/>
                     <path d="M${r1(cx - r)} ${r1(top - 16)} A${r1(r)} ${r1(r)} 0 0 1 ${r1(cx + r)} ${r1(top - 16)}Z"/>
                     <rect x="${r1(cx - 1)}" y="${r1(top - 16 - r - 8)}" width="2" height="9"/>`;
          } else {
            for (let bx = x + 3; bx < x + w - 3; bx += 6) roof += `<rect x="${r1(bx)}" y="${r1(top - 10)}" width="2" height="6"/>`;
            roof += `<rect x="${X}" y="${r1(top - 12)}" width="${r1(w)}" height="2"/>`;
          }
          winH = 9; rowGap = 16;
          break;
        }
        case "mansard": {
          // Sloping mansard roof with little dormer windows.
          roof += `<path d="M${X} ${T} L${r1(x + 6)} ${r1(top - 18)} H${r1(x + w - 6)} L${R} ${T}Z"/>`;
          for (let dx = x + 10; dx < x + w - 14; dx += 15) {
            roof += `<path d="M${r1(dx)} ${r1(top - 4)} V${r1(top - 13)} L${r1(dx + 4)} ${r1(top - 17)} L${r1(dx + 8)} ${r1(top - 13)} V${r1(top - 4)}Z"/>`;
          }
          break;
        }
        case "gable": {
          // Stepped gable, like the old merchants' houses on the Quayside.
          const st = (k) => r1(x + w * k);
          roof += `<path d="M${X} ${T} V${r1(top - 7)} H${st(0.18)} V${r1(top - 14)} H${st(0.34)} V${r1(top - 21)} H${st(0.66)} V${r1(top - 14)} H${st(0.82)} V${r1(top - 7)} H${R} V${T}Z"/>`;
          break;
        }
        case "flat": {
          // Flat roof with a water tank on legs and an aerial.
          const tx = x + w * (0.2 + rand() * 0.4);
          roof += `<rect x="${r1(tx)}" y="${r1(top - 16)}" width="14" height="10"/>
                   <rect x="${r1(tx + 1)}" y="${r1(top - 6)}" width="2" height="6"/><rect x="${r1(tx + 11)}" y="${r1(top - 6)}" width="2" height="6"/>
                   <rect x="${r1(x + w * 0.8)}" y="${r1(top - 26)}" width="1.5" height="26"/>
                   <rect x="${r1(x + w * 0.8 - 5)}" y="${r1(top - 20)}" width="11" height="1.5"/>`;
          break;
        }
        case "tower": {
          // A taller block with a setback crown and a mast.
          bodyTop = top - 36;
          roof += `<rect x="${r1(x + w * 0.2)}" y="${r1(bodyTop - 12)}" width="${r1(w * 0.6)}" height="12"/>
                   <rect x="${r1(x + w / 2 - 1)}" y="${r1(bodyTop - 34)}" width="2" height="22"/>
                   <circle class="win win--twinkle" cx="${r1(x + w / 2)}" cy="${r1(bodyTop - 35)}" r="1.8" fill="#ff6b5a" style="animation-delay:${r1(rand() * 5)}s"/>`;
          break;
        }
        case "warehouse": {
          // Saw-tooth industrial roof.
          let d = `M${X} ${T}`;
          for (let sx = x; sx < x + w - 1; sx += 13) {
            const ex = Math.min(sx + 13, x + w);
            d += ` L${r1(ex)} ${r1(top - 10)} V${T}`;
          }
          roof += `<path d="${d}Z"/>`;
          winW = 7; winH = 4; rowGap = 18;
          break;
        }
      }

      const shape = `<rect x="${X}" y="${r1(bodyTop)}" width="${r1(w)}" height="${r1(B - bodyTop)}"/>${roof}`;
      let wins = "";
      if (withWindows) {
        for (let wy = bodyTop + 10; wy < B - 14; wy += rowGap) {
          for (let wx = x + 6; wx < x + w - 8; wx += 11) {
            if (rand() < 0.17) {
              const tw = rand() < 0.25 ? " win--twinkle" : "";
              wins += `<rect class="win${tw}" x="${r1(wx)}" y="${r1(wy)}" width="${winW}" height="${winH}" rx="${type === "grainger" ? 2 : 0}" opacity="${r1(0.45 + rand() * 0.5)}" style="animation-delay:${r1(rand() * 5)}s"/>`;
            }
          }
        }
        // Now and then a lit shopfront along the ground floor.
        if (rand() < 0.3 && w > 30) {
          wins += `<rect class="win" x="${r1(x + 4)}" y="${B - 11}" width="${r1(w - 8)}" height="6" opacity=".4"/>`;
        }
      }
      return { shape, wins };
    }

    function rooftops(xStart, xEnd, minH, maxH, withWindows, avoid = []) {
      let shapes = "", wins = "";
      let x = xStart;
      while (x < xEnd) {
        const w = 28 + rand() * 60;
        const h = minH + rand() * (maxH - minH);
        if (!avoid.some(([a, z]) => x + w > a && x < z)) {
          const b = building(x, w, B - h, withWindows);
          shapes += b.shape;
          wins += b.wins;
        }
        x += w + (rand() < 0.25 ? 6 + rand() * 10 : 0);
      }
      return { shapes, wins };
    }

    const far = rooftops(0, W, 50, 140, false, [[690, 880]]);
    const mid = rooftops(0, W, 30, 100, true, [[560, 610], [1440, 1550]]);
    const balticMill = baltic(1448, B, 1);

    const bridge = millenniumBridge({ x0: 900, x1: 1430, y: B - 8, archH: 205, deckH: 9 });

    // River with reflected lights; under the bridge they pick up its colours.
    const ledColours = ["#ff5a6e", "#ffb347", "#ffe36e", "#5fe39a", "#5fd4ff", "#8f7bff", "#ff6bd6"];
    let shimmer = "";
    for (let i = 0; i < 52; i++) {
      const x = rand() * W;
      const y = B + 8 + rand() * 60;
      const w = 10 + rand() * 50;
      const c = x > 880 && x < 1450 && rand() < 0.7 ? ledColours[Math.floor(rand() * ledColours.length)] : "#ffd27a";
      shimmer += `<rect class="shimmer" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="1.6" rx=".8" fill="${c}" opacity=".5" style="animation-delay:${r1(rand() * 6)}s"/>`;
    }

    svg.innerHTML = `
      <defs>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2a2540"/>
          <stop offset="1" stop-color="#0d1420"/>
        </linearGradient>
        <linearGradient id="rainbow" gradientUnits="userSpaceOnUse" x1="900" y1="0" x2="1430" y2="0">
          <stop offset="0" stop-color="#ff3b5c"/>
          <stop offset=".17" stop-color="#ff9a3c"/>
          <stop offset=".33" stop-color="#ffe14d"/>
          <stop offset=".5" stop-color="#3ddc84"/>
          <stop offset=".67" stop-color="#3cc8ff"/>
          <stop offset=".83" stop-color="#7b6bff"/>
          <stop offset="1" stop-color="#ff4fd8"/>
        </linearGradient>
        <filter id="ledGlow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
        <filter id="ripple" x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation="2.5 1"/>
        </filter>
        <clipPath id="riverClip"><rect x="0" y="${B}" width="${W}" height="80"/></clipPath>
      </defs>
      <g class="layer-far" fill="#4a3a5a" color="#4a3a5a">
        ${far.shapes}
        ${stJamesPark(120, B, 1.05)}
        ${cathedral(500, B, 1)}
        ${sage(690, B, 1)}
      </g>
      <g class="layer-mid" fill="#221d33" color="#221d33" stroke="#221d33">
        <g stroke="none">${mid.shapes}${greysMonument(585, B, 1)}${castleKeep(700, B, 0.95)}${balticMill.shape}</g>
        <g stroke="none">${mid.wins}${balticMill.wins}</g>
      </g>
      <g class="led-cycle">${bridge}</g>
      <rect x="0" y="${B}" width="${W}" height="80" fill="url(#river)"/>
      <rect x="0" y="${B}" width="${W}" height="2" fill="#151827"/>
      <g clip-path="url(#riverClip)">
        <g class="led-cycle" opacity=".38" filter="url(#ripple)" transform="translate(0 ${2 * B - 8}) scale(1 -1)">${bridge}</g>
      </g>
      <g>${shimmer}</g>`;

    // Truss lines on the stadium pick up the far colour as a stroke.
    svg.querySelectorAll(".truss").forEach((g) => g.setAttribute("stroke", "#5d4b6d"));
  }

  function buildStars(svg) {
    const rand = rng(7);
    let out = "";
    for (let i = 0; i < 110; i++) {
      const y = Math.pow(rand(), 1.6) * 420;
      out += `<circle cx="${r1(rand() * 1600)}" cy="${r1(y)}" r="${r1(0.5 + rand() * 1.3)}" fill="#fff" opacity="${r1(0.3 + rand() * 0.6)}" style="animation-delay:${r1(rand() * 4)}s"/>`;
    }
    svg.innerHTML = out;
  }

  // Pad the bottom of `main` so its content sits clear of the skyline:
  //  - if the content and the skyline both fit on screen, keep the skyline
  //    fully clear and let the content centre in the space above it;
  //  - if only the content fits, lift it as high as it will go and overlap
  //    the skyline only as much as needed (the skyline sits behind);
  //  - if the content is taller than the screen anyway (phones), the page
  //    scrolls, so put the skyline fully below the content.
  function fitAboveSkyline(main, scene) {
    // The tallest rooftops and the top of the bridge sit about 58% of the
    // way up the artwork; the rest is open sky.
    const ART = 0.58;
    const GAP = 24;

    function fit() {
      const art = scene.getBoundingClientRect().height * ART + GAP;
      // Measure the content's natural height with no bottom padding.
      main.style.paddingBottom = "0px";
      main.style.flex = "none";
      const box = main.getBoundingClientRect();
      main.style.flex = "";
      // Anything above main (a header, if there is one) also takes up room.
      const room = window.innerHeight - (box.top + window.scrollY) - box.height;

      let pad;
      if (room >= art) pad = art;
      else if (room >= 0) pad = room;
      else pad = art;
      main.style.paddingBottom = `${Math.round(pad)}px`;
    }

    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("load", fit);
    if (document.fonts) document.fonts.ready.then(fit);
    return fit;
  }

  window.HTT = { buildSkyline, buildStars, fitAboveSkyline };
})();
