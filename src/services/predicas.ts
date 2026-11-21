import { and, desc, eq, gte, like, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { predicas, transcripciones } from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';
import { ApiError } from '@/lib/errors';
import {
  crearPredicaSchema,
  editarPredicaSchema,
  idParamSchema,
  paginacionSchema,
  parseOrThrow,
} from '@/lib/schemas';
import { requireRoles } from './_helpers';

/**
 * RF-12, CA-03: Lista prédicas con búsqueda libre y filtros por predicador, pasaje bíblico y rango de fechas.
 */
export async function listarPredicas(query: {
  q?: string;
  predicador?: string;
  pasaje?: string;
  desde?: string;
  hasta?: string;
  page?: string;
  pageSize?: string;
}) {
  const { page, pageSize } = parseOrThrow(paginacionSchema, query);
  const conditions = [];

  if (query.q && query.q.trim()) {
    const pattern = `%${query.q.trim()}%`;
    conditions.push(
      or(
        like(predicas.titulo, pattern),
        like(predicas.predicador, pattern),
        like(predicas.pasajeBiblico, pattern),
        like(transcripciones.textoTranscripcion, pattern)
      )
    );
  }
  if (query.predicador && query.predicador.trim() && query.predicador !== 'todos') {
    conditions.push(like(predicas.predicador, `%${query.predicador.trim()}%`));
  }
  if (query.pasaje && query.pasaje.trim()) {
    conditions.push(like(predicas.pasajeBiblico, `%${query.pasaje.trim()}%`));
  }
  if (query.desde && /^\d{4}-\d{2}-\d{2}$/.test(query.desde)) {
    conditions.push(gte(predicas.fechaPredica, query.desde));
  }
  if (query.hasta && /^\d{4}-\d{2}-\d{2}$/.test(query.hasta)) {
    conditions.push(lte(predicas.fechaPredica, query.hasta));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(predicas)
    .leftJoin(transcripciones, eq(predicas.idPredica, transcripciones.idPredica))
    .where(whereClause);

  const rows = await db
    .select({
      id: predicas.idPredica,
      titulo: predicas.titulo,
      predicador: predicas.predicador,
      fechaPredica: predicas.fechaPredica,
      pasajeBiblico: predicas.pasajeBiblico,
      urlArchivoAudio: predicas.urlArchivoAudio,
      reproducciones: predicas.reproducciones,
      idProfesor: predicas.idProfesor,
      tieneTranscripcion: sql<boolean>`${transcripciones.idTranscripcion} is not null`,
    })
    .from(predicas)
    .leftJoin(transcripciones, eq(predicas.idPredica, transcripciones.idPredica))
    .where(whereClause)
    .orderBy(desc(predicas.fechaPredica), desc(predicas.idPredica))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    data: rows.map((r) => ({
      ...r,
      tieneTranscripcion: Boolean(r.tieneTranscripcion),
    })),
    page,
    pageSize,
    total: Number(totalRes[0]?.count ?? 0),
  };
}

/**
 * RF-12: Obtiene el detalle de una prédica junto con su transcripción exclusiva 1:1.
 */
export async function obtenerPredicaDetalle(rawId: unknown) {
  const id = parseOrThrow(idParamSchema, rawId);

  const rows = await db
    .select({
      id: predicas.idPredica,
      titulo: predicas.titulo,
      predicador: predicas.predicador,
      fechaPredica: predicas.fechaPredica,
      pasajeBiblico: predicas.pasajeBiblico,
      urlArchivoAudio: predicas.urlArchivoAudio,
      reproducciones: predicas.reproducciones,
      idProfesor: predicas.idProfesor,
      textoTranscripcion: transcripciones.textoTranscripcion,
    })
    .from(predicas)
    .leftJoin(transcripciones, eq(predicas.idPredica, transcripciones.idPredica))
    .where(eq(predicas.idPredica, id))
    .limit(1);

  if (!rows[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Prédica no encontrada.');
  }

  return {
    ...rows[0],
    textoTranscripcion: rows[0].textoTranscripcion ?? '',
  };
}

/**
 * RF-10, RF-11, RN-07, RN-08: Crea una prédica y su transcripción exclusiva 1:1 en una transacción atómica.
 */
export async function crearPredica(user: SessionUser | null, input: unknown) {
  const actor = requireRoles(user, ['admin', 'profesor']);
  const data = parseOrThrow(crearPredicaSchema, input);

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(predicas)
      .values({
        titulo: data.titulo,
        predicador: data.predicador,
        fechaPredica: data.fechaPredica,
        pasajeBiblico: data.pasajeBiblico,
        urlArchivoAudio: data.urlArchivoAudio,
        reproducciones: 0,
        idProfesor: actor.id,
      })
      .returning();

    const predica = inserted[0];

    await tx.insert(transcripciones).values({
      idPredica: predica.idPredica,
      textoTranscripcion: data.textoTranscripcion,
    });

    return {
      id: predica.idPredica,
      titulo: predica.titulo,
      predicador: predica.predicador,
      fechaPredica: predica.fechaPredica,
      pasajeBiblico: predica.pasajeBiblico,
      urlArchivoAudio: predica.urlArchivoAudio,
      reproducciones: predica.reproducciones,
      idProfesor: predica.idProfesor,
      textoTranscripcion: data.textoTranscripcion,
    };
  });
}

/**
 * RF-10, RF-11, RN-07, RN-08: Edita una prédica y su transcripción 1:1 en transacción atómica (solo Profesor/Admin).
 */
export async function editarPredica(
  user: SessionUser | null,
  rawId: unknown,
  input: unknown
) {
  requireRoles(user, ['admin', 'profesor']);
  const id = parseOrThrow(idParamSchema, rawId);
  const data = parseOrThrow(editarPredicaSchema, input);

  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(predicas)
      .where(eq(predicas.idPredica, id))
      .limit(1);

    if (!existing[0]) {
      throw new ApiError(404, 'NO_ENCONTRADO', 'Prédica no encontrada.');
    }

    const updatedRows = await tx
      .update(predicas)
      .set({
        ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
        ...(data.predicador !== undefined ? { predicador: data.predicador } : {}),
        ...(data.fechaPredica !== undefined
          ? { fechaPredica: data.fechaPredica }
          : {}),
        ...(data.pasajeBiblico !== undefined
          ? { pasajeBiblico: data.pasajeBiblico }
          : {}),
        ...(data.urlArchivoAudio !== undefined
          ? { urlArchivoAudio: data.urlArchivoAudio }
          : {}),
      })
      .where(eq(predicas.idPredica, id))
      .returning();

    let textoActual = '';
    const existingTr = await tx
      .select()
      .from(transcripciones)
      .where(eq(transcripciones.idPredica, id))
      .limit(1);

    if (data.textoTranscripcion !== undefined) {
      textoActual = data.textoTranscripcion;
      if (existingTr[0]) {
        await tx
          .update(transcripciones)
          .set({ textoTranscripcion: data.textoTranscripcion })
          .where(eq(transcripciones.idPredica, id));
      } else {
        await tx.insert(transcripciones).values({
          idPredica: id,
          textoTranscripcion: data.textoTranscripcion,
        });
      }
    } else {
      textoActual = existingTr[0]?.textoTranscripcion ?? '';
    }

    const p = updatedRows[0];
    return {
      id: p.idPredica,
      titulo: p.titulo,
      predicador: p.predicador,
      fechaPredica: p.fechaPredica,
      pasajeBiblico: p.pasajeBiblico,
      urlArchivoAudio: p.urlArchivoAudio,
      reproducciones: p.reproducciones,
      idProfesor: p.idProfesor,
      textoTranscripcion: textoActual,
    };
  });
}

/**
 * RF-12, RF-23: Incrementa el contador de reproducciones de una prédica.
 */
export async function registrarReproduccionPredica(rawId: unknown) {
  const id = parseOrThrow(idParamSchema, rawId);

  const existing = await db
    .select({ id: predicas.idPredica })
    .from(predicas)
    .where(eq(predicas.idPredica, id))
    .limit(1);

  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Prédica no encontrada.');
  }

  const updated = await db
    .update(predicas)
    .set({ reproducciones: sql`${predicas.reproducciones} + 1` })
    .where(eq(predicas.idPredica, id))
    .returning({
      id: predicas.idPredica,
      reproducciones: predicas.reproducciones,
    });

  return updated[0];
}
