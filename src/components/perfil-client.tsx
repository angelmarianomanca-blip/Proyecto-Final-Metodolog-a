'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import type { SessionUser } from '@/lib/auth/session';
import { formatFecha } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/primitives';

export function PerfilClient({
  user,
  congregaciones,
  inscripciones,
}: {
  user: SessionUser;
  congregaciones: Array<{ id: number; nombreSede: string }>;
  inscripciones: Array<{
    id: number;
    cursoId: number;
    cursoTitulo: string;
    estado: string;
    fechaInscripcion: string;
    fechaFinalizacion: string | null;
    codigoCertificado: string | null;
    porcentajeAvance: number;
  }>;
}) {
  const router = useRouter();
  const [nombre, setNombre] = React.useState(user.nombre);
  const [apellido, setApellido] = React.useState(user.apellido);
  const [idCong, setIdCong] = React.useState(
    user.idCongregacion ? String(user.idCongregacion) : ''
  );
  const [savingPerfil, setSavingPerfil] = React.useState(false);

  const [passActual, setPassActual] = React.useState('');
  const [passNueva, setPassNueva] = React.useState('');
  const [savingPass, setSavingPass] = React.useState(false);

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPerfil(true);
    try {
      const res = await fetch('/api/auth/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          idCongregacion: idCong ? Number(idCong) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al actualizar el perfil.');
        return;
      }
      toast.success('Perfil actualizado correctamente.');
      router.refresh();
    } finally {
      setSavingPerfil(false);
    }
  };

  const handleSavePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPass(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contraseniaActual: passActual,
          contraseniaNueva: passNueva,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al cambiar la contraseña.');
        return;
      }
      toast.success('Contraseña actualizada correctamente.');
      setPassActual('');
      setPassNueva('');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">Datos personales</h2>
              <StatusBadge status={user.rol} />
            </div>
            <form onSubmit={handleSavePerfil} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nombre">
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Apellido">
                  <Input
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </FormField>
              </div>
              <FormField label="Correo electrónico">
                <Input value={user.correoElectronico} readOnly disabled />
              </FormField>
              <FormField label="Congregación asociada">
                <Select
                  value={idCong}
                  onChange={(e) => setIdCong(e.target.value)}
                >
                  <option value="">Externo (sin congregación vinculada)</option>
                  {congregaciones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreSede}
                    </option>
                  ))}
                </Select>
              </FormField>
              <Button type="submit" disabled={savingPerfil}>
                {savingPerfil ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="font-bold text-base">
              Seguridad · Cambiar contraseña
            </h2>
            <form onSubmit={handleSavePass} className="space-y-3">
              <FormField label="Contraseña actual">
                <Input
                  type="password"
                  required
                  value={passActual}
                  onChange={(e) => setPassActual(e.target.value)}
                />
              </FormField>
              <FormField label="Nueva contraseña (mín. 8 caracteres)">
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={passNueva}
                  onChange={(e) => setPassNueva(e.target.value)}
                />
              </FormField>
              <Button type="submit" variant="outlineDark" disabled={savingPass}>
                {savingPass ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="text-lg font-bold">Historial de cursos</h2>
          {inscripciones.length === 0 ? (
            <p className="text-sm text-[#66584B]">
              Todavía no te inscribiste a ningún curso.
            </p>
          ) : (
            <div className="divide-y divide-[#E3DACB] text-sm">
              {inscripciones.map((ins) => (
                <div
                  key={ins.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold">{ins.cursoTitulo}</div>
                    <div className="text-xs text-[#66584B]">
                      {ins.estado === 'finalizado'
                        ? `Finalizado el ${formatFecha(ins.fechaFinalizacion)} · Código: ${ins.codigoCertificado}`
                        : `Inscripto el ${formatFecha(ins.fechaInscripcion)} · Avance: ${ins.porcentajeAvance}%`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ins.estado} />
                    {ins.estado === 'finalizado' ? (
                      <a
                        href={`/api/inscripciones/${ins.id}/certificado`}
                        className="px-4 py-1.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#88561D]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Certificado PDF</span>
                      </a>
                    ) : (
                      <Link
                        href={`/aula/${ins.cursoId}`}
                        className="px-4 py-1.5 rounded-full bg-[#241A13] text-white text-xs font-semibold hover:bg-[#A46B29]"
                      >
                        Ir al aula
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
