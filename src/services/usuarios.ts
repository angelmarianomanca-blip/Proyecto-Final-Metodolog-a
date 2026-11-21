import bcrypt from 'bcryptjs';
import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { congregaciones, roles, usuarios } from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';
import type { RolNombre } from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import {
  crearUsuarioAdminSchema,
  editarUsuarioAdminSchema,
  idParamSchema,
  paginacionSchema,
  parseOrThrow,
  resetPasswordAdminSchema,
} from '@/lib/schemas';
import { nowIso, requireRoles } from './_helpers';

/**
 * RF-03, CA-01: Lista usuarios con búsqueda, filtros por rol/estado y paginación (solo Administrador).
 */
export async function listarUsuarios(
  user: SessionUser | null,
  query: { q?: string; rol?: string; activo?: string; page?: string; pageSize?: string }
) {
  requireRoles(user, ['admin']);
  const { page, pageSize } = parseOrThrow(paginacionSchema, query);

  const conditions = [];
  if (query.q && query.q.trim()) {
    const pattern = `%${query.q.trim()}%`;
    conditions.push(
      or(
        like(usuarios.nombre, pattern),
        like(usuarios.apellido, pattern),
        like(usuarios.correoElectronico, pattern)
      )
    );
  }
  if (query.rol && ['admin', 'profesor', 'alumno'].includes(query.rol)) {
    conditions.push(eq(roles.nombre, query.rol));
  }
  if (query.activo === 'true' || query.activo === 'false') {
    conditions.push(eq(usuarios.activo, query.activo === 'true'));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(usuarios)
    .innerJoin(roles, eq(usuarios.idRol, roles.idRol))
    .where(whereClause);

  const rows = await db
    .select({
      id: usuarios.idUsuario,
      nombre: usuarios.nombre,
      apellido: usuarios.apellido,
      correoElectronico: usuarios.correoElectronico,
      rol: roles.nombre,
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
    .where(whereClause)
    .orderBy(desc(usuarios.idUsuario))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    data: rows.map((r) => ({
      ...r,
      rol: r.rol as RolNombre,
      nombreCongregacion: r.nombreCongregacion ?? null,
    })),
    page,
    pageSize,
    total: Number(totalRes[0]?.count ?? 0),
  };
}

/**
 * RF-03, RN-01, RN-02, RN-03: Alta de usuario desde panel de Administrador con rol asignado.
 */
export async function crearUsuarioAdmin(
  user: SessionUser | null,
  input: unknown
) {
  requireRoles(user, ['admin']);
  const data = parseOrThrow(crearUsuarioAdminSchema, input);
  const email = data.correoElectronico.toLowerCase();

  const dup = await db
    .select({ id: usuarios.idUsuario })
    .from(usuarios)
    .where(eq(usuarios.correoElectronico, email))
    .limit(1);

  if (dup.length > 0) {
    throw new ApiError(
      409,
      'EMAIL_DUPLICADO',
      'Ya existe un usuario con ese correo electrónico.'
    );
  }

  const rolRow = await db
    .select({ idRol: roles.idRol })
    .from(roles)
    .where(eq(roles.nombre, data.rol))
    .limit(1);

  if (!rolRow[0]) {
    throw new ApiError(422, 'VALIDACION', 'Rol no encontrado.');
  }

  if (data.idCongregacion !== undefined && data.idCongregacion !== null) {
    const cong = await db
      .select({ id: congregaciones.idCongregacion, activo: congregaciones.activo })
      .from(congregaciones)
      .where(eq(congregaciones.idCongregacion, data.idCongregacion))
      .limit(1);
    if (!cong[0] || !cong[0].activo) {
      throw new ApiError(422, 'VALIDACION', 'Congregación inválida o inactiva.');
    }
  }

  const hash = await bcrypt.hash(data.contrasenia, 10);
  const inserted = await db
    .insert(usuarios)
    .values({
      nombre: data.nombre,
      apellido: data.apellido,
      correoElectronico: email,
      contraseniaHash: hash,
      idRol: rolRow[0].idRol,
      idCongregacion: data.idCongregacion ?? null,
      fechaRegistro: nowIso(),
      activo: true,
    })
    .returning({ id: usuarios.idUsuario });

  const id = inserted[0].id;
  return {
    id,
    nombre: data.nombre,
    apellido: data.apellido,
    correoElectronico: email,
    rol: data.rol,
    idCongregacion: data.idCongregacion ?? null,
    activo: true,
  };
}

/**
 * RF-03, RN-02, RN-13: Edita usuario, rol o estado activo/inactivo impidiendo auto-desactivación o auto-cambio de rol.
 */
export async function editarUsuarioAdmin(
  user: SessionUser | null,
  rawId: unknown,
  input: unknown
) {
  const admin = requireRoles(user, ['admin']);
  const targetId = parseOrThrow(idParamSchema, rawId);
  const data = parseOrThrow(editarUsuarioAdminSchema, input);

  const existing = await db
    .select({
      id: usuarios.idUsuario,
      idRol: usuarios.idRol,
      activo: usuarios.activo,
    })
    .from(usuarios)
    .where(eq(usuarios.idUsuario, targetId))
    .limit(1);

  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Usuario no encontrado.');
  }

  if (targetId === admin.id) {
    if (data.activo === false || (data.rol && data.rol !== 'admin')) {
      throw new ApiError(
        422,
        'OPERACION_SOBRE_SI_MISMO',
        'Un administrador no puede desactivarse ni quitarse su propio rol.'
      );
    }
  }

  let newRolId: number | undefined;
  if (data.rol !== undefined) {
    const rolRow = await db
      .select({ idRol: roles.idRol })
      .from(roles)
      .where(eq(roles.nombre, data.rol))
      .limit(1);
    if (!rolRow[0]) {
      throw new ApiError(422, 'VALIDACION', 'Rol no válido.');
    }
    newRolId = rolRow[0].idRol;
  }

  if (data.idCongregacion !== undefined && data.idCongregacion !== null) {
    const cong = await db
      .select({ id: congregaciones.idCongregacion, activo: congregaciones.activo })
      .from(congregaciones)
      .where(eq(congregaciones.idCongregacion, data.idCongregacion))
      .limit(1);
    if (!cong[0] || !cong[0].activo) {
      throw new ApiError(422, 'VALIDACION', 'Congregación inactiva o inexistente.');
    }
  }

  await db
    .update(usuarios)
    .set({
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.apellido !== undefined ? { apellido: data.apellido } : {}),
      ...(newRolId !== undefined ? { idRol: newRolId } : {}),
      ...(data.idCongregacion !== undefined
        ? { idCongregacion: data.idCongregacion }
        : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    })
    .where(eq(usuarios.idUsuario, targetId));

  const updated = await db
    .select({
      id: usuarios.idUsuario,
      nombre: usuarios.nombre,
      apellido: usuarios.apellido,
      correoElectronico: usuarios.correoElectronico,
      rol: roles.nombre,
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
    .where(eq(usuarios.idUsuario, targetId))
    .limit(1);

  return updated[0];
}

/**
 * RF-03: Permite al Administrador restablecer la contraseña de un usuario.
 */
export async function resetPasswordUsuarioAdmin(
  user: SessionUser | null,
  rawId: unknown,
  input: unknown
) {
  requireRoles(user, ['admin']);
  const targetId = parseOrThrow(idParamSchema, rawId);
  const data = parseOrThrow(resetPasswordAdminSchema, input);

  const exists = await db
    .select({ id: usuarios.idUsuario })
    .from(usuarios)
    .where(eq(usuarios.idUsuario, targetId))
    .limit(1);

  if (!exists[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Usuario no encontrado.');
  }

  const hash = await bcrypt.hash(data.contraseniaNueva, 10);
  await db
    .update(usuarios)
    .set({ contraseniaHash: hash })
    .where(eq(usuarios.idUsuario, targetId));

  return { mensaje: 'Contraseña restablecida correctamente por el administrador.' };
}

/**
 * Lista profesores y administradores activos para asignación de cursos.
 */
export async function listarDocentes(user: SessionUser | null) {
  requireRoles(user, ['admin', 'profesor']);
  const rows = await db
    .select({
      id: usuarios.idUsuario,
      nombre: usuarios.nombre,
      apellido: usuarios.apellido,
      rol: roles.nombre,
    })
    .from(usuarios)
    .innerJoin(roles, eq(usuarios.idRol, roles.idRol))
    .where(
      and(
        eq(usuarios.activo, true),
        or(eq(roles.nombre, 'profesor'), eq(roles.nombre, 'admin'))
      )
    );
  return rows;
}
