import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listarMisInteraccionesIa } from '@/services/ia';
import { listarCursos } from '@/services/cursos';
import { listarPredicas } from '@/services/predicas';
import { CampusShell } from '@/components/campus-shell';
import { AsistenteClient } from '@/components/asistente-client';

export default async function AsistentePage({
  searchParams,
}: {
  searchParams: Promise<{
    cursoId?: string;
    leccionId?: string;
    predicaId?: string;
  }>;
}) {
  const [user, sp] = await Promise.all([getSessionUser(), searchParams]);
  if (!user) redirect('/login');

  const [hist, cursosRes, predicasRes] = await Promise.all([
    listarMisInteraccionesIa(user),
    listarCursos(user, { page: '1', pageSize: '50' }),
    listarPredicas({ page: '1', pageSize: '50' }),
  ]);

  return (
    <CampusShell user={user}>
      <AsistenteClient
        initialHistory={hist.data}
        cursos={cursosRes.data}
        predicas={predicasRes.data}
        defaultCursoId={sp.cursoId ? Number(sp.cursoId) : undefined}
        defaultLeccionId={sp.leccionId ? Number(sp.leccionId) : undefined}
        defaultPredicaId={sp.predicaId ? Number(sp.predicaId) : undefined}
      />
    </CampusShell>
  );
}
