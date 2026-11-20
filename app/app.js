// GTA VI Trophy Guide & Tracker — checklist, filters, spoiler setting, export/import.
// Plain ES module, no dependencies, no network at run time beyond app/data/trophies.json.

const STORAGE_KEY = "gta6-trophy-guide-progress-v1";
const DATA_URL = "data/trophies.json";

const KIND_LABELS = {
  all: "All",
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
  strangers: "Strangers",
  crime: "Crime",
  money: "Money",
  secrets: "Secrets",
  platinum: "Platinum",
};

const ROADMAP = [
  { stage: 1, title: "Chapter 1 first", text: "Do Lucia's balcony meditation right after Down to Earth — the one thing you can miss — then start the story." },
  { stage: 2, title: "Finish the story", text: "Chapters 1–4 and the final mission. Every story trophy pops as you play." },
  { stage: 3, title: "Strangers & Freaks", text: "Eight stranger strands, the five character finales, and Bret's hunting." },
  { stage: 4, title: "Activities & skills", text: "Stunts, shooting-range golds, drone races, races, arcade, fishing and Combat Focus." },
  { stage: 5, title: "Collectibles & the map", text: "Cards, WAiNK scans, vehicles, full exploration, garages and Scooter Bros." },
  { stage: 6, title: "Crime & money", text: "Vaults, trucks, shops, jewelry, gang operations, laundering and big spending." },
  { stage: 7, title: "100% and the platinum", text: "Finish the completion checklist, mop up the unconfirmed ones, and the platinum is yours." },
];

// Trophies whose exact method the guides still have not confirmed.
const UNCONFIRMED = new Set([38, 44, 45, 49, 50, 51]);

const state = {
  trophies: [],
  earned: new Set(),
  kind: "all",
  grade: "",
  query: "",
  spoiler: true,
  earnedOnly: false,
};

const $ = (sel) => document.querySelector(sel);

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (Array.isArray(ids)) state.earned = new Set(ids.filter((n) => Number.isInteger(n)));
  } catch {
    state.earned = new Set();
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...state.earned].sort((a, b) => a - b) }));
}

function gradeWord(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sourceLinks(trophy) {
  return (trophy.sources || [])
    .map((s) => (s.url ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a>` : escapeHtml(s.name)))
    .join(" · ");
}

function trophyCard(trophy) {
  const earned = state.earned.has(trophy.id);
  const hiddenBySpoiler = state.spoiler && trophy.hidden && !earned;
  const article = document.createElement("article");
  article.className = "trophy-card" + (earned ? " earned" : "") + (hiddenBySpoiler ? " hidden-spoiler" : "");
  article.dataset.id = String(trophy.id);

  if (hiddenBySpoiler) {
    article.innerHTML = `
      <div class="trophy-head">
        <input type="checkbox" class="earn-box earn-toggle" aria-label="Mark hidden trophy earned" ${earned ? "checked" : ""}>
        <span class="grade-badge grade-bronze">?</span>
        <h3 class="trophy-name">Hidden story trophy</h3>
      </div>
      <p class="spoiler-note">Its name and guide stay hidden until you earn it — tick the box once it pops in-game to reveal it here.</p>`;
    return article;
  }

  const tags = [`<span class="tag">${escapeHtml(KIND_LABELS[trophy.kind] || trophy.kind)}</span>`];
  if (trophy.missable) tags.push(`<span class="tag missable">Possibly missable</span>`);
  if (UNCONFIRMED.has(trophy.id)) tags.push(`<span class="tag unconfirmed">Method unconfirmed</span>`);
  if (trophy.hidden) tags.push(`<span class="tag">Hidden on PSN</span>`);

  article.innerHTML = `
    <div class="trophy-head">
      <input type="checkbox" class="earn-box earn-toggle" aria-label="Mark ${escapeHtml(trophy.name)} earned" ${earned ? "checked" : ""}>
      <span class="grade-badge grade-${escapeHtml(trophy.grade)}">${escapeHtml(gradeWord(trophy.grade))}</span>
      <h3 class="trophy-name">${escapeHtml(trophy.name)}</h3>
    </div>
    <p class="trophy-desc">${escapeHtml(trophy.description)}</p>
    <div class="trophy-tags">${tags.join("")}</div>
    <p class="trophy-guide"><strong>Guide:</strong> ${escapeHtml(trophy.guide)}</p>
    <p class="trophy-sources">Sources: ${sourceLinks(trophy)}</p>`;
  return article;
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.kind === "missable" && !t.missable) return false;
    if (state.kind !== "all" && state.kind !== "missable" && t.kind !== state.kind) return false;
    if (state.grade && t.grade !== state.grade) return false;
    if (state.earnedOnly && !state.earned.has(t.id)) return false;
    if (q && !(t.name + " " + t.description + " " + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderRoadmap() {
  const list = $("#roadmap-stages");
  list.innerHTML = "";
  for (const step of ROADMAP) {
    const mine = state.trophies.filter((t) => t.stage === step.stage);
    const done = mine.filter((t) => state.earned.has(t.id)).length;
    const li = document.createElement("li");
    li.className = "roadmap-stage";
    li.dataset.stage = String(step.stage);
    li.innerHTML = `<h3>${step.stage}. ${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p><span class="roadmap-count">${done} / ${mine.length} earned</span>`;
    list.appendChild(li);
  }
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("#progress-count").textContent = `${done} / ${total} trophies`;
  $("#progress-pct").textContent = `${pct}%`;
  $("#progress-fill").style.width = `${pct}%`;
  const byGrade = {};
  for (const t of state.trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { done: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (state.earned.has(t.id)) byGrade[t.grade].done += 1;
  }
  $("#progress-grades").textContent = ["platinum", "gold", "silver", "bronze"]
    .map((g) => `${gradeWord(g)} ${byGrade[g].done}/${byGrade[g].total}`)
    .join(" · ");
}

function renderGrid() {
  const grid = $("#trophy-grid");
  grid.innerHTML = "";
  const list = visibleTrophies();
  for (const t of list) grid.appendChild(trophyCard(t));
  $("#result-count").textContent = `Showing ${list.length} of ${state.trophies.length} trophies · ${state.earned.size} earned`;
  $("#empty-note").hidden = list.length !== 0;
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderGrid();
}

function renderKindChips() {
  const wrap = $("#kind-chips");
  wrap.innerHTML = "";
  for (const [kind, label] of Object.entries(KIND_LABELS)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "kind-chip" + (state.kind === kind ? " active" : "");
    btn.dataset.kind = kind;
    btn.textContent = label;
    btn.addEventListener("click", () => {
      state.kind = kind;
      renderKindChips();
      renderGrid();
    });
    wrap.appendChild(btn);
  }
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function init() {
  loadProgress();
  const res = await fetch(DATA_URL);
  const data = await res.json();
  state.trophies = data.trophies || data;
  renderKindChips();
  renderAll();

  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderGrid();
  });
  $("#grade-filter").addEventListener("change", (e) => {
    state.grade = e.target.value;
    renderGrid();
  });
  $("#spoiler-toggle").addEventListener("change", (e) => {
    state.spoiler = e.target.checked;
    renderGrid();
  });
  $("#earned-only").addEventListener("change", (e) => {
    state.earnedOnly = e.target.checked;
    renderGrid();
  });
  $("#trophy-grid").addEventListener("change", (e) => {
    const box = e.target.closest(".earn-toggle");
    if (!box) return;
    const card = box.closest(".trophy-card");
    const id = Number(card.dataset.id);
    if (box.checked) state.earned.add(id);
    else state.earned.delete(id);
    saveProgress();
    renderAll();
  });
  $("#export-btn").addEventListener("click", () => {
    download("gta6-trophy-progress.json", JSON.stringify({ game: "Grand Theft Auto VI", exported_at: new Date().toISOString(), earned: [...state.earned].sort((a, b) => a - b) }, null, 2));
  });
  $("#import-btn").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error("bad file");
      const known = new Set(state.trophies.map((t) => t.id));
      state.earned = new Set(ids.filter((n) => Number.isInteger(n) && known.has(n)));
      saveProgress();
      renderAll();
    } catch {
      alert("That file is not a progress export from this guide.");
    }
    e.target.value = "";
  });
  $("#reset-btn").addEventListener("click", () => {
    if (confirm("Clear all earned trophies?")) {
      state.earned = new Set();
      saveProgress();
      renderAll();
    }
  });
}

init();
