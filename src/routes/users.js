const router = require("express").Router();
const { auth, db } = require("../firebase");
const requireAuth = require("../middleware/auth");
const { asyncH, HttpError, traduzErroFirebase } = require("../utils");

router.use(requireAuth);

// GET /api/users/me
router.get("/me", asyncH(async (req, res) => {
  const snap = await db.ref(`users/${req.user.uid}`).once("value");
  const u = snap.val() || {};
  const fb = await auth.getUser(req.user.uid);
  res.json({
    uid: req.user.uid,
    nome: u.nome || fb.displayName || "",
    email: u.email || fb.email || "",
    criadoEm: u.criadoEm || null,
  });
}));

// PUT /api/users/me  { nome?, email?, novaSenha? }
router.put("/me", asyncH(async (req, res) => {
  const { nome, email, novaSenha, senhaAtual } = req.body || {};
  const authUpdate = {};
  const dbUpdate = {};

  if (nome !== undefined) {
    if (!String(nome).trim()) throw new HttpError(400, "Nome não pode ser vazio.");
    authUpdate.displayName = dbUpdate.nome = String(nome).trim();
  }
  if (email !== undefined) {
    if (!/^\S+@\S+\.\S+$/.test(String(email))) throw new HttpError(400, "E-mail inválido.");
    authUpdate.email = dbUpdate.email = String(email).trim();
  }
  if (novaSenha !== undefined) {
    if (typeof novaSenha !== "string" || novaSenha.length < 6)
      throw new HttpError(400, "A nova senha deve ter no mínimo 6 caracteres.");
    authUpdate.password = novaSenha;
  }
  if (!Object.keys(authUpdate).length) throw new HttpError(400, "Nada para atualizar.");

  // trocar e-mail/senha exige confirmar a senha atual
  if (authUpdate.email || authUpdate.password) {
    if (!senhaAtual) throw new HttpError(400, "Informe a senha atual para alterar e-mail ou senha.");
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: req.user.email, password: senhaAtual, returnSecureToken: false }),
      },
    );
    if (!r.ok) throw new HttpError(401, "Senha atual incorreta.");
  }

  try {
    await auth.updateUser(req.user.uid, authUpdate);
  } catch (e) {
    throw traduzErroFirebase(e.code, "Erro ao atualizar usuário.");
  }
  if (Object.keys(dbUpdate).length) await db.ref(`users/${req.user.uid}`).update(dbUpdate);
  res.json({ mensagem: "Perfil atualizado.", ...dbUpdate });
}));

// DELETE /api/users/me  (apaga conta + tarefas)
router.delete("/me", asyncH(async (req, res) => {
  await db.ref(`users/${req.user.uid}`).remove();
  await auth.deleteUser(req.user.uid);
  res.json({ mensagem: "Conta excluída." });
}));

module.exports = router;
