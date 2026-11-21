import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { informacionInstitucional, usuarios } from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';
import type { TipoInstitucional } from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import {
  crearInstitucionalSchema,
  editarInstitucionalSchema,
  idParamSchema,
  parseOrThrow,
} from '@/lib/schemas';
import { nowIso, requireRoles } from './_helpers';

/**
 * RF-19, CA-07: Lista los bloques públicos de doctrina e información institucional.
 */
export async function listarInformacionInstitucional() {
  const rows = await db
    .select({
      id: informacionInstitucional.idInformacion,
      titulo: informacionInstitucional.titulo,
      tipo: informacionInstitucional.tipo,
      contenido: informacionInstitucional.contenido,
      fechaActualizacion: informacionInstitucional.fechaActualizacion,
      autorNombre: usuarios.nombre,
      autorApellido: usuarios.apellido,
    })
    .from(informacionInstitucional)
    .innerJoin(
      usuarios,
      eq(informacionInstitucional.idUsuarioActualizacion, usuarios.idUsuario)
    )
    .orderBy(asc(informacionInstitucional.idInformacion));

  return {
    data: rows.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      tipo: r.tipo as TipoInstitucional,
      contenido: r.contenido,
      fechaActualizacion: r.fechaActualizacion,
      actualizadoPor: `${r.autorNombre} ${r.autorApellido}`,
    })),
  };
}

/**
 * RF-18: Crea un bloque tipificado de doctrina o información institucional (solo Administrador).
 */
export async function crearInformacionInstitucional(
  user: SessionUser | null,
  input: unknown
) {
  const admin = requireRoles(user, ['admin']);
  const data = parseOrThrow(crearInstitucionalSchema, input);

  const inserted = await db
    .insert(informacionInstitucional)
    .values({
      titulo: data.titulo,
      tipo: data.tipo,
      contenido: data.contenido,
      fechaActualizacion: nowIso(),
      idUsuarioActualizacion: admin.id,
    })
    .returning();

  return {
    id: inserted[0].idInformacion,
    titulo: inserted[0].titulo,
    tipo: inserted[0].tipo as TipoInstitucional,
    contenido: inserted[0].contenido,
    fechaActualizacion: inserted[0].fechaActualizacion,
    actualizadoPor: `${admin.nombre} ${admin.apellido}`,
  };
}

/**
 * RF-18: Actualiza un bloque de información institucional registrando fecha y administrador responsable.
 */
export async function editarInformacionInstitucional(
  user: SessionUser | null,
  rawId: unknown,
  input: unknown
) {
  const admin = requireRoles(user, ['admin']);
  const id = parseOrThrow(idParamSchema, rawId);
  const data = parseOrThrow(editarInstitucionalSchema, input);

  const existing = await db
    .select()
    .from(informacionInstitucional)
    .where(eq(informacionInstitucional.idInformacion, id))
    .limit(1);

  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Bloque institucional no encontrado.');
  }

  const updated = await db
    .update(informacionInstitucional)
    .set({
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
      ...(data.contenido !== undefined ? { contenido: data.contenido } : {}),
      fechaActualizacion: nowIso(),
      idUsuarioActualizacion: admin.id,
    })
    .where(eq(informacionInstitucional.idInformacion, id))
    .returning();

  return {
    id: updated[0].idInformacion,
    titulo: updated[0].titulo,
    tipo: updated[0].tipo as TipoInstitucional,
    contenido: updated[0].contenido,
    fechaActualizacion: updated[0].fechaActualizacion,
    actualizadoPor: `${admin.nombre} ${admin.apellido}`,
  };
}
