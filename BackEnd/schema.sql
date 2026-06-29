-- =============================================================================
--  ReCircula — Schema de Base de Datos PostgreSQL
--  Universidad Tecnológica del Norte de Guanajuato
--  Ingeniería en Desarrollo y Gestión de Software
--  Asignatura: Desarrollo Web Integral | Grupo GIDS6093-E
-- =============================================================================
--
--  EXTENSIONES REQUERIDAS:
--    - uuid-ossp   : generación de UUIDs como PKs
--    - postgis     : soporte geoespacial nativo (índices GIST, ST_DWithin, etc.)
--    - pg_trgm     : búsquedas de texto con similitud (LIKE sin full index scan)
--
--  EJECUTAR CON SUPERUSUARIO ANTES DEL SCHEMA:
--    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--    CREATE EXTENSION IF NOT EXISTS postgis;
--    CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- =============================================================================

-- =============================================================================
-- 0. EXTENSIONES
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- 1. TIPOS ENUMERADOS  (ENUM)
-- =============================================================================

-- Roles del sistema (RF-01.4)
CREATE TYPE rol_usuario AS ENUM (
    'USUARIO_GENERAL',
    'REPARADOR_VERIFICADO',
    'ADMINISTRADOR'
);

-- Estados del ciclo de vida de una publicación (Patrón Estado)
CREATE TYPE estado_publicacion AS ENUM (
    'BORRADOR',
    'PUBLICADO',
    'RESERVADO',
    'INTERCAMBIADO',
    'ARCHIVADO'
);

-- Modalidades de intercambio (Patrón Estrategia)
CREATE TYPE modalidad_intercambio AS ENUM (
    'DONACION',
    'VENTA',
    'TRUEQUE',
    'VENTA_PIEZAS'
);

-- Estados del ciclo de vida de una transacción (Patrón Estado)
CREATE TYPE estado_transaccion AS ENUM (
    'PENDIENTE',
    'EN_PROCESO',
    'COMPLETADA',
    'CANCELADA'
);

-- Tipos de entrada en el historial de vida del producto (RF-05)
CREATE TYPE tipo_entrada_historial AS ENUM (
    'INTERCAMBIO',
    'REPARACION',
    'CAMBIO_PROPIETARIO',
    'INSPECCION'
);

-- Tipos de notificación (RF-07)
CREATE TYPE tipo_notificacion AS ENUM (
    'INTERES_EN_PUBLICACION',
    'CAMBIO_ESTADO_TRANSACCION',
    'NUEVA_PUBLICACION_FAVORITA',
    'CALIFICACION_RECIBIDA',
    'SOLICITUD_VERIFICACION',
    'VERIFICACION_APROBADA'
);

-- =============================================================================
-- 2. FUNCIÓN AUXILIAR: actualizar fecha_actualizacion automáticamente
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. MÓDULO: IDENTIDAD Y ACCESO
-- =============================================================================

-- ------------------------------------------------------------
-- Tabla principal de usuarios (entidad base, tabla única por rol)
-- Los perfiles extendidos están en tablas separadas (estrategia
-- Table-Per-Concrete-Class para evitar NULLs masivos).
-- ------------------------------------------------------------
CREATE TABLE usuarios (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre              VARCHAR(150) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,             -- bcrypt (RNF-03.2)
    rol                 rol_usuario  NOT NULL DEFAULT 'USUARIO_GENERAL',
    email_verificado    BOOLEAN      NOT NULL DEFAULT FALSE,
    activo              BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_usuarios_ts
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

COMMENT ON TABLE  usuarios              IS 'Entidad base para todos los actores del sistema.';
COMMENT ON COLUMN usuarios.password_hash IS 'Hash bcrypt. La contraseña plana NUNCA se almacena.';

-- ------------------------------------------------------------
-- Perfil extendido: Usuario General
-- ------------------------------------------------------------
CREATE TABLE perfiles_usuario_general (
    usuario_id              UUID    PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    categorias_favoritas    TEXT[]  NOT NULL DEFAULT '{}',
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN perfiles_usuario_general.categorias_favoritas
    IS 'Array de nombres de categorías marcadas como favoritas para alertas (RF-07.3).';

-- ------------------------------------------------------------
-- Perfil extendido: Reparador Verificado
-- Incluye coordenada geoespacial para matchmaking (RF-03.3)
-- ------------------------------------------------------------
CREATE TABLE perfiles_reparador (
    usuario_id                    UUID         PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_taller                 VARCHAR(200),
    descripcion_taller            TEXT,
    especialidades                TEXT[]       NOT NULL DEFAULT '{}',
    puntuacion                    DECIMAL(3,2) NOT NULL DEFAULT 0.00
                                               CHECK (puntuacion >= 0 AND puntuacion <= 5),
    reparaciones_documentadas     INT          NOT NULL DEFAULT 0,

    -- GEOGRAPHY(POINT) usa el elipsoide WGS-84 (el mismo que GPS/Google Maps).
    -- ST_DWithin sobre GEOGRAPHY opera en METROS, no grados, lo que permite
    -- consultas "buscar en radio de X km" sin calcular coordenadas en la app.
    ubicacion                     GEOGRAPHY(POINT, 4326),

    verificado                    BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_solicitud_verificacion  TIMESTAMPTZ,
    fecha_verificacion            TIMESTAMPTZ,
    verificado_por                UUID         REFERENCES usuarios(id),
    fecha_creacion                TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_reparadores_ts
    BEFORE UPDATE ON perfiles_reparador
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

COMMENT ON COLUMN perfiles_reparador.ubicacion
    IS 'GEOGRAPHY(POINT) con SRID 4326. El índice GIST sobre esta columna permite
    búsquedas de matchmaking por radio sin cálculos en la capa de aplicación.';
COMMENT ON COLUMN perfiles_reparador.especialidades
    IS 'Array con los nombres de las categorías en las que el reparador está especializado.';

-- ------------------------------------------------------------
-- Sesiones activas (tokens JWT referenciados por hash)
-- ------------------------------------------------------------
CREATE TABLE sesiones (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id          UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash          VARCHAR(512) NOT NULL UNIQUE,
    fecha_expiracion    TIMESTAMPTZ  NOT NULL,
    invalidado          BOOLEAN      NOT NULL DEFAULT FALSE,
    ip_origen           INET,
    fecha_creacion      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sesiones IS 'Permite invalidar tokens activos en RF-01.5 (cerrar sesión).';

-- ------------------------------------------------------------
-- Tokens de recuperación de contraseña (RF-01.3)
-- ------------------------------------------------------------
CREATE TABLE tokens_recuperacion (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id          UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash          VARCHAR(512) NOT NULL UNIQUE,
    fecha_expiracion    TIMESTAMPTZ  NOT NULL,
    usado               BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_creacion      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. MÓDULO: PUBLICACIONES Y ARTÍCULOS
-- =============================================================================

-- ------------------------------------------------------------
-- Catálogo de categorías (tabla maestra, seed al final)
-- ------------------------------------------------------------
CREATE TABLE categorias_articulo (
    id          SERIAL       PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono       VARCHAR(50),
    activa      BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ------------------------------------------------------------
-- Publicaciones (artículo publicado por un usuario)
-- ------------------------------------------------------------
CREATE TABLE publicaciones (
    id                   UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo               VARCHAR(200)         NOT NULL,
    descripcion          TEXT                 NOT NULL,
    categoria            VARCHAR(100)         NOT NULL
                                              REFERENCES categorias_articulo(nombre),
    modalidad            modalidad_intercambio NOT NULL,
    estado               estado_publicacion    NOT NULL DEFAULT 'BORRADOR',

    -- Precio: obligatorio solo en modalidades VENTA y VENTA_PIEZAS
    precio               DECIMAL(10,2)        CHECK (precio >= 0),
    moneda               CHAR(3)              NOT NULL DEFAULT 'MXN',

    -- Geolocalización: columna GEOGRAPHY para índice GIST geoespacial
    ubicacion            GEOGRAPHY(POINT, 4326) NOT NULL,
    direccion_referencia TEXT,

    publicador_id        UUID                 NOT NULL REFERENCES usuarios(id),
    fecha_creacion       TIMESTAMPTZ          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion  TIMESTAMPTZ          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_archivado      TIMESTAMPTZ,

    CONSTRAINT chk_precio_venta CHECK (
        (modalidad IN ('VENTA', 'VENTA_PIEZAS') AND precio IS NOT NULL)
        OR (modalidad NOT IN ('VENTA', 'VENTA_PIEZAS'))
    )
);

CREATE TRIGGER trg_publicaciones_ts
    BEFORE UPDATE ON publicaciones
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

COMMENT ON COLUMN publicaciones.ubicacion
    IS 'GEOGRAPHY(POINT) con SRID 4326. Índice GIST habilita búsquedas geoespaciales
    de matchmaking directamente en el motor de datos (no en la capa de aplicación).';

-- ------------------------------------------------------------
-- Componentes / piezas del artículo (Hardware Mining - RF-02.2)
-- ------------------------------------------------------------
CREATE TABLE componentes (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    publicacion_id  UUID        NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    nombre          VARCHAR(150) NOT NULL,
    funcional       BOOLEAN      NOT NULL DEFAULT FALSE,
    descripcion     TEXT,
    precio_pieza    DECIMAL(10,2) CHECK (precio_pieza >= 0),   -- Solo VENTA_PIEZAS
    fecha_creacion  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE componentes IS 'Desglose de componentes del artículo. Permite a los
reparadores buscar piezas específicas funcionales dentro de una publicación (RF-02.2).';

-- ------------------------------------------------------------
-- Imágenes (máximo 10 por publicación - RF-02.3)
-- ------------------------------------------------------------
CREATE TABLE imagenes_publicacion (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    publicacion_id  UUID        NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    url             VARCHAR(500) NOT NULL,
    es_principal    BOOLEAN      NOT NULL DEFAULT FALSE,
    orden           SMALLINT     NOT NULL DEFAULT 0 CHECK (orden BETWEEN 0 AND 9),
    fecha_subida    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN imagenes_publicacion.orden
    IS 'Posición de la imagen (0–9). Máximo 10 imágenes por publicación (RF-02.3).';

-- ------------------------------------------------------------
-- Publicaciones favoritas del usuario (para alertas RF-07.3)
-- ------------------------------------------------------------
CREATE TABLE publicaciones_favoritas (
    usuario_id      UUID        NOT NULL REFERENCES usuarios(id)      ON DELETE CASCADE,
    publicacion_id  UUID        NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    fecha_agregado  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, publicacion_id)
);

-- ------------------------------------------------------------
-- Puntos de entrega seguros y talleres registrados (RF-03.4)
-- ------------------------------------------------------------
CREATE TABLE puntos_entrega (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          VARCHAR(200) NOT NULL,
    tipo            VARCHAR(50)  NOT NULL DEFAULT 'PUNTO_SEGURO',
                                          -- 'PUNTO_SEGURO' | 'TALLER'
    direccion       TEXT         NOT NULL,
    ubicacion       GEOGRAPHY(POINT, 4326) NOT NULL,
    telefono        VARCHAR(20),
    horario         TEXT,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    reparador_id    UUID         REFERENCES usuarios(id),   -- si es taller registrado
    fecha_creacion  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE puntos_entrega IS 'Puntos seguros de intercambio y talleres mostrados
en el mapa por el motor de matchmaking (RF-03.4).';

-- =============================================================================
-- 5. MÓDULO: TRANSACCIONES E INTERCAMBIOS
-- =============================================================================

CREATE TABLE transacciones (
    id                      UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
    publicacion_id          UUID                  NOT NULL REFERENCES publicaciones(id),
    iniciador_id            UUID                  NOT NULL REFERENCES usuarios(id),
    receptor_id             UUID                  NOT NULL REFERENCES usuarios(id),
    modalidad               modalidad_intercambio NOT NULL,
    estado                  estado_transaccion    NOT NULL DEFAULT 'PENDIENTE',
    precio_acordado         DECIMAL(10,2)         CHECK (precio_acordado >= 0),
    confirmacion_iniciador  BOOLEAN               NOT NULL DEFAULT FALSE,
    confirmacion_receptor   BOOLEAN               NOT NULL DEFAULT FALSE,   -- RF-04.2
    notas                   TEXT,
    fecha_creacion          TIMESTAMPTZ           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion     TIMESTAMPTZ           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_completada        TIMESTAMPTZ,

    CONSTRAINT chk_partes_distintas CHECK (iniciador_id <> receptor_id)
);

CREATE TRIGGER trg_transacciones_ts
    BEFORE UPDATE ON transacciones
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

COMMENT ON COLUMN transacciones.confirmacion_iniciador IS 'Ambas confirmaciones deben
ser TRUE para que el sistema marque el intercambio como COMPLETADO (RF-04.2).';

-- ------------------------------------------------------------
-- Auditoría de cambios de estado en transacciones (RF-04.4)
-- Registro inmutable: una fila por cada cambio de estado.
-- ------------------------------------------------------------
CREATE TABLE auditoria_transacciones (
    id                       UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaccion_id           UUID               NOT NULL REFERENCES transacciones(id) ON DELETE CASCADE,
    estado_anterior          estado_transaccion,
    estado_nuevo             estado_transaccion NOT NULL,
    usuario_responsable_id   UUID               NOT NULL REFERENCES usuarios(id),
    notas                    TEXT,
    fecha_cambio             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE auditoria_transacciones IS 'Registro auditable con marca de tiempo y
usuario responsable de cada cambio de estado (RF-04.4). No se eliminan filas.';

-- =============================================================================
-- 6. MÓDULO: HISTORIAL DE VIDA DEL PRODUCTO
-- =============================================================================

-- Una publicación tiene exactamente un historial
CREATE TABLE historial_producto (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    publicacion_id  UUID        NOT NULL UNIQUE REFERENCES publicaciones(id) ON DELETE CASCADE,
    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cada intervención queda como una entrada en el historial
CREATE TABLE entradas_historial (
    id                  UUID                   PRIMARY KEY DEFAULT uuid_generate_v4(),
    historial_id        UUID                   NOT NULL REFERENCES historial_producto(id) ON DELETE CASCADE,
    tipo                tipo_entrada_historial NOT NULL,
    descripcion         TEXT                   NOT NULL,
    fecha              DATE                   NOT NULL DEFAULT CURRENT_DATE,
    reparador_id        UUID                   REFERENCES usuarios(id),
    piezas_reemplazadas TEXT[]                 NOT NULL DEFAULT '{}',
    estado_resultante   VARCHAR(100),
    transaccion_id      UUID                   REFERENCES transacciones(id),
    fecha_creacion      TIMESTAMPTZ            NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE entradas_historial IS 'Registro trazable de intervenciones y cambios
de propietario. Visible para cualquier interesado en el artículo (RF-05.3).';

-- =============================================================================
-- 7. MÓDULO: SISTEMA DE REPUTACIÓN Y VERIFICACIÓN
-- =============================================================================

CREATE TABLE calificaciones (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    calificador_id  UUID        NOT NULL REFERENCES usuarios(id),
    calificado_id   UUID        NOT NULL REFERENCES usuarios(id),
    transaccion_id  UUID        NOT NULL UNIQUE REFERENCES transacciones(id),  -- 1 calificación por tx
    puntuacion      SMALLINT    NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    resena          TEXT,
    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_no_autocalificacion CHECK (calificador_id <> calificado_id)
);

COMMENT ON TABLE calificaciones IS 'Una calificación por transacción completada. Permite
calificar a ambas partes (RF-06.1).';

-- Evidencias fotográficas del reparador (antes / después)
CREATE TABLE evidencias_fotograficas (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    reparador_id         UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    entrada_historial_id UUID        REFERENCES entradas_historial(id),
    url_antes            VARCHAR(500) NOT NULL,
    url_despues          VARCHAR(500) NOT NULL,
    descripcion          TEXT,
    aprobada             BOOLEAN,                               -- NULL = pendiente de revisión
    aprobada_por         UUID        REFERENCES usuarios(id),
    fecha_creacion       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE evidencias_fotograficas IS 'Fotografías antes/después que el reparador
adjunta para solicitar verificación (RF-06.2).';

-- =============================================================================
-- 8. MÓDULO: NOTIFICACIONES
-- =============================================================================

CREATE TABLE notificaciones (
    id               UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    destinatario_id  UUID              NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo             tipo_notificacion NOT NULL,
    titulo           VARCHAR(200)      NOT NULL,
    mensaje          TEXT              NOT NULL,
    leida            BOOLEAN           NOT NULL DEFAULT FALSE,
    -- Referencia polimórfica al objeto que originó la notificación
    referencia_id    UUID,
    referencia_tipo  VARCHAR(50),       -- 'publicacion' | 'transaccion' | 'calificacion'
    fecha_creacion   TIMESTAMPTZ       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura    TIMESTAMPTZ
);

COMMENT ON TABLE notificaciones IS 'Alertas en tiempo real e historial de comunicaciones.
El módulo es suscriptor del EventBus (Patrón Observador, RF-07).';

-- =============================================================================
-- 9. MÓDULO: EVENTOS DEL SISTEMA  (EDA — EventBus log de auditoría)
-- =============================================================================
-- Permite que los mensajes en tránsito sobrevivan a reinicios del servidor y
-- sirve como traza de auditoría de todos los eventos emitidos por el sistema.
-- =============================================================================

CREATE TABLE eventos_sistema (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo            VARCHAR(100) NOT NULL,      -- ej: 'IntercambioCompletado'
    payload         JSONB        NOT NULL DEFAULT '{}',
    emisor          VARCHAR(100) NOT NULL,       -- módulo origen
    procesado       BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_emision   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_procesado TIMESTAMPTZ
);

COMMENT ON TABLE eventos_sistema IS 'Log persistente de eventos del EventBus interno.
Garantiza que ninguna transacción en curso se pierda ante fallos de módulos (RNF-02.3).';

-- =============================================================================
-- 10. ÍNDICES
-- =============================================================================

-- ── Identidad y Acceso ──────────────────────────────────────────────────────
CREATE INDEX idx_usuarios_email    ON usuarios(email);
CREATE INDEX idx_usuarios_rol      ON usuarios(rol);
CREATE INDEX idx_usuarios_activo   ON usuarios(activo) WHERE activo = TRUE;

CREATE INDEX idx_sesiones_usuario  ON sesiones(usuario_id);
CREATE INDEX idx_sesiones_token    ON sesiones(token_hash);
-- Solo indexar sesiones vigentes (las expiradas/invalidadas raramente se consultan)
CREATE INDEX idx_sesiones_vigentes ON sesiones(fecha_expiracion)
    WHERE invalidado = FALSE;

-- ── Publicaciones ────────────────────────────────────────────────────────────
CREATE INDEX idx_pub_publicador    ON publicaciones(publicador_id);
CREATE INDEX idx_pub_estado        ON publicaciones(estado);
CREATE INDEX idx_pub_modalidad     ON publicaciones(modalidad);
CREATE INDEX idx_pub_categoria     ON publicaciones(categoria);
CREATE INDEX idx_pub_fecha         ON publicaciones(fecha_creacion DESC);

-- ÍNDICE GEOESPACIAL GIST — habilita ST_DWithin en O(log n) sobre millones de filas
CREATE INDEX idx_pub_geo           ON publicaciones USING GIST(ubicacion);

-- Búsqueda de texto con similitud (soporte para buscador con typos)
CREATE INDEX idx_pub_titulo_trgm   ON publicaciones USING GIN(titulo gin_trgm_ops);
CREATE INDEX idx_pub_desc_trgm     ON publicaciones USING GIN(descripcion gin_trgm_ops);

CREATE INDEX idx_componentes_pub   ON componentes(publicacion_id);
-- Índice parcial: solo componentes funcionales (los más consultados en matchmaking)
CREATE INDEX idx_componentes_func  ON componentes(publicacion_id) WHERE funcional = TRUE;

CREATE INDEX idx_imagenes_pub      ON imagenes_publicacion(publicacion_id);
-- Imagen principal buscada frecuentemente en listados
CREATE INDEX idx_imagenes_principal ON imagenes_publicacion(publicacion_id)
    WHERE es_principal = TRUE;

-- ── Reparadores ─────────────────────────────────────────────────────────────
-- ÍNDICE GEOESPACIAL GIST — motor de matchmaking (RF-03.3)
CREATE INDEX idx_reparadores_geo           ON perfiles_reparador USING GIST(ubicacion);
CREATE INDEX idx_reparadores_verificado    ON perfiles_reparador(verificado)
    WHERE verificado = TRUE;
-- GIN sobre arrays para filtrar por especialidad
CREATE INDEX idx_reparadores_especialidades ON perfiles_reparador USING GIN(especialidades);

-- ── Puntos de entrega ───────────────────────────────────────────────────────
CREATE INDEX idx_puntos_geo    ON puntos_entrega USING GIST(ubicacion);
CREATE INDEX idx_puntos_activo ON puntos_entrega(activo) WHERE activo = TRUE;

-- ── Transacciones ────────────────────────────────────────────────────────────
CREATE INDEX idx_tx_publicacion ON transacciones(publicacion_id);
CREATE INDEX idx_tx_iniciador   ON transacciones(iniciador_id);
CREATE INDEX idx_tx_receptor    ON transacciones(receptor_id);
CREATE INDEX idx_tx_estado      ON transacciones(estado);
CREATE INDEX idx_auditoria_tx   ON auditoria_transacciones(transaccion_id);

-- ── Historial ────────────────────────────────────────────────────────────────
CREATE INDEX idx_historial_pub ON historial_producto(publicacion_id);
CREATE INDEX idx_entradas_hist ON entradas_historial(historial_id);
CREATE INDEX idx_entradas_rep  ON entradas_historial(reparador_id);

-- ── Reputación ───────────────────────────────────────────────────────────────
CREATE INDEX idx_cal_calificado  ON calificaciones(calificado_id);
CREATE INDEX idx_cal_transaccion ON calificaciones(transaccion_id);
CREATE INDEX idx_evid_reparador  ON evidencias_fotograficas(reparador_id);

-- ── Notificaciones ────────────────────────────────────────────────────────────
CREATE INDEX idx_notif_dest   ON notificaciones(destinatario_id);
-- Índice parcial: solo no leídas (las más consultadas en tiempo real)
CREATE INDEX idx_notif_noleidas ON notificaciones(destinatario_id, fecha_creacion DESC)
    WHERE leida = FALSE;

-- ── Eventos ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_eventos_tipo         ON eventos_sistema(tipo);
CREATE INDEX idx_eventos_no_procesados ON eventos_sistema(fecha_emision)
    WHERE procesado = FALSE;

-- =============================================================================
-- 11. TRIGGERS DE NEGOCIO
-- =============================================================================

-- ── Trigger: crear historial al publicar un artículo ────────────────────────
CREATE OR REPLACE FUNCTION fn_crear_historial_producto()
RETURNS TRIGGER AS $$
BEGIN
    -- Se crea el historial en el momento en que la publicación pasa a PUBLICADO
    IF NEW.estado = 'PUBLICADO' AND (OLD.estado IS NULL OR OLD.estado = 'BORRADOR') THEN
        INSERT INTO historial_producto (publicacion_id)
        VALUES (NEW.id)
        ON CONFLICT (publicacion_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crear_historial
    AFTER INSERT OR UPDATE ON publicaciones
    FOR EACH ROW EXECUTE FUNCTION fn_crear_historial_producto();

-- ── Trigger: registrar entrada de intercambio al completar transacción ───────
CREATE OR REPLACE FUNCTION fn_registrar_intercambio_en_historial()
RETURNS TRIGGER AS $$
DECLARE
    v_historial_id UUID;
BEGIN
    IF NEW.estado = 'COMPLETADA' AND OLD.estado <> 'COMPLETADA' THEN
        SELECT id INTO v_historial_id
        FROM historial_producto
        WHERE publicacion_id = NEW.publicacion_id;

        IF v_historial_id IS NOT NULL THEN
            INSERT INTO entradas_historial
                (historial_id, tipo, descripcion, transaccion_id)
            VALUES (
                v_historial_id,
                'INTERCAMBIO',
                'Intercambio completado. Modalidad: ' || NEW.modalidad::TEXT,
                NEW.id
            );
        END IF;

        -- Marcar la fecha de cierre de la transacción
        NEW.fecha_completada = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGER trg_historial_intercambio
--     BEFORE UPDATE ON transacciones
--     FOR EACH ROW EXECUTE FUNCTION fn_registrar_intercambio_en_historial();

-- ── Trigger: recalcular puntuación del reparador al recibir calificación ─────
CREATE OR REPLACE FUNCTION fn_actualizar_puntuacion_reparador()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE perfiles_reparador
    SET
        puntuacion = (
            SELECT ROUND(AVG(puntuacion)::NUMERIC, 2)
            FROM calificaciones
            WHERE calificado_id = NEW.calificado_id
        ),
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE usuario_id = NEW.calificado_id
      AND EXISTS (
          SELECT 1 FROM perfiles_reparador WHERE usuario_id = NEW.calificado_id
      );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_puntuacion_reparador
    AFTER INSERT OR UPDATE ON calificaciones
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_puntuacion_reparador();

-- ── Trigger: bloquear estado inconsistente en transacciones (RF-04.3) ────────
CREATE OR REPLACE FUNCTION fn_validar_transicion_estado_tx()
RETURNS TRIGGER AS $$
BEGIN
    -- No se puede avanzar desde un estado terminal
    IF OLD.estado IN ('COMPLETADA', 'CANCELADA') AND NEW.estado <> OLD.estado THEN
        RAISE EXCEPTION
            'Transición inválida: la transacción está en estado terminal "%". No se puede cambiar a "%".',
            OLD.estado, NEW.estado;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_estado_tx
    BEFORE UPDATE ON transacciones
    FOR EACH ROW EXECUTE FUNCTION fn_validar_transicion_estado_tx();

-- ── Trigger: registrar cambios de estado en auditoría (RF-04.4) ──────────────
CREATE OR REPLACE FUNCTION fn_auditoria_estado_tx()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado <> OLD.estado THEN
        INSERT INTO auditoria_transacciones
            (transaccion_id, estado_anterior, estado_nuevo, usuario_responsable_id)
        VALUES
            (NEW.id, OLD.estado, NEW.estado, NEW.iniciador_id);
            -- En producción el usuario_responsable_id se inyecta vía SET LOCAL
            -- de la sesión de BD o mediante parámetro de contexto.
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditoria_tx
    AFTER UPDATE ON transacciones
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria_estado_tx();

-- =============================================================================
-- 12. FUNCIONES DE MATCHMAKING / GEOLOCALIZACIÓN
-- =============================================================================

-- ── Buscar publicaciones en un radio geográfico configurable (RF-03.1) ────────
-- Uso: SELECT * FROM fn_buscar_publicaciones(-20.9200, -101.3500, 15, 'Smartphones y Tablets');
CREATE OR REPLACE FUNCTION fn_buscar_publicaciones(
    p_latitud   FLOAT,
    p_longitud  FLOAT,
    p_radio_km  FLOAT                  DEFAULT 10,
    p_categoria VARCHAR                DEFAULT NULL,
    p_modalidad modalidad_intercambio  DEFAULT NULL
)
RETURNS TABLE (
    id                UUID,
    titulo            VARCHAR,
    categoria         VARCHAR,
    modalidad         modalidad_intercambio,
    precio            DECIMAL,
    distancia_km      NUMERIC,
    publicador_nombre VARCHAR,
    latitud           FLOAT,
    longitud          FLOAT,
    imagen_principal  VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.titulo,
        p.categoria,
        p.modalidad,
        p.precio,
        ROUND(
            (ST_Distance(
                p.ubicacion,
                ST_SetSRID(ST_MakePoint(p_longitud, p_latitud), 4326)::GEOGRAPHY
            ) / 1000)::NUMERIC, 2
        )                                                          AS distancia_km,
        u.nombre                                                   AS publicador_nombre,
        ST_Y(p.ubicacion::GEOMETRY)::FLOAT                        AS latitud,
        ST_X(p.ubicacion::GEOMETRY)::FLOAT                        AS longitud,
        (
            SELECT img.url
            FROM imagenes_publicacion img
            WHERE img.publicacion_id = p.id AND img.es_principal = TRUE
            LIMIT 1
        )                                                          AS imagen_principal
    FROM publicaciones p
    JOIN usuarios u ON p.publicador_id = u.id
    WHERE
        p.estado = 'PUBLICADO'
        AND ST_DWithin(
            p.ubicacion,
            ST_SetSRID(ST_MakePoint(p_longitud, p_latitud), 4326)::GEOGRAPHY,
            p_radio_km * 1000           -- ST_DWithin con GEOGRAPHY trabaja en METROS
        )
        AND (p_categoria IS NULL OR p.categoria = p_categoria)
        AND (p_modalidad IS NULL OR p.modalidad = p_modalidad)
    ORDER BY distancia_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── Motor de matchmaking: artículo en mal estado → reparadores (RF-03.3) ─────
-- Uso: SELECT * FROM fn_matchmaking_reparadores(-20.9200, -101.3500, 'Smartphones y Tablets', 25);
CREATE OR REPLACE FUNCTION fn_matchmaking_reparadores(
    p_latitud   FLOAT,
    p_longitud  FLOAT,
    p_categoria VARCHAR,
    p_radio_km  FLOAT DEFAULT 20
)
RETURNS TABLE (
    reparador_id              UUID,
    nombre                    VARCHAR,
    nombre_taller             VARCHAR,
    especialidades            TEXT[],
    puntuacion                DECIMAL,
    reparaciones_documentadas INT,
    distancia_km              NUMERIC,
    latitud                   FLOAT,
    longitud                  FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id                                                        AS reparador_id,
        u.nombre,
        r.nombre_taller,
        r.especialidades,
        r.puntuacion,
        r.reparaciones_documentadas,
        ROUND(
            (ST_Distance(
                r.ubicacion,
                ST_SetSRID(ST_MakePoint(p_longitud, p_latitud), 4326)::GEOGRAPHY
            ) / 1000)::NUMERIC, 2
        )                                                           AS distancia_km,
        ST_Y(r.ubicacion::GEOMETRY)::FLOAT                         AS latitud,
        ST_X(r.ubicacion::GEOMETRY)::FLOAT                         AS longitud
    FROM perfiles_reparador r
    JOIN usuarios u ON r.usuario_id = u.id
    WHERE
        r.verificado  = TRUE
        AND u.activo  = TRUE
        AND p_categoria = ANY(r.especialidades)    -- filtro por especialidad
        AND ST_DWithin(
            r.ubicacion,
            ST_SetSRID(ST_MakePoint(p_longitud, p_latitud), 4326)::GEOGRAPHY,
            p_radio_km * 1000
        )
    ORDER BY distancia_km ASC, r.puntuacion DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 13. VISTAS
-- =============================================================================

-- ── Vista: publicaciones activas con datos del publicador ────────────────────
CREATE OR REPLACE VIEW v_publicaciones_activas AS
SELECT
    p.id,
    p.titulo,
    p.descripcion,
    p.categoria,
    p.modalidad,
    p.estado,
    p.precio,
    p.moneda,
    p.direccion_referencia,
    ST_Y(p.ubicacion::GEOMETRY)::FLOAT AS latitud,
    ST_X(p.ubicacion::GEOMETRY)::FLOAT AS longitud,
    u.id                               AS publicador_id,
    u.nombre                           AS publicador_nombre,
    u.rol                              AS publicador_rol,
    p.fecha_creacion,
    (SELECT COUNT(*)  FROM componentes c WHERE c.publicacion_id = p.id)                        AS total_componentes,
    (SELECT COUNT(*)  FROM componentes c WHERE c.publicacion_id = p.id AND c.funcional = TRUE) AS componentes_funcionales,
    (SELECT img.url   FROM imagenes_publicacion img WHERE img.publicacion_id = p.id AND img.es_principal = TRUE LIMIT 1) AS imagen_principal
FROM publicaciones p
JOIN usuarios u ON p.publicador_id = u.id
WHERE p.estado IN ('PUBLICADO', 'RESERVADO');

-- ── Vista: perfil público del reparador con puntuación en vivo ───────────────
CREATE OR REPLACE VIEW v_perfil_reparadores AS
SELECT
    u.id,
    u.nombre,
    u.activo,
    r.nombre_taller,
    r.descripcion_taller,
    r.especialidades,
    COALESCE(ROUND(AVG(c.puntuacion)::NUMERIC, 2), 0)::DECIMAL(3,2) AS puntuacion,
    COUNT(DISTINCT c.id)::INT                                         AS total_calificaciones,
    r.reparaciones_documentadas,
    r.verificado,
    ST_Y(r.ubicacion::GEOMETRY)::FLOAT AS latitud,
    ST_X(r.ubicacion::GEOMETRY)::FLOAT AS longitud
FROM usuarios u
JOIN perfiles_reparador r ON u.id = r.usuario_id
LEFT JOIN calificaciones c ON u.id = c.calificado_id
WHERE u.rol = 'REPARADOR_VERIFICADO' AND u.activo = TRUE
GROUP BY u.id, u.nombre, u.activo,
         r.nombre_taller, r.descripcion_taller, r.especialidades,
         r.reparaciones_documentadas, r.verificado, r.ubicacion;

-- ── Vista: historial de vida completo de un producto ─────────────────────────
CREATE OR REPLACE VIEW v_historial_producto AS
SELECT
    hp.publicacion_id,
    p.titulo                           AS producto,
    eh.id                              AS entrada_id,
    eh.tipo,
    eh.descripcion,
    eh.fecha,
    eh.piezas_reemplazadas,
    eh.estado_resultante,
    u.nombre                           AS reparador_nombre,
    r.nombre_taller
FROM historial_producto hp
JOIN publicaciones    p  ON hp.publicacion_id = p.id
JOIN entradas_historial eh ON eh.historial_id = hp.id
LEFT JOIN usuarios    u  ON eh.reparador_id  = u.id
LEFT JOIN perfiles_reparador r ON u.id = r.usuario_id
ORDER BY eh.fecha DESC;

-- =============================================================================
-- 14. DATOS INICIALES (seed)
-- =============================================================================

INSERT INTO categorias_articulo (nombre, descripcion, icono) VALUES
    ('Computadoras y Laptops',     'PCs de escritorio, laptops, all-in-ones y accesorios',    'laptop'),
    ('Smartphones y Tablets',      'Teléfonos celulares, tablets y sus accesorios',            'smartphone'),
    ('Componentes PC',             'Placas madre, RAM, GPU, CPU, fuentes de poder, gabinetes', 'cpu'),
    ('Electrodomésticos',          'Refrigeradores, lavadoras, microondas y similares',         'home'),
    ('Audio y Video',              'Bocinas, audífonos, televisores, proyectores',              'volume-2'),
    ('Cámaras y Fotografía',       'Cámaras digitales, lentes y accesorios',                   'camera'),
    ('Consolas y Videojuegos',     'Consolas, controles y videojuegos',                        'gamepad'),
    ('Redes y Conectividad',       'Routers, switches, cables, módems',                        'wifi'),
    ('Herramientas Electrónicas',  'Soldadores, multímetros, osciloscopios',                   'tool'),
    ('Impresoras y Escáneres',     'Impresoras, cartuchos y escáneres',                        'printer'),
    ('Antigüedades Tecnológicas',  'Equipos vintage y coleccionables tecnológicos',             'clock'),
    ('Otros',                      'Artículos que no encajan en otras categorías',              'package');
