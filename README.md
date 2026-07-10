# ReCircula - Plataforma de Economía Circular

ReCircula es una aplicación web y PWA diseñada para incentivar y automatizar la donación, intercambio y reparación de componentes tecnológicos en desuso, mitigando el impacto de la basura electrónica.

Este repositorio cuenta con una arquitectura desacoplada y moderna, implementando automatización de pruebas (CI/CD), contenedores (Docker) y mecanismos avanzados de seguridad.

---

## 🗺️ Arquitectura del Sistema

El sistema está diseñado bajo un esquema de microservicios contenerizados y balanceo de carga para permitir escalabilidad horizontal:

```
[ Cliente (React PWA) ]
        │ (Puerto 80)
        ▼
[ Balanceador de Carga (Nginx) ]
        │ (Puerto 3000)
        ├──────────────────────────┐
        ▼                          ▼
[ Backend Instancia 1 ]    [ Backend Instancia 2 ] (NestJS / Docker)
        │                          │
        └─────────────┬────────────┘
                      ▼
        [ Base de Datos (PostgreSQL + PostGIS) ]
```

---

## 🛠️ Instalación y Ejecución Local (Docker Compose)

El proyecto está dockerizado para iniciar todo el stack con un único comando.

### Prerrequisitos

- Tener instalado **Docker** y **Docker Compose**.

### Instrucciones de inicio

1. Clona el repositorio a tu computadora local.
2. Abre una terminal en la carpeta raíz del proyecto y ejecuta:
   ```bash
   docker compose up --build
   ```
3. La aplicación estará disponible en los siguientes puertos:
   - **FrontEnd (Cliente):** [http://localhost](http://localhost) (Puerto 80)
   - **BackEnd (API & Swagger):** [http://localhost:3000/api/docs](http://localhost:3000/api/docs) (Puerto 3000 balanceado)

### Escalado Horizontal del Backend

El backend está configurado para escalarse dinámicamente sin conflictos de puerto gracias al balanceador Nginx:

```bash
docker compose up --build --scale backend=3
```

---

## 🚀 Integración y Despliegue Continuo (CI/CD)

### GitHub Actions (Integración Continua - CI)

Se configuró un pipeline en `.github/workflows/ci.yml` que se dispara automáticamente ante cada Pull Request (PR) hacia las ramas `main` y `develop`:

- **Validación de Código (Linters):** Verifica que todo el código TS/JS cumpla con las reglas estrictas de formato (ESLint y Prettier).
- **Pruebas Unitarias:** Ejecuta la suite de pruebas automatizadas del Backend (Jest) asegurando que no se introduzcan regresiones.
- **Compilación (Build):** Valida que el FrontEnd en Vite compile correctamente antes de fusionar.

### Despliegue Continuo (CD)

- **BackEnd:** Se configuró el despliegue automático hacia **Render** conectando el repositorio de la organización. Cada fusión (_merge_) a la rama `main` compila y publica una nueva imagen Docker en producción de forma automática en:  
  👉 [https://recircula.onrender.com/api/docs](https://recircula.onrender.com/api/docs)
- **FrontEnd:** Desplegado en **Vercel** conectado directamente al monorepo en la subcarpeta `FrontEnd`.

---

## 🔑 Credenciales de Prueba para Evaluación

Para facilitar la evaluación de los diferentes roles y controles de acceso (RBAC) de la aplicación, utiliza los siguientes usuarios de prueba:

| Rol                      | Correo Electrónico       | Contraseña    | Propósito                                                                   |
| :----------------------- | :----------------------- | :------------ | :-------------------------------------------------------------------------- |
| **Administrador**        | `admin@recircula.mx`     | `Password123` | Control de accesos de administrador, revisión de perfiles y verificaciones. |
| **Reparador Verificado** | `reparador@recircula.mx` | `Password123` | Acceso a matchmaking especializado y documentación de reparaciones.         |
| **Usuario General**      | `user@recircula.mx`      | `Password123` | Registro de publicaciones de intercambio, donación o solicitudes de trato.  |

---

## 🛡️ Mecanismos de Seguridad Implementados

1. **Protección SQLi / NoSQLi:** Parametrización completa de consultas a nivel de ORM (TypeORM) y consultas espaciales nativas.
2. **Control de Accesos (RBAC):** Restricción de endpoints mediante guards de NestJS (`RolesGuard`) y JSON Web Tokens (JWT).
3. **Seguridad en el Transporte:** Conexión HTTPS SSL/TLS forzada en la nube.
4. **Límite de Peticiones (Rate Limiting):** Mitigación de ataques de fuerza bruta mediante `ThrottlerGuard` (máximo 100 peticiones/minuto en producción).
5. **Privacidad LGPDPPSO:** Derechos ARCO de Acceso, Rectificación, Oposición y Cancelación (con anonimización automática de datos personales).
