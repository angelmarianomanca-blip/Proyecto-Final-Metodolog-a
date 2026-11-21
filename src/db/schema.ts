import {
  sqliteTable,
  integer,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// 1. roles
export const roles = sqliteTable('roles', {
  idRol: integer('id_rol').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull().unique(),
  descripcion: text('descripcion').notNull().default(''),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
});

// 2. congregaciones
export const congregaciones = sqliteTable('congregaciones', {
  idCongregacion: integer('id_congregacion').primaryKey({ autoIncrement: true }),
  nombreSede: text('nombre_sede').notNull().unique(),
  direccion: text('direccion').notNull(),
  ciudad: text('ciudad').notNull(),
  telefonoContacto: text('telefono_contacto').notNull(),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
});

// 3. usuarios
export const usuarios = sqliteTable('usuarios', {
  idUsuario: integer('id_usuario').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  apellido: text('apellido').notNull(),
  correoElectronico: text('correo_electronico').notNull().unique(),
  contraseniaHash: text('contrasenia_hash').notNull(),
  idRol: integer('id_rol')
    .notNull()
    .references(() => roles.idRol),
  idCongregacion: integer('id_congregacion').references(
    () => congregaciones.idCongregacion
  ),
  fechaRegistro: text('fecha_registro').notNull(),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
});

// 4. tokens_recuperacion
export const tokensRecuperacion = sqliteTable('tokens_recuperacion', {
  idToken: integer('id_token').primaryKey({ autoIncrement: true }),
  idUsuario: integer('id_usuario')
    .notNull()
    .references(() => usuarios.idUsuario),
  tokenHash: text('token_hash').notNull(),
  fechaExpiracion: text('fecha_expiracion').notNull(),
  usado: integer('usado', { mode: 'boolean' }).notNull().default(false),
});

// 5. cursos
export const cursos = sqliteTable('cursos', {
  idCurso: integer('id_curso').primaryKey({ autoIncrement: true }),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion').notNull(),
  estado: text('estado').notNull().default('borrador'),
  fechaCreacion: text('fecha_creacion').notNull(),
  idProfesor: integer('id_profesor')
    .notNull()
    .references(() => usuarios.idUsuario),
});

// 6. modulos
export const modulos = sqliteTable('modulos', {
  idModulo: integer('id_modulo').primaryKey({ autoIncrement: true }),
  idCurso: integer('id_curso')
    .notNull()
    .references(() => cursos.idCurso),
  titulo: text('titulo').notNull(),
  ordenSecuencia: integer('orden_secuencia').notNull().default(1),
});

// 7. lecciones
export const lecciones = sqliteTable('lecciones', {
  idLeccion: integer('id_leccion').primaryKey({ autoIncrement: true }),
  idModulo: integer('id_modulo')
    .notNull()
    .references(() => modulos.idModulo),
  titulo: text('titulo').notNull(),
  ordenSecuencia: integer('orden_secuencia').notNull().default(1),
  contenidoTexto: text('contenido_texto').notNull().default(''),
  enlaceVideo: text('enlace_video'),
  archivoPdf: text('archivo_pdf'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
});

// 8. inscripciones
export const inscripciones = sqliteTable(
  'inscripciones',
  {
    idInscripcion: integer('id_inscripcion').primaryKey({ autoIncrement: true }),
    idUsuario: integer('id_usuario')
      .notNull()
      .references(() => usuarios.idUsuario),
    idCurso: integer('id_curso')
      .notNull()
      .references(() => cursos.idCurso),
    estado: text('estado').notNull().default('en_curso'),
    fechaInscripcion: text('fecha_inscripcion').notNull(),
    fechaFinalizacion: text('fecha_finalizacion'),
    codigoCertificado: text('codigo_certificado').unique(),
  },
  (table) => [
    uniqueIndex('inscripciones_usuario_curso_uq').on(
      table.idUsuario,
      table.idCurso
    ),
  ]
);

// 9. progreso_lecciones
export const progresoLecciones = sqliteTable(
  'progreso_lecciones',
  {
    idProgreso: integer('id_progreso').primaryKey({ autoIncrement: true }),
    idInscripcion: integer('id_inscripcion')
      .notNull()
      .references(() => inscripciones.idInscripcion),
    idLeccion: integer('id_leccion')
      .notNull()
      .references(() => lecciones.idLeccion),
    completada: integer('completada', { mode: 'boolean' })
      .notNull()
      .default(false),
    segundoActual: integer('segundo_actual').notNull().default(0),
    fechaCompletado: text('fecha_completado'),
  },
  (table) => [
    uniqueIndex('progreso_inscripcion_leccion_uq').on(
      table.idInscripcion,
      table.idLeccion
    ),
  ]
);

// 10. predicas
export const predicas = sqliteTable('predicas', {
  idPredica: integer('id_predica').primaryKey({ autoIncrement: true }),
  titulo: text('titulo').notNull(),
  predicador: text('predicador').notNull(),
  fechaPredica: text('fecha_predica').notNull(),
  pasajeBiblico: text('pasaje_biblico').notNull(),
  urlArchivoAudio: text('url_archivo_audio').notNull(),
  reproducciones: integer('reproducciones').notNull().default(0),
  idProfesor: integer('id_profesor')
    .notNull()
    .references(() => usuarios.idUsuario),
});

// 11. transcripciones (1:1 con predicas)
export const transcripciones = sqliteTable('transcripciones', {
  idTranscripcion: integer('id_transcripcion').primaryKey({
    autoIncrement: true,
  }),
  idPredica: integer('id_predica')
    .notNull()
    .unique()
    .references(() => predicas.idPredica),
  textoTranscripcion: text('texto_transcripcion').notNull(),
});

// 12. consultas_foro
export const consultasForo = sqliteTable('consultas_foro', {
  idConsulta: integer('id_consulta').primaryKey({ autoIncrement: true }),
  idCurso: integer('id_curso')
    .notNull()
    .references(() => cursos.idCurso),
  idLeccion: integer('id_leccion').references(() => lecciones.idLeccion),
  idUsuario: integer('id_usuario')
    .notNull()
    .references(() => usuarios.idUsuario),
  tituloConsulta: text('titulo_consulta').notNull(),
  mensajePregunta: text('mensaje_pregunta').notNull(),
  fechaCreacion: text('fecha_creacion').notNull(),
  estado: text('estado').notNull().default('abierta'),
});

// 13. respuestas_foro
export const respuestasForo = sqliteTable('respuestas_foro', {
  idRespuesta: integer('id_respuesta').primaryKey({ autoIncrement: true }),
  idConsulta: integer('id_consulta')
    .notNull()
    .references(() => consultasForo.idConsulta),
  idUsuario: integer('id_usuario')
    .notNull()
    .references(() => usuarios.idUsuario),
  respuesta: text('respuesta').notNull(),
  fechaRespuesta: text('fecha_respuesta').notNull(),
});

// 14. interacciones_chat_ia
export const interaccionesChatIa = sqliteTable('interacciones_chat_ia', {
  idInteraccion: integer('id_interaccion').primaryKey({ autoIncrement: true }),
  idUsuario: integer('id_usuario')
    .notNull()
    .references(() => usuarios.idUsuario),
  idCurso: integer('id_curso').references(() => cursos.idCurso),
  idLeccion: integer('id_leccion').references(() => lecciones.idLeccion),
  idPredica: integer('id_predica').references(() => predicas.idPredica),
  mensajeUsuario: text('mensaje_usuario').notNull(),
  respuestaIa: text('respuesta_ia').notNull(),
  util: integer('util', { mode: 'boolean' }),
  fechaHora: text('fecha_hora').notNull(),
});

// 15. base_conocimiento_soporte
export const baseConocimientoSoporte = sqliteTable(
  'base_conocimiento_soporte',
  {
    idConocimiento: integer('id_conocimiento').primaryKey({
      autoIncrement: true,
    }),
    pregunta: text('pregunta').notNull(),
    respuesta: text('respuesta').notNull(),
    categoria: text('categoria').notNull(),
    rutaSugerida: text('ruta_sugerida'),
  }
);

// 16. informacion_institucional
export const informacionInstitucional = sqliteTable(
  'informacion_institucional',
  {
    idInformacion: integer('id_informacion').primaryKey({
      autoIncrement: true,
    }),
    titulo: text('titulo').notNull(),
    tipo: text('tipo').notNull(),
    contenido: text('contenido').notNull(),
    fechaActualizacion: text('fecha_actualizacion').notNull(),
    idUsuarioActualizacion: integer('id_usuario_actualizacion')
      .notNull()
      .references(() => usuarios.idUsuario),
  }
);
