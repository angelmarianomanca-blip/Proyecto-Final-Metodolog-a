import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listarCongregaciones } from '@/services/congregaciones';
import { listarMisInscripciones } from '@/services/inscripciones';
import { CampusShell } from '@/components/campus-shell';
import { PageHeader, Stack } from '@/components/primitives';
import { PerfilClient } from '@/components/perfil-client';

export default async function PerfilPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const [{ data: congregaciones }, { data: inscripciones }] = await Promise.all(
    [listarCongregaciones(null), listarMisInscripciones(user)]
  );

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Mi Cuenta · RF-04"
          title="Mi Perfil e Historial Académico"
          description="Actualizá tus datos personales, cambiá tu clave y descargá tus certificados."
        />
        <PerfilClient
          user={user}
          congregaciones={congregaciones}
          inscripciones={inscripciones}
        />
      </Stack>
    </CampusShell>
  );
}
