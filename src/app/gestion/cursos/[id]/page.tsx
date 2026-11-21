import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { obtenerCursoDetalle } from '@/services/cursos';
import { isApiError } from '@/lib/errors';
import { CampusShell } from '@/components/campus-shell';
import { PageHeader, Stack } from '@/components/primitives';
import { GestionCursoEditorClient } from '@/components/gestion-curso-editor-client';

export default async function GestionCursoEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getSessionUser(), params]);
  if (!user) redirect('/login');
  if (user.rol !== 'admin' && user.rol !== 'profesor') {
    redirect('/mi-aprendizaje');
  }

  let curso;
  try {
    curso = await obtenerCursoDetalle(user, id, true);
  } catch (err) {
    if (isApiError(err) && err.status === 404) notFound();
    throw err;
  }

  return (
    <CampusShell user={user}>
      <Stack className="gap-5">
        <Link
          href="/gestion/cursos"
          className="text-xs font-semibold uppercase text-[#66584B] hover:text-[#241A13] inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver a Mis Cursos</span>
        </Link>
        <PageHeader
          eyebrow="Editor de Estructura · RF-05, RF-06"
          title={curso.titulo}
          description="Administrá módulos ordenados, videos YouTube/Vimeo, guías PDF y contenido de texto."
        />
        <GestionCursoEditorClient curso={curso} />
      </Stack>
    </CampusShell>
  );
}
