Necesito modificar un sistema existente llamado "Casa Verde". Actualmente usa login con email y contraseña, y una tabla `usuarios` con campos (id, nombre, apellidos, email, password_hash, celular, celular_referencia, rol, activo, etc.). 
Debo realizar los siguientes cambios completos (backend + frontend):

1. Eliminar el campo `email` de la tabla `usuarios` y de toda la lógica de la aplicación. En su lugar, autenticar con un campo `username` (único, obligatorio). Agregar también los campos `ci` (cédula de identidad, único para garzones, nullable para admin) y `force_password_change` (booleano, default false).

2. En el login, cambiar el campo "Email" por "Usuario o CI". El fondo de la página de login debe ser más estético (gradiente con imagen de discoteca o similar).

3. Validar los números de celular con formato boliviano: 8 dígitos que empiecen con 6,7 u 8, opcionalmente con +591 al inicio.

4. Para los garzones, al crearlos, su contraseña inicial será su número de CI (hasheado) y además se marcará `force_password_change = true`. Por lo tanto, el campo `ci` es obligatorio al crear/editar un garzón. La primera vez que un garzón inicie sesión con su CI y contraseña (su CI), deberá ser forzado a cambiar su contraseña antes de acceder al dashboard.

5. En el formulario de creación/edición de garzones (solo accesible por el admin), eliminar el campo `email`, agregar el campo `CI` (con validación de números, sin espacios), y ajustar las validaciones de celular. Al guardar, si es un nuevo garzón, su contraseña se asignará automáticamente como el hash del CI.

6. Adaptar todos los endpoints del backend que antes usaban `email` para que usen `username` o `ci` según corresponda. Incluir el nuevo campo `force_password_change` en el login y en el cambio de contraseña.

7. Proporcionar el script SQL de migración (ALTER TABLE) para transformar la tabla `usuarios` existente sin perder datos (o desde cero si no hay datos críticos). Considerar que el admin existente debe tener username 'jefa' y force_password_change false.

Genera el código completo (SQL, backend Node.js/Express, frontend HTML/CSS/JS con Bootstrap) que implemente todos estos cambios. Muéstrame también cómo queda la página de login con fondo mejorado y el formulario de garzones actualizado.