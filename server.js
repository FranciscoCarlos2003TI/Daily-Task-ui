const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") }); // funciona de qualquer pasta

const major = parseInt(process.versions.node.split(".")[0], 10);
if (major < 18) {
  console.error(`❌ Node ${process.versions.node} é antigo. Use Node 18 ou superior (https://nodejs.org).`);
  process.exit(1);
}

// chave web do Firebase (a mesma apiKey do firebaseConfig) — usada no login por e-mail/senha
process.env.FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBH5R6d6rGQe4DYdYj_iSfhDfsQ-aX2cko";

const express = require("express");
const cors = require("cors");
const { auth, db } = require("./src/firebase"); // inicializa o Firebase Admin

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use((req, _res, next) => {
  if (req.originalUrl.startsWith("/api")) console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ---------- API ----------
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", servico: "daily-task", hora: new Date().toISOString() }),
);

// diagnóstico: testa Auth + Realtime Database
app.get("/api/health/firebase", async (_req, res) => {
  const r = { auth: "ok", database: "ok" };
  try { await auth.listUsers(1); } catch (e) { r.auth = `erro: ${e.message}`; }
  try { await db.ref("__health").once("value"); } catch (e) { r.database = `erro: ${e.message}`; }
  res.status(r.auth === "ok" && r.database === "ok" ? 200 : 500).json(r);
});

app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/users", require("./src/routes/users"));
app.use("/api/tasks", require("./src/routes/tasks"));

app.use("/api", (req, res) =>
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` }),
);

// ---------- Front-end ----------
app.use(express.static(path.join(__dirname, "public")));

// ---------- Erros ----------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição." });
  console.error(err);
  res.status(err.status || 500).json({ erro: err.message || "Erro interno do servidor." });
});

process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Daily Task rodando em http://localhost:${PORT}`);
  // checagem de saúde na partida (só avisa, não derruba o servidor)
  try {
    await auth.listUsers(1);
    console.log("✅ Firebase Auth conectado");
  } catch (e) {
    console.warn(`⚠️  Firebase Auth: ${e.message}\n   → Ative Authentication > Método de login > E-mail/senha no console.`);
  }
  try {
    await db.ref("__health").once("value");
    console.log("✅ Realtime Database conectado");
  } catch (e) {
    console.warn(`⚠️  Realtime Database: ${e.message}\n   → Crie o Realtime Database no console e confira FIREBASE_DATABASE_URL.`);
  }
});
