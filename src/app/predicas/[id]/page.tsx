import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { obtenerPredicaDetalle } from '@/services/predicas';
import { isApiError } from '@/lib/errors';
import { PublicShell } from '@/components/public-shell';
import { PredicaPlayer } from '@/components/predica-player';
import { Stack } from '@/components/primitives';

export default async function PredicaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getSessionUser(), params]);

  let predica;
  try {
    predica = await obtenerPredicaDetalle(id);
  } catch (err) {
    if (isApiError(err) && err.status === 404) notFound();
    throw err;
  }

  return (
    <PublicShell user={user}>
      <Stack className="gap-5">
        <Link
          href="/predicas"
          className="text-xs font-semibold uppercase tracking-wider text-[#66584B] hover:text-[#241A13] inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver a prédicas</span>
        </Link>
        <PredicaPlayer predica={predica} isAuthenticated={Boolean(user)} />
      </Stack>
    </PublicShell>
  );
}
