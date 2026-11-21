import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  consultasForo,
  cursos,
  lecciones,
  respuestasForo,
  roles,
  usuarios,
} from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';
import type { EstadoForo, RolNombre } from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import {
  crearConsultaForoSchema,
  crearRespuestaForoSchema,
  editarConsultaForoSchema,
  idParamSchema,
  paginacionSchema,
  parseOrThrow,
} from '@/lib/schemas';
import { nowIso, requireAuth, requireRoles } from './_helpers';

/**
 * RF-16, RF-17: Lista consultas de foro filtrables por curso, estado y texto libre.
 */
export async function listarConsultasForo(
  user: SessionUser | null,
  query: {
    cursoId?: string;
    estado?: string;
    q?: string;
    page?: string;
    pageSize?: string;
  }
) {
  requireAuth(user);
  const { page, pageSize } = parseOrThrow(paginacionSchema, query);

  const conditions = [];
  if (query.cursoId && /^\d+$/.test(query.cursoId)) {
    conditions.push(eq(consultasForo.idCurso, Number(query.cursoId)));
  }
  if (
    query.estado &&
    ['abierta', 'respondida', 'cerrada'].includes(query.estado)
  ) {
    conditions.push(eq(consultasForo.estado, query.estado));
  }
  if (query.q && query.q.trim()) {
    const pattern = `%${query.q.trim()}%`;
    conditions.push(
      or(
        like(consultasForo.tituloConsulta, pattern),
        like(consultasForo.mensajePregunta, pattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(consultasForo)
    .where(whereClause);

  const rows = await db
    .select({
      id: consultasForo.idConsulta,
      cursoId: consultasForo.idCurso,
      cursoTitulo: cursos.titulo,
      leccionId: consultasForo.idLeccion,
      leccionTitulo: lecciones.titulo,
      usuarioId: consultasForo.idUsuario,
      autorNombre: usuarios.nombre,
      autorApellido: usuarios.apellido,
      tituloConsulta: consultasForo.tituloConsulta,
      mensajePregunta: consultasForo.mensajePregunta,
      fechaCreacion: consultasForo.fechaCreacion,
      estado: consultasForo.estado,
    })
    .from(consultasForo)
    .innerJoin(cursos, eq(consultasForo.idCurso, cursos.idCurso))
    .innerJoin(usuarios, eq(consultasForo.idUsuario, usuarios.idUsuario))
    .leftJoin(lecciones, eq(consultasForo.idLeccion, lecciones.idLeccion))
    .where(whereClause)
    .orderBy(desc(consultasForo.idConsulta))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const counts = await db
    .select({
      idConsulta: respuestasForo.idConsulta,
      total: sql<number>`count(*)`,
    })
    .from(respuestasForo)
    .groupBy(respuestasForo.idConsulta);
  const countMap = new Map(counts.map((c) => [c.idConsulta, Number(c.total)]));

  return {
    data: rows.map((r) => ({
      id: r.id,
      cursoId: r.cursoId,
      cursoTitulo: r.cursoTitulo,
      leccionId: r.leccionId,
      leccionTitulo: r.leccionTitulo ?? null,
      usuarioId: r.usuarioId,
      autor: `${r.autorNombre} ${r.autorApellido}`,
      tituloConsulta: r.tituloConsulta,
      mensajePregunta: r.mensajePregunta,
      fechaCreacion: r.fechaCreacion,
      estado: r.estado as EstadoForo,
      totalRespuestas: countMap.get(r.id) ?? 0,
    })),
    page,
    pageSize,
    total: Number(totalRes[0]?.count ?? 0),
  };
}

/**
 * RF-16, RF-17: Obtiene el detalle de un hilo de foro y todas sus respuestas cronológicas.
 */
export async function obtenerConsultaForoDetalle(
  user: SessionUser | null,
  rawId: unknown
) {
  requireAuth(user);
  const id = parseOrThrow(idParamSchema, rawId);

  const rows = await db
    .select({
      id: consultasForo.idConsulta,
      cursoId: consultasForo.idCurso,
      cursoTitulo: cursos.titulo,
      leccionId: consultasForo.idLeccion,
      leccionTitulo: lecciones.titulo,
      usuarioId: consultasForo.idUsuario,
      autorNombre: usuarios.nombre,
      autorApellido: usuarios.apellido,
      autorRol: roles.nombre,
      tituloConsulta: consultasForo.tituloConsulta,
      mensajePregunta: consultasForo.mensajePregunta,
      fechaCreacion: consultasForo.fechaCreacion,
      estado: consultasForo.estado,
    })
    .from(consultasForo)
    .innerJoin(cursos, eq(consultasForo.idCurso, cursos.idCurso))
    .innerJoin(usuarios, eq(consultasForo.idUsuario, usuarios.idUsuario))
    .innerJoin(roles, eq(usuarios.idRol, roles.idRol))
    .leftJoin(lecciones, eq(consultasForo.idLeccion, lecciones.idLeccion))
    .where(eq(consultasForo.idConsulta, id))
    .limit(1);

  const c = rows[0];
  if (!c) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Consulta de foro no encontrada.');
  }

  const resps = await db
    .select({
      id: respuestasForo.idRespuesta,
      consultaId: respuestasForo.idConsulta,
      usuarioId: respuestasForo.idUsuario,
      autorNombre: usuarios.nombre,
      autorApellido: usuarios.apellido,
      autorRol: roles.nombre,
      respuesta: respuestasForo.respuesta,
      fechaRespuesta: respuestasForo.fechaRespuesta,
    })
    .from(respuestasForo)
    .innerJoin(usuarios, eq(respuestasForo.idUsuario, usuarios.idUsuario))
    .innerJoin(roles, eq(usuarios.idRol, roles.idRol))
    .where(eq(respuestasForo.idConsulta, id))
    .orderBy(asc(respuestasForo.idRespuesta));

  return {
    id: c.id,
    cursoId: c.cursoId,
    cursoTitulo: c.cursoTitulo,
    leccionId: c.leccionId,
    leccionTitulo: c.leccionTitulo ?? null,
    usuarioId: c.usuarioId,
    autor: `${c.autorNombre} ${c.autorApellido}`,
    autorRol: c.autorRol as RolNombre,
    tituloConsulta: c.tituloConsulta,
    mensajePregunta: c.mensajePregunta,
    fechaCreacion: c.fechaCreacion,
    estado: c.estado as EstadoForo,
    respuestas: resps.map((r) => ({
      id: r.id,
      consultaId: r.consultaId,
      usuarioId: r.usuarioId,
      autor: `${r.autorNombre} ${r.autorApellido}`,
      autorRol: r.autorRol as RolNombre,
      respuesta: r.respuesta,
      fechaRespuesta: r.fechaRespuesta,
    })),
  };
}

/**
 * RF-16, RN-10: Crea una nueva consulta en estado 'abierta' asociada a un curso y opcionalmente a una lección.
 */
export async function crearConsultaForo(
  user: SessionUser | null,
  input: unknown
) {
  const authed = requireAuth(user);
  const data = parseOrThrow(crearConsultaForoSchema, input);

  const cursoExists = await db
    .select({ id: cursos.idCurso })
    .from(cursos)
    .where(eq(cursos.idCurso, data.cursoId))
    .limit(1);
  if (!cursoExists[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'El curso indicado no existe.');
  }

  const inserted = await db
    .insert(consultasForo)
    .values({
      idCurso: data.cursoId,
      idLeccion: data.leccionId ?? null,
      idUsuario: authed.id,
      tituloConsulta: data.tituloConsulta,
      mensajePregunta: data.mensajePregunta,
      fechaCreacion: nowIso(),
      estado: 'abierta',
    })
    .returning();

  return {
    id: inserted[0].idConsulta,
    cursoId: inserted[0].idCurso,
    leccionId: inserted[0].idLeccion,
    tituloConsulta: inserted[0].tituloConsulta,
    mensajePregunta: inserted[0].mensajePregunta,
    fechaCreacion: inserted[0].fechaCreacion,
    estado: inserted[0].estado as EstadoForo,
  };
}

/**
 * RF-16, RF-17, RN-10, CA-05: Edita o cambia estado de una consulta. Un alumno solo puede editar si no tiene respuestas previas.
 */
export async function editarConsultaForo(
  user: SessionUser | null,
  rawId: unknown,
  input: unknown
) {
  const authed = requireAuth(user);
  const id = parseOrThrow(idParamSchema, rawId);
  const data = parseOrThrow(editarConsultaForoSchema, input);

  const existing = await db
    .select()
    .from(consultasForo)
    .where(eq(consultasForo.idConsulta, id))
    .limit(1);

  const consulta = existing[0];
  if (!consulta) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Consulta no encontrada.');
  }

  const isMod = authed.rol === 'admin' || authed.rol === 'profesor';

  if (!isMod) {
    if (consulta.idUsuario !== authed.id) {
      throw new ApiError(403, 'SIN_PERMISO', 'Solo podés editar tus propias consultas.');
    }
    if (data.estado !== undefined) {
      throw new ApiError(403, 'SIN_PERMISO', 'Solo docentes o administradores pueden cambiar el estado del hilo.');
    }
    const respCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(respuestasForo)
      .where(eq(respuestasForo.idConsulta, id));
    if (Number(respCount[0]?.count ?? 0) > 0) {
      throw new ApiError(
        409,
        'CONSULTA_CON_RESPUESTAS',
        'No podés editar una consulta que ya recibió respuestas.'
      );
    }
  }

  const updated = await db
    .update(consultasForo)
    .set({
      ...(data.tituloConsulta !== undefined
        ? { tituloConsulta: data.tituloConsulta }
        : {}),
      ...(data.mensajePregunta !== undefined
        ? { mensajePregunta: data.mensajePregunta }
        : {}),
      ...(data.estado !== undefined ? { estado: data.estado } : {}),
    })
    .where(eq(consultasForo.idConsulta, id))
    .returning();

  return {
    id: updated[0].idConsulta,
    tituloConsulta: updated[0].tituloConsulta,
    mensajePregunta: updated[0].mensajePregunta,
    estado: updated[0].estado as EstadoForo,
  };
}

/**
 * RF-16, RF-17, RN-10, CA-05: Elimina una consulta. Un alumno solo puede borrar la suya si no tiene respuestas previas.
 */
export async function eliminarConsultaForo(
  user: SessionUser | null,
  rawId: unknown
) {
  const authed = requireAuth(user);
  const id = parseOrThrow(idParamSchema, rawId);

  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(consultasForo)
      .where(eq(consultasForo.idConsulta, id))
      .limit(1);

    const consulta = existing[0];
    if (!consulta) {
      throw new ApiError(404, 'NO_ENCONTRADO', 'Consulta no encontrada.');
    }

    const isMod = authed.rol === 'admin' || authed.rol === 'profesor';
    if (!isMod) {
      if (consulta.idUsuario !== authed.id) {
        throw new ApiError(403, 'SIN_PERMISO', 'Solo podés eliminar tus propias consultas.');
      }
      const respCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(respuestasForo)
        .where(eq(respuestasForo.idConsulta, id));
      if (Number(respCount[0]?.count ?? 0) > 0) {
        throw new ApiError(
          409,
          'CONSULTA_CON_RESPUESTAS',
          'No podés eliminar una consulta que ya tiene respuestas.'
        );
      }
    }

    await tx.delete(respuestasForo).where(eq(respuestasForo.idConsulta, id));
    await tx.delete(consultasForo).where(eq(consultasForo.idConsulta, id));
    return { mensaje: 'Consulta eliminada correctamente.' };
  });
}

/**
 * RF-16, RF-17, RN-10, CA-05: Publica respuesta en un hilo abierto; si responde un Profesor/Admin cambia estado a 'respondida'.
 */
export async function crearRespuestaForo(
  user: SessionUser | null,
  rawConsultaId: unknown,
  input: unknown
) {
  const authed = requireAuth(user);
  const consultaId = parseOrThrow(idParamSchema, rawConsultaId);
  const data = parseOrThrow(crearRespuestaForoSchema, input);

  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(consultasForo)
      .where(eq(consultasForo.idConsulta, consultaId))
      .limit(1);

    const consulta = existing[0];
    if (!consulta) {
      throw new ApiError(404, 'NO_ENCONTRADO', 'Consulta no encontrada.');
    }
    if (consulta.estado === 'cerrada') {
      throw new ApiError(
        422,
        'FORO_CERRADO',
        'Este hilo está cerrado y no admite nuevas respuestas.'
      );
    }

    const inserted = await tx
      .insert(respuestasForo)
      .values({
        idConsulta: consultaId,
        idUsuario: authed.id,
        respuesta: data.respuesta,
        fechaRespuesta: nowIso(),
      })
      .returning();

    let nextEstado = consulta.estado as EstadoForo;
    if (
      (authed.rol === 'profesor' || authed.rol === 'admin') &&
      consulta.estado === 'abierta'
    ) {
      nextEstado = 'respondida';
      await tx
        .update(consultasForo)
        .set({ estado: 'respondida' })
        .where(eq(consultasForo.idConsulta, consultaId));
    }

    return {
      id: inserted[0].idRespuesta,
      consultaId,
      usuarioId: authed.id,
      autor: `${authed.nombre} ${authed.apellido}`,
      autorRol: authed.rol,
      respuesta: inserted[0].respuesta,
      fechaRespuesta: inserted[0].fechaRespuesta,
      estadoConsulta: nextEstado,
    };
  });
}

/**
 * RF-17: Permite a Profesor/Pastor o Administrador eliminar una respuesta inapropiada del foro.
 */
export async function eliminarRespuestaForo(
  user: SessionUser | null,
  rawRespuestaId: unknown
) {
  requireRoles(user, ['admin', 'profesor']);
  const id = parseOrThrow(idParamSchema, rawRespuestaId);

  const existing = await db
    .select({ id: respuestasForo.idRespuesta })
    .from(respuestasForo)
    .where(eq(respuestasForo.idRespuesta, id))
    .limit(1);

  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Respuesta no encontrada.');
  }

  await db.delete(respuestasForo).where(eq(respuestasForo.idRespuesta, id));
  return { mensaje: 'Respuesta eliminada por moderación.' };
}
