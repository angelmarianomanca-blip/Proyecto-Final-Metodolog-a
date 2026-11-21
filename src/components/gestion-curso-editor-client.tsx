'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { ConfirmDialog, Modal } from '@/components/ui/dialog';
import { FormField } from '@/components/primitives';

interface LeccionItem {
  id: number;
  moduloId: number;
  titulo: string;
  ordenSecuencia: number;
  contenidoTexto: string;
  enlaceVideo: string | null;
  archivoPdf: string | null;
  activo: boolean;
}

interface ModuloItem {
  id: number;
  titulo: string;
  ordenSecuencia: number;
  lecciones: LeccionItem[];
}

export function GestionCursoEditorClient({
  curso,
}: {
  curso: {
    id: number;
    titulo: string;
    estado: string;
    modulos: ModuloItem[];
  };
}) {
  const router = useRouter();
  const [modModal, setModModal] = React.useState(false);
  const [modTitulo, setModTitulo] = React.useState('');

  const [lecModal, setLecModal] = React.useState(false);
  const [lecModuloId, setLecModuloId] = React.useState<number>(0);
  const [editingLec, setEditingLec] = React.useState<LeccionItem | null>(null);
  const [lecTitulo, setLecTitulo] = React.useState('');
  const [lecTexto, setLecTexto] = React.useState('');
  const [lecVideo, setLecVideo] = React.useState('');
  const [lecPdf, setLecPdf] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const [toggleTarget, setToggleTarget] = React.useState<LeccionItem | null>(
    null
  );

  const handleCrearModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/cursos/${curso.id}/modulos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: modTitulo }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al crear módulo.');
        return;
      }
      toast.success('Módulo agregado al curso.');
      setModTitulo('');
      setModModal(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const moverModulo = async (m: ModuloItem, delta: number) => {
    const nextOrden = Math.max(1, m.ordenSecuencia + delta);
    const res = await fetch(`/api/modulos/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordenSecuencia: nextOrden }),
    });
    if (res.ok) {
      toast.success('Orden de módulo actualizado.');
      router.refresh();
    }
  };

  const openNewLeccion = (moduloId: number) => {
    setEditingLec(null);
    setLecModuloId(moduloId);
    setLecTitulo('');
    setLecTexto('');
    setLecVideo('');
    setLecPdf('');
    setLecModal(true);
  };

  const openEditLeccion = (l: LeccionItem) => {
    setEditingLec(l);
    setLecModuloId(l.moduloId);
    setLecTitulo(l.titulo);
    setLecTexto(l.contenidoTexto);
    setLecVideo(l.enlaceVideo ?? '');
    setLecPdf(l.archivoPdf ?? '');
    setLecModal(true);
  };

  const handleSaveLeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingLec
        ? `/api/lecciones/${editingLec.id}`
        : `/api/modulos/${lecModuloId}/lecciones`;
      const method = editingLec ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: lecTitulo,
          contenidoTexto: lecTexto,
          enlaceVideo: lecVideo || null,
          archivoPdf: lecPdf || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al guardar lección.');
        return;
      }
      toast.success(editingLec ? 'Lección actualizada.' : 'Lección creada.');
      setLecModal(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLeccion = async () => {
    if (!toggleTarget) return;
    const res = await fetch(`/api/lecciones/${toggleTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !toggleTarget.activo }),
    });
    if (res.ok) {
      toast.success(
        toggleTarget.activo ? 'Lección desactivada (RN-13).' : 'Lección reactivada.'
      );
      setToggleTarget(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={curso.estado} />
        <Button onClick={() => setModModal(true)}>
          <Plus className="w-4 h-4" />
          <span>Nuevo módulo</span>
        </Button>
      </div>

      {curso.modulos.length === 0 ? (
        <div className="bg-white border border-dashed border-[#D6CBB8] rounded-2xl p-8 text-center text-sm text-[#66584B]">
          Este curso aún no tiene módulos. Agregá el primero para comenzar a
          cargar lecciones.
        </div>
      ) : (
        curso.modulos.map((m) => (
          <div
            key={m.id}
            className="bg-white border border-[#E3DACB] rounded-2xl overflow-hidden"
          >
            <div className="px-5 py-3.5 bg-[#241A13] text-white flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-mono">
                  Orden {m.ordenSecuencia}
                </span>
                <span className="font-semibold text-sm">{m.titulo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" onClick={() => openNewLeccion(m.id)}>
                  + Lección
                </Button>
                <button
                  type="button"
                  onClick={() => moverModulo(m, -1)}
                  className="p-1.5 rounded-full border border-white/25 text-white hover:bg-white/10 cursor-pointer"
                  title="Subir orden"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moverModulo(m, 1)}
                  className="p-1.5 rounded-full border border-white/25 text-white hover:bg-white/10 cursor-pointer"
                  title="Bajar orden"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#E3DACB]">
              {m.lecciones.length === 0 ? (
                <div className="px-5 py-4 text-xs text-[#66584B]">
                  Sin lecciones en este módulo todavía.
                </div>
              ) : (
                m.lecciones.map((l) => (
                  <div
                    key={l.id}
                    className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#66584B]">
                        #{l.ordenSecuencia}
                      </span>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <span>{l.titulo}</span>
                          {!l.activo && <StatusBadge status="inactivo" />}
                        </div>
                        <div className="text-xs text-[#66584B]">
                          {l.enlaceVideo ? 'Video embebido' : 'Solo texto'} ·{' '}
                          {l.archivoPdf ? 'Con guía PDF' : 'Sin PDF'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditLeccion(l)}
                      >
                        Editar material
                      </Button>
                      <Button
                        variant={l.activo ? 'destructiveOutline' : 'outline'}
                        size="sm"
                        onClick={() => setToggleTarget(l)}
                      >
                        {l.activo ? 'Desactivar' : 'Reactivar'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}

      <Modal
        open={modModal}
        onClose={() => setModModal(false)}
        title="Agregar módulo al curso"
      >
        <form onSubmit={handleCrearModulo} className="space-y-4">
          <FormField label="Título del módulo *">
            <Input
              required
              minLength={3}
              value={modTitulo}
              onChange={(e) => setModTitulo(e.target.value)}
              placeholder="Ej. Módulo 4 · Escatología y Esperanza"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              Crear módulo
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={lecModal}
        onClose={() => setLecModal(false)}
        eyebrow="Material Didáctico · RF-06"
        title={editingLec ? 'Editar lección' : 'Nueva lección'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveLeccion} className="space-y-4">
          <FormField label="Título de la lección *">
            <Input
              required
              minLength={3}
              value={lecTitulo}
              onChange={(e) => setLecTitulo(e.target.value)}
              placeholder="Ej. 1.4 Aplicación práctica de la doctrina"
            />
          </FormField>
          <FormField
            label="Enlace de video externo (YouTube o Vimeo)"
            hint="Validado en servidor para embebido seguro (RF-06)."
          >
            <Input
              type="url"
              value={lecVideo}
              onChange={(e) => setLecVideo(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </FormField>
          <FormField label="URL o ruta de guía PDF descargable">
            <Input
              value={lecPdf}
              onChange={(e) => setLecPdf(e.target.value)}
              placeholder="/guias/leccion-guia.pdf"
            />
          </FormField>
          <FormField label="Contenido explicativo en texto *">
            <Textarea
              required
              minLength={10}
              rows={5}
              value={lecTexto}
              onChange={(e) => setLecTexto(e.target.value)}
              className="font-serif-editorial"
              placeholder="Redactá el desarrollo de la clase (también indexado para el Asistente Pedagógico IA)..."
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLecModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar lección'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleLeccion}
        title={toggleTarget?.activo ? 'Desactivar lección' : 'Reactivar lección'}
        description="Según RN-13, las lecciones se desactivan lógicamente para preservar la integridad del progreso académico."
      />
    </div>
  );
}
