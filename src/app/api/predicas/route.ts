import { apiHandler } from '@/lib/api/handler';
import { extractGoogleDriveFileId } from '@/lib/audio';
import { crearPredica, listarPredicas } from '@/services/predicas';

export const GET = apiHandler(async ({ user, searchParams }) => {
  const res = await listarPredicas({
    q: searchParams.get('q') ?? undefined,
    predicador: searchParams.get('predicador') ?? undefined,
    pasaje: searchParams.get('pasaje') ?? undefined,
    desde: searchParams.get('desde') ?? undefined,
    hasta: searchParams.get('hasta') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });
  const canSeeRawUrl = user?.rol === 'admin' || user?.rol === 'profesor';
  if (canSeeRawUrl) return res;
  return {
    ...res,
    data: res.data.map((p) =>
      extractGoogleDriveFileId(p.urlArchivoAudio)
        ? { ...p, urlArchivoAudio: `/api/predicas/${p.id}/audio` }
        : p
    ),
  };
});

export const POST = apiHandler(
  async ({ user, json }) => crearPredica(user, await json()),
  { requireAuth: true, status: 201 }
);
