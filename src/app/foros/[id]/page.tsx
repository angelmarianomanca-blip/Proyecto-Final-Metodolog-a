import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { obtenerConsultaForoDetalle } from '@/services/foros';
import { isApiError } from '@/lib/errors';
import { CampusShell } from '@/components/campus-shell';
import { ForoDetalleClient } from '@/components/foro-detalle-client';

export default async function ForoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getSessionUser(), params]);
  if (!user) redirect('/login');

  let consulta;
  try {
    consulta = await obtenerConsultaForoDetalle(user, id);
  } catch (err) {
    if (isApiError(err) && err.status === 404) notFound();
    throw err;
  }

  return (
    <CampusShell user={user}>
      <div className="space-y-4">
        <Link
          href="/foros"
          className="text-xs font-semibold uppercase tracking-wider text-[#66584B] hover:text-[#241A13] inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver a foros</span>
        </Link>
        <ForoDetalleClient user={user} consulta={consulta} />
      </div>
    </CampusShell>
  );
}
