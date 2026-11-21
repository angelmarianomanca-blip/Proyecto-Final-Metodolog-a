import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  usuarios,
  roles,
  congregaciones,
  tokensRecuperacion,
} from '@/db/schema';
import {
  TOKEN_RECUPERACION_MINUTOS,
  type RolNombre,
} from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import {
  actualizarPerfilSchema,
  cambiarPasswordSchema,
  loginSchema,
  parseOrThrow,
  recuperarPasswordSchema,
  registroSchema,
  restablecerPasswordSchema,
} from '@/lib/schemas';
import type { SessionUser } from '@/lib/auth/session';
import { nowIso, requireAuth } from './_helpers';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function getPublicUserById(userId: number): Promise<SessionUser> {
  const rows = await db
    .select({
      id: usuarios.idUsuario,
      nombre: usuarios.nombre,
      apellido: usuarios.apellido,
      correoElectronico: usuarios.correoElectronico,
      idRol: usuarios.idRol,
      rolNombre: roles.nombre,
      idCongregacion: usuarios.idCongregacion,
      nombreCongregacion: congregaciones.nombreSede,
      fechaRegistro: usuarios.fechaRegistro,
      activo: usuarios.activo,
    })
    .from(usuarios)
    .innerJoin(roles, eq(usuarios.idRol, roles.idRol))
    .leftJoin(
      congregaciones,
      eq(usuarios.idCongregacion, congregaciones.idCongregacion)
    )
    .where(eq(usuarios.idUsuario, userId))
    .limit(1);

  const u = rows[0];
  if (!u) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Usuario no encontrado.');
  }
  return {
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    correoElectronico: u.correoElectronico,
    rol: u.rolNombre as RolNombre,
    idRol: u.idRol,
    idCongregacion: u.idCongregacion,
    nombreCongregacion: u.nombreCongregacion ?? null,
    fechaRegistro: u.fechaRegistro,
    activo: u.activo,
  };
}

/**
 * RF-01, RN-01, RN-03: Registra públicamente un nuevo alumno vinculado a una congregación activa o como Externo.
 */
export async function registrarUsuario(input: unknown): Promise<SessionUser> {
  const data = parseOrThrow(registroSchema, input);
  const email = data.correoElectronico.toLowerCase();

  const existente = await db
    .select({ id: usuarios.idUsuario })
    .from(usuarios)
    .where(eq(usuarios.correoElectronico, email))
    .limit(1);

  if (existente.length > 0) {
    throw new ApiError(
      409,
      'EMAIL_DUPLICADO',
      'Ya existe una cuenta registrada con ese correo electrónico.'
    );
  }

  const rolAlumno = await db
    .select({ idRol: roles.idRol })
    .from(roles)
    .where(eq(roles.nombre, 'alumno'))
    .limit(1);

  if (!rolAlumno[0]) {
    throw new ApiError(500, 'ERROR_INTERNO', 'Rol alumno no inicializado.');
  }

  let idCong: number | null = data.idCongregacion ?? null;
  if (idCong !== null) {
    const cong = await db
      .select({ id: congregaciones.idCongregacion, activo: congregaciones.activo })
      .from(congregaciones)
      .where(eq(congregaciones.idCongregacion, idCong))
      .limit(1);
    if (!cong[0] || !cong[0].activo) {
      throw new ApiError(
        422,
        'VALIDACION',
        'La congregación seleccionada no existe o está inactiva.',
        [{ campo: 'idCongregacion', mensaje: 'Congregación inválida.' }]
      );
    }
    idCong = cong[0].id;
  }

  const hash = await bcrypt.hash(data.contrasenia, 10);

  const inserted = await db
    .insert(usuarios)
    .values({
      nombre: data.nombre,
      apellido: data.apellido,
      correoElectronico: email,
      contraseniaHash: hash,
      idRol: rolAlumno[0].idRol,
      idCongregacion: idCong,
      fechaRegistro: nowIso(),
      activo: true,
    })
    .returning({ id: usuarios.idUsuario });

  return getPublicUserById(inserted[0].id);
}

/**
 * RF-02, RF-03, CA-01: Autentica un usuario activo por correo y contraseña.
 */
export async function autenticarUsuario(input: unknown): Promise<SessionUser> {
  const data = parseOrThrow(loginSchema, input);
  const email = data.correoElectronico.toLowerCase();

  const rows = await db
    .select({
      id: usuarios.idUsuario,
      contraseniaHash: usuarios.contraseniaHash,
      activo: usuarios.activo,
    })
    .from(usuarios)
    .where(eq(usuarios.correoElectronico, email))
    .limit(1);

  const found = rows[0];
  if (!found || !found.activo) {
    throw new ApiError(
      401,
      'CREDENCIALES_INVALIDAS',
      'Credenciales inválidas o cuenta desactivada.'
    );
  }

  const valid = await bcrypt.compare(data.contrasenia, found.contraseniaHash);
  if (!valid) {
    throw new ApiError(
      401,
      'CREDENCIALES_INVALIDAS',
      'Credenciales inválidas o cuenta desactivada.'
    );
  }

  return getPublicUserById(found.id);
}

/**
 * RF-04, RN-03: Actualiza nombre, apellido y congregación (o condición de Externo) del usuario autenticado.
 */
export async function actualizarPerfil(
  user: SessionUser | null,
  input: unknown
): Promise<SessionUser> {
  const authed = requireAuth(user);
  const data = parseOrThrow(actualizarPerfilSchema, input);

  if (data.idCongregacion !== undefined && data.idCongregacion !== null) {
    const cong = await db
      .select({ id: congregaciones.idCongregacion, activo: congregaciones.activo })
      .from(congregaciones)
      .where(eq(congregaciones.idCongregacion, data.idCongregacion))
      .limit(1);
    if (!cong[0] || !cong[0].activo) {
      throw new ApiError(
        422,
        'VALIDACION',
        'La congregación seleccionada no es válida.',
        [{ campo: 'idCongregacion', mensaje: 'Congregación inactiva o inexistente.' }]
      );
    }
  }

  await db
    .update(usuarios)
    .set({
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.apellido !== undefined ? { apellido: data.apellido } : {}),
      ...(data.idCongregacion !== undefined
        ? { idCongregacion: data.idCongregacion }
        : {}),
    })
    .where(eq(usuarios.idUsuario, authed.id));

  return getPublicUserById(authed.id);
}

/**
 * RF-04: Permite al usuario autenticado cambiar su contraseña verificando la actual.
 */
export async function cambiarPassword(
  user: SessionUser | null,
  input: unknown
): Promise<{ mensaje: string }> {
  const authed = requireAuth(user);
  const data = parseOrThrow(cambiarPasswordSchema, input);

  const rows = await db
    .select({ contraseniaHash: usuarios.contraseniaHash })
    .from(usuarios)
    .where(eq(usuarios.idUsuario, authed.id))
    .limit(1);

  const current = rows[0];
  if (!current) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Usuario no encontrado.');
  }

  const ok = await bcrypt.compare(
    data.contraseniaActual,
    current.contraseniaHash
  );
  if (!ok) {
    throw new ApiError(
      422,
      'CONTRASENA_ACTUAL_INCORRECTA',
      'La contraseña actual ingresada es incorrecta.'
    );
  }

  const newHash = await bcrypt.hash(data.contraseniaNueva, 10);
  await db
    .update(usuarios)
    .set({ contraseniaHash: newHash })
    .where(eq(usuarios.idUsuario, authed.id));

  return { mensaje: 'Contraseña actualizada correctamente.' };
}

/**
 * RF-21, RN-12: Solicita un token temporal de recuperación hasheado con vencimiento de 30 minutos.
 */
export async function solicitarRecuperacionPassword(
  input: unknown
): Promise<{ mensaje: string; tokenDev?: string }> {
  const data = parseOrThrow(recuperarPasswordSchema, input);
  const email = data.correoElectronico.toLowerCase();

  const rows = await db
    .select({ id: usuarios.idUsuario, activo: usuarios.activo })
    .from(usuarios)
    .where(eq(usuarios.correoElectronico, email))
    .limit(1);

  const found = rows[0];
  if (!found || !found.activo) {
    // Respuesta neutral para no revelar existencia de cuentas
    return {
      mensaje:
        'Si el correo existe y está activo, se generó un token de recuperación válido por 30 minutos.',
    };
  }

  const rawToken = `rec_${crypto.randomBytes(16).toString('hex')}`;
  const tokenHash = hashToken(rawToken);
  const exp = new Date(
    Date.now() + TOKEN_RECUPERACION_MINUTOS * 60 * 1000
  ).toISOString();

  await db.insert(tokensRecuperacion).values({
    idUsuario: found.id,
    tokenHash,
    fechaExpiracion: exp,
    usado: false,
  });

  console.info(
    `[RF-21 RECUPERACION] Token para ${email} (expira ${exp}): ${rawToken}`
  );

  return {
    mensaje:
      'Si el correo existe y está activo, se generó un token de recuperación válido por 30 minutos.',
    ...(process.env.NODE_ENV !== 'production' ? { tokenDev: rawToken } : {}),
  };
}

/**
 * RF-21, RN-12: Restablece la contraseña usando un token temporal válido y lo invalida atómicamente.
 */
export async function restablecerPassword(
  input: unknown
): Promise<{ mensaje: string }> {
  const data = parseOrThrow(restablecerPasswordSchema, input);
  const tokenHash = hashToken(data.token);
  const ahora = nowIso();

  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(tokensRecuperacion)
      .where(
        and(
          eq(tokensRecuperacion.tokenHash, tokenHash),
          eq(tokensRecuperacion.usado, false)
        )
      )
      .limit(1);

    const tokenRow = rows[0];
    if (!tokenRow || tokenRow.fechaExpiracion < ahora) {
      throw new ApiError(
        422,
        'TOKEN_INVALIDO_O_EXPIRADO',
        'El token de recuperación es inválido, ya fue utilizado o expiró.'
      );
    }

    const newHash = await bcrypt.hash(data.contraseniaNueva, 10);

    await tx
      .update(usuarios)
      .set({ contraseniaHash: newHash })
      .where(eq(usuarios.idUsuario, tokenRow.idUsuario));

    await tx
      .update(tokensRecuperacion)
      .set({ usado: true })
      .where(eq(tokensRecuperacion.idToken, tokenRow.idToken));

    return { mensaje: 'Contraseña restablecida correctamente.' };
  });
}
