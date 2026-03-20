(Backend)
Ustedes se encargarán de las reglas de funcionamiento y el manejo de los datos del sistema:

Validaciones de Título: El sistema debe bloquear cualquier texto que tenga menos de 5 caracteres o más de 100. No se permite agregar tareas vacías.

Regla de Edición: Si al intentar editar una tarea el campo queda vacío, el sistema no debe guardar el cambio y debe mantener el texto original.

Lógica de Estados: Ustedes controlan cuándo una tarea está "Activa" o "finalizada".

Comportamiento de Eliminación: Al presionar "finalizar", la tarea debe cambiar su estado (tacharse visualmente), bloquear su edición y moverse automáticamente al final de la lista.

Orden de las Tareas: Mantener el orden de creación (la primera tarea creada se queda de primera), a menos que pase al estado "finalizada".

Contenido del Modal: Definir la estructura de la información completa que se mostrará cuando el usuario abra una tarea.

 (Frontend)
Ustedes se encargarán de que el programa sea visualmente atractivo y fácil de usar:

Estética del Programa: Definir la paleta de colores, las fuentes y el diseño general de las tarjetas de tareas.

Diseño del Modal: hacer que  la ventana emergente (modal) que se abre al seleccionar una tarea para mostrar su información completa se vea bonita xd.

Ubicación de Controles: Asegurar que los botones de Editar y Finalizar estén integrados estéticamente dentro de cada tarea.

Feedback Visual: Aplicar los estilos (como el tachado o cambio de opacidad) según el estado que reciba la tarea.

Presentación Limpia: Asegurar que el diseño se vea ordenado y que el modal sea fácil de cerrar.