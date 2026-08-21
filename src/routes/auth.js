const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../db");

const router = express.Router();

const safeNext = (raw) =>
  typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/portal";

router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/portal");
  res.render("login", { title: "Parent sign in", mode: "login", next: safeNext(req.query.next), error: null, form: {} });
});

router.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/portal");
  res.render("login", { title: "Create account", mode: "register", next: safeNext(req.query.next), error: null, form: {} });
});

router.post("/register", async (req, res, next) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const phone = (req.body.phone || "").trim() || null;
    const password = req.body.password || "";
    const nextUrl = safeNext(req.body.next);

    const fail = (error) =>
      res.status(400).render("login", { title: "Create account", mode: "register", next: nextUrl, error, form: { name, email, phone } });

    if (!name || !email.includes("@")) return fail("Enter your name and a valid email.");
    if (password.length < 8) return fail("Password needs at least 8 characters.");

    const dupe = await query("select 1 from users where email = $1", [email]);
    if (dupe.rowCount) return fail("An account with that email already exists — sign in instead.");

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      "insert into users (email, password_hash, name, phone) values ($1,$2,$3,$4) returning id, email, name",
      [email, hash, name, phone]
    );
    req.session.user = rows[0];
    req.session.flash = { kind: "ok", text: "Welcome to the studio. Add your dancers to get started." };
    res.redirect(nextUrl);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    const nextUrl = safeNext(req.body.next);

    const { rows } = await query("select id, email, name, password_hash from users where email = $1", [email]);
    const ok = rows.length && (await bcrypt.compare(password, rows[0].password_hash));
    if (!ok) {
      return res.status(401).render("login", {
        title: "Parent sign in", mode: "login", next: nextUrl,
        error: "That email and password don't match our records.", form: { email },
      });
    }
    req.session.user = { id: rows[0].id, email: rows[0].email, name: rows[0].name };
    res.redirect(nextUrl);
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
