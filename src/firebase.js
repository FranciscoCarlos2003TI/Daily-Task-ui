const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const ROOT = path.join(__dirname, "..");
const DEFAULT_KEY_FILE = path.join(ROOT, "serviceAccountKey.json");
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "carlos-6c793";
const databaseURL =
  process.env.FIREBASE_DATABASE_URL || "https://carlos-6c793-default-rtdb.firebaseio.com";

function falhar(msg) {
  console.error(`
❌ ${msg}

Como resolver (leva 1 minuto):
  1. Abra https://console.firebase.google.com → seu projeto (${PROJECT_ID})
  2. ⚙️ Configurações do projeto → aba "Contas de serviço"
  3. Clique em "Gerar nova chave privada" e baixe o arquivo .json
  4. Renomeie para  serviceAccountKey.json  e coloque na RAIZ do projeto:
     ${DEFAULT_KEY_FILE}
  5. Rode de novo:  npm start

(Em hospedagem/deploy, use as variáveis FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL
 e FIREBASE_PRIVATE_KEY, ou FIREBASE_SERVICE_ACCOUNT_BASE64. Veja o .env.example)
`);
  process.exit(1);
}

function lerArquivo(p) {
  const abs = path.isAbsolute(p) ? p : path.resolve(ROOT, p);
  if (!fs.existsSync(abs)) falhar(`Arquivo de credencial não encontrado: ${abs}`);
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (e) {
    return falhar(`O arquivo ${abs} não é um JSON válido (${e.message}).`);
  }
}

function resolverCredencial() {
  const e = process.env;
  // 1) JSON inteiro (texto ou base64)
  if (e.FIREBASE_SERVICE_ACCOUNT_BASE64)
    return JSON.parse(Buffer.from(e.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8"));
  if (e.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(e.FIREBASE_SERVICE_ACCOUNT);
  // 2) variáveis separadas
  if (e.FIREBASE_PRIVATE_KEY && e.FIREBASE_CLIENT_EMAIL)
    return {
      project_id: PROJECT_ID,
      client_email: e.FIREBASE_CLIENT_EMAIL,
      private_key: e.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/^"|"$/g, ""),
    };
  // 3) caminho do arquivo no .env
  if (e.GOOGLE_APPLICATION_CREDENTIALS) return lerArquivo(e.GOOGLE_APPLICATION_CREDENTIALS);
  // 4) serviceAccountKey.json na raiz (automático)
  if (fs.existsSync(DEFAULT_KEY_FILE)) return lerArquivo(DEFAULT_KEY_FILE);
  return null;
}

let conta;
try {
  conta = resolverCredencial();
} catch (e) {
  falhar(`Credencial do Firebase inválida: ${e.message}`);
}
if (!conta) falhar("Credencial do Firebase não encontrada (nenhum serviceAccountKey.json nem variáveis no .env).");

const k = conta.private_key || conta.privateKey;
const c = conta.client_email || conta.clientEmail;
if (!k || !c || !String(k).includes("BEGIN PRIVATE KEY"))
  falhar("A credencial não contém private_key/client_email válidos. Baixe a chave de novo no Firebase Console.");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: conta.project_id || conta.projectId || PROJECT_ID,
    clientEmail: c,
    privateKey: k,
  }),
  databaseURL,
});

module.exports = { admin, auth: admin.auth(), db: admin.database() };
