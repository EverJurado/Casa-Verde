-- ============================================================
-- RESET COMPLETO — borra todo y recrea desde cero
-- ADVERTENCIA: elimina todos los datos
-- Ejecutar con: psql -U sandrakarenrq -d casaverde -f reset.sql
-- ============================================================

DROP TABLE IF EXISTS servicios_extras   CASCADE;
DROP TABLE IF EXISTS pedido_personal     CASCADE;
DROP TABLE IF EXISTS pedido_detalle      CASCADE;
DROP TABLE IF EXISTS pedidos             CASCADE;
DROP TABLE IF EXISTS productos           CASCADE;
DROP TABLE IF EXISTS personal            CASCADE;
DROP TABLE IF EXISTS usuarios            CASCADE;

\i migrations/001_schema_inicial.sql
\i migrations/002_datos_prueba.sql
\i migrations/003_migracion_login.sql
