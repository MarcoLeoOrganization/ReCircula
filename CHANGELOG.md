# Changelog de ReCircula

Este documento registra las versiones publicadas de ReCircula y los cambios incluidos en cada liberación.

## [1.0.0] - 2026-08-14

### Nombre de la versión

ReCircula v1.0.0 - Primera publicación estable.

### Qué se libera

Se libera la primera versión pública y funcional de ReCircula, una aplicación web orientada a la economía circular de dispositivos y componentes electrónicos.

La versión está integrada por:

- Frontend desarrollado con React y Vite.
- API REST desarrollada con NestJS.
- Base de datos PostgreSQL y almacenamiento administrados mediante Supabase.
- Contenedores Docker para frontend, backend, base de datos y balanceador Nginx.
- Pipeline de integración y despliegue continuo mediante GitHub Actions.
- Frontend publicado en Vercel y Netlify.
- Backend publicado mediante Docker en Render.

### Funcionalidades incluidas

- Registro y verificación de usuarios.
- Inicio y cierre de sesión.
- Recuperación de contraseña.
- Catálogo de publicaciones.
- Publicación de artículos para venta, donación o intercambio.
- Gestión de propuestas y transacciones.
- Búsqueda de publicaciones y reparadores por ubicación.
- Notificaciones relacionadas con las transacciones.
- Calificaciones entre usuarios.
- Historial de artículos.
- Funciones de privacidad y derechos ARCO.
- Documentación de la API mediante Swagger.

### Cambios incorporados antes de la liberación

- Configuración de las URLs públicas de producción.
- Integración del frontend con la API desplegada en Render.
- Corrección de enlaces de verificación y recuperación enviados por correo.
- Incorporación de pruebas de caja blanca y pruebas unitarias automatizadas con Jest.
- Incorporación de pruebas de rendimiento con Lighthouse y Autocannon.
- Configuración de Dockerfiles y Docker Compose.
- Configuración del pipeline de GitHub Actions.
- Despliegue automático del frontend en Vercel.
- Publicación alternativa del frontend en Netlify.
- Despliegue automático del backend en Render.

### URLs de la versión

- Frontend en Vercel: https://recircula.vercel.app
- Frontend en Netlify: https://recircula.netlify.app
- Backend y Swagger: https://recircula.onrender.com/api/docs
- Estado del backend: https://recircula.onrender.com/api/v1/health

### Pruebas realizadas

- Tres casos de caja blanca.
- Tres casos de pruebas unitarias.
- Tres casos de rendimiento.
- Suite automatizada del backend con 43 pruebas aprobadas.
- Comprobación del frontend en escritorio y emulación móvil.
- Prueba concurrente de la API mediante Autocannon.

### Limitaciones conocidas

- El backend utiliza una instancia gratuita de Render y puede tardar en responder después de un periodo de inactividad.
- La cobertura global del backend todavía es parcial.
- El limitador de solicitudes puede devolver HTTP 429 ante una carga elevada.
- No se ha evaluado el escalamiento horizontal con varias instancias en producción.
- El rendimiento puede variar dependiendo del dispositivo, la red y la disponibilidad de los servicios externos.

### Aprobación de la versión

La versión ReCircula v1.0.0 fue revisada y aprobada para su publicación por:

- Marco Antonio Martínez Ramírez.
- Leonel Alejandro Torres Pérez.

Fecha de aprobación: 14 de agosto de 2026.
