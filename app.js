if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
const STORAGE_KEY = "episode-buddy-v1";
let series = loadSeries();
let activeFilter = "all";

const $ = (id) => document.getElementById(id);
const addForm = $("addForm");
const list = $("seriesList");
const empty = $("emptyState");

function loadSeries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(series)); render(); }
function safeText(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function statusFor(item) {
  if (item.status === "completed") return "completed";
  if (item.status === "pending") return "pending";
  if (item.total && item.episode >= item.total) return "completed";
  return "watching";
}
function render() {
  const watching = series.filter(s => statusFor(s) === "watching").length;
  const pending = series.filter(s => statusFor(s) === "pending").length;
  const completed = series.filter(s => statusFor(s) === "completed").length;
  $("watchingCount").textContent = watching;
  $("pendingCount").textContent = pending;
  $("completedCount").textContent = completed;
  const filtered = series.filter(s => activeFilter === "all" || statusFor(s) === activeFilter);
  list.innerHTML = filtered.map(s => {
    const status = statusFor(s);
    const pct = s.total ? Math.min(100, Math.round(s.episode / s.total * 100)) : 0;
    const label = status === "completed" ? "Completed" : status === "pending" ? "Waiting for new episode" : "Watching";
    return `<article class="series-card">
      <div class="card-top"><div><h3>${safeText(s.title)}</h3><div class="meta">${safeText(s.type)} · Season ${s.season}</div></div><span class="type-tag">${label}</span></div>
      <div class="progress-label"><span>Episode ${s.episode}${s.total ? " / " + s.total : ""}</span><span>${s.total ? pct + "%" : "In progress"}</span></div>
      <div class="bar"><span style="width:${s.total ? pct : 8}%"></span></div>
      <div class="card-actions">
        <button class="small-btn positive" data-action="plus" data-id="${s.id}">＋ Episode watched</button>
        <button class="small-btn" data-action="pending" data-id="${s.id}">${status === "pending" ? "Mark watching" : "Waiting"}</button>
        <button class="small-btn" data-action="edit" data-id="${s.id}">Edit</button>
        ${s.url ? `<button class="small-btn" data-action="open" data-id="${s.id}">Open link ↗</button>` : ""}
        <button class="small-btn" data-action="delete" data-id="${s.id}">Delete</button>
      </div>
    </article>`;
  }).join("");
  empty.style.display = filtered.length ? "none" : "block";
}
addForm.addEventListener("submit", e => {
  e.preventDefault();
  const title = $("titleInput").value.trim();
  if (!title) return;
  series.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title, type: $("typeInput").value,
    season: Math.max(1, Number($("seasonInput").value) || 1),
    episode: Math.max(0, Number($("episodeInput").value) || 0),
    total: Math.max(0, Number($("totalInput").value) || 0),
    url: $("urlInput").value.trim(),
    status: "watching", addedAt: Date.now()
  });
  save(); addForm.reset(); $("seasonInput").value = 1; $("episodeInput").value = 0;
});
document.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click", () => {
  activeFilter = btn.dataset.filter;
  document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b === btn));
  render();
}));
list.addEventListener("click", e => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const item = series.find(s => s.id === btn.dataset.id);
  if (!item) return;
  switch (btn.dataset.action) {
    case "plus":
      item.episode++;
      if (item.total && item.episode >= item.total) item.status = "completed";
      else item.status = "watching";
      save(); break;
    case "pending":
      item.status = item.status === "pending" ? "watching" : "pending";
      save(); break;
    case "edit": openEdit(item); break;
    case "delete":
      if (confirm(`Delete "${item.title}" from your watchlist?`)) { series = series.filter(s => s.id !== item.id); save(); }
      break;
    case "open":
      if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
      break;
  }
});
function openEdit(s) {
  $("editId").value = s.id; $("editTitle").value = s.title;
  $("editSeason").value = s.season; $("editEpisode").value = s.episode;
  $("editTotal").value = s.total || ""; $("editUrl").value = s.url || "";
  $("editStatus").value = statusFor(s);
  $("editDialog").showModal();
}
$("editForm").addEventListener("submit", e => {
  if (e.submitter?.value !== "save") return;
  e.preventDefault();
  const s = series.find(x => x.id === $("editId").value);
  if (!s) return;
  s.title = $("editTitle").value.trim();
  s.season = Math.max(1, Number($("editSeason").value) || 1);
  s.episode = Math.max(0, Number($("editEpisode").value) || 0);
  s.total = Math.max(0, Number($("editTotal").value) || 0);
  s.url = $("editUrl").value.trim();
  s.status = $("editStatus").value;
  $("editDialog").close(); save();
});
$("notifyBtn").addEventListener("click", async () => {
  if (!("Notification" in window)) { alert("This browser does not support notifications. Try Chrome on Android."); return; }
  if (!("serviceWorker" in navigator)) { alert("Install/serve this app over HTTPS to enable app notifications."); return; }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const reg = await navigator.serviceWorker.ready;
      if (reg.showNotification) await reg.showNotification("Episode Buddy alerts enabled", { body: "You'll be able to receive episode reminders when release checking is connected.", icon: "icon.svg" });
      $("notifyBtn").textContent = "Alerts enabled";
    } else alert("Notifications were not enabled. You can allow them in your browser settings.");
  } catch { alert("Please open this app through HTTPS in a supported browser, then try again."); }
});
$("checkBtn").addEventListener("click", async () => {
  const now = new Date();
  $("lastCheck").textContent = "Demo check run: " + now.toLocaleString();
  const waiting = series.filter(s => statusFor(s) === "pending");
  const message = waiting.length
    ? `You have ${waiting.length} series waiting for a new episode. Automatic episode availability isn't connected in this starter version yet.`
    : "No series are marked as waiting. Automatic release checks aren't connected in this starter version yet.";
  if ("Notification" in window && Notification.permission === "granted" && "serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification("Episode Buddy check complete", { body: message, icon: "icon.svg" });
  } else alert(message);
});
render();
