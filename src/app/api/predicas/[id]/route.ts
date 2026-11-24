import { apiHandler } from '@/lib/api/handler';
import { extractGoogleDriveFileId } from '@/lib/audio';
import { editarPredica, obtenerPredicaDetalle } from '@/services/predicas';

export const GET = apiHandler<{ id: string }>(async ({ user, params }) => {
  const p = await obtenerPredicaDetalle(params.id);
  const canSeeRawUrl = user?.rol === 'admin' || user?.rol === 'profesor';
  if (!canSeeRawUrl && extractGoogleDriveFileId(p.urlArchivoAudio)) {
    return { ...p, urlArchivoAudio: `/api/predicas/${p.id}/audio` };
  }
  return p;
});

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) => editarPredica(user, params.id, await json()),
  { requireAuth: true }
);
