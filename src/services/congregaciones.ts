import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { congregaciones, usuarios } from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';
import { ApiError } from '@/lib/errors';
import {
  crearCongregacionSchema,
  editarCongregacionSchema,
  idParamSchema,
  parseOrThrow,
} from '@/lib/schemas';
import { requireRoles } from './_helpers';

/**
 * RF-20, RF-01: Lista congregaciones activas para el público o todas con conteo de miembros para Administrador.
 */
export async function listarCongregaciones(user: SessionUser | null) {
  const isAdmin = user?.rol === 'admin';
  const rows = await db
    .select({
      id: congregaciones.idCongregacion,
      nombreSede: congregaciones.nombreSede,
      direccion: congregaciones.direccion,
      ciudad: congregaciones.ciudad,
      telefonoContacto: congregaciones.telefonoContacto,
      activo: congregaciones.activo,
    })
    .from(congregaciones)
    .where(isAdmin ? undefined : eq(congregaciones.activo, true))
    .orderBy(asc(congregaciones.nombreSede));

  const counts = await db
    .select({
      idCongregacion: usuarios.idCongregacion,
      total: sql<number>`count(*)`,
    })
    .from(usuarios)
    .where(eq(usuarios.activo, true))
    .groupBy(usuarios.idCongregacion);

  const countMap = new Map<number, number>();
  for (const c of counts) {
    if (c.idCongregacion !== null) {
      countMap.set(c.idCongregacion, Number(c.total));
    }
  }

  return {
    data: rows.map((r) => ({
      ...r,
      miembrosActivos: countMap.get(r.id) ?? 0,
    })),
  };
}

/**
 * RF-20: Crea una nueva sede/congregación (solo Administrador).
 */
export async function crearCongregacion(
  user: SessionUser | null,
  input: unknown
) {
  requireRoles(user, ['admin']);
  const data = parseOrThrow(crearCongregacionSchema, input);

  const dup = await db
    .select({ id: congregaciones.idCongregacion })
    .from(congregaciones)
    .where(eq(congregaciones.nombreSede, data.nombreSede))
    .limit(1);

  if (dup.length > 0) {
    throw new ApiError(
      409,
      'NOMBRE_DUPLICADO',
      'Ya existe una congregación con ese nombre de sede.'
    );
  }

  const inserted = await db
    .insert(congregaciones)
    .values({
      nombreSede: data.nombreSede,
      direccion: data.direccion,
      ciudad: data.ciudad,
      telefonoContacto: data.telefonoContacto,
      activo: true,
    })
    .returning();

  return {
    id: inserted[0].idCongregacion,
    nombreSede: inserted[0].nombreSede,
    direccion: inserted[0].direccion,
    ciudad: inserted[0].ciudad,
    telefonoContacto: inserted[0].telefonoContacto,
    activo: inserted[0].activo,
  };
}

/**
 * RF-20, RN-13: Edita o da de baja lógica una congregación, bloqueando desactivación si tiene usuarios activos.
 */
export async function editarCongregacion(
  user: SessionUser | null,
  rawId: unknown,
  input: unknown
) {
  requireRoles(user, ['admin']);
  const id = parseOrThrow(idParamSchema, rawId);
  const data = parseOrThrow(editarCongregacionSchema, input);

  const existing = await db
    .select()
    .from(congregaciones)
    .where(eq(congregaciones.idCongregacion, id))
    .limit(1);

  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Congregación no encontrada.');
  }

  if (data.nombreSede && data.nombreSede !== existing[0].nombreSede) {
    const dup = await db
      .select({ id: congregaciones.idCongregacion })
      .from(congregaciones)
      .where(eq(congregaciones.nombreSede, data.nombreSede))
      .limit(1);
    if (dup.length > 0) {
      throw new ApiError(
        409,
        'NOMBRE_DUPLICADO',
        'Ya existe otra congregación con ese nombre.'
      );
    }
  }

  if (data.activo === false) {
    const activos = await db
      .select({ count: sql<number>`count(*)` })
      .from(usuarios)
      .where(
        and(eq(usuarios.idCongregacion, id), eq(usuarios.activo, true))
      );
    if (Number(activos[0]?.count ?? 0) > 0) {
      throw new ApiError(
        409,
        'CONGREGACION_EN_USO',
        'No se puede desactivar una congregación con usuarios activos vinculados.'
      );
    }
  }

  const updated = await db
    .update(congregaciones)
    .set({
      ...(data.nombreSede !== undefined ? { nombreSede: data.nombreSede } : {}),
      ...(data.direccion !== undefined ? { direccion: data.direccion } : {}),
      ...(data.ciudad !== undefined ? { ciudad: data.ciudad } : {}),
      ...(data.telefonoContacto !== undefined
        ? { telefonoContacto: data.telefonoContacto }
        : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    })
    .where(eq(congregaciones.idCongregacion, id))
    .returning();

  return {
    id: updated[0].idCongregacion,
    nombreSede: updated[0].nombreSede,
    direccion: updated[0].direccion,
    ciudad: updated[0].ciudad,
    telefonoContacto: updated[0].telefonoContacto,
    activo: updated[0].activo,
  };
}
