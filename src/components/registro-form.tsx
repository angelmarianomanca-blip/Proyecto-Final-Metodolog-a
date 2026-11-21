'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { registroSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { FormField } from '@/components/primitives';

export function RegistroForm({
  congregaciones,
}: {
  congregaciones: Array<{ id: number; nombreSede: string; ciudad: string }>;
}) {
  const router = useRouter();
  const [nombre, setNombre] = React.useState('');
  const [apellido, setApellido] = React.useState('');
  const [correoElectronico, setCorreo] = React.useState('');
  const [contrasenia, setContrasenia] = React.useState('');
  const [idCongregacion, setIdCong] = React.useState<string>('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre,
      apellido,
      correoElectronico,
      contrasenia,
      idCongregacion: idCongregacion ? Number(idCongregacion) : null,
    };

    const parsed = registroSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErr: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        nextErr[String(i.path[0] ?? 'general')] = i.message;
      }
      setErrors(nextErr);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'No se pudo completar el registro.');
        return;
      }
      toast.success('¡Cuenta creada con éxito! Ahora podés iniciar sesión.');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Nombre *" error={errors.nombre}>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Lucía"
          />
        </FormField>
        <FormField label="Apellido *" error={errors.apellido}>
          <Input
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            placeholder="Ej. Fernández"
          />
        </FormField>
      </div>

      <FormField
        label="Correo electrónico único *"
        error={errors.correoElectronico}
      >
        <Input
          type="email"
          value={correoElectronico}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="nombre@correo.com"
        />
      </FormField>

      <FormField
        label="Congregación / Pertenencia *"
        hint="Elegí tu sede o marcá Externo si no pertenecés a una congregación vinculada."
      >
        <Select
          value={idCongregacion}
          onChange={(e) => setIdCong(e.target.value)}
        >
          <option value="">Soy Externo (sin congregación vinculada)</option>
          {congregaciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombreSede} ({c.ciudad})
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="Contraseña (mín. 8 caracteres) *"
        error={errors.contrasenia}
      >
        <Input
          type="password"
          value={contrasenia}
          onChange={(e) => setContrasenia(e.target.value)}
          placeholder="••••••••"
        />
      </FormField>

      <Button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 uppercase tracking-wider"
      >
        {loading ? 'Creando cuenta...' : 'Registrarme'}
      </Button>

      <p className="text-xs text-center text-[#66584B]">
        ¿Ya tenés cuenta?{' '}
        <Link
          href="/login"
          className="text-[#A46B29] font-semibold hover:underline"
        >
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
