'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatFecha } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/dialog';
import { FormField } from '@/components/primitives';

interface PredicaListItem {
  id: number;
  titulo: string;
  predicador: string;
  fechaPredica: string;
  pasajeBiblico: string;
  urlArchivoAudio: string;
  reproducciones: number;
  tieneTranscripcion: boolean;
}

export function GestionPredicasClient({
  predicas,
}: {
  predicas: PredicaListItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [titulo, setTitulo] = React.useState('');
  const [predicador, setPredicador] = React.useState('');
  const [fechaPredica, setFechaPredica] = React.useState('2026-11-20');
  const [pasajeBiblico, setPasaje] = React.useState('');
  const [urlArchivoAudio, setUrlAudio] = React.useState('');
  const [textoTranscripcion, setTranscripcion] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const openNew = () => {
    setEditingId(null);
    setTitulo('');
    setPredicador('');
    setFechaPredica('2026-11-20');
    setPasaje('');
    setUrlAudio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    setTranscripcion('');
    setOpen(true);
  };

  const openEdit = async (id: number) => {
    const res = await fetch(`/api/predicas/${id}`);
    if (!res.ok) {
      toast.error('No se pudo cargar la prédica.');
      return;
    }
    const p = await res.json();
    setEditingId(p.id);
    setTitulo(p.titulo);
    setPredicador(p.predicador);
    setFechaPredica(p.fechaPredica);
    setPasaje(p.pasajeBiblico);
    setUrlAudio(p.urlArchivoAudio);
    setTranscripcion(p.textoTranscripcion ?? '');
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/predicas/${editingId}` : '/api/predicas';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          predicador,
          fechaPredica,
          pasajeBiblico,
          urlArchivoAudio,
          textoTranscripcion,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al guardar la prédica.');
        return;
      }
      toast.success(
        editingId
          ? 'Prédica y transcripción 1:1 actualizadas.'
          : 'Prédica y transcripción 1:1 creadas correctamente.'
      );
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" />
          <span>Cargar nueva prédica</span>
        </Button>
      </div>

      <div className="bg-white border border-[#E3DACB] rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#241A13] text-white text-xs">
            <tr>
              <th className="p-4">Título / Pasaje</th>
              <th className="p-4">Predicador</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Transcripción 1:1</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3DACB]">
            {predicas.map((p) => (
              <tr key={p.id}>
                <td className="p-4">
                  <div className="font-semibold">{p.titulo}</div>
                  <div className="text-xs text-[#A46B29] font-medium">
                    {p.pasajeBiblico} · {p.reproducciones} reproducciones
                  </div>
                </td>
                <td className="p-4 text-xs">{p.predicador}</td>
                <td className="p-4 text-xs">{formatFecha(p.fechaPredica)}</td>
                <td className="p-4">
                  <StatusBadge
                    status={p.tieneTranscripcion ? 'activo' : 'borrador'}
                    label={p.tieneTranscripcion ? 'Cargada 1:1' : 'Pendiente'}
                  />
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="outlineDark"
                    size="sm"
                    onClick={() => openEdit(p.id)}
                  >
                    Editar audio y texto
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Gestión de Prédicas"
        title={
          editingId
            ? 'Editar Prédica y Transcripción'
            : 'Cargar Nueva Prédica y Transcripción'
        }
        subtitle="Vinculá los metadatos bíblicos, el archivo de audio y la transcripción completa en un solo paso."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-[#FAF7F1] border border-[#E3DACB] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#241A13]">
              1. Metadatos Bíblicos Obligatorios
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Título de la prédica *">
                <Input
                  required
                  minLength={4}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. La suficiencia de la gracia"
                />
              </FormField>
              <FormField label="Pasaje bíblico base *">
                <Input
                  required
                  minLength={3}
                  value={pasajeBiblico}
                  onChange={(e) => setPasaje(e.target.value)}
                  placeholder="Ej. 2 Corintios 12:7-10"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Predicador *">
                <Input
                  required
                  minLength={3}
                  value={predicador}
                  onChange={(e) => setPredicador(e.target.value)}
                  placeholder="Ej. Pr. Marcos Herrera"
                />
              </FormField>
              <FormField label="Fecha de prédica *">
                <Input
                  type="date"
                  required
                  value={fechaPredica}
                  onChange={(e) => setFechaPredica(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <div className="bg-[#FAF7F1] border border-[#E3DACB] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#241A13]">
              2. Recurso de Audio (HTML5)
            </div>
            <FormField label="URL o ruta del archivo de audio (.mp3 / .ogg) *">
              <Input
                required
                minLength={5}
                value={urlArchivoAudio}
                onChange={(e) => setUrlAudio(e.target.value)}
                className="font-mono"
                placeholder="https://..."
              />
            </FormField>
          </div>

          <div className="bg-[#FAF7F1] border border-[#E3DACB] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#241A13]">
                3. Transcripción Completa
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                Indexada para buscador y RAG
              </span>
            </div>
            <Textarea
              required
              minLength={20}
              rows={6}
              value={textoTranscripcion}
              onChange={(e) => setTranscripcion(e.target.value)}
              className="font-serif-editorial leading-relaxed"
              placeholder="Pegá aquí el texto completo de la prédica separado por párrafos..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#66584B]">
              Solo Profesor/Pastor y Administrador pueden gestionar prédicas.
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar prédica y transcripción'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
