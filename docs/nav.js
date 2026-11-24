/* ============================================================
   nav.js — one source of truth for the whole book's navigation.
   Add a chapter here and every page's sidebar + pager updates.
   Each page sets <body data-chapter="N"> (or data-chapter="index").
   Pages with file:"" are placeholders (not yet written).
   ============================================================ */

const BOOK = [
  { unit: "Getting Started", chapters: [
    { n: "GS", title: "Start Here", file: "start-here.html" },
    { n: "DEV", title: "Laptop or iPad?", file: "devices.html" },
  ]},
  { unit: "Modules", chapters: [
    { n: 1, title: "V5 in Onshape", file: "module-1.html" },
    { n: 2, title: "Custom printed parts", file: "module-2.html" },
    { n: 3, title: "Gears & drivetrains", file: "module-3.html" },
    { n: 4, title: "Mechanisms", file: "module-4.html" },
    { n: 5, title: "Laser-cut plates", file: "module-5.html" },
    { n: 6, title: "Subsystem project", file: "module-6.html" },
  ]},
  { unit: "Reference", chapters: [
    { n: "V5", title: "V5 Quick Facts", file: "v5-facts.html" },
  ]},
];

(function () {
  const current = document.body.getAttribute("data-chapter");
  const flat = BOOK.flatMap(u => u.chapters);

  // ----- Sidebar -----
  const toc = document.getElementById("toc");
  if (toc) {
    let html = `<p class="toc__head">Contents</p>`;
    html += `<div class="toc__unit"><a href="index.html"${current === "index" ? ' aria-current="page"' : ""}><span class="num">▣</span><span>Cover &amp; overview</span></a></div>`;
    for (const u of BOOK) {
      html += `<div class="toc__unit"><span class="unit-label">${u.unit}</span>`;
      for (const c of u.chapters) {
        const isCur = String(c.n) === current;
        const numTxt = typeof c.n === "number" ? String(c.n).padStart(2, "0") : c.n;
        if (c.file) {
          html += `<a href="${c.file}"${isCur ? ' aria-current="page"' : ""}><span class="num">${numTxt}</span><span>${c.title}</span></a>`;
        } else {
          html += `<span class="dim"><span class="num">${numTxt}</span><span>${c.title}</span></span>`;
        }
      }
      html += `</div>`;
    }
    toc.innerHTML = html;
  }

  // ----- Prev / next pager -----
  const pager = document.getElementById("pager");
  if (pager && current !== "index") {
    const idx = flat.findIndex(c => String(c.n) === current);
    const prev = idx > 0 ? flat[idx - 1] : null;
    const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
    let html = "";
    if (prev && prev.file) {
      html += `<a class="prev" href="${prev.file}"><span class="dir">← Previous</span><span class="name">${prev.n}. ${prev.title}</span></a>`;
    } else { html += `<span class="ph"></span>`; }
    if (next && next.file) {
      html += `<a class="next" href="${next.file}"><span class="dir">Next →</span><span class="name">${next.n}. ${next.title}</span></a>`;
    } else if (next) {
      html += `<span class="ph"></span>`;
    }
    pager.innerHTML = html;
  }

  // ----- Mobile menu toggle -----
  const btn = document.getElementById("menuBtn");
  if (btn && toc) {
    btn.addEventListener("click", () => toc.classList.toggle("open"));
  }
})();
