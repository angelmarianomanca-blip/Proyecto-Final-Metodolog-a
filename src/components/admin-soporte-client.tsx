'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIAS_SOPORTE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { ConfirmDialog, Modal } from '@/components/ui/dialog';
import { FormField } from '@/components/primitives';

interface SoporteItem {
  id: number;
  pregunta: string;
  respuesta: string;
  categoria: string;
  rutaSugerida: string | null;
}

export function AdminSoporteClient({ items }: { items: SoporteItem[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SoporteItem | null>(null);
  const [categoria, setCategoria] = React.useState<string>(CATEGORIAS_SOPORTE[0]);
  const [pregunta, setPregunta] = React.useState('');
  const [respuesta, setRespuesta] = React.useState('');
  const [rutaSugerida, setRuta] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<SoporteItem | null>(
    null
  );
  const [saving, setSaving] = React.useState(false);

  const openNew = () => {
    setEditing(null);
    setCategoria(CATEGORIAS_SOPORTE[0]);
    setPregunta('');
    setRespuesta('');
    setRuta('/cursos');
    setOpen(true);
  };

  const openEdit = (item: SoporteItem) => {
    setEditing(item);
    setCategoria(item.categoria);
    setPregunta(item.pregunta);
    setRespuesta(item.respuesta);
    setRuta(item.rutaSugerida ?? '');
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/soporte/${editing.id}` : '/api/soporte';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria,
          pregunta,
          respuesta,
          rutaSugerida: rutaSugerida || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al guardar entrada.');
        return;
      }
      toast.success(editing ? 'Entrada actualizada.' : 'Entrada creada.');
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/soporte/${deleteTarget.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      toast.success('Entrada eliminada de la base del Bot Guía.');
      setDeleteTarget(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" />
          <span>Nueva pregunta frecuente</span>
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <div
            key={s.id}
            className="bg-white border border-[#E3DACB] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#F8EFE2] text-[#7C4F1D] text-xs font-semibold">
                  {s.categoria}
                </span>
                {s.rutaSugerida && (
                  <code className="text-xs font-mono text-[#241A13]">
                    {s.rutaSugerida}
                  </code>
                )}
              </div>
              <div className="font-semibold text-sm">{s.pregunta}</div>
              <p className="text-xs text-[#66584B] whitespace-pre-line">
                {s.respuesta}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                Editar
              </Button>
              <Button
                variant="destructiveOutline"
                size="sm"
                onClick={() => setDeleteTarget(s)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Bot Guía · RF-15"
        title={editing ? 'Editar pregunta frecuente' : 'Nueva pregunta frecuente'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Categoría *">
              <Select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS_SOPORTE.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Ruta sugerida (opcional)">
              <Input
                value={rutaSugerida}
                onChange={(e) => setRuta(e.target.value)}
                placeholder="/cursos"
                className="font-mono"
              />
            </FormField>
          </div>
          <FormField label="Pregunta *">
            <Input
              required
              minLength={5}
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
            />
          </FormField>
          <FormField label="Respuesta paso a paso *">
            <Textarea
              required
              minLength={10}
              rows={4}
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              Guardar entrada
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar entrada del Bot Guía"
        description={`¿Confirmás eliminar "${deleteTarget?.pregunta ?? ''}"?`}
      />
    </div>
  );
}
