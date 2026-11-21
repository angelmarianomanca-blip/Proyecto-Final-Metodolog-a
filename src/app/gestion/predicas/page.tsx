import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listarPredicas } from '@/services/predicas';
import { CampusShell } from '@/components/campus-shell';
import { PageHeader, Stack } from '@/components/primitives';
import { GestionPredicasClient } from '@/components/gestion-predicas-client';

export default async function GestionPredicasPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'admin' && user.rol !== 'profesor') {
    redirect('/mi-aprendizaje');
  }

  const res = await listarPredicas({ page: '1', pageSize: '50' });

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Gestión Académica"
          title="Gestión de Prédicas y Transcripciones 1:1"
          description="Cargá audios con metadatos bíblicos obligatorios y su transcripción exclusiva 1:1."
        />
        <GestionPredicasClient predicas={res.data} />
      </Stack>
    </CampusShell>
  );
}
