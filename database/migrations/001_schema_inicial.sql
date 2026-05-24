-- ============================================================
-- MIGRACIÓN 001 — Schema inicial completo de Casa Verde
-- Ejecutar con: psql -U sandrakarenrq -d casaverde -f 001_schema_inicial.sql
-- ============================================================

-- Tabla de usuarios (admin + garzones)
CREATE TABLE IF NOT EXISTS usuarios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           VARCHAR(100) NOT NULL UNIQUE,
  apellido_paterno VARCHAR(100) NOT NULL DEFAULT '',
  apellido_materno VARCHAR(100),
  password_hash    VARCHAR(255) NOT NULL,
  celular          VARCHAR(20),
  celular_referencia VARCHAR(20),
  ci               VARCHAR(30) UNIQUE,
  rol              VARCHAR(10) NOT NULL DEFAULT 'garzon' CHECK (rol IN ('admin', 'garzon')),
  force_password_change BOOLEAN DEFAULT FALSE,
  activo           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso    TIMESTAMP
);

-- Tabla de personal artístico
CREATE TABLE IF NOT EXISTS personal (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_artistico VARCHAR(100) UNIQUE NOT NULL,
  celular          VARCHAR(30),
  activo           BOOLEAN DEFAULT TRUE,
  fecha_ingreso    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  precio          NUMERIC(10,2) NOT NULL,
  categoria       VARCHAR(50),
  stock_botellas  NUMERIC(10,2) DEFAULT 0,
  stock_medias    NUMERIC(10,2) DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garzon_id  UUID NOT NULL REFERENCES usuarios(id),
  total      NUMERIC(10,2) DEFAULT 0,
  fecha      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detalle de pedidos
CREATE TABLE IF NOT EXISTS pedido_detalle (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     INTEGER REFERENCES productos(id),
  producto_nombre VARCHAR(100),
  cantidad        INTEGER DEFAULT 1,
  precio          NUMERIC(10,2),
  modo            VARCHAR(20) DEFAULT 'Bar',
  fraccion        NUMERIC(4,2) DEFAULT 1,
  subtotal        NUMERIC(10,2)
);

-- Personal asignado por pedido-detalle
CREATE TABLE IF NOT EXISTS pedido_personal (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_detalle_id UUID NOT NULL REFERENCES pedido_detalle(id) ON DELETE CASCADE,
  personal_id       UUID NOT NULL REFERENCES personal(id),
  personal_nombre   VARCHAR(100),
  porcentaje        NUMERIC(5,2),
  monto             NUMERIC(10,2)
);

-- Servicios extras
CREATE TABLE IF NOT EXISTS servicios_extras (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id         UUID NOT NULL REFERENCES personal(id),
  garzon_id           UUID REFERENCES usuarios(id),
  tipo                VARCHAR(20),
  monto               NUMERIC(10,2),
  porcentaje_personal NUMERIC(5,2),
  monto_personal      NUMERIC(10,2),
  fecha               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  turno               VARCHAR(10)
);
