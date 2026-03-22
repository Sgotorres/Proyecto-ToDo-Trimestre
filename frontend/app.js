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