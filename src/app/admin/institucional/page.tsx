import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listarInformacionInstitucional } from '@/services/institucional';
import { CampusShell } from '@/components/campus-shell';
import { PageHeader, Stack } from '@/components/primitives';
import { AdminInstitucionalClient } from '@/components/admin-institucional-client';

export default async function AdminInstitucionalPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'admin') redirect('/mi-aprendizaje');

  const { data } = await listarInformacionInstitucional();

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Administración · RF-18"
          title="Editor de Doctrinas e Información Institucional"
          description="Modificá los bloques públicos de Declaración de Fe, Doctrina, Visión y Creencias."
        />
        <AdminInstitucionalClient bloques={data} />
      </Stack>
    </CampusShell>
  );
}
