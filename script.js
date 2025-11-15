// Basic To-Do app using localStorage
(() => {
  const STORAGE_KEY = "todo_app_tasks_v1";

  // DOM
  const titleInput = document.getElementById("task-title");
  const descInput = document.getElementById("task-desc");
  const dueInput = document.getElementById("task-due");
  const prioritySelect = document.getElementById("task-priority");
  const addBtn = document.getElementById("add-btn");
  const tasksList = document.getElementById("tasks-list");
  const searchInput = document.getElementById("search");
  const filterRadios = Array.from(document.querySelectorAll('input[name="filter"]'));
  const clearCompletedBtn = document.getElementById("clear-completed");

  // Edit modal
  const editModal = document.getElementById("edit-modal");
  const editTitle = document.getElementById("edit-title");
  const editDesc = document.getElementById("edit-desc");
  const editDue = document.getElementById("edit-due");
  const editPriority = document.getElementById("edit-priority");
  const saveEditBtn = document.getElementById("save-edit");
  const cancelEditBtn = document.getElementById("cancel-edit");

  let tasks = [];
  let currentlyEditingId = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load tasks", e);
      tasks = [];
    }
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function createTaskObject({title, desc, due, priority}) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      title: title.trim(),
      desc: desc.trim(),
      createdAt: new Date().toISOString(),
      due: due || null,
      priority: priority || "normal",
      completed: false,
      completedAt: null,
      updatedAt: new Date().toISOString()
    };
  }

  function addTaskFromInputs() {
    const title = titleInput.value;
    if (!title.trim()) {
      alert("Please enter a task title.");
      return;
    }
    const task = createTaskObject({
      title,
      desc: descInput.value || "",
      due: dueInput.value || null,
      priority: prioritySelect.value || "normal"
    });
    tasks.unshift(task);
    save();
    clearAddForm();
    render();
  }

  function clearAddForm(){
    titleInput.value = "";
    descInput.value = "";
    dueInput.value = "";
    prioritySelect.value = "normal";
    titleInput.focus();
  }

  function render() {
    const filter = getFilter();
    const q = (searchInput.value || "").toLowerCase().trim();
    tasksList.innerHTML = "";

    const filtered = tasks.filter(t => {
      if (filter === "active" && t.completed) return false;
      if (filter === "completed" && !t.completed) return false;
      if (q) {
        const hay = (t.title + " " + t.desc).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      const box = document.createElement("div");
      box.className = "task";
      box.innerHTML = `<div class="main"><h3>No tasks</h3><p class="muted">Add a new task to get started.</p></div>`;
      tasksList.appendChild(box);
      return;
    }

    filtered.forEach(task => {
      tasksList.appendChild(renderTaskElement(task));
    });
  }

  function renderTaskElement(task) {
    const el = document.createElement("div");
    el.className = "task" + (task.completed ? " completed" : "");
    el.dataset.id = task.id;

    const left = document.createElement("div"); left.className = "left";
    const chk = document.createElement("input"); chk.type = "checkbox"; chk.checked = !!task.completed;
    chk.addEventListener("change", () => toggleComplete(task.id, chk.checked));
    left.appendChild(chk);

    const main = document.createElement("div"); main.className = "main";
    const title = document.createElement("h3"); title.textContent = task.title;
    const desc = document.createElement("p"); desc.textContent = task.desc || "";
    main.appendChild(title);
    if (task.desc) main.appendChild(desc);

    const meta = document.createElement("div"); meta.className = "meta";
    const pri = document.createElement("span"); pri.className = "priority " + task.priority; pri.textContent = task.priority;
    meta.appendChild(pri);

    if (task.due) {
      const dueSpan = document.createElement("span");
      const dt = new Date(task.due);
      // format nicely
      const fmt = dt.toLocaleString();
      dueSpan.textContent = "Due: " + fmt;
      meta.appendChild(dueSpan);
    }

    // created/updated
    const createdSpan = document.createElement("span");
    createdSpan.textContent = "Added: " + new Date(task.createdAt).toLocaleDateString();
    meta.appendChild(createdSpan);

    main.appendChild(meta);

    const actions = document.createElement("div"); actions.className = "actions";
    const editBtn = document.createElement("button"); editBtn.className = "small-btn"; editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openEdit(task.id));
    const delBtn = document.createElement("button"); delBtn.className = "small-btn"; delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => removeTask(task.id));
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    el.appendChild(left);
    el.appendChild(main);
    el.appendChild(actions);

    return el;
  }

  function getFilter(){
    const sel = filterRadios.find(r=>r.checked);
    return sel ? sel.value : "all";
  }

  function toggleComplete(id, completed) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.completed = !!completed;
    t.completedAt = t.completed ? new Date().toISOString() : null;
    t.updatedAt = new Date().toISOString();
    save();
    render();
  }

  function removeTask(id) {
    if (!confirm("Delete this task?")) return;
    tasks = tasks.filter(t => t.id !== id);
    save();
    render();
  }

  function openEdit(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    currentlyEditingId = id;
    editTitle.value = t.title;
    editDesc.value = t.desc || "";
    editDue.value = t.due || "";
    editPriority.value = t.priority || "normal";
    editModal.classList.remove("hidden");
  }

  function closeEdit() {
    currentlyEditingId = null;
    editModal.classList.add("hidden");
  }

  function saveEdit() {
    if (!currentlyEditingId) return;
    const t = tasks.find(x => x.id === currentlyEditingId);
    if (!t) return;
    const newTitle = editTitle.value.trim();
    if (!newTitle) { alert("Title can't be empty"); return; }
    t.title = newTitle;
    t.desc = editDesc.value.trim();
    t.due = editDue.value || null;
    t.priority = editPriority.value || "normal";
    t.updatedAt = new Date().toISOString();
    save();
    closeEdit();
    render();
  }

  function clearCompleted() {
    if (!confirm("Remove all completed tasks?")) return;
    tasks = tasks.filter(t => !t.completed);
    save();
    render();
  }

  // events
  addBtn.addEventListener("click", addTaskFromInputs);
  titleInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addTaskFromInputs(); }
  });

  searchInput.addEventListener("input", debounce(render, 200));
  filterRadios.forEach(r => r.addEventListener("change", render));
  clearCompletedBtn.addEventListener("click", clearCompleted);

  cancelEditBtn.addEventListener("click", closeEdit);
  saveEditBtn.addEventListener("click", saveEdit);
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeEdit();
  });

  // helpers
  function debounce(fn, ms = 150){
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(()=> fn(...args), ms);
    };
  }

  // initial load
  load();
  render();

  // expose small API for debugging (optional)
  window.todoApp = {
    addTaskFromInputs, load, save, tasks
  };
})();
