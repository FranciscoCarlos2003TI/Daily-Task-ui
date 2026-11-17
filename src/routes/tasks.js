const router = require("express").Router();
const { admin, db } = require("../firebase");
const requireAuth = require("../middleware/auth");
const {
  PRIORIDADES, hojeISO, normalizarData, horaValida, asyncH, HttpError,
} = require("../utils");

router.use(requireAuth);

const col = (uid) => db.ref(`users/${uid}/tarefas`);

async function listar(uid) {
  const snap = await col(uid).once("value");
  const arr = [];
  snap.forEach((c) => {
    arr.push({ id: c.key, ...c.val() });
  });
  return arr;
}

const porDataHora = (a, b) =>
  `${a.data || ""}${a.hora || ""}`.localeCompare(`${b.data || ""}${b.hora || ""}`);

const calcStats = (lista) => {
  const total = lista.length;
  const concluidas = lista.filter((t) => t.concluida).length;
  return {
    total,
    concluidas,
    pendentes: total - concluidas,
    altaPrioridade: lista.filter((t) => t.prioridade === "alta").length,
  };
};

const parseBool = (v, nome) => {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  throw new HttpError(400, `"${nome}" deve ser true ou false.`);
};

// Valida campos presentes em body. Retorna objeto limpo.
function validarCampos(b, { parcial }) {
  const out = {};
  if (!parcial || b.titulo !== undefined) {
    if (typeof b.titulo !== "string" || !b.titulo.trim())
      throw new HttpError(400, "Informe o título.");
    if (b.titulo.trim().length > 200) throw new HttpError(400, "Título muito longo (máx. 200).");
    out.titulo = b.titulo.trim();
  }
  if (b.descricao !== undefined) out.descricao = String(b.descricao).trim();
  else if (!parcial) out.descricao = "";

  if (b.data !== undefined) {
    const iso = normalizarData(b.data);
    if (!iso) throw new HttpError(400, "Data inválida (use AAAA-MM-DD ou DD/MM/AAAA).");
    out.data = iso;
  } else if (!parcial) out.data = hojeISO();

  if (b.hora !== undefined) {
    if (!horaValida(b.hora)) throw new HttpError(400, "Hora inválida (use HH:MM).");
    out.hora = b.hora.trim();
  } else if (!parcial) out.hora = "12:00";

  if (b.prioridade !== undefined) {
    if (!PRIORIDADES.includes(b.prioridade))
      throw new HttpError(400, `Prioridade inválida. Use: ${PRIORIDADES.join(", ")}.`);
    out.prioridade = b.prioridade;
  } else if (!parcial) out.prioridade = "media";

  if (b.lembrete !== undefined) out.lembrete = parseBool(b.lembrete, "lembrete");
  else if (!parcial) out.lembrete = true;

  if (b.concluida !== undefined) out.concluida = parseBool(b.concluida, "concluida");
  else if (!parcial) out.concluida = false;

  return out;
}

async function buscar(uid, id) {
  const snap = await col(uid).child(id).once("value");
  if (!snap.exists()) throw new HttpError(404, "Tarefa não encontrada.");
  return { id, ...snap.val() };
}

// ---------- Rotas específicas (antes de /:id) ----------

// GET /api/tasks/hoje
router.get("/hoje", asyncH(async (req, res) => {
  const hoje = hojeISO();
  const lista = (await listar(req.user.uid)).filter((t) => t.data === hoje).sort(porDataHora);
  res.json({ data: hoje, stats: calcStats(lista), tarefas: lista });
}));

// GET /api/tasks/historico?de=AAAA-MM-DD&ate=AAAA-MM-DD   (tudo que não é de hoje)
router.get("/historico", asyncH(async (req, res) => {
  const hoje = hojeISO();
  const de = req.query.de ? normalizarData(req.query.de) : "";
  const ate = req.query.ate ? normalizarData(req.query.ate) : "";
  if ((req.query.de && !de) || (req.query.ate && !ate))
    throw new HttpError(400, "Datas inválidas (use AAAA-MM-DD).");

  let lista = (await listar(req.user.uid)).filter((t) => t.data && t.data !== hoje);
  if (de) lista = lista.filter((t) => t.data >= de);
  if (ate) lista = lista.filter((t) => t.data <= ate);
  lista.sort((a, b) => porDataHora(b, a));

  const grupos = {};
  lista.forEach((t) => (grupos[t.data] = grupos[t.data] || []).push(t));
  res.json({
    total: lista.length,
    dias: Object.keys(grupos).sort().reverse().map((d) => ({ data: d, tarefas: grupos[d] })),
  });
}));

// GET /api/tasks/stats?data=AAAA-MM-DD   (padrão: hoje)
router.get("/stats", asyncH(async (req, res) => {
  const data = req.query.data ? normalizarData(req.query.data) : hojeISO();
  if (!data) throw new HttpError(400, "Data inválida.");
  const lista = (await listar(req.user.uid)).filter((t) => t.data === data);
  res.json({ data, ...calcStats(lista) });
}));

// GET /api/tasks/notificacoes   (hoje, lembrete ligado, não concluídas)
router.get("/notificacoes", asyncH(async (req, res) => {
  const hoje = hojeISO();
  const pend = (await listar(req.user.uid))
    .filter((t) => t.data === hoje && t.lembrete && !t.concluida)
    .sort(porDataHora);
  res.json({ total: pend.length, notificacoes: pend });
}));

// ---------- CRUD ----------

// GET /api/tasks?data=&de=&ate=&prioridade=&concluida=
router.get("/", asyncH(async (req, res) => {
  const { data, de, ate, prioridade, concluida } = req.query;
  let lista = await listar(req.user.uid);
  if (data) {
    const d = normalizarData(data);
    if (!d) throw new HttpError(400, "Parâmetro 'data' inválido.");
    lista = lista.filter((t) => t.data === d);
  }
  if (de) {
    const d1 = normalizarData(de);
    if (!d1) throw new HttpError(400, "Parâmetro 'de' inválido.");
    lista = lista.filter((t) => t.data >= d1);
  }
  if (ate) {
    const d2 = normalizarData(ate);
    if (!d2) throw new HttpError(400, "Parâmetro 'ate' inválido.");
    lista = lista.filter((t) => t.data <= d2);
  }
  if (prioridade) lista = lista.filter((t) => t.prioridade === prioridade);
  if (concluida !== undefined) {
    const c = parseBool(concluida, "concluida");
    lista = lista.filter((t) => !!t.concluida === c);
  }
  lista.sort(porDataHora);
  res.json({ total: lista.length, tarefas: lista });
}));

// GET /api/tasks/:id
router.get("/:id", asyncH(async (req, res) => {
  res.json(await buscar(req.user.uid, req.params.id));
}));

// POST /api/tasks
router.post("/", asyncH(async (req, res) => {
  const dados = validarCampos(req.body || {}, { parcial: false });
  const ref = await col(req.user.uid).push({
    ...dados,
    criadaEm: admin.database.ServerValue.TIMESTAMP,
  });
  res.status(201).json({ mensagem: "Tarefa criada.", tarefa: await buscar(req.user.uid, ref.key) });
}));

// PUT /api/tasks/:id   (atualização total ou parcial)
router.put("/:id", asyncH(async (req, res) => {
  await buscar(req.user.uid, req.params.id);
  const dados = validarCampos(req.body || {}, { parcial: true });
  if (!Object.keys(dados).length) throw new HttpError(400, "Nada para atualizar.");
  await col(req.user.uid).child(req.params.id).update(dados);
  res.json({ mensagem: "Tarefa atualizada.", tarefa: await buscar(req.user.uid, req.params.id) });
}));

// PATCH /api/tasks/:id/concluir   { concluida: true|false }  (padrão true)
router.patch("/:id/concluir", asyncH(async (req, res) => {
  await buscar(req.user.uid, req.params.id);
  const c = req.body && req.body.concluida !== undefined
    ? parseBool(req.body.concluida, "concluida") : true;
  await col(req.user.uid).child(req.params.id).update({ concluida: c });
  res.json({ mensagem: c ? "Tarefa concluída." : "Tarefa reaberta.", tarefa: await buscar(req.user.uid, req.params.id) });
}));

// DELETE /api/tasks/:id
router.delete("/:id", asyncH(async (req, res) => {
  await buscar(req.user.uid, req.params.id);
  await col(req.user.uid).child(req.params.id).remove();
  res.json({ mensagem: "Tarefa excluída." });
}));

module.exports = router;
