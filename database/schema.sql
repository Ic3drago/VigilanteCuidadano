-- =====================================================================
-- VigilanteCiudadano - Complete Relational & Spatial Database Schema
-- Location: database/schema.sql
-- Role: Principal Software Architect & Cybersecurity Expert
-- Prefixed with 'vc_' to prevent conflicts with other projects.
-- =====================================================================

-- Enable extensions required for security and geospatial analysis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------
-- 1. CUSTOM TYPES / ENUMS
-- ---------------------------------------------------------------------
CREATE TYPE estado_turno AS ENUM ('EN_SERVICIO', 'FRANCO', 'SUSPENDIDO');
CREATE TYPE estado_disponibilidad AS ENUM ('LIBRE', 'EN_CAMINO', 'EN_INTERVENCION');
CREATE TYPE estado_tramite AS ENUM ('NUEVA', 'EN_PROCESO', 'RESUELTA', 'RECHAZADA');
CREATE TYPE nivel_riesgo AS ENUM ('ALTO', 'MEDIO', 'BAJO');
CREATE TYPE estado_dispositivo AS ENUM ('SEGURO', 'ROBADO');

-- ---------------------------------------------------------------------
-- 2. TABLES AND RELATIONS
-- ---------------------------------------------------------------------

-- Table: vc_usuarios
-- Represents citizens using the platform. Designed with Zero-Knowledge in mind
-- using an anonymous UUID to prevent linkability to physical identities.
CREATE TABLE vc_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid_anonimo TEXT UNIQUE NOT NULL,
    token_notificacion TEXT,
    reputacion_score INTEGER NOT NULL DEFAULT 100 CONSTRAINT check_reputacion CHECK (reputacion_score BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: vc_oficiales
-- Relational store for official police forces audited by the platform.
CREATE TABLE vc_oficiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_placa TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    rango TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: vc_turnos_servicio
-- Tracks service shifts. Employs PostGIS Geometry (Polygon) to define active quadrants.
CREATE TABLE vc_turnos_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oficial_id UUID NOT NULL REFERENCES vc_oficiales(id) ON DELETE CASCADE,
    hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    hora_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    estado_actual estado_turno NOT NULL DEFAULT 'EN_SERVICIO',
    cuadrante_asignado GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_horas CHECK (hora_inicio < hora_fin)
);

-- Table: vc_vehiculos_patrulla
-- Represents mobile units. Employs PostGIS Geometry (Point) for spatial tracking.
CREATE TABLE vc_vehiculos_patrulla (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa_vehiculo TEXT UNIQUE NOT NULL,
    ultima_ubicacion GEOMETRY(Point, 4326) NOT NULL,
    estado_disponibilidad estado_disponibilidad NOT NULL DEFAULT 'LIBRE',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: vc_denuncias
-- Core table storing incident reports. Text description is ENCRYPTED on the client-side
-- (Zero-Knowledge) before ingestion. Includes spatial metadata for heatmaps.
CREATE TABLE vc_denuncias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES vc_usuarios(id) ON DELETE SET NULL,
    tipo_incidente TEXT NOT NULL,
    descripcion_cifrada TEXT NOT NULL, -- Client-side AES-GCM Encrypted payload (contains IV and Salt)
    geo_latitud DECIMAL(10, 8) NOT NULL,
    geo_longitud DECIMAL(11, 8) NOT NULL,
    ubicacion_geom GEOMETRY(Point, 4326), -- PostGIS Point derived from coordinates
    hash_integridad TEXT NOT NULL, -- SHA-256 integrity hash of plain description
    estado_tramite estado_tramite NOT NULL DEFAULT 'NUEVA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: vc_despachos_auxilio
-- Dispatched patrol units responding to citizen emergencies.
CREATE TABLE vc_despachos_auxilio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    denuncia_id UUID NOT NULL REFERENCES vc_denuncias(id) ON DELETE CASCADE,
    patrulla_id UUID NOT NULL REFERENCES vc_vehiculos_patrulla(id) ON DELETE CASCADE,
    hora_despacho TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    hora_arribo_real TIMESTAMP WITH TIME ZONE
);

-- Table: vc_registro_dispositivos
-- Relational secure asset tracking for active user devices.
CREATE TABLE vc_registro_dispositivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES vc_usuarios(id) ON DELETE CASCADE,
    imei_cifrado TEXT NOT NULL, -- Client-side encrypted hardware ID
    marca_modelo TEXT NOT NULL,
    estado_dispositivo estado_dispositivo NOT NULL DEFAULT 'SEGURO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: vc_zonas_conflictivas
-- Hotspot polygons defined for heatmaps and risk prediction.
CREATE TABLE vc_zonas_conflictivas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poligono_zona GEOMETRY(Polygon, 4326) NOT NULL,
    nivel_riesgo nivel_riesgo NOT NULL,
    hora_pico_inicio TIME NOT NULL,
    hora_pico_fin TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 3. TRIGGERS FOR SPATIAL DATA INTEGRITY
-- ---------------------------------------------------------------------

-- Trigger to automatically synchronize `ubicacion_geom` ST_Point from lat/long fields
CREATE OR REPLACE FUNCTION trigger_sync_vc_denuncias_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ubicacion_geom := ST_SetSRID(ST_Point(NEW.geo_longitud, NEW.geo_latitud), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_vc_denuncias_geometry
BEFORE INSERT OR UPDATE OF geo_latitud, geo_longitud ON vc_denuncias
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_vc_denuncias_geometry();

-- ---------------------------------------------------------------------
-- 4. SPATIAL GEOMETRIC INDEXING (GiST)
-- ---------------------------------------------------------------------
CREATE INDEX idx_vc_turnos_cuadrante ON vc_turnos_servicio USING GIST (cuadrante_asignado);
CREATE INDEX idx_vc_vehiculos_ubicacion ON vc_vehiculos_patrulla USING GIST (ultima_ubicacion);
CREATE INDEX idx_vc_denuncias_geom ON vc_denuncias USING GIST (ubicacion_geom);
CREATE INDEX idx_vc_zonas_poligono ON vc_zonas_conflictivas USING GIST (poligono_zona);

-- Standard relational B-Tree indexing for performance critical FKs
CREATE INDEX idx_vc_turnos_oficial ON vc_turnos_servicio(oficial_id);
CREATE INDEX idx_vc_denuncias_usuario ON vc_denuncias(usuario_id);
CREATE INDEX idx_vc_despachos_denuncia ON vc_despachos_auxilio(denuncia_id);
CREATE INDEX idx_vc_despachos_patrulla ON vc_despachos_auxilio(patrulla_id);
CREATE INDEX idx_vc_dispositivos_usuario ON vc_registro_dispositivos(usuario_id);

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------

-- Enable Row Level Security on all critical tables
ALTER TABLE vc_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_oficiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_turnos_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_vehiculos_patrulla ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_denuncias ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_despachos_auxilio ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_registro_dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_zonas_conflictivas ENABLE ROW LEVEL SECURITY;

-- Denuncias RLS Policies:
-- 1. Citizens (anyone, including anonymous/unauthenticated) can strictly INSERT reports.
--    This ensures no one can read, update, or delete other people's anonymous reports.
CREATE POLICY "Ciudadanos: Solo insercion anonima" 
ON vc_denuncias 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 2. Authenticated personnel (officials and dispatchers) can read report metadata.
--    Since the description is AES-GCM encrypted, they can only view metadata (type, coordinates, hash).
CREATE POLICY "Oficiales: Lectura autorizada de denuncias" 
ON vc_denuncias 
FOR SELECT 
TO authenticated 
USING (true);

-- Vehiculos Patrulla RLS Policies:
-- 1. Anyone (citizens looking for help) can view patrol locations ONLY if they are active 'EN_CAMINO' (dispatched).
--    This prevents tracking of vehicles that are on secret routes, resting ('LIBRE'), or resolving sensitive actions.
CREATE POLICY "Ciudadanos: Ver patrullas asignadas en camino" 
ON vc_vehiculos_patrulla 
FOR SELECT 
TO public 
USING (estado_disponibilidad = 'EN_CAMINO');

-- 2. Authenticated personnel can read all patrol statuses and locations.
CREATE POLICY "Oficiales: Acceso total a flota" 
ON vc_vehiculos_patrulla 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
