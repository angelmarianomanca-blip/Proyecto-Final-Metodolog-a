import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { baseConocimientoSoporte } from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';
import { ApiError } from '@/lib/errors';
import {
  consultarSoporteSchema,
  crearSoporteSchema,
  editarSoporteSchema,
  idParamSchema,
  parseOrThrow,
} from '@/lib/schemas';
import { requireRoles } from './_helpers';

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * RF-15, CA-07: Lista toda la base de conocimiento del Bot Guía de navegación (público).
 */
export async function listarBaseSoporte() {
  const rows = await db
    .select()
    .from(baseConocimientoSoporte)
    .orderBy(asc(baseConocimientoSoporte.categoria), asc(baseConocimientoSoporte.idConocimiento));

  return {
    data: rows.map((r) => ({
      id: r.idConocimiento,
      pregunta: r.pregunta,
      respuesta: r.respuesta,
      categoria: r.categoria,
      rutaSugerida: r.rutaSugerida,
    })),
  };
}

/**
 * RF-15, CA-07: Resuelve consultas operativas del Bot Guía contra la base de conocimiento local.
 */
export async function consultarBotGuia(input: unknown) {
  const data = parseOrThrow(consultarSoporteSchema, input);
  const all = await db.select().from(baseConocimientoSoporte);
  const queryNorm = norm(data.consulta);
  const words = queryNorm.split(/\s+/).filter((w) => w.length >= 2);

  let best: (typeof all)[number] | null = null;
  let bestScore = 0;

  for (const item of all) {
    const hay = norm(`${item.categoria} ${item.pregunta} ${item.respuesta}`);
    let score = 0;
    if (norm(item.categoria) === queryNorm.trim()) score += 10;
    for (const w of words) {
      if (hay.includes(w)) score += w.length >= 5 ? 3 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (best && bestScore > 0) {
    return {
      encontrada: true,
      id: best.idConocimiento,
      categoria: best.categoria,
      pregunta: best.pregunta,
      respuesta: best.respuesta,
      rutaSugerida: best.rutaSugerida,
    };
  }

  return {
    encontrada: false,
    categoria: 'Ayuda general',
    pregunta: '¿En qué te puedo ayudar hoy?',
    respuesta:
      'No encontré una coincidencia exacta para tu consulta. Elegí una de las categorías frecuentes (Registro, Inscripción, Cursos, Prédicas, Foros o Recuperación de clave) para guiarte paso a paso.',
    rutaSugerida: '/cursos',
    opcionesFrecuentes: all.slice(0, 6).map((i) => ({
      id: i.idConocimiento,
      categoria: i.categoria,
      pregunta: i.pregunta,
      rutaSugerida: i.rutaSugerida,
    })),
  };
}

/**
 * RF-15: Crea una entrada en la base de conocimiento del Bot Guía (solo Administrador).
 */
export async function crearEntradaSoporte(
  user: SessionUser | null,
  input: unknown
) {
  requireRoles(user, ['admin']);
  const data = parseOrThrow(crearSoporteSchema, input);

  const inserted = await db
    .insert(baseConocimientoSoporte)
    .values({
      pregunta: data.pregunta,
      respuesta: data.respuesta,
      categoria: data.categoria,
      rutaSugerida: data.rutaSugerida || null,
    })
    .returning();

  return {
    id: inserted[0].idConocimiento,
    pregunta: inserted[0].pregunta,
    respuesta: inserted[0].respuesta,
    categoria: inserted[0].categoria,
    rutaSugerida: inserted[0].rutaSugerida,
  };
}

/**
 * RF-15: Edita una entrada existente de la base de conocimiento del Bot Guía (solo Administrador).
 */
export async function editarEntradaSoporte(
  user: SessionUser | null,
  rawId: unknown,
  input: unknown
) {
  requireRoles(user, ['admin']);
  const id = parseOrThrow(idParamSchema, rawId);
  const data = parseOrThrow(editarSoporteSchema, input);

  const existing = await db
    .select()
    .from(baseConocimientoSoporte)
    .where(eq(baseConocimientoSoporte.idConocimiento, id))
    .limit(1);

  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Entrada de soporte no encontrada.');
  }

  const updated = await db
    .update(baseConocimientoSoporte)
    .set({
      ...(data.pregunta !== undefined ? { pregunta: data.pregunta } : {}),
      ...(data.respuesta !== undefined ? { respuesta: data.respuesta } : {}),
      ...(data.categoria !== undefined ? { categoria: data.categoria } : {}),
      ...(data.rutaSugerida !== undefined
        ? { rutaSugerida: data.rutaSugerida || null }
        : {}),
    })
    .where(eq(baseConocimientoSoporte.idConocimiento, id))
    .returning();

  return {
    id: updated[0].idConocimiento,
    pregunta: updated[0].pregunta,
    respuesta: updated[0].respuesta,
    categoria: updated[0].categoria,
    rutaSugerida: updated[0].rutaSugerida,
  };
}

/**
 * RF-15: Elimina una entrada de la base de conocimiento del Bot Guía (solo Administrador).
 */
export async function eliminarEntradaSoporte(
  user: SessionUser | null,
  rawId: unknown
) {
  requireRoles(user, ['admin']);
  const id = parseOrThrow(idParamSchema, rawId);

  const existing = await db
    .select({ id: baseConocimientoSoporte.idConocimiento })
    .from(baseConocimientoSoporte)
    .where(eq(baseConocimientoSoporte.idConocimiento, id))
    .limit(1);

  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Entrada de soporte no encontrada.');
  }

  await db
    .delete(baseConocimientoSoporte)
    .where(eq(baseConocimientoSoporte.idConocimiento, id));

  return { mensaje: 'Entrada eliminada correctamente.' };
}
