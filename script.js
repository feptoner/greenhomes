(() => {
"use strict";

/* ============ EDIT YOUR BUSINESS DETAILS HERE ============
   Leave a value empty ("") and it is hidden / handled honestly. */
const CONFIG = {
  phone: "+91 9670704470",
  whatsapp: "919670704470",   // digits with country code
  email: "",                  // not supplied yet - hidden until added
  location: "390, Utraula Rd, near Kunmun Baggi Wale, Raja Mohalla, Khaira, Gonda, Uttar Pradesh 271003",
  hours: "Closes 9 pm (check Google for today’s hours)",
  rating: { score: "4.8", count: 28 },   // from the Google Business listing
  social: {}                  // e.g. { Instagram: "https://instagram.com/yourpage" }
};
const R = CONFIG.rating;
const MAPS = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Green Homes Interior " + CONFIG.location);

/* Photos live in the SAME folder as index.html (no images/ folder). */
const PHOTOS = [
  { src: "37305.jpg", ar: "1462/1076", cat: "Living Rooms", t: "Warm Contemporary Living Room", alt: "Living room with a beige leather sofa, fluted wood panels, gold-veined marble feature walls and warm cove lighting" },
  { src: "37306.jpg", ar: "1377/1142", cat: "Bedrooms", t: "Marble & Wood Bedroom", alt: "Bedroom with a grey upholstered headboard, marble feature walls, fluted wood panels, a sofa and lit ceiling coves" },
  { src: "37309.jpg", ar: "1476/1066", cat: "Kitchens", t: "L-Shaped Modular Kitchen", alt: "L-shaped kitchen with glossy beige cabinets, built-in oven, colourful tile backsplash and under-cabinet lighting" },
  { src: "37308.jpg", ar: "1658/949", cat: "Commercial", t: "Executive Office Cabin", alt: "Office cabin with a dark desk, four visitor chairs, a textured gold wall, wood slats and framed leaf artwork" },
  { src: "37307.jpg", ar: "1864/844", cat: "Commercial", t: "Retail Showroom Interior", alt: "Long retail showroom with wooden shelving, track lighting and a polished white floor" },
  { src: "37310.jpg", ar: "1409/1117", cat: "Doors & Joinery", t: "Panelled Doors with Frosted Glass", alt: "Sage-green panelled doors with frosted glass panes and warm LED strip lighting" },
  { src: "37304.jpg", ar: "1604/981", cat: "Commercial", t: "Retail Storefront Entrance", alt: "Illuminated retail storefront with a red entrance frame, signage boards and a red carpet" }
];
const P = i => PHOTOS[i];

/* Configurable service categories (edit, add or remove freely). */
const SERVICES = [
  /* conf:1 = listed on the Google Business profile. img:null = no photo yet. */
  { id: "bedroom", t: "Bedroom Design", img: 1, conf: 1, d: "Calm, well-lit bedrooms with headboards, wardrobes, side units and textiles planned together." },
  { id: "bathroom", t: "Bathroom Design", img: null, conf: 1, d: "Practical, easy-to-maintain bathrooms with considered storage, finishes and lighting." },
  { id: "cabinetry", t: "Cabinetry, Doors & Hardware", img: 5, conf: 1, d: "Cabinetry, doors, panelling and hardware that tie rooms together with a consistent finish." },
  { id: "living", t: "Living Room Design", img: 0, d: "Seating layouts, feature walls, lighting and finishes that make the room you use most feel considered." },
  { id: "kitchen", t: "Modular Kitchen Design", img: 2, d: "Functional layouts with storage, appliances, surfaces and task lighting that suit how you cook." },
  { id: "planning", t: "Space Planning & Layout", img: 3, d: "Furniture placement and circulation planning so every area works for the people using it." },
  { id: "commercial", t: "Commercial & Retail Interiors", img: 4, d: "Showrooms, shops and offices designed for flow, display and a welcoming first impression." }
];
/* ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const app = $("#app");
let lbList = [], lbI = 0, io = null;

/* ---------- safe DOM helper ---------- */
const h = (tag, a = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(a)) {
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  e.append(...kids.flat().filter(x => x != null && x !== false));
  return e;
};
const wrap = (...k) => h("div", { class: "wrap" }, ...k);
const sec = (cls, ...k) => h("section", { class: "sec " + cls }, wrap(...k));
const btn = (t, href, p) => h("a", { class: "btn" + (p ? " p" : ""), href }, t, h("span", { class: "ar", "aria-hidden": "true" }, "→"));
const ph = (p, ar) => h("span", { class: "ph", style: "--ar:" + (ar || p.ar) }, h("img", { src: p.src, alt: p.alt, loading: "lazy", decoding: "async" }));
const tile = (p, i) => {
  const f = ph(p);
  f.append(h("span", { class: "cap", text: p.t }));
  return h("button", { class: "tile rv", type: "button", "data-lb": i, "aria-label": "View larger: " + p.t }, f);
};
const cta = (title, text) => h("div", { class: "cta rv" }, h("h2", {}, title), h("p", { text }), h("div", { class: "acts" }, btn("Request a Consultation", "#/contact", 1), btn("See Our Work", "#/portfolio")));
const intro = (title, text) => h("section", { class: "sec top" }, wrap(h("h1", { class: "rv" }, ...title), h("p", { class: "rv", text, style: "max-width:40em;font-size:1.1rem" })));
const waDigits = () => CONFIG.whatsapp.replace(/\D/g, "");

/* ---------- theme ---------- */
const store = {
  get() { try { return localStorage.getItem("ghi-theme"); } catch { return null; } },
  set(v) { try { localStorage.setItem("ghi-theme", v); } catch { /* storage unavailable */ } }
};
function setTheme(t, save) {
  root.dataset.theme = t;
  const b = $("#theme");
  b.textContent = t === "dark" ? "☀" : "☾";
  b.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  if (save) store.set(t);
}

/* ---------- menu ---------- */
const menu = o => {
  $("#hd").classList.toggle("open", o);
  $("#mn").setAttribute("aria-expanded", String(o));
  document.body.classList.toggle("lock", o);
};

/* ---------- lightbox ---------- */
const lb = $("#lb");
function showLb(i) {
  if (!lbList.length) return;
  lbI = (i + lbList.length) % lbList.length;
  const p = lbList[lbI];
  $("img", lb).src = p.src;
  $("img", lb).alt = p.alt;
  $("figcaption", lb).textContent = p.t + " (" + (lbI + 1) + "/" + lbList.length + ")";
  if (!lb.open) { lb.showModal(); document.body.classList.add("lock"); }
}
let tx = 0;
lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
lb.addEventListener("close", () => document.body.classList.remove("lock"));
lb.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") showLb(lbI - 1);
  if (e.key === "ArrowRight") showLb(lbI + 1);
});
lb.addEventListener("touchstart", e => { tx = e.changedTouches[0].clientX; }, { passive: true });
lb.addEventListener("touchend", e => {
  const d = e.changedTouches[0].clientX - tx;
  if (Math.abs(d) > 50) showLb(lbI + (d < 0 ? 1 : -1));
}, { passive: true });
$(".lb-x", lb).onclick = () => lb.close();
$(".lb-p", lb).onclick = () => showLb(lbI - 1);
$(".lb-n", lb).onclick = () => showLb(lbI + 1);

const svcVisual = s => s.img == null
  ? h("div", { class: "ph soft", style: "--ar:4/3" }, h("div", {}, s.t, h("small", { text: "Project photos coming soon" })))
  : ph(P(s.img), "4/3");
const rate = () => R && R.score ? h("a", { class: "rate", href: MAPS, target: "_blank", rel: "noopener noreferrer", "aria-label": "Rated " + R.score + " out of 5 from " + R.count + " Google reviews. Opens Google Maps." },
  h("span", { class: "stars", "aria-hidden": "true" }, "★★★★★"), h("strong", { text: R.score }), h("span", { text: "· " + R.count + " Google reviews" })) : null;
const ext = (t, href, p) => h("a", { class: "btn" + (p ? " p" : ""), href, target: "_blank", rel: "noopener noreferrer" }, t);
const marquee = () => {
  const items = ["Marble feature walls", "Fluted wood panelling", "Cove lighting", "Modular kitchens", "Bedrooms", "Cabinetry & hardware", "Commercial interiors"];
  const row = () => items.map(t => h("span", { text: t }));
  return h("div", { class: "mq", "aria-hidden": "true" }, h("div", { class: "mqt" }, row(), row()));
};
const facts = () => {
  const f = (b, l, href, ex) => h(href ? "a" : "div", { class: "fact rv", href, target: ex ? "_blank" : null, rel: ex ? "noopener noreferrer" : null }, b, h("span", { text: l }));
  return h("section", { class: "sec tight" }, wrap(h("div", { class: "facts" },
    R.score ? f(h("b", { class: "cnt", "data-to": R.score, "data-dec": 1, text: R.score }), "Google rating out of 5", MAPS, 1) : null,
    R.count ? f(h("b", { class: "cnt", "data-to": R.count, text: String(R.count) }), "Google reviews", MAPS, 1) : null,
    CONFIG.location ? f(h("b", { class: "sm", text: "Gonda, UP" }), "Get directions", MAPS, 1) : null,
    CONFIG.phone ? f(h("b", { class: "sm", text: CONFIG.phone }), "Call the studio", "tel:" + CONFIG.phone.replace(/[^\d+]/g, "")) : null)));
};
function explorer() {
  const out = h("div", { class: "ex-out", "aria-live": "polite" });
  const bar = h("div", { class: "ex-bar", role: "group", "aria-label": "Choose a service" },
    SERVICES.map((s, i) => h("button", { type: "button", "data-i": i, text: s.t })));
  const show = i => {
    const s = SERVICES[i];
    out.replaceChildren(svcVisual(s), h("div", {}, h("h3", { text: s.t }), h("p", { text: s.d }), btn("Enquire about this", "#/contact?service=" + s.id, 1)));
    $$("button", bar).forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
  };
  bar.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) show(+b.dataset.i); });
  show(0);
  return h("div", { class: "ex rv" }, bar, out);
}
const visit = () => h("div", { class: "visit rv" },
  h("div", {}, h("h3", { text: "Visit or call the studio" }), CONFIG.location ? h("p", { text: CONFIG.location }) : null, CONFIG.hours ? h("p", { class: "hrs", text: CONFIG.hours }) : null, rate()),
  h("div", { class: "acts" },
    CONFIG.location ? ext("Get Directions", MAPS, 1) : null,
    CONFIG.phone ? h("a", { class: "btn", href: "tel:" + CONFIG.phone.replace(/[^\d+]/g, "") }, "Call " + CONFIG.phone) : null,
    waDigits() ? ext("WhatsApp", "https://wa.me/" + waDigits()) : null));

/* ---------- contact info (only what is configured) ---------- */
function contactItems() {
  const c = CONFIG, o = [];
  const L = (t, href, ext) => h("a", { href, rel: ext ? "noopener noreferrer" : null, target: ext ? "_blank" : null }, t);
  if (c.phone) o.push(L("Call " + c.phone, "tel:" + c.phone.replace(/[^\d+]/g, "")));
  if (waDigits()) o.push(L("Chat on WhatsApp", "https://wa.me/" + waDigits(), 1));
  if (c.email) o.push(L(c.email, "mailto:" + c.email));
  if (c.location) { o.push(h("span", { text: c.location })); o.push(L("Get directions on Google Maps", MAPS, 1)); }
  if (c.hours) o.push(h("span", { text: c.hours }));
  Object.entries(c.social).forEach(([n, u]) => u && o.push(L(n, u, 1)));
  return o;
}

/* ---------- pages ---------- */
function Home() {
  lbList = PHOTOS.slice(3, 6);
  const hero = h("section", { class: "hero" },
    h("img", { src: P(0).src, alt: P(0).alt, fetchpriority: "high", decoding: "async" }),
    h("div", { class: "glow", "aria-hidden": "true" }),
    wrap(
      h("span", { class: "badge" }, h("i"), "Interior designer · Gonda, UP"),
      h("h1", {}, "Spaces that feel like ", h("span", { class: "grad" }, "home.")),
      h("p", { text: "Thoughtfully planned interiors where beauty, comfort and everyday function come together." }),
      h("div", { class: "acts" }, btn("Discuss Your Project", "#/contact", 1), btn("View Portfolio", "#/portfolio")),
      h("div", { class: "hero-meta" }, rate())
    ));
  const feat = sec("",
    h("h2", { class: "rv" }, "Featured ", h("span", { class: "grad" }, "interiors")),
    h("p", { class: "rv", text: "Labels describe what each photograph shows; they are visual categories, not client project names." }),
    h("div", { class: "fx" }, [0, 1, 2].map(i => {
      const f = ph(P(i)); f.append(h("span", { class: "cap", text: P(i).t }));
      return h("a", { class: "rv" + (i ? "" : " big"), href: "#/portfolio?c=" + encodeURIComponent(P(i).cat), "aria-label": P(i).t + " – view in portfolio" }, f);
    })));
  const svc = sec("",
    h("h2", { class: "rv" }, "What we can ", h("span", { class: "grad" }, "design")),
    h("p", { class: "rv", text: "Pick a service to see what it can involve, then send an enquiry for your own space." }),
    explorer(),
    h("div", { class: "acts" }, btn("All Services", "#/services")));
  const phil = sec("",
    h("div", { class: "split" },
      h("div", { class: "rv" }, ph(P(2), "4/3")),
      h("div", { class: "rv" },
        h("h2", {}, "Our design ", h("span", { class: "grad" }, "philosophy")),
        h("p", { text: "A well-designed interior is planned before it is decorated. These are the principles we design by." }),
        h("ul", { class: "ticks" }, ["Better use of available space", "A cohesive look from room to room", "Comfortable everyday movement", "Thoughtful lighting and storage", "A home suited to the people who live in it"].map(t => h("li", { text: t }))))),
    h("div", { class: "cards" }, [
      ["Space planning", "Layouts that respect how you move, work and relax."],
      ["Material & colour harmony", "Wood, stone, fabric and finishes chosen to work together."],
      ["Light & balance", "Layered lighting and visual balance that shape the mood of a room."]
    ].map(([t, d], i) => h("div", { class: "card rv" }, h("span", { class: "num" }, i + 1), h("h3", { text: t }), h("p", { text: d })))));
  const gal = sec("",
    h("h2", { class: "rv" }, "Gallery ", h("span", { class: "grad" }, "preview")),
    h("div", { class: "mas" }, lbList.map((p, i) => tile(p, i))),
    h("div", { class: "acts" }, btn("Explore Our Portfolio", "#/portfolio", 1)));
  return h("div", {}, hero, marquee(), facts(), feat, svc, phil, gal, sec("", visit()), sec("", cta("Let’s create a space you’ll love coming home to.", "Tell us about your space and what you have in mind. We’ll take it from there.")));
}

function Services() {
  return h("div", {},
    intro(["Design ", h("span", { class: "grad" }, "services")], "Choose the kind of space you’re planning. Each category below can be tailored to your home, budget and taste."),
    sec("", SERVICES.map(s => h("article", { class: "row split", id: s.id },
      h("div", { class: "rv" }, svcVisual(s)),
      h("div", { class: "rv" }, s.conf ? h("span", { class: "tag", text: "Listed on our Google profile" }) : null, h("h2", { text: s.t }), h("p", { text: s.d }), btn("Enquire about this", "#/contact?service=" + s.id, 1))))),
    sec("", cta("Not sure where to start?", "Send a short enquiry and describe your space; we’ll help you work out the right approach.")));
}

function Portfolio(q) {
  const cats = ["All", ...new Set(PHOTOS.map(p => p.cat))];
  const start = cats.includes(q.get("c")) ? q.get("c") : "All";
  const grid = h("div", { class: "mas", id: "grid" });
  const empty = h("p", { class: "empty", hidden: "", text: "No photographs in this category yet." });
  const fl = h("div", { class: "fl", role: "group", "aria-label": "Filter portfolio by room" },
    cats.map(c => h("button", { type: "button", "data-f": c, "aria-pressed": String(c === start), text: c })));
  function draw(c) {
    lbList = PHOTOS.filter(p => c === "All" || p.cat === c);
    grid.replaceChildren(...lbList.map((p, i) => tile(p, i)));
    empty.hidden = lbList.length > 0;
    $$("button", fl).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.f === c)));
    reveal();
  }
  fl.addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (b) draw(b.dataset.f); });
  const page = h("div", {},
    intro(["Our ", h("span", { class: "grad" }, "portfolio")], "Warm materials, layered lighting and carefully balanced layouts. Tap any photograph to view it larger."),
    sec("", fl, grid, empty),
    sec("", cta("Like what you see?", "Share the style you’re after and we’ll talk about how it could work in your space.")));
  queueMicrotask(() => draw(start));
  return page;
}

function About() {
  lbList = [];
  return h("div", {},
    intro(["Design that fits how you ", h("span", { class: "grad" }, "live")], "Green Homes Interior is an interior design and styling studio focused on practical, beautiful spaces."),
    sec("", h("div", { class: "split" },
      h("div", { class: "rv" }, ph(P(0), "4/3")),
      h("div", { class: "rv" }, h("h2", { text: "Our approach" }),
        h("p", { text: "We start with the people who will use the space, then plan layout, materials and lighting around them. The aim is a home that looks good and works every day." }),
        h("p", { text: "From the first conversation to the final styling, we keep the process clear and collaborative." })))),
    sec("", h("div", { class: "cards" }, [
      ["Listen first", "Your routines, tastes and priorities shape the brief."],
      ["Plan carefully", "Layouts, storage and lighting are resolved before finishes."],
      ["Finish with care", "Materials, colour and styling are brought together with attention to detail."]
    ].map(([t, d], i) => h("div", { class: "card rv" }, h("span", { class: "num" }, i + 1), h("h3", { text: t }), h("p", { text: d }))))),
    sec("", cta("Let’s talk about your space.", "Tell us what you’re planning and we’ll start the conversation.")));
}

function Contact(q) {
  const F = (id, label, ctrl, req) => h("div", {}, h("label", { for: id }, label, req ? h("span", { "aria-hidden": "true" }, " *") : null), ctrl, h("div", { class: "err", id: id + "-e", role: "alert" }));
  const inp = (id, type, x = {}) => h("input", { id, name: id, type, "aria-describedby": id + "-e", ...x });
  const sel = (id, opts, val) => h("select", { id, name: id }, opts.map(([v, t]) => h("option", { value: v, text: t, selected: v === val ? "" : null })));
  const status = h("div", { class: "st", role: "status", "aria-live": "polite" });
  const form = h("form", { class: "f", novalidate: "" },
    F("name", "Full name", inp("name", "text", { autocomplete: "name", required: "" }), 1),
    F("phone", "Phone number", inp("phone", "tel", { autocomplete: "tel", inputmode: "tel" })),
    F("email", "Email address (phone or email required)", inp("email", "email", { autocomplete: "email", inputmode: "email" })),
    F("space", "Type of space", sel("space", [["", "Select…"], ["Apartment", "Apartment"], ["Independent house", "Independent house"], ["Shop / showroom", "Shop / showroom"], ["Office", "Office"], ["Other", "Other"]])),
    F("service", "Service of interest", sel("service", [["", "Not sure yet"], ...SERVICES.map(s => [s.t, s.t])], (SERVICES.find(s => s.id === q.get("service")) || {}).t)),
    F("budget", "Approximate budget (optional)", inp("budget", "text", { placeholder: "e.g. a range you’re comfortable with" })),
    F("loc", "Project location (optional)", inp("loc", "text", { autocomplete: "address-level2" })),
    F("method", "Preferred contact method", sel("method", [["Any", "Any"], ["WhatsApp", "WhatsApp"], ["Phone call", "Phone call"], ["Email", "Email"]])),
    F("note", "Project description (optional)", h("textarea", { id: "note", name: "note", rows: "4" })),
    h("button", { class: "btn p", type: "submit" }, "Request a Consultation"),
    status);
  form.addEventListener("submit", e => {
    e.preventDefault();
    const v = id => form.elements[id].value.trim();
    const er = {};
    if (v("name").length < 2) er.name = "Please enter your full name.";
    if (!v("phone") && !v("email")) er.phone = "Please give a phone number or an email address.";
    else {
      if (v("phone") && !/^\+?[\d\s()-]{7,}$/.test(v("phone"))) er.phone = "Enter a valid phone number.";
      if (v("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) er.email = "Enter a valid email address.";
    }
    ["name", "phone", "email"].forEach(id => {
      $("#" + id + "-e", form).textContent = er[id] || "";
      form.elements[id].setAttribute("aria-invalid", String(!!er[id]));
    });
    status.className = "st"; status.replaceChildren();
    const first = Object.keys(er)[0];
    if (first) { form.elements[first].focus(); status.className = "st bad"; status.textContent = "Please correct the highlighted fields."; return; }
    const msg = "Hello Green Homes Interior, I’d like to discuss a project.\n\n" + [["Name", "name"], ["Phone", "phone"], ["Email", "email"], ["Space type", "space"], ["Service", "service"], ["Budget", "budget"], ["Location", "loc"], ["Preferred contact", "method"], ["Details", "note"]]
      .filter(([, i]) => v(i)).map(([l, i]) => l + ": " + v(i)).join("\n");
    const enc = encodeURIComponent(msg);
    if (waDigits()) {
      window.open("https://wa.me/" + waDigits() + "?text=" + enc, "_blank", "noopener");
      status.textContent = "WhatsApp is opening with your message. Your enquiry has not been sent until you press Send there.";
    } else if (CONFIG.email) {
      const a = h("a", { href: "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent("Project enquiry") + "&body=" + enc });
      a.click();
      status.textContent = "Your email app should open with a draft. Your enquiry has not been sent until you send that email.";
    } else {
      status.className = "st bad";
      status.append("Nothing was sent: the studio’s WhatsApp number and email have not been configured yet. You can copy your message below.",
        h("textarea", { readonly: "", rows: "7", "aria-label": "Your enquiry message", text: msg }));
    }
  });
  const items = contactItems();
  return h("div", {},
    intro(["Discuss your ", h("span", { class: "grad" }, "project")], "Share a few details and we’ll prepare your message for sending. A consultation is not booked until the studio confirms it with you."),
    sec("", h("div", { class: "cg" },
      h("div", { class: "rv" }, form),
      h("div", { class: "rv" }, ph(P(1), "4/3"),
        h("h3", { text: "What happens next", style: "margin-top:24px" }),
        h("ul", { class: "ticks" }, ["We prepare your enquiry as a message.", "You review it and send it via WhatsApp or email.", "The studio replies using your preferred method."].map(t => h("li", { text: t }))),
        items.length ? h("div", { class: "info" }, h("h3", { text: "Reach us directly" }), rate(), items) : null))));
}

const Missing = () => h("section", { class: "sec top" }, wrap(h("h1", { text: "Page not found" }), h("p", { text: "That page doesn’t exist." }), btn("Back to Home", "#/", 1)));

/* ---------- reveal on scroll ---------- */
function count(el) {
  const to = +el.dataset.to, d = +el.dataset.dec || 0;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const t0 = performance.now();
  (function f(t) { const k = Math.min(1, (t - t0) / 900); el.textContent = (to * (1 - Math.pow(1 - k, 3))).toFixed(d); if (k < 1) requestAnimationFrame(f); })(t0);
}
function reveal() {
  if (io) io.disconnect();
  const els = $$(".rv:not(.in)");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); $$(".cnt", x.target).forEach(count); io.unobserve(x.target); } }), { threshold: .1 });
  els.forEach(e => io.observe(e));
}

/* ---------- router (hash-based: works on any static host) ---------- */
const routes = {
  home: [Home, "Green Homes Interior | Interior Designer in Gonda, Uttar Pradesh", "Interior designer in Gonda, UP: bedrooms, bathrooms, kitchens, living rooms, cabinetry and commercial interiors. Rated 4.8 on Google."],
  services: [Services, "Services | Green Homes Interior", "Living rooms, bedrooms, kitchens, space planning and more."],
  portfolio: [Portfolio, "Portfolio | Green Homes Interior", "Browse interior photographs by room type."],
  about: [About, "About | Green Homes Interior", "Our design approach and philosophy."],
  contact: [Contact, "Contact | Green Homes Interior", "Discuss your interior design project with Green Homes Interior."]
};
function route() {
  const hash = location.hash;
  if (hash && !hash.startsWith("#/")) return; // e.g. skip link
  const [path, qs] = hash.slice(2).split("?");
  const key = path === "" ? "home" : path;
  const r = routes[key];
  app.replaceChildren(r ? r[0](new URLSearchParams(qs || "")) : Missing());
  document.title = r ? r[1] : "Page not found | Green Homes Interior";
  const md = $('meta[name="description"]');
  if (md && r) md.content = r[2];
  $$("#nav a").forEach(a => {
    const on = a.getAttribute("href") === "#/" + (key === "home" ? "" : key);
    on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
  menu(false);
  window.scrollTo(0, 0);
  reveal();
}

/* ---------- init ---------- */
function init() {
  setTheme(store.get() || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  $("#theme").onclick = () => setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  $("#mn").onclick = () => menu(!$("#hd").classList.contains("open"));
  document.addEventListener("keydown", e => { if (e.key === "Escape") menu(false); });
  window.addEventListener("resize", () => { if (innerWidth >= 900) menu(false); });
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-lb]");
    if (t) showLb(+t.dataset.lb);
  });
  document.addEventListener("error", e => { if (e.target.tagName === "IMG") e.target.classList.add("broken"); }, true);
  $("#yr").textContent = new Date().getFullYear();
  const ico = d => '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="' + d + '"/></svg>';
  const mk = (cls, label, d, href) => {
    const e = href ? h("a", { class: cls, href, "aria-label": label, target: href.startsWith("http") ? "_blank" : null, rel: "noopener noreferrer" }) : h("button", { class: cls, type: "button", "aria-label": label });
    e.innerHTML = ico(d); return e;
  };
  const up = mk("up", "Back to top", "M12 5l7 8h-4.5v6h-5v-6H5z");
  up.onclick = () => scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  $("#fab").append(up);
  if (waDigits()) $("#fab").append(mk("wa", "Chat on WhatsApp", "M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "https://wa.me/" + waDigits()));
  if (CONFIG.phone) $("#fab").append(mk("tel", "Call " + CONFIG.phone, "M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.6 3.6a1 1 0 0 1-.25 1z", "tel:" + CONFIG.phone.replace(/[^\d+]/g, "")));
  addEventListener("scroll", () => up.classList.toggle("show", scrollY > 700), { passive: true });
  if (matchMedia("(hover:hover)").matches) document.addEventListener("pointermove", e => {
    const hr = e.target.closest && e.target.closest(".hero");
    if (hr) { const r = hr.getBoundingClientRect(); hr.style.setProperty("--mx", e.clientX - r.left + "px"); hr.style.setProperty("--my", e.clientY - r.top + "px"); }
  }, { passive: true });
  if (CONFIG.location) {
    const ld = h("script", { type: "application/ld+json" });
    ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "LocalBusiness", name: "Green Homes Interior", description: "Interior designer", telephone: CONFIG.phone, address: CONFIG.location });
    document.head.append(ld);
  }
  const fc = contactItems();
  $("#fc").append(...(fc.length ? fc : [h("a", { href: "#/contact" }, "Send us an enquiry")]));
  window.addEventListener("hashchange", route);
  route();
}
init();
})();
