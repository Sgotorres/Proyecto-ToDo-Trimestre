<<<<<<< Updated upstream
/* --- CONFIGURACIÓN BACKEND --- */
const API_URL = 'http://localhost:3000/tareas'; 

/* --- LÓGICA DE LA LISTA DE TAREAS --- */

document.addEventListener('DOMContentLoaded', getTasks);

// Función de notificación unificada (sirve para errores y avisos)
function showNotification(mensaje, esExito = false) {
    const container = document.getElementById('toast-container');
    if (!container) return; 
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Si es éxito (como borrar), usamos el color verde menta definido en tus variables CSS
    if (esExito) {
        toast.style.background = '#C1E1C1'; // Color de var(--priority-low)
        toast.style.color = '#1A1A1A';
    }
    
    toast.innerText = mensaje;
    container.appendChild(toast);

    setTimeout(() => { toast.remove(); }, 3000);
}

// Mantenemos showError por compatibilidad con el resto del código
function showError(mensaje) {
    showNotification(mensaje, false);
}

// 1. OBTENER TAREAS (READ)
async function getTasks() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error();
        const tasks = await response.json();
        
        const list = document.getElementById('todo-list');
        list.innerHTML = '';

        const prioridadPeso = { 'Alta': 3, 'Media': 2, 'Baja': 1 };

        tasks.sort((a, b) => {
            if (a.estado !== b.estado) return a.estado === 'cancelada' ? 1 : -1;
            return (prioridadPeso[b.prioridad] || 0) - (prioridadPeso[a.prioridad] || 0);
        });

        tasks.forEach(task => {
            const div = document.createElement('div');
            div.className = `task-card ${task.estado}`;
            div.onclick = () => showDetails(task.id);

            div.innerHTML = `
                <div class="task-info">
                    <strong>${task.titulo}</strong>
                    <span class="tag ${task.prioridad}">${task.prioridad}</span>
                    <small style="margin-left:8px; color:rgba(25,25,25,0.6); font-weight:600;">
                        ${task.categoria_nombre || 'General'}
                    </small>
                </div>
                <div class="actions">
                    ${task.estado === 'activa' ? 
                        `<button onclick="event.stopPropagation(); cancelTask(${task.id})" 
                         style="border:none; background:none; cursor:pointer; color:#D19494; font-size:1.4rem; font-weight:bold;">✖</button>` 
                        : ''}
                </div>
            `;
            list.appendChild(div);
        });
    } catch (error) {
        showError("⚠️ Error al conectar con el servidor.");
    }
}

// 2. AGREGAR TAREA (CREATE)
async function addTask() {
    const input = document.getElementById('task-input');
    const titulo = input.value.trim();
    const categoriaTexto = document.getElementById('category-select').value;
    const prioridad = document.getElementById('priority-select').value;

    const categoriasMap = { "📚 Estudios": 1, "🏠 Hogar": 2, "💼 Trabajo": 3 };

    if (titulo.length < 5 || titulo.length > 100) {
        showError("⚠️ El título debe tener entre 5 y 100 caracteres.");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                titulo, 
                categoria_id: categoriasMap[categoriaTexto] || 1,
                prioridad: prioridad 
            })
        });
        if (!response.ok) throw new Error();
        input.value = '';
        getTasks();
    } catch (error) {
        showError("⚠️ Error al guardar la tarea.");
    }
}

// 3. CANCELAR TAREA (PATCH)
async function cancelTask(id) {
    try {
        const response = await fetch(`${API_URL}/cancelar/${id}`, { method: 'PATCH' });
        if (!response.ok) throw new Error();
        getTasks();
    } catch (error) {
        showError("⚠️ No se pudo marcar como cancelada.");
    }
}

// 4. MOSTRAR DETALLES Y BORRAR (Modal)
async function showDetails(id) {
    try {
        const response = await fetch(API_URL);
        const tasks = await response.json();
        const task = tasks.find(t => t.id === id);
        
        const modal = document.getElementById('task-modal');
        const body = document.getElementById('modal-body');
        const isCancelada = task.estado === 'cancelada';

        const colores = { 'Alta': '#D19494', 'Media': '#F3E5AB', 'Baja': '#C1E1C1' };

        body.innerHTML = `
            <div style="color: white; margin-bottom: 20px;">
                <label style="font-size: 0.85rem; opacity: 0.9;">Editar Título:</label>
                <input type="text" id="edit-title" value="${task.titulo}" ${isCancelada ? 'disabled' : ''} 
                       style="width:100%; padding:12px; border-radius:15px; border:none; margin-top:8px; background: rgba(255,255,255,0.25); color: white; outline: none; font-size:1rem;">
                
                <div style="margin-top: 18px; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                    <span><strong>Categoría:</strong> ${task.categoria_nombre || 'General'}</span>
                    <span style="background: ${colores[task.prioridad]}; color: #1a1a1a; padding: 4px 12px; border-radius: 10px; font-weight: bold;">
                        ${task.prioridad}
                    </span>
                </div>
            </div>

            <div style="display:flex; flex-direction: column; gap:10px;">
                <div style="display:flex; gap:12px;">
                    ${!isCancelada ? `
                        <button onclick="saveEdit(${task.id})" 
                        style="flex:1; padding:12px; border-radius:15px; border:none; background:#FFFFFF; color:#8990E1; font-weight:bold; cursor:pointer;">
                        Guardar Cambios
                        </button>` : ''}
                    <button onclick="closeModal()" 
                        style="flex:1; padding:12px; border-radius:15px; border:none; background:rgba(255,255,255,0.2); color:white; font-weight:bold; cursor:pointer;">
                        Cerrar
                    </button>
                </div>
                
                <button onclick="deletePermanent(${task.id})" 
                    style="width:100%; padding:10px; border-radius:15px; border: none; background: #ff4d4d; color: #000000; font-weight:bold; cursor:pointer; margin-top: 10px;">
                    Eliminar
                </button>
            </div>
        `;
        modal.style.display = 'flex';
    } catch (error) {
        showError("⚠️ Error al cargar detalles.");
    }
}

// 5. BORRAR PERMANENTE (Actualizado: sin confirm de sistema y con notificación estilo Toast)
async function deletePermanent(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error();
        
        closeModal();
        getTasks();
        
        // El aviso ahora sale igual que los de error pero en verde
        showNotification("🗑️ Tarea eliminada correctamente", true);
        
    } catch (error) {
        showError("⚠️ Error al eliminar permanentemente.");
    }
}

// 6. GUARDAR EDICIÓN (UPDATE)
async function saveEdit(id) {
    const newTitle = document.getElementById('edit-title').value.trim();
    if (newTitle.length < 5) {
        showError("⚠️ El título es muy corto.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo: newTitle })
        });
        if (!response.ok) throw new Error();
        closeModal();
        getTasks();
    } catch (error) {
        showError("⚠️ Error al actualizar la tarea.");
    }
}

function closeModal() {
    document.getElementById('task-modal').style.display = 'none';
}

/* --- EVENTOS --- */
document.getElementById('add-btn').onclick = addTask;
document.querySelector('.close-btn').onclick = closeModal;
window.onclick = (e) => { if (e.target.className === 'modal') closeModal(); };
document.getElementById('task-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
=======
/* ===========================
   VARIABLES GLOBALES
=========================== */
let vistaActual = "activa";   // activa | cancelada
let vistaModo = "lista";      // lista | cuadritos

/* ===========================
   CARPETAS (TABS)
=========================== */
let folders = JSON.parse(localStorage.getItem("folders")) || [];
let activeFolder = localStorage.getItem("activeFolder") || "principal";
let folderToDelete = null;

/* --- MODAL ELIMINAR CARPETA --- */
function closeDeleteFolderModal() {
    document.getElementById("delete-folder-modal").style.display = "none";
}

/* --- MODAL ELIMINAR CARPETA --- */
function deleteFolder(folderId) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    // 1. ELIMINAR: Quitamos las que están en esta carpeta Y están completadas (cancelada)
    tasks = tasks.filter(t => !(Number(t.carpetaId) === Number(folderId) && t.estado === "cancelada"));

    // 2. MOVER: Las que quedan en esta carpeta (que son las activas) se van a principal
    tasks = tasks.map(t => {
        if (Number(t.carpetaId) === Number(folderId)) {
            t.carpetaId = "principal";
        }
        return t;
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));

    // 3. Eliminar la carpeta de la lista
    folders = folders.filter(f => f.id !== folderId);
    localStorage.setItem("folders", JSON.stringify(folders));

    activeFolder = "principal";
    localStorage.setItem("activeFolder", "principal");

    closeDeleteFolderModal();
    renderFolderTabs();
    getTasks();
}
function openDeleteFolderModal(folderId) {
    folderToDelete = folderId;
    
    // Seleccionamos el párrafo que está dentro del modal
    const mensajeModal = document.querySelector("#delete-folder-modal p");
    
    if (mensajeModal) {
        mensajeModal.innerHTML = `Las tareas pendientes se moverán a la principal, pero las <b style="color: #ffb3b3;">tareas completadas serán eliminadas</b> permanentemente.`;
    }

    document.getElementById("delete-folder-modal").style.display = "flex";
    
    document.getElementById("confirm-delete-folder").onclick = () => {
        deleteFolder(folderToDelete);
    };
}

/* --- CAMBIAR CARPETA ACTIVA --- */
function setActiveFolder(id) {
    activeFolder = id;
    localStorage.setItem("activeFolder", activeFolder);
    renderFolderTabs();
    getTasks();
}

/* --- RENDER TABS DE CARPETAS --- */
/* --- RENDER TABS DE CARPETAS (VERSIÓN CORREGIDA) --- */
function renderFolderTabs() {
    const tabs = document.getElementById("folder-tabs");
    if (!tabs) return;

    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tabs.innerHTML = ""; // Limpia la barra para volver a dibujar

    // Color del contador según la vista (Incompletas/Completas)
    const badgeColor = vistaActual === "activa" ? "#8990E1" : "#77DD77"; 

    // --- 1. PESTAÑA PRINCIPAL ---
    const countPrincipal = tasks.filter(t => 
        (t.carpetaId === "principal" || !t.carpetaId) && t.estado === vistaActual
    ).length;

    const isMainActive = activeFolder === "principal";
    const main = document.createElement("div");
    main.className = "folder-tab" + (isMainActive ? " active" : "");
    
    // Si está activa, el número también se verá negro para que combine con la equis
    const mainBadgeColor = isMainActive ? "black" : badgeColor;

    main.innerHTML = `
        Principal 
        <span style="color: ${mainBadgeColor}; font-weight: bold; font-size: 0.75rem; margin-left: 5px;">
            (${countPrincipal})
        </span>`;
    
    main.onclick = () => {
        activeFolder = "principal";
        localStorage.setItem("activeFolder", activeFolder);
        renderFolderTabs();
        getTasks();
    };
    tabs.appendChild(main);

    // --- 2. PESTAÑAS DE USUARIO ---
    folders.forEach(folder => {
        const count = tasks.filter(t => 
            Number(t.carpetaId) === Number(folder.id) && t.estado === vistaActual
        ).length;

        const isActive = folder.id == activeFolder;
        const currentBadgeColor = isActive ? "black" : badgeColor;

        const tab = document.createElement("div");
        tab.className = "folder-tab" + (isActive ? " active" : "");
        tab.innerHTML = `
            <span class="folder-name" onclick="setActiveFolder(${folder.id})">
                ${folder.nombre} 
                <span style="color: ${currentBadgeColor}; font-weight: bold; font-size: 0.75rem; margin-left: 4px;">
                    (${count})
                </span>
            </span>
            <button class="delete-folder-btn" 
                style="color: ${isActive ? 'black' : 'rgba(255,255,255,0.7)'}; border: none; background: none; cursor: pointer; font-size: 1rem;" 
                onclick="openDeleteFolderModal(${folder.id}); event.stopPropagation();">✖</button>
        `;
        tabs.appendChild(tab);
    });

    // --- 3. BOTÓN PARA CREAR CARPETA (+) ---
    const add = document.createElement("div");
    add.className = "folder-tab add";
    add.textContent = "+";
    add.onclick = createFolder;
    tabs.appendChild(add);
}
/* --- MODAL CREAR CARPETA --- */
function createFolder() {
    loadTasksForFolderModal();
    document.getElementById("folder-modal").style.display = "flex";
}

function confirmCreateFolder() {
    const input = document.getElementById("folder-name-input");
    const error = document.getElementById("folder-error");
    const name = input.value.trim();

    if (!name) return;

    // VALIDACIÓN: evitar duplicados (insensible a mayúsculas)
    const exists = folders.some(f => f.nombre.toLowerCase() === name.toLowerCase());

    if (exists) {
        error.style.display = "block";
        return;
    }

    const newFolder = {
        id: Date.now(),
        nombre: name
    };

    folders.push(newFolder);
    localStorage.setItem("folders", JSON.stringify(folders));

    closeCreateFolderModal();
    renderFolderTabs();
}

/* --- CARGAR TAREAS DE PRINCIPAL EN MODAL CARPETA --- */
/* --- CARGAR TAREAS DE PRINCIPAL EN MODAL CARPETA --- */
function loadTasksForFolderModal() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const container = document.getElementById("folder-task-list");

    container.innerHTML = "";

    // VALIDACIÓN: Solo tareas en Principal que estén "activas"
    const principalesActivas = tasks.filter(t => 
        (t.carpetaId === "principal" || !t.carpetaId) && t.estado === "activa"
    );

    if (principalesActivas.length === 0) {
        container.innerHTML = `<p style="opacity:0.7; font-size:0.9rem;">No hay tareas pendientes en Principal para mover.</p>`;
        return;
    }

    principalesActivas.forEach(t => {
        const item = document.createElement("label");
        item.style.display = "block";
        item.style.marginBottom = "8px";
        item.innerHTML = `
            <input type="checkbox" class="folder-task-check" value="${t.id}">
            <span style="margin-left: 8px;">${t.titulo}</span>
        `;
        container.appendChild(item);
    });
}

/* --- CREAR CARPETA + MOVER TAREAS (BOTÓN MODAL) --- */
/* --- CREAR CARPETA + MOVER TAREAS (BOTÓN MODAL) --- */
document.getElementById("folder-create-btn").onclick = () => {
    const nombre = document.getElementById("folder-name-input").value.trim();
    if (!nombre) {
        showError("⚠️ La carpeta necesita un nombre.");
        return;
    }

    // NUEVA VALIDACIÓN: Evitar carpetas duplicadas (ignorando mayúsculas/minúsculas)
    const exists = folders.some(f => f.nombre.toLowerCase() === nombre.toLowerCase());
    if (exists) {
        showError("⚠️ Ya existe una carpeta con ese nombre.");
        return;
    }

    const nueva = {
        id: Date.now(),
        nombre
    };

    folders.push(nueva);
    localStorage.setItem("folders", JSON.stringify(folders));

    // mover tareas seleccionadas
    const checks = document.querySelectorAll(".folder-task-check:checked");
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    checks.forEach(chk => {
        const id = Number(chk.value);
        tasks = tasks.map(t => {
            if (t.id === id) t.carpetaId = nueva.id;
            return t;
        });
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));

    activeFolder = nueva.id;
    localStorage.setItem("activeFolder", activeFolder);

    renderFolderTabs();
    getTasks();
    closeFolderModal();
};

/* --- CERRAR MODAL CREAR CARPETA --- */
document.getElementById("folder-cancel-btn").onclick = closeFolderModal;

function closeFolderModal() {
    document.getElementById("folder-modal").style.display = "none";
    document.getElementById("folder-name-input").value = "";
}

/* --- CERRAR MODAL MOVER CARPETA --- */
function closeMoveFolderModal() {
    document.getElementById("move-folder-modal").style.display = "none";
}

/* ===========================
   TAREAS
=========================== */

/* --- CARGAR TAREAS (LISTA / CUADRITOS) --- */
function getTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const list = document.getElementById("todo-list");
    list.innerHTML = "";

    // aplicar vista cuadritos
    if (vistaModo === "cuadritos") {
        list.classList.add("grid-view");
    } else {
        list.classList.remove("grid-view");
    }

    const prioridadPeso = { Alta: 3, Media: 2, Baja: 1 };
    let tareasFiltradas = tasks.filter(t => t.estado === vistaActual);

    // si estamos en una carpeta distinta a Principal, filtrar
    if (activeFolder !== "principal") {
        tareasFiltradas = tareasFiltradas.filter(t => Number(t.carpetaId) === Number(activeFolder));
    } else {
        // si estamos en Principal, mostrar solo tareas sin carpeta o con carpetaId = "principal"
        tareasFiltradas = tareasFiltradas.filter(t => !t.carpetaId || t.carpetaId === "principal");
    }

    tareasFiltradas.sort((a, b) => prioridadPeso[b.prioridad] - prioridadPeso[a.prioridad]);

    if (tareasFiltradas.length === 0) {
        list.innerHTML = `<p style="text-align:center; opacity:0.5; margin-top:50px; color:white;">No hay tareas en esta sección.</p>`;
        return;
    }

    tareasFiltradas.forEach(task => {
        const card = document.createElement("div");
        card.className = `task-card ${task.estado}`;
        card.onclick = () => showDetails(task.id);

        const info = document.createElement("div");
        info.className = "task-info";

        const title = document.createElement("strong");
        title.textContent = task.titulo;

        info.appendChild(title);

        const footer = document.createElement("div");
        footer.className = "card-footer";

        const tags = document.createElement("div");
        tags.className = "tags";

        const pri = document.createElement("span");
        pri.className = `tag ${task.prioridad}`;
        pri.textContent = task.prioridad;

        const cat = document.createElement("span");
        cat.className = "tag category";
        cat.textContent = task.categoria;

        tags.appendChild(pri);
        tags.appendChild(cat);

        const actions = document.createElement("div");
        actions.className = "actions";

        const btn = document.createElement("button");
        btn.style.border = "none";
        btn.style.background = "none";
        btn.style.cursor = "pointer";
        btn.style.fontSize = "1.4rem";
        btn.textContent = task.estado === "activa" ? "✔️" : "↩️";

        btn.onclick = e => {
            e.stopPropagation();
            changeStatus(task.id, task.estado === "activa" ? "cancelada" : "activa");
        };

        actions.appendChild(btn);

        footer.appendChild(tags);
        footer.appendChild(actions);

        card.appendChild(info);
        card.appendChild(footer);

        list.appendChild(card);
    });
}

/* --- AGREGAR TAREA --- */
function addTask() {
    const input = document.getElementById("task-input");
    const titulo = input.value.trim();
    // Asegúrate de que los IDs de categoría y prioridad coincidan con tu HTML
    const categoria = document.getElementById("category-select")?.value || "General";
    const prioridad = document.getElementById("priority-select")?.value || "Media";

    // 1. Validación de longitud (la que ya tenías)
    if (titulo.length < 5 || titulo.length > 100) {
        showError("⚠️ La tarea debe tener entre 5 y 100 caracteres.");
        return;
    }

    // ==========================================
    // 2. NUEVA VALIDACIÓN: Números y Especiales
    // ==========================================
    
    // Escanea y cuenta cuántos números (0-9) hay. Si no hay, devuelve 0.
    const cantidadNumeros = (titulo.match(/\d/g) || []).length;
    
    // Escanea y cuenta todo lo que NO sea letra (incluyendo acentos y ñ), NO sea número y NO sea espacio.
    const cantidadEspeciales = (titulo.match(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g) || []).length;

    // Puedes ajustar estos límites según lo que les hayan pedido
    const MAX_NUMEROS = 4; 
    const MAX_ESPECIALES = 3;

    if (cantidadNumeros > MAX_NUMEROS) {
        showError(`⚠️ Demasiados números. Máximo permitido: ${MAX_NUMEROS}.`);
        return;
    }

    if (cantidadEspeciales > MAX_ESPECIALES) {
        showError(`⚠️ Demasiados caracteres especiales. Máximo permitido: ${MAX_ESPECIALES}.`);
        return;
    }
    // ==========================================

    // Si pasa todas las validaciones, creamos la tarea (tu código original)
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push({
        id: Date.now(),
        titulo,
        categoria,
        prioridad,
        estado: "activa",
        fecha: new Date().toLocaleString(),
        carpetaId: activeFolder
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
    input.value = "";
    getTasks();
    renderFolderTabs(); // Actualiza los numeritos de las carpetas

    document.getElementById("char-count").textContent = "0 / 100";
}

/* --- MODAL DETALLES TAREA --- */
/* --- MODAL DETALLES TAREA --- */
function showDetails(id) {
    const tasks = JSON.parse(localStorage.getItem("tasks"));
    const task = tasks.find(t => t.id === id);
    const modal = document.getElementById("task-modal");
    const body = document.getElementById("modal-body");
    const isCancelada = task.estado === "cancelada";

    body.innerHTML = `
        <div style="color: white; margin-bottom: 20px;">
            <label style="font-size: 0.85rem; opacity: 0.9;">Editar Tarea:</label>

            <input type="text" id="edit-title" value="${task.titulo}" ${isCancelada ? "disabled" : ""} class="edit-input">

            <div id="edit-char-count" class="edit-char-count">
                ${task.titulo.length} / 100
            </div>

            <div style="margin-top: 18px; display: flex; justify-content: space-between; font-size: 0.9rem; opacity: 0.9;">
                <span><strong>Prioridad:</strong> ${task.prioridad}</span>
                <span><strong>Categoría:</strong> ${task.categoria}</span>
            </div>

            <div style="margin: 25px 0; text-align: center;">
                ${!isCancelada ? `
                    <button onclick="toggleFolderSelector(${task.id})" class="btn-move-folder" style="width: 100%; padding: 12px; margin: 0;">
                        Agregar a carpeta
                    </button>
                ` : `
                    <p style="color: #FFB3B3; font-size: 0.85rem; margin-top: 10px;">
                        🔒 Completada: no se puede mover.
                    </p>
                `}
            </div>

            <div id="folder-selector" style="display:none; margin-top:15px;">
                <h4 style="margin-bottom:10px;">Seleccionar carpeta:</h4>
                <div id="folder-selector-list" class="folder-scroll"></div>
            </div>

            <p style="margin-top: 15px; opacity: 0.6; text-align: center;"><small>Creado: ${task.fecha}</small></p>
        </div>

        <div style="display:flex; gap:12px;">
            ${!isCancelada ? `
                <button onclick="saveEdit(${task.id})"
                    style="flex:1; padding:12px; border-radius:15px; border:none; background:#FFFFFF; color:#8990E1; font-weight:bold; cursor:pointer;">
                    Guardar
                </button>` : ""}

            <button onclick="deleteTask(${task.id})"
                style="flex:1; padding:12px; border-radius:15px; border:none; background:#D19494; color:white; font-weight:bold; cursor:pointer;">
                Borrar
            </button>
        </div>
    `;

    modal.style.display = "flex";
    activateEditCounter();
}

/* --- GUARDAR CAMBIOS EN TAREA --- */
function saveEdit(id) {
    const newTitle = document.getElementById("edit-title").value.trim();
    if (newTitle.length < 5) {
        showError("⚠️ La tarea debe ser más largo.");
        return;
    }
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    tasks = tasks.map(t => {
        if (t.id === id) t.titulo = newTitle;
        return t;
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
    document.getElementById("task-modal").style.display = "none";
    getTasks();
}

/* --- BORRAR TAREA --- */
function deleteTask(id) {
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    document.getElementById("task-modal").style.display = "none";
    getTasks();
    renderFolderTabs();
}

/* --- CONTADOR DEL MODAL + LÍMITE --- */
function activateEditCounter() {
    const editInput = document.getElementById("edit-title");
    const editCount = document.getElementById("edit-char-count");

    editInput.addEventListener("input", () => {
        let text = editInput.value;

        if (text.length > 100) {
            editInput.value = text.slice(0, 100);
            showError("⚠️ No se puede pasar de 100 caracteres.");
            return;
        }

        editCount.textContent = `${editInput.value.length} / 100`;
        editCount.style.color =
            editInput.value.length > 90 ? "#ffb3b3" : "rgba(255,255,255,0.8)";
    });
}
/* --- CAMBIAR ESTADO DE LA TAREA --- */
function changeStatus(id, newStatus) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    
    // Buscamos la tarea por su ID y le cambiamos el estado
    tasks = tasks.map(t => {
        if (t.id === id) {
            t.estado = newStatus;
        }
        return t;
    });

    // Guardamos los cambios en localStorage
    localStorage.setItem("tasks", JSON.stringify(tasks));
    
    // Refrescamos la lista de tareas y los contadores de las carpetas
    getTasks();
    renderFolderTabs();
}

/* --- TOAST DE ERROR --- */
function showError(mensaje) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = mensaje;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

/* --- SELECTOR DE CARPETAS DENTRO DEL MODAL TAREA --- */
function toggleFolderSelector(taskId) {
    const box = document.getElementById("folder-selector");
    const list = document.getElementById("folder-selector-list");

    box.style.display = box.style.display === "none" ? "block" : "none";

    if (box.style.display === "block") {
        list.innerHTML = "";

        if (folders.length === 0) {
            list.innerHTML = `<p style="opacity:0.7;">No hay carpetas creadas.</p>`;
            return;
        }

        folders.forEach(folder => {
            const btn = document.createElement("button");
            btn.textContent = folder.nombre;

            btn.style.width = "100%";
            btn.style.padding = "10px";
            btn.style.marginBottom = "8px";
            btn.style.border = "none";
            btn.style.borderRadius = "10px";
            btn.style.cursor = "pointer";
            btn.style.background = "white";
            btn.style.color = "#8990E1";
            btn.style.fontWeight = "bold";

            btn.onclick = () => moveTaskToFolderInsideModal(taskId, folder.id);

            list.appendChild(btn);
        });
    }
}

function moveTaskToFolderInsideModal(taskId, folderId) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    
    // Buscamos la tarea específica
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex !== -1) {
        // VALIDACIÓN DE SEGURIDAD: Si está cancelada, no hacemos nada
        if (tasks[taskIndex].estado === "cancelada") {
            showError("⚠️ No se pueden mover tareas completadas.");
            return;
        }

        tasks[taskIndex].carpetaId = folderId;
        localStorage.setItem("tasks", JSON.stringify(tasks));

        document.getElementById("task-modal").style.display = "none";
        getTasks();
        renderFolderTabs(); // Actualizamos los contadores de las pestañas
    }
}
/* --- MOVER TAREA A CARPETA (OTRO MODAL) --- */
function moveTaskToFolder(folderId) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    tasks = tasks.map(t => {
        if (t.id === taskToMove) t.carpetaId = folderId;
        return t;
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));

    closeMoveFolderModal();
    document.getElementById("task-modal").style.display = "none";
    getTasks();
}

/* ===========================
   INTERFAZ / EVENTOS
=========================== */

/* --- CONTADOR INPUT PRINCIPAL --- */
const taskInput = document.getElementById("task-input");
const charCount = document.getElementById("char-count");

taskInput.addEventListener("input", () => {
    let text = taskInput.value;

    if (text.length > 100) {
        taskInput.value = text.slice(0, 100);
        showError("⚠️ No se puede pasar de 100 caracteres.");
        return;
    }

    charCount.textContent = `${text.length} / 100`;
    charCount.style.color =
        text.length > 90 ? "#ffb3b3" : "rgba(255,255,255,0.8)";
});

/* --- BOTÓN CAMBIAR VISTA --- */
document.getElementById("view-btn").onclick = function () {
    if (vistaModo === "lista") {
        vistaModo = "cuadritos";
        this.innerText = "☰";
    } else {
        vistaModo = "lista";
        this.innerText = "⊞";
    }
    getTasks();
};

/* --- FILTRO INCOMPLETAS / COMPLETAS --- */
document.getElementById("filter-btn").onclick = function () {
    if (vistaActual === "activa") {
        vistaActual = "cancelada";
        this.innerText = "COMPLETAS";
        this.style.background = "#77DD77"; 
    } else {
        vistaActual = "activa";
        this.innerText = "INCOMPLETAS";
        this.style.background = ""; 
    }
    
    
    getTasks();          
    renderFolderTabs();  
};
/* --- EVENTOS DE INTERFAZ --- */
document.getElementById("add-btn").onclick = addTask;

document.querySelector(".close-btn").onclick = () => {
    document.getElementById("task-modal").style.display = "none";
};

window.onclick = e => {
    if (e.target.className === "modal") {
        document.getElementById("task-modal").style.display = "none";
    }
};

document.getElementById("task-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") addTask();
});

// Cerrar cualquier modal al hacer clic fuera del contenido
window.addEventListener("click", function (e) {
    const modals = document.querySelectorAll(".modal");

    modals.forEach(modal => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});

/* --- INICIO --- */
document.addEventListener("DOMContentLoaded", () => {
    renderFolderTabs();
    getTasks();
});
>>>>>>> Stashed changes
