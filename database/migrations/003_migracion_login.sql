-- ============================================================
-- MIGRACIÓN 003 — Actualizar usuarios: eliminar email, agregar campos
-- Ejecutar con: psql -U sandrakarenrq -d casaverde -f 003_migracion_login.sql
-- ============================================================

-- Paso 1: Agregar constraint UNIQUE a nombre (si no existe)
ALTER TABLE usuarios 
ADD CONSTRAINT usuarios_nombre_unique UNIQUE (nombre);

-- Paso 2: Agregar constraint UNIQUE a ci (si no existe)
ALTER TABLE usuarios 
ADD CONSTRAINT usuarios_ci_unique UNIQUE (ci);

-- Paso 3: Agregar columna force_password_change
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- Paso 4: Eliminar constraint UNIQUE de email
ALTER TABLE usuarios 
DROP CONSTRAINT IF EXISTS usuarios_email_key;

-- Paso 5: Eliminar columna email
ALTER TABLE usuarios 
DROP COLUMN IF EXISTS email;

-- Paso 6: Asegurar que el admin tenga force_password_change = false
UPDATE usuarios SET force_password_change = FALSE WHERE rol = 'admin';

-- Verificar la estructura final
-- \d usuarios
