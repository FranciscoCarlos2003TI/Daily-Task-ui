const { auth } = require("../firebase");

// Exige header:  Authorization: Bearer <idToken>
module.exports = async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");
  if (tipo !== "Bearer" || !token)
    return res.status(401).json({ erro: "Token ausente. Use o header Authorization: Bearer <idToken>." });
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    const expirado = err.code === "auth/id-token-expired";
    res.status(401).json({ erro: expirado ? "Token expirado. Use /api/auth/refresh." : "Token inválido." });
  }
};
