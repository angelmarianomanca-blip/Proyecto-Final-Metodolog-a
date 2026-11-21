import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Video } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { obtenerCursoDetalle } from '@/services/cursos';
import { obtenerMiInscripcionPorCurso } from '@/services/inscripciones';
import { formatFecha } from '@/lib/format';
import { isApiError } from '@/lib/errors';
import { PublicShell } from '@/components/public-shell';
import { InscribirseButton } from '@/components/inscribirse-button';
import { Stack } from '@/components/primitives';

export default async function CursoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getSessionUser(), params]);

  let curso;
  try {
    curso = await obtenerCursoDetalle(user, id);
  } catch (err) {
    if (isApiError(err) && err.status === 404) notFound();
    throw err;
  }

  const inscripcion = user
    ? await obtenerMiInscripcionPorCurso(user, curso.id)
    : null;

  const totalLecciones = curso.modulos.reduce(
    (acc, m) => acc + m.lecciones.length,
    0
  );

  return (
    <PublicShell user={user}>
      <Stack className="gap-6">
        <Link
          href="/cursos"
          className="text-xs font-semibold uppercase tracking-wider text-[#66584B] hover:text-[#241A13] inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al catálogo</span>
        </Link>

        <div className="bg-[#241A13] text-white rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold">
                Curso Publicado
              </span>
              <span className="text-xs text-[#D6CBB8]">
                Creado el {formatFecha(curso.fechaCreacion)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">{curso.titulo}</h1>
            <p className="text-sm sm:text-base text-[#D6CBB8] leading-relaxed">
              {curso.descripcion}
            </p>
            <div className="text-sm text-white pt-1">
              <strong>Docente a cargo:</strong> {curso.profesor}
            </div>
          </div>

          <div className="md:col-span-4 bg-[#FAF7F1] text-[#241A13] rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#66584B]">Módulos:</span>
                <strong>{curso.modulos.length}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66584B]">Lecciones activas:</span>
                <strong>{totalLecciones}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66584B]">Modalidad:</span>
                <strong>100% Asincrónico</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66584B]">Certificado PDF:</span>
                <strong className="text-emerald-700">Al llegar al 100%</strong>
              </div>
            </div>

            {!user ? (
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="block w-full text-center py-2.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#88561D]"
                >
                  Ingresar para inscribirme
                </Link>
                <Link
                  href="/registro"
                  className="block w-full text-center py-2 rounded-full border border-[#241A13] text-xs font-semibold"
                >
                  Crear cuenta gratuita
                </Link>
              </div>
            ) : inscripcion ? (
              <div className="space-y-2">
                <Link
                  href={`/aula/${curso.id}`}
                  className="block w-full text-center py-2.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#88561D]"
                >
                  Continuar en el Aula ({inscripcion.porcentajeAvance}%)
                </Link>
                {inscripcion.estado === 'finalizado' && (
                  <a
                    href={`/api/inscripciones/${inscripcion.id}/certificado`}
                    className="block w-full text-center py-2 rounded-full bg-emerald-700 text-white text-xs font-semibold"
                  >
                    Descargar Certificado PDF
                  </a>
                )}
              </div>
            ) : (
              <InscribirseButton cursoId={curso.id} />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold">Temario del curso</h2>
          {curso.modulos.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-[#E3DACB] rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-[#241A13] text-white flex items-center justify-between">
                <span className="font-semibold text-sm">{m.titulo}</span>
                <span className="text-xs text-[#E9D5B5]">
                  {m.lecciones.length} lecciones
                </span>
              </div>
              <div className="divide-y divide-[#E3DACB]">
                {m.lecciones.map((l) => (
                  <div
                    key={l.id}
                    className="px-5 py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Video className="w-4 h-4 text-[#A46B29] shrink-0" />
                      <span>{l.titulo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#66584B] shrink-0">
                      {l.archivoPdf && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F8EFE2] text-[#7C4F1D]">
                          PDF
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Stack>
    </PublicShell>
  );
}
