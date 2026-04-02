/* ===========================
   VARIABLES GLOBALES
=========================== */
let vistaActual = "activa";   // activa | cancelada
let vistaModo = "lista";      // lista | cuadritos

/* --- VALIDACIÓN DE TEXTO REAL --- */
function esTextoValido(texto) {
    // Esta expresión busca al menos una letra (incluye ñ y acentos)
    const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(texto);
    return tieneLetras;
}

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
    if (folderToDelete !== null) {
        deleteFolder(folderToDelete);
        if (typeof renderFolderManager === "function") renderFolderManager();
        
        // --- AÑADE ESTO AQUÍ ---
        renderFolderManager(); 
        // -----------------------
        
        closeDeleteFolderModal();
        folderToDelete = null;
    }
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
    if (typeof renderFolderManager === "function") renderFolderManager();

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
        tareasFiltradas.forEach(task => {
    const card = document.createElement("div");
    card.className = `task-card ${task.estado}`;
    card.onclick = () => showDetails(task.id);

    card.innerHTML = `
        <div class="task-info">
            <strong>${task.titulo}</strong>
            <div class="tags">
                <span class="tag ${task.prioridad}">${task.prioridad}</span>
                <span class="tag category">📚 ${task.categoria}</span>
            </div>
        </div>
        <div class="actions">
            <button class="status-btn" onclick="event.stopPropagation(); changeStatus(${task.id}, '${task.estado === "activa" ? "cancelada" : "activa"}')">
                ${task.estado === "activa" ? "✔️" : "↩️"}
            </button>
        </div>
    `;

    list.appendChild(card);
});

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
        showError(`⚠️ La tarea debe contener al menos algunas letras.`);
        return;
    }

    if (cantidadEspeciales > MAX_ESPECIALES) {
        showError(`⚠️ Demasiados caracteres especiales.`);
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
/* --- MODAL DETALLES TAREA (ESTILO FOTO) --- */
/* --- MODAL DETALLES TAREA (CORREGIDO) --- */
function showDetails(id) {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const modal = document.getElementById("task-modal");
    const body = document.getElementById("modal-body");
    const isCancelada = task.estado === "cancelada";

    body.innerHTML = `
        <div style="margin-top: 10px; text-align: left;">
            <label class="edit-label" style="color: rgba(255,255,255,0.9); font-size: 0.9rem; margin-bottom: 5px; display: block;">Editar Título:</label>
            
            <input type="text" id="edit-title" class="edit-input" 
                   value="${task.titulo}" 
                   ${isCancelada ? "disabled" : ""} 
                   style="width: 100%; padding: 12px; border-radius: 12px; border: none; background: rgba(0,0,0,0.2); color: white; font-size: 1rem; margin-bottom: 5px;">
            
            <div id="edit-char-count" style="text-align: right; font-size: 0.75rem; opacity: 0.6; color: white; margin-right: 10px;">
                ${task.titulo.length} / 100
            </div>

            <div class="modal-info-row" style="display: flex; justify-content: space-between; margin-top: 15px; align-items: center;">
                <span style="color: white; font-size: 0.9rem; opacity: 0.8;">Categoría: ${task.categoria}</span>
                <span class="modal-priority-pill ${task.prioridad}">${task.prioridad}</span>
            </div>

            <p style="font-size: 0.75rem; opacity: 0.5; color: white; margin: 15px 0; text-align: center;">
                🕒 Creado el: ${task.fecha || "No disponible"}
            </p>

            ${!isCancelada ? `
                <button onclick="toggleFolderSelector(${task.id})" class="btn-move-folder" style="width: 100%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 10px; border-radius: 10px; cursor: pointer; margin-bottom: 20px;">
                    Mover a una carpeta
                </button>
            ` : ''}

            <div id="folder-selector" style="display:none; margin-top:10px;">
                <div id="folder-selector-list" class="folder-scroll"></div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                ${!isCancelada ? `
                    <button onclick="saveEdit(${task.id})" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: white; color: #8990E1; font-weight: bold; cursor: pointer;">Guardar</button>
                ` : ""}
                <button onclick="document.getElementById('task-modal').style.display='none'" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: rgba(255,255,255,0.2); color: white; cursor: pointer;">Cerrar</button>
            </div>
            
            <button onclick="deleteTask(${task.id})" 
    style="width: 100%; 
           margin-top: 20px; 
           background-color: #D19494; /* Color Rojo Pastel Sólido */
           color: white; /* Texto blanco para que resalte en el pastel */
           padding: 14px; 
           border: none; 
           border-radius: 15px; 
           font-weight: bold; 
           font-size: 1rem;
           cursor: pointer;
           box-shadow: 0 4px 10px rgba(209, 148, 148, 0.3); /* Sombra suave */
           transition: transform 0.2s, background 0.3s;">
    🗑️ Eliminar
</button>
        </div>
    `;

    modal.style.display = "flex";
    activateEditCounter(); // Para que el contador de letras funcione al escribir
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
/* --- NUEVA GESTIÓN DE CARPETAS (REESTRUCTURACIÓN) --- */

// 1. Abrir el administrador
function openFolderManager() {
    const modal = document.getElementById("folder-manager-modal");
    renderFolderManager();
    modal.style.display = "flex";
}

// 2. Cerrar el administrador
function closeFolderManager() {
    document.getElementById("folder-manager-modal").style.display = "none";
}

// 3. Dibujar las carpetas dentro del modal
function renderFolderManager() {
    const container = document.getElementById("folder-manager-list");
    if (!container) return;

    let foldersData = JSON.parse(localStorage.getItem("folders")) || [];
    container.innerHTML = "";

    // 1. ORGANIZAR: Ponemos la activa al principio
    let sortedFolders = [];
    
    if (activeFolder === "principal") {
        sortedFolders.push({ id: "principal", nombre: "Principal", esPrincipal: true });
        foldersData.forEach(f => sortedFolders.push(f));
    } else {
        const current = foldersData.find(f => f.id == activeFolder);
        if (current) sortedFolders.push(current);
        sortedFolders.push({ id: "principal", nombre: "Principal", esPrincipal: true });
        foldersData.forEach(f => {
            if (f.id != activeFolder) sortedFolders.push(f);
        });
    }

    // 2. DIBUJAR
    sortedFolders.forEach(folder => {
        const isSelected = (folder.id == activeFolder || (folder.esPrincipal && activeFolder === "principal"));
        const div = document.createElement("div");
        div.className = `folder-manage-card ${isSelected ? 'active-folder-highlight' : ''}`;
        
        const folderName = folder.esPrincipal ? `🏠 ${folder.nombre}` : `📁 ${folder.nombre}`;

div.innerHTML = `
    <span style="color: white; font-weight: ${isSelected ? 'bold' : 'normal'}">
        ${folderName} ${isSelected ? ' <small>(Abierta)</small>' : ''}
    </span>
    <div class="folder-manage-actions">
        <button class="btn-folder-action btn-open" onclick="activeFolder='${folder.id}'; localStorage.setItem('activeFolder', '${folder.id}'); getTasks(); closeFolderManager()">Abrir</button>
        ${!isPrincipal ? `
            <button class="btn-folder-action btn-edit" onclick="editFolderName(${folder.id}, '${folder.nombre}')">✏️</button>
            <button class="btn-folder-action btn-delete-folder" onclick="openDeleteFolderModal(${folder.id})">🗑️</button>
        ` : ''}
    </div>
`;
        container.appendChild(div);
    });
}

// 4. Editar nombre de carpeta
function editFolderName(folderId, oldName) {
    const newName = prompt("Nuevo nombre para la carpeta:", oldName);
    if (newName && newName.trim() !== "" && newName !== oldName) {
        // Validación de texto real (usando tu función existente)
        if (!esTextoValido(newName)) {
            alert("El nombre debe contener letras.");
            return;
        }

        let foldersList = JSON.parse(localStorage.getItem("folders")) || [];
        const index = foldersList.findIndex(f => f.id === folderId);
        
        if (index !== -1) {
            foldersList[index].nombre = newName.trim();
            localStorage.setItem("folders", JSON.stringify(foldersList));
            
            // Actualizar el nombre en las tareas (si guardas el nombre en el objeto tarea)
            let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
            tasks = tasks.map(t => {
                if (Number(t.carpetaId) === Number(folderId)) t.categoria = newName.trim();
                return t;
            });
            localStorage.setItem("tasks", JSON.stringify(tasks));
            
            renderFolderManager();
            getTasks();
        }
    }
}
function renderFolderManager() {
    const container = document.getElementById("folder-manager-list");
    if (!container) return;

    let foldersData = JSON.parse(localStorage.getItem("folders")) || [];
    container.innerHTML = "";

    // 1. CREAR EL ARRAY ORDENADO
    // Separamos la activa de las demás para moverla al principio
    let sortedFolders = [];
    
    // Si la activa es principal, va primero
    if (activeFolder === "principal") {
        sortedFolders.push({ id: "principal", nombre: "Principal", esPrincipal: true });
        foldersData.forEach(f => sortedFolders.push(f));
    } else {
        // Si la activa es una carpeta creada, buscamos cuál es
        const current = foldersData.find(f => f.id == activeFolder);
        if (current) sortedFolders.push(current);
        
        // Añadimos Principal y el resto de carpetas
        sortedFolders.push({ id: "principal", nombre: "Principal", esPrincipal: true });
        foldersData.forEach(f => {
            if (f.id != activeFolder) sortedFolders.push(f);
        });
    }

    // 2. RENDERIZAR
    sortedFolders.forEach(folder => {
        const isSelected = (folder.id == activeFolder || (folder.esPrincipal && activeFolder === "principal"));
        const div = document.createElement("div");
        
        // Si es la seleccionada, le ponemos un estilo especial
        div.className = `folder-manage-card ${isSelected ? 'active-folder-highlight' : ''}`;
        
        const folderName = folder.esPrincipal ? `🏠 ${folder.nombre}` : `📁 ${folder.nombre}`;
        const isPrincipal = folder.esPrincipal;

        div.innerHTML = `
            <span style="color: white; font-weight: ${isSelected ? 'bold' : 'normal'}">
                ${folderName} ${isSelected ? ' <small>(Abierta)</small>' : ''}
            </span>
            <div class="folder-manage-actions">
                <button class="btn-folder-action btn-open" onclick="activeFolder='${folder.id}'; localStorage.setItem('activeFolder', '${folder.id}'); getTasks(); closeFolderManager()">Abrir</button>
                ${!isPrincipal ? `
                    <button class="btn-folder-action btn-edit" onclick="editFolderName(${folder.id}, '${folder.nombre}')">✏️</button>
                    <button class="btn-folder-action btn-delete-folder" onclick="openDeleteFolderModal(${folder.id})">🗑️</button>
                ` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}