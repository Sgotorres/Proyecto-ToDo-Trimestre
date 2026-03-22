const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- RUTAS DEL SISTEMA ---

// 1. OBTENER TAREAS
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

// 2. CREAR TAREA
app.post('/tareas', async (req, res) => {
    try {
        const { titulo, categoria_id, prioridad } = req.body;

        if (!titulo || titulo.trim().length < 5 || titulo.trim().length > 100) {
            return res.status(400).json({ error: "El título debe tener entre 5 y 100 caracteres." });
        }

        const newTodo = await pool.query(
            "INSERT INTO tareas (titulo, categoria_id, prioridad, estado, completada) VALUES($1, $2, $3, 'activa', false) RETURNING *",
            [titulo, categoria_id, prioridad || 'Media']
        );
        res.json(newTodo.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Error al crear la tarea" });
    }
});

// 3. EDITAR / ACTUALIZAR
app.put('/tareas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, completada, estado } = req.body;

        const tareaActual = await pool.query("SELECT estado FROM tareas WHERE id = $1", [id]);
        if (tareaActual.rows.length > 0 && tareaActual.rows[0].estado === 'cancelada') {
            return res.status(403).json({ error: "No se puede editar una tarea ya cancelada." });
        }

        if (titulo !== undefined && (titulo.trim().length < 5)) {
            return res.status(400).json({ error: "Edición rechazada: El texto es demasiado corto." });
        }

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

// 4. CANCELAR TAREA (Lógica de marcar como cancelada - No borra de DB)
app.patch('/tareas/cancelar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("UPDATE tareas SET estado = 'cancelada' WHERE id = $1", [id]);
        res.json("Tarea marcada como cancelada");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Error al cancelar la tarea" });
    }
});

// 5. BORRAR PERMANENTE (Lógica DELETE física - Elimina de la DB)
app.delete('/tareas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM tareas WHERE id = $1", [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Tarea no encontrada" });
        }
        
        res.json("Tarea eliminada permanentemente de la base de datos");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Error al eliminar de la base de datos" });
    }
});

// --- LANZAMIENTO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log(`✅ Lógica de Borrado Permanente y Prioridades vinculada.`);
});