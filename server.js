// Artistic Edge Dance Center — Express/EJS/Postgres.
// Boot order: apply idempotent migrations, then listen. No build step.
const path = require("path");
const express = require("express");
const session = require("express-session");
const compression = require("compression");
const PgSession = require("connect-pg-simple")(session);

const { pool, migrate } = require("./src/db");
const { STUDIO, ANNOUNCEMENT } = require("./src/data/studio");
const { photo, classPhoto, PHOTOS } = require("./src/data/photos");

const app = express();
const ASSET_V = require("./package.json").version;
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET && IS_PROD) {
  console.error("[boot] SESSION_SECRET is required in production");
  process.exit(1);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1); // behind Coolify's Traefik

app.use(compression());
app.use(express.urlencoded({ extended: false }));
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: IS_PROD ? "7d" : 0,
    immutable: false,
  })
);

app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    name: "aedc.sid",
    secret: process.env.SESSION_SECRET || "dev-only-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PROD,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
  })
);

// Locals available to every template
app.use((req, res, next) => {
  res.locals.STUDIO = STUDIO;
  res.locals.ASSET_V = ASSET_V;
  res.locals.ANNOUNCEMENT = ANNOUNCEMENT;
  res.locals.photo = photo;
  res.locals.classPhoto = classPhoto;
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// Health check for Coolify (returns 503 until Postgres answers)
app.get("/healthz", async (req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.use("/", require("./src/routes/public"));
app.use("/", require("./src/routes/auth"));
app.use("/portal", require("./src/routes/portal"));

// 404
app.use((req, res) => {
  res.status(404).render("404", { title: "Page not found" });
});

// 500
app.use((err, req, res, next) => {
  console.error("[error]", err);
  res.status(500).render("500", { title: "Something went wrong" });
});

migrate()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[boot] ${STUDIO.name} listening on :${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[boot] migration failed", err);
    process.exit(1);
  });
