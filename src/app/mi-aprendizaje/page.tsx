import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { listarMisInscripciones } from '@/services/inscripciones';
import { formatFecha } from '@/lib/format';
import { CampusShell } from '@/components/campus-shell';
import {
  EmptyState,
  Grid,
  PageHeader,
  Stack,
} from '@/components/primitives';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default async function MiAprendizajePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { data: inscripciones } = await listarMisInscripciones(user);
  const enCurso = inscripciones.filter((i) => i.estado === 'en_curso').length;
  const finalizados = inscripciones.filter(
    (i) => i.estado === 'finalizado'
  ).length;
  const promedio =
    inscripciones.length > 0
      ? Math.round(
          inscripciones.reduce((acc, i) => acc + i.porcentajeAvance, 0) /
            inscripciones.length
        )
      : 0;

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Campus Virtual"
          title="Mis Cursos y Progreso"
          description="Retomá tus lecciones desde el punto exacto donde dejaste y descargá tus certificados al llegar al 100%."
          action={
            <Link
              href="/cursos"
              className="px-4 py-2 rounded-full border border-[#241A13] bg-white text-xs font-semibold hover:bg-[#241A13] hover:text-white transition-colors"
            >
              + Explorar cursos
            </Link>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-[#66584B]">Cursos activos</div>
              <div className="text-2xl font-bold mt-1">{enCurso}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-[#66584B]">Finalizados</div>
              <div className="text-2xl font-bold mt-1 text-emerald-700">
                {finalizados}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-[#66584B]">Avance promedio</div>
              <div className="text-2xl font-bold mt-1">{promedio}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-[#66584B]">Certificados PDF</div>
              <div className="text-2xl font-bold mt-1 text-[#A46B29]">
                {finalizados}
              </div>
            </CardContent>
          </Card>
        </div>

        {inscripciones.length === 0 ? (
          <EmptyState
            title="Todavía no estás inscripto en ningún curso"
            description="Explorá el catálogo público e inscribite gratuitamente para comenzar a estudiar a tu ritmo."
            action={
              <Link
                href="/cursos"
                className="px-5 py-2 rounded-full bg-[#A46B29] text-white text-xs font-semibold"
              >
                Ir al Catálogo de Cursos
              </Link>
            }
          />
        ) : (
          <Grid>
            {inscripciones.map((ins) => (
              <Card key={ins.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={ins.estado} />
                    <span className="text-xs text-[#66584B]">
                      {ins.profesor}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{ins.cursoTitulo}</h2>
                    <p className="text-xs text-[#66584B] mt-1">
                      {ins.estado === 'finalizado'
                        ? `Completado el ${formatFecha(ins.fechaFinalizacion)} · Código ${ins.codigoCertificado}`
                        : `${ins.leccionesCompletadas} de ${ins.totalLecciones} lecciones completadas`}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Avance del curso</span>
                      <strong
                        className={
                          ins.porcentajeAvance === 100
                            ? 'text-emerald-700'
                            : 'text-[#241A13]'
                        }
                      >
                        {ins.porcentajeAvance}%
                      </strong>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#FAF7F1] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          ins.porcentajeAvance === 100
                            ? 'bg-emerald-600'
                            : 'bg-[#A46B29]'
                        }`}
                        style={{ width: `${ins.porcentajeAvance}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {ins.estado === 'finalizado' ? (
                      <>
                        <a
                          href={`/api/inscripciones/${ins.id}/certificado`}
                          className="flex-1 py-2.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#88561D]"
                        >
                          <Award className="w-4 h-4" />
                          <span>Descargar Certificado</span>
                        </a>
                        <Link
                          href={`/aula/${ins.cursoId}`}
                          className="px-4 py-2 rounded-full border border-[#D6CBB8] text-xs font-semibold flex items-center"
                        >
                          Repasar
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/aula/${ins.cursoId}`}
                        className="w-full py-2.5 rounded-full bg-[#241A13] text-white text-xs font-semibold text-center hover:bg-[#A46B29] transition-colors"
                      >
                        Continuar lección →
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </Grid>
        )}
      </Stack>
    </CampusShell>
  );
}
