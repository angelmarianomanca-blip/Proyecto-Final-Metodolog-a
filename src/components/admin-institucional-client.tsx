'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatFecha } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';

interface BloqueItem {
  id: number;
  titulo: string;
  tipo: string;
  contenido: string;
  fechaActualizacion: string;
  actualizadoPor: string;
}

export function AdminInstitucionalClient({
  bloques,
}: {
  bloques: BloqueItem[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = React.useState<
    Record<number, { titulo: string; contenido: string }>
  >(() =>
    Object.fromEntries(
      bloques.map((b) => [b.id, { titulo: b.titulo, contenido: b.contenido }])
    )
  );
  const [savingId, setSavingId] = React.useState<number | null>(null);

  const handleSave = async (id: number) => {
    const d = drafts[id];
    if (!d) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/institucional/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: d.titulo, contenido: d.contenido }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al guardar bloque.');
        return;
      }
      toast.success('Bloque doctrinal actualizado y publicado.');
      router.refresh();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {bloques.map((b) => {
        const d = drafts[b.id] ?? { titulo: b.titulo, contenido: b.contenido };
        return (
          <div
            key={b.id}
            className="bg-white border border-[#E3DACB] rounded-2xl p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-[#A46B29] font-semibold">
                tipo: {b.tipo}
              </span>
              <span className="text-xs text-[#66584B]">
                Última actualización: {formatFecha(b.fechaActualizacion)} por{' '}
                {b.actualizadoPor}
              </span>
            </div>
            <Input
              value={d.titulo}
              onChange={(e) =>
                setDrafts((prev) => ({
                  ...prev,
                  [b.id]: { ...d, titulo: e.target.value },
                }))
              }
            />
            <Textarea
              rows={4}
              value={d.contenido}
              onChange={(e) =>
                setDrafts((prev) => ({
                  ...prev,
                  [b.id]: { ...d, contenido: e.target.value },
                }))
              }
              className="font-serif-editorial"
            />
            <div className="flex justify-end">
              <Button
                variant="dark"
                disabled={savingId === b.id}
                onClick={() => handleSave(b.id)}
              >
                {savingId === b.id ? 'Guardando...' : 'Guardar bloque'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
