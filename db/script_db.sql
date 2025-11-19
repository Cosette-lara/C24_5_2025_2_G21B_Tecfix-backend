BEGIN;

-- Eliminación de tablas existentes (en orden inverso de dependencia)
DROP TABLE IF EXISTS "Historial_Cambios" CASCADE;
DROP TABLE IF EXISTS "Fotos_Incidencia" CASCADE;
DROP TABLE IF EXISTS "Incidencias" CASCADE;
DROP TABLE IF EXISTS "Salones" CASCADE;          
DROP TABLE IF EXISTS "Pabellones" CASCADE;       
DROP TABLE IF EXISTS "Estados_Incidencia" CASCADE;
DROP TABLE IF EXISTS "Tipos_Incidencia" CASCADE;
DROP TABLE IF EXISTS "Usuarios" CASCADE;
DROP TABLE IF EXISTS "Roles" CASCADE;

--Creación de Tablas Catálogo (Lookups)

CREATE TABLE "Roles" (
    "id_rol" SERIAL PRIMARY KEY,
    "nombre_rol" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "Tipos_Incidencia" (
    "id_tipo" SERIAL PRIMARY KEY,
    "nombre_tipo" VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE "Estados_Incidencia" (
    "id_estado" SERIAL PRIMARY KEY,
    "nombre_estado" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "Pabellones" (
    "id_pabellon" SERIAL PRIMARY KEY,
    "nombre_pabellon" VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE "Salones" (
    "id_salon" SERIAL PRIMARY KEY,
    "id_pabellon" INT NOT NULL,
    "nombre_salon" VARCHAR(100) NOT NULL, 
    
    CONSTRAINT "fk_salon_pabellon"
        FOREIGN KEY("id_pabellon")
        REFERENCES "Pabellones"("id_pabellon")
        ON DELETE CASCADE,
    
    UNIQUE("id_pabellon", "nombre_salon")

--Creación de Tablas de Entidad

CREATE TABLE "Usuarios" (
    "id_usuario" SERIAL PRIMARY KEY,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "id_rol" INT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_usuario_rol"
        FOREIGN KEY("id_rol")
        REFERENCES "Roles"("id_rol")
        ON DELETE RESTRICT
);

CREATE TABLE "Incidencias" (
    "id_incidencia" SERIAL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "id_salon" INT NOT NULL,           
    "urgencia" VARCHAR(20) NOT NULL CHECK ("urgencia" IN ('Baja', 'Media', 'Alta', 'Crítica')),
    "fecha_creacion" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMPTZ,

    "horas_hombre" DECIMAL(5, 2), 

    -- Claves Foráneas
    "id_usuario_reporta" INT NOT NULL,
    "id_tecnico_asignado" INT,
    "id_supervisor_valida" INT,
    "id_tipo" INT NOT NULL,
    "id_estado" INT NOT NULL,

    -- Restricciones de Integridad Referencial
    CONSTRAINT "fk_incidencia_salon"  
        FOREIGN KEY("id_salon")
        REFERENCES "Salones"("id_salon")
        ON DELETE RESTRICT,

    CONSTRAINT "fk_incidencia_usuario_reporta"
        FOREIGN KEY("id_usuario_reporta")
        REFERENCES "Usuarios"("id_usuario")
        ON DELETE RESTRICT,

    CONSTRAINT "fk_incidencia_tecnico_asignado"
        FOREIGN KEY("id_tecnico_asignado")
        REFERENCES "Usuarios"("id_usuario")
        ON DELETE SET NULL,

    CONSTRAINT "fk_incidencia_supervisor_valida"
        FOREIGN KEY("id_supervisor_valida")
        REFERENCES "Usuarios"("id_usuario")
        ON DELETE SET NULL,

    CONSTRAINT "fk_incidencia_tipo"
        FOREIGN KEY("id_tipo")
        REFERENCES "Tipos_Incidencia"("id_tipo")
        ON DELETE RESTRICT,

    CONSTRAINT "fk_incidencia_estado"
        FOREIGN KEY("id_estado")
        REFERENCES "Estados_Incidencia"("id_estado")
        ON DELETE RESTRICT
);

CREATE TABLE "Fotos_Incidencia" (
    "id_foto" SERIAL PRIMARY KEY,
    "id_incidencia" INT NOT NULL,
    "url_foto" VARCHAR(255) NOT NULL,
    "fecha_subida" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_foto_incidencia"
        FOREIGN KEY("id_incidencia")
        REFERENCES "Incidencias"("id_incidencia")
        ON DELETE CASCADE
);

CREATE TABLE "Historial_Cambios" (
    "id_historial" SERIAL PRIMARY KEY,
    "id_incidencia" INT NOT NULL,
    "id_usuario_actor" INT NOT NULL,
    "fecha_cambio" TIMESTAMTz DEFAULT CURRENT_TIMESTAMP,
    "descripcion_cambio" TEXT NOT NULL,
    
    CONSTRAINT "fk_historial_incidencia"
        FOREIGN KEY("id_incidencia")
        REFERENCES "Incidencias"("id_incidencia")
        ON DELETE CASCADE,
        
    CONSTRAINT "fk_historial_usuario"
        FOREIGN KEY("id_usuario_actor")
        REFERENCES "Usuarios"("id_usuario")
        ON DELETE SET NULL
);



INSERT INTO "Roles" ("nombre_rol") VALUES
('Supervisor'), 
('Técnico'),   
('Usuario');     

INSERT INTO "Tipos_Incidencia" ("nombre_tipo") VALUES
('Eléctrico'),
('Infraestructura'),
('Sanitario'),
('Equipamiento de Taller'),
('Sistemas');

INSERT INTO "Estados_Incidencia" ("nombre_estado") VALUES
('Pendiente de Asignación'),       
('Asignado'),                      
('En Progreso'),                   
('Resuelto (Pendiente de Validación)'), 
('Validado y Cerrado'),            
('Rechazado');                    


INSERT INTO "Pabellones" ("nombre_pabellon") VALUES
('Pabellón 1'),  
('Pabellón 2'),  
('Pabellón 3'),  
('Pabellón 4'),  
('Pabellón 6.a'),
('Pabellón 6.b'),
('Pabellón 7'),  
('Pabellón 8'),  
('Pabellón 9'),  
('Pabellón 10'), 
('Pabellón 11'), 
('Pabellón 12'), 
('Pabellón 14'), 
('PAB. 14a'),    
('PAB. 14b'),    
('PAB. 14c'),    
('PAB. 14d'),    
('Pabellón 16'), 
('FAB LAB'),     
('Polideportivo'),
('Biblioteca'),  
('Auditorio'),   
('Estacionamiento'), 
('Áreas Comunes');

INSERT INTO "Salones" ("id_pabellon", "nombre_salon") VALUES
(1, 'Aula 101'),
(1, 'Aula 102'),
(2, 'Aula 201'),
(2, 'Laboratorio 202'),
(4, 'Aula 401'),
(4, 'Aula 402'),
(4, '4B-01'), 
(4, '4B-02'),
(4, '4B-03'),
(4, '4B-04'),
(4, '4B-05'),
(5, 'Aula 6A-101'),
(6, 'Aula 6B-101'), 
(13, 'Oficina 14-01'), 
(14, 'Taller 14a'), 
(15, 'Taller 14b'), 
(19, 'Área Impresión 3D'), 
(20, 'Cancha Principal'), 
(21, 'Sala de Lectura Principal'), 
(22, 'Sala Principal'), 
(24, 'Patio Central'); 

CREATE INDEX "idx_usuarios_email" ON "Usuarios"("email");
CREATE INDEX "idx_incidencias_estado" ON "Incidencias"("id_estado");
CREATE INDEX "idx_incidencias_tecnico" ON "Incidencias"("id_tecnico_asignado");
CREATE INDEX "idx_incidencias_usuario_reporta" ON "Incidencias"("id_usuario_reporta");
CREATE INDEX "idx_incidencias_salon" ON "Incidencias"("id_salon"); 
CREATE INDEX "idx_fotos_incidencia" ON "Fotos_Incidencia"("id_incidencia");
CREATE INDEX "idx_historial_incidencia" ON "Historial_Cambios"("id_incidencia");
CREATE INDEX "idx_salones_pabellon" ON "Salones"("id_pabellon"); 

COMMIT;