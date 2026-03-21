/* --- LÓGICA DE LA LISTA DE TAREAS --- */

// 1. Cargar tareas al iniciar y ordenarlas por prioridad
document.addEventListener('DOMContentLoaded', getTasks);

// Función para mostrar la ventana emergente de error (Toast) - Inferior Izquierda
function showError(mensaje) {
    const container = document.getElementById('toast-container');
    if (!container) return; 
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = mensaje;

    container.appendChild(toast);

    // Se elimina automáticamente después de 3 segundos
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function getTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    // Definimos el peso de cada prioridad para el ordenamiento
    const prioridadPeso = {
        'Alta': 3,
        'Media': 2,
        'Baja': 1
    };

    // ORDENAMIENTO INTELIGENTE:
    tasks.sort((a, b) => {
        // Primero: Si una está cancelada y la otra no, la cancelada va al final
        if (a.estado !== b.estado) {
            return a.estado === 'cancelada' ? 1 : -1;
        }
        // Segundo: Si ambas tienen el mismo estado, ordenamos por peso de prioridad (3 > 2 > 1)
        return prioridadPeso[b.prioridad] - prioridadPeso[a.prioridad];
    });

    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-card ${task.estado}`;
        
        // Al tocar la tarjeta se abre el modal de edición
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
}

// 2. Agregar nueva tarea (Validación con ventana emergente)
function addTask() {
    const input = document.getElementById('task-input');
    const titulo = input.value.trim();
    const categoria = document.getElementById('category-select').value;
    const prioridad = document.getElementById('priority-select').value;

    if (titulo.length < 5 || titulo.length > 100) {
        showError("⚠️ La tarea debe tener entre 5 y 100 caracteres.");
        return;
    }

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push({
        id: Date.now(),
        titulo,
        categoria,
        prioridad,
        estado: 'activa',
        fecha: new Date().toLocaleString()
    });

    localStorage.setItem('tasks', JSON.stringify(tasks));
    input.value = '';
    getTasks();
}

// 3. Cancelar tarea (Sistema Yox: Se tacha pero no se borra)
function cancelTask(id) {
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    tasks = tasks.map(t => {
        if (t.id === id) t.estado = 'cancelada';
        return t;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    getTasks();
}

// 4. Mostrar Modal con botón "Borrar" simplificado
function showDetails(id) {
    const tasks = JSON.parse(localStorage.getItem('tasks'));
    const task = tasks.find(t => t.id === id);
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
}

// 5. Guardar cambios (Validación con ventana emergente)
function saveEdit(id) {
    const newTitle = document.getElementById('edit-title').value.trim();
    if (newTitle.length < 5) {
        showError("⚠️ La tarea es muy corta.");
        return;
    }
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    tasks = tasks.map(t => {
        if (t.id === id) t.titulo = newTitle;
        return t;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    document.getElementById('task-modal').style.display = 'none';
    getTasks();
}

// 6. Borrar permanentemente
function deleteTask(id) {
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    document.getElementById('task-modal').style.display = 'none';
    getTasks();
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