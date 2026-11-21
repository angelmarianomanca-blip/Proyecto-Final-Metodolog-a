export const ROLES = ['admin', 'profesor', 'alumno'] as const;
export type RolNombre = (typeof ROLES)[number];

export const ESTADOS_CURSO = ['borrador', 'publicado', 'archivado'] as const;
export type EstadoCurso = (typeof ESTADOS_CURSO)[number];

export const ESTADOS_INSCRIPCION = ['en_curso', 'finalizado'] as const;
export type EstadoInscripcion = (typeof ESTADOS_INSCRIPCION)[number];

export const ESTADOS_FORO = ['abierta', 'respondida', 'cerrada'] as const;
export type EstadoForo = (typeof ESTADOS_FORO)[number];

export const TIPOS_INSTITUCIONAL = [
  'declaracion_fe',
  'doctrina',
  'vision',
  'creencias',
] as const;
export type TipoInstitucional = (typeof TIPOS_INSTITUCIONAL)[number];

export const CATEGORIAS_SOPORTE = [
  'Registro',
  'Inscripción',
  'Cursos',
  'Prédicas',
  'Foros',
  'Recuperación de clave',
] as const;

export const PAGINACION_DEFAULT = {
  page: 1,
  pageSize: 20,
  maxPageSize: 100,
} as const;

export const UMBRAL_COMPLETADO_VIDEO = 0.9;
export const TOKEN_RECUPERACION_MINUTOS = 30;
export const SESSION_COOKIE_NAME = 'teo_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días
export const SESSION_INACTIVITY_MINUTES = 30;
export const SESSION_INACTIVITY_MS = SESSION_INACTIVITY_MINUTES * 60 * 1000;
export const SESSION_LAST_ACTIVITY_KEY = 'teo_last_activity';

export const LABELS_ROL: Record<RolNombre, string> = {
  admin: 'Administrador',
  profesor: 'Profesor / Pastor',
  alumno: 'Alumno',
};

export const LABELS_TIPO_INSTITUCIONAL: Record<TipoInstitucional, string> = {
  declaracion_fe: 'Declaración de Fe',
  doctrina: 'Doctrina Bíblica',
  vision: 'Nuestra Visión',
  creencias: 'Creencias y Comunidad',
};
