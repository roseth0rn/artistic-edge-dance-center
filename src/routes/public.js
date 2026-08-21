const express = require("express");
const { query } = require("../db");
const catalog = require("../data/catalog");
const { AGE_BANDS } = require("../data/studio");

const router = express.Router();
const {
  CLASSES, FACULTY, TESTIMONIALS, NEWS, EVENTS, SHOP, COMPANY_TRACKS,
  TUITION, COMPANY_FEES, FAQS, SUMMER, WEEKDAYS, STYLES,
  classBySlug, newsBySlug, spotsLeft,
} = catalog;

router.get("/", (req, res) => {
  res.render("index", {
    title: null, // homepage uses the base title
    classes: CLASSES, testimonials: TESTIMONIALS,
    news: NEWS.slice(0, 3), events: EVENTS.slice(0, 4),
    ageBands: AGE_BANDS,
  });
});

router.get("/classes", (req, res) => {
  const style = STYLES.includes(req.query.style) ? req.query.style : null;
  const band = AGE_BANDS.find((b) => b.id === req.query.ages) || null;
  let list = CLASSES;
  if (style) list = list.filter((c) => c.style === style);
  if (band) list = list.filter((c) => c.ageMax >= band.min && c.ageMin <= band.max);
  res.render("classes", { title: "Classes", classes: list, styles: STYLES, ageBands: AGE_BANDS, activeStyle: style, activeBand: band, spotsLeft });
});

router.get("/classes/:slug", (req, res, next) => {
  const klass = classBySlug(req.params.slug);
  if (!klass) return next();
  const related = CLASSES.filter((c) => c.style === klass.style && c.slug !== klass.slug).slice(0, 3);
  res.render("class-detail", { title: klass.name, klass, related, spotsLeft });
});

router.get("/schedule", (req, res) => {
  const byDay = WEEKDAYS.map((day) => ({
    day,
    classes: CLASSES.filter((c) => c.day === day).sort((a, b) => a.time.localeCompare(b.time)),
  }));
  res.render("schedule", { title: "Weekly schedule", byDay, spotsLeft });
});

router.get("/tuition", (req, res) => {
  res.render("tuition", { title: "Tuition", tuition: TUITION, companyFees: COMPANY_FEES });
});

router.get("/company", (req, res) => {
  res.render("company", { title: "Dance Company", tracks: COMPANY_TRACKS, companyFees: COMPANY_FEES });
});

router.get("/faculty", (req, res) => {
  res.render("faculty", { title: "Faculty", faculty: FACULTY });
});

router.get("/about", (req, res) => {
  res.render("about", { title: "About the studio", testimonials: TESTIMONIALS });
});

router.get("/calendar", (req, res) => {
  const events = [...EVENTS].sort((a, b) => a.date.localeCompare(b.date));
  res.render("calendar", { title: "Season calendar", events });
});

router.get("/news", (req, res) => {
  res.render("news", { title: "News & newsletters", posts: NEWS });
});

router.get("/news/:slug", (req, res, next) => {
  const post = newsBySlug(req.params.slug);
  if (!post) return next();
  res.render("news-detail", { title: post.title, post });
});

router.get("/nutcracker", (req, res) => {
  const nutEvents = EVENTS.filter((e) => e.id.startsWith("nut"));
  res.render("nutcracker", { title: "Nutcracker Sweets", events: nutEvents });
});

router.get("/summer", (req, res) => {
  res.render("summer", { title: "Summer at AEDC", summer: SUMMER });
});

router.get("/shop", (req, res) => {
  res.render("shop", { title: "Studio shop", items: SHOP });
});

router.get("/faq", (req, res) => {
  res.render("faq", { title: "Questions, answered", faqs: FAQS });
});

router.get("/policies", (req, res) => {
  res.render("policies", { title: "Studio policies" });
});

// ── Forms ─────────────────────────────────────────────────────────────────

router.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact the studio", sent: req.query.sent === "1", error: null, form: {} });
});

router.post("/contact", async (req, res, next) => {
  try {
    const f = req.body;
    if (!(f.name || "").trim() || !(f.email || "").trim()) {
      return res.status(400).render("contact", { title: "Contact the studio", sent: false, error: "Name and email are required.", form: f });
    }
    await query(
      `insert into inquiries (name, email, phone, dancer_name, dancer_age, interest, message)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [f.name.trim(), f.email.trim(), f.phone?.trim() || null, f.dancer_name?.trim() || null,
       f.dancer_age?.trim() || null, f.interest?.trim() || null, f.message?.trim() || null]
    );
    res.redirect("/contact?sent=1");
  } catch (err) { next(err); }
});

router.get("/trial", (req, res) => {
  res.render("trial", { title: "Book a free trial", classes: CLASSES.filter((c) => spotsLeft(c) > 0), sent: req.query.sent === "1", error: null, form: { class_slug: req.query.class || "" } });
});

router.post("/trial", async (req, res, next) => {
  try {
    const f = req.body;
    const klass = classBySlug(f.class_slug);
    const bad = (msg) =>
      res.status(400).render("trial", { title: "Book a free trial", classes: CLASSES.filter((c) => spotsLeft(c) > 0), sent: false, error: msg, form: f });
    if (!(f.parent_name || "").trim() || !(f.email || "").trim() || !(f.dancer_name || "").trim()) return bad("Please complete the required fields.");
    if (!klass) return bad("That class is not on the schedule.");
    const age = Number(f.dancer_age);
    if (!Number.isFinite(age) || age < 2 || age > 99) return bad("Enter your dancer's age.");
    await query(
      `insert into trial_bookings (parent_name, email, phone, dancer_name, dancer_age, class_slug, notes)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [f.parent_name.trim(), f.email.trim(), f.phone?.trim() || null, f.dancer_name.trim(), age, klass.slug, f.notes?.trim() || null]
    );
    res.redirect("/trial?sent=1");
  } catch (err) { next(err); }
});

router.post("/newsletter", async (req, res, next) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (email.includes("@")) {
      await query("insert into newsletter_subs (email) values ($1) on conflict (email) do nothing", [email]);
    }
    req.session.flash = { kind: "ok", text: "You're on the list — newsletters land monthly." };
    res.redirect(req.get("referer") || "/");
  } catch (err) { next(err); }
});

router.get("/careers", (req, res) => {
  res.render("careers", { title: "Teach with us", sent: req.query.sent === "1", error: null, form: {} });
});

router.post("/careers", async (req, res, next) => {
  try {
    const f = req.body;
    if (!(f.name || "").trim() || !(f.email || "").trim()) {
      return res.status(400).render("careers", { title: "Teach with us", sent: false, error: "Name and email are required.", form: f });
    }
    await query("insert into career_apps (name, email, role, message) values ($1,$2,$3,$4)",
      [f.name.trim(), f.email.trim(), f.role?.trim() || null, f.message?.trim() || null]);
    res.redirect("/careers?sent=1");
  } catch (err) { next(err); }
});

module.exports = router;
