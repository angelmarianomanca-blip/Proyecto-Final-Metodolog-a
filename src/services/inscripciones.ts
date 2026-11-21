import crypto from 'crypto';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db, type DbTransaction } from '@/db';
import {
  cursos,
  inscripciones,
  lecciones,
  modulos,
  progresoLecciones,
  usuarios,
} from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';
import type { EstadoInscripcion } from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import { generarCertificadoPdf } from '@/lib/pdf/certificado';
import {
  actualizarProgresoSchema,
  crearInscripcionSchema,
  idParamSchema,
  parseOrThrow,
} from '@/lib/schemas';
import { nowIso, requireAuth } from './_helpers';

/**
 * Helper transaccional (usa EXCLUSIVAMENTE tx): genera un código único de certificado (CR-01).
 */
async function generarCodigoCertificadoTx(tx: DbTransaction): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 8; i++) {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `TEO-${year}-${suffix}`;
    const exists = await tx
      .select({ id: inscripciones.idInscripcion })
      .from(inscripciones)
      .where(eq(inscripciones.codigoCertificado, code))
      .limit(1);
    if (exists.length === 0) return code;
  }
  return `TEO-${year}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Helper transaccional (usa EXCLUSIVAMENTE tx): recalcula avance sobre lecciones activas y finaliza al 100% (RN-05).
 */
export async function recalcularAvanceInscripcionTx(
  tx: DbTransaction,
  inscripcionId: number
) {
  const insRows = await tx
    .select()
    .from(inscripciones)
    .where(eq(inscripciones.idInscripcion, inscripcionId))
    .limit(1);

  const ins = insRows[0];
  if (!ins) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Inscripción no encontrada.');
  }

  const leccionesActivas = await tx
    .select({ idLeccion: lecciones.idLeccion })
    .from(lecciones)
    .innerJoin(modulos, eq(lecciones.idModulo, modulos.idModulo))
    .where(and(eq(modulos.idCurso, ins.idCurso), eq(lecciones.activo, true)));

  const totalActivas = leccionesActivas.length;
  const activeIds = leccionesActivas.map((l) => l.idLeccion);

  let completadas = 0;
  if (activeIds.length > 0) {
    const progs = await tx
      .select({ completada: progresoLecciones.completada })
      .from(progresoLecciones)
      .where(
        and(
          eq(progresoLecciones.idInscripcion, inscripcionId),
          inArray(progresoLecciones.idLeccion, activeIds)
        )
      );
    completadas = progs.filter((p) => p.completada).length;
  }

  const porcentajeAvance =
    totalActivas > 0 ? Math.round((completadas / totalActivas) * 100) : 0;

  let estadoInscripcion = ins.estado as EstadoInscripcion;
  let fechaFinalizacion = ins.fechaFinalizacion;
  let codigoCertificado = ins.codigoCertificado;

  if (totalActivas > 0 && porcentajeAvance === 100) {
    estadoInscripcion = 'finalizado';
    fechaFinalizacion = fechaFinalizacion ?? nowIso();
    if (!codigoCertificado) {
      codigoCertificado = await generarCodigoCertificadoTx(tx);
    }
    await tx
      .update(inscripciones)
      .set({
        estado: estadoInscripcion,
        fechaFinalizacion,
        codigoCertificado,
      })
      .where(eq(inscripciones.idInscripcion, inscripcionId));
  }

  return {
    totalActivas,
    completadas,
    porcentajeAvance,
    estadoInscripcion,
    fechaFinalizacion,
    codigoCertificado,
  };
}

/**
 * RF-04, RF-09: Lista las inscripciones del usuario autenticado con porcentaje de avance calculado.
 */
export async function listarMisInscripciones(user: SessionUser | null) {
  const authed = requireAuth(user);

  const rows = await db
    .select({
      id: inscripciones.idInscripcion,
      cursoId: inscripciones.idCurso,
      estado: inscripciones.estado,
      fechaInscripcion: inscripciones.fechaInscripcion,
      fechaFinalizacion: inscripciones.fechaFinalizacion,
      codigoCertificado: inscripciones.codigoCertificado,
      cursoTitulo: cursos.titulo,
      cursoDescripcion: cursos.descripcion,
      profesorNombre: usuarios.nombre,
      profesorApellido: usuarios.apellido,
    })
    .from(inscripciones)
    .innerJoin(cursos, eq(inscripciones.idCurso, cursos.idCurso))
    .innerJoin(usuarios, eq(cursos.idProfesor, usuarios.idUsuario))
    .where(eq(inscripciones.idUsuario, authed.id))
    .orderBy(desc(inscripciones.idInscripcion));

  const enriched = await Promise.all(
    rows.map(async (r) => {
      const activas = await db
        .select({ idLeccion: lecciones.idLeccion })
        .from(lecciones)
        .innerJoin(modulos, eq(lecciones.idModulo, modulos.idModulo))
        .where(and(eq(modulos.idCurso, r.cursoId), eq(lecciones.activo, true)));

      const activeIds = activas.map((a) => a.idLeccion);
      let completadas = 0;
      if (activeIds.length > 0) {
        const progs = await db
          .select({ completada: progresoLecciones.completada })
          .from(progresoLecciones)
          .where(
            and(
              eq(progresoLecciones.idInscripcion, r.id),
              inArray(progresoLecciones.idLeccion, activeIds)
            )
          );
        completadas = progs.filter((p) => p.completada).length;
      }

      const porcentajeAvance =
        activeIds.length > 0
          ? Math.round((completadas / activeIds.length) * 100)
          : 0;

      return {
        id: r.id,
        cursoId: r.cursoId,
        estado: r.estado as EstadoInscripcion,
        fechaInscripcion: r.fechaInscripcion,
        fechaFinalizacion: r.fechaFinalizacion,
        codigoCertificado: r.codigoCertificado,
        cursoTitulo: r.cursoTitulo,
        cursoDescripcion: r.cursoDescripcion,
        profesor: `${r.profesorNombre} ${r.profesorApellido}`,
        totalLecciones: activeIds.length,
        leccionesCompletadas: completadas,
        porcentajeAvance,
      };
    })
  );

  return { data: enriched };
}

/**
 * RF-08, RN-04, RN-06: Inscribe gratuitamente a un usuario autenticado en un curso publicado e inicializa su progreso en transacción.
 */
export async function inscribirEnCurso(
  user: SessionUser | null,
  input: unknown
) {
  const authed = requireAuth(user);
  const data = parseOrThrow(crearInscripcionSchema, input);

  return db.transaction(async (tx) => {
    const cursoRows = await tx
      .select()
      .from(cursos)
      .where(eq(cursos.idCurso, data.cursoId))
      .limit(1);

    const curso = cursoRows[0];
    if (!curso || curso.estado !== 'publicado') {
      throw new ApiError(
        422,
        'CURSO_NO_PUBLICADO',
        'El curso no existe o no se encuentra publicado para inscripciones.'
      );
    }

    const dup = await tx
      .select({ id: inscripciones.idInscripcion })
      .from(inscripciones)
      .where(
        and(
          eq(inscripciones.idUsuario, authed.id),
          eq(inscripciones.idCurso, data.cursoId)
        )
      )
      .limit(1);

    if (dup.length > 0) {
      throw new ApiError(
        409,
        'YA_INSCRIPTO',
        'Ya estás inscripto en este curso.'
      );
    }

    const ins = await tx
      .insert(inscripciones)
      .values({
        idUsuario: authed.id,
        idCurso: data.cursoId,
        estado: 'en_curso',
        fechaInscripcion: nowIso(),
      })
      .returning();

    const inscripcionId = ins[0].idInscripcion;

    const lecs = await tx
      .select({ idLeccion: lecciones.idLeccion })
      .from(lecciones)
      .innerJoin(modulos, eq(lecciones.idModulo, modulos.idModulo))
      .where(
        and(eq(modulos.idCurso, data.cursoId), eq(lecciones.activo, true))
      );

    if (lecs.length > 0) {
      await tx.insert(progresoLecciones).values(
        lecs.map((l) => ({
          idInscripcion: inscripcionId,
          idLeccion: l.idLeccion,
          completada: false,
          segundoActual: 0,
        }))
      );
    }

    return {
      id: inscripcionId,
      cursoId: data.cursoId,
      estado: 'en_curso' as EstadoInscripcion,
      fechaInscripcion: ins[0].fechaInscripcion,
      porcentajeAvance: 0,
    };
  });
}

/**
 * RF-09: Obtiene detalle de una inscripción (propia o Profesor/Admin) con progreso por lección.
 */
export async function obtenerInscripcionDetalle(
  user: SessionUser | null,
  rawId: unknown
) {
  const authed = requireAuth(user);
  const id = parseOrThrow(idParamSchema, rawId);

  const rows = await db
    .select()
    .from(inscripciones)
    .where(eq(inscripciones.idInscripcion, id))
    .limit(1);

  const ins = rows[0];
  if (!ins) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Inscripción no encontrada.');
  }

  const isManager = authed.rol === 'admin' || authed.rol === 'profesor';
  if (ins.idUsuario !== authed.id && !isManager) {
    throw new ApiError(403, 'SIN_PERMISO', 'No tenés permiso para ver esta inscripción.');
  }

  return buildInscripcionPorCurso(ins);
}

/**
 * RF-09: Obtiene la inscripción y progreso del usuario autenticado para un curso específico.
 */
export async function obtenerMiInscripcionPorCurso(
  user: SessionUser | null,
  rawCursoId: unknown
) {
  const authed = requireAuth(user);
  const cursoId = parseOrThrow(idParamSchema, rawCursoId);

  const rows = await db
    .select()
    .from(inscripciones)
    .where(
      and(
        eq(inscripciones.idUsuario, authed.id),
        eq(inscripciones.idCurso, cursoId)
      )
    )
    .limit(1);

  if (!rows[0]) return null;
  return buildInscripcionPorCurso(rows[0]);
}

async function buildInscripcionPorCurso(ins: typeof inscripciones.$inferSelect) {
  const mods = await db
    .select()
    .from(modulos)
    .where(eq(modulos.idCurso, ins.idCurso))
    .orderBy(asc(modulos.ordenSecuencia), asc(modulos.idModulo));

  const modIds = mods.map((m) => m.idModulo);
  const lecs =
    modIds.length > 0
      ? await db
          .select()
          .from(lecciones)
          .where(and(inArray(lecciones.idModulo, modIds), eq(lecciones.activo, true)))
          .orderBy(asc(lecciones.ordenSecuencia), asc(lecciones.idLeccion))
      : [];

  const progs = await db
    .select()
    .from(progresoLecciones)
    .where(eq(progresoLecciones.idInscripcion, ins.idInscripcion));

  const progMap = new Map(progs.map((p) => [p.idLeccion, p]));
  const completadas = lecs.filter((l) => progMap.get(l.idLeccion)?.completada).length;
  const porcentajeAvance =
    lecs.length > 0 ? Math.round((completadas / lecs.length) * 100) : 0;

  return {
    id: ins.idInscripcion,
    cursoId: ins.idCurso,
    estado: ins.estado as EstadoInscripcion,
    fechaInscripcion: ins.fechaInscripcion,
    fechaFinalizacion: ins.fechaFinalizacion,
    codigoCertificado: ins.codigoCertificado,
    porcentajeAvance,
    totalLecciones: lecs.length,
    leccionesCompletadas: completadas,
    progreso: lecs.map((l) => {
      const p = progMap.get(l.idLeccion);
      return {
        leccionId: l.idLeccion,
        completada: p?.completada ?? false,
        segundoActual: p?.segundoActual ?? 0,
        fechaCompletado: p?.fechaCompletado ?? null,
      };
    }),
  };
}

/**
 * RF-09, RN-05, CR-01: Actualiza progreso de una lección, recalcula avance y genera certificado al 100% en transacción.
 */
export async function actualizarProgresoLeccion(
  user: SessionUser | null,
  rawInscripcionId: unknown,
  rawLeccionId: unknown,
  input: unknown
) {
  const authed = requireAuth(user);
  const inscripcionId = parseOrThrow(idParamSchema, rawInscripcionId);
  const leccionId = parseOrThrow(idParamSchema, rawLeccionId);
  const data = parseOrThrow(actualizarProgresoSchema, input);

  return db.transaction(async (tx) => {
    const insRows = await tx
      .select()
      .from(inscripciones)
      .where(eq(inscripciones.idInscripcion, inscripcionId))
      .limit(1);

    const ins = insRows[0];
    if (!ins) {
      throw new ApiError(404, 'NO_ENCONTRADO', 'Inscripción no encontrada.');
    }
    if (ins.idUsuario !== authed.id) {
      throw new ApiError(403, 'SIN_PERMISO', 'Esta inscripción no te pertenece.');
    }

    const lecRows = await tx
      .select({ idLeccion: lecciones.idLeccion })
      .from(lecciones)
      .innerJoin(modulos, eq(lecciones.idModulo, modulos.idModulo))
      .where(
        and(
          eq(lecciones.idLeccion, leccionId),
          eq(modulos.idCurso, ins.idCurso),
          eq(lecciones.activo, true)
        )
      )
      .limit(1);

    if (!lecRows[0]) {
      throw new ApiError(
        404,
        'NO_ENCONTRADO',
        'La lección activa no pertenece a este curso.'
      );
    }

    const existingProg = await tx
      .select()
      .from(progresoLecciones)
      .where(
        and(
          eq(progresoLecciones.idInscripcion, inscripcionId),
          eq(progresoLecciones.idLeccion, leccionId)
        )
      )
      .limit(1);

    const nextCompletada =
      data.completada !== undefined
        ? data.completada
        : (existingProg[0]?.completada ?? false);
    const nextSegundo =
      data.segundoActual !== undefined
        ? data.segundoActual
        : (existingProg[0]?.segundoActual ?? 0);
    const nextFechaComp = nextCompletada
      ? (existingProg[0]?.fechaCompletado ?? nowIso())
      : null;

    if (existingProg[0]) {
      await tx
        .update(progresoLecciones)
        .set({
          completada: nextCompletada,
          segundoActual: nextSegundo,
          fechaCompletado: nextFechaComp,
        })
        .where(eq(progresoLecciones.idProgreso, existingProg[0].idProgreso));
    } else {
      await tx.insert(progresoLecciones).values({
        idInscripcion: inscripcionId,
        idLeccion: leccionId,
        completada: nextCompletada,
        segundoActual: nextSegundo,
        fechaCompletado: nextFechaComp,
      });
    }

    const calc = await recalcularAvanceInscripcionTx(tx, inscripcionId);

    return {
      leccionId,
      completada: nextCompletada,
      segundoActual: nextSegundo,
      porcentajeAvance: calc.porcentajeAvance,
      estadoInscripcion: calc.estadoInscripcion,
      codigoCertificado: calc.codigoCertificado,
    };
  });
}

/**
 * RF-22 (CR-01), CA-08: Emite y devuelve el PDF vectorizado del certificado si la inscripción está finalizada al 100%.
 */
export async function obtenerCertificadoPdf(
  user: SessionUser | null,
  rawInscripcionId: unknown
): Promise<{ pdf: Uint8Array; filename: string }> {
  const authed = requireAuth(user);
  const inscripcionId = parseOrThrow(idParamSchema, rawInscripcionId);

  const rows = await db
    .select({
      id: inscripciones.idInscripcion,
      idUsuario: inscripciones.idUsuario,
      estado: inscripciones.estado,
      fechaFinalizacion: inscripciones.fechaFinalizacion,
      codigoCertificado: inscripciones.codigoCertificado,
      alumnoNombre: usuarios.nombre,
      alumnoApellido: usuarios.apellido,
      cursoTitulo: cursos.titulo,
      idProfesor: cursos.idProfesor,
    })
    .from(inscripciones)
    .innerJoin(usuarios, eq(inscripciones.idUsuario, usuarios.idUsuario))
    .innerJoin(cursos, eq(inscripciones.idCurso, cursos.idCurso))
    .where(eq(inscripciones.idInscripcion, inscripcionId))
    .limit(1);

  const ins = rows[0];
  if (!ins) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Inscripción no encontrada.');
  }

  const isManager = authed.rol === 'admin' || authed.rol === 'profesor';
  if (ins.idUsuario !== authed.id && !isManager) {
    throw new ApiError(403, 'SIN_PERMISO', 'No tenés permiso para descargar este certificado.');
  }

  if (ins.estado !== 'finalizado' || !ins.codigoCertificado) {
    throw new ApiError(
      422,
      'CURSO_NO_FINALIZADO',
      'El certificado solo está disponible al completar el 100% del curso.'
    );
  }

  const profRows = await db
    .select({ nombre: usuarios.nombre, apellido: usuarios.apellido })
    .from(usuarios)
    .where(eq(usuarios.idUsuario, ins.idProfesor))
    .limit(1);

  const profName = profRows[0]
    ? `${profRows[0].nombre} ${profRows[0].apellido}`
    : 'Equipo Docente';

  const pdf = await generarCertificadoPdf({
    nombreCompleto: `${ins.alumnoNombre} ${ins.alumnoApellido}`,
    tituloCurso: ins.cursoTitulo,
    fechaFinalizacion: ins.fechaFinalizacion ?? nowIso(),
    codigoCertificado: ins.codigoCertificado,
    profesor: profName,
  });

  return {
    pdf,
    filename: `Certificado_${ins.codigoCertificado}.pdf`,
  };
}
