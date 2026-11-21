'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { RolNombre } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { ConfirmDialog, Modal } from '@/components/ui/dialog';
import { FormField } from '@/components/primitives';

interface UserRow {
  id: number;
  nombre: string;
  apellido: string;
  correoElectronico: string;
  rol: RolNombre;
  idCongregacion: number | null;
  nombreCongregacion: string | null;
  activo: boolean;
}

export function AdminUsuariosClient({
  currentAdminId,
  usuarios,
  congregaciones,
}: {
  currentAdminId: number;
  usuarios: UserRow[];
  congregaciones: Array<{ id: number; nombreSede: string }>;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [nombre, setNombre] = React.useState('');
  const [apellido, setApellido] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rol, setRol] = React.useState<RolNombre>('alumno');
  const [idCong, setIdCong] = React.useState('');

  const [resetTarget, setResetTarget] = React.useState<UserRow | null>(null);
  const [newPass, setNewPass] = React.useState('');
  const [toggleTarget, setToggleTarget] = React.useState<UserRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          correoElectronico: email,
          contrasenia: password,
          rol,
          idCongregacion: idCong ? Number(idCong) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al crear usuario.');
        return;
      }
      toast.success('Usuario creado correctamente.');
      setCreateOpen(false);
      setNombre('');
      setApellido('');
      setEmail('');
      setPassword('');
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (u: UserRow, nextRol: RolNombre) => {
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: nextRol }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error?.message ?? 'No se pudo cambiar el rol.');
      return;
    }
    toast.success(`Rol de ${u.nombre} actualizado a ${nextRol}.`);
    router.refresh();
  };

  const handleToggleActivo = async () => {
    if (!toggleTarget) return;
    const res = await fetch(`/api/usuarios/${toggleTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !toggleTarget.activo }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error?.message ?? 'No se pudo cambiar el estado.');
      return;
    }
    toast.success(
      toggleTarget.activo ? 'Usuario desactivado.' : 'Usuario reactivado.'
    );
    setToggleTarget(null);
    router.refresh();
  };

  const handleResetPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    const res = await fetch(`/api/usuarios/${resetTarget.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contraseniaNueva: newPass }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error?.message ?? 'Error al restablecer clave.');
      return;
    }
    toast.success('Contraseña restablecida correctamente.');
    setResetTarget(null);
    setNewPass('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Nuevo usuario</span>
        </Button>
      </div>

      <div className="bg-white border border-[#E3DACB] rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#241A13] text-white text-xs">
            <tr>
              <th className="p-4">Usuario</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Congregación</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3DACB]">
            {usuarios.map((u) => {
              const isSelf = u.id === currentAdminId;
              return (
                <tr key={u.id}>
                  <td className="p-4">
                    <div className="font-semibold">
                      {u.nombre} {u.apellido}
                    </div>
                    <div className="text-xs text-[#66584B]">
                      {u.correoElectronico}
                    </div>
                  </td>
                  <td className="p-4">
                    {isSelf ? (
                      <StatusBadge status={u.rol} />
                    ) : (
                      <select
                        value={u.rol}
                        onChange={(e) =>
                          handleRoleChange(u, e.target.value as RolNombre)
                        }
                        className="px-2.5 py-1 rounded-full border border-[#D6CBB8] text-xs bg-white"
                      >
                        <option value="alumno">Alumno</option>
                        <option value="profesor">Profesor / Pastor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    )}
                  </td>
                  <td className="p-4 text-xs">
                    {u.nombreCongregacion ?? 'Externo'}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={u.activo ? 'activo' : 'inactivo'} />
                  </td>
                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResetTarget(u)}
                    >
                      Reset clave
                    </Button>
                    {isSelf ? (
                      <span className="text-xs text-[#66584B] px-2">
                        Protegido (RN-02)
                      </span>
                    ) : (
                      <Button
                        variant={u.activo ? 'destructiveOutline' : 'outline'}
                        size="sm"
                        onClick={() => setToggleTarget(u)}
                      >
                        {u.activo ? 'Desactivar' : 'Reactivar'}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        eyebrow="Administración · RF-03"
        title="Alta de nuevo usuario"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nombre *">
              <Input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </FormField>
            <FormField label="Apellido *">
              <Input
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Correo electrónico *">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Rol *">
              <Select
                value={rol}
                onChange={(e) => setRol(e.target.value as RolNombre)}
              >
                <option value="alumno">Alumno</option>
                <option value="profesor">Profesor / Pastor</option>
                <option value="admin">Administrador</option>
              </Select>
            </FormField>
            <FormField label="Congregación">
              <Select
                value={idCong}
                onChange={(e) => setIdCong(e.target.value)}
              >
                <option value="">Externo</option>
                {congregaciones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreSede}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label="Contraseña inicial (mín. 8 caracteres) *">
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              Crear usuario
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={`Restablecer contraseña · ${resetTarget?.nombre ?? ''}`}
      >
        <form onSubmit={handleResetPass} className="space-y-4">
          <FormField label="Nueva contraseña (mín. 8 caracteres) *">
            <Input
              type="password"
              required
              minLength={8}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar nueva clave</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleActivo}
        title={toggleTarget?.activo ? 'Desactivar usuario' : 'Reactivar usuario'}
        description="Un usuario desactivado no podrá iniciar sesión ni usar sesiones activas previas (RF-03, RN-13)."
      />
    </div>
  );
}
