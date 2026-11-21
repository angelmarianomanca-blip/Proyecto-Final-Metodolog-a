'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';
import { formatFecha } from '@/lib/format';

export function PredicaPlayer({
  predica,
  isAuthenticated,
}: {
  predica: {
    id: number;
    titulo: string;
    predicador: string;
    fechaPredica: string;
    pasajeBiblico: string;
    urlArchivoAudio: string;
    reproducciones: number;
    textoTranscripcion: string;
  };
  isAuthenticated: boolean;
}) {
  const [reproducciones, setReproducciones] = React.useState(
    predica.reproducciones
  );
  const [counted, setCounted] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const handlePlay = async () => {
    if (counted) return;
    setCounted(true);
    try {
      const res = await fetch(`/api/predicas/${predica.id}/reproduccion`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = (await res.json()) as { reproducciones: number };
        setReproducciones(data.reproducciones);
      }
    } catch {
      // Silencioso en UI
    }
  };

  const paragraphs = predica.textoTranscripcion
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const renderHighlighted = (text: string) => {
    const q = query.trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark
          key={i}
          className="bg-[#E9D5B5] text-[#241A13] px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#241A13] text-white rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold">
                {predica.pasajeBiblico}
              </span>
              <span className="text-xs text-[#D6CBB8]">
                {formatFecha(predica.fechaPredica)} · {reproducciones}{' '}
                reproducciones
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">{predica.titulo}</h1>
            <p className="text-sm text-[#D6CBB8]">
              Predicador:{' '}
              <strong className="text-white">{predica.predicador}</strong>
            </p>
          </div>
          {isAuthenticated && (
            <Link
              href={`/asistente?predicaId=${predica.id}`}
              className="px-4 py-2 rounded-full border border-[#E9D5B5]/45 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#A46B29] hover:border-[#A46B29]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Consultar a IA sobre esta prédica</span>
            </Link>
          )}
        </div>

        <div className="bg-white/10 rounded-xl p-4 border border-white/15 space-y-2">
          <div className="text-xs text-[#E9D5B5]">
            Reproductor HTML5 Audio · Reproducción progresiva (RF-12)
          </div>
          <audio
            controls
            preload="metadata"
            onPlay={handlePlay}
            className="w-full"
            src={predica.urlArchivoAudio}
          >
            Tu navegador no soporta audio HTML5.
          </audio>
        </div>
      </div>

      <div className="bg-white border border-[#E3DACB] rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E3DACB]">
          <div>
            <h2 className="text-xl font-bold">Transcripción completa (1:1)</h2>
            <p className="text-xs text-[#66584B]">
              Lectura simultánea optimizada con buscador interno (RNF-06).
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#66584B] absolute left-3.5 top-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en transcripción..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full border border-[#D6CBB8] text-xs focus:border-[#A46B29] focus:outline-none"
            />
          </div>
        </div>

        <div className="font-serif-editorial text-base leading-loose text-[#2D221A] space-y-4 max-w-3xl">
          {paragraphs.map((par, i) => (
            <p key={i}>{renderHighlighted(par)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
