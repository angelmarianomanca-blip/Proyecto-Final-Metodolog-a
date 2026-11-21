import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  consultasForo,
  cursos,
  inscripciones,
  interaccionesChatIa,
  lecciones,
  modulos,
  predicas,
  progresoLecciones,
  roles,
  usuarios,
} from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';
import { requireRoles } from './_helpers';

function toArgentinaDayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  return parts; // YYYY-MM-DD
}

/**
 * RF-23, CA-06: Devuelve en una sola consulta los indicadores KPI y series para gráficos Chart.js (Profesor y Admin).
 */
export async function obtenerDatosTablero(
  user: SessionUser | null,
  dias = 7
) {
  requireRoles(user, ['admin', 'profesor']);
  const totalDias = dias === 30 ? 30 : 7;

  const [
    alumnosActivosRow,
    cursosPubRows,
    allInscripciones,
    allPredicas,
    forosAbiertosRow,
    allInteracciones,
    allForos,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(usuarios)
      .innerJoin(roles, eq(usuarios.idRol, roles.idRol))
      .where(and(eq(roles.nombre, 'alumno'), eq(usuarios.activo, true))),
    db
      .select({ id: cursos.idCurso, titulo: cursos.titulo })
      .from(cursos)
      .where(eq(cursos.estado, 'publicado')),
    db.select().from(inscripciones),
    db
      .select({
        id: predicas.idPredica,
        titulo: predicas.titulo,
        predicador: predicas.predicador,
        pasajeBiblico: predicas.pasajeBiblico,
        reproducciones: predicas.reproducciones,
      })
      .from(predicas)
      .orderBy(desc(predicas.reproducciones)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(consultasForo)
      .where(eq(consultasForo.estado, 'abierta')),
    db.select().from(interaccionesChatIa),
    db
      .select({ fechaCreacion: consultasForo.fechaCreacion })
      .from(consultasForo),
  ]);

  // Calcular avance por curso publicado
  const avancePorCurso = await Promise.all(
    cursosPubRows.map(async (c) => {
      const insCurso = allInscripciones.filter((i) => i.idCurso === c.id);
      const activas = await db
        .select({ idLeccion: lecciones.idLeccion })
        .from(lecciones)
        .innerJoin(modulos, eq(lecciones.idModulo, modulos.idModulo))
        .where(and(eq(modulos.idCurso, c.id), eq(lecciones.activo, true)));

      const activeIds = activas.map((a) => a.idLeccion);
      let sumaPct = 0;

      if (insCurso.length > 0 && activeIds.length > 0) {
        const insIds = insCurso.map((i) => i.idInscripcion);
        const progs = await db
          .select({
            idInscripcion: progresoLecciones.idInscripcion,
            completada: progresoLecciones.completada,
          })
          .from(progresoLecciones)
          .where(
            and(
              inArray(progresoLecciones.idInscripcion, insIds),
              inArray(progresoLecciones.idLeccion, activeIds)
            )
          );

        for (const ins of insCurso) {
          const comp = progs.filter(
            (p) => p.idInscripcion === ins.idInscripcion && p.completada
          ).length;
          sumaPct += Math.round((comp / activeIds.length) * 100);
        }
      }

      const finalizados = insCurso.filter((i) => i.estado === 'finalizado').length;
      const porcentajePromedio =
        insCurso.length > 0 ? Math.round(sumaPct / insCurso.length) : 0;

      return {
        cursoId: c.id,
        titulo: c.titulo,
        inscriptos: insCurso.length,
        finalizados,
        porcentajePromedio,
      };
    })
  );

  const tasaAvancePromedio =
    avancePorCurso.length > 0
      ? Math.round(
          avancePorCurso.reduce((acc, a) => acc + a.porcentajePromedio, 0) /
            avancePorCurso.length
        )
      : 0;

  const valoradas = allInteracciones.filter((i) => i.util !== null);
  const utiles = valoradas.filter((i) => i.util === true).length;
  const tasaUtilidadIa =
    valoradas.length > 0 ? Math.round((utiles / valoradas.length) * 100) : 0;

  const reproduccionesTotales = allPredicas.reduce(
    (acc, p) => acc + p.reproducciones,
    0
  );

  // Actividad semanal (últimos N días sin huecos, hora de Argentina)
  const diasKeys: string[] = [];
  const today = new Date();
  for (let i = totalDias - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    diasKeys.push(toArgentinaDayKey(d.toISOString()));
  }

  const insByDay = new Map<string, number>();
  for (const ins of allInscripciones) {
    const k = toArgentinaDayKey(ins.fechaInscripcion);
    insByDay.set(k, (insByDay.get(k) ?? 0) + 1);
  }

  const foroByDay = new Map<string, number>();
  for (const f of allForos) {
    const k = toArgentinaDayKey(f.fechaCreacion);
    foroByDay.set(k, (foroByDay.get(k) ?? 0) + 1);
  }

  const iaByDay = new Map<string, number>();
  for (const ia of allInteracciones) {
    const k = toArgentinaDayKey(ia.fechaHora);
    iaByDay.set(k, (iaByDay.get(k) ?? 0) + 1);
  }

  const actividadSemanal = diasKeys.map((k) => {
    const [, mm, dd] = k.split('-');
    return {
      fecha: k,
      etiqueta: `${dd}/${mm}`,
      inscripciones: insByDay.get(k) ?? 0,
      foros: foroByDay.get(k) ?? 0,
      ia: iaByDay.get(k) ?? 0,
    };
  });

  return {
    resumen: {
      alumnosActivos: Number(alumnosActivosRow[0]?.count ?? 0),
      cursosPublicados: cursosPubRows.length,
      inscripcionesTotales: allInscripciones.length,
      cursosFinalizados: allInscripciones.filter((i) => i.estado === 'finalizado')
        .length,
      tasaAvancePromedio,
      totalPredicas: allPredicas.length,
      reproduccionesTotales,
      consultasForoAbiertas: Number(forosAbiertosRow[0]?.count ?? 0),
      consultasIaTotales: allInteracciones.length,
      tasaUtilidadIa,
    },
    avancePorCurso,
    actividadSemanal,
    predicasMasEscuchadas: allPredicas.slice(0, 5),
  };
}
