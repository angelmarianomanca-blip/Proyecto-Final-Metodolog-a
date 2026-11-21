'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { ConfirmDialog, Modal } from '@/components/ui/dialog';
import { FormField } from '@/components/primitives';

interface CongItem {
  id: number;
  nombreSede: string;
  direccion: string;
  ciudad: string;
  telefonoContacto: string;
  activo: boolean;
  miembrosActivos: number;
}

export function AdminCongregacionesClient({
  congregaciones,
}: {
  congregaciones: CongItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CongItem | null>(null);
  const [nombreSede, setNombre] = React.useState('');
  const [direccion, setDireccion] = React.useState('');
  const [ciudad, setCiudad] = React.useState('');
  const [telefonoContacto, setTel] = React.useState('');
  const [toggleTarget, setToggleTarget] = React.useState<CongItem | null>(null);
  const [saving, setSaving] = React.useState(false);

  const openNew = () => {
    setEditing(null);
    setNombre('');
    setDireccion('');
    setCiudad('');
    setTel('');
    setOpen(true);
  };

  const openEdit = (c: CongItem) => {
    setEditing(c);
    setNombre(c.nombreSede);
    setDireccion(c.direccion);
    setCiudad(c.ciudad);
    setTel(c.telefonoContacto);
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `/api/congregaciones/${editing.id}`
        : '/api/congregaciones';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreSede,
          direccion,
          ciudad,
          telefonoContacto,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al guardar congregación.');
        return;
      }
      toast.success(editing ? 'Sede actualizada.' : 'Sede creada.');
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    const res = await fetch(`/api/congregaciones/${toggleTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !toggleTarget.activo }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error?.message ?? 'No se pudo cambiar el estado.');
      setToggleTarget(null);
      return;
    }
    toast.success(
      toggleTarget.activo ? 'Sede dada de baja lógicamente.' : 'Sede reactivada.'
    );
    setToggleTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" />
          <span>Nueva sede</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {congregaciones.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-[#E3DACB] rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-base">{c.nombreSede}</h2>
                <p className="text-xs text-[#66584B]">
                  {c.direccion} · {c.ciudad}
                </p>
              </div>
              <StatusBadge status={c.activo ? 'activo' : 'inactivo'} />
            </div>
            <div className="text-xs text-[#66584B] flex justify-between pt-2 border-t border-[#E3DACB]">
              <span>Tel: {c.telefonoContacto}</span>
              <strong>{c.miembrosActivos} usuarios activos</strong>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                Editar
              </Button>
              <Button
                variant={c.activo ? 'destructiveOutline' : 'outline'}
                size="sm"
                onClick={() => setToggleTarget(c)}
              >
                {c.activo ? 'Dar de baja' : 'Reactivar'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Administración"
        title={editing ? 'Editar congregación' : 'Nueva congregación / sede'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Nombre de la sede *">
            <Input
              required
              value={nombreSede}
              onChange={(e) => setNombre(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Dirección *">
              <Input
                required
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </FormField>
            <FormField label="Ciudad *">
              <Input
                required
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Teléfono de contacto *">
            <Input
              required
              value={telefonoContacto}
              onChange={(e) => setTel(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              Guardar sede
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        title={toggleTarget?.activo ? 'Dar de baja sede' : 'Reactivar sede'}
        description="Si la sede posee usuarios activos vinculados, no se podrá dar de baja hasta reasignarlos."
      />
    </div>
  );
}
