import { extractGoogleDriveFileId } from '@/lib/audio';

const MAX_CHUNK_BYTES = 2 * 1024 * 1024; // 2 MB por petición Range (compatible con Vercel)

function parseRequestedRange(rangeHeader: string | null): {
  start: number;
  end: number;
} {
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/i);
    if (match) {
      const start = Number(match[1]);
      const requestedEnd = match[2] ? Number(match[2]) : null;
      if (Number.isFinite(start) && start >= 0) {
        const end =
          requestedEnd !== null &&
          Number.isFinite(requestedEnd) &&
          requestedEnd >= start &&
          requestedEnd - start + 1 <= MAX_CHUNK_BYTES
            ? requestedEnd
            : start + MAX_CHUNK_BYTES - 1;
        return { start, end };
      }
    }
  }
  return { start: 0, end: MAX_CHUNK_BYTES - 1 };
}

/**
 * Hace streaming seguro de un audio alojado en Google Drive en bloques Range de hasta 2 MB,
 * ocultando completamente el enlace de Google Drive al usuario final y permitiendo
 * reproducirlo en un <audio controls> nativo con adelanto/retroceso.
 */
export async function streamGoogleDriveAudio(
  rawUrl: string,
  request: Request
): Promise<Response> {
  const fileId = extractGoogleDriveFileId(rawUrl);
  if (!fileId) {
    return new Response('Enlace de audio inválido.', { status: 400 });
  }

  const { start, end } = parseRequestedRange(request.headers.get('range'));
  const driveDownloadUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;

  const upstream = await fetch(driveDownloadUrl, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      Range: `bytes=${start}-${end}`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    },
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response('No se pudo obtener el audio desde el origen.', {
      status: 502,
    });
  }

  const rawContentType = upstream.headers.get('content-type') ?? '';
  if (rawContentType.includes('text/html')) {
    return new Response(
      'El archivo en Google Drive no es accesible públicamente para reproducción directa.',
      { status: 502 }
    );
  }

  const contentType =
    !rawContentType || rawContentType.includes('octet-stream')
      ? 'audio/mpeg'
      : rawContentType;

  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'private, max-age=3600');

  const contentRange = upstream.headers.get('content-range');
  if (contentRange) {
    headers.set('Content-Range', contentRange);
  }
  const contentLength = upstream.headers.get('content-length');
  if (contentLength) {
    headers.set('Content-Length', contentLength);
  }

  return new Response(upstream.body, {
    status: upstream.status === 206 ? 206 : 200,
    headers,
  });
}
