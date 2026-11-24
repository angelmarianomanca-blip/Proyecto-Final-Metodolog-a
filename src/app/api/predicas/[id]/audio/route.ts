import { NextRequest } from 'next/server';
import { obtenerPredicaDetalle } from '@/services/predicas';
import { extractGoogleDriveFileId } from '@/lib/audio';
import { streamGoogleDriveAudio } from '@/lib/audio-proxy';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const predica = await obtenerPredicaDetalle(id);

    if (extractGoogleDriveFileId(predica.urlArchivoAudio)) {
      return await streamGoogleDriveAudio(predica.urlArchivoAudio, request);
    }

    return new Response('Esta prédica no utiliza proxy de Drive.', {
      status: 400,
    });
  } catch {
    return new Response('Audio no encontrado.', { status: 404 });
  }
}
