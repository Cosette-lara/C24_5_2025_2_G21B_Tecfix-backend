BEGIN;

-- 1. LIMPIEZA DE TABLAS (Ordenado para evitar errores de llaves foráneas)
DROP TABLE IF EXISTS "Historial_Cambios" CASCADE;
DROP TABLE IF EXISTS "Fotos_Incidencia" CASCADE;
DROP TABLE IF EXISTS "Incidencias" CASCADE;
DROP TABLE IF EXISTS "Activos" CASCADE;
DROP TABLE IF EXISTS "Salones" CASCADE;
DROP TABLE IF EXISTS "Pabellones" CASCADE;
DROP TABLE IF EXISTS "Categorias_Activo" CASCADE;
DROP TABLE IF EXISTS "Tipos_Incidencia" CASCADE;
DROP TABLE IF EXISTS "Estados_Incidencia" CASCADE;
DROP TABLE IF EXISTS "Usuarios" CASCADE;
DROP TABLE IF EXISTS "Roles" CASCADE;

-- ============================================================
-- 2. DEFINICIÓN DE TABLAS (DDL)
-- ============================================================

-- A. SEGURIDAD Y ACCESO
CREATE TABLE "Roles" (
    "id_rol" SERIAL PRIMARY KEY,
    "nombre_rol" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "Usuarios" (
    "id_usuario" SERIAL PRIMARY KEY,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "id_rol" INT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "estado" BOOLEAN DEFAULT TRUE, -- Activo/Inactivo
    CONSTRAINT "fk_usuario_rol" FOREIGN KEY("id_rol") REFERENCES "Roles"("id_rol")
);

-- B. INFRAESTRUCTURA (UBICACIÓN)
CREATE TABLE "Pabellones" (
    "id_pabellon" SERIAL PRIMARY KEY,
    "nombre_pabellon" VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE "Salones" (
    "id_salon" SERIAL PRIMARY KEY,
    "id_pabellon" INT NOT NULL,
    "nombre_salon" VARCHAR(100) NOT NULL,
    CONSTRAINT "fk_salon_pabellon" FOREIGN KEY("id_pabellon") 
    REFERENCES "Pabellones"("id_pabellon") ON DELETE CASCADE
);

-- C. ACTIVOS (OBJETOS DE MANTENIMIENTO)
CREATE TABLE "Categorias_Activo" (
    "id_categoria" SERIAL PRIMARY KEY,
    "nombre_categoria" VARCHAR(50) NOT NULL UNIQUE,
    "area_responsable" VARCHAR(50) NOT NULL CHECK ("area_responsable" IN ('TI', 'INFRAESTRUCTURA'))
);

CREATE TABLE "Activos" (
    "id_activo" SERIAL PRIMARY KEY,
    "codigo_patrimonial" VARCHAR(50) UNIQUE NOT NULL, 
    "nombre_activo" VARCHAR(100) NOT NULL,
    "id_categoria" INT NOT NULL,
    "id_salon" INT NOT NULL,
    "estado_activo" VARCHAR(20) DEFAULT 'Operativo',
    "fecha_registro" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_activo_categoria" FOREIGN KEY ("id_categoria") REFERENCES "Categorias_Activo"("id_categoria"),
    CONSTRAINT "fk_activo_salon" FOREIGN KEY ("id_salon") REFERENCES "Salones"("id_salon")
);

-- D. FLUJO DE INCIDENCIAS
CREATE TABLE "Estados_Incidencia" (
    "id_estado" SERIAL PRIMARY KEY,
    "nombre_estado" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "Tipos_Incidencia" ( -- Detalle técnico de la falla
    "id_tipo" SERIAL PRIMARY KEY,
    "nombre_tipo" VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE "Incidencias" (
    "id_incidencia" SERIAL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "urgencia" VARCHAR(20) NOT NULL CHECK ("urgencia" IN ('Baja', 'Media', 'Alta', 'Crítica')),
    "fecha_creacion" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMPTZ,
    
    -- Métricas
    "horas_hombre" DECIMAL(5, 2) DEFAULT 0, 

    -- Ubicación y Objeto
    "id_salon" INT NOT NULL,               
    "id_activo" INT, -- Puede ser NULL si es un problema general del salón (ej. piso sucio)
    
    -- Actores
    "id_usuario_reporta" INT NOT NULL,
    "id_tecnico_asignado" INT, -- Puede ser NULL (Estado Pendiente/Cola)
    "id_supervisor_valida" INT,
    
    -- Clasificación
    "id_tipo" INT NOT NULL, -- Tipo de falla
    "id_estado" INT NOT NULL,

    CONSTRAINT "fk_incidencia_salon" FOREIGN KEY("id_salon") REFERENCES "Salones"("id_salon"),
    CONSTRAINT "fk_incidencia_activo" FOREIGN KEY("id_activo") REFERENCES "Activos"("id_activo"),
    CONSTRAINT "fk_incidencia_usuario" FOREIGN KEY("id_usuario_reporta") REFERENCES "Usuarios"("id_usuario"),
    CONSTRAINT "fk_incidencia_tecnico" FOREIGN KEY("id_tecnico_asignado") REFERENCES "Usuarios"("id_usuario"),
    CONSTRAINT "fk_incidencia_tipo" FOREIGN KEY("id_tipo") REFERENCES "Tipos_Incidencia"("id_tipo"),
    CONSTRAINT "fk_incidencia_estado" FOREIGN KEY("id_estado") REFERENCES "Estados_Incidencia"("id_estado")
);

-- E. EVIDENCIA Y AUDITORÍA
CREATE TABLE "Fotos_Incidencia" (
    "id_foto" SERIAL PRIMARY KEY,
    "id_incidencia" INT NOT NULL,
    "url_foto" VARCHAR(255) NOT NULL,
    "tipo_foto" VARCHAR(20) CHECK ("tipo_foto" IN ('CODIGO', 'AVERIA', 'SOLUCION')), -- Para diferenciar fotos
    "fecha_subida" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_foto_incidencia" FOREIGN KEY("id_incidencia") REFERENCES "Incidencias"("id_incidencia") ON DELETE CASCADE
);

CREATE TABLE "Historial_Cambios" (
    "id_historial" SERIAL PRIMARY KEY,
    "id_incidencia" INT NOT NULL,
    "id_usuario_actor" INT NOT NULL,
    "fecha_cambio" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "descripcion_cambio" TEXT NOT NULL,
    
    CONSTRAINT "fk_hist_incidencia" FOREIGN KEY("id_incidencia") REFERENCES "Incidencias"("id_incidencia") ON DELETE CASCADE
);

-- ============================================================
-- 3. CARGA DE DATOS MAESTROS (NECESARIOS PARA QUE EL SISTEMA FUNCIONE)
-- ============================================================

-- Roles de Usuario
INSERT INTO "Roles" ("nombre_rol") VALUES 
('Supervisor'), 
('Técnico'), 
('Usuario');

-- Estados del Flujo
INSERT INTO "Estados_Incidencia" ("nombre_estado") VALUES 
('Pendiente'), 
('En Progreso'), 
('Resuelto (Por Validar)'), 
('Cerrado'), 
('Rechazado');

-- Tipos de Incidencia Generales
INSERT INTO "Tipos_Incidencia" ("nombre_tipo") VALUES 
('Falla de Hardware (PC/Componentes)'), 
('Falla de Software/Red'), 
('Falla Eléctrica/Iluminación'), 
('Falla de Climatización (AC)'), 
('Mobiliario Dañado'),
('Infraestructura (Paredes/Pisos/Puertas)');

-- Categorías de Activo (Con asignación de Área para auto-enrutamiento)
INSERT INTO "Categorias_Activo" ("nombre_categoria", "area_responsable") VALUES 
('Equipo de Cómputo', 'TI'), 
('Proyector/Multimedia', 'TI'), 
('Redes y Conectividad', 'TI'),
('Aire Acondicionado', 'INFRAESTRUCTURA'), 
('Mobiliario', 'INFRAESTRUCTURA'),
('Instalaciones Eléctricas', 'INFRAESTRUCTURA'),
('Sanitarios', 'INFRAESTRUCTURA');

-- Pabellones (Infraestructura Real TECSUP)
INSERT INTO "Pabellones" ("nombre_pabellon") VALUES 
('Pabellón 1'), ('Pabellón 2'), ('Pabellón 4'), ('Pabellón 5'), 
('Pabellón 6'), ('Pabellón 7'), ('Pabellón 8'), ('Pabellón 9'), 
('Pabellón 11'), ('Pabellón 16'), 
('Módulo A'), ('Módulo B'), ('Módulo C'), ('Módulo D');

-- Salones (Carga Base de tu investigación - Sin esto la app no tiene ubicaciones)
INSERT INTO "Salones" ("id_pabellon", "nombre_salon") VALUES 
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 1'), 'Oficinas Administrativas'),
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 2'), 'Biblioteca'),
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 5'), 'Auditorio'),
-- Pabellón 4
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 4'), 'Lab 401'),
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 4'), 'Lab 404'),
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 4'), 'Aula 402'),
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 4'), 'Oficina Soporte TI'),
-- Pabellón 7
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 7'), 'Lab 701'),
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 7'), 'Lab 705'),
-- Pabellón 8
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 8'), 'Lab 810'),
((SELECT "id_pabellon" FROM "Pabellones" WHERE "nombre_pabellon" = 'Pabellón 8'), 'Aula 813');

COMMIT;