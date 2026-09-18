const STATUS_LABEL = { active: "진행중", paused: "보류", archived: "폐기" };

const state = {
  data: null,
  activeProject: "all",
  query: "",
};

function applyStoredTheme() {
  try {
    const saved = localStorage.getItem("devlog-theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {}
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentlyDark = current ? current === "dark" : systemDark;
  const next = currentlyDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("devlog-theme", next); } catch (e) {}
}

function fmtDate(iso) {
  const [y, m, d] = iso.split("-");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(iso).getDay()];
  return `${y}.${m}.${d} (${weekday})`;
}

function renderStats() {
  const { projects, entries } = state.data;
  const active = projects.filter((p) => p.status === "active").length;
  document.getElementById("stats").innerHTML =
    `프로젝트 <b>${projects.length}</b>개 (진행중 <b>${active}</b>) · 기록 <b>${entries.length}</b>건`;
}

function renderSidebar() {
  const { projects } = state.data;
  const order = { active: 0, paused: 1, archived: 2 };
  const sorted = [...projects].sort((a, b) => order[a.status] - order[b.status] || (b.lastDate || "").localeCompare(a.lastDate || ""));

  const allItem = `
    <div class="project-item all ${state.activeProject === "all" ? "active" : ""}" data-project="all">
      <span class="project-item-label">전체</span>
      <span class="count">${state.data.entries.length}</span>
    </div>`;

  const items = sorted.map((p) => `
    <div class="project-item ${state.activeProject === p.id ? "active" : ""}" data-project="${p.id}" title="${escapeHtml(p.desc || "")}">
      <span class="project-item-label">
        <span class="status-dot ${p.status}"></span>
        <span class="project-item-text">
          <span class="project-item-name">${p.name}</span>
          <span class="project-item-desc">${escapeHtml(p.desc || "")}</span>
        </span>
      </span>
      <span class="count">${p.entryCount}</span>
    </div>
  `).join("");

  document.getElementById("projectList").innerHTML = allItem + items;

  document.querySelectorAll(".project-item").forEach((el) => {
    el.addEventListener("click", () => {
      state.activeProject = el.dataset.project;
      renderSidebar();
      renderTimeline();
    });
  });
}

function matchesQuery(entry) {
  if (!state.query) return true;
  const q = state.query.toLowerCase();
  return (
    entry.title.toLowerCase().includes(q) ||
    entry.projectName.toLowerCase().includes(q) ||
    entry.bodyMd.toLowerCase().includes(q)
  );
}

function renderTimeline() {
  const el = document.getElementById("timeline");
  let entries = state.data.entries;
  if (state.activeProject !== "all") {
    entries = entries.filter((e) => e.projectId === state.activeProject);
  }
  entries = entries.filter(matchesQuery);

  const activeProject = state.activeProject !== "all"
    ? state.data.projects.find((p) => p.id === state.activeProject)
    : null;
  const headerHtml = activeProject ? `
    <div class="project-header">
      <span class="status-dot ${activeProject.status}"></span>
      <div class="project-header-text">
        <div class="project-header-name">${escapeHtml(activeProject.name)}</div>
        <div class="project-header-desc">${escapeHtml(activeProject.desc || "")}</div>
      </div>
    </div>
  ` : "";

  if (!entries.length) {
    el.innerHTML = headerHtml + `<div class="empty">기록이 없습니다.</div>`;
    return;
  }

  const groups = [];
  let lastDate = null;
  for (const e of entries) {
    if (e.date !== lastDate) {
      groups.push({ date: e.date, items: [] });
      lastDate = e.date;
    }
    groups[groups.length - 1].items.push(e);
  }

  el.innerHTML = headerHtml + groups.map((g) => `
    <div class="day-group">
      <div class="day-label">${fmtDate(g.date)}</div>
      ${g.items.map((e) => `
        <div class="entry" data-id="${e.id}">
          <div class="entry-head">
            <span class="entry-badge ${e.status}">${e.projectName}</span>
            <span class="entry-title">${escapeHtml(e.title)}</span>
            <span class="entry-toggle">▸</span>
          </div>
          <div class="entry-body">${marked.parse(e.bodyMd || "_내용 없음_")}</div>
        </div>
      `).join("")}
    </div>
  `).join("");

  el.querySelectorAll(".entry-head").forEach((head) => {
    head.addEventListener("click", () => {
      head.closest(".entry").classList.toggle("open");
    });
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

async function init() {
  applyStoredTheme();
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document.getElementById("search").addEventListener("input", debounce((e) => {
    state.query = e.target.value.trim();
    renderTimeline();
  }, 150));

  const res = await fetch("data.json", { cache: "no-store" });
  state.data = await res.json();

  renderStats();
  renderSidebar();
  renderTimeline();

  const gen = new Date(state.data.generatedAt);
  document.getElementById("generatedAt").textContent = `마지막 생성: ${gen.toLocaleString("ko-KR")}`;
}

init();
