'use client';

import * as React from 'react';
import Link from 'next/link';
import { Send, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatFechaHora } from '@/lib/format';
import { Button } from '@/components/ui/button';

interface InteraccionItem {
  id: number;
  mensajeUsuario: string;
  respuestaIa: string;
  util: boolean | null;
  fechaHora: string;
  fuentes?: Array<{ tipo: string; id: number; titulo: string; ruta: string }>;
}

export function AsistenteClient({
  initialHistory,
  cursos,
  predicas,
  defaultCursoId,
  defaultLeccionId,
  defaultPredicaId,
}: {
  initialHistory: InteraccionItem[];
  cursos: Array<{ id: number; titulo: string }>;
  predicas: Array<{ id: number; titulo: string }>;
  defaultCursoId?: number;
  defaultLeccionId?: number;
  defaultPredicaId?: number;
}) {
  const [messages, setMessages] = React.useState<InteraccionItem[]>(
    [...initialHistory].reverse()
  );
  const [contexto, setContexto] = React.useState(
    defaultPredicaId
      ? `predica-${defaultPredicaId}`
      : defaultCursoId
        ? `curso-${defaultCursoId}`
        : 'general'
  );
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const enviar = async (texto: string) => {
    const clean = texto.trim();
    if (clean.length < 3) {
      toast.error('Escribí al menos 3 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const payload: {
        mensaje: string;
        cursoId?: number | null;
        leccionId?: number | null;
        predicaId?: number | null;
      } = { mensaje: clean };

      if (contexto.startsWith('curso-')) {
        payload.cursoId = Number(contexto.replace('curso-', ''));
        if (defaultLeccionId && payload.cursoId === defaultCursoId) {
          payload.leccionId = defaultLeccionId;
        }
      } else if (contexto.startsWith('predica-')) {
        payload.predicaId = Number(contexto.replace('predica-', ''));
      }

      const res = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al consultar al asistente.');
        return;
      }
      setMessages((prev) => [...prev, data]);
      setInput('');
    } finally {
      setLoading(false);
    }
  };

  const valorar = async (id: number, util: boolean) => {
    const res = await fetch(`/api/ia/interacciones/${id}/valoracion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ util }),
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, util } : m))
      );
      toast.success('¡Gracias por tu valoración!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#A46B29]" />
            <span>Asistente Pedagógico de IA (RAG)</span>
          </h1>
          <p className="text-xs text-[#66584B]">
            Delimitación doctrinal estricta (RN-09 · temperature 0.2): responde
            exclusivamente con lecciones y prédicas cargadas.
          </p>
        </div>

        <select
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          className="px-3.5 py-2 rounded-full border border-[#D6CBB8] bg-white text-xs max-w-full"
        >
          <option value="general">Contexto: Todo el corpus</option>
          {cursos.map((c) => (
            <option key={`c-${c.id}`} value={`curso-${c.id}`}>
              Curso: {c.titulo}
            </option>
          ))}
          {predicas.map((p) => (
            <option key={`p-${p.id}`} value={`predica-${p.id}`}>
              Prédica: {p.titulo}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#241A13] text-white rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-[#D6CBB8]">Consultas sugeridas:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              enviar('¿Qué enseña la lección sobre la suficiencia bíblica?')
            }
            className="px-3 py-1 rounded-full bg-white/10 border border-white/25 hover:bg-[#A46B29] cursor-pointer"
          >
            Suficiencia bíblica
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              enviar('¿Cómo explica la prédica la gracia en 2 Corintios 12?')
            }
            className="px-3 py-1 rounded-full bg-white/10 border border-white/25 hover:bg-[#A46B29] cursor-pointer"
          >
            Gracia en 2 Corintios
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              enviar('¿Cuál será el precio del petróleo en 2029?')
            }
            className="px-3 py-1 rounded-full bg-white/10 border border-white/25 hover:bg-[#A46B29] cursor-pointer"
          >
            Probar fuera de corpus (RN-09)
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E3DACB] rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-sm text-[#66584B]">
              Hacé tu primera pregunta teológica sobre los cursos o prédicas de
              la plataforma.
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-lg bg-[#241A13] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                    <div className="text-[11px] text-[#E9D5B5] mb-0.5">
                      {formatFechaHora(m.fechaHora)}
                    </div>
                    {m.mensajeUsuario}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-xl bg-[#FAF7F1] border border-[#E3DACB] rounded-2xl rounded-tl-sm p-4 space-y-3">
                    <p className="text-sm leading-relaxed text-[#241A13] whitespace-pre-line">
                      {m.respuestaIa}
                    </p>
                    {m.fuentes && m.fuentes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.fuentes.map((f) => (
                          <Link
                            key={`${f.tipo}-${f.id}`}
                            href={f.ruta}
                            className="text-xs px-3 py-1 rounded-full bg-white border border-[#D6CBB8] text-[#7C4F1D] font-medium hover:bg-[#F8EFE2]"
                          >
                            Fuente: {f.titulo}
                          </Link>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E3DACB] text-xs text-[#66584B]">
                      <span>¿Te sirvió esta respuesta?</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => valorar(m.id, true)}
                          className={`px-2.5 py-1 rounded-full border flex items-center gap-1 cursor-pointer ${
                            m.util === true
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-white border-[#D6CBB8]'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Sí</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => valorar(m.id, false)}
                          className={`px-2.5 py-1 rounded-full border flex items-center gap-1 cursor-pointer ${
                            m.util === false
                              ? 'bg-red-50 border-red-300 text-red-800'
                              : 'bg-white border-[#D6CBB8]'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>No</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(input);
          }}
          className="pt-3 border-t border-[#E3DACB] flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Hacé una consulta teológica sobre tus lecciones o prédicas..."
            className="flex-1 px-4 py-2.5 rounded-full border border-[#D6CBB8] text-sm focus:border-[#A46B29] focus:outline-none"
          />
          <Button type="submit" disabled={loading} className="px-5">
            <Send className="w-4 h-4" />
            <span>{loading ? 'Consultando...' : 'Consultar'}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
