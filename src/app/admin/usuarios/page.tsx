import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listarUsuarios } from '@/services/usuarios';
import { listarCongregaciones } from '@/services/congregaciones';
import { CampusShell } from '@/components/campus-shell';
import { PageHeader, Stack } from '@/components/primitives';
import { AdminUsuariosClient } from '@/components/admin-usuarios-client';

export default async function AdminUsuariosPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'admin') redirect('/mi-aprendizaje');

  const [res, congRes] = await Promise.all([
    listarUsuarios(user, { page: '1', pageSize: '50' }),
    listarCongregaciones(null),
  ]);

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Administración"
          title="Usuarios y Roles"
          description="Administrá altas, roles, bajas lógicas y restablecimiento de contraseñas."
        />
        <AdminUsuariosClient
          currentAdminId={user.id}
          usuarios={res.data}
          congregaciones={congRes.data}
        />
      </Stack>
    </CampusShell>
  );
}
