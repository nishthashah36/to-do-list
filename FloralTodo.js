// Floral Todo — a personal iPhone task list for Scriptable.
// Data stays in iCloud Drive inside Scriptable's folder.

const fm = FileManager.iCloud();
const folder = fm.joinPath(fm.documentsDirectory(), "FloralTodo");
const dataFile = fm.joinPath(folder, "tasks.json");

if (!fm.fileExists(folder)) fm.createDirectory(folder, true);

let tasks = await loadTasks();

if (config.runsInWidget) {
  const widget = await makeWidget(tasks);
  Script.setWidget(widget);
} else {
  tasks = await showEditor(tasks);
  await saveTasks(tasks);
}

Script.complete();

async function loadTasks() {
  if (!fm.fileExists(dataFile)) return [];
  try {
    await fm.downloadFileFromiCloud(dataFile);
    const saved = JSON.parse(fm.readString(dataFile));
    return Array.isArray(saved) ? saved : [];
  } catch (_) {
    return [];
  }
}

async function saveTasks(nextTasks) {
  fm.writeString(dataFile, JSON.stringify(nextTasks, null, 2));
}

function priorityRank(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 1;
}

function sortedOpenTasks(items) {
  return items
    .filter((task) => !task.completed)
    .sort((a, b) => {
      const dateA = a.dueDate || "9999-12-31";
      const dateB = b.dueDate || "9999-12-31";
      return dateA.localeCompare(dateB) || priorityRank(a.priority) - priorityRank(b.priority);
    });
}

async function makeWidget(items) {
  const widget = new ListWidget();
  const gradient = new LinearGradient();
  gradient.colors = [new Color("#fff5fa"), new Color("#eef7ff")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  widget.setPadding(14, 15, 12, 15);
  widget.url = URLScheme.forRunningScript();

  const header = widget.addStack();
  header.centerAlignContent();
  const title = header.addText("Today’s list");
  title.font = Font.boldSystemFont(16);
  title.textColor = new Color("#4d4661");
  header.addSpacer();
  const flower = header.addText("✿  ❀");
  flower.font = Font.systemFont(14);
  flower.textColor = new Color("#df86b2");
  widget.addSpacer(8);

  const open = sortedOpenTasks(items);
  const limit = config.widgetFamily === "large" ? 8 : config.widgetFamily === "medium" ? 4 : 3;

  if (!open.length) {
    widget.addSpacer();
    const empty = widget.addText("All clear — your garden is blooming 🌷");
    empty.font = Font.mediumSystemFont(13);
    empty.textColor = new Color("#74708a");
    empty.centerAlignText();
    widget.addSpacer();
  } else {
    for (const task of open.slice(0, limit)) {
      const row = widget.addStack();
      row.centerAlignContent();
      const dot = row.addText({ high: "●", medium: "●", low: "●" }[task.priority] || "●");
      dot.font = Font.systemFont(9);
      dot.textColor = new Color({ high: "#d85f91", medium: "#719bd6", low: "#d8a8c1" }[task.priority] || "#719bd6");
      row.addSpacer(7);
      const label = row.addText(task.title);
      label.font = Font.mediumSystemFont(12);
      label.textColor = new Color("#4d4661");
      label.lineLimit = 1;
      widget.addSpacer(6);
    }
  }

  widget.addSpacer();
  const footer = widget.addStack();
  const completed = items.filter((task) => task.completed).length;
  const count = footer.addText(`${completed} completed  ·  ${open.length} left`);
  count.font = Font.systemFont(10);
  count.textColor = new Color("#8b86a0");
  footer.addSpacer();
  const add = footer.addText("＋ Add");
  add.font = Font.semiboldSystemFont(11);
  add.textColor = new Color("#668fc8");
  return widget;
}

async function showEditor(initialTasks) {
  const web = new WebView();
  await web.loadHTML(editorHTML(initialTasks));
  await web.present(false);
  try {
    const result = await web.evaluateJavaScript("JSON.stringify(tasks)");
    const parsed = JSON.parse(result);
    return Array.isArray(parsed) ? parsed : initialTasks;
  } catch (_) {
    return initialTasks;
  }
}

function editorHTML(initialTasks) {
  const safeTasks = JSON.stringify(initialTasks).replace(/</g, "\\u003c");
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    :root { --ink:#4d4661; --muted:#8b86a0; --pink:#e783b3; --blue:#78a4dc; --paper:#fffafd; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      background:linear-gradient(145deg,#fff4fa 0%,#eef7ff 100%); min-height:100vh; }
    body::before { content:"✿  ·  ❀       ✧  ✿       ❀  ·  ✿"; position:fixed; inset:12px 10px auto;
      color:#e8a8c6; opacity:.55; font-size:14px; letter-spacing:12px; pointer-events:none; }
    .wrap { max-width:680px; margin:auto; padding:48px 18px 90px; }
    header { display:flex; align-items:end; justify-content:space-between; margin-bottom:20px; }
    h1 { margin:0; font-family:Georgia,serif; font-size:32px; font-weight:500; }
    .date { color:var(--muted); font-size:13px; margin-top:4px; }
    .progress { background:#ffffffa8; border:1px solid #fff; padding:8px 12px; border-radius:999px; font-size:12px; }
    .tabs { display:flex; gap:8px; overflow:auto; margin-bottom:14px; }
    .tab { border:0; color:var(--muted); background:#ffffff9c; padding:9px 14px; border-radius:999px; font-weight:600; }
    .tab.active { background:#85abdc; color:white; }
    .task { display:grid; grid-template-columns:28px 1fr auto; gap:10px; align-items:center; background:#ffffffcf;
      border:1px solid #fff; border-radius:17px; margin:9px 0; padding:13px 12px; box-shadow:0 6px 20px #7870a00e; }
    .check { appearance:none; width:22px; height:22px; border:2px solid #c7bcd1; border-radius:50%; margin:0; }
    .check:checked { background:var(--pink); border-color:var(--pink); box-shadow:inset 0 0 0 5px #fff; }
    .task.done .title { text-decoration:line-through; color:#aaa4b5; }
    .title { font-size:15px; font-weight:650; }
    .meta { font-size:11px; color:var(--muted); margin-top:4px; display:flex; gap:7px; flex-wrap:wrap; }
    .priority { width:9px; height:9px; border-radius:50%; }
    .high { background:#d85f91; } .medium { background:#719bd6; } .low { background:#d8a8c1; }
    .empty { text-align:center; padding:50px 20px; color:var(--muted); }
    .empty b { display:block; font-family:Georgia,serif; color:var(--ink); font-size:20px; margin:10px; }
    .add { position:fixed; right:22px; bottom:26px; border:0; border-radius:999px; padding:14px 20px;
      color:white; background:linear-gradient(110deg,#e77fad,#719bd6); font-size:15px; font-weight:700; box-shadow:0 8px 22px #8b76af40; }
    .modal { display:none; position:fixed; inset:0; z-index:20; align-items:center; justify-content:center; padding:20px; background:#51456355; backdrop-filter:blur(3px); }
    .modal.show { display:flex; }
    .modal-card { border-radius:22px; padding:0; width:min(90vw,430px); max-height:90vh; overflow:auto; color:var(--ink); box-shadow:0 22px 80px #51456355; }
    form { padding:22px; background:var(--paper); }
    form h2 { margin:0 0 16px; font-family:Georgia,serif; font-weight:500; }
    label { display:block; font-size:12px; font-weight:700; color:var(--muted); margin:12px 0 5px; }
    input,select { width:100%; border:1px solid #ddd5e3; border-radius:12px; padding:11px; background:white; color:var(--ink); font-size:15px; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .actions { display:flex; justify-content:flex-end; gap:9px; margin-top:20px; }
    .actions button { border:0; border-radius:11px; padding:10px 15px; font-weight:700; }
    .cancel { background:#eeeaf1; color:var(--ink); } .save { background:#719bd6; color:white; }
    .delete { margin-right:auto; background:#fbe5ee; color:#b84e78; }
  </style>
</head>
<body>
  <div class="wrap">
    <header><div><h1>My little list</h1><div class="date" id="date"></div></div><div class="progress" id="progress"></div></header>
    <nav class="tabs"><button class="tab active" data-view="today">Today</button><button class="tab" data-view="all">All tasks</button><button class="tab" data-view="done">Completed</button></nav>
    <main id="list"></main>
  </div>
  <button class="add" onclick="openForm()">＋ Add task</button>
  <div class="modal" id="modal" onclick="closeFromBackdrop(event)"><div class="modal-card"><form onsubmit="saveForm(event)">
    <h2 id="formTitle">New task</h2><input type="hidden" id="taskId">
    <label>Task</label><input id="title" required maxlength="120" placeholder="What needs doing?">
    <div class="grid"><div><label>Priority</label><select id="priority"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select></div>
    <div><label>Category</label><input id="category" maxlength="40" placeholder="School, Personal…"></div></div>
    <label>Due date (optional)</label><input id="dueDate" type="date">
    <div class="actions"><button type="button" class="delete" id="deleteBtn" onclick="deleteTask()">Delete</button><button type="button" class="cancel" onclick="closeForm()">Cancel</button><button class="save">Save</button></div>
  </form></div></div>
  <script>
    let tasks = ${safeTasks};
    let view = 'today';
    const today = new Date().toISOString().slice(0,10);
    const byId = id => document.getElementById(id);
    const listEl = byId('list');
    const progressEl = byId('progress');
    const modalEl = byId('modal');
    const formTitleEl = byId('formTitle');
    const taskIdEl = byId('taskId');
    const titleEl = byId('title');
    const priorityEl = byId('priority');
    const categoryEl = byId('category');
    const dueDateEl = byId('dueDate');
    const deleteBtnEl = byId('deleteBtn');
    const esc = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    document.querySelector('#date').textContent = new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
    document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{ view=b.dataset.view; document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b)); render(); });
    function visible(){ let a=[...tasks]; if(view==='done') a=a.filter(t=>t.completed); else if(view==='today') a=a.filter(t=>!t.completed && (!t.dueDate || t.dueDate<=today)); else a=a.filter(t=>!t.completed); return a.sort((x,y)=>(x.dueDate||'9999').localeCompare(y.dueDate||'9999') || ({high:0,medium:1,low:2}[x.priority]-({high:0,medium:1,low:2}[y.priority]))); }
    function render(){ const a=visible(), done=tasks.filter(t=>t.completed).length; progressEl.textContent=done+' completed · '+tasks.filter(t=>!t.completed).length+' left'; listEl.innerHTML=a.length?a.map(t=>'<article class="task '+(t.completed?'done':'')+'"><input class="check" type="checkbox" '+(t.completed?'checked':'')+' onchange="toggle(\''+t.id+'\')"><div onclick="openForm(\''+t.id+'\')"><div class="title">'+esc(t.title)+'</div><div class="meta">'+(t.category?'<span>'+esc(t.category)+'</span>':'')+(t.dueDate?'<span>'+esc(t.dueDate)+(t.dueDate<today?' · overdue':'')+'</span>':'')+'</div></div><span class="priority '+t.priority+'"></span></article>').join(''):'<div class="empty">❀<b>Nothing growing here yet</b>Add a task when you’re ready.</div>'; }
    function toggle(id){ const t=tasks.find(x=>x.id===id); if(t){t.completed=!t.completed; render();} }
    function openForm(id){ const t=tasks.find(x=>x.id===id); formTitleEl.textContent=t?'Edit task':'New task'; taskIdEl.value=t?.id||''; titleEl.value=t?.title||''; priorityEl.value=t?.priority||'medium'; categoryEl.value=t?.category||''; dueDateEl.value=t?.dueDate||''; deleteBtnEl.style.visibility=t?'visible':'hidden'; modalEl.classList.add('show'); if(!t) setTimeout(()=>titleEl.focus(),100); }
    function closeForm(){ modalEl.classList.remove('show'); }
    function closeFromBackdrop(e){ if(e.target===modalEl) closeForm(); }
    function saveForm(e){ e.preventDefault(); const id=taskIdEl.value; const data={title:titleEl.value.trim(),priority:priorityEl.value,category:categoryEl.value.trim(),dueDate:dueDateEl.value}; if(id){Object.assign(tasks.find(x=>x.id===id),data);}else{tasks.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2),completed:false,createdAt:new Date().toISOString(),...data});} closeForm(); render(); }
    function deleteTask(){ tasks=tasks.filter(x=>x.id!==taskIdEl.value); closeForm(); render(); }
    render();
  </script>
</body></html>`;
}
