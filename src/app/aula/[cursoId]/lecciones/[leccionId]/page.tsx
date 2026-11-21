import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { obtenerCursoDetalle } from '@/services/cursos';
import { obtenerMiInscripcionPorCurso } from '@/services/inscripciones';
import { isApiError } from '@/lib/errors';
import { CampusShell } from '@/components/campus-shell';
import { AulaLeccionClient } from '@/components/aula-leccion-client';

export default async function AulaLeccionPage({
  params,
}: {
  params: Promise<{ cursoId: string; leccionId: string }>;
}) {
  const [user, { cursoId, leccionId }] = await Promise.all([
    getSessionUser(),
    params,
  ]);
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

  const lid = Number(leccionId);
  const leccionActual = curso.modulos
    .flatMap((m) => m.lecciones)
    .find((l) => l.id === lid);

  if (!leccionActual) notFound();

  return (
    <CampusShell user={user}>
      <AulaLeccionClient
        curso={curso}
        leccionActual={leccionActual}
        inscripcion={inscripcion}
      />
    </CampusShell>
  );
}
