import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listarCongregaciones } from '@/services/congregaciones';
import { CampusShell } from '@/components/campus-shell';
import { PageHeader, Stack } from '@/components/primitives';
import { AdminCongregacionesClient } from '@/components/admin-congregaciones-client';

export default async function AdminCongregacionesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'admin') redirect('/mi-aprendizaje');

  const { data } = await listarCongregaciones(user);

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Administración"
          title="Congregaciones y Sedes"
          description="Alta, edición y baja lógica de las congregaciones asociadas."
        />
        <AdminCongregacionesClient congregaciones={data} />
      </Stack>
    </CampusShell>
  );
}
