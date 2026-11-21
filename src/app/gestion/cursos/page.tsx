import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listarCursos } from '@/services/cursos';
import { listarDocentes } from '@/services/usuarios';
import { CampusShell } from '@/components/campus-shell';
import { PageHeader, Stack } from '@/components/primitives';
import { GestionCursosClient } from '@/components/gestion-cursos-client';

export default async function GestionCursosPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'admin' && user.rol !== 'profesor') {
    redirect('/mi-aprendizaje');
  }

  const [cursosRes, docentes] = await Promise.all([
    listarCursos(user, { gestion: 'true', page: '1', pageSize: '50' }),
    listarDocentes(user),
  ]);

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Gestión Académica · RF-05"
          title="Mis Cursos (ABM)"
          description="Creá cursos en borrador, organizá sus módulos y lecciones, y publicalos en el catálogo."
        />
        <GestionCursosClient
          cursos={cursosRes.data}
          docentes={docentes}
          isAdmin={user.rol === 'admin'}
        />
      </Stack>
    </CampusShell>
  );
}
