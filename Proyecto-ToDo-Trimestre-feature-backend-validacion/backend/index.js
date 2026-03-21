const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- RUTAS DEL SISTEMA ---

// 1. OBTENER TAREAS (Con la lógica de orden de Yox: Activas primero, Canceladas al final)
app.get('/tareas', async (req, res) => {
    try {
        const query = `
            SELECT t.*, c.nombre as categoria_nombre, c.color as categoria_color 
            FROM tareas t 
            LEFT JOIN categorias c ON t.categoria_id = c.id
            ORDER BY 
                CASE WHEN t.estado = 'cancelada' THEN 1 ELSE 0 END ASC, 
                t.id ASC`; 
        const allTodos = await pool.query(query);
        res.json(allTodos.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Error al obtener tareas" });
    }
});

// 2. CREAR TAREA (Validación de Yox: 5-100 caracteres)
app.post('/tareas', async (req, res) => {
    try {
        const { titulo, categoria_id } = req.body;

        // Regla: Bloquear vacíos o fuera de rango
        if (!titulo || titulo.trim().length < 5 || titulo.trim().length > 100) {
            return res.status(400).json({ error: "El título debe tener entre 5 y 100 caracteres." });
        }

        const newTodo = await pool.query(
            "INSERT INTO tareas (titulo, categoria_id, estado, completada) VALUES($1, $2, 'activa', false) RETURNING *",
            [titulo, categoria_id]
        );
        res.json(newTodo.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Error al crear la tarea" });
    }
});

// 3. EDITAR / ACTUALIZAR (Regla de edición y bloqueo de canceladas)
app.put('/tareas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, completada, estado } = req.body;

        // Verificar si la tarea ya está cancelada antes de permitir editar
        const tareaActual = await pool.query("SELECT estado FROM tareas WHERE id = $1", [id]);
        
        if (tareaActual.rows.length > 0 && tareaActual.rows[0].estado === 'cancelada') {
            return res.status(403).json({ error: "No se puede editar una tarea ya cancelada." });
        }

        // Validación de edición: Si el usuario intenta dejarlo vacío o muy corto
        if (titulo !== undefined && (titulo.trim().length < 5)) {
            return res.status(400).json({ error: "Edición rechazada: El texto es demasiado corto." });
        }

        // USAMOS BACKTICKS (``) PARA QUE EL SALTO DE LÍNEA NO DE ERROR
        await pool.query(
            `UPDATE tareas SET 
                titulo = COALESCE($1, titulo), 
                completada = COALESCE($2, completada), 
                estado = COALESCE($3, estado) 
             WHERE id = $4`,
            [titulo, completada, estado, id]
        );

        res.json("Tarea actualizada correctamente");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// 4. "ELIMINAR" (En realidad es CANCELAR, según la lógica de Yox)
app.delete('/tareas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // No borramos el registro, solo cambiamos su estado a 'cancelada'
        await pool.query("UPDATE tareas SET estado = 'cancelada' WHERE id = $1", [id]);
        res.json("Tarea marcada como cancelada");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Error al cancelar la tarea" });
    }
});

// --- LANZAMIENTO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log(`Lógica de validaciones de Yox activada.`);
});