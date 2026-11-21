'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { ConfirmDialog, Modal } from '@/components/ui/dialog';
import { FormField } from '@/components/primitives';

interface CursoItem {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  profesor: string;
  idProfesor: number;
  totalModulos: number;
  totalLecciones: number;
  totalInscriptos: number;
}

export function GestionCursosClient({
  cursos,
  docentes,
  isAdmin,
}: {
  cursos: CursoItem[];
  docentes: Array<{ id: number; nombre: string; apellido: string }>;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CursoItem | null>(null);
  const [titulo, setTitulo] = React.useState('');
  const [descripcion, setDescripcion] = React.useState('');
  const [idProfesor, setIdProfesor] = React.useState(
    docentes[0] ? String(docentes[0].id) : ''
  );
  const [estado, setEstado] = React.useState('borrador');
  const [saving, setSaving] = React.useState(false);

  const [archiveTarget, setArchiveTarget] = React.useState<CursoItem | null>(
    null
  );

  const openNew = () => {
    setEditing(null);
    setTitulo('');
    setDescripcion('');
    setEstado('borrador');
    setModalOpen(true);
  };

  const openEdit = (c: CursoItem) => {
    setEditing(c);
    setTitulo(c.titulo);
    setDescripcion(c.descripcion);
    setIdProfesor(String(c.idProfesor));
    setEstado(c.estado);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/cursos/${editing.id}` : '/api/cursos';
      const method = editing ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { titulo, descripcion };
      if (isAdmin && idProfesor) body.idProfesor = Number(idProfesor);
      if (editing) body.estado = estado;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'No se pudo guardar el curso.');
        return;
      }
      toast.success(
        editing
          ? 'Curso actualizado correctamente.'
          : 'Curso creado en estado borrador.'
      );
      setModalOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (c: CursoItem) => {
    const res = await fetch(`/api/cursos/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'publicado' }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error?.message ?? 'No se pudo publicar el curso.');
      return;
    }
    toast.success('Curso publicado en el catálogo público.');
    router.refresh();
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    const res = await fetch(`/api/cursos/${archiveTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'archivado' }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error?.message ?? 'No se pudo archivar.');
      return;
    }
    toast.success('Curso archivado correctamente.');
    setArchiveTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" />
          <span>Nuevo curso</span>
        </Button>
      </div>

      <div className="bg-white border border-[#E3DACB] rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#241A13] text-white text-xs">
            <tr>
              <th className="p-4">Curso</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Estructura</th>
              <th className="p-4">Inscriptos</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3DACB]">
            {cursos.map((c) => (
              <tr key={c.id}>
                <td className="p-4">
                  <div className="font-semibold">{c.titulo}</div>
                  <div className="text-xs text-[#66584B]">{c.profesor}</div>
                </td>
                <td className="p-4">
                  <StatusBadge status={c.estado} />
                </td>
                <td className="p-4 text-xs text-[#66584B]">
                  {c.totalModulos} mód. · {c.totalLecciones} lec.
                </td>
                <td className="p-4 text-xs font-semibold">
                  {c.totalInscriptos}
                </td>
                <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(c)}
                  >
                    Editar datos
                  </Button>
                  <Link
                    href={`/gestion/cursos/${c.id}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#241A13] text-white text-xs font-semibold hover:bg-[#A46B29]"
                  >
                    Módulos y lecciones
                  </Link>
                  {c.estado !== 'publicado' ? (
                    <Button
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => handlePublish(c)}
                    >
                      Publicar
                    </Button>
                  ) : (
                    <Button
                      variant="destructiveOutline"
                      size="sm"
                      onClick={() => setArchiveTarget(c)}
                    >
                      Archivar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow="Gestión Académica"
        title={editing ? 'Editar configuración del curso' : 'Crear nuevo curso'}
        subtitle="Cada campo separado y validado con Zod. Todo curso nuevo inicia en borrador."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-[#FAF7F1] border border-[#E3DACB] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#241A13]">
              1. Identidad del Curso
            </div>
            <FormField label="Título del curso *">
              <Input
                required
                minLength={4}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Panorama del Nuevo Testamento"
              />
            </FormField>
            <FormField label="Descripción académica completa *">
              <Textarea
                required
                minLength={10}
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Explicá los objetivos formativos, el enfoque doctrinal y los temas del curso..."
              />
            </FormField>
          </div>

          <div className="bg-[#FAF7F1] border border-[#E3DACB] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#241A13]">
              2. Asignación Docente y Estado
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isAdmin && (
                <FormField label="Profesor / Pastor a cargo">
                  <Select
                    value={idProfesor}
                    onChange={(e) => setIdProfesor(e.target.value)}
                  >
                    {docentes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} {d.apellido}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
              {editing && (
                <FormField
                  label="Estado del curso"
                  hint="Para publicar se requiere al menos 1 módulo con 1 lección activa."
                >
                  <Select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  >
                    <option value="borrador">Borrador</option>
                    <option value="publicado">Publicado</option>
                    <option value="archivado">Archivado</option>
                  </Select>
                </FormField>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#66584B]">
              Todos los cursos son 100% gratuitos.
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar curso'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archivar curso"
        description={`¿Confirmás archivar "${archiveTarget?.titulo ?? ''}"? Dejará de mostrarse en el catálogo público manteniendo el historial de inscriptos.`}
        confirmLabel="Archivar curso"
      />
    </div>
  );
}
