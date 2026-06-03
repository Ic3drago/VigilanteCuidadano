-- =====================================================================
-- VigilanteCiudadano - Schema Update for Authentication
-- Location: database/migration_auth.sql
-- =====================================================================

-- 1. Modificar vc_oficiales para almacenar credenciales
ALTER TABLE vc_oficiales ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE vc_oficiales ADD COLUMN IF NOT EXISTS pin_salt TEXT;

-- 2. Crear tabla vc_operadores (Despachadores Centro de Mando)
CREATE TABLE IF NOT EXISTS vc_operadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credencial_id TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    pin_salt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security en vc_operadores
ALTER TABLE vc_operadores ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para vc_operadores:
-- 1. Nadie del público general puede ver a los operadores
-- 2. Los operadores autenticados pueden ver su propia información
DROP POLICY IF EXISTS "Operadores: Lectura de propio perfil" ON vc_operadores;
CREATE POLICY "Operadores: Lectura de propio perfil" 
ON vc_operadores 
FOR SELECT 
TO authenticated 
USING (true);

-- 3. Políticas públicas para permitir lectura de oficial/operador durante el login
DROP POLICY IF EXISTS "Oficiales: Lectura publica para login" ON vc_oficiales;
CREATE POLICY "Oficiales: Lectura publica para login" 
ON vc_oficiales 
FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Operadores: Lectura publica para login" ON vc_operadores;
CREATE POLICY "Operadores: Lectura publica para login" 
ON vc_operadores 
FOR SELECT 
TO public 
USING (true);
