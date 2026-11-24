'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Headphones,
  Search,
  Sparkles,
} from 'lucide-react';
import { formatFecha } from '@/lib/format';
import { parseAudioSource } from '@/lib/audio';
import {
  PredicaTranscript,
  estimateReadingMinutes,
} from '@/components/predica-transcript';

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

  const audioSource = React.useMemo(
    () => parseAudioSource(predica.urlArchivoAudio),
    [predica.urlArchivoAudio]
  );

  const readingMinutes = React.useMemo(
    () => estimateReadingMinutes(predica.textoTranscripcion),
    [predica.textoTranscripcion]
  );

  const handlePlay = React.useCallback(async () => {
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
  }, [counted, predica.id]);

  return (
    <div className="space-y-6">
      <div className="bg-[#241A13] text-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-lg">
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
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold tracking-tight">
              {predica.titulo}
            </h1>
            <p className="text-sm text-[#D6CBB8]">
              Predicador:{' '}
              <strong className="text-white">{predica.predicador}</strong>
            </p>
          </div>
          {isAuthenticated && (
            <Link
              href={`/asistente?predicaId=${predica.id}`}
              className="px-4 py-2 rounded-full border border-[#E9D5B5]/45 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#A46B29] hover:border-[#A46B29] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Consultar a IA sobre esta prédica</span>
            </Link>
          )}
        </div>

        <div className="bg-white/10 rounded-xl p-4 border border-white/15 space-y-2.5">
          <div className="text-xs text-[#E9D5B5] inline-flex items-center gap-1.5 font-medium">
            <Headphones className="w-3.5 h-3.5" />
            <span>Reproductor de Audio · Reproducción progresiva</span>
          </div>

          <audio
            controls
            controlsList="nodownload"
            preload="metadata"
            onPlay={handlePlay}
            className="w-full"
            src={
              audioSource.kind === 'google-drive'
                ? `/api/predicas/${predica.id}/audio`
                : audioSource.src
            }
          >
            Tu navegador no soporta audio HTML5.
          </audio>
        </div>
      </div>

      <article className="bg-white border border-[#E3DACB] rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-[#FAF7F1] border-b border-[#E3DACB] px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#A46B29]">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Estudio del Mensaje</span>
              <span className="text-[#C7B7A2]">•</span>
              <span className="inline-flex items-center gap-1 text-[#66584B] normal-case tracking-normal font-medium">
                <Clock className="w-3 h-3" />~{readingMinutes} min de lectura
              </span>
            </div>
            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-[#241A13]">
              Desarrollo de la Enseñanza
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#66584B] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en el mensaje..."
              className="w-full pl-9 pr-3 py-2 rounded-full border border-[#D6CBB8] bg-white text-xs focus:border-[#A46B29] focus:outline-none"
            />
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <PredicaTranscript
            text={predica.textoTranscripcion}
            highlightQuery={query}
          />
        </div>
      </article>
    </div>
  );
}
