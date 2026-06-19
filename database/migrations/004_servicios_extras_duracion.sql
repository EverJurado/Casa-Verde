-- Agrega control de duración para salidas/propinas en servicios extras.
ALTER TABLE servicios_extras
  ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hora_fin TIMESTAMP;

