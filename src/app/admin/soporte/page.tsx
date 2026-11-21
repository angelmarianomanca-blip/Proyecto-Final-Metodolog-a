import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listarBaseSoporte } from '@/services/soporte';
import { CampusShell } from '@/components/campus-shell';
import { PageHeader, Stack } from '@/components/primitives';
import { AdminSoporteClient } from '@/components/admin-soporte-client';

export default async function AdminSoportePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'admin') redirect('/mi-aprendizaje');

  const { data } = await listarBaseSoporte();

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Administración"
          title="Base de Conocimiento del Bot Guía"
          description="Administrá preguntas frecuentes, instrucciones paso a paso y rutas sugeridas."
        />
        <AdminSoporteClient items={data} />
      </Stack>
    </CampusShell>
  );
}
