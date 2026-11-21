import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { usuarios, roles, congregaciones } from '@/db/schema';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type RolNombre,
} from '@/lib/constants';
import { ApiError } from '@/lib/errors';

export interface SessionUser {
  id: number;
  nombre: string;
  apellido: string;
  correoElectronico: string;
  rol: RolNombre;
  idRol: number;
  idCongregacion: number | null;
  nombreCongregacion: string | null;
  fechaRegistro: string;
  activo: boolean;
}

function getSecretKey(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    'dev-fallback-secret-no-usar-en-produccion-32chars';
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function setSessionCookie(userId: number): Promise<void> {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Resuelve la sesión actual validando SIEMPRE contra la base de datos
 * que el usuario exista y siga activo (RF-02, RF-03, CA-01).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;

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

    const user = rows[0];
    if (!user || !user.activo) return null;

    return {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      correoElectronico: user.correoElectronico,
      rol: user.rolNombre as RolNombre,
      idRol: user.idRol,
      idCongregacion: user.idCongregacion,
      nombreCongregacion: user.nombreCongregacion ?? null,
      fechaRegistro: user.fechaRegistro,
      activo: user.activo,
    };
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError(
      401,
      'NO_AUTENTICADO',
      'Debés iniciar sesión para acceder a este recurso.'
    );
  }
  return user;
}
