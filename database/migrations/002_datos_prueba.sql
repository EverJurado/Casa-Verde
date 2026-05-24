-- ============================================================
-- MIGRACIÓN 002 — Datos de prueba
-- Ejecutar con: psql -U sandrakarenrq -d casaverde -f 002_datos_prueba.sql
-- ============================================================

-- Admin (password: admin123)
-- Hash generado con: bcrypt.hash('admin123', 10)
INSERT INTO usuarios (nombre, apellido_paterno, password_hash, rol, force_password_change)
VALUES ('jefa', '', '$2a$10$9zST5WVnbJ/3Vl2mK8qoEuh7vEJMJp/L5QVK3CZzDx5qQVqhD3Tse', 'admin', false)
ON CONFLICT (nombre) DO NOTHING;

-- Garzones 
-- ci=1234567, password=1234567 (el CI)
INSERT INTO usuarios (nombre, apellido_paterno, ci, password_hash, celular, rol, force_password_change)
VALUES
  ('Pedro',  'Perez',  '1234567',
   '$2a$10$7xKx7KqVW3FZqF3qH9pZ.OJ5pX.qZ9K3Z9L9M9N9O9P9Q9R9S9T9', '70001111', 'garzon', true),
  ('Carlos', 'Lopez',  '7654321',
   '$2a$10$7xKx7KqVW3FZqF3qH9pZ.OJ5pX.qZ9K3Z9L9M9N9O9P9Q9R9S9T9', '70002222', 'garzon', true)
ON CONFLICT (nombre) DO NOTHING;

-- Personal artístico
INSERT INTO personal (nombre_artistico, celular) VALUES
  ('Luna',      '70011111'),
  ('Valentina', '70022222'),
  ('Sofía',     '70033333'),
  ('Isabella',  '70044444'),
  ('Camila',    '70055555')
ON CONFLICT (nombre_artistico) DO NOTHING;

-- Productos
INSERT INTO productos (nombre, precio, categoria, stock_botellas, stock_medias) VALUES
  ('Abuelo',  500.00, 'Licores', 10, 5),
  ('Solera',  450.00, 'Licores', 8,  3),
  ('Cerveza',  50.00, 'Cerveza', 24, 0)
ON CONFLICT DO NOTHING;
