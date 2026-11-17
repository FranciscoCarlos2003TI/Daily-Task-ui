const router = require("express").Router();
const { admin, auth, db } = require("../firebase");
const { asyncH, HttpError, traduzErroFirebase } = require("../utils");

const getKey = () => process.env.FIREBASE_API_KEY;
const IDT = "https://identitytoolkit.googleapis.com/v1/accounts";

async function restFirebase(url, body) {
  const API_KEY = getKey();
  if (!API_KEY) throw new HttpError(500, "FIREBASE_API_KEY não configurada no .env");
  const r = await fetch(`${url}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw traduzErroFirebase(data.error?.message, "Falha na autenticação.");
  return data;
}

const emailOk = (e) => typeof e === "string" && /^\S+@\S+\.\S+$/.test(e.trim());

// POST /api/auth/register  { nome, email, senha }
router.post("/register", asyncH(async (req, res) => {
  const { nome, email, senha } = req.body || {};
  if (!nome || !String(nome).trim()) throw new HttpError(400, "Informe o nome.");
  if (!emailOk(email)) throw new HttpError(400, "E-mail inválido.");
  if (typeof senha !== "string" || senha.length < 6)
    throw new HttpError(400, "A senha deve ter no mínimo 6 caracteres.");

  let user;
  try {
    user = await auth.createUser({ email: email.trim(), password: senha, displayName: nome.trim() });
  } catch (e) {
    throw traduzErroFirebase(e.code, "Erro ao criar usuário.");
  }
  await db.ref(`users/${user.uid}`).set({
    nome: nome.trim(),
    email: email.trim(),
    criadoEm: admin.database.ServerValue.TIMESTAMP,
  });

  const login = await restFirebase(`${IDT}:signInWithPassword`, {
    email: email.trim(), password: senha, returnSecureToken: true,
  });
  res.status(201).json({
    mensagem: "Usuário criado com sucesso.",
    uid: user.uid,
    nome: nome.trim(),
    email: user.email,
    idToken: login.idToken,
    refreshToken: login.refreshToken,
    expiresIn: login.expiresIn,
  });
}));

// POST /api/auth/login  { email, senha }
router.post("/login", asyncH(async (req, res) => {
  const { email, senha } = req.body || {};
  if (!emailOk(email) || !senha) throw new HttpError(400, "Informe e-mail e senha.");
  const d = await restFirebase(`${IDT}:signInWithPassword`, {
    email: email.trim(), password: senha, returnSecureToken: true,
  });
  res.json({
    uid: d.localId,
    nome: d.displayName || "",
    email: d.email,
    idToken: d.idToken,
    refreshToken: d.refreshToken,
    expiresIn: d.expiresIn,
  });
}));

// POST /api/auth/refresh  { refreshToken }
router.post("/refresh", asyncH(async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) throw new HttpError(400, "Informe o refreshToken.");
  const r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${getKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  const d = await r.json();
  if (!r.ok) throw traduzErroFirebase(d.error?.message, "Falha ao renovar token.");
  res.json({
    uid: d.user_id,
    idToken: d.id_token,
    refreshToken: d.refresh_token,
    expiresIn: d.expires_in,
  });
}));

// POST /api/auth/forgot-password  { email }
router.post("/forgot-password", asyncH(async (req, res) => {
  const { email } = req.body || {};
  if (!emailOk(email)) throw new HttpError(400, "E-mail inválido.");
  try {
    await restFirebase(`${IDT}:sendOobCode`, { requestType: "PASSWORD_RESET", email: email.trim() });
  } catch (e) {
    if (e.status !== 401 && e.status !== 404) throw e; // não revela se o e-mail existe
  }
  res.json({ mensagem: "Se o e-mail estiver cadastrado, você receberá o link de redefinição." });
}));

module.exports = router;
