/* ============================================================
   DAILY TASK — Front-end (consome a API Express em /api)
   ============================================================ */
(function () {
  "use strict";

  const API = "/api";
  const SESSION_KEY = "dt_session";

  /* ---------- ícones ---------- */
  const svg = (p) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const I = {
    logo: svg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
    home: svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
    history: svg('<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>'),
    user: svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'),
    bell: svg('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
    plus: svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
    tasks: svg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
    checkCircle: svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'),
    pending: svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    alert: svg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    clock: svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    edit: svg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
    trash: svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>'),
    eye: svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
    calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
    chevron: svg('<polyline points="9 18 15 12 9 6"/>'),
    menu: svg('<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>'),
  };

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const pad2 = (n) => String(n).padStart(2, "0");
  const hojeISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };
  const isoParaBR = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };
  const labelPrioridade = (p) => ({ alta: "Alta", media: "Média", baixa: "Baixa" })[p] || "Média";

  function formatarDataHeader(iso) {
    const [y, m, d] = iso.split("-");
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const data = new Date(+y, +m - 1, +d);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    let prefixo = "";
    if (data.getTime() === ontem.getTime()) prefixo = "Ontem — ";
    else if (data.getTime() === hoje.getTime()) prefixo = "Hoje — ";
    return `${prefixo}${d} ${meses[+m - 1]} ${y}`;
  }

  function toast(msg, type = "info") {
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    $("#toast-container").appendChild(el);
    setTimeout(() => {
      el.style.animation = "slideOut .3s ease forwards";
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }
  const showLoading = (show) => ($("#loading").hidden = !show);

  function confirmar(msg, onConfirm) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>${esc(msg)}</h3>
        <div class="modal-actions">
          <button class="btn-secondary" data-cancel>Cancelar</button>
          <button class="btn-primary" data-confirm>Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest("[data-cancel]")) overlay.remove();
      else if (e.target.closest("[data-confirm]")) {
        overlay.remove();
        onConfirm();
      }
    });
  }

  /* ---------- sessão + cliente da API ---------- */
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch (_) {}

  function saveSession(s) {
    session = s;
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }

  let refreshing = null;
  function refreshToken() {
    if (!session || !session.refreshToken) return Promise.resolve(false);
    if (!refreshing) {
      refreshing = fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })
        .then(async (r) => {
          if (!r.ok) return false;
          const d = await r.json();
          saveSession({ ...session, idToken: d.idToken, refreshToken: d.refreshToken });
          return true;
        })
        .catch(() => false)
        .finally(() => {
          refreshing = null;
        });
    }
    return refreshing;
  }

  async function api(path, { method = "GET", body, auth = true } = {}) {
    const send = () =>
      fetch(API + path, {
        method,
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(auth && session ? { Authorization: "Bearer " + session.idToken } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

    let r = await send();
    if (r.status === 401 && auth && (await refreshToken())) r = await send();

    let data = {};
    try {
      data = await r.json();
    } catch (_) {}

    if (r.status === 401 && auth) {
      sair(false);
      throw new Error(data.erro || "Sessão expirada. Faça login novamente.");
    }
    if (!r.ok) throw new Error(data.erro || "Erro na requisição.");
    return data;
  }

  function sair(avisar = true) {
    stopPolling();
    saveSession(null);
    if (avisar) toast("Você saiu da conta.", "info");
    location.hash = "#/login";
    route();
  }

  /* ---------- polling (atualiza o dashboard sozinho) ---------- */
  let pollTimer = null;
  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  /* ---------- LOGIN ---------- */
  function renderLogin() {
    $("#auth-view").innerHTML = `
      <div class="auth-card">
        <div class="logo-icon">${I.logo}</div>
        <h1>Acesse sua conta</h1>
        <p>Gerencie seu tempo e realize seus objetivos</p>
        <form id="formLogin" novalidate>
          <div class="form-group">
            <label for="emailLogin">E-mail</label>
            <input type="email" id="emailLogin" placeholder="exemplo@email.com" autocomplete="email" required>
          </div>
          <div class="form-group">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem;">
              <label for="senhaLogin" style="margin-bottom:0;">Senha</label>
              <a href="#" id="linkEsqueci" style="font-size:.82rem;">Esqueceu a senha?</a>
            </div>
            <div class="input-with-icon">
              <input type="password" id="senhaLogin" placeholder="••••••••" autocomplete="current-password" required>
              <button type="button" class="btn-toggle-password" data-target="senhaLogin" title="Mostrar senha">${I.eye}</button>
            </div>
          </div>
          <button type="submit" class="btn-primary">Entrar</button>
        </form>
        <div class="auth-footer">Não tem conta? <a href="#/cadastro">Cadastre-se</a></div>
      </div>`;

    $("#linkEsqueci").addEventListener("click", async (e) => {
      e.preventDefault();
      const email = $("#emailLogin").value.trim();
      if (!email) return toast("Digite seu e-mail no campo acima.", "error");
      try {
        const d = await api("/auth/forgot-password", { method: "POST", body: { email }, auth: false });
        toast(d.mensagem, "success");
      } catch (err) {
        toast(err.message, "error");
      }
    });

    $("#formLogin").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#emailLogin").value.trim();
      const senha = $("#senhaLogin").value;
      if (!email || !senha) return toast("Preencha e-mail e senha.", "error");
      const btn = e.target.querySelector('button[type="submit"]');
      const txt = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Entrando...";
      try {
        const d = await api("/auth/login", { method: "POST", body: { email, senha }, auth: false });
        saveSession({ uid: d.uid, nome: d.nome, email: d.email, idToken: d.idToken, refreshToken: d.refreshToken });
        location.hash = "#/";
        route();
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
        btn.textContent = txt;
      }
    });
  }

  /* ---------- CADASTRO ---------- */
  function renderCadastro() {
    $("#auth-view").innerHTML = `
      <div class="auth-card">
        <div class="logo-icon">${I.logo}</div>
        <h1>Crie sua conta</h1>
        <p>Organize seu dia de forma simples e prática</p>
        <form id="formCadastro" novalidate>
          <div class="form-group">
            <label for="nomeCad">Nome completo</label>
            <input type="text" id="nomeCad" placeholder="Seu nome aqui" autocomplete="name" required>
          </div>
          <div class="form-group">
            <label for="emailCad">E-mail</label>
            <input type="email" id="emailCad" placeholder="exemplo@email.com" autocomplete="email" required>
          </div>
          <div class="form-group">
            <label for="senhaCad">Senha</label>
            <div class="input-with-icon">
              <input type="password" id="senhaCad" placeholder="••••••••" autocomplete="new-password" required>
              <button type="button" class="btn-toggle-password" data-target="senhaCad" title="Mostrar senha">${I.eye}</button>
            </div>
          </div>
          <div class="form-group">
            <label for="confirmaSenhaCad">Confirmar senha</label>
            <input type="password" id="confirmaSenhaCad" placeholder="••••••••" autocomplete="new-password" required>
          </div>
          <button type="submit" class="btn-primary">Cadastrar</button>
        </form>
        <div class="auth-footer">Já tem conta? <a href="#/login">Faça login</a></div>
      </div>`;

    $("#formCadastro").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = $("#nomeCad").value.trim();
      const email = $("#emailCad").value.trim();
      const senha = $("#senhaCad").value;
      const conf = $("#confirmaSenhaCad").value;
      if (!nome) return toast("Informe seu nome.", "error");
      if (senha.length < 6) return toast("A senha deve ter no mínimo 6 caracteres.", "error");
      if (senha !== conf) return toast("As senhas não coincidem.", "error");

      const btn = e.target.querySelector('button[type="submit"]');
      const txt = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Cadastrando...";
      try {
        const d = await api("/auth/register", { method: "POST", body: { nome, email, senha }, auth: false });
        saveSession({ uid: d.uid, nome: d.nome, email: d.email, idToken: d.idToken, refreshToken: d.refreshToken });
        location.hash = "#/";
        route();
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
        btn.textContent = txt;
      }
    });
  }

  /* ---------- APP SHELL ---------- */
  function renderAppShell() {
    $("#app-view").innerHTML = `
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="logo-icon">${I.logo}</div>
          <div class="sidebar-logo-text"><h1>Daily Task</h1><span>Lembrete Diário</span></div>
        </div>
        <ul class="nav-menu">
          <li class="nav-item" data-route=""><span class="nav-icon">${I.home}</span> Hoje</li>
          <li class="nav-item" data-route="historico"><span class="nav-icon">${I.history}</span> Histórico</li>
          <li class="nav-item" data-route="perfil"><span class="nav-icon">${I.user}</span> Perfil</li>
        </ul>
        <div class="nav-item nav-logout" id="btnLogout"><span class="nav-icon">${I.logout}</span> Sair</div>
      </aside>
      <main class="main-content" id="main-content"></main>`;

    $("#btnLogout").addEventListener("click", () => sair(true));
    $$(".nav-item[data-route]").forEach((el) =>
      el.addEventListener("click", () => (location.hash = "#/" + el.dataset.route)),
    );
    $("#sidebarOverlay").addEventListener("click", closeSidebar);
  }

  function closeSidebar() {
    const s = $("#sidebar"), o = $("#sidebarOverlay");
    if (s) s.classList.remove("open");
    if (o) o.classList.remove("show");
  }
  function updateActiveNav(r) {
    $$(".nav-item[data-route]").forEach((el) => el.classList.toggle("active", el.dataset.route === r));
  }

  /* ---------- item de tarefa ---------- */
  function taskItemHTML(t, opts) {
    return `
      <div class="task-item" data-id="${esc(t.id)}">
        <div class="task-info">
          <input type="checkbox" class="custom-checkbox" ${t.concluida ? "checked" : ""}>
          <span class="task-title ${t.concluida ? "completed" : ""}">${esc(t.titulo)}</span>
        </div>
        <div class="task-actions">
          <span class="task-time">${I.clock} ${esc(t.hora || "")}</span>
          <span class="badge ${esc(t.prioridade || "media")}">${labelPrioridade(t.prioridade)}</span>
          ${opts.showStatus ? `<span class="badge ${t.concluida ? "concluida" : "pendente"}">${t.concluida ? "Concluída" : "Pendente"}</span>` : ""}
          ${opts.showEditDelete ? `<button class="btn-action" title="Editar" data-edit>${I.edit}</button>
            <button class="btn-action" title="Excluir" data-del>${I.trash}</button>` : ""}
        </div>
      </div>`;
  }

  /* ---------- DASHBOARD ---------- */
  function renderDashboard() {
    const mc = $("#main-content");
    mc.innerHTML = `
      <div class="header-top">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="mobile-menu-btn" id="mobileMenuBtn">${I.menu}</button>
          <h2 id="userGreeting">Olá, ${esc((session.nome || "").split(" ")[0] || "usuário")}!</h2>
        </div>
        <div class="header-actions">
          <button class="notification-button" id="notificationButton" type="button" aria-label="Notificações">
            ${I.bell}<span class="notification-badge" id="notificationBadge" data-count="0">0</span>
          </button>
          <a href="#/nova-tarefa" class="btn-add">${I.plus} Nova Tarefa</a>
        </div>
      </div>
      <div class="notification-panel" id="notificationPanel" hidden>
        <div class="notification-header"><strong>Lembretes</strong><span>Hoje</span></div>
        <ul id="notificationList" class="notification-list"></ul>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon blue">${I.tasks}</div><div class="stat-info"><p>Total de Tarefas</p><h3 id="statTotal">0</h3></div></div>
        <div class="stat-card"><div class="stat-icon green">${I.checkCircle}</div><div class="stat-info"><p>Concluídas</p><h3 id="statConcluidas">0</h3></div></div>
        <div class="stat-card"><div class="stat-icon orange">${I.pending}</div><div class="stat-info"><p>Pendentes</p><h3 id="statPendentes">0</h3></div></div>
        <div class="stat-card"><div class="stat-icon red">${I.alert}</div><div class="stat-info"><p>Alta Prioridade</p><h3 id="statAlta">0</h3></div></div>
      </div>
      <div class="task-list-container">
        <div class="task-list-header"><h3>Tarefas de Hoje</h3><span class="filter-badge">Todas as Prioridades</span></div>
        <div class="task-list-scroll" id="taskList"><div class="empty-state">Carregando...</div></div>
      </div>`;

    $("#mobileMenuBtn").addEventListener("click", () => {
      $("#sidebar").classList.add("open");
      $("#sidebarOverlay").classList.add("show");
    });
    $("#notificationButton").addEventListener("click", () => {
      const p = $("#notificationPanel");
      p.hidden = !p.hidden;
    });

    // nome atualizado vindo do servidor
    api("/users/me")
      .then((u) => {
        const el = $("#userGreeting");
        if (el) el.textContent = `Olá, ${String(u.nome || "").split(" ")[0] || "usuário"}!`;
      })
      .catch(() => {});

    const listEl = $("#taskList");

    async function carregar() {
      try {
        const d = await api("/tasks/hoje");
        if (!$("#taskList")) return; // saiu da tela
        const tarefas = d.tarefas;
        listEl.innerHTML = tarefas.length
          ? tarefas.map((t) => taskItemHTML(t, { showEditDelete: true, showStatus: false })).join("")
          : `<div class="empty-state">Nenhuma tarefa para hoje. Que tal criar uma?</div>`;

        $("#statTotal").textContent = d.stats.total;
        $("#statConcluidas").textContent = d.stats.concluidas;
        $("#statPendentes").textContent = d.stats.pendentes;
        $("#statAlta").textContent = d.stats.altaPrioridade;

        const pend = tarefas.filter((t) => t.lembrete && !t.concluida);
        const badge = $("#notificationBadge");
        badge.textContent = pend.length;
        badge.dataset.count = pend.length;
        $("#notificationList").innerHTML = pend.length
          ? pend.map((t) => `<li><span>${esc(t.titulo)}</span><small>${esc(t.hora || "")}</small></li>`).join("")
          : `<li style="padding:.75rem 1rem;color:var(--text-muted);font-size:.875rem;">Nenhum lembrete pendente hoje.</li>`;
      } catch (err) {
        if ($("#taskList")) listEl.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
      }
    }

    listEl.addEventListener("change", async (e) => {
      const cb = e.target.closest(".custom-checkbox");
      if (!cb) return;
      const id = cb.closest(".task-item").dataset.id;
      try {
        await api(`/tasks/${id}/concluir`, { method: "PATCH", body: { concluida: cb.checked } });
      } catch (err) {
        toast(err.message, "error");
      }
      carregar();
    });

    listEl.addEventListener("click", (e) => {
      const item = e.target.closest(".task-item");
      if (!item) return;
      const id = item.dataset.id;
      if (e.target.closest("[data-del]")) {
        confirmar("Excluir esta tarefa?", async () => {
          try {
            await api(`/tasks/${id}`, { method: "DELETE" });
            toast("Tarefa excluída.", "success");
            carregar();
          } catch (err) {
            toast(err.message, "error");
          }
        });
      } else if (e.target.closest("[data-edit]")) {
        location.hash = `#/editar-tarefa/${id}`;
      }
    });

    carregar();
    pollTimer = setInterval(carregar, 15000);
  }

  /* ---------- formulário de tarefa (nova/editar) ---------- */
  function formTarefaHTML(t, editar) {
    const prio = t.prioridade || "alta";
    return `
      <div style="margin-bottom:2rem;">
        <div class="breadcrumb">
          <a href="#/">Tarefas</a><span class="separator">${I.chevron}</span>
          <span class="current">${editar ? "Editar Tarefa" : "Nova Tarefa"}</span>
        </div>
        <h2 style="font-size:1.6rem;font-weight:700;">${editar ? "Editar Tarefa" : "Nova Tarefa"}</h2>
      </div>
      <div class="task-list-container" style="max-width:760px;padding:2.25rem 2.5rem;">
        <form id="formTarefa" novalidate>
          <div class="form-group">
            <label for="fTitulo">Título da tarefa</label>
            <input type="text" id="fTitulo" placeholder="Ex: Comprar leite e café" value="${esc(t.titulo || "")}" required>
          </div>
          <div class="form-group">
            <label for="fDescricao">Descrição (opcional)</label>
            <textarea id="fDescricao" rows="4" placeholder="Escreva observações adicionais...">${esc(t.descricao || "")}</textarea>
          </div>
          <div style="display:flex;gap:1.25rem;margin-bottom:1.25rem;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:200px;margin-bottom:0;">
              <label for="fData">Data</label>
              <div class="input-with-icon has-leading-icon">
                <span class="leading-icon">${I.calendar}</span>
                <input type="text" id="fData" value="${isoParaBR(t.data || hojeISO())}" placeholder="DD/MM/AAAA" required>
              </div>
            </div>
            <div class="form-group" style="flex:1;min-width:200px;margin-bottom:0;">
              <label for="fHora">Horário</label>
              <div class="input-with-icon has-leading-icon">
                <span class="leading-icon">${I.clock}</span>
                <input type="text" id="fHora" value="${esc(t.hora || "12:00")}" placeholder="HH:MM" required>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Prioridade</label>
            <div class="priority-options">
              ${["alta", "media", "baixa"].map((p) =>
                `<button type="button" class="priority-btn ${p} ${prio === p ? "active" : ""}" data-priority="${p}"><span class="dot"></span> ${labelPrioridade(p)}</button>`).join("")}
            </div>
            <input type="hidden" id="fPrioridade" value="${esc(prio)}">
          </div>
          <div class="reminder-row">
            <div class="reminder-text"><h4>Ativar lembrete por notificação</h4><p>Receba um aviso no horário agendado</p></div>
            <label class="switch"><input type="checkbox" id="fLembrete" ${t.lembrete === false ? "" : "checked"}><span class="slider"></span></label>
          </div>
          ${editar
            ? `<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:1.5rem;gap:12px;flex-wrap:wrap;">
                <button type="button" class="btn-danger-outline" id="btnExcluir">Excluir Tarefa</button>
                <div class="form-buttons" style="margin-top:0;">
                  <button type="button" class="btn-secondary" id="btnCancelar">Cancelar</button>
                  <button type="submit" class="btn-primary" style="width:auto;">Salvar Alterações</button>
                </div></div>`
            : `<div class="form-buttons">
                <button type="button" class="btn-secondary" id="btnCancelar">Cancelar</button>
                <button type="submit" class="btn-primary" style="width:auto;">Salvar Tarefa</button>
              </div>`}
        </form>
      </div>`;
  }

  function ligarFormTarefa(onSubmit) {
    $$(".priority-btn").forEach((b) =>
      b.addEventListener("click", () => {
        $$(".priority-btn").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        $("#fPrioridade").value = b.dataset.priority;
      }),
    );
    $("#btnCancelar").addEventListener("click", () => (location.hash = "#/"));
    $("#formTarefa").addEventListener("submit", async (e) => {
      e.preventDefault();
      const dados = {
        titulo: $("#fTitulo").value.trim(),
        descricao: $("#fDescricao").value.trim(),
        data: $("#fData").value.trim(),
        hora: $("#fHora").value.trim(),
        prioridade: $("#fPrioridade").value,
        lembrete: $("#fLembrete").checked,
      };
      if (!dados.titulo) return toast("Informe o título.", "error");
      const btn = e.target.querySelector('button[type="submit"]');
      const txt = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Salvando...";
      try {
        await onSubmit(dados);
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
        btn.textContent = txt;
      }
    });
  }

  function renderNovaTarefa() {
    $("#main-content").innerHTML = formTarefaHTML({}, false);
    ligarFormTarefa(async (dados) => {
      await api("/tasks", { method: "POST", body: dados });
      toast("Tarefa criada!", "success");
      location.hash = "#/";
    });
  }

  async function renderEditarTarefa(id) {
    const mc = $("#main-content");
    mc.innerHTML = `<div class="empty-state">Carregando...</div>`;
    if (!id) return (location.hash = "#/");
    let t;
    try {
      t = await api(`/tasks/${id}`);
    } catch (err) {
      toast(err.message, "error");
      return (location.hash = "#/");
    }
    mc.innerHTML = formTarefaHTML(t, true);
    ligarFormTarefa(async (dados) => {
      await api(`/tasks/${id}`, { method: "PUT", body: dados });
      toast("Tarefa atualizada!", "success");
      location.hash = "#/";
    });
    $("#btnExcluir").addEventListener("click", () =>
      confirmar("Excluir esta tarefa?", async () => {
        try {
          await api(`/tasks/${id}`, { method: "DELETE" });
          toast("Tarefa excluída.", "success");
          location.hash = "#/";
        } catch (err) {
          toast(err.message, "error");
        }
      }),
    );
  }

  /* ---------- PERFIL ---------- */
  async function renderPerfil() {
    const mc = $("#main-content");
    mc.innerHTML = `<div class="empty-state">Carregando...</div>`;
    let u;
    try {
      u = await api("/users/me");
    } catch (err) {
      return toast(err.message, "error");
    }
    mc.innerHTML = `
      <div style="margin-bottom:2rem;">
        <h2 style="font-size:1.6rem;font-weight:700;margin-bottom:.4rem;">Meu Perfil</h2>
        <p style="color:var(--text-muted);">Gerencie suas informações pessoais</p>
      </div>
      <div class="task-list-container" style="max-width:600px;padding:2.25rem 2.5rem;">
        <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;padding-bottom:2rem;border-bottom:1px solid var(--border-color);">
          <div style="width:80px;height:80px;border-radius:50%;background:var(--primary-blue);display:flex;align-items:center;justify-content:center;color:var(--white);flex-shrink:0;">
            <span style="width:40px;height:40px;display:block;">${I.user.replace("<svg", '<svg style="width:40px;height:40px;"')}</span>
          </div>
          <div style="min-width:0;">
            <h3 style="font-size:1.2rem;font-weight:600;margin-bottom:.2rem;">${esc(u.nome || "Sem nome")}</h3>
            <p style="color:var(--text-muted);font-size:.9rem;overflow:hidden;text-overflow:ellipsis;">${esc(u.email)}</p>
          </div>
        </div>
        <form id="formPerfil" novalidate>
          <div class="form-group"><label for="nomePerfil">Nome completo</label><input type="text" id="nomePerfil" value="${esc(u.nome)}" required></div>
          <div class="form-group"><label for="emailPerfil">E-mail</label><input type="email" id="emailPerfil" value="${esc(u.email)}" required></div>
          <div class="form-group">
            <label for="senhaAtual">Senha atual <span style="font-weight:400;color:var(--text-muted);font-size:.8rem;">(obrigatória para trocar e-mail/senha)</span></label>
            <div class="input-with-icon">
              <input type="password" id="senhaAtual" placeholder="••••••••" autocomplete="current-password">
              <button type="button" class="btn-toggle-password" data-target="senhaAtual" title="Mostrar senha">${I.eye}</button>
            </div>
          </div>
          <div class="form-group">
            <label for="novaSenha">Nova senha</label>
            <div class="input-with-icon">
              <input type="password" id="novaSenha" placeholder="••••••••" autocomplete="new-password">
              <button type="button" class="btn-toggle-password" data-target="novaSenha" title="Mostrar senha">${I.eye}</button>
            </div>
          </div>
          <div class="form-buttons">
            <button type="button" class="btn-secondary" id="btnCancelarPerfil">Cancelar</button>
            <button type="submit" class="btn-primary" style="width:auto;">Salvar Alterações</button>
          </div>
        </form>
      </div>`;

    $("#btnCancelarPerfil").addEventListener("click", () => (location.hash = "#/"));
    $("#formPerfil").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = $("#nomePerfil").value.trim();
      const email = $("#emailPerfil").value.trim();
      const senhaAtual = $("#senhaAtual").value;
      const novaSenha = $("#novaSenha").value;

      const body = { nome };
      if (email && email !== u.email) body.email = email;
      if (novaSenha) body.novaSenha = novaSenha;
      if (body.email || body.novaSenha) body.senhaAtual = senhaAtual;

      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "Salvando...";
      try {
        await api("/users/me", { method: "PUT", body });
        saveSession({ ...session, nome, email: body.email || session.email });
        u = { ...u, nome, email: body.email || u.email };
        toast("Perfil atualizado!", "success");
        $("#senhaAtual").value = "";
        $("#novaSenha").value = "";
      } catch (err) {
        toast(err.message, "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Salvar Alterações";
      }
    });
  }

  /* ---------- HISTÓRICO ---------- */
  function renderHistorico() {
    const mc = $("#main-content");
    mc.innerHTML = `
      <div style="margin-bottom:2rem;">
        <h2 style="font-size:1.6rem;font-weight:700;margin-bottom:.4rem;">Histórico de Tarefas</h2>
        <p style="color:var(--text-muted);">Veja o que você realizou nos dias anteriores</p>
      </div>
      <div class="filter-bar">
        <div class="filter-date-wrapper">
          <span style="font-size:.875rem;padding:0 .5rem;">De</span><input type="date" id="filtroDe">
          <span style="font-size:.875rem;padding:0 .5rem;">Até</span><input type="date" id="filtroAte">
        </div>
        <button class="btn-primary" id="btnFiltrar">Filtrar</button>
      </div>
      <div class="task-list-container"><div class="task-list-scroll" id="histList"></div></div>`;

    const container = $("#histList");
    async function carregar(de = "", ate = "") {
      container.innerHTML = `<div class="empty-state">Carregando...</div>`;
      const qs = new URLSearchParams();
      if (de) qs.set("de", de);
      if (ate) qs.set("ate", ate);
      try {
        const d = await api(`/tasks/historico${qs.toString() ? "?" + qs : ""}`);
        if (!d.dias.length) {
          container.innerHTML = `<div class="empty-state">Nenhum registro encontrado para o período.</div>`;
          return;
        }
        container.innerHTML = d.dias
          .map((dia) =>
            `<div class="date-header">${formatarDataHeader(dia.data)}</div>` +
            dia.tarefas.map((t) => taskItemHTML(t, { showEditDelete: false, showStatus: true })).join(""),
          )
          .join("");
      } catch (err) {
        container.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
      }
    }
    carregar();
    $("#btnFiltrar").addEventListener("click", () => carregar($("#filtroDe").value, $("#filtroAte").value));
  }

  /* ---------- ROUTER ---------- */
  function route() {
    stopPolling();
    showLoading(false);
    const hash = location.hash || "#/";

    // não logado → telas de auth
    if (!session) {
      $("#app-view").hidden = true;
      $("#app-view").innerHTML = "";
      $("#auth-view").hidden = false;
      if (hash === "#/cadastro") renderCadastro();
      else renderLogin();
      return;
    }

    // logado
    $("#auth-view").hidden = true;
    if (["#/login", "#/cadastro"].includes(hash)) {
      location.hash = "#/";
      return; // hashchange chama route() de novo
    }
    if ($("#app-view").hidden || !$("#main-content")) {
      renderAppShell();
      $("#app-view").hidden = false;
    }
    closeSidebar();

    const parts = hash.replace(/^#\/?/, "").split("/");
    const r = parts[0] || "";
    updateActiveNav(r);

    switch (r) {
      case "nova-tarefa": renderNovaTarefa(); break;
      case "editar-tarefa": renderEditarTarefa(parts[1]); break;
      case "perfil": renderPerfil(); break;
      case "historico": renderHistorico(); break;
      default: renderDashboard();
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);

  // alternar visibilidade de senha
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-toggle-password");
    if (!btn) return;
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const visivel = input.type === "text";
    input.type = visivel ? "password" : "text";
    btn.title = visivel ? "Mostrar senha" : "Ocultar senha";
  });

  // início
  route();
})();
