function requireAuth(req, res, next) {
  if (req.session.user) return next();
  req.session.flash = { kind: "info", text: "Sign in to open the parent portal." };
  return res.redirect("/login?next=" + encodeURIComponent(req.originalUrl));
}

module.exports = { requireAuth };
