/*
 * Illustrated scenes, drawn as SVG at runtime so they stay crisp and are
 * easy to tweak: the night-time skyline in the hero, and the dawn crossing
 * of the Tyne with the Gateshead Millennium Bridge.
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

  // Point on a quadratic curve from (x0,y) to (x1,y) whose apex is `h` above y.
  function quadPoint(x0, x1, y, h, s) {
    const xm = (x0 + x1) / 2;
    const cy = y - 2 * h;
    const u = 1 - s;
    return [u * u * x0 + 2 * u * s * xm + s * s * x1, u * u * y + 2 * u * s * cy + s * s * y];
  }
  const quadPath = (x0, x1, y, h) => `M${r1(x0)} ${r1(y)} Q${r1((x0 + x1) / 2)} ${r1(y - 2 * h)} ${r1(x1)} ${r1(y)}`;

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

  /* ---------------------------------------------------------------------
     Crossing: dawn on the Tyne. The Millennium Bridge tilts as `t` goes 0→1.
     --------------------------------------------------------------------- */
  function buildCrossing(svg) {
    const rand = rng(2001); // the year the Millennium Bridge was lifted into place
    const W = 1600;
    const H = 760;
    const quay = 600;
    const xL = 300;
    const xR = 1250;
    const ink = "#3a2433";

    // Distant city and the Tyne Bridge upstream, softened by morning haze.
    let distant = "";
    for (let x = 0; x < W; ) {
      const w = 20 + rand() * 50;
      const h = 14 + rand() * 50;
      distant += `<rect x="${r1(x)}" y="${r1(560 - h)}" width="${r1(w)}" height="${r1(h)}"/>`;
      x += w;
    }
    const farBridge = tyneBridge({
      x0: 640, x1: 900, river: 562, deckY: 517, apexY: 462,
      towerW: 20, towerTop: 470,
      archColor: "#a76a74", towerColor: "#b98081", deckColor: "#a76a74",
      lamps: false, extendL: 120, extendR: 140,
    });

    // Newcastle quayside (left) and Gateshead with BALTIC and Sage (right).
    let leftBank = "";
    for (let x = -10; x < xL - 20; ) {
      const w = 34 + rand() * 46;
      const h = 60 + rand() * 120;
      leftBank += rand() < 0.4
        ? `<path d="M${r1(x)} ${quay} V${r1(quay - h)} L${r1(x + w / 2)} ${r1(quay - h - w * 0.3)} L${r1(x + w)} ${r1(quay - h)} V${quay}Z"/>`
        : `<rect x="${r1(x)}" y="${r1(quay - h)}" width="${r1(w)}" height="${r1(h)}"/>`;
      x += w;
    }

    const baltic = `
      <rect x="1290" y="${quay - 250}" width="120" height="250"/>
      <rect x="1282" y="${quay - 262}" width="16" height="262"/>
      <rect x="1402" y="${quay - 262}" width="16" height="262"/>
      <g fill="#f4c7a1" opacity=".18">
        ${Array.from({ length: 6 }, (_, i) => `<rect x="${1306 + i * 16}" y="${quay - 236}" width="6" height="220"/>`).join("")}
      </g>`;

    // The Glasshouse (née Sage Gateshead): three rolling shells of glass and steel.
    const sage = (() => {
      const shells = [
        [1430, 1560, 150],
        [1490, 1660, 205],
        [1600, 1720, 140],
      ];
      return shells.map(([a, z, h]) => {
        let ribs = "";
        for (let i = 1; i < 7; i++) {
          const x = a + ((z - a) * i) / 7;
          const k = 1 - Math.pow((x - (a + z) / 2) / ((z - a) / 2), 2);
          ribs += `M${r1(x)} ${quay} V${r1(quay - 40 - (h - 40) * k)}`;
        }
        return `<path d="M${a} ${quay} C${a} ${quay - h * 1.25} ${z} ${quay - h * 1.25} ${z} ${quay}Z" fill="#5a3a4d"/>
                <path d="${ribs}" stroke="#f4c7a1" stroke-opacity=".16" stroke-width="2"/>`;
      }).join("");
    })();

    // Kittiwakes: the Tyne's famous urban seabirds.
    const birds = [[980, 170, 0.8], [1030, 150, 0.7], [1080, 190, 0.9], [1150, 214, 1], [1210, 176, 0.75]]
      .map(([x, y, s]) => `<path class="bird" d="M${x - 12 * s} ${y} q${6 * s} ${-7 * s} ${12 * s} 0 q${6 * s} ${-7 * s} ${12 * s} 0" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`)
      .join("");

    let shimmer = "";
    for (let i = 0; i < 40; i++) {
      const y = quay + 18 + rand() * 130;
      const nearSun = rand() < 0.5;
      const x = nearSun ? 920 + (rand() - 0.5) * 160 : rand() * W;
      shimmer += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(16 + rand() * 60)}" height="2" rx="1" fill="#fff4dc" opacity="${nearSun ? 0.7 : 0.35}"/>`;
    }

    svg.innerHTML = `
      <defs>
        <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f6e2c9"/>
          <stop offset=".55" stop-color="#f6c49f"/>
          <stop offset=".78" stop-color="#ef9f84"/>
        </linearGradient>
        <linearGradient id="tyne" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d98a83"/>
          <stop offset="1" stop-color="#8c5568"/>
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stop-color="#fff6df" stop-opacity=".95"/>
          <stop offset=".35" stop-color="#ffe2b0" stop-opacity=".5"/>
          <stop offset="1" stop-color="#ffd09a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#dawn)"/>
      <g data-sun>
        <circle cx="920" cy="0" r="260" fill="url(#sunGlow)"/>
        <circle cx="920" cy="0" r="62" fill="#fff3d8"/>
      </g>
      <g fill="#d39a8e">${distant}</g>
      ${farBridge}
      <rect x="0" y="560" width="${W}" height="${H - 560}" fill="url(#tyne)"/>
      <g>${shimmer}</g>
      <g fill="${ink}">${leftBank}<rect x="-10" y="${quay}" width="${xL + 40}" height="${H - quay}"/></g>
      <g fill="${ink}">${baltic}${sage}<rect x="${xR - 20}" y="${quay}" width="${W - xR + 40}" height="${H - quay}"/></g>
      <g data-mbridge stroke="${ink}" fill="none" stroke-linecap="round"></g>
      <g fill="${ink}">
        <path d="M${xL - 40} ${quay + 50} L${xL} ${quay - 4} L${xL + 22} ${quay + 50}Z"/>
        <path d="M${xR - 22} ${quay + 50} L${xR} ${quay - 4} L${xR + 40} ${quay + 50}Z"/>
      </g>
      <g data-boat fill="${ink}" style="opacity:0">
        <path d="M-60 0 H60 L44 22 H-46 Z"/>
        <rect x="-3" y="-120" width="5" height="120"/>
        <path d="M5 -112 L58 -10 H5 Z" opacity=".8"/>
        <path d="M-3 -100 L-46 -12 H-3 Z" opacity=".55"/>
      </g>
      <g>${birds}</g>`;

    const sun = svg.querySelector("[data-sun]");
    const boat = svg.querySelector("[data-boat]");
    const bridge = svg.querySelector("[data-mbridge]");

    const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const clamp01 = (x) => Math.max(0, Math.min(1, x));

    // At rest the arch stands tall and the deck lies flat; as the bridge
    // rotates about its pivots the arch lowers and the deck lifts into an arch.
    return function update(p) {
      const t = ease(clamp01((p - 0.08) / 0.5));
      const archH = 380 - 190 * t;
      const deckH = 10 + 165 * t;

      let cables = "";
      const C = 18;
      for (let i = 1; i < C; i++) {
        const s = i / C;
        const [ax, ay] = quadPoint(xL, xR, quay, archH, s);
        const [dx, dy] = quadPoint(xL, xR, quay, deckH, s);
        cables += `M${r1(ax)} ${r1(ay)} L${r1(dx)} ${r1(dy)}`;
      }

      bridge.innerHTML = `
        <path d="${cables}" stroke-width="1.6" opacity=".75"/>
        <path d="${quadPath(xL, xR, quay, archH)}" stroke-width="13"/>
        <path d="${quadPath(xL, xR, quay, deckH)}" stroke-width="10"/>
        <path d="${quadPath(xL + 6, xR - 6, quay - 14, deckH - 4)}" stroke-width="2"/>`;

      sun.setAttribute("transform", `translate(0 ${r1(590 - 150 * clamp01(p))})`);

      // Once the bridge is open, a yacht comes downriver underneath it,
      // towards the viewer.
      const b = clamp01((p - 0.6) / 0.38);
      const scale = 0.3 + 1.2 * b * b;
      boat.setAttribute("transform", `translate(${r1((xL + xR) / 2 - 30 * b)} ${r1(578 + 200 * b * b)}) scale(${r1(scale * 100) / 100})`);
      boat.style.opacity = clamp01(Math.min(b * 8, (1 - b) * 6));
    };
  }

  window.HTT = { buildSkyline, buildStars, buildCrossing };
})();
