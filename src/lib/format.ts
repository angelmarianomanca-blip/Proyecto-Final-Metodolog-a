const AR_TZ = 'America/Argentina/Buenos_Aires';

export function formatFecha(iso?: string | null): string {
  if (!iso) return '—';
  // Si viene como YYYY-MM-DD sin hora, formateamos directo para evitar corrimiento UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: AR_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatFechaHora(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const fecha = new Intl.DateTimeFormat('es-AR', {
    timeZone: AR_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const hora = new Intl.DateTimeFormat('es-AR', {
    timeZone: AR_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${fecha} · ${hora}`;
}

export function formatPorcentaje(valor: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(valor)));
  return `${clamped}%`;
}

export function formatSegundos(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function getArgentinaDateRangeUtc(
  desde?: string,
  hasta?: string
): { desdeIso?: string; hastaIso?: string } {
  // Argentina es UTC-3 fijo (sin horario de verano)
  const desdeIso =
    desde && /^\d{4}-\d{2}-\d{2}$/.test(desde)
      ? `${desde}T03:00:00.000Z`
      : undefined;
  let hastaIso: string | undefined;
  if (hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
    const d = new Date(`${hasta}T03:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCMilliseconds(d.getUTCMilliseconds() - 1);
    hastaIso = d.toISOString();
  }
  return { desdeIso, hastaIso };
}

export function toVideoEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('vimeo.com')) {
      const match = u.pathname.match(/\/(\d+)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}
