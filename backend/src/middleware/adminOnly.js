export function adminOnly(req, res, next) {
  const rol = req.headers["x-user-rol"];
  if (rol !== "admin") {
    return res.status(403).json({ error: "Acceso restringido a administradores" });
  }
  next();
}
