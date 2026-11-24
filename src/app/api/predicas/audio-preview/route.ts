import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { streamGoogleDriveAudio } from '@/lib/audio-proxy';

export const dynamic = 'force-dynamic';

/**
 * Proxy de vista previa en vivo para el formulario de Gestión de Prédicas (solo Profesor/Admin).
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || (user.rol !== 'admin' && user.rol !== 'profesor')) {
    return new Response('No autorizado.', { status: 403 });
  }

  const rawUrl = request.nextUrl.searchParams.get('url') ?? '';
  if (!rawUrl) {
    return new Response('Falta parámetro url.', { status: 400 });
  }

  return streamGoogleDriveAudio(rawUrl, request);
}
