// npm run setup  → cria o .env a partir do .env.example e confere a credencial
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const env = path.join(root, ".env");
if (!fs.existsSync(env)) {
  fs.copyFileSync(path.join(root, ".env.example"), env);
  console.log("✅ .env criado.");
} else console.log("ℹ️  .env já existe.");
if (!fs.existsSync(path.join(root, "serviceAccountKey.json")))
  console.log("❗ Falta o serviceAccountKey.json na raiz (Firebase Console → Configurações → Contas de serviço → Gerar nova chave privada).");
else console.log("✅ serviceAccountKey.json encontrado.");
