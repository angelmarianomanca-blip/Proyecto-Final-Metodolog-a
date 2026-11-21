import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  cursos,
  interaccionesChatIa,
  lecciones,
  modulos,
  predicas,
  transcripciones,
} from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';
import { ApiError } from '@/lib/errors';
import {
  chatIaSchema,
  idParamSchema,
  parseOrThrow,
  valorarIaSchema,
} from '@/lib/schemas';
import { nowIso, requireAuth } from './_helpers';

interface FuenteCorpus {
  tipo: 'leccion' | 'predica';
  id: number;
  titulo: string;
  ruta: string;
  extracto: string;
  score: number;
}

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
  'en', 'y', 'o', 'a', 'que', 'por', 'para', 'con', 'sin', 'sobre', 'como',
  'cual', 'cuales', 'que', 'quien', 'es', 'son', 'fue', 'ser', 'esta', 'este',
  'esta', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'nos', 'se', 'me', 'te',
  'le', 'lo', 'si', 'no', 'mas', 'pero', 'muy', 'ya', 'hay', 'todo', 'toda',
  'enseña', 'dice', 'habla', 'explica', 'explicame', 'significa',
]);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

function extraerKeywords(texto: string): string[] {
  return normalizar(texto)
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

function scoreTexto(texto: string, keywords: string[]): number {
  const norm = normalizar(texto);
  let score = 0;
  for (const kw of keywords) {
    if (norm.includes(kw)) {
      score += kw.length >= 6 ? 3 : 2;
    }
  }
  return score;
}

async function callExternalLlm(
  systemPrompt: string,
  userMessage: string
): Promise<string | null> {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) return null;

  const provider = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase();
  const model = process.env.AI_MODEL ?? 'gemini-2.5-flash';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content?.trim() || null;
    }

    // Default: Gemini
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.2 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * RF-13: Lista el historial de interacciones del Asistente IA del usuario autenticado.
 */
export async function listarMisInteraccionesIa(user: SessionUser | null) {
  const authed = requireAuth(user);
  const rows = await db
    .select()
    .from(interaccionesChatIa)
    .where(eq(interaccionesChatIa.idUsuario, authed.id))
    .orderBy(desc(interaccionesChatIa.idInteraccion))
    .limit(50);

  return {
    data: rows.map((r) => ({
      id: r.idInteraccion,
      cursoId: r.idCurso,
      leccionId: r.idLeccion,
      predicaId: r.idPredica,
      mensajeUsuario: r.mensajeUsuario,
      respuestaIa: r.respuestaIa,
      util: r.util,
      fechaHora: r.fechaHora,
    })),
  };
}

/**
 * RF-13, RF-14, RN-09, RNF-12, CA-04: Responde consultas pedagógicas estrictamente acotadas al corpus local (lecciones activas de cursos publicados y transcripciones 1:1) con fallback controlado ante falla de API externa.
 */
export async function consultarAsistenteIa(
  user: SessionUser | null,
  input: unknown
) {
  const authed = requireAuth(user);
  const data = parseOrThrow(chatIaSchema, input);
  const keywords = extraerKeywords(data.mensaje);

  // 1. Recuperar lecciones activas de cursos publicados
  const lecsRows = await db
    .select({
      idLeccion: lecciones.idLeccion,
      tituloLeccion: lecciones.titulo,
      contenidoTexto: lecciones.contenidoTexto,
      idCurso: cursos.idCurso,
      tituloCurso: cursos.titulo,
    })
    .from(lecciones)
    .innerJoin(modulos, eq(lecciones.idModulo, modulos.idModulo))
    .innerJoin(cursos, eq(modulos.idCurso, cursos.idCurso))
    .where(and(eq(lecciones.activo, true), eq(cursos.estado, 'publicado')));

  // 2. Recuperar transcripciones de prédicas
  const predRows = await db
    .select({
      idPredica: predicas.idPredica,
      titulo: predicas.titulo,
      predicador: predicas.predicador,
      pasajeBiblico: predicas.pasajeBiblico,
      textoTranscripcion: transcripciones.textoTranscripcion,
    })
    .from(predicas)
    .innerJoin(
      transcripciones,
      eq(predicas.idPredica, transcripciones.idPredica)
    );

  const candidatos: FuenteCorpus[] = [];

  for (const l of lecsRows) {
    let sc = scoreTexto(`${l.tituloCurso} ${l.tituloLeccion} ${l.contenidoTexto}`, keywords);
    if (sc > 0) {
      if (data.leccionId && l.idLeccion === data.leccionId) sc += 5;
      if (data.cursoId && l.idCurso === data.cursoId) sc += 3;
      candidatos.push({
        tipo: 'leccion',
        id: l.idLeccion,
        titulo: `${l.tituloCurso} · ${l.tituloLeccion}`,
        ruta: `/aula/${l.idCurso}/lecciones/${l.idLeccion}`,
        extracto: l.contenidoTexto.slice(0, 480),
        score: sc,
      });
    }
  }

  for (const p of predRows) {
    let sc = scoreTexto(
      `${p.titulo} ${p.predicador} ${p.pasajeBiblico} ${p.textoTranscripcion}`,
      keywords
    );
    if (sc > 0) {
      if (data.predicaId && p.idPredica === data.predicaId) sc += 5;
      candidatos.push({
        tipo: 'predica',
        id: p.idPredica,
        titulo: `Prédica · ${p.titulo} (${p.pasajeBiblico})`,
        ruta: `/predicas/${p.idPredica}`,
        extracto: p.textoTranscripcion.slice(0, 480),
        score: sc,
      });
    }
  }

  candidatos.sort((a, b) => b.score - a.score);
  const topFuentes = candidatos.slice(0, 3);

  let respuestaIa: string;
  if (topFuentes.length === 0) {
    // RN-09: Delimitación doctrinal estricta
    respuestaIa =
      'El tema consultado no se encuentra dentro del material formativo (lecciones y prédicas) cargado actualmente en la plataforma (RN-09). Te sugiero plantear tu inquietud en el Foro temático para recibir orientación directa de un pastor o docente.';
  } else {
    const contextoTexto = topFuentes
      .map((f, idx) => `[Fuente ${idx + 1}: ${f.titulo}]\n${f.extracto}`)
      .join('\n\n');

    const systemPrompt = [
      'Eres el Asistente Pedagógico de la Plataforma de Formación Teológica Autodidacta.',
      'REGLA ESTRICTA (RN-09): Responde EXCLUSIVAMENTE con base en los fragmentos del corpus provistos a continuación.',
      'Cita explícitamente la fuente (curso/lección o prédica) de donde tomás la respuesta.',
      'Si el contexto no responde la pregunta, indica claramente que el tema no está cubierto en el corpus y sugiere consultar en el foro con un pastor/docente.',
      'CONTEXTO RECUPERADO:',
      contextoTexto,
    ].join('\n');

    const llmReply = await callExternalLlm(systemPrompt, data.mensaje);
    if (llmReply) {
      respuestaIa = llmReply;
    } else {
      // RNF-12: Contingencia amigable sintetizando las citas encontradas del corpus
      const citas = topFuentes
        .map((f) => `• ${f.titulo}: «${f.extracto.slice(0, 220).trim()}...»`)
        .join('\n');
      respuestaIa = `Según el material formativo cargado en la plataforma, estos son los fragmentos relevantes encontrados en nuestro corpus local:\n\n${citas}\n\n(Nota: respuesta generada desde el corpus local en modo contingencia; podés profundizar abriendo las fuentes citadas o consultando en el Foro).`;
    }
  }

  const fechaHora = nowIso();
  const inserted = await db
    .insert(interaccionesChatIa)
    .values({
      idUsuario: authed.id,
      idCurso: data.cursoId ?? null,
      idLeccion: data.leccionId ?? null,
      idPredica: data.predicaId ?? null,
      mensajeUsuario: data.mensaje,
      respuestaIa,
      util: null,
      fechaHora,
    })
    .returning();

  return {
    id: inserted[0].idInteraccion,
    mensajeUsuario: data.mensaje,
    respuestaIa,
    fuentes: topFuentes.map((f) => ({
      tipo: f.tipo,
      id: f.id,
      titulo: f.titulo,
      ruta: f.ruta,
    })),
    util: null,
    fechaHora,
  };
}

/**
 * RF-14, CA-04: Registra la valoración «¿Te sirvió?» del usuario sobre una interacción propia.
 */
export async function valorarInteraccionIa(
  user: SessionUser | null,
  rawId: unknown,
  input: unknown
) {
  const authed = requireAuth(user);
  const id = parseOrThrow(idParamSchema, rawId);
  const data = parseOrThrow(valorarIaSchema, input);

  const existing = await db
    .select()
    .from(interaccionesChatIa)
    .where(eq(interaccionesChatIa.idInteraccion, id))
    .limit(1);

  if (!existing[0]) {
    throw new ApiError(404, 'NO_ENCONTRADO', 'Interacción no encontrada.');
  }
  if (existing[0].idUsuario !== authed.id) {
    throw new ApiError(403, 'SIN_PERMISO', 'Solo podés valorar tus propias consultas.');
  }

  await db
    .update(interaccionesChatIa)
    .set({ util: data.util })
    .where(eq(interaccionesChatIa.idInteraccion, id));

  return { id, util: data.util };
}
