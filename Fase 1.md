# 🔵 Detalle de Tareas: Fase 1 (Semana Actual)

Especificaciones a realizar

---

### 1. 🗄️ Backend (David y Yox)
**Meta:** Preparar la base de datos.

* **Tarea:** Diseño del esquema de datos en **pgAdmin 4**.
* **Detalle:** Crear la base de datos `todo_db` y la tabla `tareas`.
* **Requisitos Técnicos:** La tabla debe crearse con la siguiente estructura:
    * `id`: Primary Key (Serial/Auto-incremental).
    * `titulo`: VARCHAR(100) - **Obligatorio limitar a 100**.
    * `completada`: BOOLEAN (Default: false).
    * `fecha_creacion`: TIMESTAMP (Default: Current_Timestamp).
* **Entregable:** Archivo `database.sql` dentro de la carpeta `/backend`.

---

### 2. 🎨 Frontier / Frontend (David y Dudu)
**Meta:** Construir la interfaz base.

* **Tarea:** Maquetación base y estructura de componentes.
* **Detalle:** Crear el archivo `index.html` y `style.css`.
* **Componentes Requeridos:**
    * Formulario de entrada con un `input` de texto.
    * Botón de "Agregar".
    * Contenedor (div o lista) donde se renderizarán las tareas.
* **Requisito de QA:** El `input` debe tener el atributo `maxlength="100"`.
* **Entregable:** Archivos base dentro de la carpeta `/frontend`.

---

### 3. 🧪 Tester y QA (Victor, Dudu y Yox)
**Meta:** Definir el estándar de calidad.

* **Tarea:** Documentación del Plan de Pruebas **"Happy Path"**.
* **Detalle:** Redactar los pasos que aseguran que el programa cumple su función principal sin errores.
* **Ejemplo de flujo:**
    1. El usuario escribe "Comprar café".
    2. El usuario hace clic en el botón.
    3. La tarea aparece de primera en la lista.
    4. El input se limpia automáticamente.
* **Entregable:** Archivo `pruebas.md` dentro de la carpeta `/docs`.

---

> **Nota para los desarrolladores:** Una vez terminada la tarea, recuerden subir sus archivos a su respectiva carpeta usando una **rama (branch)** propia para no afectar el trabajo de los demás.