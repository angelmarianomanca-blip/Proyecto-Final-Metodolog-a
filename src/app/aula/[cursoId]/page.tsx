import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Award, Check, Download, Play } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { obtenerCursoDetalle } from '@/services/cursos';
import { obtenerMiInscripcionPorCurso } from '@/services/inscripciones';
import { isApiError } from '@/lib/errors';
import { CampusShell } from '@/components/campus-shell';
import { Card, CardContent } from '@/components/ui/card';

export default async function AulaCursoResumenPage({
  params,
}: {
  params: Promise<{ cursoId: string }>;
}) {
  const [user, { cursoId }] = await Promise.all([getSessionUser(), params]);
  if (!user) redirect('/login');

  let curso;
  try {
    curso = await obtenerCursoDetalle(user, cursoId);
  } catch (err) {
    if (isApiError(err) && err.status === 404) notFound();
    throw err;
  }

  const inscripcion = await obtenerMiInscripcionPorCurso(user, curso.id);
  if (!inscripcion) {
    redirect(`/cursos/${curso.id}`);
  }

  const progMap = new Map(inscripcion.progreso.map((p) => [p.leccionId, p]));
  const allLecciones = curso.modulos.flatMap((m) => m.lecciones);
  const nextLeccion =
    allLecciones.find((l) => !progMap.get(l.id)?.completada) ?? allLecciones[0];

  return (
    <CampusShell user={user}>
      <div className="space-y-6">
        <div className="bg-[#241A13] text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-full bg-[#A46B29] text-white shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#E9D5B5] uppercase">
                {inscripcion.estado === 'finalizado'
                  ? 'Curso finalizado al 100% · CR-01'
                  : `Avance actual: ${inscripcion.porcentajeAvance}%`}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">{curso.titulo}</h1>
              <p className="text-sm text-[#D6CBB8] mt-1">
                {inscripcion.estado === 'finalizado'
                  ? `Certificado emitido con código único ${inscripcion.codigoCertificado}`
                  : `${inscripcion.leccionesCompletadas} de ${inscripcion.totalLecciones} lecciones completadas`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {inscripcion.estado === 'finalizado' && (
              <a
                href={`/api/inscripciones/${inscripcion.id}/certificado`}
                className="px-5 py-2.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold flex items-center gap-2 hover:bg-[#88561D]"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Certificado PDF</span>
              </a>
            )}
            {nextLeccion && (
              <Link
                href={`/aula/${curso.id}/lecciones/${nextLeccion.id}`}
                className="px-5 py-2.5 rounded-full border border-[#E9D5B5]/50 text-white text-xs font-semibold hover:bg-white/10"
              >
                {inscripcion.estado === 'finalizado'
                  ? 'Repasar lecciones'
                  : 'Ir a mi próxima lección →'}
              </Link>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-lg font-bold">Temario y progreso por lección</h2>
            {curso.modulos.map((m) => (
              <div key={m.id} className="space-y-1.5 pt-2">
                <div className="text-xs font-semibold text-[#66584B] uppercase">
                  {m.titulo}
                </div>
                {m.lecciones.map((l) => {
                  const done = progMap.get(l.id)?.completada ?? false;
                  return (
                    <Link
                      key={l.id}
                      href={`/aula/${curso.id}/lecciones/${l.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F1] border border-[#E3DACB] text-sm hover:border-[#A46B29] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={
                            done ? 'text-emerald-700' : 'text-[#A46B29]'
                          }
                        >
                          {done ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </span>
                        <span className="font-medium">{l.titulo}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#A46B29]">
                        Abrir →
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </CampusShell>
  );
}
