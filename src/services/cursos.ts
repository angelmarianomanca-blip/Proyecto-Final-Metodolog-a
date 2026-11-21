import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  cursos,
  inscripciones,
  lecciones,
  modulos,
  usuarios,
} from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';
import type { EstadoCurso } from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import {
  crearCursoSchema,
  crearLeccionSchema,
  crearModuloSchema,
  editarCursoSchema,
  editarLeccionSchema,
  editarModuloSchema,
  idParamSchema,
  paginacionSchema,
  parseOrThrow,
} from '@/lib/schemas';
import { nowIso, requireRoles } from './_helpers';

/**
 * RF-07, RF-05, RN-06: Lista cursos publicados para público/alumnos o todos para Profesor/Admin.
 */
export async function listarCursos(
  user: SessionUser | null,
  query: { q?: string; estado?: string; page?: string; pageSize?: string; gestion?: string }
) {
  const canManage =
    user !== null && (user.rol === 'admin' || user.rol === 'profesor');
  const { page, pageSize } = parseOrThrow(paginacionSchema, query);

  const conditions = [];
  if (!canManage || query.gestion !== 'true') {
    conditions.push(eq(cursos.estado, 'publicado'));
  } else if (
    query.estado &&
    ['borrador', 'publicado', 'archivado'].includes(query.estado)
  ) {
    conditions.push(eq(cursos.estado, query.estado));
  }

  if (query.q && query.q.trim()) {
    const pattern = `%${query.q.trim()}%`;
    conditions.push(
      or(
        like(cursos.titulo, pattern),
        like(cursos.descripcion, pattern),
        like(usuarios.nombre, pattern),
        like(usuarios.apellido, pattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(cursos)
    .innerJoin(usuarios, eq(cursos.idProfesor, usuarios.idUsuario))
    .where(whereClause);

  const rows = await db
    .select({
      id: cursos.idCurso,
      titulo: cursos.titulo,
      descripcion: cursos.descripcion,
      estado: cursos.estado,
      fechaCreacion: cursos.fechaCreacion,
      idProfesor: cursos.idProfesor,
      profesorNombre: usuarios.nombre,
      profesorApellido: usuarios.apellido,
    })
    .from(cursos)
    .innerJoin(usuarios, eq(cursos.idProfesor, usuarios.idUsuario))
    .where(whereClause)
    .orderBy(desc(cursos.idCurso))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const cursoIds = rows.map((r) => r.id);
  const modCountMap = new Map<number, number>();
  const lecCountMap = new Map<number, number>();
  const insCountMap = new Map<number, number>();

  if (cursoIds.length > 0) {
    const mods = await db
      .select({ idModulo: modulos.idModulo, idCurso: modulos.idCurso })
      .from(modulos)
      .where(inArray(modulos.idCurso, cursoIds));

    for (const m of mods) {
      modCountMap.set(m.idCurso, (modCountMap.get(m.idCurso) ?? 0) + 1);
    }

    const modIds = mods.map((m) => m.idModulo);
    if (modIds.length > 0) {
      const lecs = await db
        .select({ idModulo: lecciones.idModulo })
        .from(lecciones)
        .where(
          and(inArray(lecciones.idModulo, modIds), eq(lecciones.activo, true))
        );
      const modToCurso = new Map(mods.map((m) => [m.idModulo, m.idCurso]));
      for (const l of lecs) {
        const cid = modToCurso.get(l.idModulo);
        if (cid !== undefined) {
          lecCountMap.set(cid, (lecCountMap.get(cid) ?? 0) + 1);
        }
      }
    }

    const ins = await db
      .select({
        idCurso: inscripciones.idCurso,
        total: sql<number>`count(*)`,
      })
      .from(inscripciones)
      .where(inArray(inscripciones.idCurso, cursoIds))
      .groupBy(inscripciones.idCurso);

    for (const i of ins) {
      insCountMap.set(i.idCurso, Number(i.total));
    }
  }

  return {
    data: rows.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      estado: r.estado as EstadoCurso,
      fechaCreacion: r.fechaCreacion,
      idProfesor: r.idProfesor,
      profesor: `${r.profesorNombre} ${r.profesorApellido}`,
      totalModulos: modCountMap.get(r.id) ?? 0,
      totalLecciones: lecCountMap.get(r.id) ?? 0,
      totalInscriptos: insCountMap.get(r.id) ?? 0,
    })),
    page,
    pageSize,
    total: Number(totalRes[0]?.count ?? 0),
  };
}

/**
 * RF-07, RF-05, RN-06: Obtiene el detalle de un curso con sus módulos y lecciones ordenadas.
 */
export async function obtenerCursoDetalle(
  user: SessionUser | null,
  rawId: unknown,
  incluirInactivas = false
) {
  const id = parseOrThrow(idParamSchema, rawId);
  const canManage =
    user !== null && (user.rol === 'admin' || user.rol === 'profesor');

  const rows = await db
    .select({
      id: cursos.idCurso,
      titulo: cursos.titulo,
      descripcion: cursos.descripcion,
      estado: cursos.estado,
      fechaCreacion: cursos.fechaCreacion,
      idProfesor: cursos.idProfesor,
      profesorNombre: usuarios.nombre,
      profesorApellido: usuarios.apellido,
    })
    .from(cursos)
    .innerJoin(usuarios, eq(cursos.idProfesor, usuarios.idUsuario))
    .where(eq(cursos.idCurso, id))
    .limit(1);

  const c = rows[0];
  if (!c) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Curso no encontrado.');
  }

  if (c.estado !== 'publicado' && !canManage) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Curso no disponible.');
  }

  const mods = await db
    .select()
    .from(modulos)
    .where(eq(modulos.idCurso, id))
    .orderBy(asc(modulos.ordenSecuencia), asc(modulos.idModulo));

  const modIds = mods.map((m) => m.idModulo);
  const lecs =
    modIds.length > 0
      ? await db
          .select()
          .from(lecciones)
          .where(
            canManage && incluirInactivas
              ? inArray(lecciones.idModulo, modIds)
              : and(
                  inArray(lecciones.idModulo, modIds),
                  eq(lecciones.activo, true)
                )
          )
          .orderBy(asc(lecciones.ordenSecuencia), asc(lecciones.idLeccion))
      : [];

  return {
    id: c.id,
    titulo: c.titulo,
    descripcion: c.descripcion,
    estado: c.estado as EstadoCurso,
    fechaCreacion: c.fechaCreacion,
    idProfesor: c.idProfesor,
    profesor: `${c.profesorNombre} ${c.profesorApellido}`,
    modulos: mods.map((m) => ({
      id: m.idModulo,
      cursoId: m.idCurso,
      titulo: m.titulo,
      ordenSecuencia: m.ordenSecuencia,
      lecciones: lecs
        .filter((l) => l.idModulo === m.idModulo)
        .map((l) => ({
          id: l.idLeccion,
          moduloId: l.idModulo,
          titulo: l.titulo,
          ordenSecuencia: l.ordenSecuencia,
          contenidoTexto: l.contenidoTexto,
          enlaceVideo: l.enlaceVideo,
          archivoPdf: l.archivoPdf,
          activo: l.activo,
        })),
    })),
  };
}

/**
 * RF-05, RN-06: Crea un nuevo curso en estado inicial 'borrador' (Profesor/Pastor o Administrador).
 */
export async function crearCurso(user: SessionUser | null, input: unknown) {
  const actor = requireRoles(user, ['admin', 'profesor']);
  const data = parseOrThrow(crearCursoSchema, input);
  const profesorId =
    actor.rol === 'admin' && data.idProfesor ? data.idProfesor : actor.id;

  const inserted = await db
    .insert(cursos)
    .values({
      titulo: data.titulo,
      descripcion: data.descripcion,
      estado: 'borrador',
      fechaCreacion: nowIso(),
      idProfesor: profesorId,
    })
    .returning();

  return {
    id: inserted[0].idCurso,
    titulo: inserted[0].titulo,
    descripcion: inserted[0].descripcion,
    estado: inserted[0].estado as EstadoCurso,
    fechaCreacion: inserted[0].fechaCreacion,
    idProfesor: inserted[0].idProfesor,
  };
}

/**
 * RF-05, RN-06, RN-13: Edita un curso y valida que para publicar posea al menos 1 módulo con 1 lección activa.
 */
export async function editarCurso(
  user: SessionUser | null,
  rawId: unknown,
  input: unknown
) {
  requireRoles(user, ['admin', 'profesor']);
  const id = parseOrThrow(idParamSchema, rawId);
  const data = parseOrThrow(editarCursoSchema, input);

  const existing = await db
    .select()
    .from(cursos)
    .where(eq(cursos.idCurso, id))
    .limit(1);

  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Curso no encontrado.');
  }

  if (data.estado === 'publicado') {
    const activeLecs = await db
      .select({ count: sql<number>`count(*)` })
      .from(lecciones)
      .innerJoin(modulos, eq(lecciones.idModulo, modulos.idModulo))
      .where(and(eq(modulos.idCurso, id), eq(lecciones.activo, true)));

    if (Number(activeLecs[0]?.count ?? 0) < 1) {
      throw new ApiError(
        422,
        'CURSO_NO_PUBLICADO',
        'Para publicar un curso debe tener al menos un módulo con una lección activa.'
      );
    }
  }

  const updated = await db
    .update(cursos)
    .set({
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.descripcion !== undefined
        ? { descripcion: data.descripcion }
        : {}),
      ...(data.estado !== undefined ? { estado: data.estado } : {}),
      ...(data.idProfesor !== undefined ? { idProfesor: data.idProfesor } : {}),
    })
    .where(eq(cursos.idCurso, id))
    .returning();

  return {
    id: updated[0].idCurso,
    titulo: updated[0].titulo,
    descripcion: updated[0].descripcion,
    estado: updated[0].estado as EstadoCurso,
    fechaCreacion: updated[0].fechaCreacion,
    idProfesor: updated[0].idProfesor,
  };
}

/**
 * RF-05: Crea un módulo ordenado dentro de un curso.
 */
export async function crearModulo(
  user: SessionUser | null,
  rawCursoId: unknown,
  input: unknown
) {
  requireRoles(user, ['admin', 'profesor']);
  const cursoId = parseOrThrow(idParamSchema, rawCursoId);
  const data = parseOrThrow(crearModuloSchema, input);

  const cursoExists = await db
    .select({ id: cursos.idCurso })
    .from(cursos)
    .where(eq(cursos.idCurso, cursoId))
    .limit(1);
  if (!cursoExists[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Curso no encontrado.');
  }

  let orden = data.ordenSecuencia;
  if (!orden) {
    const maxRes = await db
      .select({ maxOrden: sql<number>`coalesce(max(${modulos.ordenSecuencia}), 0)` })
      .from(modulos)
      .where(eq(modulos.idCurso, cursoId));
    orden = Number(maxRes[0]?.maxOrden ?? 0) + 1;
  }

  const inserted = await db
    .insert(modulos)
    .values({
      idCurso: cursoId,
      titulo: data.titulo,
      ordenSecuencia: orden,
    })
    .returning();

  return {
    id: inserted[0].idModulo,
    cursoId: inserted[0].idCurso,
    titulo: inserted[0].titulo,
    ordenSecuencia: inserted[0].ordenSecuencia,
  };
}

/**
 * RF-05: Edita título u orden de secuencia de un módulo.
 */
export async function editarModulo(
  user: SessionUser | null,
  rawModuloId: unknown,
  input: unknown
) {
  requireRoles(user, ['admin', 'profesor']);
  const moduloId = parseOrThrow(idParamSchema, rawModuloId);
  const data = parseOrThrow(editarModuloSchema, input);

  const existing = await db
    .select()
    .from(modulos)
    .where(eq(modulos.idModulo, moduloId))
    .limit(1);
  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Módulo no encontrado.');
  }

  const updated = await db
    .update(modulos)
    .set({
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.ordenSecuencia !== undefined
        ? { ordenSecuencia: data.ordenSecuencia }
        : {}),
    })
    .where(eq(modulos.idModulo, moduloId))
    .returning();

  return {
    id: updated[0].idModulo,
    cursoId: updated[0].idCurso,
    titulo: updated[0].titulo,
    ordenSecuencia: updated[0].ordenSecuencia,
  };
}

/**
 * RF-05, RN-13: Elimina un módulo solo si no posee lecciones (para preservar integridad referencial).
 */
export async function eliminarModulo(
  user: SessionUser | null,
  rawModuloId: unknown
) {
  requireRoles(user, ['admin', 'profesor']);
  const moduloId = parseOrThrow(idParamSchema, rawModuloId);

  const existing = await db
    .select()
    .from(modulos)
    .where(eq(modulos.idModulo, moduloId))
    .limit(1);
  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Módulo no encontrado.');
  }

  const lecs = await db
    .select({ count: sql<number>`count(*)` })
    .from(lecciones)
    .where(eq(lecciones.idModulo, moduloId));

  if (Number(lecs[0]?.count ?? 0) > 0) {
    throw new ApiError(
      422,
      'VALIDACION',
      'Desactivá o reubicá las lecciones del módulo antes de eliminarlo.'
    );
  }

  await db.delete(modulos).where(eq(modulos.idModulo, moduloId));
  return { mensaje: 'Módulo eliminado correctamente.' };
}

/**
 * RF-05, RF-06: Crea una nueva lección con texto explicativo, video YouTube/Vimeo y guía PDF.
 */
export async function crearLeccion(
  user: SessionUser | null,
  rawModuloId: unknown,
  input: unknown
) {
  requireRoles(user, ['admin', 'profesor']);
  const moduloId = parseOrThrow(idParamSchema, rawModuloId);
  const data = parseOrThrow(crearLeccionSchema, input);

  const modExists = await db
    .select({ id: modulos.idModulo })
    .from(modulos)
    .where(eq(modulos.idModulo, moduloId))
    .limit(1);
  if (!modExists[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Módulo no encontrado.');
  }

  let orden = data.ordenSecuencia;
  if (!orden) {
    const maxRes = await db
      .select({ maxOrden: sql<number>`coalesce(max(${lecciones.ordenSecuencia}), 0)` })
      .from(lecciones)
      .where(eq(lecciones.idModulo, moduloId));
    orden = Number(maxRes[0]?.maxOrden ?? 0) + 1;
  }

  const inserted = await db
    .insert(lecciones)
    .values({
      idModulo: moduloId,
      titulo: data.titulo,
      ordenSecuencia: orden,
      contenidoTexto: data.contenidoTexto,
      enlaceVideo: data.enlaceVideo || null,
      archivoPdf: data.archivoPdf || null,
      activo: true,
    })
    .returning();

  return {
    id: inserted[0].idLeccion,
    moduloId: inserted[0].idModulo,
    titulo: inserted[0].titulo,
    ordenSecuencia: inserted[0].ordenSecuencia,
    contenidoTexto: inserted[0].contenidoTexto,
    enlaceVideo: inserted[0].enlaceVideo,
    archivoPdf: inserted[0].archivoPdf,
    activo: inserted[0].activo,
  };
}

/**
 * RF-05, RF-06, RN-13: Edita una lección o aplica baja lógica (`activo = false`).
 */
export async function editarLeccion(
  user: SessionUser | null,
  rawLeccionId: unknown,
  input: unknown
) {
  requireRoles(user, ['admin', 'profesor']);
  const leccionId = parseOrThrow(idParamSchema, rawLeccionId);
  const data = parseOrThrow(editarLeccionSchema, input);

  const existing = await db
    .select()
    .from(lecciones)
    .where(eq(lecciones.idLeccion, leccionId))
    .limit(1);
  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Lección no encontrada.');
  }

  const updated = await db
    .update(lecciones)
    .set({
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.ordenSecuencia !== undefined
        ? { ordenSecuencia: data.ordenSecuencia }
        : {}),
      ...(data.contenidoTexto !== undefined
        ? { contenidoTexto: data.contenidoTexto }
        : {}),
      ...(data.enlaceVideo !== undefined
        ? { enlaceVideo: data.enlaceVideo || null }
        : {}),
      ...(data.archivoPdf !== undefined
        ? { archivoPdf: data.archivoPdf || null }
        : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    })
    .where(eq(lecciones.idLeccion, leccionId))
    .returning();

  return {
    id: updated[0].idLeccion,
    moduloId: updated[0].idModulo,
    titulo: updated[0].titulo,
    ordenSecuencia: updated[0].ordenSecuencia,
    contenidoTexto: updated[0].contenidoTexto,
    enlaceVideo: updated[0].enlaceVideo,
    archivoPdf: updated[0].archivoPdf,
    activo: updated[0].activo,
  };
}
