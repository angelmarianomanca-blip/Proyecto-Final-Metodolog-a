'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/dialog';
import { FormField } from '@/components/primitives';

export function NuevaConsultaForoButton({
  cursos,
}: {
  cursos: Array<{ id: number; titulo: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [cursoId, setCursoId] = React.useState(
    cursos[0] ? String(cursos[0].id) : ''
  );
  const [tituloConsulta, setTitulo] = React.useState('');
  const [mensajePregunta, setMensaje] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/foros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoId: Number(cursoId),
          tituloConsulta,
          mensajePregunta,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al publicar consulta.');
        return;
      }
      toast.success('Consulta publicada en el foro.');
      setOpen(false);
      setTitulo('');
      setMensaje('');
      router.push(`/foros/${data.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        <span>Nueva consulta</span>
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Foros Temáticos"
        title="Publicar nueva consulta"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Curso relacionado *">
            <Select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              required
            >
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Título de la consulta *">
            <Input
              required
              minLength={5}
              value={tituloConsulta}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. ¿Cómo interpretar la metáfora en Romanos 6?"
            />
          </FormField>
          <FormField label="Mensaje o pregunta detallada *">
            <Textarea
              required
              minLength={10}
              rows={4}
              value={mensajePregunta}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Describí tu duda con claridad para que profesores y compañeros puedan ayudarte..."
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Publicando...' : 'Publicar consulta'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
