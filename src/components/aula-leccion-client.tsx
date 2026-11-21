'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  Check,
  Download,
  FileText,
  MessageSquare,
  Play,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatSegundos, toVideoEmbedUrl } from '@/lib/format';
import { Button } from '@/components/ui/button';

export function AulaLeccionClient({
  curso,
  leccionActual,
  inscripcion,
}: {
  curso: {
    id: number;
    titulo: string;
    modulos: Array<{
      id: number;
      titulo: string;
      lecciones: Array<{
        id: number;
        titulo: string;
        contenidoTexto: string;
        enlaceVideo: string | null;
        archivoPdf: string | null;
      }>;
    }>;
  };
  leccionActual: {
    id: number;
    titulo: string;
    contenidoTexto: string;
    enlaceVideo: string | null;
    archivoPdf: string | null;
  };
  inscripcion: {
    id: number;
    estado: string;
    porcentajeAvance: number;
    codigoCertificado: string | null;
    progreso: Array<{
      leccionId: number;
      completada: boolean;
      segundoActual: number;
    }>;
  };
}) {
  const router = useRouter();
  const currentProg = inscripcion.progreso.find(
    (p) => p.leccionId === leccionActual.id
  );
  const [completada, setCompletada] = React.useState(
    currentProg?.completada ?? false
  );
  const [segundoActual, setSegundoActual] = React.useState(
    currentProg?.segundoActual ?? 0
  );
  const [porcentaje, setPorcentaje] = React.useState(
    inscripcion.porcentajeAvance
  );
  const [estadoIns, setEstadoIns] = React.useState(inscripcion.estado);
  const [saving, setSaving] = React.useState(false);

  const progMap = new Map(inscripcion.progreso.map((p) => [p.leccionId, p]));
  const embedUrl = toVideoEmbedUrl(leccionActual.enlaceVideo);

  const saveProgress = async (payload: {
    completada?: boolean;
    segundoActual?: number;
  }) => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/inscripciones/${inscripcion.id}/progreso/${leccionActual.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al guardar progreso.');
        return;
      }
      setCompletada(data.completada);
      setSegundoActual(data.segundoActual);
      setPorcentaje(data.porcentajeAvance);
      setEstadoIns(data.estadoInscripcion);
      if (data.porcentajeAvance === 100) {
        toast.success(
          `¡100% completado! Certificado ${data.codigoCertificado} listo para descargar.`
        );
      } else {
        toast.success(`Avance guardado (${data.porcentajeAvance}%).`);
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#241A13] text-white rounded-2xl px-5 py-3.5">
        <div>
          <Link
            href={`/aula/${curso.id}`}
            className="text-xs text-[#E9D5B5] hover:underline"
          >
            {curso.titulo}
          </Link>
          <div className="text-sm font-bold">
            Progreso general: {porcentaje}%
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-[#D4A366] transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          {estadoIns === 'finalizado' && (
            <a
              href={`/api/inscripciones/${inscripcion.id}/certificado`}
              className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 hover:bg-emerald-700"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Certificado PDF</span>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          {embedUrl ? (
            <div className="bg-[#1C140E] rounded-2xl overflow-hidden border border-[#E3DACB] space-y-0">
              <div className="aspect-video w-full">
                <iframe
                  src={`${embedUrl}?start=${segundoActual}`}
                  title={leccionActual.titulo}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="px-4 py-2.5 bg-[#241A13] text-white flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[#E9D5B5]">
                  Punto guardado: {formatSegundos(segundoActual)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      saveProgress({ segundoActual: segundoActual + 120 })
                    }
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
                  >
                    Guardar avance (+2 min)
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      saveProgress({
                        completada: true,
                        segundoActual: Math.max(segundoActual, 1100),
                      })
                    }
                    className="px-3 py-1 rounded-full bg-[#A46B29] hover:bg-[#88561D] cursor-pointer"
                  >
                    Completar (&gt;90%)
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="bg-white border border-[#E3DACB] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E3DACB]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#A46B29]">
                  Lección activa
                </span>
                <h1 className="text-2xl font-bold mt-0.5">
                  {leccionActual.titulo}
                </h1>
              </div>
              <Button
                disabled={saving}
                variant={completada ? 'outline' : 'default'}
                onClick={() => saveProgress({ completada: !completada })}
                className={
                  completada
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : ''
                }
              >
                <Check className="w-4 h-4" />
                <span>
                  {completada
                    ? 'Lección completada ✓'
                    : 'Marcar como completada'}
                </span>
              </Button>
            </div>

            <div className="font-serif-editorial text-base leading-loose text-[#2D221A] whitespace-pre-line">
              {leccionActual.contenidoTexto}
            </div>

            {leccionActual.archivoPdf && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#FAF7F1] border border-[#E3DACB]">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-full bg-white border border-[#E3DACB] text-[#A46B29]">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">
                      Guía de Estudio Descargable (PDF)
                    </div>
                    <div className="text-xs text-[#66584B]">
                      {leccionActual.archivoPdf}
                    </div>
                  </div>
                </div>
                <a
                  href={leccionActual.archivoPdf}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-full border border-[#241A13] bg-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#241A13] hover:text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Abrir PDF</span>
                </a>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E3DACB]">
              <Link
                href={`/asistente?cursoId=${curso.id}&leccionId=${leccionActual.id}`}
                className="px-4 py-2 rounded-full bg-[#F8EFE2] border border-[#E4CCA8] text-[#7C4F1D] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#F1E2CA]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Preguntar a IA sobre esta lección</span>
              </Link>
              <Link
                href={`/foros?cursoId=${curso.id}`}
                className="px-4 py-2 rounded-full border border-[#D6CBB8] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#FAF7F1]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ir al foro de este curso</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#E3DACB] rounded-2xl p-4 space-y-3">
            <h2 className="font-bold text-sm">Contenido del curso</h2>
            {curso.modulos.map((m) => (
              <div key={m.id} className="space-y-1">
                <div className="text-xs font-semibold text-[#66584B] pt-1">
                  {m.titulo}
                </div>
                {m.lecciones.map((l) => {
                  const active = l.id === leccionActual.id;
                  const done =
                    active ? completada : (progMap.get(l.id)?.completada ?? false);
                  return (
                    <Link
                      key={l.id}
                      href={`/aula/${curso.id}/lecciones/${l.id}`}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                        active
                          ? 'bg-[#241A13] text-white'
                          : 'hover:bg-[#FAF7F1] text-[#241A13]'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className={
                            done
                              ? active
                                ? 'text-emerald-400'
                                : 'text-emerald-700'
                              : 'opacity-60'
                          }
                        >
                          {done ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <span className="truncate">{l.titulo}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
