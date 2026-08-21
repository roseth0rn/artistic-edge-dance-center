const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { CLASSES, EVENTS, TUITION, classBySlug, classesForAge, tuitionForCount, spotsLeft } = require("../data/catalog");

const router = express.Router();
router.use(requireAuth);

const uid = (req) => req.session.user.id;

async function household(req) {
  const [dancers, enrollments, waiver] = await Promise.all([
    query("select * from dancers where user_id = $1 order by id", [uid(req)]),
    query("select * from enrollments where user_id = $1 and status = 'enrolled' order by id", [uid(req)]),
    query("select * from waivers where user_id = $1 order by signed_at desc limit 1", [uid(req)]),
  ]);
  return { dancers: dancers.rows, enrollments: enrollments.rows, waiver: waiver.rows[0] || null };
}

router.get("/", async (req, res, next) => {
  try {
    const { dancers, enrollments, waiver } = await household(req);
    const enriched = enrollments.map((e) => ({ ...e, klass: classBySlug(e.class_slug), dancer: dancers.find((d) => d.id === e.dancer_id) }));
    const weeklyByDancer = dancers.map((d) => ({ dancer: d, count: enrollments.filter((e) => e.dancer_id === d.id).length }));
    const monthly = weeklyByDancer.reduce((sum, r) => sum + (r.count ? tuitionForCount(r.count).monthly : 0), 0);
    const upcoming = [...EVENTS].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
    res.render("portal/index", { title: "Parent portal", dancers, enrollments: enriched, waiver, monthly, upcoming });
  } catch (err) { next(err); }
});

router.post("/dancers", async (req, res, next) => {
  try {
    const name = (req.body.name || "").trim();
    const year = Number(req.body.birth_year);
    if (name && Number.isFinite(year) && year > 1940 && year <= new Date().getFullYear()) {
      await query("insert into dancers (user_id, name, birth_year, notes) values ($1,$2,$3,$4)",
        [uid(req), name, year, (req.body.notes || "").trim() || null]);
      req.session.flash = { kind: "ok", text: `${name} added to your household.` };
    } else {
      req.session.flash = { kind: "err", text: "Enter the dancer's name and birth year." };
    }
    res.redirect("/portal/dancers");
  } catch (err) { next(err); }
});

router.get("/dancers", async (req, res, next) => {
  try {
    const { dancers, enrollments } = await household(req);
    const withClasses = dancers.map((d) => ({
      ...d,
      classes: enrollments.filter((e) => e.dancer_id === d.id).map((e) => classBySlug(e.class_slug)).filter(Boolean),
    }));
    res.render("portal/dancers", { title: "My dancers", dancers: withClasses });
  } catch (err) { next(err); }
});

router.post("/dancers/:id/remove", async (req, res, next) => {
  try {
    await query("delete from dancers where id = $1 and user_id = $2", [Number(req.params.id), uid(req)]);
    req.session.flash = { kind: "ok", text: "Dancer removed." };
    res.redirect("/portal/dancers");
  } catch (err) { next(err); }
});

router.get("/enroll", async (req, res, next) => {
  try {
    const { dancers, enrollments } = await household(req);
    const selected = dancers.find((d) => d.id === Number(req.query.dancer)) || dancers[0] || null;
    let options = [];
    if (selected) {
      const age = selected.birth_year ? new Date().getFullYear() - selected.birth_year : null;
      const pool = age ? classesForAge(age) : CLASSES;
      const enrolledSlugs = new Set(enrollments.filter((e) => e.dancer_id === selected.id).map((e) => e.class_slug));
      options = pool.map((c) => ({ ...c, open: spotsLeft(c) > 0, already: enrolledSlugs.has(c.slug) }));
    }
    res.render("portal/enroll", { title: "Enroll in classes", dancers, selected, options, tuition: TUITION });
  } catch (err) { next(err); }
});

router.post("/enroll", async (req, res, next) => {
  try {
    const dancerId = Number(req.body.dancer_id);
    const klass = classBySlug(req.body.class_slug);
    const owned = await query("select 1 from dancers where id = $1 and user_id = $2", [dancerId, uid(req)]);
    if (!owned.rowCount || !klass || spotsLeft(klass) <= 0) {
      req.session.flash = { kind: "err", text: "That enrollment isn't available." };
    } else {
      await query(
        `insert into enrollments (user_id, dancer_id, class_slug) values ($1,$2,$3)
         on conflict (dancer_id, class_slug) do nothing`,
        [uid(req), dancerId, klass.slug]
      );
      req.session.flash = { kind: "ok", text: `Enrolled in ${klass.name} — ${klass.day} ${klass.time}.` };
    }
    res.redirect("/portal/enroll?dancer=" + dancerId);
  } catch (err) { next(err); }
});

router.post("/enroll/:id/drop", async (req, res, next) => {
  try {
    await query("update enrollments set status = 'dropped' where id = $1 and user_id = $2", [Number(req.params.id), uid(req)]);
    req.session.flash = { kind: "ok", text: "Class dropped. The office will confirm any tuition change." };
    res.redirect("/portal");
  } catch (err) { next(err); }
});

router.get("/calendar", async (req, res, next) => {
  try {
    const { dancers, enrollments } = await household(req);
    const mine = enrollments.map((e) => ({ ...e, klass: classBySlug(e.class_slug), dancer: dancers.find((d) => d.id === e.dancer_id) })).filter((e) => e.klass);
    const events = [...EVENTS].sort((a, b) => a.date.localeCompare(b.date));
    res.render("portal/calendar", { title: "My calendar", mine, events });
  } catch (err) { next(err); }
});

router.get("/billing", async (req, res, next) => {
  try {
    const { dancers, enrollments } = await household(req);
    const weeklyByDancer = dancers.map((d) => {
      const count = enrollments.filter((e) => e.dancer_id === d.id).length;
      return { dancer: d, count, row: count ? tuitionForCount(count) : null };
    });
    const monthly = weeklyByDancer.reduce((sum, r) => sum + (r.row ? r.row.monthly : 0), 0);
    const payments = await query("select * from payments where user_id = $1 order by created_at desc limit 24", [uid(req)]);
    res.render("portal/billing", { title: "Tuition & billing", weeklyByDancer, monthly, payments: payments.rows });
  } catch (err) { next(err); }
});

router.post("/waiver", async (req, res, next) => {
  try {
    const signer = (req.body.signer_name || "").trim();
    if (signer) {
      await query("insert into waivers (user_id, signer_name) values ($1,$2)", [uid(req), signer]);
      req.session.flash = { kind: "ok", text: "Waiver signed for the season. Your dancers may take the floor." };
    } else {
      req.session.flash = { kind: "err", text: "Type your full legal name to sign." };
    }
    res.redirect("/portal");
  } catch (err) { next(err); }
});

router.post("/makeup", async (req, res, next) => {
  try {
    const dancerId = Number(req.body.dancer_id) || null;
    if (dancerId) {
      const owned = await query("select 1 from dancers where id = $1 and user_id = $2", [dancerId, uid(req)]);
      if (!owned.rowCount) return res.redirect("/portal/calendar");
    }
    await query(
      "insert into makeup_requests (user_id, dancer_id, missed_class, preferred_makeup, reason) values ($1,$2,$3,$4,$5)",
      [uid(req), dancerId, (req.body.missed_class || "").trim() || null, (req.body.preferred_makeup || "").trim() || null, (req.body.reason || "").trim() || null]
    );
    req.session.flash = { kind: "ok", text: "Makeup request sent — Miss Kathy will follow up by email." };
    res.redirect("/portal/calendar");
  } catch (err) { next(err); }
});

module.exports = router;
