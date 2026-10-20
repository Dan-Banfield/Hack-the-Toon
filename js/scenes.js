/*
 * Illustrated scenes, drawn as SVG at runtime so they stay crisp and are
 * easy to tweak: Newcastle's skyline at dusk, and a starry sky.
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

  // The Tyne Bridge, in profile: granite towers, arched truss and hanging deck.
  function tyneBridge(opts) {
    const { x0, x1, river, deckY, apexY, towerW, towerTop, archColor, towerColor, deckColor, lamps = true, extendL = 0, extendR = 0 } = opts;
    const span = x1 - x0;
    const h = river - apexY;
    const depth = Math.max(8, span * 0.028);
    const xm = (x0 + x1) / 2;
    const archY = (x) => apexY + h * Math.pow((x - xm) / (span / 2), 2);
    const innerY = (x) => archY(x) + depth * (0.55 + 0.45 * Math.pow((x - xm) / (span / 2), 2));

    let outer = "", inner = "";
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const x = x0 + (span * i) / N;
      outer += `${i ? "L" : "M"}${r1(x)} ${r1(archY(x))}`;
    }
    for (let i = N; i >= 0; i--) {
      const x = x0 + (span * i) / N;
      inner += `L${r1(x)} ${r1(Math.min(river, innerY(x)))}`;
    }

    // Truss lattice between the chords.
    let lattice = "";
    const L = 22;
    for (let i = 0; i < L; i++) {
      const xa = x0 + (span * i) / L;
      const xb = x0 + (span * (i + 1)) / L;
      lattice += `M${r1(xa)} ${r1(archY(xa))} L${r1(xb)} ${r1(Math.min(river, innerY(xb)))}`;
    }

    // Hangers above the deck, posts below it.
    let hangers = "";
    const H = 18;
    for (let i = 1; i < H; i++) {
      const x = x0 + (span * i) / H;
      const y = innerY(x);
      if (y < deckY) hangers += `M${r1(x)} ${r1(y)} V${deckY}`;
      else if (y > deckY + 6) hangers += `M${r1(x)} ${deckY + 6} V${r1(Math.min(river, y))}`;
    }

    const tw = towerW;
    const tower = (cx) => `
      <path d="M${r1(cx - tw / 2)} ${river} V${towerTop + 10} H${r1(cx - tw / 2 - 3)} V${towerTop} H${r1(cx + tw / 2 + 3)} V${towerTop + 10} H${r1(cx + tw / 2)} V${river} Z"/>
      <rect x="${r1(cx - tw * 0.22)}" y="${towerTop + 26}" width="${r1(tw * 0.44)}" height="${r1((deckY - towerTop) * 0.5)}" rx="${r1(tw * 0.22)}" fill="rgba(0,0,0,.28)"/>`;

    let lampDots = "";
    if (lamps) {
      for (let x = x0 - extendL + 12; x < x1 + extendR; x += 28) {
        lampDots += `<circle class="win win--twinkle" cx="${r1(x)}" cy="${deckY - 3}" r="1.6" style="animation-delay:${r1((x % 7) / 2)}s"/>`;
      }
    }

    return `
      <g class="tyne-bridge">
        <path d="${hangers}" stroke="${archColor}" stroke-width="1.3" fill="none" opacity=".8"/>
        <path d="${outer}${inner}Z" fill="${archColor}" opacity=".35"/>
        <path d="${lattice}" stroke="${archColor}" stroke-width="1.6" fill="none"/>
        <path d="${outer}" stroke="${archColor}" stroke-width="4" fill="none" stroke-linejoin="round"/>
        <path d="${inner.replace(/^L/, "M")}" stroke="${archColor}" stroke-width="3" fill="none"/>
        <rect x="${x0 - extendL}" y="${deckY}" width="${span + extendL + extendR}" height="8" fill="${deckColor}"/>
        <rect x="${x0 - extendL}" y="${deckY - 6}" width="${span + extendL + extendR}" height="1.5" fill="${deckColor}"/>
        <g fill="${towerColor}">${tower(x0 - tw / 2 + 4)}${tower(x1 + tw / 2 - 4)}</g>
        ${lampDots}
      </g>`;
  }

  /* ---------------------------------------------------------------------
     Hero: Newcastle at night from across the river.
     --------------------------------------------------------------------- */
  function buildSkyline(svg) {
    const rand = rng(1928); // the year the Tyne Bridge opened
    const B = 452;
    const W = 1600;

    // Generic rooftops, with Grainger Town style pitched roofs here and there.
    function rooftops(xStart, xEnd, minH, maxH, withWindows, avoid = []) {
      let shapes = "", wins = "";
      let x = xStart;
      while (x < xEnd) {
        const w = 26 + rand() * 62;
        const h = minH + rand() * (maxH - minH);
        const blocked = avoid.some(([a, z]) => x + w > a && x < z);
        if (!blocked) {
          const top = B - h;
          if (rand() < 0.35) {
            shapes += `<path d="M${r1(x)} ${B} V${r1(top)} L${r1(x + w / 2)} ${r1(top - w * 0.28)} L${r1(x + w)} ${r1(top)} V${B}Z"/>`;
          } else if (rand() < 0.15) {
            shapes += `<path d="M${r1(x)} ${B} V${r1(top)} H${r1(x + w)} V${B}Z M${r1(x + w * 0.4)} ${r1(top)} V${r1(top - 18)} H${r1(x + w * 0.55)} V${r1(top)}Z"/>`;
          } else {
            shapes += `<rect x="${r1(x)}" y="${r1(top)}" width="${r1(w)}" height="${r1(h)}"/>`;
          }
          if (withWindows) {
            for (let wy = top + 10; wy < B - 10; wy += 13) {
              for (let wx = x + 6; wx < x + w - 8; wx += 11) {
                if (rand() < 0.16) {
                  const tw = rand() < 0.25 ? " win--twinkle" : "";
                  wins += `<rect class="win${tw}" x="${r1(wx)}" y="${r1(wy)}" width="4" height="6" opacity="${r1(0.45 + rand() * 0.5)}" style="animation-delay:${r1(rand() * 5)}s"/>`;
                }
              }
            }
          }
        }
        x += w + (rand() < 0.2 ? 8 : 0);
      }
      return { shapes, wins };
    }

    const far = rooftops(0, W, 50, 150, false);
    const mid = rooftops(0, W, 30, 105, true, [[560, 610]]);

    const bridge = tyneBridge({
      x0: 900, x1: 1430, river: B, deckY: 362, apexY: 246,
      towerW: 40, towerTop: 262,
      archColor: "#5fae8c", towerColor: "#2b2a3d", deckColor: "#151827",
      extendL: 160, extendR: 260,
    });

    // River with reflected lights.
    let shimmer = "";
    for (let i = 0; i < 46; i++) {
      const x = rand() * W;
      const y = B + 8 + rand() * 60;
      const w = 10 + rand() * 50;
      const c = x > 880 && x < 1450 && rand() < 0.5 ? "#5fae8c" : "#ffd27a";
      shimmer += `<rect class="shimmer" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="1.6" rx=".8" fill="${c}" opacity=".5" style="animation-delay:${r1(rand() * 6)}s"/>`;
    }

    svg.innerHTML = `
      <defs>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2a2540"/>
          <stop offset="1" stop-color="#0d1420"/>
        </linearGradient>
      </defs>
      <g class="layer-far" fill="#4a3a5a" color="#4a3a5a">
        ${far.shapes}
        ${stJamesPark(120, B, 1.05)}
        ${cathedral(500, B, 1)}
      </g>
      <g class="layer-mid" fill="#221d33" color="#221d33" stroke="#221d33">
        <g stroke="none">${mid.shapes}${greysMonument(585, B, 1)}${castleKeep(700, B, 0.95)}</g>
        <g stroke="none">${mid.wins}</g>
      </g>
      ${bridge}
      <rect x="0" y="${B}" width="${W}" height="80" fill="url(#river)"/>
      <rect x="0" y="${B}" width="${W}" height="2" fill="#151827"/>
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

  window.HTT = { buildSkyline, buildStars };
})();
