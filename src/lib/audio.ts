export type ParsedAudioSource =
  | {
      kind: 'google-drive';
      fileId: string;
      embedUrl: string;
      originalUrl: string;
    }
  | {
      kind: 'native';
      src: string;
      isUploadedDataUrl: boolean;
    };

/**
 * Extrae el ID de un enlace público de Google Drive en cualquiera de sus formatos:
 * - https://drive.google.com/file/d/<ID>/view?usp=sharing
 * - https://drive.google.com/open?id=<ID>
 * - https://drive.google.com/uc?id=<ID>&export=download
 * - https://drive.usercontent.google.com/download?id=<ID>
 */
export function extractGoogleDriveFileId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const filePathMatch = trimmed.match(
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/i
  );
  if (filePathMatch?.[1]) return filePathMatch[1];

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'drive.google.com' ||
      host === 'docs.google.com' ||
      host === 'drive.usercontent.google.com'
    ) {
      const id = parsed.searchParams.get('id');
      if (id && /^[a-zA-Z0-9_-]{10,}$/.test(id)) {
        return id;
      }
    }
  } catch {
    // No es URL absoluta
  }

  return null;
}

/**
 * Normaliza enlaces de audio externos (Google Drive, Dropbox) o archivos locales
 * codificados en Data URL para reproducirlos de forma confiable en el navegador.
 */
export function parseAudioSource(rawUrl: string): ParsedAudioSource {
  const trimmed = rawUrl.trim();

  if (trimmed.startsWith('data:audio/')) {
    return {
      kind: 'native',
      src: trimmed,
      isUploadedDataUrl: true,
    };
  }

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return {
      kind: 'google-drive',
      fileId: driveId,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      originalUrl: trimmed,
    };
  }

  // Normalizar Dropbox (dl=0 -> raw=1)
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.toLowerCase().includes('dropbox.com')) {
      parsed.searchParams.delete('dl');
      parsed.searchParams.set('raw', '1');
      return {
        kind: 'native',
        src: parsed.toString(),
        isUploadedDataUrl: false,
      };
    }
  } catch {
    // Mantener tal cual (por ejemplo ruta relativa)
  }

  return {
    kind: 'native',
    src: trimmed,
    isUploadedDataUrl: false,
  };
}

export const MAX_LOCAL_AUDIO_BYTES = 3 * 1024 * 1024; // 3 MB (compatible con límite serverless de Vercel)
