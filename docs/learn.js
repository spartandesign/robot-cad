/* ============================================================
   learn.js — shared learning tools for Model & Make.
   1) Listen bars:   <div class="listen" data-src="media/x.mp3" data-min="4"></div>
   2) Self-checks:   <div class="quiz"><script type="application/json">[...]</script></div>
      item = { q, options:[...], answer: index, why, hint? }
   3) Dial caliper:  <div class="dialsim"></div>
   Nothing is saved or sent anywhere; it all runs in the page.
   ============================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- 1. Listen bar ----------
  $$(".listen").forEach(el => {
    const src = el.dataset.src, min = el.dataset.min;
    el.innerHTML = `<div class="listen__head"><span class="listen__ic" aria-hidden="true">🔊</span>
      <strong>Listen to this chapter</strong>${min ? `<span class="listen__len">about ${esc(min)} min</span>` : ""}</div>
      <audio controls preload="none" src="${esc(src)}"></audio>
      <div class="listen__speed" role="group" aria-label="Playback speed">
        <span>Speed:</span>
        <button type="button" data-r="0.85">Slower</button>
        <button type="button" data-r="1" aria-pressed="true">Normal</button>
        <button type="button" data-r="1.2">Faster</button>
      </div>`;
    const a = $("audio", el);
    $$(".listen__speed button", el).forEach(b => b.addEventListener("click", () => {
      a.playbackRate = +b.dataset.r;
      $$(".listen__speed button", el).forEach(x => x.setAttribute("aria-pressed", x === b));
    }));
  });

  // ---------- 2. Self-check quiz ----------
  $$(".quiz").forEach((el, qi) => {
    let items;
    try { items = JSON.parse($("script", el).textContent); } catch (e) { return; }
    const first = new Array(items.length).fill(null);
    let html = `<p class="quiz__intro">Tap an answer. You'll see right away if it's right, and why. Wrong answers are OK — try again.</p>`;
    items.forEach((it, i) => {
      html += `<fieldset class="quiz__q" data-i="${i}"><legend><span class="quiz__n">${i + 1}</span> ${it.q}</legend>
        <div class="quiz__opts">${it.options.map((o, j) =>
          `<button type="button" class="quiz__opt" data-j="${j}"><span class="quiz__l">${"ABCD"[j]}</span><span>${o}</span></button>`).join("")}</div>
        <p class="quiz__fb" aria-live="polite"></p></fieldset>`;
    });
    html += `<div class="quiz__foot"><span class="quiz__score" aria-live="polite"></span>
      <button type="button" class="sim__btn quiz__reset">Start over</button></div>`;
    const box = document.createElement("div"); box.innerHTML = html; el.appendChild(box);

    const score = () => {
      const done = first.filter(x => x !== null).length;
      const right = first.filter(x => x === true).length;
      $(".quiz__score", el).textContent = done === items.length
        ? `You got ${right} of ${items.length} right on the first try. ${right === items.length ? "Nice work!" : "Reread the parts you missed, then try again."}`
        : `${done} of ${items.length} answered`;
    };
    $$(".quiz__q", el).forEach(fs => {
      const i = +fs.dataset.i, it = items[i];
      $$(".quiz__opt", fs).forEach(b => b.addEventListener("click", () => {
        if (fs.classList.contains("is-done")) return;
        const j = +b.dataset.j, ok = j === it.answer;
        if (first[i] === null) first[i] = ok;
        const fb = $(".quiz__fb", fs);
        if (ok) {
          b.classList.add("is-right"); fs.classList.add("is-done");
          $$(".quiz__opt", fs).forEach(x => x.disabled = true);
          fb.className = "quiz__fb is-right"; fb.innerHTML = `<strong>Yes!</strong> ${it.why}`;
        } else {
          b.classList.add("is-wrong"); b.disabled = true;
          fb.className = "quiz__fb is-wrong"; fb.innerHTML = `<strong>Not quite.</strong> ${it.hint || "Look again and try another answer."}`;
        }
        score();
      }));
    });
    $(".quiz__reset", el).addEventListener("click", () => {
      first.fill(null);
      $$(".quiz__q", el).forEach(fs => {
        fs.classList.remove("is-done");
        $$(".quiz__opt", fs).forEach(x => { x.disabled = false; x.classList.remove("is-right", "is-wrong"); });
        const fb = $(".quiz__fb", fs); fb.className = "quiz__fb"; fb.textContent = "";
      });
      score();
    });
    score();
  });

  // ---------- 3. Dial caliper practice ----------
  $$(".dialsim").forEach(el => {
    const W = 720, H = 250, x0 = 70, ppi = 230, y = 120, MAX = 2.5;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="A dial caliper. The bar shows inches and tenths; the dial shows thousandths."></svg>
      <div class="sim__bar">
        <label class="dialsim__lab" for="ds${el.id}">Slide the jaw</label>
        <input type="range" id="ds${el.id}" min="0" max="2500" step="1" value="1237" class="dialsim__range">
        <label class="sim__toggle"><input type="checkbox" class="dialsim__show" checked> Show the reading</label>
      </div>
      <div class="sim__bar dialsim__practice">
        <button type="button" class="sim__btn sim__btn--go dialsim__new">New challenge</button>
        <label>Your reading: <input type="text" inputmode="decimal" class="dialsim__in" placeholder="0.000" size="7"> in</label>
        <button type="button" class="sim__btn dialsim__check">Check</button>
      </div>
      <p class="sim__say dialsim__say" aria-live="polite"></p>`;
    const svg = $("svg", el), range = $(".dialsim__range", el), show = $(".dialsim__show", el), say = $(".dialsim__say", el);
    let target = null;
    const parts = v => { const thou = Math.round(v * 1000); return { bar: Math.floor(thou / 100) / 10, dial: thou % 100, total: thou / 1000 }; };
    function draw(v) {
      const xs = x0 + v * ppi; let s = "";
      s += `<rect x="20" y="${y - 22}" width="${W - 40}" height="44" rx="5" fill="#C9D1DB" stroke="#9AA6B4" stroke-width="2"/>`;
      for (let i = 0; i <= MAX * 10; i++) {
        const x = x0 + i * ppi / 10, big = i % 10 === 0;
        s += `<line x1="${x}" y1="${y - 22}" x2="${x}" y2="${y - 22 + (big ? 18 : i % 5 === 0 ? 13 : 9)}" stroke="#1A1A1A" stroke-width="${big ? 2 : 1.1}"/>`;
        s += big ? `<text x="${x + 3}" y="${y + 12}" font-size="15" font-weight="700" fill="#1A1A1A">${i / 10}</text>`
                 : `<text x="${x + 2}" y="${y + 9}" font-size="10" fill="#5B6470">${i % 10}</text>`;
      }
      // fixed jaw
      s += `<path d="M${x0 - 50},${y + 22} L${x0},${y + 22} L${x0},${y + 110} L${x0 - 10},${y + 124} L${x0 - 50},${y + 50}Z" fill="#C9D1DB" stroke="#9AA6B4" stroke-width="2"/>`;
      // slider body + jaw
      s += `<path d="M${xs},${y + 22} L${xs + 50},${y + 22} L${xs + 50},${y + 50} L${xs + 10},${y + 124} L${xs},${y + 110}Z" fill="#C9D1DB" stroke="#9AA6B4" stroke-width="2"/>`;
      s += `<rect x="${xs}" y="${y - 32}" width="150" height="64" rx="8" fill="#E6EAF0" stroke="#9AA6B4" stroke-width="2"/>`;
      s += `<line x1="${xs}" y1="${y - 40}" x2="${xs}" y2="${y + 22}" stroke="#C55A11" stroke-width="3"/>`;
      const cx = xs + 85, cy = y - 50, r = 56, p = parts(v);
      s += `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="#fff" stroke="#1A1A1A" stroke-width="2"/>`;
      for (let i = 0; i < 100; i++) {
        const a = (i * 3.6 - 90) * Math.PI / 180, l = i % 10 === 0 ? 10 : i % 5 === 0 ? 7 : 4;
        s += `<line x1="${cx + Math.cos(a) * r}" y1="${cy + Math.sin(a) * r}" x2="${cx + Math.cos(a) * (r - l)}" y2="${cy + Math.sin(a) * (r - l)}" stroke="#1A1A1A" stroke-width="${i % 10 === 0 ? 1.6 : .7}"/>`;
        if (i % 10 === 0) s += `<text x="${cx + Math.cos(a) * (r - 19)}" y="${cy + Math.sin(a) * (r - 19) + 4}" text-anchor="middle" font-size="10" fill="#1A1A1A">${i}</text>`;
      }
      const na = (p.dial * 3.6 - 90) * Math.PI / 180;
      s += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(na) * (r - 4)}" y2="${cy + Math.sin(na) * (r - 4)}" stroke="#C55A11" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="4" fill="#C55A11"/>`;
      svg.innerHTML = s;
      if (target === null) {
        say.innerHTML = show.checked
          ? `<strong>Bar:</strong> ${p.bar.toFixed(1)} &nbsp;+&nbsp; <strong>Dial:</strong> ${p.dial} → 0.${String(p.dial).padStart(3, "0")} &nbsp;=&nbsp; <strong>${p.total.toFixed(3)} in</strong>`
          : `Read the bar at the orange line, then the dial. Turn on “Show the reading” to check.`;
      }
    }
    range.addEventListener("input", () => { target = null; draw(range.value / 1000); });
    show.addEventListener("change", () => draw(range.value / 1000));
    $(".dialsim__new", el).addEventListener("click", () => {
      target = (50 + Math.floor(Math.random() * 2400)) / 1000;
      show.checked = false; range.value = Math.round(target * 1000); draw(target);
      $(".dialsim__in", el).value = ""; $(".dialsim__in", el).focus();
      say.innerHTML = `What does this caliper read? Type it to three decimal places, like 1.237.`;
    });
    $(".dialsim__check", el).addEventListener("click", () => {
      if (target === null) { say.textContent = "Press New challenge first."; return; }
      const g = parseFloat($(".dialsim__in", el).value), p = parts(target);
      if (isNaN(g)) { say.textContent = "Type a number like 1.237."; return; }
      if (Math.abs(g - target) < 0.0005) say.innerHTML = `<strong>Correct!</strong> ${p.bar.toFixed(1)} + 0.${String(p.dial).padStart(3, "0")} = ${p.total.toFixed(3)} in. Press New challenge for another.`;
      else if (Math.abs(g - p.bar) < 0.0005 || Math.floor(g * 10) / 10 === p.bar) say.innerHTML = `<strong>Close.</strong> Your bar reading looks right. Now check the dial: which number is the needle pointing to?`;
      else say.innerHTML = `<strong>Not yet.</strong> Start with the bar: find the last mark to the left of the orange line. Then add the dial.`;
    });
    draw(1.237);
  });
})();

/* ============================================================
   More interactives (Chapters 2–5, reused later)
   ============================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NAVY = "#1F3864", ORANGE = "#C55A11", BLUE = "#2E75B6", GREEN = "#3F6B2A", RED = "#B42318", INK = "#1A1A1A", GRAY = "#5B6470";
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- Which view is it? (heightmap blocks) ----------
  const SHAPES = [
    [[2, 2], [1, 1], [1, 1]],            // L-block: h[x][y]
    [[1, 2], [1, 2], [1, 1]],            // back wall on part
    [[3, 3], [1, 1], [2, 1]],            // tower + step
    [[1, 1], [2, 2], [1, 1]],            // center ridge
    [[2, 1], [2, 1], [1, 1]],            // back-left block
    [[1, 2], [2, 2], [1, 2]],
  ];
  function isoSVG(h) {
    const W = h.length, D = h[0].length, s = 34, c = Math.cos(Math.PI / 6) * s, sn = Math.sin(Math.PI / 6) * s;
    const P = (x, y, z) => [130 + (x - y) * c, 70 + (x + y) * sn - z * s + 60];
    const cells = []; for (let x = 0; x < W; x++) for (let y = 0; y < D; y++) for (let z = 0; z < h[x][y]; z++) cells.push([x, y, z]);
    cells.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[2] - b[2]);
    const pl = (pts, f) => `<polygon points="${pts.map(p => p.join(",")).join(" ")}" fill="${f}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
    let s2 = "";
    for (const [x, y, z] of cells) {
      s2 += pl([P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], "#F4D2B3");
      s2 += pl([P(x + 1, y, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)], "#E7B98F");
      s2 += pl([P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], "#D69C6B");
    }
    return `<svg viewBox="0 0 260 230" role="img" aria-label="3D block">${s2}</svg>`;
  }
  // a view = grid of columns: cols[u] = list of heights seen along the depth (max first)
  function view(h, which) {
    const W = h.length, D = h[0].length, cols = [];
    if (which === "front") for (let x = 0; x < W; x++) cols.push([...Array(D).keys()].map(y => h[x][y]));
    if (which === "right") for (let y = D - 1; y >= 0; y--) cols.push([...Array(W).keys()].map(x => h[x][y]));
    if (which === "top") return { top: true, h };
    return { cols };
  }
  function viewSVG(v, mirror = false) {
    const s = 32; let out = "";
    if (v.top) {
      const h = v.h, W = h.length, D = h[0].length, ox = 20, oy = 20;
      const X = x => mirror ? ox + (W - x) * s : ox + x * s;
      out += `<rect x="${ox}" y="${oy}" width="${W * s}" height="${D * s}" fill="#fff" stroke="${NAVY}" stroke-width="3"/>`;
      for (let x = 0; x < W; x++) for (let y = 0; y < D; y++) {
        if (x + 1 < W && h[x][y] !== h[x + 1][y]) out += `<line x1="${X(x + 1)}" y1="${oy + y * s}" x2="${X(x + 1)}" y2="${oy + (y + 1) * s}" stroke="${NAVY}" stroke-width="3"/>`;
        if (y + 1 < D && h[x][y] !== h[x][y + 1]) out += `<line x1="${X(x)}" y1="${oy + (y + 1) * s}" x2="${X(x + 1)}" y2="${oy + (y + 1) * s}" stroke="${NAVY}" stroke-width="3"/>`;
      }
      return `<svg viewBox="0 0 ${W * s + 40} ${D * s + 40}">${out}</svg>`;
    }
    const cols = mirror ? [...v.cols].reverse() : v.cols, n = cols.length, H = Math.max(...cols.flat()), ox = 20, base = 20 + H * s;
    let path = `M${ox},${base}`;
    cols.forEach((c, i) => { const m = Math.max(...c); path += ` L${ox + i * s},${base - m * s} L${ox + (i + 1) * s},${base - m * s}`; });
    path += ` L${ox + n * s},${base} Z`;
    out += `<path d="${path}" fill="#fff" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>`;
    cols.forEach((c, i) => { const m = Math.max(...c); new Set(c.filter(z => z > 0 && z < m)).forEach(z => out += `<line x1="${ox + i * s}" y1="${base - z * s}" x2="${ox + (i + 1) * s}" y2="${base - z * s}" stroke="${NAVY}" stroke-width="3"/>`); });
    // vertical edges between columns of different max are part of the path; add inner verticals where heights differ but path already covers
    return `<svg viewBox="0 0 ${n * s + 40} ${H * s + 40}">${out}</svg>`;
  }
  $$(".viewsim").forEach(el => {
    el.innerHTML = `<div class="viewsim__grid"><div class="viewsim__obj"></div><div><p class="viewsim__ask"></p><div class="viewsim__opts"></div></div></div>
      <div class="sim__bar"><button type="button" class="sim__btn sim__btn--go viewsim__new">New block</button><span class="sim__phase viewsim__score"></span></div>
      <p class="sim__say viewsim__say" aria-live="polite">Pick the view that matches the block. The front is the lower-left face.</p>`;
    let right = 0, tries = 0, last = -1;
    function round() {
      let k; do { k = Math.floor(Math.random() * SHAPES.length); } while (k === last); last = k;
      const h = SHAPES[k], kinds = ["front", "top", "right"], want = kinds[Math.floor(Math.random() * 3)];
      $(".viewsim__obj", el).innerHTML = isoSVG(h);
      $(".viewsim__ask", el).innerHTML = `Which drawing is the <strong>${want.toUpperCase()}</strong> view?`;
      const key = (v, m) => { if (v.top) { const hh = m ? [...v.h].reverse() : v.h; return "T" + JSON.stringify(hh.map(c => c.map(z => z > 0 ? z : 0))); }
        const cs = (m ? [...v.cols].reverse() : v.cols).map(c => { const mx = Math.max(...c); return [mx, [...new Set(c.filter(z => z > 0 && z < mx))].sort()]; }); return "C" + JSON.stringify(cs); };
      const topKey = v => { const h2 = v.h, W = h2.length, D = h2[0].length, e = [];
        for (let x = 0; x < W; x++) for (let y = 0; y < D; y++) { if (x + 1 < W && h2[x][y] !== h2[x + 1][y]) e.push(`v${x + 1},${y}`); if (y + 1 < D && h2[x][y] !== h2[x][y + 1]) e.push(`h${x},${y + 1}`); }
        return e.sort().join(";"); };
      const k2 = (v, m) => v.top ? "T" + (m ? topKey({ h: [...v.h].reverse() }) : topKey(v)) : key(v, m);
      const vw = view(h, want), correct = viewSVG(vw), opts = [{ svg: correct, ok: true, k: k2(vw, false) }];
      const cands = [{ v: vw, m: true, why: "That one is flipped left-to-right." }]
        .concat(kinds.filter(x => x !== want).map(x => ({ v: view(h, x), m: false, why: `That's the ${x} view.` })));
      for (const c of cands) { const kk = k2(c.v, c.m); if (opts.length < 3 && !opts.some(o => o.k === kk)) opts.push({ svg: viewSVG(c.v, c.m), ok: false, why: c.why, k: kk }); }
      const box = $(".viewsim__opts", el); box.innerHTML = "";
      shuffle(opts).forEach((o, i) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "viewsim__opt"; b.innerHTML = o.svg + `<span>${"ABC"[i]}</span>`;
        b.addEventListener("click", () => {
          if (el.dataset.done) return; tries++;
          if (o.ok) { right++; el.dataset.done = 1; b.classList.add("is-right"); $(".viewsim__say", el).innerHTML = `<strong>Yes!</strong> Press <em>New block</em> for another.`; }
          else { b.classList.add("is-wrong"); $(".viewsim__say", el).innerHTML = `<strong>Not quite.</strong> ${o.why || "That's a different view of the block."} ${want === "top" ? "Look straight down from above." : want === "front" ? "Look straight at the lower-left face." : "Look straight at the lower-right face."}`; }
          $(".viewsim__score", el).textContent = `${right} right · ${tries} tries`;
        });
        box.appendChild(b);
      });
      delete el.dataset.done;
      $(".viewsim__say", el).textContent = "Pick the view that matches the block. The front is the lower-left face.";
    }
    $(".viewsim__new", el).addEventListener("click", round); round();
  });

  // ---------- Will it fit? (generic clearance slider) ----------
  $$(".fitsim").forEach(el => {
    const d = el.dataset, part = +d.part, min = +d.min, max = +d.max, step = +(d.step || 0.1), u = d.units || "mm",
      snug = +(d.snug || 0.2), loose = +(d.loose || 0.6), dec = (String(step).split(".")[1] || "").length;
    el.innerHTML = `<svg viewBox="0 0 640 220" role="img" aria-label="${d.alt || "A part inside an opening"}"></svg>
      <div class="sim__bar"><label>${d.gapLabel || "Opening"}: <input type="range" class="fitsim__r" min="${min}" max="${max}" step="${step}" value="${d.start || part}"></label>
      <span class="fitsim__val sim__phase"></span></div><p class="sim__say fitsim__say" aria-live="polite"></p>`;
    const svg = $("svg", el), r = $(".fitsim__r", el);
    function draw() {
      const g = +r.value, c = +(g - part).toFixed(dec + 1), k = 300 / max, pw = part * k, gw = g * k, cx = 320;
      const tight = +(d.tight || 0); const state = c < 0 ? ["Interference — too tight. It won't go in.", RED] : c < tight ? ["Very tight. Printed holes come out a little small, so it may not go on.", ORANGE] : c <= snug ? ["Just right — snug, no forcing.", GREEN] : c <= loose ? ["Loose, but it works.", ORANGE] : ["Slop — too loose. It wobbles.", RED];
      let s = `<rect x="${cx - gw / 2 - 60}" y="40" width="60" height="140" fill="#E7B98F" stroke="${ORANGE}" stroke-width="2"/><rect x="${cx + gw / 2}" y="40" width="60" height="140" fill="#E7B98F" stroke="${ORANGE}" stroke-width="2"/>`;
      s += `<rect x="${cx - pw / 2}" y="70" width="${pw}" height="80" rx="6" fill="#9DC3E6" stroke="${NAVY}" stroke-width="2" opacity=".92"/>`;
      if (c < 0) s += `<rect x="${cx - pw / 2}" y="70" width="${(pw - gw) / 2}" height="80" fill="${RED}" opacity=".55"/><rect x="${cx + gw / 2}" y="70" width="${(pw - gw) / 2}" height="80" fill="${RED}" opacity=".55"/>`;
      s += `<text x="${cx}" y="115" text-anchor="middle" font-size="15" font-weight="700" fill="${NAVY}">${d.partLabel || "Part"} ${part.toFixed(dec)} ${u}</text>`;
      s += `<text x="${cx}" y="205" text-anchor="middle" font-size="15" font-weight="700" fill="${GRAY}">${d.gapLabel || "Opening"} ${g.toFixed(dec)} ${u} · clearance ${c >= 0 ? "+" : ""}${c.toFixed(dec)} ${u}</text>`;
      svg.innerHTML = s; $(".fitsim__val", el).textContent = `${g.toFixed(dec)} ${u}`;
      $(".fitsim__say", el).innerHTML = `<strong style="color:${state[1]}">${state[0]}</strong> ${d.tip || ""}`;
    }
    r.addEventListener("input", draw); draw();
  });

  // ---------- Predict, then measure ----------
  $$(".predictsim").forEach(el => {
    el.innerHTML = `<svg viewBox="0 0 640 200" role="img" aria-label="A link with two holes on a grid. Each grid square is 0.25 inch."></svg>
      <div class="sim__bar"><label>My prediction: <input type="text" inputmode="decimal" class="dialsim__in predictsim__in" size="6" placeholder="0.00"> in</label>
      <button type="button" class="sim__btn sim__btn--go predictsim__go">Measure it</button><button type="button" class="sim__btn predictsim__new">New part</button></div>
      <p class="sim__say predictsim__say" aria-live="polite">Each grid square is 0.25 in. Estimate the distance between the two hole centers, then measure.</p>`;
    const svg = $("svg", el); let dist = 0;
    function draw(show) {
      const k = 100, x1 = 80, x2 = x1 + dist * k, y = 100; let s = "";
      for (let i = 0; i <= 24; i++) s += `<line x1="${30 + i * 25}" y1="20" x2="${30 + i * 25}" y2="180" stroke="#E3E8EF"/>`;
      for (let j = 0; j <= 6; j++) s += `<line x1="30" y1="${20 + j * 25}" x2="630" y2="${20 + j * 25}" stroke="#E3E8EF"/>`;
      s += `<rect x="${x1 - 40}" y="${y - 40}" width="${x2 - x1 + 80}" height="80" rx="40" fill="#9DC3E6" stroke="${NAVY}" stroke-width="3"/>`;
      s += `<circle cx="${x1}" cy="${y}" r="17" fill="#fff" stroke="${NAVY}" stroke-width="3"/><circle cx="${x2}" cy="${y}" r="17" fill="#fff" stroke="${NAVY}" stroke-width="3"/>`;
      if (show) s += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${ORANGE}" stroke-width="3"/><text x="${(x1 + x2) / 2}" y="${y - 50}" text-anchor="middle" font-size="18" font-weight="800" fill="${ORANGE}">${dist.toFixed(2)} in</text>`;
      svg.innerHTML = s;
    }
    function fresh() { dist = (150 + Math.floor(Math.random() * 300)) / 100; dist = Math.round(dist * 20) / 20; draw(false); $(".predictsim__in", el).value = ""; $(".predictsim__say", el).textContent = "Each grid square is 0.25 in. Estimate the distance between the two hole centers, then measure."; }
    $(".predictsim__go", el).addEventListener("click", () => {
      const g = parseFloat($(".predictsim__in", el).value); draw(true);
      if (isNaN(g)) { $(".predictsim__say", el).innerHTML = `Measured: <strong>${dist.toFixed(2)} in</strong>. Next time, write your prediction first.`; return; }
      const off = Math.abs(g - dist);
      $(".predictsim__say", el).innerHTML = `Measured: <strong>${dist.toFixed(2)} in</strong>. You were off by ${off.toFixed(2)} in. ${off <= 0.1 ? "Great estimate!" : off <= 0.3 ? "Close. Count the grid squares between centers." : "Count the grid squares between the hole centers: each is 0.25 in."}`;
    });
    $(".predictsim__new", el).addEventListener("click", fresh); fresh();
  });

  // ---------- Deviation calculator ----------
  $$(".devsim").forEach(el => {
    const des = +(el.dataset.designed || 2);
    el.innerHTML = `<div class="devsim__in">${["X · width", "Y · depth", "Z · height"].map((l, i) => `<label>${l}<input type="text" inputmode="decimal" data-i="${i}" placeholder="${des.toFixed(3)}"></label>`).join("")}</div>
      <svg viewBox="0 0 640 210" role="img" aria-label="Bar chart of deviation for each axis"></svg><p class="sim__say devsim__say" aria-live="polite"></p>`;
    const svg = $("svg", el);
    function draw() {
      const vals = $$("input", el).map(i => parseFloat(i.value)), dv = vals.map(v => isNaN(v) ? null : +(v - des).toFixed(3));
      let s = `<line x1="60" y1="105" x2="620" y2="105" stroke="${INK}" stroke-width="2"/><text x="52" y="110" text-anchor="end" font-size="13" fill="${GRAY}">0</text>`;
      s += `<rect x="60" y="${105 - 0.005 * 6000}" width="560" height="${0.01 * 6000}" fill="#E2EFDA" opacity=".7"/><text x="616" y="${105 - 0.005 * 6000 - 4}" text-anchor="end" font-size="12" fill="${GREEN}">±0.005 in</text>`;
      dv.forEach((d, i) => { const x = 130 + i * 170; s += `<text x="${x + 35}" y="200" text-anchor="middle" font-size="15" font-weight="700" fill="${NAVY}">${"XYZ"[i]}</text>`;
        if (d === null) return; const hgt = Math.max(-90, Math.min(90, d * 6000));
        s += `<rect x="${x}" y="${hgt >= 0 ? 105 - hgt : 105}" width="70" height="${Math.abs(hgt) || 1}" fill="${Math.abs(d) <= 0.005 ? GREEN : ORANGE}"/>`;
        s += `<text x="${x + 35}" y="${hgt >= 0 ? 100 - hgt : 122 - hgt}" text-anchor="middle" font-size="14" font-weight="800" fill="${INK}">${d >= 0 ? "+" : ""}${d.toFixed(3)}</text>`; });
      svg.innerHTML = s;
      const got = dv.filter(d => d !== null);
      if (got.length < 3) { $(".devsim__say", el).textContent = `Type your three caliper readings. Deviation = measured − ${des.toFixed(3)}.`; return; }
      const worst = dv.map(Math.abs).indexOf(Math.max(...dv.map(Math.abs))), big = Math.max(...dv.map(Math.abs));
      $(".devsim__say", el).innerHTML = `Biggest deviation: <strong>${"XYZ"[worst]}</strong> (${dv[worst] >= 0 ? "+" : ""}${dv[worst].toFixed(3)} in). ` +
        `For a hole that must fit a ${des.toFixed(3)} in peg on this printer, start around <strong>${(des + Math.max(0.01, big * 2)).toFixed(3)} in</strong> — a little bigger than the peg — then test it.`;
    }
    $$("input", el).forEach(i => i.addEventListener("input", draw)); draw();
  });
})();

/* ============================================================
   Interactives for Chapters 6–10
   ============================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NAVY = "#1F3864", ORANGE = "#C55A11", BLUE = "#2E75B6", GREEN = "#3F6B2A", RED = "#B42318", INK = "#1A1A1A", GRAY = "#5B6470", STEEL = "#C9D1DB", STEEL2 = "#9AA6B4", TAN = "#E7B98F";

  // ---------- Exploded skateboard ----------
  $$(".explodesim").forEach(el => {
    el.innerHTML = `<svg viewBox="0 0 640 330" role="img" aria-label="Side view of a skateboard that separates into its parts"></svg>
      <div class="sim__bar"><label class="dialsim__lab">Assembled <input type="range" class="explodesim__r" min="0" max="100" value="0"> Exploded</label>
      <button type="button" class="sim__btn explodesim__spin">Spin the wheels</button></div>
      <p class="sim__say">Drag the slider to pull the board apart. Every part here is its own model in Onshape, and mates hold them together in the Assembly.</p>`;
    const svg = $("svg", el), r = $(".explodesim__r", el); let spin = 0, spinning = false;
    function draw() {
      const ex = r.value / 100, cx = 320, cy = 80, dy = ex * 52; let s = "";
      s += `<path d="M${cx - 220},${cy} q-22,0 -34,-20 M${cx - 220},${cy} h440 q22,0 34,-20" fill="none" stroke="${NAVY}" stroke-width="10" stroke-linecap="round"/>`;
      [-1, 1].forEach(k => {
        const x = cx + k * 140;
        s += `<rect x="${x - 28}" y="${cy + 8 + dy}" width="56" height="11" rx="3" fill="${STEEL2}"/>`;
        s += `<path d="M${x - 22},${cy + 22 + dy * 1.6} h44 l-8,18 h-28 Z" fill="${STEEL}" stroke="${STEEL2}" stroke-width="2"/>`;
        s += `<rect x="${x - 7}" y="${cy + 19 + dy * 1.3}" width="14" height="8" rx="2" fill="${ORANGE}"/>`;
        const wy = cy + 62 + dy * 2.4;
        s += `<g transform="translate(${x},${wy}) rotate(${spin})"><circle r="24" fill="${TAN}" stroke="${ORANGE}" stroke-width="3"/><circle r="8" fill="#fff" stroke="${INK}" stroke-width="2"/><line x1="0" y1="-23" x2="0" y2="-10" stroke="${ORANGE}" stroke-width="4"/></g>`;
      });
      if (ex > .5) {
        const a = (ex - .5) * 2, lab = (x, y, t) => `<text x="${x}" y="${y}" font-size="14" font-weight="700" fill="${NAVY}" opacity="${a}">${t}</text>`;
        s += lab(cx - 40, cy - 14, "Deck") + lab(cx - 240, cy + 14 + dy, "Baseplate") + lab(cx - 280, cy + 40 + dy * 1.5, "Hanger + bushing") + lab(cx + 175, cy + 66 + dy * 2.4, "Wheel + bearing");
      }
      svg.innerHTML = s;
    }
    r.addEventListener("input", draw);
    $(".explodesim__spin", el).addEventListener("click", () => {
      if (spinning) return; spinning = true; const t0 = performance.now();
      const step = now => { spin = (now - t0) * .6; draw(); if (now - t0 < 2000) requestAnimationFrame(step); else spinning = false; };
      requestAnimationFrame(step);
    });
    draw();
  });

  // ---------- Overhang angle ----------
  $$(".overhangsim").forEach(el => {
    el.innerHTML = `<svg viewBox="0 0 640 300" role="img" aria-label="Layers stacking at an angle from vertical"></svg>
      <div class="sim__bar"><label class="dialsim__lab">Overhang angle <input type="range" class="overhangsim__r" min="0" max="75" value="30"></label><span class="sim__phase overhangsim__v"></span></div>
      <p class="sim__say overhangsim__say" aria-live="polite"></p>`;
    const svg = $("svg", el), r = $(".overhangsim__r", el);
    function draw() {
      const ang = +r.value, ok = ang <= 45, n = 11, lh = 20, off = lh * Math.tan(ang * Math.PI / 180); let s = "";
      s += `<line x1="20" y1="270" x2="620" y2="270" stroke="${INK}" stroke-width="4"/>`;
      for (let i = 0; i < n; i++) {
        const x = 120 + i * off, y = 250 - i * lh, prevX = 120 + (i - 1) * off;
        const unsupported = i > 0 ? Math.max(0, (x + 120) - (prevX + 120)) : 0;
        s += `<rect x="${x}" y="${y}" width="120" height="${lh}" fill="${ok ? "#BCD6EE" : "#F7C9C4"}" stroke="${ok ? NAVY : RED}" stroke-width="1"/>`;
        if (!ok && i > 0) s += `<rect x="${prevX + 120}" y="${y + lh}" width="${unsupported}" height="3" fill="${RED}"/>`;
      }
      if (!ok) { const lastX = 120 + (n - 1) * off; s += `<path d="M240,270 L${lastX + 120},${250 - (n - 1) * lh + lh} L${lastX + 120},270 Z" fill="none" stroke="${GRAY}" stroke-width="2" stroke-dasharray="6 5"/>`;
        s += `<text x="${(240 + lastX + 120) / 2 + 30}" y="262" text-anchor="middle" font-size="14" font-weight="700" fill="${GRAY}">support needed</text>`; }
      s += `<line x1="120" y1="270" x2="120" y2="40" stroke="${GRAY}" stroke-dasharray="4 4"/><text x="128" y="52" font-size="13" fill="${GRAY}">vertical</text>`;
      svg.innerHTML = s; $(".overhangsim__v", el).textContent = `${ang}° from vertical`;
      $(".overhangsim__say", el).innerHTML = ok ? `<strong style="color:${GREEN}">Prints fine.</strong> Each layer sits mostly on the one below it.` :
        `<strong style="color:${RED}">Needs support.</strong> Past about 45°, each layer hangs out over thin air. Try a chamfer, or turn the part so the slope is gentler.`;
    }
    r.addEventListener("input", draw); draw();
  });

  // ---------- Deck customizer (holes locked) ----------
  $$(".decksim").forEach(el => {
    el.innerHTML = `<svg viewBox="0 0 640 230" role="img" aria-label="Top view of a fingerboard deck with your choices"></svg>
      <div class="sim__bar">
        <label>Outline <select class="decksim__o"><option value="pop">Popsicle</option><option value="square">Square nose</option><option value="point">Pointed</option></select></label>
        <label>Graphic <select class="decksim__g"><option value="none">None</option><option value="star">Star</option><option value="stripe">Stripes</option><option value="text">My initials</option></select></label>
        <label>Initials <input type="text" class="decksim__t dialsim__in" maxlength="3" value="ABC" size="3"></label>
        <label>Grip <select class="decksim__p"><option value="none">None</option><option value="lines">Lines</option><option value="dots">Dots</option></select></label>
        <button type="button" class="sim__btn decksim__move">Move the holes?</button>
      </div><p class="sim__say decksim__say" aria-live="polite">Mix and match. The green holes are locked: they keep your Week 9 fit.</p>`;
    const svg = $("svg", el), say = $(".decksim__say", el);
    function draw() {
      const o = $(".decksim__o", el).value, g = $(".decksim__g", el).value, p = $(".decksim__p", el).value, x = 40, y = 25, w = 560, h = 180; let s = "";
      const clip = o === "point" ? `<path id="dk" d="M${x + 70},${y} L${x + w - 70},${y} L${x + w},${y + h / 2} L${x + w - 70},${y + h} L${x + 70},${y + h} L${x},${y + h / 2} Z"/>`
        : `<rect id="dk" x="${x}" y="${y}" width="${w}" height="${h}" rx="${o === "pop" ? 90 : 26}"/>`;
      s += `<defs><clipPath id="dkc">${clip}</clipPath></defs><use href="#dk" fill="#9DC3E6" stroke="${NAVY}" stroke-width="3"/>`;
      s += `<g clip-path="url(#dkc)">`;
      if (p === "lines") for (let i = 0; i < 40; i++) s += `<line x1="${x + i * 15}" y1="${y}" x2="${x + i * 15 - 60}" y2="${y + h}" stroke="${NAVY}" stroke-width="1.5" opacity=".3"/>`;
      if (p === "dots") for (let i = 0; i < 36; i++) for (let j = 0; j < 11; j++) s += `<circle cx="${x + 8 + i * 16}" cy="${y + 8 + j * 16}" r="2" fill="${NAVY}" opacity=".3"/>`;
      if (g === "stripe") s += `<rect x="${x}" y="${y + 70}" width="${w}" height="16" fill="${ORANGE}"/><rect x="${x}" y="${y + 96}" width="${w}" height="10" fill="#fff"/>`;
      s += `</g>`;
      if (g === "star") s += `<path d="M320,55 l20,42 l46,5 l-34,32 l9,46 l-41,-23 l-41,23 l9,-46 l-34,-32 l46,-5 Z" fill="${ORANGE}"/>`;
      if (g === "text") s += `<text x="320" y="138" text-anchor="middle" font-size="70" font-weight="900" fill="${ORANGE}" font-family="Arial Black,Arial,sans-serif">${($(".decksim__t", el).value || "").replace(/[<>&]/g, "").toUpperCase()}</text>`;
      [[150, 70], [150, 140], [195, 70], [195, 140], [445, 70], [445, 140], [490, 70], [490, 140]].forEach(([hx, hy]) => s += `<circle cx="${hx}" cy="${hy}" r="8" fill="#fff" stroke="${GREEN}" stroke-width="3.5"/>`);
      svg.innerHTML = s;
    }
    $$("select,input", el).forEach(i => i.addEventListener("input", () => { draw(); say.innerHTML = "Mix and match. The green holes are locked: they keep your Week 9 fit."; }));
    $(".decksim__move", el).addEventListener("click", () => { say.innerHTML = `<strong style="color:${RED}">Locked!</strong> Moving the holes or changing their size would undo the fit you tested in Week 9. Customize everything else.`; });
    draw();
  });

  // ---------- Is the drawing complete? ----------
  $$(".dimsim").forEach(el => {
    const D = [
      { k: "len", t: "Overall length: 96", need: 1 }, { k: "wid", t: "Overall width: 32", need: 1 }, { k: "thk", t: "Thickness", need: 1 },
      { k: "kick", t: "Kicktail height", need: 1 }, { k: "dia", t: "Hole Ø (bolt + clearance)", need: 1 }, { k: "sp1", t: "Hole spacing along the deck", need: 1 },
      { k: "sp2", t: "Hole spacing across the deck", need: 1 }, { k: "len2", t: "Length again, on the front view", need: 0, why: "Length is already on the top view. Each size once." },
      { k: "each", t: "Every hole's Ø, one by one (8 times)", need: 0, why: "Dimension one hole and note “8×”. Repeating it clutters the drawing." },
      { k: "color", t: "The deck's color", need: 0, why: "Color isn't a size. Put material in the title block instead." }];
    el.innerHTML = `<div class="dimsim__grid"><svg viewBox="0 0 520 300" role="img" aria-label="Working drawing of a fingerboard deck"></svg>
      <div class="dimsim__list">${D.map(d => `<label><input type="checkbox" value="${d.k}"> ${d.t}</label>`).join("")}</div></div>
      <div class="sim__bar"><button type="button" class="sim__btn sim__btn--go dimsim__check">Check my drawing</button><button type="button" class="sim__btn dimsim__clear">Clear</button></div>
      <p class="sim__say dimsim__say" aria-live="polite">Pick the dimensions your working drawing needs. Could a classmate build the deck from it?</p>`;
    const svg = $("svg", el), on = k => $(`input[value=${k}]`, el).checked;
    function arrowH(x1, x2, y, lab, c = BLUE) { return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${c}" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/><rect x="${(x1 + x2) / 2 - lab.length * 3.6 - 4}" y="${y - 9}" width="${lab.length * 7.2 + 8}" height="16" fill="#fff"/><text x="${(x1 + x2) / 2}" y="${y + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="${c}">${lab}</text>`; }
    function arrowV(x, y1, y2, lab, c = BLUE) { return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${c}" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="${x + 6}" y="${(y1 + y2) / 2 + 4}" font-size="12" font-weight="700" fill="${c}">${lab}</text>`; }
    function draw() {
      let s = `<defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="${BLUE}"/></marker></defs>`;
      s += `<rect x="60" y="50" width="360" height="110" rx="55" fill="#fff" stroke="${NAVY}" stroke-width="2.5"/>`;
      const H = [[145, 85], [145, 125], [170, 85], [170, 125], [310, 85], [310, 125], [335, 85], [335, 125]];
      H.forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="${NAVY}" stroke-width="2"/>`);
      s += `<path d="M60,240 q-18,-2 -26,-16 M60,240 h360 q18,-2 26,-16" fill="none" stroke="${NAVY}" stroke-width="3"/><path d="M60,246 h360" stroke="${NAVY}" stroke-width="1.5"/>`;
      s += `<text x="240" y="40" text-anchor="middle" font-size="11" fill="${GRAY}">TOP</text><text x="240" y="275" text-anchor="middle" font-size="11" fill="${GRAY}">FRONT</text>`;
      if (on("len")) s += arrowH(60, 420, 22, "96");
      if (on("wid")) s += arrowV(450, 50, 160, "32");
      if (on("sp1")) s += arrowH(145, 170, 178, "sp");
      if (on("sp2")) s += arrowV(120, 85, 125, "sp");
      if (on("dia")) s += `<line x1="335" y1="85" x2="370" y2="40" stroke="${BLUE}" stroke-width="1.5"/><text x="372" y="38" font-size="12" font-weight="700" fill="${BLUE}">8× Ø2.30</text>`;
      if (on("each")) H.forEach(([x, y], i) => s += `<text x="${x - 8}" y="${y + (i % 2 ? 18 : -9)}" font-size="9" fill="${RED}">Ø2.3</text>`);
      if (on("thk")) s += arrowV(470, 238, 248, "thk");
      if (on("kick")) s += arrowV(16, 224, 246, "kick");
      if (on("len2")) s += arrowH(60, 420, 290, "96", RED);
      if (on("color")) s += `<text x="240" y="110" text-anchor="middle" font-size="16" font-weight="800" fill="${RED}">BLUE</text>`;
      svg.innerHTML = s;
    }
    $$("input", el).forEach(i => i.addEventListener("change", draw));
    $(".dimsim__check", el).addEventListener("click", () => {
      const missing = D.filter(d => d.need && !on(d.k)).map(d => d.t), extra = D.filter(d => !d.need && on(d.k));
      const say = $(".dimsim__say", el);
      if (!missing.length && !extra.length) { say.innerHTML = `<strong style="color:${GREEN}">Complete!</strong> Every size is there, each one once. A classmate could build this deck.`; return; }
      say.innerHTML = (missing.length ? `<strong style="color:${RED}">Missing:</strong> ${missing.join(", ")}. ` : "") + extra.map(d => `<strong style="color:${ORANGE}">Remove “${d.t}”.</strong> ${d.why}`).join(" ");
    });
    $(".dimsim__clear", el).addEventListener("click", () => { $$("input", el).forEach(i => i.checked = false); draw(); $(".dimsim__say", el).textContent = "Pick the dimensions your working drawing needs. Could a classmate build the deck from it?"; });
    draw();
  });
})();

/* ============================================================
   Interactives for Chapters 11–15
   ============================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NAVY = "#1F3864", ORANGE = "#C55A11", BLUE = "#2E75B6", GREEN = "#3F6B2A", RED = "#B42318", INK = "#1A1A1A", GRAY = "#5B6470", TAN = "#E7B98F";

  // ---------- Kerf ----------
  $$(".kerfsim").forEach(el => {
    el.innerHTML = `<svg viewBox="0 0 640 250" role="img" aria-label="A laser-cut square part and a cut hole compared with their drawn sizes"></svg>
      <div class="sim__bar"><label class="dialsim__lab">Kerf <input type="range" class="kerfsim__r" min="0.05" max="0.40" step="0.05" value="0.20"></label><span class="sim__phase kerfsim__v"></span></div>
      <p class="sim__say kerfsim__say" aria-live="polite"></p>`;
    const svg = $("svg", el), r = $(".kerfsim__r", el);
    function draw() {
      const k = +r.value, Z = 8, sq = 20, part = sq - k, hole = 10 + k; let s = "";
      // part (zoomed, exaggerated x10 for the kerf ring)
      const P = 170, ex = k * Z * 5;
      s += `<rect x="${P - sq * Z / 2}" y="${120 - sq * Z / 2}" width="${sq * Z}" height="${sq * Z}" fill="none" stroke="${BLUE}" stroke-width="2" stroke-dasharray="8 6"/>`;
      s += `<rect x="${P - sq * Z / 2 + ex / 2}" y="${120 - sq * Z / 2 + ex / 2}" width="${sq * Z - ex}" height="${sq * Z - ex}" fill="${TAN}" stroke="${ORANGE}" stroke-width="2"/>`;
      s += `<text x="${P}" y="240" text-anchor="middle" font-size="15" font-weight="700" fill="${NAVY}">Part: drawn 20.00 → cut ${part.toFixed(2)} mm</text>`;
      // sheet with hole
      const H = 470;
      s += `<rect x="${H - 90}" y="30" width="180" height="180" fill="${TAN}" stroke="${ORANGE}" stroke-width="2"/>`;
      s += `<circle cx="${H}" cy="120" r="${40 + ex / 2}" fill="#FAFBFD" stroke="${ORANGE}" stroke-width="2"/><circle cx="${H}" cy="120" r="40" fill="none" stroke="${BLUE}" stroke-width="2" stroke-dasharray="8 6"/>`;
      s += `<text x="${H}" y="240" text-anchor="middle" font-size="15" font-weight="700" fill="${NAVY}">Hole: drawn 10.00 → cut ${hole.toFixed(2)} mm</text>`;
      svg.innerHTML = s; $(".kerfsim__v", el).textContent = `${k.toFixed(2)} mm`;
      $(".kerfsim__say", el).innerHTML = `The beam removes ${k.toFixed(2)} mm along every cut line. <strong>Parts come out smaller</strong> and <strong>holes come out bigger</strong> than you drew them. (The kerf ring is drawn 5× wider so you can see it.)`;
    }
    r.addEventListener("input", draw); draw();
  });

  // ---------- Tab and slot press fit ----------
  $$(".slotsim").forEach(el => {
    const thick = +(el.dataset.thick || 3.0), kerf = +(el.dataset.kerf || 0.2);
    el.innerHTML = `<svg viewBox="0 0 640 230" role="img" aria-label="A plywood tab entering a laser-cut slot"></svg>
      <div class="sim__bar"><label class="dialsim__lab">Drawn slot <input type="range" class="slotsim__r" min="${(thick - 0.6).toFixed(1)}" max="${(thick + 0.4).toFixed(1)}" step="0.05" value="${thick.toFixed(2)}"></label><span class="sim__phase slotsim__v"></span></div>
      <p class="sim__say slotsim__say" aria-live="polite"></p>`;
    const svg = $("svg", el), r = $(".slotsim__r", el);
    function draw() {
      const drawn = +r.value, cut = +(drawn + kerf).toFixed(2), c = +(cut - thick).toFixed(2), K = 40, cx = 320; let s = "";
      const state = c < -0.1 ? ["Too tight. The tab won't press in.", RED] : c <= 0.05 ? ["Snug press fit. Holds with no glue.", GREEN] : c <= 0.2 ? ["Loose. The joint wobbles.", ORANGE] : ["Falls apart.", RED];
      s += `<rect x="${cx - cut * K / 2 - 180}" y="130" width="180" height="70" fill="${TAN}" stroke="${ORANGE}" stroke-width="2"/><rect x="${cx + cut * K / 2}" y="130" width="180" height="70" fill="${TAN}" stroke="${ORANGE}" stroke-width="2"/>`;
      s += `<rect x="${cx - thick * K / 2}" y="${c < -0.1 ? 40 : 70}" width="${thick * K}" height="${c < -0.1 ? 90 : 130}" fill="#E2B07F" stroke="${NAVY}" stroke-width="2"/>`;
      s += `<text x="${cx}" y="25" text-anchor="middle" font-size="15" font-weight="700" fill="${NAVY}">Tab (plywood) ${thick.toFixed(2)} mm</text>`;
      s += `<text x="${cx}" y="222" text-anchor="middle" font-size="15" font-weight="700" fill="${GRAY}">drawn ${drawn.toFixed(2)} + kerf ${kerf.toFixed(2)} = cut slot ${cut.toFixed(2)} mm</text>`;
      svg.innerHTML = s; $(".slotsim__v", el).textContent = `${drawn.toFixed(2)} mm`;
      $(".slotsim__say", el).innerHTML = `<strong style="color:${state[1]}">${state[0]}</strong> Rule: draw the slot = thickness − kerf (${thick.toFixed(1)} − ${kerf.toFixed(1)} = ${(thick - kerf).toFixed(1)} mm).`;
    }
    r.addEventListener("input", draw); draw();
  });

  // ---------- Configuration table + printer shrink ----------
  $$(".configsim").forEach(el => {
    const rows = [0.2, 0.3, 0.4];
    el.innerHTML = `<div class="configsim__grid"><table class="dtable configsim__t"><thead><tr><th>Configuration</th><th>Socket clearance</th></tr></thead><tbody>
      ${rows.map((c, i) => `<tr><td><label><input type="radio" name="cfg${el.id || ""}" value="${c}" ${i === 1 ? "checked" : ""}> Clearance ${i + 1}</label></td><td>+${c.toFixed(1)} mm</td></tr>`).join("")}</tbody></table>
      <svg viewBox="0 0 260 220" role="img" aria-label="Top view of a peg in a printed socket"></svg></div>
      <div class="sim__bar"><label class="dialsim__lab">This printer makes holes smaller by <input type="range" class="configsim__s" min="0" max="0.30" step="0.05" value="0.15"></label><span class="sim__phase configsim__v"></span></div>
      <p class="sim__say configsim__say" aria-live="polite"></p>`;
    const svg = $("svg", el), sh = $(".configsim__s", el);
    function draw() {
      const clr = +$("input[type=radio]:checked", el).value, shrink = +sh.value, eff = +(clr - shrink).toFixed(2);
      const state = eff < 0.05 ? ["Too tight", RED] : eff <= 0.2 ? ["Just right", GREEN] : ["Too loose", ORANGE];
      const pr = 60, sr = pr + Math.max(-.08, eff) * 120;
      svg.innerHTML = `<rect x="30" y="10" width="200" height="200" rx="12" fill="${TAN}" stroke="${ORANGE}" stroke-width="3"/><circle cx="130" cy="110" r="${Math.max(sr, 40)}" fill="#FAFBFD" stroke="${ORANGE}" stroke-width="3"/>
        <circle cx="130" cy="110" r="${pr}" fill="#9DC3E6" stroke="${NAVY}" stroke-width="3" opacity=".92"/>${eff < 0 ? `<circle cx="130" cy="110" r="${pr}" fill="none" stroke="${RED}" stroke-width="6" opacity=".6"/>` : ""}`;
      $(".configsim__v", el).textContent = `${shrink.toFixed(2)} mm`;
      $(".configsim__say", el).innerHTML = `Designed clearance +${clr.toFixed(1)} − printer shrink ${shrink.toFixed(2)} = <strong>${eff >= 0 ? "+" : ""}${eff.toFixed(2)} mm real clearance</strong>. <strong style="color:${state[1]}">${state[0]}.</strong> That's why the class tests real coupons instead of guessing.`;
    }
    $$("input", el).forEach(i => i.addEventListener("input", draw)); draw();
  });

  // ---------- Branch and merge ----------
  $$(".branchsim").forEach(el => {
    el.innerHTML = `<svg viewBox="0 0 640 200" role="img" aria-label="A version graph with a main line and a branch"></svg>
      <div class="sim__bar"><button type="button" class="sim__btn" data-a="save">Save a version on main</button><button type="button" class="sim__btn" data-a="branch">Make a branch</button>
      <button type="button" class="sim__btn" data-a="edit">Edit on the branch</button><button type="button" class="sim__btn sim__btn--go" data-a="merge">Merge into main</button><button type="button" class="sim__btn" data-a="reset">Reset</button></div>
      <p class="sim__say branchsim__say" aria-live="polite">Build the version graph. Try a change on a branch, then merge it back.</p>`;
    let main = 1, br = null, merged = 0; const say = $(".branchsim__say", el), svg = $("svg", el);
    function draw() {
      let s = ""; const X = i => 50 + i * 80, YM = 140, YB = 60;
      const endMain = main - 1 + merged;
      s += `<line x1="${X(0)}" y1="${YM}" x2="${X(Math.max(endMain, 0))}" y2="${YM}" stroke="${NAVY}" stroke-width="5"/>`;
      for (let i = 0; i < main; i++) s += `<circle cx="${X(i)}" cy="${YM}" r="10" fill="${NAVY}"/>`;
      s += `<text x="${X(0)}" y="${YM + 34}" font-size="13" font-weight="700" fill="${NAVY}">main</text>`;
      if (br) {
        const x0 = X(br.from); let x = x0;
        s += `<path d="M${x0},${YM} C${x0 + 30},${YB} ${x0 + 50},${YB} ${x0 + 80},${YB}" fill="none" stroke="${ORANGE}" stroke-width="5"/>`;
        for (let j = 1; j <= br.n; j++) { x = x0 + j * 80; if (j > 1) s += `<line x1="${x - 80}" y1="${YB}" x2="${x}" y2="${YB}" stroke="${ORANGE}" stroke-width="5"/>`; s += `<circle cx="${x}" cy="${YB}" r="10" fill="${ORANGE}"/>`; }
        s += `<text x="${x0 + 60}" y="${YB - 20}" font-size="13" font-weight="700" fill="${ORANGE}">my-section branch</text>`;
        if (br.merged) s += `<path d="M${x},${YB} C${x + 40},${YB} ${X(br.mergeAt) - 30},${YM} ${X(br.mergeAt)},${YM}" fill="none" stroke="${ORANGE}" stroke-width="5"/><circle cx="${X(br.mergeAt)}" cy="${YM}" r="13" fill="${GREEN}"/>`;
      }
      svg.innerHTML = s;
    }
    $$("button", el).forEach(b => b.addEventListener("click", () => {
      const a = b.dataset.a;
      if (a === "reset") { main = 1; br = null; merged = 0; say.textContent = "Build the version graph. Try a change on a branch, then merge it back."; }
      if (a === "save") { if (main > 6) return; main++; say.textContent = "Saved a version on main. Versions let you go back if something breaks."; }
      if (a === "branch") { if (br && !br.merged) { say.textContent = "You already have a branch open. Edit on it, then merge."; } else { br = { from: main - 1, n: 0, merged: false }; say.innerHTML = "Branch made. Changes here <strong>don't touch main</strong> until you merge."; } }
      if (a === "edit") { if (!br || br.merged) { say.textContent = "Make a branch first, so your experiment can't break main."; } else if (br.n < 3) { br.n++; say.textContent = "Edited on the branch. Main is still safe."; } }
      if (a === "merge") { if (!br || br.merged) say.textContent = "Nothing to merge yet. Make a branch and edit on it first."; else if (!br.n) say.textContent = "Edit on the branch before you merge."; else { br.merged = true; br.mergeAt = Math.max(main, br.from + br.n + 1); main = br.mergeAt + 1; say.innerHTML = `<strong style="color:${GREEN}">Merged!</strong> Your branch's changes are now part of main.`; } }
      draw();
    }));
    draw();
  });

  // ---------- Pre-flight checker ----------
  $$(".preflight").forEach(el => {
    const items = ["Pegs and sockets match the class standard and clearance", "Largest flat face on the plate, no supports needed", "Nothing thinner than about 1 mm", "Size checked in Onshape with the Measure tool, in mm"];
    el.innerHTML = `<div class="preflight__dims"><label>Length (mm)<input type="text" inputmode="decimal" data-d="0" value="150"></label><label>Width (mm)<input type="text" inputmode="decimal" data-d="1" value="96"></label><label>Height (mm)<input type="text" inputmode="decimal" data-d="2" value="40"></label>
      <label class="preflight__name">File name<input type="text" class="preflight__f" value="Team07_Ramp.3mf"></label></div>
      <div class="preflight__list">${items.map((t, i) => `<label><input type="checkbox" data-i="${i}"> ${t}</label>`).join("")}</div>
      <p class="sim__say preflight__say" aria-live="polite"></p>`;
    const say = $(".preflight__say", el);
    function check() {
      const d = $$("[data-d]", el).map(i => parseFloat(i.value)), fname = $(".preflight__f", el).value.trim();
      const probs = [];
      if (d.some(isNaN)) probs.push("Type all three sizes.");
      else if (d.some(v => v > 180)) probs.push(`<strong>Too big:</strong> ${["length", "width", "height"].filter((_, i) => d[i] > 180).join(" and ")} over 180 mm. Split it into connecting sections.`);
      if (!/^Team\d{2}_[A-Za-z0-9-]+\.3mf$/.test(fname)) probs.push(`<strong>File name:</strong> use <code>Team##_SectionName.3mf</code>, like Team07_Ramp.3mf.`);
      const unchecked = $$("[data-i]", el).filter(c => !c.checked).length;
      if (unchecked) probs.push(`${unchecked} checklist item${unchecked > 1 ? "s" : ""} not checked yet.`);
      say.innerHTML = probs.length ? probs.join(" ") : `<strong style="color:${GREEN}">Ready for print!</strong> Submit by Thursday, May 13.`;
    }
    $$("input", el).forEach(i => i.addEventListener("input", check)); check();
  });

  // ---------- fitsim press-fit mode is handled by .slotsim ----------
})();
