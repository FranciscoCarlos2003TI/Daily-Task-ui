const TZ = process.env.TZ_APP || "America/Fortaleza";
const PRIORIDADES = ["alta", "media", "baixa"];

// YYYY-MM-DD no fuso do app
const hojeISO = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

const dataValida = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
};

// aceita "YYYY-MM-DD" ou "DD/MM/YYYY"; retorna ISO ou null
const normalizarData = (v) => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  const iso = br ? `${br[3]}-${br[2]}-${br[1]}` : s;
  return dataValida(iso) ? iso : null;
};

const horaValida = (h) => typeof h === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(h.trim());

const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Traduz erros do Firebase para mensagens/HTTP
const traduzErroFirebase = (code, fallback) => {
  const map = {
    EMAIL_EXISTS: [409, "Este e-mail já está cadastrado."],
    "auth/email-already-exists": [409, "Este e-mail já está cadastrado."],
    "auth/invalid-email": [400, "E-mail inválido."],
    INVALID_EMAIL: [400, "E-mail inválido."],
    "auth/invalid-password": [400, "A senha deve ter no mínimo 6 caracteres."],
    "auth/weak-password": [400, "A senha deve ter no mínimo 6 caracteres."],
    WEAK_PASSWORD: [400, "A senha deve ter no mínimo 6 caracteres."],
    EMAIL_NOT_FOUND: [401, "E-mail ou senha inválidos."],
    INVALID_PASSWORD: [401, "E-mail ou senha inválidos."],
    INVALID_LOGIN_CREDENTIALS: [401, "E-mail ou senha inválidos."],
    USER_DISABLED: [403, "Usuário desativado."],
    TOO_MANY_ATTEMPTS_TRY_LATER: [429, "Muitas tentativas. Tente novamente mais tarde."],
    OPERATION_NOT_ALLOWED: [500, "Login por e-mail/senha desativado. Ative em Firebase > Authentication > Método de login > E-mail/senha."],
    API_KEY_INVALID: [500, "FIREBASE_API_KEY inválida. Confira a apiKey no .env."],
    TOKEN_EXPIRED: [401, "Refresh token expirado."],
    INVALID_REFRESH_TOKEN: [401, "Refresh token inválido."],
    "auth/user-not-found": [404, "Usuário não encontrado."],
  };
  const hit = map[code] || map[String(code).split(" : ")[0]];
  return hit ? new HttpError(hit[0], hit[1]) : new HttpError(500, fallback || "Erro no Firebase.");
};

module.exports = {
  PRIORIDADES, hojeISO, normalizarData, horaValida, asyncH, HttpError, traduzErroFirebase,
};
