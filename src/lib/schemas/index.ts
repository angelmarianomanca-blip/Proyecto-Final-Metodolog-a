import { z } from 'zod';
import {
  ESTADOS_CURSO,
  ESTADOS_FORO,
  PAGINACION_DEFAULT,
  ROLES,
  TIPOS_INSTITUCIONAL,
} from '@/lib/constants';
import { ApiError } from '@/lib/errors';

export function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown
): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      campo: issue.path.join('.') || 'general',
      mensaje: issue.message,
    }));
    throw new ApiError(422, 'VALIDACION', 'Hay campos con errores.', details);
  }
  return result.data;
}

export const idParamSchema = z.coerce
  .number()
  .int('Debe ser un identificador entero.')
  .positive('Debe ser un identificador positivo.');

export const paginacionSchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINACION_DEFAULT.page),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINACION_DEFAULT.maxPageSize)
    .default(PAGINACION_DEFAULT.pageSize),
});

const videoUrlSchema = z
  .string()
  .trim()
  .url('Debe ser una URL válida.')
  .refine(
    (val) => {
      try {
        const host = new URL(val).hostname.toLowerCase();
        return (
          host.includes('youtube.com') ||
          host === 'youtu.be' ||
          host.includes('vimeo.com')
        );
      } catch {
        return false;
      }
    },
    { message: 'El video debe ser un enlace válido de YouTube o Vimeo.' }
  );

// --- AUTH ---
export const registroSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresá tu nombre (mín. 2 caracteres).').max(80),
  apellido: z.string().trim().min(2, 'Ingresá tu apellido (mín. 2 caracteres).').max(80),
  correoElectronico: z
    .string()
    .trim()
    .toLowerCase()
    .email('Debe ser un correo electrónico válido.'),
  contrasenia: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(100),
  idCongregacion: z.number().int().positive().nullable().optional(),
});

export const loginSchema = z.object({
  correoElectronico: z
    .string()
    .trim()
    .toLowerCase()
    .email('Debe ser un correo electrónico válido.'),
  contrasenia: z.string().min(1, 'Ingresá tu contraseña.'),
});

export const actualizarPerfilSchema = z.strictObject({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres.').max(80).optional(),
  apellido: z.string().trim().min(2, 'Mínimo 2 caracteres.').max(80).optional(),
  idCongregacion: z.number().int().positive().nullable().optional(),
});

export const cambiarPasswordSchema = z.object({
  contraseniaActual: z.string().min(1, 'Ingresá tu contraseña actual.'),
  contraseniaNueva: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
    .max(100),
});

export const recuperarPasswordSchema = z.object({
  correoElectronico: z
    .string()
    .trim()
    .toLowerCase()
    .email('Debe ser un correo electrónico válido.'),
});

export const restablecerPasswordSchema = z.object({
  token: z.string().trim().min(10, 'Token inválido.'),
  contraseniaNueva: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
    .max(100),
});

// --- USUARIOS (ADMIN) ---
export const crearUsuarioAdminSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  apellido: z.string().trim().min(2).max(80),
  correoElectronico: z.string().trim().toLowerCase().email('Correo inválido.'),
  contrasenia: z.string().min(8, 'Mínimo 8 caracteres.').max(100),
  rol: z.enum(ROLES),
  idCongregacion: z.number().int().positive().nullable().optional(),
});

export const editarUsuarioAdminSchema = z.strictObject({
  nombre: z.string().trim().min(2).max(80).optional(),
  apellido: z.string().trim().min(2).max(80).optional(),
  rol: z.enum(ROLES).optional(),
  idCongregacion: z.number().int().positive().nullable().optional(),
  activo: z.boolean().optional(),
});

export const resetPasswordAdminSchema = z.object({
  contraseniaNueva: z.string().min(8, 'Mínimo 8 caracteres.').max(100),
});

// --- CONGREGACIONES ---
export const crearCongregacionSchema = z.object({
  nombreSede: z.string().trim().min(3, 'Mínimo 3 caracteres.').max(120),
  direccion: z.string().trim().min(3, 'Ingresá la dirección.').max(180),
  ciudad: z.string().trim().min(2, 'Ingresá la ciudad.').max(100),
  telefonoContacto: z.string().trim().min(6, 'Ingresá un teléfono válido.').max(40),
});

export const editarCongregacionSchema = z.strictObject({
  nombreSede: z.string().trim().min(3).max(120).optional(),
  direccion: z.string().trim().min(3).max(180).optional(),
  ciudad: z.string().trim().min(2).max(100).optional(),
  telefonoContacto: z.string().trim().min(6).max(40).optional(),
  activo: z.boolean().optional(),
});

// --- CURSOS, MODULOS, LECCIONES ---
export const crearCursoSchema = z.object({
  titulo: z.string().trim().min(4, 'Mínimo 4 caracteres.').max(160),
  descripcion: z.string().trim().min(10, 'Mínimo 10 caracteres.').max(2000),
  idProfesor: z.number().int().positive().optional(),
});

export const editarCursoSchema = z.strictObject({
  titulo: z.string().trim().min(4).max(160).optional(),
  descripcion: z.string().trim().min(10).max(2000).optional(),
  estado: z.enum(ESTADOS_CURSO).optional(),
  idProfesor: z.number().int().positive().optional(),
});

export const crearModuloSchema = z.object({
  titulo: z.string().trim().min(3, 'Mínimo 3 caracteres.').max(160),
  ordenSecuencia: z.number().int().min(1).optional(),
});

export const editarModuloSchema = z.strictObject({
  titulo: z.string().trim().min(3).max(160).optional(),
  ordenSecuencia: z.number().int().min(1).optional(),
});

export const crearLeccionSchema = z.object({
  titulo: z.string().trim().min(3, 'Mínimo 3 caracteres.').max(160),
  ordenSecuencia: z.number().int().min(1).optional(),
  contenidoTexto: z.string().trim().min(10, 'Ingresá el contenido explicativo.').max(20000),
  enlaceVideo: videoUrlSchema.nullable().optional().or(z.literal('')),
  archivoPdf: z.string().trim().max(500).nullable().optional().or(z.literal('')),
});

export const editarLeccionSchema = z.strictObject({
  titulo: z.string().trim().min(3).max(160).optional(),
  ordenSecuencia: z.number().int().min(1).optional(),
  contenidoTexto: z.string().trim().min(10).max(20000).optional(),
  enlaceVideo: videoUrlSchema.nullable().optional().or(z.literal('')),
  archivoPdf: z.string().trim().max(500).nullable().optional().or(z.literal('')),
  activo: z.boolean().optional(),
});

// --- INSCRIPCIONES Y PROGRESO ---
export const crearInscripcionSchema = z.object({
  cursoId: z.number().int().positive('Debe indicar un curso válido.'),
});

export const actualizarProgresoSchema = z
  .strictObject({
    completada: z.boolean().optional(),
    segundoActual: z.number().int().min(0).max(86400).optional(),
  })
  .refine(
    (d) => d.completada !== undefined || d.segundoActual !== undefined,
    { message: 'Debés enviar completada o segundoActual.' }
  );

// --- PREDICAS Y TRANSCRIPCIONES ---
export const crearPredicaSchema = z.object({
  titulo: z.string().trim().min(4, 'Ingresá el título de la prédica.').max(180),
  predicador: z.string().trim().min(3, 'Ingresá el nombre del predicador.').max(120),
  fechaPredica: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado AAAA-MM-DD.'),
  pasajeBiblico: z.string().trim().min(3, 'Ingresá el pasaje bíblico base.').max(120),
  urlArchivoAudio: z
    .string()
    .trim()
    .min(5, 'Subí un archivo de audio o ingresá un enlace válido.')
    .max(4_600_000, 'El archivo de audio supera el límite permitido (máx. 3 MB para carga directa).'),
  textoTranscripcion: z
    .string()
    .trim()
    .min(20, 'Ingresá el contenido de la prédica (mín. 20 caracteres).')
    .max(80000),
});

export const editarPredicaSchema = z.strictObject({
  titulo: z.string().trim().min(4).max(180).optional(),
  predicador: z.string().trim().min(3).max(120).optional(),
  fechaPredica: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado AAAA-MM-DD.')
    .optional(),
  pasajeBiblico: z.string().trim().min(3).max(120).optional(),
  urlArchivoAudio: z.string().trim().min(5).max(4_600_000).optional(),
  textoTranscripcion: z.string().trim().min(20).max(80000).optional(),
});

// --- FOROS ---
export const crearConsultaForoSchema = z.object({
  cursoId: z.number().int().positive('Seleccioná un curso.'),
  leccionId: z.number().int().positive().nullable().optional(),
  tituloConsulta: z.string().trim().min(5, 'Mínimo 5 caracteres.').max(180),
  mensajePregunta: z.string().trim().min(10, 'Mínimo 10 caracteres.').max(5000),
});

export const editarConsultaForoSchema = z.strictObject({
  tituloConsulta: z.string().trim().min(5).max(180).optional(),
  mensajePregunta: z.string().trim().min(10).max(5000).optional(),
  estado: z.enum(ESTADOS_FORO).optional(),
});

export const crearRespuestaForoSchema = z.object({
  respuesta: z.string().trim().min(3, 'Escribí una respuesta.').max(5000),
});

// --- IA RAG ---
export const chatIaSchema = z.object({
  mensaje: z.string().trim().min(3, 'Escribí tu consulta.').max(1200),
  cursoId: z.number().int().positive().nullable().optional(),
  leccionId: z.number().int().positive().nullable().optional(),
  predicaId: z.number().int().positive().nullable().optional(),
});

export const valorarIaSchema = z.strictObject({
  util: z.boolean(),
});

// --- SOPORTE (BOT GUIA) ---
export const consultarSoporteSchema = z.object({
  consulta: z.string().trim().min(1, 'Escribí tu consulta.').max(500),
});

export const crearSoporteSchema = z.object({
  pregunta: z.string().trim().min(5).max(240),
  respuesta: z.string().trim().min(10).max(3000),
  categoria: z.string().trim().min(2).max(80),
  rutaSugerida: z.string().trim().max(120).nullable().optional(),
});

export const editarSoporteSchema = z.strictObject({
  pregunta: z.string().trim().min(5).max(240).optional(),
  respuesta: z.string().trim().min(10).max(3000).optional(),
  categoria: z.string().trim().min(2).max(80).optional(),
  rutaSugerida: z.string().trim().max(120).nullable().optional(),
});

// --- INSTITUCIONAL ---
export const crearInstitucionalSchema = z.object({
  titulo: z.string().trim().min(3).max(160),
  tipo: z.enum(TIPOS_INSTITUCIONAL),
  contenido: z.string().trim().min(20).max(15000),
});

export const editarInstitucionalSchema = z.strictObject({
  titulo: z.string().trim().min(3).max(160).optional(),
  tipo: z.enum(TIPOS_INSTITUCIONAL).optional(),
  contenido: z.string().trim().min(20).max(15000).optional(),
});
