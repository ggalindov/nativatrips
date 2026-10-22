-- Catalogo inicial de Eco Palacio: los 13 senderos del portal.
-- Repetible: solo inserta los senderos que falten por nombre y nunca pisa lo que el administrador
-- haya editado. Sector, desnivel, altitud, tarifa, requisitos y textos vienen del prototipo y se
-- validan con el operador. Las pruebas no la cargan (spring.flyway.locations).

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'La Paila', 'Paseo corto y accesible hacia una hermosa caldera natural con aguas termales y rica vegetación de piedemonte andino.', 'FACIL', 60, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Chaqueta impermeable, ropa abrigada, calzado con agarre y al menos 1,5 litros de agua.',
       120000, 1.8, 60, 3080, 'Sector La Paila', '09:30', 'Estación de Guardaparques La Paila', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'La Paila');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Sendero señalizado corto' FROM senderos WHERE nombre = 'La Paila'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Zonas de descanso' FROM senderos WHERE nombre = 'La Paila'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Accesible para movilidad reducida' FROM senderos WHERE nombre = 'La Paila'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'Laguna Seca', 'Sendero interpretativo suave rodeando la cuenca de la antigua laguna glacial, con abundante presencia de fauna silvestre y turberas.', 'FACIL', 120, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Chaqueta impermeable, ropa abrigada, calzado con agarre y al menos 1,5 litros de agua.',
       135000, 3.5, 120, 3150, 'Sector Piedras Gordas', '09:00', 'Piedras Gordas Entrada Sur', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'Laguna Seca');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Turberas altoandinas' FROM senderos WHERE nombre = 'Laguna Seca'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Sendero plano y seguro' FROM senderos WHERE nombre = 'Laguna Seca'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Apto para todas las edades' FROM senderos WHERE nombre = 'Laguna Seca'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'La Arboleda', 'Ideal para familias y principiantes. Atraviesa hermosos bosques andinos de niebla repletos de orquídeas, bromelias y musgos milenarios.', 'FACIL', 150, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Chaqueta impermeable, ropa abrigada, calzado con agarre y al menos 1,5 litros de agua.',
       145000, 4.2, 180, 3200, 'Sector Piedras Gordas', '08:30', 'Puesto de Control Piedras Gordas', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'La Arboleda');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Bosque andino relicto' FROM senderos WHERE nombre = 'La Arboleda'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Senderos de baja pendiente' FROM senderos WHERE nombre = 'La Arboleda'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Observación botánica y orquídeas' FROM senderos WHERE nombre = 'La Arboleda'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'El Retiro', 'Un retiro de paz y silencio a menos de 90 minutos de Bogotá, perfecto para reconectar con el aire puro y la tranquilidad del páramo.', 'FACIL', 180, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Chaqueta impermeable, ropa abrigada, calzado con agarre y al menos 1,5 litros de agua.',
       150000, 5.5, 210, 3250, 'Sector La Calera', '08:30', 'Entrada Sector La Calera', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'El Retiro');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Cercanía a Bogotá' FROM senderos WHERE nombre = 'El Retiro'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Zonas de descanso y meditación' FROM senderos WHERE nombre = 'El Retiro'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Bosque de encenillos' FROM senderos WHERE nombre = 'El Retiro'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'Bosque de Niebla', 'Inmersión en el bosque nublado donde la condensación crea un microclima de musgos colgantes, helechos arborescentes y aves multicolores.', 'MODERADO', 180, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Chaqueta impermeable, polar o chaqueta térmica, botas con agarre, guantes, gorro y al menos 1,5 litros de agua. Condición física básica.',
       160000, 5.5, 310, 3300, 'Sector Monterredondo', '08:00', 'Km 22 Vía Monterredondo', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'Bosque de Niebla');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Helechos arborescentes gigantes' FROM senderos WHERE nombre = 'Bosque de Niebla'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Bosque nuboso primario' FROM senderos WHERE nombre = 'Bosque de Niebla'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Fotografía de naturaleza' FROM senderos WHERE nombre = 'Bosque de Niebla'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'Monterredondo', 'Ruta circular emblemática que rodea el antiguo centro de operaciones del parque con miradores hacia el embalse de Chuza y la cordillera.', 'MODERADO', 210, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Chaqueta impermeable, polar o chaqueta térmica, botas con agarre, guantes, gorro y al menos 1,5 litros de agua. Condición física básica.',
       165000, 7, 360, 3380, 'Sector Monterredondo', '08:00', 'Centro Administrativo Monterredondo', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'Monterredondo');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Vista panorámica Embalse de Chuza' FROM senderos WHERE nombre = 'Monterredondo'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Puntos de avistamiento de venados' FROM senderos WHERE nombre = 'Monterredondo'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Historia de la conservación' FROM senderos WHERE nombre = 'Monterredondo'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'Suasie', 'Travesía fascinante por el valle de los frailejones gigantes y senderos de herradura históricos, con vistas panorámicas a los cañones orientales.', 'MODERADO', 240, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Chaqueta impermeable, polar o chaqueta térmica, botas con agarre, guantes, gorro y al menos 1,5 litros de agua. Condición física básica.',
       175000, 8.5, 420, 3450, 'Sector Monterredondo', '07:30', 'Centro de Visitantes Monterredondo', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'Suasie');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Valle de frailejones gigantes' FROM senderos WHERE nombre = 'Suasie'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Cruce de quebradas cristalinas' FROM senderos WHERE nombre = 'Suasie'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Senderos coloniales' FROM senderos WHERE nombre = 'Suasie'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'Río La Playa', 'Acompaña el cauce cristalino del Río La Playa entre cañones rocosos y valles de vegetación exuberante adaptada a corrientes frías.', 'MODERADO', 240, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Chaqueta impermeable, polar o chaqueta térmica, botas con agarre, guantes, gorro y al menos 1,5 litros de agua. Condición física básica.',
       165000, 8, 380, 3320, 'Sector Guasca', '07:30', 'Puente Guasca Km 18', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'Río La Playa');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Riberas de aguas glaciares' FROM senderos WHERE nombre = 'Río La Playa'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Pozos naturales cristalinos' FROM senderos WHERE nombre = 'Río La Playa'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Puentes de madera rústicos' FROM senderos WHERE nombre = 'Río La Playa'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'Los Cáquezas', 'Caminata por la vertiente oriental hacia el llano, donde el páramo transiciona a densos bosques de niebla con cascadas prístinas.', 'MODERADO', 270, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Chaqueta impermeable, polar o chaqueta térmica, botas con agarre, guantes, gorro y al menos 1,5 litros de agua. Condición física básica.',
       180000, 9.2, 490, 3520, 'Sector San Juanito', '07:00', 'Casas de Guardaparques San Juanito', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'Los Cáquezas');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Cascadas naturales' FROM senderos WHERE nombre = 'Los Cáquezas'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Vertiente oriental andina' FROM senderos WHERE nombre = 'Los Cáquezas'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Comunidad campesina local' FROM senderos WHERE nombre = 'Los Cáquezas'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'Lagunas de Siecha', 'Recorre el camino ancestral muisca hasta las tres lagunas sagradas de Siecha, rodeadas de frailejones centenarios y paisajes de páramo a más de 3.500 metros de altitud. Una experiencia de conexión profunda con la naturaleza.', 'MODERADO', 300, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Chaqueta impermeable, polar o chaqueta térmica, botas con agarre, guantes, gorro y al menos 1,5 litros de agua. Condición física básica.',
       185000, 10, 580, 3680, 'Sector Siecha', '07:00', 'Parqueadero Monterredondo, Sector Siecha', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'Lagunas de Siecha');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Lagunas sagradas muiscas' FROM senderos WHERE nombre = 'Lagunas de Siecha'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Bosque de frailejones' FROM senderos WHERE nombre = 'Lagunas de Siecha'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Mirador de alta montaña' FROM senderos WHERE nombre = 'Lagunas de Siecha'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 3, 'Avistamiento de aves de páramo' FROM senderos WHERE nombre = 'Lagunas de Siecha'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'Piedras Gordas', 'Caminata entre colosales formaciones rocosas esculpidas por antiguos glaciares andinos, con pasos técnicos de montaña.', 'DIFICIL', 330, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Botas de montaña, chaqueta impermeable, ropa térmica, guantes, gorro, bastones y al menos 2 litros de agua. Buena condición física y experiencia previa en caminatas largas.',
       195000, 11, 640, 3620, 'Sector Piedras Gordas', '07:00', 'Refugio Piedras Gordas', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'Piedras Gordas');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Laberintos rocosos megalíticos' FROM senderos WHERE nombre = 'Piedras Gordas'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Formaciones de arenisca' FROM senderos WHERE nombre = 'Piedras Gordas'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Flora xerofítica de páramo' FROM senderos WHERE nombre = 'Piedras Gordas'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'Cuchilla el Zaque', 'Ascenso de alta exigencia física por crestas escarpadas con vientos de alta montaña y una visión de 360 grados de los valles interandinos.', 'EXIGENTE', 360, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Botas de montaña, chaqueta impermeable, ropa térmica, guantes, gorro, bastones, comida para la jornada y al menos 2 litros de agua. Muy buena condición física y experiencia en alta montaña.',
       210000, 13.5, 720, 3820, 'Sector Siecha', '06:30', 'Puesto de Control Siecha', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'Cuchilla el Zaque');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Cresta panorámica El Zaque' FROM senderos WHERE nombre = 'Cuchilla el Zaque'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Formaciones geológicas milenarias' FROM senderos WHERE nombre = 'Cuchilla el Zaque'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Desafío físico andino' FROM senderos WHERE nombre = 'Cuchilla el Zaque'
ON CONFLICT DO NOTHING;

INSERT INTO senderos (nombre, descripcion, nivel_dificultad, duracion_minutos, tipo_experiencia, requisitos_ingreso,
                      precio, distancia_km, desnivel_m, altitud_max_m, sector, hora_salida, punto_encuentro, publicado)
SELECT 'Chorreras', 'Gran expedición de resistencia cruzando caídas de agua monumentales y senderos ancestrales que conectan el altiplano con los valles calientes.', 'EXIGENTE', 480, 'ECOTURISMO',
       'Documento de identidad o pasaporte y código de la reserva. Botas de montaña, chaqueta impermeable, ropa térmica, guantes, gorro, bastones, comida para la jornada y al menos 2 litros de agua. Muy buena condición física y experiencia en alta montaña.',
       225000, 16, 950, 3700, 'Sector Choachí', '06:30', 'Parador Choachí La Palma', TRUE
WHERE NOT EXISTS (SELECT 1 FROM senderos WHERE nombre = 'Chorreras');
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 0, 'Cascadas de más de 80m' FROM senderos WHERE nombre = 'Chorreras'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 1, 'Gran exigencia física' FROM senderos WHERE nombre = 'Chorreras'
ON CONFLICT DO NOTHING;
INSERT INTO sendero_destacados (sendero_id, orden, texto)
SELECT id, 2, 'Paisajes contrastantes' FROM senderos WHERE nombre = 'Chorreras'
ON CONFLICT DO NOTHING;
