/* --- CONFIGURACIÓN BACKEND --- */
const API_URL = 'http://tu-servidor.com/api/tasks'; // Cambiar esto por URL

/* --- LÓGICA DE LA LISTA DE TAREAS --- */

// 1. Cargar tareas al iniciar (Desde Backend)
document.addEventListener('DOMContentLoaded', getTasks);

function showError(mensaje) {
    const container = document.getElementById('toast-container');
    if (!container) return; 
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = mensaje;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// OBTENER TAREAS
async function getTasks() {
    try {
        const response = await fetch(API_URL);
        const tasks = await response.json();
        
        const list = document.getElementById('todo-list');
        list.innerHTML = '';

        const prioridadPeso = { 'Alta': 3, 'Media': 2, 'Baja': 1 };

        // ORDENAMIENTO INTELIGENTE (Se mantiene igual)
        tasks.sort((a, b) => {
            if (a.estado !== b.estado) {
                return a.estado === 'cancelada' ? 1 : -1;
            }
            return prioridadPeso[b.prioridad] - prioridadPeso[a.prioridad];
        });

        tasks.forEach(task => {
            const div = document.createElement('div');
            div.className = `task-card ${task.estado}`;
            div.onclick = () => showDetails(task.id);

            div.innerHTML = `
                <div class="task-info">
                    <strong>${task.titulo}</strong>
                    <span class="tag ${task.prioridad}">${task.prioridad}</span>
                    <small style="margin-left:8px; color:rgba(25,25,25,0.6); font-weight:600;">${task.categoria}</small>
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

// 2. AGREGAR TAREA (POST)
async function addTask() {
    const input = document.getElementById('task-input');
    const titulo = input.value.trim();
    const categoria = document.getElementById('category-select').value;
    const prioridad = document.getElementById('priority-select').value;

    if (titulo.length < 5 || titulo.length > 100) {
        showError("⚠️ La tarea debe tener entre 5 y 100 caracteres.");
        return;
    }

    const newTask = {
        titulo,
        categoria,
        prioridad,
        estado: 'activa',
        fecha: new Date().toLocaleString()
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });
        input.value = '';
        getTasks();
    } catch (error) {
        showError("⚠️ No se pudo guardar la tarea.");
    }
}

// 3. CANCELAR TAREA (PUT/PATCH)
async function cancelTask(id) {
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'cancelada' })
        });
        getTasks();
    } catch (error) {
        showError("⚠️ Error al actualizar estado.");
    }
}

// 4. MOSTRAR DETALLES (FETCH INDIVIDUAL)
async function showDetails(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const task = await response.json();
        
        const modal = document.getElementById('task-modal');
        const body = document.getElementById('modal-body');
        const isCancelada = task.estado === 'cancelada';

        body.innerHTML = `
            <div style="color: white; margin-bottom: 20px;">
                <label style="font-size: 0.85rem; opacity: 0.9;">Editar Tarea:</label>
                <input type="text" id="edit-title" value="${task.titulo}" ${isCancelada ? 'disabled' : ''} 
                       style="width:100%; padding:12px; border-radius:15px; border:none; margin-top:8px; background: rgba(255,255,255,0.25); color: white; outline: none; font-size:1rem;">
                
                <div style="margin-top: 18px; display: flex; justify-content: space-between; font-size: 0.9rem;">
                    <span><strong>Prioridad:</strong> ${task.prioridad}</span>
                    <span><strong>Categoría:</strong> ${task.categoria}</span>
                </div>
                <p style="margin-top: 15px; opacity: 0.7;"><small>Creado: ${task.fecha}</small></p>
            </div>

            <div style="display:flex; gap:12px;">
                ${!isCancelada ? `
                    <button onclick="saveEdit(${task.id})" 
                    style="flex:1; padding:12px; border-radius:15px; border:none; background:#FFFFFF; color:#8990E1; font-weight:bold; cursor:pointer;">
                    Guardar
                    </button>` : ''}
                
                <button onclick="deleteTask(${task.id})" 
                style="flex:1; padding:12px; border-radius:15px; border:none; background:#D19494; color:white; font-weight:bold; cursor:pointer;">
                Borrar
                </button>
            </div>
        `;
        modal.style.display = 'flex';
    } catch (error) {
        showError("⚠️ No se pudo obtener la información de la tarea.");
    }
}

// 5. GUARDAR EDICIÓN (PUT)
async function saveEdit(id) {
    const newTitle = document.getElementById('edit-title').value.trim();
    if (newTitle.length < 5) {
        showError("⚠️ La tarea es muy corta.");
        return;
    }

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo: newTitle })
        });
        document.getElementById('task-modal').style.display = 'none';
        getTasks();
    } catch (error) {
        showError("⚠️ Error al guardar cambios.");
    }
}

// 6. BORRAR PERMANENTE (DELETE)
async function deleteTask(id) {
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        document.getElementById('task-modal').style.display = 'none';
        getTasks();
    } catch (error) {
        showError("⚠️ No se pudo borrar la tarea.");
    }
}

// --- EVENTOS DE INTERFAZ ---
document.getElementById('add-btn').onclick = addTask;

document.querySelector('.close-btn').onclick = () => {
    document.getElementById('task-modal').style.display = 'none';
};

window.onclick = (e) => {
    if (e.target.className === 'modal') {
        document.getElementById('task-modal').style.display = 'none';
    }
};

document.getElementById('task-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') addTask();
});