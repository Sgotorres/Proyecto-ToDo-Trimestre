let tasks = [];
let gridMode = false;
let currentTaskIndex = null;
let editMode = false;

document.getElementById("addBtn").addEventListener("click", addTask);
document.getElementById("toggleViewBtn").addEventListener("click", toggleView);
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("editModalBtn").addEventListener("click", enableEditInModal);
document.getElementById("saveModalBtn").addEventListener("click", saveModal);
document.getElementById("finishModalBtn").addEventListener("click", finishModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function addTask(){
  const input = document.getElementById("taskInput");
  const text = input.value.trim();
  if(text.length === 0){
    alert("No puedes agregar una tarea vacía.");
    return;
  }
  if(text.length < 5){
    alert("La tarea debe tener al menos 5 caracteres.");
    return;
  }
  if(text.length > 100){
    alert("La tarea no puede superar los 100 caracteres.");
    return;
  }
  tasks.push({ text, deleted:false });
  input.value = "";
  renderTasks();
}

function renderTasks(){
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  const mapped = tasks.map((task, idx) => ({ task, idx }));
  const active = mapped.filter(x => !x.task.deleted);
  const deleted = mapped.filter(x => x.task.deleted);
  const ordered = [...active, ...deleted];

  ordered.forEach(item => {
    const task = item.task;
    const originalIndex = item.idx;

    const li = document.createElement("li");
    li.className = task.deleted ? "tachado" : "";

    const span = document.createElement("span");
    span.textContent = task.text;
    span.tabIndex = 0;
    span.addEventListener("click", () => openModal(originalIndex));
    span.addEventListener("keydown", (e) => { if(e.key === "Enter") openModal(originalIndex); });

    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar";
    editBtn.onclick = () => openModal(originalIndex);
    if(task.deleted) editBtn.disabled = true;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Finalizada";
    delBtn.onclick = () => {
      tasks[originalIndex].deleted = true;
      renderTasks();
    };
    if(task.deleted) delBtn.disabled = true;

    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";
    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(delBtn);

    li.appendChild(span);
    li.appendChild(btnGroup);
    list.appendChild(li);
  });

  if(gridMode){
    list.classList.add("gridView");
    list.classList.remove("listMode");
  } else {
    list.classList.remove("gridView");
    list.classList.add("listMode");
  }

  requestAnimationFrame(() => { if(gridMode) applyEllipsisToCards(); });
}

function openModal(index){
  currentTaskIndex = index;
  editMode = false;
  const task = tasks[index];
  const modal = document.getElementById("taskModal");
  const textarea = document.getElementById("modalText");
  const editBtn = document.getElementById("editModalBtn");
  const saveBtn = document.getElementById("saveModalBtn");
  const finishBtn = document.getElementById("finishModalBtn");

  textarea.value = task.text;
  textarea.setAttribute("readonly", "true");
  saveBtn.disabled = true;

  if(task.deleted){
    editBtn.style.display = "none";
    finishBtn.disabled = true;
  } else {
    editBtn.style.display = "inline-block";
    finishBtn.disabled = false;
  }

  modal.setAttribute("aria-hidden", "false");
  textarea.focus();
}

function closeModal(){
  const modal = document.getElementById("taskModal");
  modal.setAttribute("aria-hidden", "true");
  currentTaskIndex = null;
  editMode = false;
}

function enableEditInModal(){
  if(currentTaskIndex === null) return;
  const task = tasks[currentTaskIndex];
  if(task.deleted) return;
  editMode = true;
  const textarea = document.getElementById("modalText");
  const saveBtn = document.getElementById("saveModalBtn");
  textarea.removeAttribute("readonly");
  textarea.focus();
  saveBtn.disabled = false;
}

function saveModal(){
  if(currentTaskIndex === null) return;
  if(!editMode) return;
  const textarea = document.getElementById("modalText");
  const text = textarea.value.trim();
  if(text.length === 0){
    alert("No puedes guardar una tarea vacía.");
    return;
  }
  if(text.length < 5){
    alert("La tarea debe tener al menos 5 caracteres.");
    return;
  }
  if(text.length > 100){
    alert("La tarea no puede superar los 100 caracteres.");
    return;
  }
  tasks[currentTaskIndex].text = text;
  renderTasks();
  closeModal();
}

function finishModal(){
  if(currentTaskIndex === null) return;
  tasks[currentTaskIndex].deleted = true;
  renderTasks();
  closeModal();
}

function toggleView(){
  gridMode = !gridMode;
  renderTasks();
}

function applyEllipsisToCards(){
  const spans = document.querySelectorAll('.gridView li span');
  spans.forEach(span => {
    span.classList.remove('clamped');
    const fullHeight = span.scrollHeight;
    const visibleHeight = span.clientHeight;
    if(fullHeight > visibleHeight + 1) span.classList.add('clamped');
  });
}

renderTasks();
