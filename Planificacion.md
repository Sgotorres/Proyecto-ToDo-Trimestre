# 📅 Planificación del Proyecto: To-Do List (Trimestre 1)

Este documento detalla la hoja de ruta para el desarrollo del software, dividido en tres fases críticas para asegurar la escalabilidad y el cumplimiento del **Happy Path**.

---

## 🔵 Fase 1: Arquitectura y Programación Base
**Objetivo:** Crea el repositorio Github técnico y la base de datos.

- [x] **Configuración de Git:** Crear repositorio, estructura de carpetas y README.
- [ ] **Diseño de Base de Datos (David y Yox):** Crear tabla `tareas` en **pgAdmin 4** (Campos: ID, Título max 100, Estado, Fecha).
- [ ] **Mockup UI (Dudu y Victor):** Diseño visual de la lista, botones de editar/borrar y mensaje de confirmación.
- [ ] **Servidor Base (Torres y Yox):** Inicialización de Node.js y conexión exitosa con PostgreSQL.

---

## 🟢 Fase 2: Desarrollo y Funcionalidad CRUD
**Objetivo:** Lograr que la aplicación sea funcional y cumpla con las reglas pedidas.

- [ ] **Frontend Dinámico (David y Dudu):** Construcción del formulario de entrada y contenedor de tareas.
- [ ] **API de Datos (Yox):** Creación de Endpoints para comunicación Frontend-Backend.
- [ ] **Implementación del CRUD Completo:**
    - **Crear:** Persistencia en DB con validación de 100 caracteres.
    - **Leer:** Renderizado de tareas en orden descendente (más reciente arriba).
    - **Editar:** Modificación de texto en interfaz o modal.
    - **Eliminar:** Borrado lógico/físico tras confirmación obligatoria.

---

## 🔴 Fase 3: Definición, QA y Pulido Final
**Objetivo:** Asegurar que el software sea libre de errores.

- [ ] **Pruebas de QA (Yox y Victor):** Ejecución de pruebas de estrés (límite de caracteres, campos vacíos, flujo de confirmación).
- [ ] **Refactorización (Torres):** Limpieza de código para facilitar futuras ediciones y mejoras del profesor.
- [ ] **Feedback Visual (David):** Estilos finales (tachado de tareas, opacidad y diseño responsive).
- [ ] **Cierre de Proyecto:** Documentación técnica final y preparación de la Demo.

---

> **Nota para el equipo:** Por favor, a medida que completen una tarea, actualicen este archivo marcando la casilla correspondiente `[x]`.