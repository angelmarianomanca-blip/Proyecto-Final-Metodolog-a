'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, HelpCircle, Send, X } from 'lucide-react';
import { CATEGORIAS_SOPORTE } from '@/lib/constants';

interface BotRespuesta {
  categoria: string;
  pregunta: string;
  respuesta: string;
  rutaSugerida: string | null;
}

export function BotGuiaWidget({
  externalOpen,
  onExternalClose,
}: {
  externalOpen?: boolean;
  onExternalClose?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<BotRespuesta>({
    categoria: 'Inscripción',
    pregunta: '¿Cómo me inscribo a un curso?',
    respuesta:
      '1. Entrá a "Cursos Online" desde el menú superior.\n2. Elegí un curso publicado y presioná "Ver detalle e inscribirme".\n3. Hacé clic en "Inscribirme gratis". Todos los cursos son 100% gratuitos.',
    rutaSugerida: '/cursos',
  });

  const isOpen = externalOpen || open;
  const closeAll = () => {
    setOpen(false);
    onExternalClose?.();
  };

  const consultar = async (texto: string) => {
    const clean = texto.trim();
    if (!clean) return;
    setLoading(true);
    try {
      const res = await fetch('/api/soporte/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consulta: clean }),
      });
      if (res.ok) {
        const data = (await res.json()) as BotRespuesta;
        setResult(data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 px-4 py-3 rounded-full bg-[#A46B29] text-white shadow-xl flex items-center gap-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#88561D] border border-white/25 cursor-pointer"
        aria-label="Abrir Bot Guía"
      >
        <HelpCircle className="w-4 h-4" />
        <span>Bot Guía</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 w-full h-full sm:w-96 sm:h-auto sm:max-h-[540px] bg-white sm:border sm:border-[#D6CBB8] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#241A13]">
      <div className="bg-[#241A13] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#A46B29] flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold">Bot Guía de Navegación</div>
            <div className="text-xs text-[#E9D5B5]">
              Ayuda paso a paso · Base local
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={closeAll}
          className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
          aria-label="Cerrar Bot Guía"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto bg-[#FAF7F1]">
        <div className="text-xs font-semibold text-[#66584B]">
          Consultas frecuentes:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIAS_SOPORTE.map((cat) => {
            const active = result.categoria === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => consultar(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#241A13] text-white border-[#241A13]'
                    : 'bg-white border-[#E3DACB] hover:border-[#A46B29]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-[#E3DACB] rounded-2xl p-4 space-y-2.5 shadow-xs">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#F8EFE2] text-[#7C4F1D] text-xs font-semibold">
            {loading ? 'Buscando...' : result.categoria}
          </div>
          <div className="text-sm font-bold">{result.pregunta}</div>
          <p className="text-xs text-[#4A3B2E] whitespace-pre-line leading-relaxed">
            {result.respuesta}
          </p>
          {result.rutaSugerida && (
            <Link
              href={result.rutaSugerida}
              onClick={closeAll}
              className="mt-1 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold hover:bg-[#88561D]"
            >
              <span>Ir a {result.rutaSugerida}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          consultar(query);
        }}
        className="p-3 bg-white border-t border-[#E3DACB] flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribí tu duda operativa..."
          className="flex-1 px-3.5 py-2 rounded-full border border-[#D6CBB8] text-xs focus:border-[#A46B29] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-full bg-[#241A13] text-white text-xs font-semibold hover:bg-[#A46B29] flex items-center gap-1 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
}
